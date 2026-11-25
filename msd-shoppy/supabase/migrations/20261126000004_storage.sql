-- Stockage des images (Supabase Storage). Les envois passent par le serveur (clé service) après vérification
-- du propriétaire : aucune politique d'écriture n'est ouverte aux navigateurs. Lecture publique des images.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('media', 'media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
    on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;
end $$;
