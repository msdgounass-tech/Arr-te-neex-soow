-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Retrait des éléments ajoutés par erreur le 2026-11-07
--  (21 catégories high-tech, colonnes products.brand et products.specs).
--  Sauvegarde : supabase/backups/gounass_backup_2026-11-07_categories_high-tech.json
--  Aucun produit ne les utilise. À exécuter dans Supabase › SQL Editor,
--  projet gounass-luxury, quand vous le souhaitez. Ne touche à aucune autre donnée.
-- ════════════════════════════════════════════════════════════════
delete from public.categories where slug in ('telephonie','informatique','audio','objets-connectes','tv-gaming','accessoires-tech');
-- (les 15 sous-catégories sont supprimées avec leurs univers : parent_id ... on delete cascade)
drop index if exists public.products_brand_idx;
alter table public.products drop constraint if exists products_specs_is_array;
alter table public.products drop column if exists specs;
alter table public.products drop column if exists brand;
