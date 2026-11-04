-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Durcissement : Supabase accorde par défaut EXECUTE
--  aux rôles anon/authenticated sur les fonctions du schéma public.
--  On retire cet accès aux fonctions qui n'ont pas à être appelées en direct.
--  (Les fonctions is_staff/is_manager/is_admin restent exécutables : elles sont
--  utilisées par les règles RLS évaluées avec le rôle de l'appelant.)
-- ════════════════════════════════════════════════════════════════
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.on_order_status_change() from anon, authenticated, public;
revoke execute on function public.protect_profile_role() from anon, authenticated, public;
revoke execute on function public.admin_stats(int) from anon, public;
revoke execute on function public.sync_cod_payment(uuid) from anon, public;
revoke execute on function public.set_delivery_fee(uuid, int) from anon, public;
revoke execute on function public.confirm_manual_payment(uuid, text) from anon, public;
