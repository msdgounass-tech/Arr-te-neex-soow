-- Durcissement suite au contrôle de sécurité Supabase (advisors).
-- 1. Fonctions de déclenchement : jamais appelables via l'API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.products_before_write() from public, anon, authenticated;
revoke execute on function public.products_after_write() from public, anon, authenticated;
revoke execute on function public.products_guard_publish() from public, anon, authenticated;
revoke execute on function public.refresh_product_quality() from public, anon, authenticated;
-- 2. Chemin de recherche figé pour les fonctions utilitaires.
alter function public.slugify(text) set search_path = public, extensions;
alter function public.unique_slug(text, text) set search_path = public, extensions;
alter function public.touch_updated_at() set search_path = public;
alter function public.subscription_effective_status(public.subscriptions) set search_path = public;
-- Notes : les fonctions utilisées dans les règles RLS (is_shop_owner, shop_is_public, shop_can_manage, is_platform_admin)
-- doivent rester exécutables ; get_shop_trust, track_event et la recherche sont publiques par conception ;
-- la table events n'a volontairement aucune règle (accès uniquement via track_event et seller_stats).
