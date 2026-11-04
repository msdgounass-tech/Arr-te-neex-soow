-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Styles / étiquettes produits (ex. montres :
--  connectee, luxe, classique, sportive). Modifiables dans Admin › Produits.
-- ════════════════════════════════════════════════════════════════
alter table public.products add column if not exists tags text[] not null default '{}';
create index if not exists products_tags_idx on public.products using gin (tags);
