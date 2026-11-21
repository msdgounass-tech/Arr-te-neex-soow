-- =============================================================================
--  Arrêt nekh soow — Mise à jour « Promotions »
--  Codes promo (pourcentage ou montant), prix barrés sur les produits.
--  À exécuter une fois dans Supabase > SQL Editor (projet gounass-luxury) > Run.
--  Peut être relancé sans risque.
-- =============================================================================

-- Prix barré (prix avant réduction) sur chaque format
alter table public.ns_formats add column if not exists compare_price int;
do $$ begin
  alter table public.ns_formats add constraint ns_formats_compare_chk check (compare_price is null or compare_price >= 0);
exception when duplicate_object then null; end $$;

-- Interrupteur général des codes promo
alter table public.ns_settings add column if not exists promos_enabled boolean not null default true;

-- Codes promo
create table if not exists public.ns_promos (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[A-Z0-9_-]{3,20}$'),
  kind        text not null default 'percent' check (kind in ('percent','amount')),
  value       int  not null check (value > 0),
  min_order   int  not null default 0 check (min_order >= 0),
  max_uses    int  check (max_uses is null or max_uses > 0),
  used_count  int  not null default 0 check (used_count >= 0),
  starts_on   date,
  ends_on     date,
  active      boolean not null default true,
  description text not null default '' check (char_length(description) <= 200),
  created_at  timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100)
);

-- Commandes : code utilisé et montant de la remise
alter table public.ns_orders add column if not exists promo_code text not null default '';
alter table public.ns_orders add column if not exists discount int not null default 0;
do $$ begin
  alter table public.ns_orders add constraint ns_orders_discount_chk check (discount >= 0);
exception when duplicate_object then null; end $$;

-- Calcul d'une remise (utilisé par la commande et par l'aperçu)
create or replace function public.ns_promo_discount(p_code text, p_subtotal int, p_lock boolean default false)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  pr public.ns_promos%rowtype;
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_today date := (now() at time zone 'Africa/Dakar')::date;
  v_disc int;
begin
  if v_code = '' then return jsonb_build_object('ok', false, 'message', 'Saisissez un code'); end if;
  if not coalesce((select promos_enabled from public.ns_settings where id = 1), true) then
    return jsonb_build_object('ok', false, 'message', 'Les codes promo ne sont pas disponibles en ce moment');
  end if;
  if p_lock then
    select * into pr from public.ns_promos where code = v_code for update;
  else
    select * into pr from public.ns_promos where code = v_code;
  end if;
  if not found or not pr.active then return jsonb_build_object('ok', false, 'message', 'Ce code promo n''existe pas ou n''est plus actif'); end if;
  if pr.starts_on is not null and v_today < pr.starts_on then return jsonb_build_object('ok', false, 'message', 'Ce code promo n''est pas encore valable'); end if;
  if pr.ends_on is not null and v_today > pr.ends_on then return jsonb_build_object('ok', false, 'message', 'Ce code promo a expiré'); end if;
  if pr.max_uses is not null and pr.used_count >= pr.max_uses then return jsonb_build_object('ok', false, 'message', 'Ce code promo a atteint sa limite d''utilisation'); end if;
  if p_subtotal < pr.min_order then
    return jsonb_build_object('ok', false, 'message', format('Ce code est valable dès %s FCFA d''achat', regexp_replace(pr.min_order::text, '(\d)(?=(\d{3})+$)', '\1 ', 'g')));
  end if;
  v_disc := case when pr.kind = 'percent' then floor(p_subtotal * pr.value / 100.0)::int else least(pr.value, p_subtotal) end;
  return jsonb_build_object('ok', true, 'code', pr.code, 'discount', v_disc, 'kind', pr.kind, 'value', pr.value,
    'label', case when pr.kind = 'percent' then '-' || pr.value || ' %' else '-' || regexp_replace(pr.value::text, '(\d)(?=(\d{3})+$)', '\1 ', 'g') || ' FCFA' end);
end $$;

-- Aperçu public (bouton « Appliquer ») : ne révèle que le résultat pour le code saisi
create or replace function public.ns_check_promo(p_code text, p_subtotal int)
returns jsonb
language sql stable security definer set search_path = public as $$
  select public.ns_promo_discount(p_code, greatest(coalesce(p_subtotal, 0), 0), false);
$$;

-- Garde-fou : remise figée, code rendu disponible si la commande est annulée
create or replace function public.ns_orders_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.total <> old.total or new.items_count <> old.items_count or new.number <> old.number or new.delivery_fee <> old.delivery_fee
     or new.discount <> old.discount or new.promo_code <> old.promo_code
     or new.tracking_token <> old.tracking_token or new.created_at <> old.created_at or new.user_id is distinct from old.user_id then
    raise exception 'Les montants et l''identifiant d''une commande ne sont pas modifiables';
  end if;
  if old.status in ('annulee','recuperee') and new.status <> old.status then
    raise exception 'Cette commande est clôturée';
  end if;
  new.updated_at := now();
  if new.status <> old.status then
    insert into public.ns_order_history(order_id, status, changed_by) values (new.id, new.status, auth.uid());
    if new.status = 'annulee' then
      update public.ns_formats f set stock = f.stock + i.qty
        from public.ns_order_items i
       where i.order_id = new.id and i.format_id = f.id and f.stock is not null;
      if new.promo_code <> '' then
        update public.ns_promos set used_count = greatest(0, used_count - 1) where code = new.promo_code;
      end if;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.ns_orders_guard() from public, anon, authenticated;

-- Passage de commande avec code promo
drop function if exists public.ns_place_order(text, text, text, date, text, jsonb, text, text, uuid, text);
create or replace function public.ns_place_order(
  p_name text, p_phone text, p_note text, p_day date, p_slot text,
  p_items jsonb, p_payment text default 'retrait',
  p_fulfillment text default 'retrait', p_zone uuid default null, p_address text default '',
  p_promo text default ''
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.ns_settings%rowtype;
  z public.ns_delivery_zones%rowtype;
  v_phone text := public.ns_normalize_phone(p_phone);
  v_name text := btrim(coalesce(p_name,''));
  v_note text := left(btrim(coalesce(p_note,'')), 500);
  v_addr text := left(btrim(coalesce(p_address,'')), 300);
  v_now timestamp := (now() at time zone 'Africa/Dakar');
  v_today date := v_now::date;
  v_total int := 0; v_count int := 0; v_fee int := 0; v_disc int := 0; v_code text := '';
  v_order uuid; v_number text; v_token uuid;
  it jsonb; f record; v_qty int; v_promo jsonb;
  v_lines jsonb := '[]'::jsonb;
begin
  select * into s from public.ns_settings where id = 1;
  if not s.accepting_orders then raise exception 'NS_FERME: Les commandes sont momentanément suspendues'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'NS_NOM: Indiquez votre nom'; end if;
  if v_phone is null then raise exception 'NS_TEL: Numéro de téléphone sénégalais invalide'; end if;
  if p_payment not in ('retrait','wave','orange_money','especes') then raise exception 'NS_PAIEMENT: Moyen de paiement inconnu'; end if;
  if p_fulfillment not in ('retrait','livraison') then raise exception 'NS_MODE: Mode de récupération inconnu'; end if;
  if p_fulfillment = 'livraison' then
    if not s.delivery_enabled then raise exception 'NS_LIVRAISON: La livraison à domicile est momentanément indisponible'; end if;
    select * into z from public.ns_delivery_zones where id = p_zone and active;
    if not found then raise exception 'NS_ZONE: Choisissez votre zone de livraison'; end if;
    if char_length(v_addr) < 5 then raise exception 'NS_ADRESSE: Indiquez votre adresse de livraison'; end if;
    v_fee := z.fee;
  end if;
  if p_day < v_today or p_day >= v_today + s.days_ahead then raise exception 'NS_JOUR: Ce jour n''est pas ouvert à la commande'; end if;
  if extract(dow from p_day)::int = any(s.closed_weekdays) or exists (select 1 from public.ns_closed_dates where day = p_day) then
    raise exception 'NS_JOUR: Nous sommes fermés ce jour-là';
  end if;
  if not (p_slot = any(s.slot_times)) or exists (select 1 from public.ns_closed_slots where day = p_day and slot = p_slot) then
    raise exception 'NS_CRENEAU: Ce créneau n''est pas disponible';
  end if;
  if p_day = v_today and (p_day + p_slot::time) < v_now + make_interval(mins => s.lead_minutes) then
    raise exception 'NS_CRENEAU: Ce créneau est trop proche, choisissez-en un plus tard';
  end if;
  if (select count(*) from public.ns_orders where phone = v_phone and status <> 'annulee' and created_at > now() - interval '1 hour') >= 4 then
    raise exception 'NS_LIMITE: Trop de commandes récentes avec ce numéro, contactez-nous sur WhatsApp';
  end if;
  perform pg_advisory_xact_lock(hashtext('ns_slot:' || p_day || ' ' || p_slot));
  if (select count(*) from public.ns_orders where pickup_day = p_day and pickup_slot = p_slot and status <> 'annulee') >= s.slot_capacity then
    raise exception 'NS_COMPLET: Ce créneau vient d''être complet, choisissez-en un autre';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'NS_PANIER: Votre panier est vide';
  end if;
  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := (it->>'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 99 then raise exception 'NS_QTE: Quantité invalide'; end if;
    select fo.id, fo.name as fname, fo.price, fo.stock, p.id as pid, p.name as pname into f
      from public.ns_formats fo join public.ns_products p on p.id = fo.product_id
     where fo.id = (it->>'format_id')::uuid and fo.active and p.active
       for update of fo;
    if not found then raise exception 'NS_PRODUIT: Un produit de votre panier n''est plus disponible'; end if;
    if f.stock is not null then
      if f.stock < v_qty then raise exception 'NS_STOCK: Stock insuffisant pour % (%) : il en reste %', f.pname, f.fname, f.stock; end if;
      update public.ns_formats set stock = stock - v_qty where id = f.id;
    end if;
    v_lines := v_lines || jsonb_build_object('pid', f.pid, 'fid', f.id, 'pname', f.pname, 'fname', f.fname, 'price', f.price, 'qty', v_qty);
    v_total := v_total + f.price * v_qty;
    v_count := v_count + v_qty;
  end loop;
  if p_fulfillment = 'livraison' and v_total < s.delivery_min_order then
    raise exception 'NS_MINIMUM: Commande minimum de % FCFA pour la livraison', s.delivery_min_order;
  end if;
  if btrim(coalesce(p_promo, '')) <> '' then
    v_promo := public.ns_promo_discount(p_promo, v_total, true);
    if not (v_promo->>'ok')::boolean then raise exception 'NS_PROMO: %', v_promo->>'message'; end if;
    v_disc := (v_promo->>'discount')::int; v_code := v_promo->>'code';
    update public.ns_promos set used_count = used_count + 1 where code = v_code;
  end if;
  v_number := 'NS-' || to_char(v_today, 'YYMMDD') || '-' || nextval('public.ns_order_seq');
  insert into public.ns_orders(number, customer_name, phone, note, pickup_day, pickup_slot, total, items_count, payment_method,
                               fulfillment, delivery_zone, delivery_address, delivery_fee, user_id, promo_code, discount)
       values (v_number, v_name, v_phone, v_note, p_day, p_slot, v_total - v_disc + v_fee, v_count, p_payment,
               p_fulfillment, coalesce(z.name, ''), case when p_fulfillment = 'livraison' then v_addr else '' end, v_fee, auth.uid(), v_code, v_disc)
    returning id, tracking_token into v_order, v_token;
  insert into public.ns_order_items(order_id, product_id, format_id, product_name, format_name, unit_price, qty)
  select v_order, (l->>'pid')::uuid, (l->>'fid')::uuid, l->>'pname', l->>'fname', (l->>'price')::int, (l->>'qty')::int
    from jsonb_array_elements(v_lines) l;
  insert into public.ns_order_history(order_id, status) values (v_order, 'nouvelle');
  return jsonb_build_object('number', v_number, 'token', v_token, 'total', v_total - v_disc + v_fee, 'discount', v_disc);
end $$;

create or replace function public.ns_track_order(p_token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'number', o.number, 'token', o.tracking_token, 'status', o.status,
    'customer_name', o.customer_name, 'pickup_day', o.pickup_day, 'pickup_slot', o.pickup_slot,
    'total', o.total, 'note', o.note, 'paid', o.paid, 'created_at', o.created_at, 'payment_method', o.payment_method,
    'fulfillment', o.fulfillment, 'delivery_zone', o.delivery_zone, 'delivery_address', o.delivery_address, 'delivery_fee', o.delivery_fee,
    'promo_code', o.promo_code, 'discount', o.discount,
    'items', coalesce((select jsonb_agg(jsonb_build_object('product_name', i.product_name, 'format_name', i.format_name,
                         'unit_price', i.unit_price, 'qty', i.qty) order by i.id) from public.ns_order_items i where i.order_id = o.id), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object('status', h.status, 'at', h.changed_at) order by h.changed_at)
                         from public.ns_order_history h where h.order_id = o.id), '[]'::jsonb))
  from public.ns_orders o where o.tracking_token = p_token;
$$;

-- Droits
revoke all on function public.ns_promo_discount(text, int, boolean) from public, anon, authenticated;
grant execute on function public.ns_check_promo(text, int) to anon, authenticated;
grant execute on function public.ns_place_order(text, text, text, date, text, jsonb, text, text, uuid, text, text) to anon, authenticated;
grant execute on function public.ns_track_order(uuid) to anon, authenticated;

alter table public.ns_promos enable row level security;
revoke all on public.ns_promos from anon;
grant select, insert, update, delete on public.ns_promos to authenticated;
drop policy if exists ns_admin_all on public.ns_promos;
create policy ns_admin_all on public.ns_promos for all to authenticated using (public.ns_is_admin()) with check (public.ns_is_admin());

-- Exemple de code (désactivé) pour montrer le fonctionnement
insert into public.ns_promos(code, kind, value, min_order, description, active)
values ('BIENVENUE10', 'percent', 10, 2000, 'Bienvenue : -10 % dès 2 000 FCFA', false)
on conflict (code) do nothing;

select 'promotions installées' as etat,
       (select count(*) from public.ns_promos) as codes,
       exists (select 1 from information_schema.columns where table_name = 'ns_formats' and column_name = 'compare_price') as prix_barres;
