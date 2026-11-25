-- Tests métier et sécurité de la base (exécutés par scripts/test-db.sh sur une base vierge).
-- Chaque échec lève une exception : le script s'arrête au premier problème.
\set ON_ERROR_STOP 1
set client_min_messages = notice;

create or replace function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'ÉCHEC : %', label; end if;
  raise notice 'ok - %', label;
end $$;
create or replace function pg_temp.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, false);
  execute 'set role authenticated';
end $$;
create or replace function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', false);
  execute 'set role anon';
end $$;
create or replace function pg_temp.fails(sql text, expected text) returns boolean language plpgsql as $$
begin
  execute sql;
  return false;
exception when others then
  if expected is not null and position(expected in sqlerrm) = 0 then raise notice 'erreur inattendue: %', sqlerrm; return false; end if;
  return true;
end $$;

-- Utilisateurs
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'vendeur.a@test.sn', now(), '{"full_name":"Awa Diop"}'),
  ('00000000-0000-0000-0000-00000000000b', 'vendeur.b@test.sn', null, '{"full_name":"Bamba Fall"}'),
  ('00000000-0000-0000-0000-00000000000c', 'client.c@test.sn', now(), '{"full_name":"Coumba Ndiaye"}'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@test.sn', now(), '{"full_name":"Admin"}');
update public.profiles set is_platform_admin = true where id = '00000000-0000-0000-0000-0000000000ad';
select pg_temp.ok((select count(*) = 4 from public.profiles), 'un profil est créé pour chaque compte');

-- ── Vendeur A : boutique + produit
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.ok(pg_temp.fails($$update public.profiles set is_platform_admin = true where id = auth.uid()$$, 'permission'),
  'un utilisateur ne peut pas se donner le rôle administrateur');
select public.create_shop('Awa Couture', 'Tenues sur mesure', (select id from public.domains where slug = 'mode'),
  array[(select id from public.categories where slug = 'vetements-femme')], 'SN', 'Dakar', 'Dakar', '771234567', '771234567', null);
select pg_temp.ok(pg_temp.fails($$select public.create_shop('Autre', '', 1, null, 'SN', 'Dakar', 'Dakar', '77', '77', null)$$, 'BOUTIQUE_EXISTANTE'),
  'une seule boutique par compte');
select pg_temp.ok((select status = 'trial' and trial_ends_at > now() + interval '6 days' from public.subscriptions), 'essai gratuit de 7 jours démarré');
select pg_temp.ok(pg_temp.fails($$update public.shops set verified_at = now()$$, 'permission'), 'le vendeur ne peut pas se vérifier lui-même');
select pg_temp.ok(pg_temp.fails($$update public.subscriptions set status = 'active', current_period_end = now() + interval '1 year'$$, 'permission'),
  'le vendeur ne peut pas activer son abonnement lui-même');

insert into public.products (shop_id, title, description, price, stock)
values (public.my_shop_id(), 'Robe wax élégante coupe droite', 'Robe en tissu wax 100 % coton, cousue à Dakar.', 15000, 5);
select pg_temp.ok((select slug = 'robe-wax-elegante-coupe-droite' and status = 'draft' from public.products), 'produit créé en brouillon avec un lien lisible');
select pg_temp.ok(pg_temp.fails($$select public.publish_product((select id from public.products limit 1))$$, 'CATEGORIE_REQUISE'),
  'publication refusée sans catégorie');
update public.products set category_id = (select id from public.categories where slug = 'vetements-femme');
select pg_temp.ok(pg_temp.fails($$select public.publish_product((select id from public.products limit 1))$$, 'PHOTO_REQUISE'),
  'publication refusée sans photo');
insert into public.product_images (product_id, url, width, height) select id, 'https://exemple.test/a.webp', 1200, 1200 from public.products;
select public.publish_product((select id from public.products limit 1));
select pg_temp.ok((select status = 'published' and published_at is not null from public.products), 'publication acceptée avec les informations obligatoires');
select pg_temp.ok((select quality_score from public.products) = 12 + 5 + 15 + 7 + 10 + 10 + 10, 'score qualité calculé par la base (69)');
select pg_temp.ok(pg_temp.fails($$update public.products set quality_score = 100$$, 'permission'), 'le score qualité ne peut pas être modifié par le vendeur');

-- ── Visiteur
select pg_temp.as_anon();
select pg_temp.ok((select count(*) = 1 from public.products), 'un visiteur voit le produit publié');
select pg_temp.ok((select count(*) = 1 from public.search_products('robe wax')), 'recherche « robe wax »');
select pg_temp.ok((select count(*) = 1 from public.search_products('ÉLÉGANTE')), 'recherche insensible aux accents et majuscules');
select pg_temp.ok((select count(*) = 1 from public.search_products('elegnte')), 'recherche tolérante aux fautes de frappe');
select pg_temp.ok((select count(*) = 0 from public.search_products(null, null, null, 20000)), 'filtre prix minimum');
select pg_temp.ok((select count(*) = 1 from public.search_shops('couture')), 'recherche de boutiques');
select pg_temp.ok(pg_temp.fails($$select public.place_orders('[]', '{}')$$, null), 'un visiteur ne peut pas commander');
select pg_temp.ok((select count(*) = 0 from public.subscriptions), 'un visiteur ne voit aucun abonnement');

-- ── Vendeur B : isolation
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select public.create_shop('Bamba Tech', 'Téléphones', (select id from public.domains where slug = 'electronique'), null, 'SN', 'Thiès', 'Thiès', null, '781112233', null);
insert into public.products (shop_id, title, description, price) values (public.my_shop_id(), 'Téléphone brouillon', '', 50000);
update public.products set price = 1 where title like 'Robe%';
reset role;
select pg_temp.ok((select price = 15000 from public.products where title like 'Robe%'), 'le vendeur B ne peut pas modifier le produit du vendeur A');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.ok(pg_temp.fails($$insert into public.products (shop_id, title, price) values ((select id from public.shops where name = 'Awa Couture'), 'Intrus', 100)$$, null),
  'le vendeur B ne peut pas ajouter de produit dans la boutique A');
select pg_temp.ok((select count(*) = 1 from public.subscriptions), 'le vendeur B ne voit que son propre abonnement');
select pg_temp.as_anon();
select pg_temp.ok((select count(*) = 0 from public.products where title = 'Téléphone brouillon'), 'les brouillons sont invisibles du public');

-- ── Client C : commande
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.ok(pg_temp.fails(format($$select public.place_orders('[{"product_id":"%s","quantity":10}]',
  '{"recipient_name":"Coumba","phone":"770000000","region":"Dakar","city":"Dakar"}')$$, (select id from public.products where title like 'Robe%')), 'STOCK_INSUFFISANT'),
  'commande refusée si le stock est insuffisant');
select public.place_orders(format('[{"product_id":"%s","quantity":2,"price":1}]', (select id from public.products where title like 'Robe%'))::jsonb,
  '{"recipient_name":"Coumba Ndiaye","phone":"77 000 00 00","region":"Dakar","city":"Dakar","address_details":"Sacré-Cœur 3"}');
select pg_temp.ok((select total = 30000 and status = 'pending' and number like 'MS-%' from public.orders), 'prix relu en base (le prix envoyé par le navigateur est ignoré)');
reset role;
select pg_temp.ok((select stock = 3 from public.products where title like 'Robe%'), 'stock décrémenté à la commande');
select pg_temp.ok((select count(*) = 1 from public.notifications where user_id = '00000000-0000-0000-0000-00000000000a' and kind = 'order'), 'le vendeur est notifié');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.ok((select count(*) = 0 from public.orders), 'le vendeur B ne voit pas les commandes du vendeur A');
select pg_temp.ok(pg_temp.fails($$select public.set_order_status((select id from public.orders limit 1), 'confirmed')$$, null), 'le vendeur B ne peut pas modifier la commande');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.ok(pg_temp.fails(format($$select public.place_orders('[{"product_id":"%s","quantity":1}]',
  '{"recipient_name":"Awa","phone":"770000000","region":"Dakar","city":"Dakar"}')$$, (select id from public.products limit 1)), 'ACHAT_PROPRE_BOUTIQUE'),
  'un vendeur ne peut pas commander dans sa propre boutique');
select pg_temp.ok((select count(*) = 1 from public.orders), 'le vendeur A voit la commande reçue');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.ok(pg_temp.fails($$select public.set_order_status((select id from public.orders limit 1), 'confirmed')$$, 'TRANSITION_INTERDITE'),
  'le client ne peut pas confirmer sa propre commande');
select pg_temp.ok(pg_temp.fails($$select public.submit_review((select id from public.orders limit 1), 5, 'Top')$$, 'COMMANDE_NON_TERMINEE'),
  'avis impossible avant la fin de la commande');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.ok(pg_temp.fails($$select public.set_order_status((select id from public.orders limit 1), 'shipped')$$, 'TRANSITION_INTERDITE'),
  'les étapes ne peuvent pas être sautées');
select public.set_order_status((select id from public.orders limit 1), 'confirmed');
select public.set_order_status((select id from public.orders limit 1), 'preparing');
select public.set_order_status((select id from public.orders limit 1), 'shipped');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select public.set_order_status((select id from public.orders limit 1), 'completed', 'Bien reçu');
select public.submit_review((select id from public.orders limit 1), 5, 'Très belle robe, livraison rapide.');
select pg_temp.ok(pg_temp.fails($$select public.submit_review((select id from public.orders limit 1), 1, 'Doublon')$$, null), 'un seul avis par commande');
select pg_temp.ok((select count(*) = 5 from public.order_events), 'historique des statuts conservé');

-- Commande annulée : remise en stock, jamais comptée comme vente
select public.place_orders(format('[{"product_id":"%s","quantity":1}]', (select id from public.products where title like 'Robe%'))::jsonb,
  '{"recipient_name":"Coumba Ndiaye","phone":"770000000","region":"Dakar","city":"Dakar"}');
select public.set_order_status((select id from public.orders where status = 'pending'), 'cancelled');
reset role;
select pg_temp.ok((select stock = 3 from public.products where title like 'Robe%'), 'stock remis en place après annulation');
select pg_temp.as_anon();
select pg_temp.ok((public.get_shop_trust((select id from public.shops where name = 'Awa Couture')) ->> 'completed_orders')::int = 1,
  'confiance : seules les commandes terminées comptent (annulée exclue)');
select pg_temp.ok((public.get_shop_trust((select id from public.shops where name = 'Awa Couture')) ->> 'average_rating')::numeric = 5, 'note moyenne issue des avis vérifiés');
select pg_temp.ok((public.get_shop_trust((select id from public.shops where name = 'Awa Couture')) -> 'badges') ? 'email_verified', 'badge e-mail vérifié attribué automatiquement');
select pg_temp.ok(not ((public.get_shop_trust((select id from public.shops where name = 'Bamba Tech')) -> 'badges') ? 'email_verified'), 'pas de badge sans vérification');

-- Statistiques : les visites du client comptent, celles du vendeur non
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select public.track_event((select id from public.shops where name = 'Awa Couture'), 'product_view', (select id from public.products where title like 'Robe%'));
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select public.track_event((select id from public.shops where name = 'Awa Couture'), 'product_view', (select id from public.products where title like 'Robe%'));
select pg_temp.ok((public.seller_stats(30) ->> 'product_views')::int = 1, 'statistiques : la visite du vendeur lui-même est ignorée');
select pg_temp.ok((public.seller_stats(30) ->> 'revenue_completed')::int = 30000, 'chiffre d''affaires = commandes terminées uniquement');
select pg_temp.ok(pg_temp.fails($$select count(*) from public.events$$, 'permission'), 'statistiques brutes inaccessibles directement');

-- ── Expiration : boutique masquée, rien n'est supprimé
reset role;
update public.subscriptions set trial_ends_at = now() - interval '1 minute' where shop_id = (select id from public.shops where name = 'Awa Couture');
select pg_temp.as_anon();
select pg_temp.ok((select count(*) = 0 from public.products), 'boutique expirée invisible du public');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.ok((select count(*) = 1 from public.products), 'le vendeur conserve ses produits après expiration');
select pg_temp.ok((select count(*) = 2 from public.orders), 'le vendeur conserve son historique de commandes');
select pg_temp.ok(pg_temp.fails($$insert into public.products (shop_id, title, price) values (public.my_shop_id(), 'Nouveau', 1000)$$, null),
  'gestion restreinte tant que l''abonnement n''est pas réactivé');
select public.declare_subscription_payment('wave', 'TX-123456');
select pg_temp.ok((select status = 'pending_payment' from public.subscriptions), 'déclaration de paiement : statut « paiement en attente »');
select pg_temp.ok(pg_temp.fails($$select public.admin_review_subscription_payment((select id from public.subscription_payments), true)$$, 'INTERDIT'),
  'le vendeur ne peut pas valider son propre paiement');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ad');
select public.admin_review_subscription_payment((select id from public.subscription_payments), true, 30);
select pg_temp.as_anon();
select pg_temp.ok((select count(*) = 1 from public.products), 'après validation du paiement, la boutique redevient visible');

-- ── Suppression de compte client
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select public.delete_my_account();
reset role;
select pg_temp.ok((select count(*) = 2 from public.orders where recipient_name = 'Client supprimé'), 'suppression du compte : commandes anonymisées, pas effacées');
select pg_temp.ok((select full_name = 'Compte supprimé' from public.profiles where id = '00000000-0000-0000-0000-00000000000c'), 'données personnelles effacées');
