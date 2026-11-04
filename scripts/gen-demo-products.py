"""Génère supabase/demo_products.sql : 3 produits exemples par catégorie (à modifier ensuite dans l'admin)."""
import os, re, unicodedata

def slug(s):
    s = s.replace("œ", "oe").replace("Œ", "Oe")
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:80]

CLOTH = ["S", "M", "L", "XL"]
SH_H = ["40", "41", "42", "43", "44", "45"]
SH_F = ["36", "37", "38", "39", "40", "41"]
U = ["Unique"]

# (catégorie, illustration, code, [(nom, description, prix, prix_barré|None, tailles, (couleur, hex))])
DATA = [
 ("homme-vetements", "veste", "H-VET", [
   ("Costume croisé Signature", "Costume croisé en laine légère, coupe ajustée et revers en pointe. Doublure satinée, boutons dorés.", 145000, None, CLOTH, ("Noir", "#111111")),
   ("Chemise en soie Ivoire", "Chemise en soie fluide au tombé impeccable, col italien et boutons nacrés.", 45000, None, CLOTH, ("Ivoire", "#F2EBDD")),
   ("Grand boubou brodé or", "Grand boubou en bazin riche, broderies dorées faites main au col et aux manches.", 95000, 115000, CLOTH, ("Bleu nuit", "#1B2A4A")),
 ]),
 ("homme-chaussures", "chaussure", "H-CHA", [
   ("Mocassins en cuir verni", "Mocassins en cuir verni, semelle cuir et mors doré. L'élégance au quotidien.", 65000, None, SH_H, ("Noir", "#111111")),
   ("Derbies cuir Prestige", "Derbies en cuir pleine fleur patiné à la main, finitions cousues.", 75000, None, SH_H, ("Cognac", "#8A4B22")),
   ("Baskets cuir blanc & or", "Baskets basses en cuir lisse, détails dorés et semelle confort.", 55000, 69000, SH_H, ("Blanc", "#F5F5F0")),
 ]),
 ("homme-montres", "montre", "H-MON", [
   ("Montre Héritage acier & or", "Boîtier acier 42 mm, cadran noir soleillé et index dorés. Étanche 50 m.", 185000, None, U, ("Or & noir", "#C6A15B")),
   ("Chronographe Nuit", "Chronographe au cadran bleu nuit, bracelet acier et verre saphir.", 145000, None, U, ("Bleu nuit", "#1B2A4A")),
   ("Montre Classique cuir", "Montre fine au cadran ivoire, bracelet cuir d'alligator embossé.", 95000, 115000, U, ("Marron", "#5A3A22")),
 ]),
 ("homme-sacs", "sac", "H-SAC", [
   ("Porte-documents cuir noir", "Porte-documents en cuir grainé, compartiment ordinateur et fermoir doré.", 120000, None, U, ("Noir", "#111111")),
   ("Sac week-end Cognac", "Sac de voyage en cuir souple, anses renforcées et bandoulière amovible.", 135000, None, U, ("Cognac", "#8A4B22")),
   ("Pochette cuir grainé", "Pochette zippée en cuir grainé, idéale pour le soir.", 45000, None, U, ("Noir", "#111111")),
 ]),
 ("homme-lunettes", "lunettes", "H-LUN", [
   ("Solaires Aviateur or", "Monture métal dorée, verres polarisés dégradés. Protection UV400.", 45000, None, U, ("Or", "#C6A15B")),
   ("Solaires Carrées noires", "Monture acétate noire épaisse, verres fumés. Protection UV400.", 38000, None, U, ("Noir", "#111111")),
   ("Monture Écaille", "Monture optique en acétate écaille, charnières renforcées.", 35000, 42000, U, ("Écaille", "#6B4423")),
 ]),
 ("homme-parfums", "parfum", "H-PAR", [
   ("Oud Royal — 100 ml", "Eau de parfum boisée et ambrée : oud, safran et cuir.", 65000, None, U, ("100 ml", None)),
   ("Ambre Noir — 100 ml", "Eau de parfum orientale : ambre, vanille noire et patchouli.", 58000, None, U, ("100 ml", None)),
   ("Bois de Santal — 50 ml", "Eau de parfum fraîche et boisée : santal, bergamote et vétiver.", 42000, None, U, ("50 ml", None)),
 ]),
 ("homme-bijoux", "bijou", "H-BIJ", [
   ("Chevalière plaqué or", "Chevalière en argent plaqué or 18 carats, plateau poli miroir.", 55000, None, ["58", "60", "62", "64"], ("Or", "#C6A15B")),
   ("Bracelet maille or", "Bracelet en maille gourmette plaqué or, fermoir sécurisé.", 48000, None, U, ("Or", "#C6A15B")),
   ("Boutons de manchette onyx", "Boutons de manchette en onyx noir serti de doré.", 35000, None, U, ("Noir & or", "#111111")),
 ]),
 ("homme-accessoires", "ceinture", "H-ACC", [
   ("Ceinture cuir boucle or", "Ceinture en cuir de veau, boucle ardillon dorée.", 35000, None, ["90", "95", "100", "105"], ("Noir", "#111111")),
   ("Cravate en soie", "Cravate en soie tissée, motif micro-géométrique.", 25000, None, U, ("Bordeaux", "#5C1A1B")),
   ("Porte-cartes cuir", "Porte-cartes en cuir grainé, quatre emplacements.", 20000, 25000, U, ("Noir", "#111111")),
 ]),
 ("femme-vetements", "chemise", "F-VET", [
   ("Blouse en soie Champagne", "Blouse en soie lavée, col lavallière et manches bouffantes.", 55000, None, CLOTH, ("Champagne", "#E8D6B5")),
   ("Ensemble tailleur crème", "Veste ajustée et pantalon large en crêpe fluide.", 125000, None, CLOTH, ("Crème", "#F2EBDD")),
   ("Kaftan brodé or", "Kaftan ample en voile de soie, broderies dorées au col.", 98000, None, CLOTH, ("Noir", "#111111")),
 ]),
 ("femme-robes", "robe", "F-ROB", [
   ("Robe de soirée satin noir", "Robe longue en satin, dos drapé et fente latérale.", 135000, None, CLOTH, ("Noir", "#111111")),
   ("Robe longue drapée émeraude", "Robe longue drapée en jersey de soie, ceinture marquée.", 115000, 140000, CLOTH, ("Émeraude", "#0F5132")),
   ("Robe cocktail dorée", "Robe courte pailletée dorée, encolure carrée.", 89000, None, CLOTH, ("Or", "#C6A15B")),
 ]),
 ("femme-chaussures", "escarpin", "F-CHA", [
   ("Escarpins vernis noirs", "Escarpins pointus en cuir verni, talon aiguille 10 cm.", 75000, None, SH_F, ("Noir", "#111111")),
   ("Sandales à talons dorées", "Sandales à brides fines en cuir métallisé, talon 9 cm.", 68000, None, SH_F, ("Or", "#C6A15B")),
   ("Mules en satin", "Mules en satin avec bijou de cheville, talon 6 cm.", 52000, 62000, SH_F, ("Ivoire", "#F2EBDD")),
 ]),
 ("femme-sacs", "sac", "F-SAC", [
   ("Sac à main structuré noir", "Sac à main en cuir saffiano, fermoir doré et bandoulière.", 145000, None, U, ("Noir", "#111111")),
   ("Pochette de soirée dorée", "Minaudière dorée ornée, chaîne amovible.", 65000, None, U, ("Or", "#C6A15B")),
   ("Cabas cuir camel", "Grand cabas en cuir souple, pochette intérieure zippée.", 110000, None, U, ("Camel", "#B07A44")),
 ]),
 ("femme-montres", "montre", "F-MON", [
   ("Montre Joaillerie or rose", "Boîtier 32 mm serti, cadran nacré et bracelet or rose.", 165000, None, U, ("Or rose", "#D4A08A")),
   ("Montre Élégance maille", "Montre fine au bracelet milanais doré, cadran champagne.", 125000, None, U, ("Or", "#C6A15B")),
   ("Montre Minimaliste cuir", "Cadran épuré et bracelet cuir noir, boîtier 34 mm.", 85000, 99000, U, ("Noir", "#111111")),
 ]),
 ("femme-lunettes", "lunettes", "F-LUN", [
   ("Solaires Papillon", "Monture papillon en acétate noir, branches dorées.", 42000, None, U, ("Noir", "#111111")),
   ("Solaires Oversize écaille", "Grande monture écaille, verres dégradés marron.", 45000, None, U, ("Écaille", "#6B4423")),
   ("Solaires Œil-de-chat or", "Monture œil-de-chat métal doré, verres fumés.", 48000, None, U, ("Or", "#C6A15B")),
 ]),
 ("femme-parfums", "parfum", "F-PAR", [
   ("Rose Impériale — 100 ml", "Eau de parfum florale : rose de Damas, litchi et musc blanc.", 68000, None, U, ("100 ml", None)),
   ("Jasmin de Nuit — 100 ml", "Eau de parfum florale ambrée : jasmin, tubéreuse et ambre.", 62000, None, U, ("100 ml", None)),
   ("Vanille Dorée — 50 ml", "Eau de parfum gourmande : vanille, fève tonka et santal.", 45000, None, U, ("50 ml", None)),
 ]),
 ("femme-bijoux", "bijou", "F-BIJ", [
   ("Collier pendentif or", "Collier fin plaqué or 18 carats, pendentif goutte.", 75000, None, U, ("Or", "#C6A15B")),
   ("Boucles d'oreilles perles", "Créoles dorées ornées de perles d'eau douce.", 45000, None, U, ("Or & perle", "#F2EBDD")),
   ("Bague solitaire", "Bague solitaire en argent plaqué or, oxyde de zirconium.", 85000, 98000, ["50", "52", "54", "56"], ("Or", "#C6A15B")),
 ]),
 ("femme-accessoires", "ceinture", "F-ACC", [
   ("Foulard en soie imprimé", "Carré de soie 90 × 90 cm, imprimé exclusif ourlé main.", 35000, None, U, ("Or & noir", "#C6A15B")),
   ("Ceinture fine dorée", "Ceinture fine en cuir, boucle bijou dorée.", 28000, None, ["S", "M", "L"], ("Noir", "#111111")),
   ("Barrette bijou", "Barrette ornée de cristaux, finition dorée.", 18000, None, U, ("Or", "#C6A15B")),
 ]),
]

GENDER = {"homme": "homme", "femme": "femme"}
SIGNATURE = {"Costume croisé Signature", "Robe de soirée satin noir", "Montre Héritage acier & or", "Sac à main structuré noir", "Oud Royal — 100 ml", "Collier pendentif or"}

q = lambda s: "$q$" + s + "$q$"
out = ["-- Produits exemples GOUNASS LUXURY (à modifier ou supprimer dans Admin › Produits)",
       "insert into public.collections (name, slug, tagline, description, is_featured, is_exclusive, position) values",
       "  ('Signature', 'signature', 'L''essentiel de la maison', 'Une sélection de pièces emblématiques GOUNASS LUXURY pour les grandes occasions.', true, true, 1)",
       "on conflict (slug) do nothing;"]
for cat, kind, code, items in DATA:
    gender = GENDER[cat.split("-")[0]]
    for i, (name, desc, price, compare, sizes, (color, hexv)) in enumerate(items, 1):
        ref = f"GL-{code}-{i:02d}"
        img1 = f"/images/produits/{kind}-{(i - 1) % 3 + 1}.svg"
        img2 = f"/images/produits/{kind}-{i % 3 + 1}.svg"
        coll = "(select id from public.collections where slug = 'signature')" if name in SIGNATURE else "null"
        out.append(f"""with p as (
  insert into public.products (name, slug, reference, description, category_id, collection_id, gender, price, compare_at_price, is_featured, is_new, is_active)
  values ({q(name)}, '{slug(name)}', '{ref}', {q(desc)}, (select id from public.categories where slug = '{cat}'), {coll}, '{gender}', {price}, {compare or 'null'}, {'true' if name in SIGNATURE else 'false'}, {'true' if i == 1 else 'false'}, true)
  on conflict (reference) do nothing returning id
), im as (
  insert into public.product_images (product_id, url, alt, position)
  select p.id, x.url, {q(name)}, x.pos from p, (values ('{img1}', 0), ('{img2}', 1)) as x(url, pos)
), v as (
  insert into public.product_variants (product_id, size, color, color_hex, sku, position)
  select p.id, s.size, {q(color)}, {q(hexv) if hexv else 'null'}, '{ref}-' || upper(regexp_replace(s.size, '\\s', '', 'g')), s.pos
    from p, (values {", ".join(f"('{s}', {k})" for k, s in enumerate(sizes))}) as s(size, pos)
  returning id
)
insert into public.inventory (variant_id, quantity) select id, 5 from v;""")
path = os.path.join(os.path.dirname(__file__), "..", "supabase", "demo_products.sql")
open(path, "w").write("\n".join(out) + "\n")
print(sum(len(d[3]) for d in DATA), "produits ->", path)
