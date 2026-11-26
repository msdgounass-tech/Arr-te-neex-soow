-- 1. Envoi des photos avec la session du vendeur (aucune clé secrète côté serveur) :
--    un vendeur ne peut écrire que dans shops/<id de SA boutique>/…, et seulement si son abonnement permet la gestion.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    execute $p$
      create policy media_owner_insert on storage.objects for insert to authenticated
      with check (
        bucket_id = 'media'
        and (storage.foldername(name))[1] = 'shops'
        and (storage.foldername(name))[2] = public.my_shop_id()::text
        and public.shop_can_manage(public.my_shop_id())
      )
    $p$;
  end if;
end $$;

-- 2. Badge « E-mail confirmé » retiré : il n'a de sens que si la confirmation d'e-mail est imposée,
--    ce qui n'est pas garanti par la configuration du projet. Les autres badges restent calculés sur des faits.
create or replace function public.get_shop_trust(p_shop uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  sh public.shops; completed int; received int; responded_fast int; avg_hours numeric; n_reviews int; avg_rating numeric;
  days int; rate numeric; badges text[] := '{}';
begin
  select * into sh from public.shops where id = p_shop;
  if not found then return null; end if;
  select count(*) filter (where status = 'completed'),
         count(*) filter (where status <> 'cancelled' or responded_at is not null),
         count(*) filter (where responded_at is not null and responded_at <= created_at + interval '24 hours'),
         avg(extract(epoch from (responded_at - created_at)) / 3600) filter (where responded_at is not null)
    into completed, received, responded_fast, avg_hours
  from public.orders where shop_id = p_shop and (responded_at is not null or created_at < now() - interval '24 hours');
  select count(*), round(avg(rating)::numeric, 1) into n_reviews, avg_rating from public.reviews where shop_id = p_shop;
  days := extract(day from now() - sh.created_at)::int;
  rate := case when received >= 5 then round(responded_fast::numeric / received, 2) end;
  if sh.verified_at is not null then badges := array_append(badges, 'verified'); end if;
  if completed >= 5 and n_reviews >= 3 and avg_rating >= 4 then badges := array_append(badges, 'trusted_seller'); end if;
  if rate is not null and rate >= 0.9 then badges := array_append(badges, 'responsive'); end if;
  if days >= 180 then badges := array_append(badges, 'established'); end if;
  return jsonb_build_object(
    'completed_orders', completed, 'reviews_count', n_reviews, 'average_rating', avg_rating,
    'member_since', sh.created_at, 'days_active', days, 'verified', sh.verified_at is not null,
    'response_rate', rate, 'avg_response_hours', case when received >= 5 then round(avg_hours, 1) end, 'badges', to_jsonb(badges));
end $$;

-- 3. Suppression de compte : les données personnelles (adresses, favoris, notifications, assistant) sont retirées
--    par l'action serveur avec les droits de l'utilisateur (règles RLS « own »). Cette fonction anonymise le reste.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'NON_CONNECTE'; end if;
  if exists(select 1 from public.shops where owner_id = uid) then raise exception 'BOUTIQUE_ACTIVE'; end if;
  if exists(select 1 from public.orders where buyer_id = uid and status in ('pending', 'confirmed', 'preparing', 'shipped')) then
    raise exception 'COMMANDES_EN_COURS';
  end if;
  if exists(select 1 from public.addresses where user_id = uid) or exists(select 1 from public.favorite_products where user_id = uid)
     or exists(select 1 from public.favorite_shops where user_id = uid) then
    raise exception 'DONNEES_PERSONNELLES_RESTANTES';
  end if;
  update public.orders set recipient_name = 'Client supprimé', phone = '—', address_details = '', note = '' where buyer_id = uid;
  update public.profiles set full_name = 'Compte supprimé', phone = null, avatar_url = null, notify_promotions = false where id = uid;
end $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated, service_role;
