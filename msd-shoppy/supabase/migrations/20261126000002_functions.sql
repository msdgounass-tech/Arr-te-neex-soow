-- MSD Shoppy — fonctions métier. Toute opération sensible passe par ici (prix, stock, statuts, abonnements).

-- ───────────────────────── Utilitaires ─────────────────────────
create or replace function public.slugify(txt text) returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(txt, ''))), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.unique_slug(base text, tbl text) returns text
language plpgsql as $$
declare s text := left(nullif(public.slugify(base), ''), 60); candidate text; taken boolean;
begin
  s := coalesce(s, 'element');
  candidate := s;
  for i in 1..20 loop
    execute format('select exists(select 1 from public.%I where slug = $1)', tbl) into taken using candidate;
    if not taken then return candidate; end if;
    candidate := s || '-' || substr(md5(random()::text), 1, 5);
  end loop;
  raise exception 'SLUG_INDISPONIBLE';
end $$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from public.profiles where id = auth.uid()), false)
$$;

-- ───────────────────────── Profils ─────────────────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── Abonnements : état effectif ─────────────────────────
-- L'état stocké peut être « en retard » (essai terminé) : l'état effectif est calculé à la volée.
create or replace function public.subscription_effective_status(s public.subscriptions)
returns public.subscription_status language sql stable as $$
  select case
    when s.status = 'suspended' then 'suspended'::public.subscription_status
    when s.status = 'pending_payment' then 'pending_payment'::public.subscription_status
    when s.status = 'active' and s.current_period_end > now() then 'active'::public.subscription_status
    when s.status = 'trial' and s.trial_ends_at > now() then 'trial'::public.subscription_status
    else 'expired'::public.subscription_status
  end
$$;

create or replace function public.shop_can_manage(p_shop uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select public.subscription_effective_status(s) in ('trial', 'active')
                   from public.subscriptions s where s.shop_id = p_shop), false)
$$;

create or replace function public.shop_is_public(p_shop uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select sh.is_published and public.shop_can_manage(sh.id) from public.shops sh where sh.id = p_shop), false)
$$;

create or replace function public.is_shop_owner(p_shop uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.shops where id = p_shop and owner_id = auth.uid())
$$;

create or replace function public.my_shop_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.shops where owner_id = auth.uid()
$$;

-- ───────────────────────── Création de boutique ─────────────────────────
create or replace function public.create_shop(
  p_name text, p_description text, p_domain_id int, p_specialties int[],
  p_country text, p_region text, p_city text,
  p_public_phone text, p_public_whatsapp text, p_public_email text, p_logo_url text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); new_id uuid;
begin
  if uid is null then raise exception 'NON_CONNECTE'; end if;
  if exists(select 1 from public.shops where owner_id = uid) then raise exception 'BOUTIQUE_EXISTANTE'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'NOM_INVALIDE'; end if;
  if not exists(select 1 from public.domains where id = p_domain_id and active) then raise exception 'DOMAINE_INVALIDE'; end if;
  if coalesce(nullif(trim(p_public_phone), ''), nullif(trim(p_public_whatsapp), '')) is null then raise exception 'CONTACT_REQUIS'; end if;

  insert into public.shops (owner_id, slug, name, description, domain_id, country_code, region, city,
                            public_phone, public_whatsapp, public_email, logo_url)
  values (uid, public.unique_slug(p_name, 'shops'), trim(p_name), coalesce(trim(p_description), ''), p_domain_id,
          coalesce(p_country, 'SN'), p_region, p_city,
          nullif(trim(p_public_phone), ''), nullif(trim(p_public_whatsapp), ''), nullif(trim(p_public_email), ''), p_logo_url)
  returning id into new_id;

  insert into public.shop_specialties (shop_id, category_id)
  select new_id, c.id from public.categories c where c.id = any(coalesce(p_specialties, '{}')) and c.active
  on conflict do nothing;

  insert into public.subscriptions (shop_id, status, trial_ends_at) values (new_id, 'trial', now() + interval '7 days');

  insert into public.notifications (user_id, kind, title, body, link)
  values (uid, 'subscription', 'Votre essai gratuit de 7 jours commence',
          'Profitez de toutes les fonctions vendeur pendant 7 jours. Vos données restent conservées après l''essai.', '/vendeur/abonnement');
  return new_id;
end $$;

-- ───────────────────────── Qualité de présentation des produits ─────────────────────────
-- Règles identiques à src/lib/quality.ts (test de cohérence : tests/unit/quality.test.ts + tests/db).
create or replace function public.compute_product_quality(p_product uuid) returns int
language plpgsql stable security definer set search_path = public as $$
declare p public.products; n_img int; min_w int; has_variant_stock boolean; score int := 0; tl int; dl int;
begin
  select * into p from public.products where id = p_product;
  if not found then return 0; end if;
  select count(*), coalesce(min(width), 0) into n_img, min_w from public.product_images where product_id = p_product;
  select exists(select 1 from public.product_variants where product_id = p_product and active and stock is not null) into has_variant_stock;
  tl := char_length(trim(p.title)); dl := char_length(trim(p.description));
  -- Photos (30)
  score := score + case when n_img >= 3 then 25 when n_img = 2 then 20 when n_img = 1 then 12 else 0 end;
  if n_img > 0 and min_w >= 800 then score := score + 5; end if;
  -- Titre (15)
  score := score + case when tl between 15 and 80 then 15 when tl >= 8 then 8 when tl >= 3 then 3 else 0 end;
  -- Description (25)
  score := score + case when dl >= 200 then 25 when dl >= 80 then 15 when dl >= 20 then 7 else 0 end;
  -- Prix (10), catégorie (10)
  if p.price > 0 then score := score + 10; end if;
  if p.category_id is not null then score := score + 10; end if;
  -- Disponibilité (10)
  score := score + case when p.availability <> 'in_stock' or p.stock is not null or has_variant_stock then 10 else 5 end;
  return least(score, 100);
end $$;

create or replace function public.refresh_product_quality() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products set quality_score = public.compute_product_quality(pid) where id = pid;
  return null;
end $$;

-- Règles de publication (bloquantes) + index de recherche + score
create or replace function public.products_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.slug := public.unique_slug(new.title, 'products');
  end if;
  new.search_text := lower(extensions.unaccent('extensions.unaccent'::regdictionary, new.title || ' ' || coalesce(new.sku, '')));
  new.search_vector :=
    setweight(to_tsvector('simple', lower(extensions.unaccent('extensions.unaccent'::regdictionary, new.title))), 'A') ||
    setweight(to_tsvector('simple', lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(new.description, '')))), 'B');
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at := coalesce(new.published_at, now());
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger products_before_write before insert or update on public.products
  for each row execute function public.products_before_write();

create or replace function public.products_after_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare q int;
begin
  q := public.compute_product_quality(new.id);
  if q is distinct from new.quality_score then
    update public.products set quality_score = q where id = new.id;
  end if;
  return null;
end $$;
create trigger products_after_write after insert or update of title, description, price, category_id, availability, stock on public.products
  for each row execute function public.products_after_write();
create trigger product_images_quality after insert or update or delete on public.product_images
  for each row execute function public.refresh_product_quality();
create trigger product_variants_quality after insert or update or delete on public.product_variants
  for each row execute function public.refresh_product_quality();

-- Publication : informations obligatoires (le reste n'est qu'une recommandation)
create or replace function public.publish_product(p_product uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p public.products;
begin
  select * into p from public.products where id = p_product;
  if not found or not public.is_shop_owner(p.shop_id) then raise exception 'INTERDIT'; end if;
  if not public.shop_can_manage(p.shop_id) then raise exception 'ABONNEMENT_INACTIF'; end if;
  if p.category_id is null then raise exception 'CATEGORIE_REQUISE'; end if;
  if not exists(select 1 from public.product_images where product_id = p_product) then raise exception 'PHOTO_REQUISE'; end if;
  update public.products set status = 'published' where id = p_product;
end $$;

create or replace function public.products_guard_publish() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    if new.category_id is null then raise exception 'CATEGORIE_REQUISE'; end if;
    if tg_op = 'INSERT' or not exists(select 1 from public.product_images where product_id = new.id) then
      raise exception 'PHOTO_REQUISE';
    end if;
  end if;
  return new;
end $$;
create trigger products_guard_publish before insert or update of status on public.products
  for each row execute function public.products_guard_publish();

-- ───────────────────────── Commandes ─────────────────────────
-- p_items : [{product_id, variant_id?, quantity}] ; p_delivery : {recipient_name, phone, region, city, address_details, note,
--            payment_method, zones: {shop_id: zone_id}}
-- Crée une commande par boutique. Prix, stock et frais sont relus en base, jamais pris du navigateur.
create or replace function public.place_orders(p_items jsonb, p_delivery jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  it jsonb; p public.products; v public.product_variants; sh public.shops; z public.shop_delivery_zones;
  qty int; unit int; label text; img text;
  shop_ids uuid[]; sid uuid; oid uuid; num text; sub int; result jsonb := '[]'::jsonb; zone_id uuid;
begin
  if uid is null then raise exception 'NON_CONNECTE'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'PANIER_VIDE'; end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'PANIER_TROP_GRAND'; end if;
  if char_length(trim(coalesce(p_delivery ->> 'recipient_name', ''))) < 2 then raise exception 'NOM_REQUIS'; end if;
  if char_length(regexp_replace(coalesce(p_delivery ->> 'phone', ''), '\D', '', 'g')) < 9 then raise exception 'TELEPHONE_INVALIDE'; end if;
  if coalesce(trim(p_delivery ->> 'region'), '') = '' or coalesce(trim(p_delivery ->> 'city'), '') = '' then raise exception 'ADRESSE_REQUISE'; end if;

  select array_agg(distinct pr.shop_id) into shop_ids
  from jsonb_array_elements(p_items) e join public.products pr on pr.id = (e ->> 'product_id')::uuid;
  if shop_ids is null then raise exception 'PRODUIT_INTROUVABLE'; end if;

  foreach sid in array shop_ids loop
    select * into sh from public.shops where id = sid for share;
    if sh.owner_id = uid then raise exception 'ACHAT_PROPRE_BOUTIQUE'; end if;
    if not public.shop_is_public(sid) then raise exception 'BOUTIQUE_INDISPONIBLE'; end if;

    num := 'MS-' || to_char(now() at time zone 'Africa/Dakar', 'YYMMDD') || '-' || nextval('public.order_number_seq');
    insert into public.orders (number, buyer_id, shop_id, subtotal, total, recipient_name, phone, region, city,
                               address_details, note, payment_method)
    values (num, uid, sid, 0, 0, trim(p_delivery ->> 'recipient_name'), trim(p_delivery ->> 'phone'),
            trim(p_delivery ->> 'region'), trim(p_delivery ->> 'city'), coalesce(trim(p_delivery ->> 'address_details'), ''),
            left(coalesce(trim(p_delivery ->> 'note'), ''), 500), coalesce(p_delivery ->> 'payment_method', 'cash_on_delivery'))
    returning id into oid;

    sub := 0;
    for it in select * from jsonb_array_elements(p_items) loop
      select * into p from public.products where id = (it ->> 'product_id')::uuid and shop_id = sid for update;
      continue when not found;
      if p.status <> 'published' then raise exception 'PRODUIT_INDISPONIBLE:%', p.title; end if;
      if p.availability = 'out_of_stock' then raise exception 'RUPTURE:%', p.title; end if;
      qty := greatest(1, least(99, coalesce((it ->> 'quantity')::int, 1)));
      unit := p.price; label := null; v := null;
      if nullif(it ->> 'variant_id', '') is not null then
        select * into v from public.product_variants where id = (it ->> 'variant_id')::uuid and product_id = p.id and active for update;
        if not found then raise exception 'VARIANTE_INDISPONIBLE:%', p.title; end if;
        unit := coalesce(v.price, p.price);
        label := concat_ws(' · ', v.size, v.color, v.model);
        if v.stock is not null then
          if v.stock < qty then raise exception 'STOCK_INSUFFISANT:%', p.title; end if;
          update public.product_variants set stock = stock - qty where id = v.id;
        end if;
      elsif exists(select 1 from public.product_variants where product_id = p.id and active) then
        raise exception 'VARIANTE_REQUISE:%', p.title;
      elsif p.stock is not null then
        if p.stock < qty then raise exception 'STOCK_INSUFFISANT:%', p.title; end if;
        update public.products set stock = stock - qty where id = p.id;
      end if;
      select url into img from public.product_images where product_id = p.id order by position limit 1;
      insert into public.order_items (order_id, product_id, variant_id, title, variant_label, sku, image_url, unit_price, quantity, line_total)
      values (oid, p.id, v.id, p.title, nullif(label, ''), coalesce(v.sku, p.sku), img, unit, qty, unit * qty);
      sub := sub + unit * qty;
    end loop;

    zone_id := nullif(p_delivery -> 'zones' ->> sid::text, '')::uuid;
    z := null;
    if zone_id is not null then
      select * into z from public.shop_delivery_zones where id = zone_id and shop_id = sid and active;
    end if;
    update public.orders set subtotal = sub, delivery_zone_id = z.id,
      delivery_method = coalesce(z.method, 'delivery'), delivery_label = z.name,
      delivery_fee = z.fee, total = sub + coalesce(z.fee, 0)
    where id = oid;

    insert into public.order_events (order_id, status, actor) values (oid, 'pending', 'buyer');
    insert into public.notifications (user_id, kind, title, body, link)
    values (sh.owner_id, 'order', 'Nouvelle commande ' || num, 'Une nouvelle commande attend votre confirmation.', '/vendeur/commandes/' || oid);
    result := result || jsonb_build_object('id', oid, 'number', num, 'shop', sh.name);
  end loop;
  return result;
end $$;

-- Remise en stock (commande refusée ou annulée)
create or replace function public.restock_order(p_order uuid) returns void
language sql security definer set search_path = public as $$
  update public.product_variants v set stock = v.stock + oi.quantity
    from public.order_items oi where oi.order_id = p_order and oi.variant_id = v.id and v.stock is not null;
  update public.products p set stock = p.stock + oi.quantity
    from public.order_items oi where oi.order_id = p_order and oi.variant_id is null and oi.product_id = p.id and p.stock is not null;
$$;

-- Transitions autorisées.
--   Vendeur : pending→confirmed|refused, confirmed→preparing|cancelled, preparing→shipped, shipped→delivered, delivered→completed
--   Acheteur : pending|confirmed→cancelled, shipped|delivered→completed (réception confirmée)
create or replace function public.set_order_status(p_order uuid, p_status public.order_status, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders; actor text; ok boolean := false; owner uuid; msg text;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'COMMANDE_INTROUVABLE'; end if;
  select owner_id into owner from public.shops where id = o.shop_id;
  if auth.uid() = owner then actor := 'seller';
  elsif auth.uid() = o.buyer_id then actor := 'buyer';
  else raise exception 'INTERDIT'; end if;

  if actor = 'seller' then
    ok := (o.status, p_status) in (('pending','confirmed'), ('pending','refused'), ('confirmed','preparing'),
           ('confirmed','cancelled'), ('preparing','shipped'), ('preparing','cancelled'),
           ('shipped','delivered'), ('delivered','completed'));
  else
    ok := (o.status, p_status) in (('pending','cancelled'), ('confirmed','cancelled'), ('shipped','completed'), ('delivered','completed'));
  end if;
  if not ok then raise exception 'TRANSITION_INTERDITE'; end if;
  if p_status in ('refused', 'cancelled') and coalesce(trim(p_note), '') = '' and actor = 'seller' then
    raise exception 'MOTIF_REQUIS';
  end if;

  update public.orders set status = p_status, status_note = coalesce(nullif(trim(p_note), ''), status_note),
    responded_at = case when actor = 'seller' and responded_at is null then now() else responded_at end,
    completed_at = case when p_status = 'completed' then now() else completed_at end,
    cancelled_at = case when p_status in ('cancelled', 'refused') then now() else cancelled_at end
  where id = p_order;
  insert into public.order_events (order_id, status, actor, note) values (p_order, p_status, actor, nullif(trim(p_note), ''));
  if p_status in ('refused', 'cancelled') then perform public.restock_order(p_order); end if;

  msg := case p_status
    when 'confirmed' then 'a été confirmée par le vendeur'
    when 'refused' then 'a été refusée par le vendeur'
    when 'preparing' then 'est en préparation'
    when 'shipped' then 'a été expédiée'
    when 'delivered' then 'a été livrée'
    when 'completed' then 'est terminée'
    when 'cancelled' then 'a été annulée'
    else 'a changé de statut' end;
  if actor = 'seller' then
    insert into public.notifications (user_id, kind, title, body, link)
    values (o.buyer_id, 'order', 'Commande ' || o.number, 'Votre commande ' || msg || '.', '/compte/commandes/' || o.id);
  else
    insert into public.notifications (user_id, kind, title, body, link)
    values (owner, 'order', 'Commande ' || o.number, 'La commande ' || msg || ' par le client.', '/vendeur/commandes/' || o.id);
  end if;
end $$;

-- ───────────────────────── Avis (liés à une commande terminée) ─────────────────────────
create or replace function public.submit_review(p_order uuid, p_rating int, p_comment text) returns uuid
language plpgsql security definer set search_path = public as $$
declare o public.orders; rid uuid;
begin
  select * into o from public.orders where id = p_order;
  if not found or o.buyer_id <> auth.uid() then raise exception 'INTERDIT'; end if;
  if o.status <> 'completed' then raise exception 'COMMANDE_NON_TERMINEE'; end if;
  if p_rating not between 1 and 5 then raise exception 'NOTE_INVALIDE'; end if;
  insert into public.reviews (order_id, shop_id, buyer_id, rating, comment)
  values (p_order, o.shop_id, o.buyer_id, p_rating, left(coalesce(trim(p_comment), ''), 1000))
  returning id into rid;
  return rid;
end $$;

-- ───────────────────────── Confiance (calculée, jamais saisie) ─────────────────────────
create or replace function public.get_shop_trust(p_shop uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  sh public.shops; completed int; received int; responded_fast int; avg_hours numeric; n_reviews int; avg_rating numeric;
  email_ok boolean; days int; rate numeric; badges text[] := '{}';
begin
  select * into sh from public.shops where id = p_shop;
  if not found then return null; end if;
  select count(*) filter (where status = 'completed'),
         count(*) filter (where status <> 'cancelled' or responded_at is not null),
         count(*) filter (where responded_at is not null and responded_at <= created_at + interval '24 hours'),
         avg(extract(epoch from (responded_at - created_at)) / 3600) filter (where responded_at is not null)
    into completed, received, responded_fast, avg_hours
  from public.orders where shop_id = p_shop and (responded_at is not null or created_at < now() - interval '24 hours');
  select count(*), round(avg(rating)::numeric, 1) into n_reviews, avg_rating from public.reviews where shop_id = p_shop;
  select u.email_confirmed_at is not null into email_ok from auth.users u where u.id = sh.owner_id;
  days := extract(day from now() - sh.created_at)::int;
  rate := case when received >= 5 then round(responded_fast::numeric / received, 2) end;

  if sh.verified_at is not null then badges := array_append(badges, 'verified'); end if;
  if coalesce(email_ok, false) then badges := array_append(badges, 'email_verified'); end if;
  if completed >= 5 and n_reviews >= 3 and avg_rating >= 4 then badges := array_append(badges, 'trusted_seller'); end if;
  if rate is not null and rate >= 0.9 then badges := array_append(badges, 'responsive'); end if;
  if days >= 180 then badges := array_append(badges, 'established'); end if;

  return jsonb_build_object(
    'completed_orders', completed, 'reviews_count', n_reviews, 'average_rating', avg_rating,
    'member_since', sh.created_at, 'days_active', days, 'verified', sh.verified_at is not null,
    'email_verified', coalesce(email_ok, false), 'response_rate', rate,
    'avg_response_hours', case when received >= 5 then round(avg_hours, 1) end, 'badges', to_jsonb(badges));
end $$;

-- ───────────────────────── Recherche ─────────────────────────
create or replace function public.search_products(
  p_query text default null, p_domain int default null, p_category int default null,
  p_min_price int default null, p_max_price int default null, p_region text default null,
  p_available boolean default null, p_shop uuid default null,
  p_sort text default 'relevance', p_limit int default 24, p_offset int default 0
) returns table (id uuid, total_count bigint)
language plpgsql stable security invoker set search_path = public as $$
declare q text := nullif(lower(extensions.unaccent('extensions.unaccent'::regdictionary, trim(coalesce(p_query, '')))), '');
        tsq tsquery;
begin
  if q is not null then
    tsq := to_tsquery('simple', array_to_string(array(select regexp_replace(w, '[^a-z0-9]', '', 'g') || ':*'
             from unnest(string_to_array(q, ' ')) w where regexp_replace(w, '[^a-z0-9]', '', 'g') <> ''), ' & '));
  end if;
  return query
  with base as (
    select pr.id, pr.price, pr.published_at, pr.quality_score,
      case when q is null then 0 else
        coalesce(ts_rank(pr.search_vector, tsq), 0) + extensions.word_similarity(q, pr.search_text) end as rank,
      (select count(*) from public.favorite_products f where f.product_id = pr.id) as favs
    from public.products pr
    join public.shops sh on sh.id = pr.shop_id
    left join public.categories c on c.id = pr.category_id
    where pr.status = 'published' and public.shop_is_public(pr.shop_id)
      and (q is null or (tsq is not null and pr.search_vector @@ tsq) or extensions.word_similarity(q, pr.search_text) >= 0.45
           or pr.search_text like '%' || q || '%')
      and (p_domain is null or c.domain_id = p_domain or sh.domain_id = p_domain)
      and (p_category is null or pr.category_id = p_category or c.parent_id = p_category)
      and (p_min_price is null or pr.price >= p_min_price)
      and (p_max_price is null or pr.price <= p_max_price)
      and (p_region is null or sh.region = p_region)
      and (p_available is null or not p_available or pr.availability <> 'out_of_stock')
      and (p_shop is null or pr.shop_id = p_shop)
  )
  select b.id, count(*) over () from base b
  order by
    case when p_sort = 'price_asc' then b.price end asc nulls last,
    case when p_sort = 'price_desc' then b.price end desc nulls last,
    case when p_sort = 'newest' then b.published_at end desc nulls last,
    case when p_sort = 'popular' then b.favs end desc nulls last,
    case when p_sort = 'relevance' then b.rank end desc nulls last,
    b.quality_score desc, b.published_at desc
  limit least(greatest(p_limit, 1), 60) offset greatest(p_offset, 0);
end $$;

create or replace function public.search_shops(p_query text default null, p_domain int default null, p_region text default null, p_limit int default 24)
returns setof public.shops
language sql stable security invoker set search_path = public as $$
  select sh.* from public.shops sh
  where public.shop_is_public(sh.id)
    and (p_domain is null or sh.domain_id = p_domain)
    and (p_region is null or sh.region = p_region)
    and (nullif(trim(coalesce(p_query, '')), '') is null
         or lower(extensions.unaccent('extensions.unaccent'::regdictionary, sh.name || ' ' || sh.description || ' ' || sh.city))
            like '%' || lower(extensions.unaccent('extensions.unaccent'::regdictionary, trim(p_query))) || '%')
  order by sh.verified_at desc nulls last, sh.created_at desc
  limit least(greatest(p_limit, 1), 60)
$$;

-- ───────────────────────── Statistiques ─────────────────────────
create or replace function public.track_event(p_shop uuid, p_type public.event_type, p_product uuid default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.shop_is_public(p_shop) then return; end if;
  if public.is_shop_owner(p_shop) then return; end if;   -- les visites du vendeur ne comptent pas
  if p_product is not null and not exists(select 1 from public.products where id = p_product and shop_id = p_shop) then return; end if;
  insert into public.events (shop_id, product_id, type) values (p_shop, p_product, p_type);
end $$;

create or replace function public.seller_stats(p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare sid uuid := public.my_shop_id(); since timestamptz; res jsonb;
begin
  if sid is null then raise exception 'AUCUNE_BOUTIQUE'; end if;
  since := date_trunc('day', now()) - make_interval(days => greatest(1, least(p_days, 365)) - 1);
  select jsonb_build_object(
    'days', p_days,
    'shop_views', (select count(*) from public.events where shop_id = sid and type = 'shop_view' and created_at >= since),
    'product_views', (select count(*) from public.events where shop_id = sid and type = 'product_view' and created_at >= since),
    'calls', (select count(*) from public.events where shop_id = sid and type = 'call_click' and created_at >= since),
    'whatsapp', (select count(*) from public.events where shop_id = sid and type = 'whatsapp_click' and created_at >= since),
    'shares', (select count(*) from public.events where shop_id = sid and type = 'share_click' and created_at >= since),
    'favorites', (select count(*) from public.events where shop_id = sid and type = 'favorite_add' and created_at >= since),
    'orders', (select count(*) from public.orders where shop_id = sid and created_at >= since),
    'completed_orders', (select count(*) from public.orders where shop_id = sid and status = 'completed' and completed_at >= since),
    'revenue_completed', (select coalesce(sum(total), 0) from public.orders where shop_id = sid and status = 'completed' and completed_at >= since),
    'series', (select coalesce(jsonb_agg(d order by d ->> 'day'), '[]'::jsonb) from (
        select jsonb_build_object('day', to_char(g.day, 'YYYY-MM-DD'),
          'views', (select count(*) from public.events e where e.shop_id = sid and e.type in ('shop_view', 'product_view')
                     and e.created_at >= g.day and e.created_at < g.day + interval '1 day'),
          'orders', (select count(*) from public.orders o where o.shop_id = sid and o.created_at >= g.day and o.created_at < g.day + interval '1 day')) d
        from generate_series(since, date_trunc('day', now()), interval '1 day') g(day)) s),
    'top_products', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select pr.id, pr.title, count(e.id) as views
        from public.products pr join public.events e on e.product_id = pr.id and e.type = 'product_view' and e.created_at >= since
        where pr.shop_id = sid group by pr.id, pr.title order by views desc limit 5) t)
  ) into res;
  return res;
end $$;

-- ───────────────────────── Abonnements : déclaration et validation ─────────────────────────
-- Le vendeur déclare un paiement (référence de transaction). Rien n'est activé tant que la plateforme n'a pas vérifié.
create or replace function public.declare_subscription_payment(p_method text, p_reference text, p_plan text default null, p_amount int default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare sid uuid := public.my_shop_id(); pid uuid; s public.subscriptions;
begin
  if sid is null then raise exception 'AUCUNE_BOUTIQUE'; end if;
  if exists(select 1 from public.subscription_payments where shop_id = sid and status = 'pending') then raise exception 'PAIEMENT_DEJA_EN_ATTENTE'; end if;
  insert into public.subscription_payments (shop_id, plan_code, amount, method, reference)
  values (sid, p_plan, p_amount, p_method, trim(p_reference)) returning id into pid;
  select * into s from public.subscriptions where shop_id = sid;
  if public.subscription_effective_status(s) in ('expired') then
    update public.subscriptions set status = 'pending_payment', updated_at = now() where shop_id = sid;
  end if;
  return pid;
end $$;

-- Réservé à l'administration de la plateforme (phase ultérieure : écran dédié).
create or replace function public.admin_review_subscription_payment(p_payment uuid, p_approve boolean, p_days int default 30) returns void
language plpgsql security definer set search_path = public as $$
declare pay public.subscription_payments; owner uuid; s public.subscriptions; base timestamptz;
begin
  if not public.is_platform_admin() then raise exception 'INTERDIT'; end if;
  select * into pay from public.subscription_payments where id = p_payment and status = 'pending' for update;
  if not found then raise exception 'PAIEMENT_INTROUVABLE'; end if;
  select owner_id into owner from public.shops where id = pay.shop_id;
  update public.subscription_payments set status = case when p_approve then 'validated' else 'rejected' end,
    validated_at = now(), validated_by = auth.uid() where id = p_payment;
  select * into s from public.subscriptions where shop_id = pay.shop_id for update;
  if p_approve then
    base := greatest(now(), coalesce(case when public.subscription_effective_status(s) = 'active' then s.current_period_end end, now()));
    update public.subscriptions set status = 'active', plan_code = coalesce(pay.plan_code, plan_code),
      current_period_end = base + make_interval(days => p_days), updated_at = now() where shop_id = pay.shop_id;
    insert into public.notifications (user_id, kind, title, body, link)
    values (owner, 'subscription', 'Abonnement activé', 'Votre paiement a été vérifié. Votre boutique est active.', '/vendeur/abonnement');
  else
    update public.subscriptions set status = case when s.status = 'pending_payment' then 'expired' else s.status end, updated_at = now()
    where shop_id = pay.shop_id;
    insert into public.notifications (user_id, kind, title, body, link)
    values (owner, 'subscription', 'Paiement non validé', 'Nous n''avons pas pu vérifier votre paiement. Vérifiez la référence et réessayez.', '/vendeur/abonnement');
  end if;
end $$;

create or replace function public.admin_set_shop_verified(p_shop uuid, p_verified boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'INTERDIT'; end if;
  update public.shops set verified_at = case when p_verified then now() end where id = p_shop;
end $$;

-- ───────────────────────── Suppression de compte ─────────────────────────
-- Les données personnelles sont effacées ; les commandes passées sont conservées (obligation comptable) mais anonymisées.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'NON_CONNECTE'; end if;
  if exists(select 1 from public.shops where owner_id = uid) then raise exception 'BOUTIQUE_ACTIVE'; end if;
  if exists(select 1 from public.orders where buyer_id = uid and status in ('pending', 'confirmed', 'preparing', 'shipped')) then
    raise exception 'COMMANDES_EN_COURS';
  end if;
  update public.orders set recipient_name = 'Client supprimé', phone = '—', address_details = '', note = '' where buyer_id = uid;
  delete from public.addresses where user_id = uid;
  delete from public.favorite_products where user_id = uid;
  delete from public.favorite_shops where user_id = uid;
  delete from public.notifications where user_id = uid;
  delete from public.assistant_progress where user_id = uid;
  update public.profiles set full_name = 'Compte supprimé', phone = null, avatar_url = null, notify_promotions = false where id = uid;
end $$;

create trigger shops_touch before update on public.shops for each row execute function public.touch_updated_at();
