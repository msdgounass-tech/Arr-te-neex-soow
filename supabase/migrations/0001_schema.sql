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
