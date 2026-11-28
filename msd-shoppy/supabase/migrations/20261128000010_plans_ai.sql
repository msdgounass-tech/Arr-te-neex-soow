-- Shoppy by MSD — formules (Starter / Pro / Business), facturation mensuelle ou annuelle,
-- droits par formule, quotas et suivi des coûts de Shoppy AI, coûts d'achat privés, plan d'action.
-- Migration additive : aucune donnée existante n'est supprimée.

-- ───────────────────────── Formules ─────────────────────────
alter table public.subscription_plans
  add column if not exists tier int not null default 0,
  add column if not exists price_year_xof int check (price_year_xof is null or price_year_xof >= 0),
  add column if not exists tagline text not null default '';

insert into public.subscription_plans (code, name, price_xof, period_days, active, tier, price_year_xof, tagline) values
  ('starter', 'Starter', 2900, 30, true, 1, 31900, 'Pour les vendeurs qui commencent leur activité'),
  ('pro', 'Pro', 5000, 30, true, 2, 52500, 'Pour développer vos ventes'),
  ('business', 'Business', 12000, 30, true, 3, 120000, 'Pour les commerces en croissance')
on conflict (code) do update set name = excluded.name, price_xof = excluded.price_xof, period_days = excluded.period_days,
  active = excluded.active, tier = excluded.tier, price_year_xof = excluded.price_year_xof, tagline = excluded.tagline;

alter table public.subscription_payments
  add column if not exists cycle text not null default 'monthly' check (cycle in ('monthly', 'yearly'));

-- Formule effective d'une boutique : pendant l'essai, toutes les fonctions Pro sont ouvertes ;
-- abonnement actif : la formule payée ; sinon aucune (boutique en lecture seule, rien n'est supprimé).
create or replace function public.shop_plan(p_shop uuid) returns text
language sql stable security definer set search_path = public as $$
  select case public.subscription_effective_status(s)
           when 'trial' then 'pro'
           when 'active' then coalesce(s.plan_code, 'starter')
           else null end
  from public.subscriptions s where s.shop_id = p_shop
$$;

create or replace function public.my_plan() returns text
language sql stable security definer set search_path = public as $$
  select public.shop_plan(public.my_shop_id())
$$;

-- Déclaration d'un paiement : le montant est calculé par la base à partir de la formule et de la période
-- (jamais fourni par le navigateur). Un seul paiement en attente à la fois : pas de double facturation.
drop function if exists public.declare_subscription_payment(text, text, text, int);
create or replace function public.declare_subscription_payment(p_method text, p_reference text, p_plan text, p_cycle text default 'monthly')
returns uuid language plpgsql security definer set search_path = public as $$
declare sid uuid := public.my_shop_id(); pid uuid; s public.subscriptions; pl public.subscription_plans; v_amount int;
begin
  if sid is null then raise exception 'AUCUNE_BOUTIQUE'; end if;
  if p_cycle not in ('monthly', 'yearly') then raise exception 'PERIODE_INVALIDE'; end if;
  select * into pl from public.subscription_plans where code = p_plan and active;
  if not found then raise exception 'FORMULE_INVALIDE'; end if;
  v_amount := case when p_cycle = 'yearly' then pl.price_year_xof else pl.price_xof end;
  if v_amount is null then raise exception 'FORMULE_INVALIDE'; end if;
  if exists(select 1 from public.subscription_payments where shop_id = sid and status = 'pending') then raise exception 'PAIEMENT_DEJA_EN_ATTENTE'; end if;
  select * into s from public.subscriptions where shop_id = sid;
  if public.subscription_effective_status(s) = 'suspended' then raise exception 'BOUTIQUE_SUSPENDUE'; end if;
  insert into public.subscription_payments (shop_id, plan_code, amount, method, reference, cycle)
  values (sid, p_plan, v_amount, p_method, trim(p_reference), p_cycle) returning id into pid;
  if public.subscription_effective_status(s) = 'expired' then
    update public.subscriptions set status = 'pending_payment', updated_at = now() where shop_id = sid;
  end if;
  return pid;
end $$;
revoke execute on function public.declare_subscription_payment(text, text, text, text) from public, anon;
grant execute on function public.declare_subscription_payment(text, text, text, text) to authenticated;

-- Validation : 30 jours (mensuel) ou 365 jours (annuel), ajoutés à la fin de la période en cours.
create or replace function public.admin_review_subscription_payment(p_payment uuid, p_approve boolean, p_days int default null) returns void
language plpgsql security definer set search_path = public as $$
declare pay public.subscription_payments; owner uuid; s public.subscriptions; base timestamptz; v_days int;
begin
  if not public.is_platform_admin() then raise exception 'INTERDIT'; end if;
  select * into pay from public.subscription_payments where id = p_payment and status = 'pending' for update;
  if not found then raise exception 'PAIEMENT_INTROUVABLE'; end if;
  v_days := coalesce(p_days, case when pay.cycle = 'yearly' then 365 else 30 end);
  select owner_id into owner from public.shops where id = pay.shop_id;
  update public.subscription_payments set status = case when p_approve then 'validated' else 'rejected' end,
    validated_at = now(), validated_by = auth.uid() where id = p_payment;
  select * into s from public.subscriptions where shop_id = pay.shop_id for update;
  if p_approve then
    base := greatest(now(), coalesce(case when public.subscription_effective_status(s) = 'active' then s.current_period_end end, now()));
    update public.subscriptions set status = 'active', plan_code = coalesce(pay.plan_code, plan_code),
      current_period_end = base + make_interval(days => v_days), updated_at = now() where shop_id = pay.shop_id;
    insert into public.notifications (user_id, kind, title, body, link)
    values (owner, 'subscription', 'Abonnement activé',
      'Votre paiement a été vérifié. Formule ' || coalesce((select name from public.subscription_plans where code = pay.plan_code), '') ||
      case when pay.cycle = 'yearly' then ' (annuelle)' else ' (mensuelle)' end || ' active jusqu''au ' ||
      to_char(base + make_interval(days => v_days), 'DD/MM/YYYY') || '.', '/vendeur/abonnement');
  else
    update public.subscriptions set status = case when s.status = 'pending_payment' then 'expired' else s.status end, updated_at = now()
    where shop_id = pay.shop_id;
    insert into public.notifications (user_id, kind, title, body, link)
    values (owner, 'subscription', 'Paiement non validé', 'Nous n''avons pas pu vérifier votre paiement. Vérifiez la référence et réessayez.', '/vendeur/abonnement');
  end if;
end $$;

-- ───────────────────────── Droits par formule (configurables par l'administration) ─────────────────────────
-- level : none | basic | full | advanced. monthly_quota : nombre de générations IA par mois (null = sans IA externe).
create table if not exists public.plan_features (
  plan_code text not null references public.subscription_plans(code) on delete cascade,
  feature text not null,
  level text not null default 'none' check (level in ('none', 'basic', 'full', 'advanced')),
  monthly_quota int check (monthly_quota is null or monthly_quota >= 0),
  primary key (plan_code, feature)
);

insert into public.plan_features (plan_code, feature, level, monthly_quota) values
  -- IA générative (appels payants au fournisseur) : quotas mensuels
  ('starter', 'ai_content', 'basic', 20), ('pro', 'ai_content', 'full', 200), ('business', 'ai_content', 'advanced', 800),
  ('starter', 'ai_ads', 'basic', 10), ('pro', 'ai_ads', 'full', 100), ('business', 'ai_ads', 'advanced', 400),
  ('starter', 'ai_translate', 'none', 0), ('pro', 'ai_translate', 'full', 100), ('business', 'ai_translate', 'advanced', 400),
  ('starter', 'ai_chat', 'none', 0), ('pro', 'ai_chat', 'full', 100), ('business', 'ai_chat', 'advanced', 400),
  -- Analyses calculées sur les données de la boutique (sans coût d'IA externe)
  ('starter', 'sales', 'basic', null), ('pro', 'sales', 'full', null), ('business', 'sales', 'advanced', null),
  ('starter', 'market', 'basic', null), ('pro', 'market', 'full', null), ('business', 'market', 'advanced', null),
  ('starter', 'competitors', 'none', null), ('pro', 'competitors', 'full', null), ('business', 'competitors', 'advanced', null),
  ('starter', 'pricing', 'basic', null), ('pro', 'pricing', 'full', null), ('business', 'pricing', 'advanced', null),
  ('starter', 'stock', 'none', null), ('pro', 'stock', 'basic', null), ('business', 'stock', 'advanced', null),
  ('starter', 'action_plan', 'none', null), ('pro', 'action_plan', 'full', null), ('business', 'action_plan', 'advanced', null),
  ('starter', 'export', 'none', null), ('pro', 'export', 'none', null), ('business', 'export', 'full', null)
on conflict (plan_code, feature) do nothing;

alter table public.plan_features enable row level security;
create policy read_all on public.plan_features for select using (true);
revoke insert, update, delete on public.plan_features from anon, authenticated;

-- Interrupteur global par module (désactivation d'urgence, sans toucher aux formules).
create table if not exists public.ai_modules (
  feature text primary key,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.ai_modules (feature) values ('ai_content'), ('ai_ads'), ('ai_translate'), ('ai_chat'),
  ('sales'), ('market'), ('competitors'), ('pricing'), ('stock'), ('action_plan'), ('export') on conflict do nothing;
alter table public.ai_modules enable row level security;
create policy read_all on public.ai_modules for select using (true);
revoke insert, update, delete on public.ai_modules from anon, authenticated;

-- Niveau d'accès d'une boutique à une fonction (none si module coupé, abonnement expiré ou non inclus).
create or replace function public.feature_level(p_feature text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((
    select pf.level from public.plan_features pf
    where pf.plan_code = public.my_plan() and pf.feature = p_feature
      and coalesce((select enabled from public.ai_modules m where m.feature = p_feature), true)), 'none')
$$;

-- ───────────────────────── Utilisation et coût de l'IA ─────────────────────────
create table if not exists public.ai_usage (
  id bigserial primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  feature text not null,
  task text not null default '',
  status text not null default 'reserved' check (status in ('reserved', 'ok', 'error')),
  model text,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  input_hash text,
  output jsonb,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_shop_month on public.ai_usage (shop_id, feature, created_at desc);
create index if not exists ai_usage_hash on public.ai_usage (shop_id, input_hash) where input_hash is not null;
alter table public.ai_usage enable row level security;
create policy owner_read on public.ai_usage for select using (public.is_shop_owner(shop_id) or public.is_platform_admin());
revoke insert, update, delete on public.ai_usage from anon, authenticated;

-- Réserve une génération : vérifie formule, module, quota mensuel et cadence (anti-abus), puis compte l'appel.
-- Une génération en échec (status = error) ne consomme pas de quota.
create or replace function public.ai_reserve(p_feature text, p_task text default '', p_hash text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare sid uuid := public.my_shop_id(); v_plan text; v_quota int; v_used int; v_id bigint; v_level text;
begin
  if sid is null then raise exception 'AUCUNE_BOUTIQUE'; end if;
  v_plan := public.shop_plan(sid);
  if v_plan is null then raise exception 'ABONNEMENT_INACTIF'; end if;
  if not coalesce((select enabled from public.ai_modules where feature = p_feature), false) then raise exception 'MODULE_DESACTIVE'; end if;
  select level, monthly_quota into v_level, v_quota from public.plan_features where plan_code = v_plan and feature = p_feature;
  if coalesce(v_level, 'none') = 'none' or coalesce(v_quota, 0) = 0 then raise exception 'FONCTION_NON_INCLUSE'; end if;
  perform pg_advisory_xact_lock(hashtext('ai_reserve:' || sid::text));
  if (select count(*) from public.ai_usage where shop_id = sid and created_at > now() - interval '1 minute' and status <> 'error') >= 8 then
    raise exception 'TROP_DE_REQUETES';
  end if;
  select count(*) into v_used from public.ai_usage
  where shop_id = sid and feature = p_feature and status <> 'error' and created_at >= date_trunc('month', now());
  if v_used >= v_quota then raise exception 'QUOTA_EPUISE'; end if;
  insert into public.ai_usage (shop_id, user_id, feature, task, input_hash) values (sid, auth.uid(), p_feature, left(p_task, 40), p_hash)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'used', v_used + 1, 'quota', v_quota, 'plan', v_plan);
end $$;

create or replace function public.ai_finalize(p_id bigint, p_ok boolean, p_model text, p_input_tokens int, p_output_tokens int,
  p_cost_usd numeric, p_output jsonb default null, p_error text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.ai_usage set status = case when p_ok then 'ok' else 'error' end, model = left(p_model, 60),
    input_tokens = greatest(coalesce(p_input_tokens, 0), 0), output_tokens = greatest(coalesce(p_output_tokens, 0), 0),
    cost_usd = greatest(coalesce(p_cost_usd, 0), 0), output = p_output, error = left(p_error, 300)
  where id = p_id and shop_id = public.my_shop_id() and status = 'reserved';
end $$;

-- Utilisation du mois pour la boutique connectée (compteur affiché au vendeur).
create or replace function public.ai_usage_summary() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(pf.feature, jsonb_build_object('level', public.feature_level(pf.feature), 'quota', pf.monthly_quota,
    'used', (select count(*) from public.ai_usage u where u.shop_id = public.my_shop_id() and u.feature = pf.feature
             and u.status <> 'error' and u.created_at >= date_trunc('month', now())))), '{}'::jsonb)
  from public.plan_features pf where pf.plan_code = coalesce(public.my_plan(), 'starter')
$$;

-- ───────────────────────── Coûts d'achat (privés au vendeur) ─────────────────────────
create table if not exists public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  unit_cost int not null default 0 check (unit_cost >= 0),
  extra_cost int not null default 0 check (extra_cost >= 0),
  updated_at timestamptz not null default now()
);
alter table public.product_costs enable row level security;
create policy owner_all on public.product_costs for all using (public.is_shop_owner(shop_id)) with check (
  public.is_shop_owner(shop_id) and exists(select 1 from public.products p where p.id = product_id and p.shop_id = product_costs.shop_id));
revoke all on public.product_costs from anon;

-- ───────────────────────── Recherches sans résultat (demande non couverte) ─────────────────────────
create table if not exists public.search_log (
  id bigserial primary key,
  term text not null,
  results int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists search_log_term on public.search_log (created_at desc);
alter table public.search_log enable row level security;
revoke all on public.search_log from anon, authenticated;

create or replace function public.log_search(p_term text, p_results int) returns void
language plpgsql security definer set search_path = public as $$
declare t text := lower(trim(regexp_replace(coalesce(p_term, ''), '\s+', ' ', 'g')));
begin
  if char_length(t) between 2 and 60 then insert into public.search_log (term, results) values (t, greatest(p_results, 0)); end if;
end $$;
revoke execute on function public.log_search(text, int) from public;
grant execute on function public.log_search(text, int) to anon, authenticated;

-- ───────────────────────── Analyses (données réelles uniquement) ─────────────────────────
-- Ventes et stock par produit, comparaison avec la période précédente, jours de la semaine.
create or replace function public.ai_sales_insights(p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare sid uuid := public.my_shop_id(); d int := greatest(7, least(coalesce(p_days, 30), 180));
  since timestamptz := now() - make_interval(days => d); prev timestamptz := now() - make_interval(days => 2 * d);
begin
  if sid is null then raise exception 'AUCUNE_BOUTIQUE'; end if;
  return jsonb_build_object(
    'days', d,
    'totals', jsonb_build_object(
      'views', (select count(*) from public.events where shop_id = sid and type = 'product_view' and created_at >= since),
      'views_prev', (select count(*) from public.events where shop_id = sid and type = 'product_view' and created_at >= prev and created_at < since),
      'orders', (select count(*) from public.orders where shop_id = sid and created_at >= since and status not in ('refused', 'cancelled')),
      'orders_prev', (select count(*) from public.orders where shop_id = sid and created_at >= prev and created_at < since and status not in ('refused', 'cancelled')),
      'revenue', (select coalesce(sum(total), 0) from public.orders where shop_id = sid and status = 'completed' and completed_at >= since),
      'revenue_prev', (select coalesce(sum(total), 0) from public.orders where shop_id = sid and status = 'completed' and completed_at >= prev and completed_at < since)),
    'weekdays', (select coalesce(jsonb_agg(jsonb_build_object('dow', w.dow, 'orders', w.n) order by w.dow), '[]'::jsonb) from (
        select extract(isodow from created_at)::int as dow, count(*) as n from public.orders
        where shop_id = sid and created_at >= since and status not in ('refused', 'cancelled') group by 1) w),
    'products', (select coalesce(jsonb_agg(r order by (r ->> 'views')::int desc), '[]'::jsonb) from (
        select jsonb_build_object(
          'id', p.id, 'title', p.title, 'slug', p.slug, 'price', p.price, 'status', p.status, 'availability', p.availability,
          'stock', p.stock, 'quality', p.quality_score, 'category_id', p.category_id,
          'unit_cost', c.unit_cost, 'extra_cost', c.extra_cost,
          'views', (select count(*) from public.events e where e.product_id = p.id and e.type = 'product_view' and e.created_at >= since),
          'views_prev', (select count(*) from public.events e where e.product_id = p.id and e.type = 'product_view' and e.created_at >= prev and e.created_at < since),
          'favorites', (select count(*) from public.events e where e.product_id = p.id and e.type = 'favorite_add' and e.created_at >= since),
          'orders', (select count(distinct oi.order_id) from public.order_items oi join public.orders o on o.id = oi.order_id
                     where oi.product_id = p.id and o.created_at >= since and o.status not in ('refused', 'cancelled')),
          'units', (select coalesce(sum(oi.quantity), 0) from public.order_items oi join public.orders o on o.id = oi.order_id
                     where oi.product_id = p.id and o.created_at >= since and o.status not in ('refused', 'cancelled')),
          'revenue', (select coalesce(sum(oi.line_total), 0) from public.order_items oi join public.orders o on o.id = oi.order_id
                     where oi.product_id = p.id and o.status = 'completed' and o.completed_at >= since),
          'last_order_at', (select max(o.created_at) from public.order_items oi join public.orders o on o.id = oi.order_id
                     where oi.product_id = p.id and o.status not in ('refused', 'cancelled'))) as r
        from public.products p left join public.product_costs c on c.product_id = p.id
        where p.shop_id = sid) t)
  );
end $$;

-- Tendances de la plateforme (agrégats anonymes) : catégories qui progressent, offre disponible, recherches mal couvertes.
create or replace function public.ai_market_insights() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'categories', (select coalesce(jsonb_agg(c order by (c ->> 'views')::int desc), '[]'::jsonb) from (
        select jsonb_build_object('id', cat.id, 'name', cat.name, 'domain_id', cat.domain_id,
          'views', count(e.id) filter (where e.created_at >= now() - interval '30 days'),
          'views_prev', count(e.id) filter (where e.created_at >= now() - interval '60 days' and e.created_at < now() - interval '30 days'),
          'supply', (select count(*) from public.products p2 join public.shops s2 on s2.id = p2.shop_id
                     where p2.category_id = cat.id and p2.status = 'published' and s2.is_published and public.shop_can_manage(s2.id)),
          'orders', (select count(distinct o.id) from public.orders o join public.order_items oi on oi.order_id = o.id
                     join public.products p3 on p3.id = oi.product_id
                     where p3.category_id = cat.id and o.created_at >= now() - interval '30 days' and o.status not in ('refused', 'cancelled'))) c
        from public.categories cat
        left join public.products p on p.category_id = cat.id
        left join public.events e on e.product_id = p.id and e.type = 'product_view' and e.created_at >= now() - interval '60 days'
        where cat.active group by cat.id, cat.name, cat.domain_id) x
      where (c ->> 'views')::int > 0 or (c ->> 'orders')::int > 0 or (c ->> 'views_prev')::int > 0),
    'unmet_searches', (select coalesce(jsonb_agg(jsonb_build_object('term', term, 'count', n, 'avg_results', avg_results) order by n desc), '[]'::jsonb) from (
        select term, count(*) as n, round(avg(results), 1) as avg_results from public.search_log
        where created_at >= now() - interval '30 days' group by term having avg(results) < 3 order by count(*) desc limit 15) s),
    'total_events_30d', (select count(*) from public.events where created_at >= now() - interval '30 days')
  )
$$;

-- Concurrence : prix publics des autres boutiques actives dans les mêmes catégories que mes produits.
create or replace function public.ai_competitor_insights() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare sid uuid := public.my_shop_id(); v_domain int;
begin
  if sid is null then raise exception 'AUCUNE_BOUTIQUE'; end if;
  select domain_id into v_domain from public.shops where id = sid;
  return jsonb_build_object(
    'by_category', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select jsonb_build_object('category_id', cat.id, 'category', cat.name,
          'my_count', count(*) filter (where p.shop_id = sid),
          'my_median', percentile_cont(0.5) within group (order by p.price) filter (where p.shop_id = sid),
          'market_count', count(*) filter (where p.shop_id <> sid),
          'market_min', min(p.price) filter (where p.shop_id <> sid),
          'market_median', percentile_cont(0.5) within group (order by p.price) filter (where p.shop_id <> sid),
          'market_max', max(p.price) filter (where p.shop_id <> sid),
          'market_promos', count(*) filter (where p.shop_id <> sid and p.compare_at_price > p.price),
          'shops', count(distinct p.shop_id) filter (where p.shop_id <> sid)) as x
        from public.products p join public.shops s on s.id = p.shop_id join public.categories cat on cat.id = p.category_id
        where p.status = 'published' and (p.shop_id = sid or (s.is_published and public.shop_can_manage(s.id)))
          and p.category_id in (select category_id from public.products where shop_id = sid and category_id is not null)
        group by cat.id, cat.name) t),
    'missing_categories', (select coalesce(jsonb_agg(jsonb_build_object('category_id', cat.id, 'category', cat.name, 'offers', n) order by n desc), '[]'::jsonb) from (
        select p.category_id, count(*) as n from public.products p join public.shops s on s.id = p.shop_id
        where p.status = 'published' and p.shop_id <> sid and s.domain_id = v_domain and s.is_published and public.shop_can_manage(s.id)
          and p.category_id not in (select category_id from public.products where shop_id = sid and category_id is not null)
        group by p.category_id order by count(*) desc limit 8) m join public.categories cat on cat.id = m.category_id),
    'shops', (select coalesce(jsonb_agg(jsonb_build_object('name', s.name, 'slug', s.slug, 'products', n, 'verified', s.verified_at is not null) order by n desc), '[]'::jsonb) from (
        select s.id, count(p.id) as n from public.shops s join public.products p on p.shop_id = s.id and p.status = 'published'
        where s.domain_id = v_domain and s.id <> sid and s.is_published and public.shop_can_manage(s.id) group by s.id order by count(p.id) desc limit 8) c
        join public.shops s on s.id = c.id)
  );
end $$;

-- ───────────────────────── Plan d'action ─────────────────────────
create table if not exists public.ai_actions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  kind text not null,
  ref text not null default '',
  title text not null,
  body text not null default '',
  link text,
  priority int not null default 2 check (priority between 1 and 3),
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'refused', 'postponed', 'done')),
  week date not null default date_trunc('week', now())::date,
  postponed_until date,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (shop_id, kind, ref, week)
);
create index if not exists ai_actions_shop on public.ai_actions (shop_id, created_at desc);
alter table public.ai_actions enable row level security;
create policy owner_read on public.ai_actions for select using (public.is_shop_owner(shop_id));
revoke insert, update, delete on public.ai_actions from anon, authenticated;

-- Génère les recommandations de la semaine à partir des données réelles de la boutique (aucune donnée inventée).
create or replace function public.generate_action_plan() returns int
language plpgsql security definer set search_path = public as $$
declare sid uuid := public.my_shop_id(); n int := 0; r record; wk date := date_trunc('week', now())::date;
begin
  if sid is null then raise exception 'AUCUNE_BOUTIQUE'; end if;
  if public.feature_level('action_plan') = 'none' then raise exception 'FONCTION_NON_INCLUSE'; end if;

  -- Commandes en attente de réponse depuis plus de 24 h
  for r in select count(*) as c from public.orders where shop_id = sid and status = 'pending' and created_at < now() - interval '24 hours' having count(*) > 0 loop
    insert into public.ai_actions (shop_id, kind, ref, title, body, link, priority, week)
    values (sid, 'pending_orders', '', 'Répondre aux commandes en attente',
      r.c || ' commande(s) attendent votre réponse depuis plus de 24 h. Une réponse rapide améliore votre badge « Très réactif ».', '/vendeur/commandes?statut=pending', 1, wk)
    on conflict do nothing; n := n + 1;
  end loop;

  -- Fiches à améliorer (qualité < 70), les 3 plus consultées d'abord
  for r in select p.id, p.title, p.quality_score from public.products p where p.shop_id = sid and p.status = 'published' and p.quality_score < 70
           order by (select count(*) from public.events e where e.product_id = p.id and e.type = 'product_view' and e.created_at > now() - interval '30 days') desc limit 3 loop
    insert into public.ai_actions (shop_id, kind, ref, title, body, link, priority, week)
    values (sid, 'improve_listing', r.id::text, 'Améliorer la fiche « ' || r.title || ' »',
      'Qualité actuelle : ' || r.quality_score || '/100. Ajoutez des photos, précisez la description et la disponibilité.', '/vendeur/produits/' || r.id, 2, wk)
    on conflict do nothing; n := n + 1;
  end loop;

  -- Produits consultés mais jamais commandés sur 30 jours
  for r in select p.id, p.title, v.c from public.products p
           join lateral (select count(*) as c from public.events e where e.product_id = p.id and e.type = 'product_view' and e.created_at > now() - interval '30 days') v on true
           where p.shop_id = sid and p.status = 'published' and v.c >= 10
             and not exists (select 1 from public.order_items oi join public.orders o on o.id = oi.order_id where oi.product_id = p.id and o.created_at > now() - interval '30 days')
           order by v.c desc limit 2 loop
    insert into public.ai_actions (shop_id, kind, ref, title, body, link, priority, week)
    values (sid, 'views_no_orders', r.id::text, 'Comprendre pourquoi « ' || r.title || ' » ne se vend pas',
      r.c || ' consultations en 30 jours, aucune commande. Vérifiez le prix, les photos et les frais de livraison.', '/vendeur/ia/ventes', 2, wk)
    on conflict do nothing; n := n + 1;
  end loop;

  -- Stock faible ou rupture sur un produit qui se vend
  for r in select p.id, p.title, p.stock from public.products p where p.shop_id = sid and p.status = 'published'
           and (p.availability = 'out_of_stock' or (p.stock is not null and p.stock <= 2))
           and exists (select 1 from public.order_items oi join public.orders o on o.id = oi.order_id where oi.product_id = p.id and o.created_at > now() - interval '60 days')
           limit 3 loop
    insert into public.ai_actions (shop_id, kind, ref, title, body, link, priority, week)
    values (sid, 'restock', r.id::text, 'Vérifier le stock de « ' || r.title || ' »',
      case when r.stock is null then 'Produit indiqué en rupture alors qu''il s''est vendu récemment.' else 'Il reste ' || r.stock || ' unité(s) d''un produit qui se vend.' end,
      '/vendeur/produits/' || r.id, 1, wk)
    on conflict do nothing; n := n + 1;
  end loop;

  -- Produits sans coût d'achat renseigné (impossible de calculer la marge)
  if exists (select 1 from public.products p where p.shop_id = sid and p.status = 'published'
             and not exists (select 1 from public.product_costs c where c.product_id = p.id)) then
    insert into public.ai_actions (shop_id, kind, ref, title, body, link, priority, week)
    values (sid, 'add_costs', '', 'Renseigner vos coûts d''achat',
      'Sans coût d''achat, Shoppy AI ne peut pas calculer vos marges. Ces informations restent privées.', '/vendeur/ia/prix', 3, wk)
    on conflict do nothing; n := n + 1;
  end if;

  -- Promotion à tester sur le produit le plus consulté sans réduction
  for r in select p.id, p.title from public.products p where p.shop_id = sid and p.status = 'published' and p.compare_at_price is null
           order by (select count(*) from public.events e where e.product_id = p.id and e.type = 'product_view' and e.created_at > now() - interval '30 days') desc limit 1 loop
    insert into public.ai_actions (shop_id, kind, ref, title, body, link, priority, week)
    values (sid, 'promote', r.id::text, 'Préparer une publicité pour « ' || r.title || ' »',
      'C''est votre produit le plus consulté. Préparez un texte WhatsApp ou Facebook avec Shoppy AI.', '/vendeur/ia/publicite?produit=' || r.id, 3, wk)
    on conflict do nothing; n := n + 1;
  end loop;

  return n;
end $$;

create or replace function public.set_ai_action_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('accepted', 'refused', 'postponed', 'done', 'proposed') then raise exception 'STATUT_INVALIDE'; end if;
  update public.ai_actions set status = p_status, decided_at = now(),
    postponed_until = case when p_status = 'postponed' then (now() + interval '7 days')::date end
  where id = p_id and shop_id = public.my_shop_id();
  if not found then raise exception 'ACTION_INTROUVABLE'; end if;
end $$;

-- ───────────────────────── Administration de l'IA ─────────────────────────
create or replace function public.admin_set_plan_feature(p_plan text, p_feature text, p_level text, p_quota int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'INTERDIT'; end if;
  if p_level not in ('none', 'basic', 'full', 'advanced') then raise exception 'NIVEAU_INVALIDE'; end if;
  if p_quota is not null and (p_quota < 0 or p_quota > 100000) then raise exception 'QUOTA_INVALIDE'; end if;
  insert into public.plan_features (plan_code, feature, level, monthly_quota) values (p_plan, p_feature, p_level, p_quota)
  on conflict (plan_code, feature) do update set level = excluded.level, monthly_quota = excluded.monthly_quota;
end $$;

create or replace function public.admin_set_ai_module(p_feature text, p_enabled boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'INTERDIT'; end if;
  update public.ai_modules set enabled = p_enabled, updated_at = now() where feature = p_feature;
  if not found then raise exception 'MODULE_INTROUVABLE'; end if;
end $$;

create or replace function public.admin_ai_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'INTERDIT'; end if;
  return jsonb_build_object(
    'month_calls', (select count(*) from public.ai_usage where status = 'ok' and created_at >= date_trunc('month', now())),
    'month_errors', (select count(*) from public.ai_usage where status = 'error' and created_at >= date_trunc('month', now())),
    'month_cost_usd', (select coalesce(sum(cost_usd), 0) from public.ai_usage where created_at >= date_trunc('month', now())),
    'by_feature', (select coalesce(jsonb_agg(jsonb_build_object('feature', feature, 'calls', n, 'cost_usd', c)), '[]'::jsonb) from (
        select feature, count(*) as n, sum(cost_usd) as c from public.ai_usage where created_at >= date_trunc('month', now()) and status = 'ok' group by feature) f),
    'top_shops', (select coalesce(jsonb_agg(jsonb_build_object('shop', s.name, 'calls', n, 'cost_usd', c) order by c desc), '[]'::jsonb) from (
        select shop_id, count(*) as n, sum(cost_usd) as c from public.ai_usage where created_at >= date_trunc('month', now()) group by shop_id order by sum(cost_usd) desc limit 10) u
        join public.shops s on s.id = u.shop_id)
  );
end $$;

-- ───────────────────────── Droits d'exécution ─────────────────────────
do $$ declare f text; begin
  foreach f in array array[
    'public.shop_plan(uuid)', 'public.my_plan()', 'public.feature_level(text)', 'public.ai_reserve(text, text, text)',
    'public.ai_finalize(bigint, boolean, text, int, int, numeric, jsonb, text)', 'public.ai_usage_summary()',
    'public.ai_sales_insights(int)', 'public.ai_market_insights()', 'public.ai_competitor_insights()',
    'public.generate_action_plan()', 'public.set_ai_action_status(uuid, text)',
    'public.admin_set_plan_feature(text, text, text, int)', 'public.admin_set_ai_module(text, boolean)', 'public.admin_ai_overview()',
    'public.admin_review_subscription_payment(uuid, boolean, int)']
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
