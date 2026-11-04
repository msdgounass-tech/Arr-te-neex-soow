-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Inscription sans e-mail de vérification
--  Le compte est confirmé dès sa création : le client se connecte immédiatement.
--  (Pour ne plus envoyer d'e-mail du tout : Supabase › Authentication ›
--   Sign In / Providers › Email › désactiver « Confirm email ».)
-- ════════════════════════════════════════════════════════════════
create or replace function public.auto_confirm_email() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  if tg_op = 'INSERT' then
    new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  else
    new.email_confirmed_at := coalesce(new.email_confirmed_at, old.email_confirmed_at, now());
  end if;
  return new;
end $$;
revoke execute on function public.auto_confirm_email() from public, anon, authenticated;

drop trigger if exists auto_confirm_email on auth.users;
create trigger auto_confirm_email
  before insert or update of email_confirmed_at on auth.users
  for each row execute function public.auto_confirm_email();

update auth.users set email_confirmed_at = now() where email_confirmed_at is null;
