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
  ('home', '{"hero_image": "", "men_image": "", "women_image": "", "accessories_image": "", "editorial_image": "", "announcement": ""}'::jsonb)
on conflict (key) do nothing;
