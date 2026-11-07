-- ════════════════════════════════════════════════════════════════
--  BASCULE de la boutique vers le high-tech.
--  À exécuter AU MOMENT DE LA MISE EN LIGNE de la nouvelle version
--  (après la fusion de la branche et le déploiement), pas avant :
--  le site actuellement en ligne afficherait sinon une boutique vide.
--
--  Rien n'est supprimé : les produits, catégories et collections de mode
--  sont seulement MASQUÉS (is_active = false). Les commandes passées et
--  leur historique restent intacts. Pour revenir en arrière, repassez
--  is_active à true sur les mêmes lignes.
-- ════════════════════════════════════════════════════════════════

-- Produits rattachés aux catégories de mode (Homme / Femme et leurs sous-catégories)
update public.products set is_active = false, is_featured = false
where category_id in (
  select c.id from public.categories c
  left join public.categories p on p.id = c.parent_id
  where c.slug in ('homme', 'femme') or p.slug in ('homme', 'femme')
);

-- Catégories de mode
update public.categories set is_active = false
where slug in ('homme', 'femme')
   or parent_id in (select id from public.categories where slug in ('homme', 'femme'));

-- Collections qui ne contiennent plus aucun produit visible
update public.collections c set is_active = false, is_featured = false
where not exists (select 1 from public.products p where p.collection_id = c.id and p.is_active);

-- Bandeau d'annonce : retire la mention de la collection de mode
update public.settings
set value = jsonb_set(value, '{announcement}', to_jsonb('Livraison à Dakar et dans tout le Sénégal · Commande et conseil sur WhatsApp'::text))
where key = 'home' and value->>'announcement' ilike '%wouro maama%';
