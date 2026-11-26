-- 1. Mode démo : les boutiques de démonstration sont marquées et affichées comme telles. Le vendeur ne peut pas modifier ce marqueur
--    (aucun droit UPDATE sur la colonne). Suppression : supabase/demo/remove_demo.sql.
alter table public.shops add column if not exists is_demo boolean not null default false;

-- 2. Les comptes anonymes (option Supabase « connexions anonymes ») ne peuvent ni ouvrir de boutique, ni commander, ni noter, ni payer.
create or replace function public.is_anonymous_user() returns boolean
language sql stable as $$ select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) $$;

create or replace function public.block_anonymous() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_anonymous_user() then raise exception 'COMPTE_REQUIS'; end if;
  return new;
end $$;
revoke execute on function public.block_anonymous() from public, anon, authenticated;

create trigger block_anonymous before insert on public.shops for each row execute function public.block_anonymous();
create trigger block_anonymous before insert on public.orders for each row execute function public.block_anonymous();
create trigger block_anonymous before insert on public.reviews for each row execute function public.block_anonymous();
create trigger block_anonymous before insert on public.subscription_payments for each row execute function public.block_anonymous();
create trigger block_anonymous before insert on public.products for each row execute function public.block_anonymous();
