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
