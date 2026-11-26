-- Rappels d'abonnement générés à la consultation de l'espace vendeur (aucune tâche planifiée nécessaire).
-- Idempotent : un seul rappel par échéance.
create or replace function public.ensure_subscription_reminders() returns void
language plpgsql security definer set search_path = public as $$
declare sid uuid := public.my_shop_id(); s public.subscriptions; st public.subscription_status; v_title text; v_body text;
begin
  if sid is null then return; end if;
  select * into s from public.subscriptions where shop_id = sid;
  if not found then return; end if;
  st := public.subscription_effective_status(s);
  if st = 'trial' and s.trial_ends_at < now() + interval '2 days' then
    v_title := 'Votre essai gratuit se termine bientôt';
    v_body := 'Choisissez une formule pour garder votre boutique visible. Vos données sont conservées quoi qu''il arrive.';
  elsif st = 'expired' then
    v_title := 'Votre boutique est temporairement invisible';
    v_body := 'Votre abonnement a expiré. Vos produits et votre historique sont conservés : réactivez votre abonnement pour reprendre.';
  else
    return;
  end if;
  if not exists (select 1 from public.notifications where user_id = auth.uid() and kind = 'subscription' and notifications.title = v_title
                 and created_at > coalesce(s.updated_at, s.trial_ends_at) - interval '3 days') then
    insert into public.notifications (user_id, kind, title, body, link) values (auth.uid(), 'subscription', v_title, v_body, '/vendeur/abonnement');
  end if;
end $$;
revoke execute on function public.ensure_subscription_reminders() from public, anon;
grant execute on function public.ensure_subscription_reminders() to authenticated, service_role;
