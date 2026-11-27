-- Shoppy by MSD — sécurité au niveau des lignes (RLS). Chaque table est fermée par défaut.

alter table public.countries enable row level security;
alter table public.regions enable row level security;
alter table public.domains enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.shops enable row level security;
alter table public.shop_specialties enable row level security;
alter table public.shop_delivery_zones enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.favorite_products enable row level security;
alter table public.favorite_shops enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.reviews enable row level security;
alter table public.events enable row level security;
alter table public.notifications enable row level security;
alter table public.assistant_progress enable row level security;
alter table public.support_tickets enable row level security;

-- Référentiels : lecture publique, écriture réservée à l'administration de la plateforme
create policy read_all on public.countries for select using (true);
create policy read_all on public.regions for select using (true);
create policy read_all on public.domains for select using (true);
create policy read_all on public.categories for select using (true);
create policy read_all on public.subscription_plans for select using (true);
create policy admin_write on public.domains for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy admin_write on public.categories for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy admin_write on public.subscription_plans for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Profils : chacun le sien. is_platform_admin n'est jamais modifiable par l'utilisateur.
create policy own_select on public.profiles for select using (id = auth.uid());
create policy own_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url, notify_promotions) on public.profiles to authenticated;

create policy own_all on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Boutiques : vitrine publique si visible ; le propriétaire voit et modifie la sienne
create policy public_read on public.shops for select using (public.shop_is_public(id) or owner_id = auth.uid());
create policy owner_update on public.shops for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
revoke insert, update, delete on public.shops from anon, authenticated;
grant update (name, logo_url, cover_url, description, domain_id, country_code, region, city, address_public,
              public_phone, public_whatsapp, public_email, return_policy, is_published) on public.shops to authenticated;

create policy public_read on public.shop_specialties for select using (public.shop_is_public(shop_id) or public.is_shop_owner(shop_id));
create policy owner_write on public.shop_specialties for all
  using (public.is_shop_owner(shop_id)) with check (public.is_shop_owner(shop_id) and public.shop_can_manage(shop_id));

create policy public_read on public.shop_delivery_zones for select using (public.shop_is_public(shop_id) or public.is_shop_owner(shop_id));
create policy owner_write on public.shop_delivery_zones for all
  using (public.is_shop_owner(shop_id)) with check (public.is_shop_owner(shop_id) and public.shop_can_manage(shop_id));

-- Abonnements : lecture par le propriétaire ; aucune écriture directe (fonctions dédiées uniquement)
create policy owner_read on public.subscriptions for select using (public.is_shop_owner(shop_id) or public.is_platform_admin());
revoke insert, update, delete on public.subscriptions from anon, authenticated;
create policy owner_read on public.subscription_payments for select using (public.is_shop_owner(shop_id) or public.is_platform_admin());
revoke insert, update, delete on public.subscription_payments from anon, authenticated;

-- Produits : publiés et boutique visible → public ; le vendeur gère les siens tant que son abonnement est actif
create policy public_read on public.products for select
  using ((status = 'published' and public.shop_is_public(shop_id)) or public.is_shop_owner(shop_id));
create policy owner_insert on public.products for insert
  with check (public.is_shop_owner(shop_id) and public.shop_can_manage(shop_id));
create policy owner_update on public.products for update
  using (public.is_shop_owner(shop_id)) with check (public.is_shop_owner(shop_id) and public.shop_can_manage(shop_id));
create policy owner_delete on public.products for delete using (public.is_shop_owner(shop_id) and public.shop_can_manage(shop_id));
revoke update on public.products from anon, authenticated;
grant update (title, description, price, compare_at_price, category_id, sku, status, availability, stock) on public.products to authenticated;
revoke insert on public.products from anon, authenticated;
grant insert (shop_id, title, description, price, compare_at_price, category_id, sku, status, availability, stock) on public.products to authenticated;

create policy public_read on public.product_images for select using (exists(
  select 1 from public.products p where p.id = product_id and ((p.status = 'published' and public.shop_is_public(p.shop_id)) or public.is_shop_owner(p.shop_id))));
create policy owner_write on public.product_images for all
  using (exists(select 1 from public.products p where p.id = product_id and public.is_shop_owner(p.shop_id)))
  with check (exists(select 1 from public.products p where p.id = product_id and public.is_shop_owner(p.shop_id) and public.shop_can_manage(p.shop_id)));

create policy public_read on public.product_variants for select using (exists(
  select 1 from public.products p where p.id = product_id and ((p.status = 'published' and public.shop_is_public(p.shop_id)) or public.is_shop_owner(p.shop_id))));
create policy owner_write on public.product_variants for all
  using (exists(select 1 from public.products p where p.id = product_id and public.is_shop_owner(p.shop_id)))
  with check (exists(select 1 from public.products p where p.id = product_id and public.is_shop_owner(p.shop_id) and public.shop_can_manage(p.shop_id)));

-- Favoris
create policy own_all on public.favorite_products for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_all on public.favorite_shops for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Commandes : l'acheteur voit les siennes, le vendeur celles de sa boutique. Écriture : fonctions uniquement.
create policy party_read on public.orders for select using (buyer_id = auth.uid() or public.is_shop_owner(shop_id));
revoke insert, update, delete on public.orders from anon, authenticated;
create policy party_read on public.order_items for select using (exists(
  select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or public.is_shop_owner(o.shop_id))));
revoke insert, update, delete on public.order_items from anon, authenticated;
create policy party_read on public.order_events for select using (exists(
  select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or public.is_shop_owner(o.shop_id))));
revoke insert, update, delete on public.order_events from anon, authenticated;

-- Avis : publics, création via submit_review uniquement
create policy public_read on public.reviews for select using (true);
revoke insert, update, delete on public.reviews from anon, authenticated;

-- Statistiques brutes : aucun accès direct (track_event / seller_stats)
revoke all on public.events from anon, authenticated;

-- Notifications : chacun les siennes, seule la date de lecture est modifiable
create policy own_read on public.notifications for select using (user_id = auth.uid());
create policy own_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_delete on public.notifications for delete using (user_id = auth.uid());
revoke insert, update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy own_all on public.assistant_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Assistance : tout le monde peut écrire (y compris sans compte), chacun relit les siens
create policy anyone_insert on public.support_tickets for insert
  with check (user_id is null or user_id = auth.uid());
create policy own_read on public.support_tickets for select using (user_id = auth.uid());
revoke update, delete on public.support_tickets from anon, authenticated;

-- Fonctions réservées : PostgreSQL accorde EXECUTE à PUBLIC par défaut, on le retire explicitement.
do $$
declare f text;
begin
  foreach f in array array[
    'public.create_shop(text, text, int, int[], text, text, text, text, text, text, text)',
    'public.place_orders(jsonb, jsonb)',
    'public.set_order_status(uuid, public.order_status, text)',
    'public.submit_review(uuid, int, text)',
    'public.seller_stats(int)',
    'public.declare_subscription_payment(text, text, text, int)',
    'public.delete_my_account()',
    'public.publish_product(uuid)',
    'public.admin_review_subscription_payment(uuid, boolean, int)',
    'public.admin_set_shop_verified(uuid, boolean)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
  foreach f in array array['public.restock_order(uuid)', 'public.compute_product_quality(uuid)', 'public.unique_slug(text, text)'] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
