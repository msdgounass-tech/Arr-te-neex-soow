-- Supprime toutes les données de démonstration de MSD Shoppy (à exécuter dans Supabase > SQL Editor avant l'ouverture au public).
-- Les comptes de démo ont des e-mails en @demo.msdshoppy.sn ; les boutiques sont marquées is_demo.
begin;
delete from public.reviews where shop_id in (select id from public.shops where is_demo);
delete from public.orders where shop_id in (select id from public.shops where is_demo);
delete from public.shops where is_demo;
delete from auth.users where email like '%@demo.msdshoppy.sn';
delete from storage.objects where bucket_id = 'media' and name like 'shops/%' and split_part(name, '/', 2) not in (select id::text from public.shops);
commit;
-- Puis retirer la variable NEXT_PUBLIC_DEMO_MODE dans Vercel.
