-- Donne l'accès au back-office d'Arrêt nekh soow au compte du propriétaire.
-- À exécuter APRÈS schema.sql, dans Supabase > SQL Editor.
-- Si le compte n'existe pas encore : Authentication > Users > Add user (même e-mail).
insert into public.ns_admins(user_id)
select id from auth.users where lower(email) = 'msdgounass@gmail.com'
on conflict do nothing;

select u.email, (a.user_id is not null) as acces_back_office
from auth.users u left join public.ns_admins a on a.user_id = u.id
where lower(u.email) = 'msdgounass@gmail.com';
