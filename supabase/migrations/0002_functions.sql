-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Fonctions, déclencheurs et logique métier
-- ════════════════════════════════════════════════════════════════

-- ── Rôles ───────────────────────────────────────────────────────
create or replace function public.current_user_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'customer'::public.user_role)
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_user_role() in ('staff', 'manager', 'admin')
$$;

create or replace function public.is_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_user_role() in ('manager', 'admin')
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_user_role() = 'admin'
$$;

-- ── Création automatique du profil à l'inscription ──────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un utilisateur ne peut pas modifier son propre rôle (seul un admin, ou la clé service, le peut)
create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'ROLE_INTERDIT';
  end if;
  if new.role is distinct from old.role and old.id = auth.uid() and old.role = 'admin' then
    raise exception 'ROLE_PROPRE_COMPTE';
  end if;
  return new;
end $$;

create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ── Validation d'un code promo (appelable publiquement) ─────────
create or replace function public.validate_coupon(p_code text, p_subtotal int)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  c public.coupons;
  d int;
begin
  select * into c from public.coupons where code = upper(trim(p_code));
  if not found or not c.is_active then
    return jsonb_build_object('valid', false, 'message', 'Ce code n''est pas valide.');
  end if;
  if c.starts_at is not null and now() < c.starts_at then
    return jsonb_build_object('valid', false, 'message', 'Ce code n''est pas encore actif.');
  end if;
  if c.ends_at is not null and now() > c.ends_at then
    return jsonb_build_object('valid', false, 'message', 'Ce code a expiré.');
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    return jsonb_build_object('valid', false, 'message', 'Ce code a atteint sa limite d''utilisation.');
  end if;
  if p_subtotal < c.min_order then
    return jsonb_build_object('valid', false, 'message', 'Montant minimum requis : ' || c.min_order || ' FCFA.');
  end if;
  d := case when c.discount_type = 'percent' then floor(p_subtotal * c.value / 100.0)::int else least(c.value, p_subtotal) end;
  return jsonb_build_object('valid', true, 'code', c.code, 'discount', d,
    'message', case when c.discount_type = 'percent' then '-' || c.value || ' %' else '-' || c.value || ' FCFA' end);
end $$;

-- ── Création atomique d'une commande ────────────────────────────
--  Recalcule tous les prix côté serveur, verrouille et décrémente le stock,
--  applique le code promo et les frais de livraison. Réservée à la clé service.
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_zone public.delivery_zones;
  v_coupon public.coupons;
  v_subtotal int := 0;
  v_discount int := 0;
  v_fee int := 0;
  v_total int;
  v_order_id uuid;
  v_number text;
  v_token uuid;
  v_payment_id uuid;
  v_lines jsonb := '[]'::jsonb;
  v_image text;
  v_method public.payment_method;
  v_count int := 0;
begin
  if jsonb_typeof(p -> 'items') is distinct from 'array' or jsonb_array_length(p -> 'items') = 0 then
    raise exception 'PANIER_VIDE';
  end if;
  if jsonb_array_length(p -> 'items') > 50 then
    raise exception 'PANIER_TROP_GRAND';
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
    v_count := v_count + 1;
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

  -- Code promo
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

  v_fee := case when v_zone.free_above is not null and (v_subtotal - v_discount) >= v_zone.free_above then 0 else v_zone.fee end;
  v_total := v_subtotal - v_discount + v_fee;

  v_number := 'GL-' || to_char(now() at time zone 'Africa/Dakar', 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0');

  insert into public.orders (
    order_number, user_id, customer_name, email, phone, whatsapp, address_line, city, region,
    zone_id, zone_name, notes, subtotal, discount, delivery_fee, total, coupon_code, payment_method
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
    v_method
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
                            'total', v_total, 'payment_id', v_payment_id);
end $$;

-- ── Mise à jour d'un paiement (webhooks, clé service uniquement) ─
create or replace function public.record_payment_result(
  p_payment_id uuid, p_status public.payment_status, p_reference text, p_amount int, p_raw jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare
  pay public.payments;
begin
  select * into pay from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'PAIEMENT_INTROUVABLE';
  end if;
  if pay.status = 'reussi' then
    return; -- idempotent : un paiement réussi n'est jamais rétrogradé par un webhook
  end if;
  if p_status = 'reussi' and (p_amount is null or p_amount <> pay.amount) then
    raise exception 'MONTANT_INCOHERENT';
  end if;

  update public.payments
     set status = p_status,
         provider_reference = coalesce(p_reference, provider_reference),
         raw = p_raw
   where id = pay.id;

  update public.orders
     set payment_status = p_status,
         paid_at = case when p_status = 'reussi' then now() else paid_at end,
         status = case when p_status = 'reussi' and status = 'en_attente' then 'confirmee'::public.order_status else status end
   where id = pay.order_id;
end $$;

-- ── Historique, réassort et synchronisation de la livraison ─────
create or replace function public.on_order_status_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if old.status = 'annulee' then
      raise exception 'COMMANDE_ANNULEE';
    end if;

    insert into public.order_status_history (order_id, status, created_by) values (new.id, new.status, auth.uid());

    if new.status = 'annulee' then
      update public.inventory i
         set quantity = i.quantity + oi.quantity
        from public.order_items oi
       where oi.order_id = new.id and i.variant_id = oi.variant_id;
      if new.coupon_code is not null then
        update public.coupons set used_count = greatest(used_count - 1, 0) where code = new.coupon_code;
      end if;
    end if;

    update public.deliveries d
       set status = case new.status
                      when 'en_preparation' then 'en_preparation'::public.delivery_status
                      when 'expediee' then 'expediee'::public.delivery_status
                      when 'livree' then 'livree'::public.delivery_status
                      else d.status end,
           shipped_at = case when new.status in ('expediee', 'livree') then coalesce(d.shipped_at, now()) else d.shipped_at end,
           delivered_at = case when new.status = 'livree' then coalesce(d.delivered_at, now()) else d.delivered_at end
     where d.order_id = new.id;

    if new.status = 'livree' and new.payment_method = 'livraison' and new.payment_status <> 'reussi' then
      new.payment_status := 'reussi';
      new.paid_at := now();
      update public.payments set status = 'reussi' where order_id = new.id and provider = 'livraison';
    end if;
  end if;
  return new;
end $$;

create trigger orders_status_change before update on public.orders
  for each row execute function public.on_order_status_change();

-- ── Meilleures ventes (identifiants uniquement, aucun chiffre exposé) ─
create or replace function public.best_seller_ids(p_limit int default 8) returns setof uuid
language sql stable security definer set search_path = public as $$
  select oi.product_id
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.products pr on pr.id = oi.product_id
   where o.status <> 'annulee' and pr.is_active
   group by oi.product_id
   order by sum(oi.quantity) desc
   limit greatest(1, least(p_limit, 24))
$$;

-- ── Statistiques (gérants et administrateurs) ───────────────────
create or replace function public.admin_stats(p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  res jsonb;
  since timestamptz := date_trunc('day', now()) - make_interval(days => greatest(p_days, 1) - 1);
begin
  if not public.is_manager() then
    raise exception 'ACCES_REFUSE';
  end if;

  with valid as (
    select * from public.orders where status <> 'annulee'
  ), cashed as (
    select * from valid where payment_status = 'reussi'
  )
  select jsonb_build_object(
    'revenue', coalesce((select sum(total) from cashed), 0),
    'revenue_period', coalesce((select sum(total) from cashed where created_at >= since), 0),
    'orders', (select count(*) from valid),
    'orders_period', (select count(*) from valid where created_at >= since),
    'pending', (select count(*) from public.orders where status = 'en_attente'),
    'customers', (select count(*) from public.profiles where role = 'customer'),
    'average_basket', coalesce((select round(avg(total)) from cashed), 0),
    'low_stock', (select count(*) from public.inventory where quantity <= low_stock_threshold),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'revenue', coalesce(c.revenue, 0), 'orders', coalesce(c.orders, 0)) order by d.day)
        from generate_series(since, date_trunc('day', now()), interval '1 day') as d(day)
        left join (
          select date_trunc('day', created_at) as day,
                 sum(total) filter (where payment_status = 'reussi') as revenue,
                 count(*) as orders
            from valid where created_at >= since group by 1
        ) c on c.day = d.day
    ), '[]'::jsonb),
    'top_products', coalesce((
      select jsonb_agg(t) from (
        select oi.product_name as name, sum(oi.quantity) as quantity, sum(oi.line_total) as revenue
          from public.order_items oi join valid o on o.id = oi.order_id
         group by oi.product_name order by sum(oi.quantity) desc limit 5
      ) t
    ), '[]'::jsonb)
  ) into res;
  return res;
end $$;

-- ── Droits d'exécution ──────────────────────────────────────────
revoke all on function public.place_order(jsonb) from public, anon, authenticated;
revoke all on function public.record_payment_result(uuid, public.payment_status, text, int, jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;
grant execute on function public.record_payment_result(uuid, public.payment_status, text, int, jsonb) to service_role;
grant execute on function public.validate_coupon(text, int) to anon, authenticated;
grant execute on function public.best_seller_ids(int) to anon, authenticated;
grant execute on function public.admin_stats(int) to authenticated;
