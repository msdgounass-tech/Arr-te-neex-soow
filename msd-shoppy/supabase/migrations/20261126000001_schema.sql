-- Shoppy by MSD — schéma principal
-- Monnaie : montants entiers en francs CFA (XOF, sans décimales). Pays : extensible (table countries).

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ───────────────────────── Types ─────────────────────────
create type public.subscription_status as enum ('trial', 'active', 'pending_payment', 'expired', 'suspended');
create type public.product_status as enum ('draft', 'published', 'hidden');
create type public.availability as enum ('in_stock', 'out_of_stock', 'on_order');
create type public.order_status as enum ('pending', 'confirmed', 'refused', 'preparing', 'shipped', 'delivered', 'completed', 'cancelled');
create type public.delivery_method as enum ('delivery', 'pickup', 'shipping');
create type public.event_type as enum ('shop_view', 'product_view', 'call_click', 'whatsapp_click', 'share_click', 'favorite_add');

-- ───────────────────────── Référentiels ─────────────────────────
create table public.countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name text not null,
  currency text not null default 'XOF',
  phone_prefix text not null,
  active boolean not null default true
);

create table public.regions (
  id serial primary key,
  country_code text not null references public.countries(code),
  name text not null,
  unique (country_code, name)
);

create table public.domains (
  id serial primary key,
  slug text not null unique,
  name text not null,
  icon text not null default 'tag',
  position int not null default 0,
  active boolean not null default true
);

create table public.categories (
  id serial primary key,
  domain_id int not null references public.domains(id),
  parent_id int references public.categories(id),
  slug text not null unique,
  name text not null,
  position int not null default 0,
  active boolean not null default true
);
create index on public.categories (domain_id);

-- ───────────────────────── Utilisateurs ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,                              -- privé : jamais affiché publiquement
  avatar_url text,
  notify_promotions boolean not null default true,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Domicile',
  recipient_name text not null,
  phone text not null,
  country_code text not null default 'SN' references public.countries(code),
  region text not null,
  city text not null,
  details text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.addresses (user_id);

-- ───────────────────────── Boutiques ─────────────────────────
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete restrict,
  slug text not null unique,
  name text not null check (char_length(name) between 2 and 60),
  logo_url text,
  cover_url text,
  description text not null default '' check (char_length(description) <= 2000),
  domain_id int not null references public.domains(id),
  country_code text not null default 'SN' references public.countries(code),
  region text not null,
  city text not null,
  address_public text,
  public_phone text,
  public_whatsapp text,
  public_email text,
  return_policy text,                      -- prévu pour la phase « retours et réclamations »
  is_published boolean not null default true,
  verified_at timestamptz,                 -- attribué uniquement par la plateforme
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.shops (domain_id);
create index on public.shops (region);

create table public.shop_specialties (
  shop_id uuid not null references public.shops(id) on delete cascade,
  category_id int not null references public.categories(id),
  primary key (shop_id, category_id)
);

create table public.shop_delivery_zones (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  method public.delivery_method not null default 'delivery',
  regions text[] not null default '{}',   -- vide = toutes les régions
  fee int check (fee is null or fee >= 0), -- null = frais à convenir avec le vendeur
  min_days int not null default 1 check (min_days >= 0),
  max_days int not null default 3 check (max_days >= min_days),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.shop_delivery_zones (shop_id);

-- ───────────────────────── Abonnements (séparés des ventes) ─────────────────────────
create table public.subscription_plans (
  code text primary key,
  name text not null,
  price_xof int check (price_xof is null or price_xof >= 0),  -- tarifs à définir : rien n'est fixé ici
  period_days int not null default 30,
  active boolean not null default false
);

create table public.subscriptions (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  status public.subscription_status not null default 'trial',
  trial_ends_at timestamptz not null,
  current_period_end timestamptz,
  plan_code text references public.subscription_plans(code),
  updated_at timestamptz not null default now()
);

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  plan_code text references public.subscription_plans(code),
  amount int check (amount is null or amount >= 0),
  method text not null check (method in ('wave', 'orange_money', 'autre')),
  reference text not null check (char_length(reference) between 3 and 80),
  status text not null default 'pending' check (status in ('pending', 'validated', 'rejected')),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  validated_by uuid references public.profiles(id)
);
create index on public.subscription_payments (shop_id);

-- ───────────────────────── Produits ─────────────────────────
create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  slug text not null unique,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 5000),
  price int not null check (price > 0),
  compare_at_price int check (compare_at_price is null or compare_at_price > 0),
  category_id int references public.categories(id),
  sku text,
  status public.product_status not null default 'draft',
  availability public.availability not null default 'in_stock',
  stock int check (stock is null or stock >= 0), -- null = stock non suivi
  quality_score int not null default 0,
  search_text text not null default '',
  search_vector tsvector,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products (shop_id);
create index on public.products (category_id);
create index on public.products (status, published_at desc);
create index products_search_idx on public.products using gin (search_vector);
create index products_trgm_idx on public.products using gin (search_text extensions.gin_trgm_ops);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  width int not null default 0,
  height int not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.product_images (product_id, position);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text,
  color text,
  model text,
  sku text,
  price int check (price is null or price > 0),   -- null = prix du produit
  stock int check (stock is null or stock >= 0),
  active boolean not null default true,
  position int not null default 0
);
create index on public.product_variants (product_id);

-- ───────────────────────── Favoris ─────────────────────────
create table public.favorite_products (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create table public.favorite_shops (
  user_id uuid not null references public.profiles(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, shop_id)
);

-- ───────────────────────── Commandes ─────────────────────────
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  shop_id uuid not null references public.shops(id) on delete restrict,
  status public.order_status not null default 'pending',
  subtotal int not null check (subtotal >= 0),
  delivery_fee int check (delivery_fee is null or delivery_fee >= 0), -- null = à convenir
  total int not null check (total >= 0),
  delivery_zone_id uuid references public.shop_delivery_zones(id) on delete set null,
  delivery_method public.delivery_method not null default 'delivery',
  delivery_label text,
  recipient_name text not null,
  phone text not null,
  region text not null,
  city text not null,
  address_details text not null default '',
  note text not null default '',
  payment_method text not null default 'cash_on_delivery'
    check (payment_method in ('cash_on_delivery', 'wave_direct', 'orange_money_direct')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  status_note text
);
create index on public.orders (buyer_id, created_at desc);
create index on public.orders (shop_id, created_at desc);
create index on public.orders (shop_id, status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  title text not null,
  variant_label text,
  sku text,
  image_url text,
  unit_price int not null check (unit_price > 0),
  quantity int not null check (quantity between 1 and 99),
  line_total int not null
);
create index on public.order_items (order_id);
create index on public.order_items (product_id);

create table public.order_events (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  actor text not null check (actor in ('buyer', 'seller', 'system')),
  note text,
  created_at timestamptz not null default now()
);
create index on public.order_events (order_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
create index on public.reviews (shop_id, created_at desc);

-- ───────────────────────── Statistiques, notifications, assistant, aide ─────────────────────────
create table public.events (
  id bigserial primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  type public.event_type not null,
  created_at timestamptz not null default now()
);
create index on public.events (shop_id, created_at);
create index on public.events (product_id) where product_id is not null;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('order', 'subscription', 'shop', 'tip', 'announcement')),
  title text not null,
  body text not null default '',
  link text,
  is_promotional boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

create table public.assistant_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  step_key text not null,
  status text not null check (status in ('done', 'dismissed')),
  updated_at timestamptz not null default now(),
  primary key (user_id, step_key)
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  category text not null check (category in ('commande', 'vendeur', 'compte', 'paiement', 'signalement', 'autre')),
  subject text not null check (char_length(subject) between 3 and 140),
  message text not null check (char_length(message) between 10 and 4000),
  page_url text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);
