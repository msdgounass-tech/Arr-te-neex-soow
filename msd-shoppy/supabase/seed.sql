-- Données de référence (aucune donnée commerciale fictive : ni boutique, ni produit, ni avis).
insert into public.countries (code, name, currency, phone_prefix, active) values
  ('SN', 'Sénégal', 'XOF', '+221', true)
on conflict (code) do nothing;

insert into public.regions (country_code, name) select 'SN', r from unnest(array[
  'Dakar', 'Thiès', 'Diourbel', 'Saint-Louis', 'Louga', 'Kaolack', 'Fatick', 'Kaffrine',
  'Ziguinchor', 'Kolda', 'Sédhiou', 'Tambacounda', 'Kédougou', 'Matam']) r
on conflict do nothing;

insert into public.domains (slug, name, icon, position) values
  ('mode', 'Mode et habillement', 'shirt', 1),
  ('electronique', 'Électronique et informatique', 'smartphone', 2),
  ('beaute', 'Beauté et cosmétiques', 'sparkles', 3),
  ('maison', 'Maison et décoration', 'sofa', 4),
  ('alimentation', 'Alimentation', 'basket', 5),
  ('agriculture', 'Agriculture', 'sprout', 6),
  ('automobile', 'Automobile', 'car', 7),
  ('sport', 'Sport et loisirs', 'ball', 8)
on conflict (slug) do nothing;

insert into public.categories (domain_id, slug, name, position)
select d.id, c.slug, c.name, c.pos from (values
  ('mode', 'vetements-femme', 'Vêtements femme', 1), ('mode', 'vetements-homme', 'Vêtements homme', 2),
  ('mode', 'tenues-traditionnelles', 'Tenues traditionnelles', 3), ('mode', 'chaussures', 'Chaussures', 4),
  ('mode', 'sacs-accessoires', 'Sacs et accessoires', 5), ('mode', 'bijoux-montres', 'Bijoux et montres', 6),
  ('mode', 'mode-enfant', 'Mode enfant', 7), ('mode', 'tissus-wax', 'Tissus et wax', 8),
  ('electronique', 'telephones', 'Téléphones', 1), ('electronique', 'ordinateurs', 'Ordinateurs', 2),
  ('electronique', 'accessoires-telephone', 'Accessoires téléphone', 3), ('electronique', 'audio', 'Audio et casques', 4),
  ('electronique', 'tv-video', 'TV et vidéo', 5), ('electronique', 'electromenager', 'Électroménager', 6),
  ('beaute', 'soins-peau', 'Soins de la peau', 1), ('beaute', 'cheveux', 'Cheveux et perruques', 2),
  ('beaute', 'maquillage', 'Maquillage', 3), ('beaute', 'parfums', 'Parfums et encens', 4),
  ('beaute', 'beaute-naturelle', 'Beauté naturelle', 5),
  ('maison', 'meubles', 'Meubles', 1), ('maison', 'decoration', 'Décoration', 2), ('maison', 'cuisine', 'Cuisine et vaisselle', 3),
  ('maison', 'linge-maison', 'Linge de maison', 4), ('maison', 'eclairage', 'Éclairage', 5),
  ('alimentation', 'epicerie', 'Épicerie', 1), ('alimentation', 'produits-locaux', 'Produits locaux', 2),
  ('alimentation', 'boissons', 'Boissons et jus', 3), ('alimentation', 'patisserie', 'Pâtisserie', 4),
  ('alimentation', 'plats-cuisines', 'Plats cuisinés', 5),
  ('agriculture', 'semences', 'Semences et plants', 1), ('agriculture', 'engrais', 'Engrais et intrants', 2),
  ('agriculture', 'materiel-agricole', 'Matériel agricole', 3), ('agriculture', 'elevage', 'Élevage', 4),
  ('agriculture', 'produits-recolte', 'Produits de récolte', 5),
  ('automobile', 'pieces-auto', 'Pièces auto', 1), ('automobile', 'accessoires-auto', 'Accessoires auto', 2),
  ('automobile', 'motos', 'Motos et scooters', 3), ('automobile', 'entretien-auto', 'Entretien', 4),
  ('sport', 'equipements-sport', 'Équipements de sport', 1), ('sport', 'vetements-sport', 'Vêtements de sport', 2),
  ('sport', 'fitness', 'Fitness', 3), ('sport', 'jeux-jouets', 'Jeux et jouets', 4), ('sport', 'musique', 'Instruments de musique', 5)
) as c(domain, slug, name, pos) join public.domains d on d.slug = c.domain
on conflict (slug) do nothing;
