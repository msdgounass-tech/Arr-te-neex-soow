-- =============================================================================
--  Arrêt nekh soow — schéma Supabase (PostgreSQL)
--  Toutes les tables sont préfixées « ns_ » : le script peut être exécuté dans
--  un projet Supabase dédié ou dans un projet existant sans collision.
--  Idempotent : peut être relancé sans perte de données.
--
--  Principes :
--   • Les prix ne viennent JAMAIS du navigateur : ns_place_order relit le
--     catalogue, contrôle le créneau, la capacité et le stock dans une seule
--     transaction verrouillée.
--   • RLS sur toutes les tables. Le public ne lit que le catalogue et les
--     réglages ; il ne voit jamais les commandes des autres (le suivi se fait
--     par un jeton aléatoire non devinable).
--   • Le back-office est réservé aux comptes listés dans ns_admins.
--   • Fuseau horaire : Africa/Dakar (UTC+0, pas d'heure d'été).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.ns_settings (
  id               int primary key default 1 check (id = 1),
  shop_name        text not null default 'Arrêt nekh soow',
  tagline          text not null default 'Vos spécialités sénégalaises, prêtes à l''heure que vous choisissez.',
  story            text not null default 'Arrêt nekh soow vous propose les saveurs traditionnelles du Sénégal, préparées chaque jour avec soin à Thiès Mbour 3.',
  phone            text not null default '705704121',
  whatsapp         text not null default '221705704121',
  address          text not null default 'Thiès Mbour 3, Sénégal',
  maps_url         text not null default 'https://www.google.com/maps/search/?api=1&query=Mbour+3+Thi%C3%A8s+S%C3%A9n%C3%A9gal',
  opening_hours    text not null default 'Tous les jours · 10h – 22h',
  announcement     text not null default '',
  accepting_orders boolean not null default true,
  slot_times       text[] not null default array['10:00','11:00','12:00','13:00','16:00','17:00','20:00','21:00'],
  slot_capacity    int not null default 5 check (slot_capacity between 1 and 500),
  lead_minutes     int not null default 30 check (lead_minutes between 0 and 1440),
  days_ahead       int not null default 4 check (days_ahead between 1 and 30),
  closed_weekdays  int[] not null default '{}',          -- 0 = dimanche … 6 = samedi
  updated_at       timestamptz not null default now()
);
insert into public.ns_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.ns_products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  category    text not null default 'AUTRES' check (char_length(category) between 1 and 40),
  emoji       text not null default '🍽️' check (char_length(emoji) <= 16),
  image_url   text check (image_url is null or image_url ~ '^(https://|/|assets/)'),
  popular     boolean not null default false,
  active      boolean not null default true,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.ns_formats (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.ns_products(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  price       int  not null check (price between 0 and 10000000),
  stock       int  check (stock is null or stock >= 0),   -- null = illimité
  active      boolean not null default true,
  position    int not null default 0
);
create index if not exists ns_formats_product_idx on public.ns_formats(product_id);

create table if not exists public.ns_closed_dates (
  day    date primary key,
  reason text not null default ''
);

create table if not exists public.ns_closed_slots (
  day  date not null,
  slot text not null check (slot ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  primary key (day, slot)
);

do $$ begin
  create type public.ns_order_status as enum ('nouvelle','confirmee','preparation','prete','recuperee','annulee');
exception when duplicate_object then null; end $$;

create sequence if not exists public.ns_order_seq start 1001;

create table if not exists public.ns_orders (
  id             uuid primary key default gen_random_uuid(),
  number         text not null unique,
  tracking_token uuid not null unique default gen_random_uuid(),
  customer_name  text not null check (char_length(customer_name) between 2 and 80),
  phone          text not null check (phone ~ '^[0-9]{9}$'),
  note           text not null default '' check (char_length(note) <= 500),
  pickup_day     date not null,
  pickup_slot    text not null,
  status         public.ns_order_status not null default 'nouvelle',
  total          int not null check (total >= 0),
  items_count    int not null check (items_count > 0),
  paid           boolean not null default false,
  payment_method text not null default 'retrait' check (payment_method in ('retrait','wave','orange_money','especes')),
  admin_note     text not null default '' check (char_length(admin_note) <= 1000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists ns_orders_pickup_idx  on public.ns_orders(pickup_day, pickup_slot);
create index if not exists ns_orders_created_idx on public.ns_orders(created_at desc);
create index if not exists ns_orders_phone_idx   on public.ns_orders(phone);

create table if not exists public.ns_order_items (
  id           bigint generated always as identity primary key,
  order_id     uuid not null references public.ns_orders(id) on delete cascade,
  product_id   uuid references public.ns_products(id) on delete set null,
  format_id    uuid references public.ns_formats(id) on delete set null,
  product_name text not null,
  format_name  text not null,
  unit_price   int  not null check (unit_price >= 0),
  qty          int  not null check (qty between 1 and 99)
);
create index if not exists ns_order_items_order_idx on public.ns_order_items(order_id);

create table if not exists public.ns_order_history (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.ns_orders(id) on delete cascade,
  status     public.ns_order_status not null,
  changed_at timestamptz not null default now(),
  changed_by uuid
);
create index if not exists ns_order_history_order_idx on public.ns_order_history(order_id);

create table if not exists public.ns_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Fonctions utilitaires
-- -----------------------------------------------------------------------------

create or replace function public.ns_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ns_admins where user_id = auth.uid());
$$;

create or replace function public.ns_touch() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists ns_products_touch on public.ns_products;
create trigger ns_products_touch before update on public.ns_products for each row execute function public.ns_touch();
drop trigger if exists ns_settings_touch on public.ns_settings;
create trigger ns_settings_touch before update on public.ns_settings for each row execute function public.ns_touch();

-- Normalise un numéro sénégalais : 77 123 45 67, +221771234567, 00221… → 771234567
create or replace function public.ns_normalize_phone(p text) returns text
language plpgsql immutable set search_path = public as $$
declare d text := regexp_replace(coalesce(p,''), '[^0-9]', '', 'g');
begin
  if d like '00221%' then d := substr(d, 6); end if;
  if length(d) = 12 and d like '221%' then d := substr(d, 4); end if;
  if d !~ '^(7[05678]|3[03])[0-9]{7}$' then return null; end if;
  return d;
end $$;

-- Garde-fous sur les commandes modifiées depuis le back-office :
-- montants figés, commande annulée/récupérée définitive, stock restitué à l'annulation.
create or replace function public.ns_orders_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.total <> old.total or new.items_count <> old.items_count or new.number <> old.number
     or new.tracking_token <> old.tracking_token or new.created_at <> old.created_at then
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
    end if;
  end if;
  return new;
end $$;
drop trigger if exists ns_orders_guard on public.ns_orders;
create trigger ns_orders_guard before update on public.ns_orders for each row execute function public.ns_orders_guard();

-- -----------------------------------------------------------------------------
-- RPC publiques
-- -----------------------------------------------------------------------------

-- Occupation des créneaux (aucune donnée personnelle).
create or replace function public.ns_slot_load(p_from date, p_to date)
returns table(day date, slot text, booked int)
language sql stable security definer set search_path = public as $$
  select pickup_day, pickup_slot, count(*)::int
    from public.ns_orders
   where pickup_day between p_from and least(p_to, p_from + 31)
     and status <> 'annulee'
   group by 1, 2;
$$;

-- Passage de commande : tout est recalculé et vérifié côté base.
create or replace function public.ns_place_order(
  p_name text, p_phone text, p_note text, p_day date, p_slot text,
  p_items jsonb, p_payment text default 'retrait'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s        public.ns_settings%rowtype;
  v_phone  text := public.ns_normalize_phone(p_phone);
  v_name   text := btrim(coalesce(p_name,''));
  v_note   text := left(btrim(coalesce(p_note,'')), 500);
  v_now    timestamp := (now() at time zone 'Africa/Dakar');
  v_today  date := v_now::date;
  v_total  int := 0;
  v_count  int := 0;
  v_order  uuid;
  v_number text;
  v_token  uuid;
  it       jsonb;
  f        record;
  v_qty    int;
  v_lines  jsonb := '[]'::jsonb;
begin
  select * into s from public.ns_settings where id = 1;
  if not s.accepting_orders then raise exception 'NS_FERME: Les commandes sont momentanément suspendues'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'NS_NOM: Indiquez votre nom'; end if;
  if v_phone is null then raise exception 'NS_TEL: Numéro de téléphone sénégalais invalide'; end if;
  if p_payment not in ('retrait','wave','orange_money','especes') then raise exception 'NS_PAIEMENT: Moyen de paiement inconnu'; end if;

  -- Créneau
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

  -- Anti-abus : 4 commandes actives max par numéro et par heure
  if (select count(*) from public.ns_orders where phone = v_phone and status <> 'annulee' and created_at > now() - interval '1 hour') >= 4 then
    raise exception 'NS_LIMITE: Trop de commandes récentes avec ce numéro, contactez-nous sur WhatsApp';
  end if;

  -- Capacité du créneau (verrou transactionnel par créneau)
  perform pg_advisory_xact_lock(hashtext('ns_slot:' || p_day || ' ' || p_slot));
  if (select count(*) from public.ns_orders where pickup_day = p_day and pickup_slot = p_slot and status <> 'annulee') >= s.slot_capacity then
    raise exception 'NS_COMPLET: Ce créneau vient d''être complet, choisissez-en un autre';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'NS_PANIER: Votre panier est vide';
  end if;

  -- 1) Relecture du catalogue, verrouillage du stock, calcul du total
  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := (it->>'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 99 then raise exception 'NS_QTE: Quantité invalide'; end if;
    select fo.id, fo.name as fname, fo.price, fo.stock, p.id as pid, p.name as pname
      into f
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

  -- 2) Création de la commande et de ses lignes
  v_number := 'NS-' || to_char(v_today, 'YYMMDD') || '-' || nextval('public.ns_order_seq');
  insert into public.ns_orders(number, customer_name, phone, note, pickup_day, pickup_slot, total, items_count, payment_method)
       values (v_number, v_name, v_phone, v_note, p_day, p_slot, v_total, v_count, p_payment)
    returning id, tracking_token into v_order, v_token;
  insert into public.ns_order_items(order_id, product_id, format_id, product_name, format_name, unit_price, qty)
  select v_order, (l->>'pid')::uuid, (l->>'fid')::uuid, l->>'pname', l->>'fname', (l->>'price')::int, (l->>'qty')::int
    from jsonb_array_elements(v_lines) l;
  insert into public.ns_order_history(order_id, status) values (v_order, 'nouvelle');

  return jsonb_build_object('number', v_number, 'token', v_token, 'total', v_total);
end $$;

-- Suivi d'une commande par son jeton (lien envoyé au client).
create or replace function public.ns_track_order(p_token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'number', o.number, 'token', o.tracking_token, 'status', o.status,
    'customer_name', o.customer_name, 'pickup_day', o.pickup_day, 'pickup_slot', o.pickup_slot,
    'total', o.total, 'note', o.note, 'paid', o.paid, 'created_at', o.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object('product_name', i.product_name, 'format_name', i.format_name,
                         'unit_price', i.unit_price, 'qty', i.qty) order by i.id) from public.ns_order_items i where i.order_id = o.id), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object('status', h.status, 'at', h.changed_at) order by h.changed_at)
                         from public.ns_order_history h where h.order_id = o.id), '[]'::jsonb))
  from public.ns_orders o where o.tracking_token = p_token;
$$;

-- Le client peut annuler tant que la commande n'est pas confirmée.
create or replace function public.ns_cancel_order(p_token uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.ns_orders where tracking_token = p_token and status = 'nouvelle' for update;
  if v_id is null then raise exception 'NS_ANNUL: Cette commande ne peut plus être annulée en ligne, contactez-nous'; end if;
  update public.ns_orders set status = 'annulee' where id = v_id;
  return true;
end $$;

-- -----------------------------------------------------------------------------
-- Droits d'exécution
-- -----------------------------------------------------------------------------
revoke all on function public.ns_orders_guard()  from public, anon, authenticated;
revoke all on function public.ns_touch()         from public, anon, authenticated;
grant execute on function public.ns_is_admin()                                     to anon, authenticated;
grant execute on function public.ns_normalize_phone(text)                          to anon, authenticated;
grant execute on function public.ns_slot_load(date, date)                          to anon, authenticated;
grant execute on function public.ns_place_order(text, text, text, date, text, jsonb, text) to anon, authenticated;
grant execute on function public.ns_track_order(uuid)                              to anon, authenticated;
grant execute on function public.ns_cancel_order(uuid)                             to anon, authenticated;

-- Droits sur les tables (filtrés ensuite par les règles RLS ci-dessous)
grant usage on schema public to anon, authenticated;
grant select on public.ns_settings, public.ns_products, public.ns_formats, public.ns_closed_dates, public.ns_closed_slots to anon;
grant select, insert, update, delete on public.ns_settings, public.ns_products, public.ns_formats, public.ns_closed_dates,
  public.ns_closed_slots, public.ns_orders, public.ns_order_items, public.ns_order_history to authenticated;
grant select on public.ns_admins to authenticated;
revoke insert, update, delete on public.ns_settings, public.ns_products, public.ns_formats, public.ns_closed_dates,
  public.ns_closed_slots, public.ns_orders, public.ns_order_items, public.ns_order_history, public.ns_admins from anon;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.ns_settings      enable row level security;
alter table public.ns_products      enable row level security;
alter table public.ns_formats       enable row level security;
alter table public.ns_closed_dates  enable row level security;
alter table public.ns_closed_slots  enable row level security;
alter table public.ns_orders        enable row level security;
alter table public.ns_order_items   enable row level security;
alter table public.ns_order_history enable row level security;
alter table public.ns_admins        enable row level security;

do $$ declare t text; begin
  foreach t in array array['ns_settings','ns_products','ns_formats','ns_closed_dates','ns_closed_slots',
                           'ns_orders','ns_order_items','ns_order_history','ns_admins'] loop
    execute format('drop policy if exists ns_admin_all on public.%I', t);
    execute format('create policy ns_admin_all on public.%I for all to authenticated using (public.ns_is_admin()) with check (public.ns_is_admin())', t);
  end loop;
end $$;

drop policy if exists ns_public_read on public.ns_settings;
create policy ns_public_read on public.ns_settings for select to anon, authenticated using (true);
drop policy if exists ns_public_read on public.ns_products;
create policy ns_public_read on public.ns_products for select to anon, authenticated using (active);
drop policy if exists ns_public_read on public.ns_formats;
create policy ns_public_read on public.ns_formats for select to anon, authenticated
  using (active and exists (select 1 from public.ns_products p where p.id = product_id and p.active));
drop policy if exists ns_public_read on public.ns_closed_dates;
create policy ns_public_read on public.ns_closed_dates for select to anon, authenticated using (true);
drop policy if exists ns_public_read on public.ns_closed_slots;
create policy ns_public_read on public.ns_closed_slots for select to anon, authenticated using (true);
drop policy if exists ns_self_read on public.ns_admins;
create policy ns_self_read on public.ns_admins for select to authenticated using (user_id = auth.uid());
-- Les admins ne peuvent pas s'ajouter/retirer depuis le site : seulement en SQL.
drop policy if exists ns_admin_all on public.ns_admins;

-- -----------------------------------------------------------------------------
-- Stockage des photos produits (lecture publique, écriture admin)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ns-products', 'ns-products', true, 2097152, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

drop policy if exists ns_products_admin_write on storage.objects;
create policy ns_products_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'ns-products' and public.ns_is_admin())
  with check (bucket_id = 'ns-products' and public.ns_is_admin());

-- -----------------------------------------------------------------------------
-- Temps réel : le back-office est prévenu instantanément des nouvelles commandes
-- -----------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.ns_orders;
exception when duplicate_object or undefined_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Catalogue de départ (uniquement si vide)
-- -----------------------------------------------------------------------------
do $$
declare pid uuid;
begin
  if exists (select 1 from public.ns_products) then return; end if;

  insert into public.ns_products(name, description, category, emoji, image_url, popular, position)
  values ('Soow Piir', 'Lait caillé de vache sucré, recette traditionnelle, servi bien frais.', 'SOOW', '🥛', 'assets/img/soow-piir.webp', true, 1) returning id into pid;
  insert into public.ns_formats(product_id, name, price, position) values (pid, 'Petit pot', 500, 1), (pid, 'Grand pot', 2000, 2);

  insert into public.ns_products(name, description, category, emoji, image_url, popular, position)
  values ('Thiakry ak Soow', 'Perles de mil nappées de lait caillé sucré et onctueux.', 'THIAKRY', '🍚', 'assets/img/thiakry-ak-soow.webp', true, 2) returning id into pid;
  insert into public.ns_formats(product_id, name, price, position) values (pid, 'Petit pot', 1000, 1), (pid, 'Grand pot', 2000, 2);

  insert into public.ns_products(name, description, category, emoji, image_url, popular, position)
  values ('Thiakry', 'Semoule de mil travaillée à la main, crème légère et raisins secs.', 'THIAKRY', '🍚', 'assets/img/thiakry.webp', true, 3) returning id into pid;
  insert into public.ns_formats(product_id, name, price, position) values (pid, 'Petit pot', 1000, 1), (pid, 'Grand pot', 2000, 2);

  insert into public.ns_products(name, description, category, emoji, image_url, popular, position)
  values ('Ngallakh', 'Bouillie de mil au pain de singe (bouye) et à la pâte d''arachide.', 'NGALLAKH', '🥜', 'assets/img/ngallakh.webp', false, 4) returning id into pid;
  insert into public.ns_formats(product_id, name, price, position) values (pid, 'Gobelet', 700, 1), (pid, 'Grand pot', 2000, 2);

  insert into public.ns_products(name, description, category, emoji, image_url, popular, position)
  values ('Lakh Soow', 'Bouillie de mil sucrée accompagnée de lait caillé.', 'LAKH', '🌾', 'assets/img/lakh-soow.webp', false, 5) returning id into pid;
  insert into public.ns_formats(product_id, name, price, position) values (pid, 'Gobelet', 500, 1), (pid, 'Grand pot', 1500, 2);

  insert into public.ns_products(name, description, category, emoji, image_url, popular, position)
  values ('Yaourt maison', 'Yaourt nature onctueux, fabriqué sur place chaque matin.', 'YAOURT', '🥛', null, true, 6) returning id into pid;
  insert into public.ns_formats(product_id, name, price, position) values (pid, 'Petit pot', 750, 1), (pid, 'Grand pot', 1500, 2);
end $$;

-- -----------------------------------------------------------------------------
-- Donner l'accès au back-office (à exécuter après avoir créé le compte dans
-- Authentication > Users) :
--   insert into public.ns_admins(user_id)
--   select id from auth.users where email = 'votre-email@exemple.com'
--   on conflict do nothing;
-- -----------------------------------------------------------------------------
