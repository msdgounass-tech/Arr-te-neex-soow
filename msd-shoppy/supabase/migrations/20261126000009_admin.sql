-- Administration de la plateforme (réservée aux profils is_platform_admin = true).
-- Lecture complète des données d'activité ; actions passant par des fonctions contrôlées.
do $$
declare t text;
begin
  foreach t in array array['shops', 'shop_specialties', 'shop_delivery_zones', 'products', 'product_images', 'product_variants',
                           'orders', 'order_items', 'order_events', 'profiles', 'support_tickets'] loop
    execute format('create policy admin_read on public.%I for select using (public.is_platform_admin())', t);
  end loop;
end $$;

create or replace function public.admin_guard() returns void
language plpgsql stable security definer set search_path = public as $$
begin if not public.is_platform_admin() then raise exception 'INTERDIT'; end if; end $$;

create or replace function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare res jsonb;
begin
  perform public.admin_guard();
  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'users_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'shops', (select count(*) from public.shops),
    'shops_demo', (select count(*) from public.shops where is_demo),
    'shops_public', (select count(*) from public.shops s where public.shop_is_public(s.id)),
    'sub_trial', (select count(*) from public.subscriptions s where public.subscription_effective_status(s) = 'trial'),
    'sub_active', (select count(*) from public.subscriptions s where public.subscription_effective_status(s) = 'active'),
    'sub_pending', (select count(*) from public.subscriptions s where public.subscription_effective_status(s) = 'pending_payment'),
    'sub_expired', (select count(*) from public.subscriptions s where public.subscription_effective_status(s) = 'expired'),
    'sub_suspended', (select count(*) from public.subscriptions s where public.subscription_effective_status(s) = 'suspended'),
    'payments_pending', (select count(*) from public.subscription_payments where status = 'pending'),
    'products', (select count(*) from public.products),
    'products_published', (select count(*) from public.products where status = 'published'),
    'orders', (select count(*) from public.orders),
    'orders_7d', (select count(*) from public.orders where created_at > now() - interval '7 days'),
    'orders_pending', (select count(*) from public.orders where status = 'pending'),
    'orders_in_progress', (select count(*) from public.orders where status in ('confirmed', 'preparing', 'shipped', 'delivered')),
    'orders_completed', (select count(*) from public.orders where status = 'completed'),
    'orders_cancelled', (select count(*) from public.orders where status in ('cancelled', 'refused')),
    'sales_completed', (select coalesce(sum(total), 0) from public.orders where status = 'completed'),
    'reviews', (select count(*) from public.reviews),
    'tickets_open', (select count(*) from public.support_tickets where status = 'open')
  ) into res;
  return res;
end $$;

create or replace function public.admin_users(p_search text default null, p_limit int default 100)
returns table (id uuid, email text, full_name text, phone text, created_at timestamptz, last_sign_in_at timestamptz,
               is_admin boolean, shop_name text, shop_slug text, orders_count bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.admin_guard();
  return query
  select p.id, u.email::text, p.full_name, p.phone, p.created_at, u.last_sign_in_at, p.is_platform_admin, s.name, s.slug,
         (select count(*) from public.orders o where o.buyer_id = p.id)
  from public.profiles p join auth.users u on u.id = p.id left join public.shops s on s.owner_id = p.id
  where p_search is null or trim(p_search) = '' or u.email ilike '%' || trim(p_search) || '%' or p.full_name ilike '%' || trim(p_search) || '%'
  order by p.created_at desc limit least(greatest(p_limit, 1), 500);
end $$;

-- Abonnement : suspendre, activer pour N jours, prolonger l'essai de N jours
create or replace function public.admin_set_subscription(p_shop uuid, p_action text, p_days int default 30) returns void
language plpgsql security definer set search_path = public as $$
declare owner uuid; msg text;
begin
  perform public.admin_guard();
  select owner_id into owner from public.shops where id = p_shop;
  if owner is null then raise exception 'BOUTIQUE_INTROUVABLE'; end if;
  if p_action = 'suspend' then
    update public.subscriptions set status = 'suspended', updated_at = now() where shop_id = p_shop;
    msg := 'Votre compte vendeur a été suspendu. Contactez l''assistance pour en savoir plus.';
  elsif p_action = 'activate' then
    update public.subscriptions set status = 'active', current_period_end = greatest(now(), coalesce(current_period_end, now())) + make_interval(days => greatest(p_days, 1)),
      updated_at = now() where shop_id = p_shop;
    msg := 'Votre abonnement est actif pour ' || greatest(p_days, 1) || ' jours.';
  elsif p_action = 'extend_trial' then
    update public.subscriptions set status = 'trial', trial_ends_at = greatest(now(), trial_ends_at) + make_interval(days => greatest(p_days, 1)), updated_at = now() where shop_id = p_shop;
    msg := 'Votre essai gratuit a été prolongé de ' || greatest(p_days, 1) || ' jours.';
  else raise exception 'ACTION_INVALIDE';
  end if;
  insert into public.notifications (user_id, kind, title, body, link) values (owner, 'subscription', 'Abonnement mis à jour', msg, '/vendeur/abonnement');
end $$;

create or replace function public.admin_set_product_status(p_product uuid, p_status public.product_status) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_guard();
  if p_status not in ('hidden', 'published') then raise exception 'ACTION_INVALIDE'; end if;
  update public.products set status = p_status where id = p_product;
end $$;

create or replace function public.admin_set_ticket_status(p_ticket uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_guard();
  if p_status not in ('open', 'closed') then raise exception 'ACTION_INVALIDE'; end if;
  update public.support_tickets set status = p_status where id = p_ticket;
end $$;

do $$
declare f text;
begin
  foreach f in array array['public.admin_overview()', 'public.admin_users(text, int)', 'public.admin_set_subscription(uuid, text, int)',
                           'public.admin_set_product_status(uuid, public.product_status)', 'public.admin_set_ticket_status(uuid, text)', 'public.admin_guard()'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;
