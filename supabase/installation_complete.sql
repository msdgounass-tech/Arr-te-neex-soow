-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — INSTALLATION COMPLÈTE (à exécuter une seule fois)
--  Regroupe : migrations 0001 à 0005, seed.sql et config_gounass.sql.
--  Supabase › SQL Editor › New query › coller tout ce fichier › Run.
-- ════════════════════════════════════════════════════════════════

-- ───── supabase/migrations/0001_schema.sql ─────
-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Schéma de base de données (PostgreSQL / Supabase)
--  Montants exprimés en FCFA (XOF), entiers, sans décimales.
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Types ───────────────────────────────────────────────────────
create type public.user_role as enum ('customer', 'staff', 'manager', 'admin');
create type public.gender as enum ('homme', 'femme', 'unisexe');
create type public.order_status as enum ('en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee');
create type public.payment_status as enum ('en_attente', 'initie', 'reussi', 'echoue', 'annule', 'rembourse');
create type public.payment_method as enum ('wave', 'orange_money', 'carte', 'livraison');
create type public.delivery_status as enum ('en_attente', 'en_preparation', 'expediee', 'livree', 'echouee');
create type public.discount_type as enum ('percent', 'fixed');

-- ── Utilitaire updated_at ───────────────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── Profils (1-1 avec auth.users) ───────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  whatsapp text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- ── Catégories (arborescence Homme / Femme > sous-catégories) ───
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete cascade,
  name text not null,
  slug text not null unique,
  gender public.gender,
  is_accessory boolean not null default false,
  description text,
  image_url text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index categories_parent_idx on public.categories (parent_id);

-- ── Collections (capsules, collections exclusives) ──────────────
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tagline text,
  description text,
  image_url text,
  is_featured boolean not null default false,
  is_exclusive boolean not null default false,
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Produits ────────────────────────────────────────────────────
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  reference text not null unique,
  description text,
  details text,
  category_id uuid references public.categories (id) on delete set null,
  collection_id uuid references public.collections (id) on delete set null,
  gender public.gender not null default 'unisexe',
  price int not null check (price >= 0),
  compare_at_price int check (compare_at_price is null or compare_at_price > 0),
  is_featured boolean not null default false,
  is_new boolean not null default true,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_collection_idx on public.products (collection_id);
create index products_active_created_idx on public.products (is_active, created_at desc);
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  storage_path text,
  alt text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, position);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text,
  color text,
  color_hex text,
  sku text not null unique,
  price_override int check (price_override is null or price_override >= 0),
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants (product_id);

create table public.inventory (
  variant_id uuid primary key references public.product_variants (id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0),
  low_stock_threshold int not null default 2,
  updated_at timestamptz not null default now()
);
create trigger inventory_touch before update on public.inventory for each row execute function public.touch_updated_at();

-- ── Zones de livraison (tarifs et délais configurables) ─────────
create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  fee int not null default 0 check (fee >= 0),
  free_above int check (free_above is null or free_above > 0),
  delay text,
  position int not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Paniers (clients connectés) ─────────────────────────────────
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now()
);
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity int not null check (quantity > 0 and quantity <= 99),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

-- ── Adresses ────────────────────────────────────────────────────
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  region text,
  zone_id uuid references public.delivery_zones (id) on delete set null,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);

-- ── Favoris ─────────────────────────────────────────────────────
create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ── Codes de réduction ──────────────────────────────────────────
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  description text,
  discount_type public.discount_type not null,
  value int not null check (value > 0),
  min_order int not null default 0,
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (discount_type <> 'percent' or value <= 100)
);

-- ── Commandes ───────────────────────────────────────────────────
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  access_token uuid not null default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  status public.order_status not null default 'en_attente',
  customer_name text not null,
  email text,
  phone text not null,
  whatsapp text,
  address_line text not null,
  city text not null,
  region text,
  zone_id uuid references public.delivery_zones (id) on delete set null,
  zone_name text,
  notes text,
  subtotal int not null,
  discount int not null default 0,
  delivery_fee int not null default 0,
  total int not null,
  coupon_code text,
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'en_attente',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  reference text,
  sku text,
  size text,
  color text,
  image_url text,
  unit_price int not null,
  quantity int not null check (quantity > 0),
  line_total int not null
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- ── Paiements ───────────────────────────────────────────────────
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider public.payment_method not null,
  amount int not null,
  currency text not null default 'XOF',
  status public.payment_status not null default 'en_attente',
  provider_reference text,
  checkout_url text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);
create unique index payments_provider_ref_idx on public.payments (provider, provider_reference) where provider_reference is not null;
create trigger payments_touch before update on public.payments for each row execute function public.touch_updated_at();

-- ── Livraisons ──────────────────────────────────────────────────
create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  zone_id uuid references public.delivery_zones (id) on delete set null,
  status public.delivery_status not null default 'en_attente',
  carrier text,
  tracking_number text,
  fee int not null default 0,
  scheduled_for date,
  shipped_at timestamptz,
  delivered_at timestamptz,
  notes text,
  updated_at timestamptz not null default now()
);
create trigger deliveries_touch before update on public.deliveries for each row execute function public.touch_updated_at();

-- ── Paramètres de la boutique (valeurs NON sensibles uniquement) ─
create table public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();

-- ── Journal des notifications ───────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  channel text not null,          -- whatsapp | email
  event text not null,            -- order_created | payment_received | status_changed | shipped | delivered
  recipient text,
  status text not null default 'pending', -- pending | sent | failed | skipped
  error text,
  created_at timestamptz not null default now()
);
create index notifications_order_idx on public.notifications (order_id);

-- ── Newsletter & contact ────────────────────────────────────────
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───── supabase/migrations/0002_functions.sql ─────
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

-- ───── supabase/migrations/0003_rls.sql ─────
-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Row Level Security & Storage
--  Rôles : customer < staff (commandes) < manager (catalogue, promos, stats) < admin (tout)
-- ════════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.favorites enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.deliveries enable row level security;
alter table public.settings enable row level security;
alter table public.notifications enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;

-- ── Profils ─────────────────────────────────────────────────────
create policy "profil: lecture personnelle" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "profil: mise à jour personnelle" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- ── Catalogue : lecture publique des éléments actifs, écriture gérant ─
create policy "categories: lecture" on public.categories for select using (is_active or public.is_manager());
create policy "categories: gestion" on public.categories for all using (public.is_manager()) with check (public.is_manager());

create policy "collections: lecture" on public.collections for select using (is_active or public.is_manager());
create policy "collections: gestion" on public.collections for all using (public.is_manager()) with check (public.is_manager());

create policy "produits: lecture" on public.products for select using (is_active or public.is_staff());
create policy "produits: gestion" on public.products for all using (public.is_manager()) with check (public.is_manager());

create policy "images: lecture" on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_id and (p.is_active or public.is_staff())));
create policy "images: gestion" on public.product_images for all using (public.is_manager()) with check (public.is_manager());

create policy "variantes: lecture" on public.product_variants for select using (
  exists (select 1 from public.products p where p.id = product_id and (p.is_active or public.is_staff())));
create policy "variantes: gestion" on public.product_variants for all using (public.is_manager()) with check (public.is_manager());

create policy "stock: lecture" on public.inventory for select using (true);
create policy "stock: gestion" on public.inventory for all using (public.is_manager()) with check (public.is_manager());

create policy "zones: lecture" on public.delivery_zones for select using (is_active or public.is_staff());
create policy "zones: gestion" on public.delivery_zones for all using (public.is_admin()) with check (public.is_admin());

-- ── Données personnelles du client ──────────────────────────────
create policy "panier: propriétaire" on public.carts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "articles panier: propriétaire" on public.cart_items for all
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

create policy "adresses: propriétaire" on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "adresses: lecture équipe" on public.addresses for select using (public.is_staff());

create policy "favoris: propriétaire" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Codes promo : aucune lecture publique (validation via validate_coupon) ─
create policy "coupons: gestion" on public.coupons for all using (public.is_manager()) with check (public.is_manager());

-- ── Commandes : le client lit les siennes, l'équipe gère ────────
--  La création passe exclusivement par place_order() avec la clé service.
create policy "commandes: lecture" on public.orders for select using (user_id = auth.uid() or public.is_staff());
create policy "commandes: gestion" on public.orders for update using (public.is_staff()) with check (public.is_staff());

create policy "lignes: lecture" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())));

create policy "historique: lecture" on public.order_status_history for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())));

create policy "paiements: lecture" on public.payments for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())));

create policy "livraisons: lecture" on public.deliveries for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())));
create policy "livraisons: gestion" on public.deliveries for update using (public.is_staff()) with check (public.is_staff());

-- ── Paramètres ──────────────────────────────────────────────────
create policy "paramètres: lecture" on public.settings for select using (is_public or public.is_admin());
create policy "paramètres: gestion" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- ── Journal / newsletter / contact ──────────────────────────────
create policy "notifications: lecture équipe" on public.notifications for select using (public.is_staff());

create policy "newsletter: inscription" on public.newsletter_subscribers for insert with check (true);
create policy "newsletter: lecture" on public.newsletter_subscribers for select using (public.is_manager());

create policy "contact: envoi" on public.contact_messages for insert with check (true);
create policy "contact: lecture" on public.contact_messages for select using (public.is_staff());
create policy "contact: traitement" on public.contact_messages for update using (public.is_staff()) with check (public.is_staff());

-- ── Storage : images produits et visuels du site ────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('site', 'site', true, 12582912, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "storage: lecture publique" on storage.objects for select using (bucket_id in ('products', 'site'));
create policy "storage: ajout gérant" on storage.objects for insert with check (bucket_id in ('products', 'site') and public.is_manager());
create policy "storage: modification gérant" on storage.objects for update using (bucket_id in ('products', 'site') and public.is_manager());
create policy "storage: suppression gérant" on storage.objects for delete using (bucket_id in ('products', 'site') and public.is_manager());

-- ───── supabase/migrations/0004_guards.sql ─────
-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Garde-fous sur les commandes
--  Depuis le tableau de bord (session utilisateur, rôle « authenticated »),
--  l'équipe ne peut modifier que le statut, les notes et l'encaissement d'un
--  paiement à la livraison. Les montants restent figés ; le statut d'un paiement
--  en ligne n'est modifiable que par les webhooks (clé service / fonctions internes).
-- ════════════════════════════════════════════════════════════════

-- Synchronise la ligne de paiement d'une commande payée à la livraison
create or replace function public.sync_cod_payment(p_order_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.payments set status = 'reussi'
   where order_id = p_order_id and provider = 'livraison'
     and (public.is_staff() or auth.uid() is null);
$$;
revoke all on function public.sync_cod_payment(uuid) from public, anon;
grant execute on function public.sync_cod_payment(uuid) to authenticated, service_role;

-- SECURITY INVOKER : current_user reflète l'appelant réel
--   authenticated/anon → requête depuis le navigateur ou une session utilisateur
--   service_role / propriétaire → serveur de confiance ou fonction interne
create or replace function public.guard_order_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if new.subtotal <> old.subtotal or new.discount <> old.discount or new.delivery_fee <> old.delivery_fee
     or new.total <> old.total or new.order_number <> old.order_number or new.access_token <> old.access_token
     or new.payment_method <> old.payment_method or new.user_id is distinct from old.user_id
     or new.customer_name <> old.customer_name or new.phone <> old.phone then
    raise exception 'CHAMP_PROTEGE';
  end if;
  if new.payment_status is distinct from old.payment_status then
    if old.payment_method <> 'livraison' or new.payment_status <> 'reussi' then
      raise exception 'PAIEMENT_PROTEGE';
    end if;
    new.paid_at := coalesce(new.paid_at, now());
    perform public.sync_cod_payment(new.id);
  end if;
  return new;
end $$;

create trigger orders_guard before update on public.orders
  for each row execute function public.guard_order_update();

-- ───── supabase/migrations/0005_delivery_payments.sql ─────
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

-- ───── supabase/seed.sql ─────
-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Données de structure (aucune donnée commerciale fictive)
--  Catégories, zones de livraison (désactivées tant que les tarifs ne sont pas
--  saisis dans l'administration) et paramètres vides à compléter.
-- ════════════════════════════════════════════════════════════════

-- Univers principaux
insert into public.categories (name, slug, gender, position) values
  ('Homme', 'homme', 'homme', 1),
  ('Femme', 'femme', 'femme', 2)
on conflict (slug) do nothing;

-- Sous-catégories Homme
insert into public.categories (parent_id, name, slug, gender, is_accessory, position)
select (select id from public.categories where slug = 'homme'), c.name, 'homme-' || c.slug, 'homme', c.acc, c.pos
from (values
  ('Vêtements', 'vetements', false, 1), ('Chaussures', 'chaussures', false, 2), ('Montres', 'montres', true, 3),
  ('Sacs', 'sacs', true, 4), ('Lunettes', 'lunettes', true, 5), ('Parfums', 'parfums', true, 6),
  ('Bijoux', 'bijoux', true, 7), ('Accessoires', 'accessoires', true, 8)
) as c(name, slug, acc, pos)
on conflict (slug) do nothing;

-- Sous-catégories Femme
insert into public.categories (parent_id, name, slug, gender, is_accessory, position)
select (select id from public.categories where slug = 'femme'), c.name, 'femme-' || c.slug, 'femme', c.acc, c.pos
from (values
  ('Vêtements', 'vetements', false, 1), ('Robes', 'robes', false, 2), ('Chaussures', 'chaussures', false, 3),
  ('Sacs', 'sacs', true, 4), ('Montres', 'montres', true, 5), ('Lunettes', 'lunettes', true, 6),
  ('Parfums', 'parfums', true, 7), ('Bijoux', 'bijoux', true, 8), ('Accessoires', 'accessoires', true, 9)
) as c(name, slug, acc, pos)
on conflict (slug) do nothing;

-- Zones de livraison : à tarifer puis activer dans Admin > Livraison
insert into public.delivery_zones (name, slug, position, is_active) values
  ('Dakar', 'dakar', 1, false),
  ('Thiès', 'thies', 2, false),
  ('Saint-Louis', 'saint-louis', 3, false),
  ('Touba', 'touba', 4, false),
  ('Mbour', 'mbour', 5, false),
  ('Autres régions du Sénégal', 'autres-regions', 6, false),
  ('International', 'international', 7, false)
on conflict (slug) do nothing;

-- Paramètres publics de la boutique (à compléter dans Admin > Paramètres)
insert into public.settings (key, value) values
  ('store', '{"email": "", "phone": "", "whatsapp": "", "address": "", "city": "", "instagram": "", "tiktok": "", "facebook": "", "opening_hours": ""}'::jsonb),
  ('home', '{"hero_image": "", "men_image": "", "women_image": "", "accessories_image": "", "editorial_image": "", "announcement": "", "logo_url": ""}'::jsonb),
  ('delivery', '{"origin_lat": "", "origin_lng": "", "road_factor": "1.3"}'::jsonb),
  ('payments', '{"wave_link": "", "orange_money_link": ""}'::jsonb)
on conflict (key) do nothing;

-- ───── supabase/config_gounass.sql ─────
-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Configuration de la boutique
--  À exécuter APRÈS les migrations et seed.sql.
--  Valeurs fournies par le propriétaire (aucun tarif inventé).
-- ════════════════════════════════════════════════════════════════

-- Coordonnées publiques
insert into public.settings (key, value) values
  ('store', jsonb_build_object(
    'email', 'msdshop01@gmail.com',
    'phone', '70 570 41 21',
    'whatsapp', '705704121',
    'address', '',
    'city', 'Boutique en ligne — Sénégal',
    'opening_hours', 'Commandes disponibles 24h/24',
    'instagram', '', 'tiktok', '', 'facebook', ''))
on conflict (key) do update set value = excluded.value;

-- Bandeau d'annonce (les visuels restent ceux par défaut tant qu'ils ne sont pas remplacés)
insert into public.settings (key, value) values
  ('home', '{"hero_image": "", "men_image": "", "women_image": "", "accessories_image": "", "editorial_image": "", "logo_url": ""}'::jsonb)
on conflict (key) do nothing;
update public.settings
   set value = value || '{"announcement": "GOUNASS LUXURY — Wouro Maama | Livraison gratuite dès 10 000 FCFA"}'::jsonb
 where key = 'home';

-- Lien de paiement marchand Wave (paiement vérifié manuellement par l'équipe)
insert into public.settings (key, value) values
  ('payments', '{"wave_link": "https://pay.wave.com/m/M_sn_Rb6z4J8BYSDP/c/sn/", "orange_money_link": ""}'::jsonb)
on conflict (key) do update set value = public.settings.value || jsonb_build_object('wave_link', 'https://pay.wave.com/m/M_sn_Rb6z4J8BYSDP/c/sn/');

-- Livraison : zones du Sénégal actives, gratuite dès 10 000 FCFA.
-- Sous ce montant, le tarif est « à confirmer » tant qu'il n'est pas réglé
-- dans Admin › Livraison (tarif fixe ou au kilomètre selon la position du client).
update public.delivery_zones
   set is_active = true, fee_mode = 'quote', free_above = 10000
 where slug in ('dakar', 'thies', 'saint-louis', 'touba', 'mbour', 'autres-regions');
update public.delivery_zones set is_active = false where slug = 'international';

-- Administrateur : promu automatiquement à l'inscription avec cet e-mail
insert into public.settings (key, value, is_public) values
  ('bootstrap_admins', '{"emails": ["msdgounass@gmail.com"]}'::jsonb, false)
on conflict (key) do update set value = excluded.value, is_public = false;
-- … et immédiatement si le compte existe déjà
update public.profiles set role = 'admin' where lower(email) = 'msdgounass@gmail.com';
