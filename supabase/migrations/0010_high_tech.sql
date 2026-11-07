-- ════════════════════════════════════════════════════════════════
--  Boutique high-tech — migration ADDITIVE (sans effet sur l'existant)
--  · products.brand : marque du produit (Apple, Samsung, Xiaomi…)
--  · products.specs : caractéristiques techniques saisies dans l'admin,
--    tableau JSON [{ "label": "Écran", "value": "6,1 pouces" }, …]
--  · arborescence des catégories high-tech (univers › types)
--  Aucune donnée produit n'est créée : les fiches et leurs caractéristiques
--  réelles sont saisies par la boutique dans Admin › Produits.
-- ════════════════════════════════════════════════════════════════

alter table public.products add column if not exists brand text;
alter table public.products add column if not exists specs jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_specs_is_array') then
    alter table public.products add constraint products_specs_is_array check (jsonb_typeof(specs) = 'array');
  end if;
end $$;

create index if not exists products_brand_idx on public.products (lower(brand));

-- Univers (catégories parentes)
insert into public.categories (name, slug, description, position, is_active) values
  ('Téléphonie',            'telephonie',       'Smartphones et tablettes.',                         100, true),
  ('Informatique',          'informatique',     'Ordinateurs portables, ordinateurs de bureau et écrans.', 110, true),
  ('Audio',                 'audio',            'Écouteurs, casques et enceintes.',                  120, true),
  ('Objets connectés',      'objets-connectes', 'Montres et bracelets connectés.',                   130, true),
  ('TV & Gaming',           'tv-gaming',        'Téléviseurs, consoles et jeux.',                    140, true),
  ('Accessoires',           'accessoires-tech', 'Chargeurs, câbles, protections, batteries et stockage.', 150, true)
on conflict (slug) do nothing;

-- Types (catégories enfants)
insert into public.categories (name, slug, parent_id, position, is_active)
select v.name, v.slug, p.id, v.position, true
from (values
  ('Smartphones',               'smartphones',          'telephonie',       101),
  ('Tablettes',                 'tablettes',            'telephonie',       102),
  ('Ordinateurs portables',     'ordinateurs-portables','informatique',     111),
  ('Ordinateurs de bureau',     'ordinateurs-bureau',   'informatique',     112),
  ('Écrans',                    'ecrans',               'informatique',     113),
  ('Écouteurs & casques',       'ecouteurs-casques',    'audio',            121),
  ('Enceintes',                 'enceintes',            'audio',            122),
  ('Montres connectées',        'montres-connectees',   'objets-connectes', 131),
  ('Bracelets connectés',       'bracelets-connectes',  'objets-connectes', 132),
  ('Téléviseurs',               'televiseurs',          'tv-gaming',        141),
  ('Consoles & jeux',           'consoles-jeux',        'tv-gaming',        142),
  ('Chargeurs & câbles',        'chargeurs-cables',     'accessoires-tech', 151),
  ('Coques & protections',      'coques-protections',   'accessoires-tech', 152),
  ('Batteries externes',        'batteries-externes',   'accessoires-tech', 153),
  ('Stockage',                  'stockage',             'accessoires-tech', 154)
) as v(name, slug, parent_slug, position)
join public.categories p on p.slug = v.parent_slug
on conflict (slug) do nothing;
