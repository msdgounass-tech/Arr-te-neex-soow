-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Garde-fous sur les commandes
--  Depuis le tableau de bord (session utilisateur, rôle « authenticated »),
--  l'équipe ne peut modifier que le statut, les notes et l'encaissement d'un
--  paiement à la livraison. Les montants restent figés ; le statut d'un paiement
--  en ligne n'est modifiable que par les webhooks (clé service / fonctions internes).
-- ════════════════════════════════════════════════════════════════

-- Synchronise la ligne de paiement d'une commande payée à la livraison
create or replace function public.sync_cod_payment(p_order_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.payments set status = 'reussi'
   where order_id = p_order_id and provider = 'livraison'
     and (public.is_staff() or auth.uid() is null);
$$;
revoke all on function public.sync_cod_payment(uuid) from public, anon;
grant execute on function public.sync_cod_payment(uuid) to authenticated, service_role;

-- SECURITY INVOKER : current_user reflète l'appelant réel
--   authenticated/anon → requête depuis le navigateur ou une session utilisateur
--   service_role / propriétaire → serveur de confiance ou fonction interne
create or replace function public.guard_order_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if new.subtotal <> old.subtotal or new.discount <> old.discount or new.delivery_fee <> old.delivery_fee
     or new.total <> old.total or new.order_number <> old.order_number or new.access_token <> old.access_token
     or new.payment_method <> old.payment_method or new.user_id is distinct from old.user_id
     or new.customer_name <> old.customer_name or new.phone <> old.phone then
    raise exception 'CHAMP_PROTEGE';
  end if;
  if new.payment_status is distinct from old.payment_status then
    if old.payment_method <> 'livraison' or new.payment_status <> 'reussi' then
      raise exception 'PAIEMENT_PROTEGE';
    end if;
    new.paid_at := coalesce(new.paid_at, now());
    perform public.sync_cod_payment(new.id);
  end if;
  return new;
end $$;

create trigger orders_guard before update on public.orders
  for each row execute function public.guard_order_update();
