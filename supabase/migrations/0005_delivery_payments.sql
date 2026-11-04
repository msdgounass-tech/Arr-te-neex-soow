-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Livraison selon la position du client,
--  paiement par lien marchand (Wave) avec vérification manuelle,
--  administrateur initial.
-- ════════════════════════════════════════════════════════════════

-- ── Modes de tarification de la livraison ───────────────────────
--  fixed    : tarif fixe de la zone
--  distance : tarif de base + prix au km depuis le point de départ (position GPS du client)
--  quote    : tarif communiqué au client après la commande (« à confirmer »)
create type public.delivery_fee_mode as enum ('fixed', 'distance', 'quote');

alter table public.delivery_zones
  add column fee_mode public.delivery_fee_mode not null default 'quote',
  add column per_km_fee int not null default 0 check (per_km_fee >= 0),
  add column max_km int check (max_km is null or max_km > 0);

alter table public.orders
  add column delivery_lat double precision,
  add column delivery_lng double precision,
  add column delivery_km numeric(7, 1),
  add column delivery_fee_pending boolean not null default false;

-- ── Distance (km) entre deux points GPS, majorée d'un coefficient routier ──
create or replace function public.road_distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision, factor numeric default 1.3)
returns numeric
language sql immutable as $$
  select round((6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  )) * factor)::numeric, 1)
$$;

-- ── Calcul des frais de livraison (utilisé par place_order et l'aperçu) ──
create or replace function public.compute_delivery_fee(p_zone_id uuid, p_amount int, p_lat double precision, p_lng double precision)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  z public.delivery_zones;
  cfg jsonb;
  km numeric;
  fee int;
begin
  select * into z from public.delivery_zones where id = p_zone_id and is_active;
  if not found then
    raise exception 'ZONE_INVALIDE';
  end if;

  if z.free_above is not null and p_amount >= z.free_above then
    return jsonb_build_object('fee', 0, 'pending', false, 'km', null, 'free', true);
  end if;

  if z.fee_mode = 'quote' then
    return jsonb_build_object('fee', 0, 'pending', true, 'km', null, 'free', false);
  end if;

  if z.fee_mode = 'fixed' then
    return jsonb_build_object('fee', z.fee, 'pending', false, 'km', null, 'free', false);
  end if;

  -- distance
  select value into cfg from public.settings where key = 'delivery';
  if p_lat is null or p_lng is null or cfg is null
     or nullif(cfg ->> 'origin_lat', '') is null or nullif(cfg ->> 'origin_lng', '') is null then
    raise exception 'POSITION_REQUISE';
  end if;
  km := public.road_distance_km((cfg ->> 'origin_lat')::double precision, (cfg ->> 'origin_lng')::double precision,
                                p_lat, p_lng, coalesce(nullif(cfg ->> 'road_factor', '')::numeric, 1.3));
  if z.max_km is not null and km > z.max_km then
    raise exception 'HORS_ZONE';
  end if;
  fee := z.fee + (ceil(km * z.per_km_fee / 100.0) * 100)::int;
  return jsonb_build_object('fee', fee, 'pending', false, 'km', km, 'free', false);
end $$;

grant execute on function public.compute_delivery_fee(uuid, int, double precision, double precision) to anon, authenticated, service_role;

-- ── place_order : version avec livraison géolocalisée ───────────
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_zone public.delivery_zones;
  v_coupon public.coupons;
  v_subtotal int := 0;
  v_discount int := 0;
  v_fee int := 0;
  v_delivery jsonb;
  v_total int;
  v_order_id uuid;
  v_number text;
  v_token uuid;
  v_payment_id uuid;
  v_lines jsonb := '[]'::jsonb;
  v_image text;
  v_method public.payment_method;
  v_lat double precision := nullif(p ->> 'lat', '')::double precision;
  v_lng double precision := nullif(p ->> 'lng', '')::double precision;
begin
  if jsonb_typeof(p -> 'items') is distinct from 'array' or jsonb_array_length(p -> 'items') = 0 then
    raise exception 'PANIER_VIDE';
  end if;
  if jsonb_array_length(p -> 'items') > 50 then
    raise exception 'PANIER_TROP_GRAND';
  end if;
  if v_lat is not null and (v_lat not between -90 and 90 or v_lng is null or v_lng not between -180 and 180) then
    raise exception 'POSITION_INVALIDE';
  end if;

  v_method := (p ->> 'payment_method')::public.payment_method;

  select * into v_zone from public.delivery_zones where id = (p ->> 'zone_id')::uuid and is_active;
  if not found then
    raise exception 'ZONE_INVALIDE';
  end if;

  for r in
    select x.variant_id, sum(x.quantity)::int as quantity
    from jsonb_to_recordset(p -> 'items') as x(variant_id uuid, quantity int)
    group by x.variant_id
  loop
    if r.quantity is null or r.quantity < 1 or r.quantity > 99 then
      raise exception 'QUANTITE_INVALIDE';
    end if;

    perform 1 from public.inventory where variant_id = r.variant_id for update;

    declare
      v record;
    begin
      select pv.id, pv.sku, pv.size, pv.color, pv.product_id,
             coalesce(pv.price_override, pr.price) as price,
             pr.name, pr.reference, coalesce(i.quantity, 0) as stock
        into v
        from public.product_variants pv
        join public.products pr on pr.id = pv.product_id
        left join public.inventory i on i.variant_id = pv.id
       where pv.id = r.variant_id and pv.is_active and pr.is_active;

      if not found then
        raise exception 'PRODUIT_INDISPONIBLE';
      end if;
      if v.stock < r.quantity then
        raise exception 'STOCK_INSUFFISANT:%', v.name;
      end if;

      select url into v_image from public.product_images where product_id = v.product_id order by position limit 1;

      v_subtotal := v_subtotal + v.price * r.quantity;
      v_lines := v_lines || jsonb_build_object(
        'product_id', v.product_id, 'variant_id', v.id, 'product_name', v.name, 'reference', v.reference,
        'sku', v.sku, 'size', v.size, 'color', v.color, 'image_url', v_image,
        'unit_price', v.price, 'quantity', r.quantity, 'line_total', v.price * r.quantity);
    end;
  end loop;

  if coalesce(trim(p ->> 'coupon_code'), '') <> '' then
    select * into v_coupon from public.coupons where code = upper(trim(p ->> 'coupon_code')) for update;
    if not found or not v_coupon.is_active
       or (v_coupon.starts_at is not null and now() < v_coupon.starts_at)
       or (v_coupon.ends_at is not null and now() > v_coupon.ends_at)
       or (v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses)
       or v_subtotal < v_coupon.min_order then
      raise exception 'COUPON_INVALIDE';
    end if;
    v_discount := case when v_coupon.discount_type = 'percent'
                       then floor(v_subtotal * v_coupon.value / 100.0)::int
                       else least(v_coupon.value, v_subtotal) end;
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
  end if;

  v_delivery := public.compute_delivery_fee(v_zone.id, v_subtotal - v_discount, v_lat, v_lng);
  v_fee := (v_delivery ->> 'fee')::int;
  v_total := v_subtotal - v_discount + v_fee;

  v_number := 'GL-' || to_char(now() at time zone 'Africa/Dakar', 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0');

  insert into public.orders (
    order_number, user_id, customer_name, email, phone, whatsapp, address_line, city, region,
    zone_id, zone_name, notes, subtotal, discount, delivery_fee, total, coupon_code, payment_method,
    delivery_lat, delivery_lng, delivery_km, delivery_fee_pending
  ) values (
    v_number,
    nullif(p ->> 'user_id', '')::uuid,
    left(p ->> 'customer_name', 120),
    nullif(left(p ->> 'email', 160), ''),
    left(p ->> 'phone', 30),
    nullif(left(p ->> 'whatsapp', 30), ''),
    left(p ->> 'address_line', 300),
    left(p ->> 'city', 80),
    nullif(left(p ->> 'region', 80), ''),
    v_zone.id, v_zone.name,
    nullif(left(p ->> 'notes', 1000), ''),
    v_subtotal, v_discount, v_fee, v_total,
    case when v_discount > 0 then v_coupon.code end,
    v_method,
    v_lat, v_lng, nullif(v_delivery ->> 'km', '')::numeric, (v_delivery ->> 'pending')::boolean
  ) returning id, access_token into v_order_id, v_token;

  insert into public.order_items (order_id, product_id, variant_id, product_name, reference, sku, size, color, image_url, unit_price, quantity, line_total)
  select v_order_id, (l ->> 'product_id')::uuid, (l ->> 'variant_id')::uuid, l ->> 'product_name', l ->> 'reference', l ->> 'sku',
         l ->> 'size', l ->> 'color', l ->> 'image_url', (l ->> 'unit_price')::int, (l ->> 'quantity')::int, (l ->> 'line_total')::int
    from jsonb_array_elements(v_lines) l;

  update public.inventory i
     set quantity = i.quantity - (l ->> 'quantity')::int
    from jsonb_array_elements(v_lines) l
   where i.variant_id = (l ->> 'variant_id')::uuid;

  insert into public.deliveries (order_id, zone_id, fee) values (v_order_id, v_zone.id, v_fee);
  insert into public.order_status_history (order_id, status, note, created_by)
    values (v_order_id, 'en_attente', 'Commande créée', nullif(p ->> 'user_id', '')::uuid);
  insert into public.payments (order_id, provider, amount) values (v_order_id, v_method, v_total)
    returning id into v_payment_id;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_number, 'access_token', v_token,
                            'total', v_total, 'payment_id', v_payment_id,
                            'delivery_fee_pending', (v_delivery ->> 'pending')::boolean);
end $$;

revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

-- ── Fixer les frais d'une livraison « à confirmer » (équipe) ────
create or replace function public.set_delivery_fee(p_order_id uuid, p_fee int) returns void
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
begin
  if not public.is_staff() then
    raise exception 'ACCES_REFUSE';
  end if;
  if p_fee is null or p_fee < 0 then
    raise exception 'MONTANT_INVALIDE';
  end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'COMMANDE_INTROUVABLE';
  end if;
  if o.payment_status = 'reussi' then
    raise exception 'DEJA_PAYEE';
  end if;
  if o.status = 'annulee' then
    raise exception 'COMMANDE_ANNULEE';
  end if;
  update public.orders
     set delivery_fee = p_fee, total = subtotal - discount + p_fee, delivery_fee_pending = false
   where id = p_order_id;
  update public.deliveries set fee = p_fee where order_id = p_order_id;
  update public.payments set amount = o.subtotal - o.discount + p_fee where order_id = p_order_id and status <> 'reussi';
end $$;

revoke all on function public.set_delivery_fee(uuid, int) from public, anon;
grant execute on function public.set_delivery_fee(uuid, int) to authenticated;

-- ── Paiement par lien marchand : confirmation manuelle vérifiée ─
--  Le client paie via le lien Wave (ou Orange Money) de la boutique.
--  La commande ne devient « payée » que lorsqu'un membre de l'équipe
--  a vérifié la réception dans son application marchande et saisi
--  la référence de la transaction.
create or replace function public.confirm_manual_payment(p_order_id uuid, p_reference text) returns void
language plpgsql security definer set search_path = public as $$
declare
  pay public.payments;
begin
  if not public.is_staff() then
    raise exception 'ACCES_REFUSE';
  end if;
  if length(trim(coalesce(p_reference, ''))) < 4 then
    raise exception 'REFERENCE_REQUISE';
  end if;
  select * into pay from public.payments where order_id = p_order_id order by created_at desc limit 1 for update;
  if not found then
    raise exception 'PAIEMENT_INTROUVABLE';
  end if;
  if pay.status = 'reussi' then
    return;
  end if;
  if pay.provider not in ('wave', 'orange_money') or coalesce(pay.raw ->> 'mode', '') <> 'lien' then
    raise exception 'CONFIRMATION_MANUELLE_INTERDITE';
  end if;
  if exists (select 1 from public.orders where id = p_order_id and (status = 'annulee' or delivery_fee_pending)) then
    raise exception 'COMMANDE_NON_PAYABLE';
  end if;

  update public.payments
     set status = 'reussi', provider_reference = left(trim(p_reference), 120),
         raw = coalesce(raw, '{}'::jsonb) || jsonb_build_object('verifie_par', auth.uid(), 'verifie_le', now())
   where id = pay.id;
  update public.orders
     set payment_status = 'reussi', paid_at = now(),
         status = case when status = 'en_attente' then 'confirmee'::public.order_status else status end
   where id = p_order_id;
end $$;

revoke all on function public.confirm_manual_payment(uuid, text) from public, anon;
grant execute on function public.confirm_manual_payment(uuid, text) to authenticated;

-- Marque un paiement comme « par lien » (appelée par le serveur)
create or replace function public.mark_payment_link_mode(p_payment_id uuid, p_url text) returns void
language sql security definer set search_path = public as $$
  update public.payments
     set raw = coalesce(raw, '{}'::jsonb) || jsonb_build_object('mode', 'lien'), checkout_url = p_url
   where id = p_payment_id and status <> 'reussi';
$$;
revoke all on function public.mark_payment_link_mode(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_payment_link_mode(uuid, text) to service_role;

-- ── Administrateur initial (promu automatiquement à l'inscription) ─
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  is_boot boolean;
begin
  select exists (
    select 1 from public.settings s, jsonb_array_elements_text(s.value -> 'emails') e
     where s.key = 'bootstrap_admins' and lower(e) = lower(new.email)
  ) into is_boot;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case when is_boot then 'admin'::public.user_role else 'customer'::public.user_role end
  )
  on conflict (id) do nothing;
  return new;
end $$;
