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
