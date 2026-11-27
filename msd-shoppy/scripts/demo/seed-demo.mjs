// Remplit le mode démo de Shoppy by MSD en passant par les mêmes règles que les vrais utilisateurs (RLS, fonctions métier).
// Usage : NODE_USE_ENV_PROXY=1 node scripts/demo/seed-demo.mjs <dossier_images>
// Les comptes de démo (…@demo.msdshoppy.sn, mot de passe DemoMSD2026) doivent exister ; les boutiques sont ensuite marquées is_demo.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const U = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://anpmpveswepsfpdyewxv.supabase.co";
const K = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_s7b-VJdbIZrwZVwK6NiPMw_iqUcNzQq";
const IMG = process.argv[2] ?? "/tmp/claude-0/demo-img";
const PASS = "DemoMSD2026";
const log = (...a) => console.log(...a);
async function login(email) {
  const sb = createClient(U, K, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`${email}: ${error.message}`);
  return sb;
}
const must = (r, what) => { if (r.error) throw new Error(`${what}: ${r.error.message}`); return r.data; };

const SHOPS = [
  { email: "awa.couture@demo.msdshoppy.sn", logo: "awa", name: "Awa Couture", domain: "mode", specs: ["vetements-femme", "tenues-traditionnelles", "tissus-wax"],
    region: "Dakar", city: "Dakar Plateau", phone: "771112233", whatsapp: "771112233",
    description: "Atelier de couture à Dakar depuis 2015. Robes, ensembles et tenues traditionnelles en wax et bazin, cousus sur place. Livraison à Dakar en 48 h, expédition dans tout le Sénégal.",
    zones: [{ name: "Dakar et banlieue", method: "delivery", regions: ["Dakar"], fee: 1500, min_days: 1, max_days: 2 }, { name: "Retrait à l'atelier", method: "pickup", regions: [], fee: 0, min_days: 0, max_days: 1 }, { name: "Expédition régions", method: "shipping", regions: [], fee: 3000, min_days: 2, max_days: 5 }],
    products: [
      { img: "robe-wax", title: "Robe wax coupe droite, 100 % coton", price: 15000, cat: "vetements-femme", sku: "AC-RW-01", description: "Robe droite en wax 100 % coton, doublée, longueur genou. Fermeture éclair au dos. Lavage à 30 °C sur l'envers. Cousue dans notre atelier de Dakar ; chaque pièce est unique selon le tissu disponible.", variants: [{ size: "S", stock: 3 }, { size: "M", stock: 5 }, { size: "L", stock: 2 }] },
      { img: "boubou", title: "Grand boubou brodé en bazin riche", price: 35000, cat: "tenues-traditionnelles", sku: "AC-BB-02", description: "Grand boubou homme en bazin riche teint à la main, broderie au col et à la poitrine. Livré avec pantalon assorti. Taille unique ample (du M au XXL). Délai de confection : 3 jours.", availability: "on_order" },
      { img: "tailleur", title: "Ensemble tailleur wax femme", price: 25000, compare: 30000, cat: "vetements-femme", sku: "AC-ET-03", description: "Veste cintrée et jupe crayon en wax, parfait pour le bureau et les cérémonies. Tailles S à XL. Retouches gratuites à l'atelier.", variants: [{ size: "M", stock: 2 }, { size: "L", stock: 2 }] },
      { img: "tissu", title: "Tissu wax 6 yards (5,5 m)", price: 9000, cat: "tissus-wax", sku: "AC-TW-04", description: "Coupon de wax 6 yards, coton imprimé double face, idéal pour une tenue complète. Motifs selon arrivage.", stock: 20 },
    ] },
  { email: "moussa.tech@demo.msdshoppy.sn", logo: "moussa", name: "Moussa Tech", domain: "electronique", specs: ["telephones", "accessoires-telephone", "ordinateurs"],
    region: "Thiès", city: "Thiès Ville", phone: "781234455", whatsapp: "781234455",
    description: "Téléphones, ordinateurs et accessoires garantis à Thiès. Produits testés devant vous, garantie boutique de 3 mois sur l'occasion. Livraison Thiès et Dakar.",
    zones: [{ name: "Thiès ville", method: "delivery", regions: ["Thiès"], fee: 1000, min_days: 0, max_days: 1 }, { name: "Dakar", method: "delivery", regions: ["Dakar"], fee: 2500, min_days: 1, max_days: 2 }],
    products: [
      { img: "smartphone", title: "Smartphone Android 6,5 pouces 128 Go", price: 95000, cat: "telephones", sku: "MT-SP-128", description: "Écran 6,5 pouces, 128 Go de stockage, 4 Go de mémoire, double SIM, batterie 5000 mAh. Livré avec chargeur et coque. Garantie 6 mois.", variants: [{ color: "Noir", stock: 4 }, { color: "Bleu", stock: 2 }] },
      { img: "ecouteurs", title: "Écouteurs Bluetooth sans fil avec boîtier", price: 12500, cat: "accessoires-telephone", sku: "MT-EB-02", description: "Écouteurs Bluetooth 5.3, autonomie 5 h (25 h avec le boîtier), réduction de bruit en appel. Compatibles Android et iPhone.", stock: 15 },
      { img: "chargeur", title: "Chargeur rapide 20 W USB-C", price: 5000, cat: "accessoires-telephone", sku: "MT-CH-20", description: "Chargeur secteur 20 W avec câble USB-C 1 m. Charge rapide compatible avec la plupart des téléphones récents.", stock: 30 },
      { img: "ordinateur", title: "Ordinateur portable 15 pouces reconditionné", price: 185000, cat: "ordinateurs", sku: "MT-PC-15", description: "Processeur Core i5, 8 Go de mémoire, SSD 256 Go, Windows 11. Reconditionné et testé, batterie neuve. Garantie 3 mois. Sur commande sous 5 jours.", availability: "on_order" },
    ] },
  { email: "fatou.beaute@demo.msdshoppy.sn", logo: "fatou", name: "Fatou Beauté Naturelle", domain: "beaute", specs: ["beaute-naturelle", "soins-peau", "parfums"],
    region: "Saint-Louis", city: "Saint-Louis", phone: "761239876", whatsapp: "761239876",
    description: "Cosmétiques naturels fabriqués à Saint-Louis : karité, savon noir, huiles végétales et encens traditionnels. Ingrédients locaux, sans parfum de synthèse.",
    zones: [{ name: "Saint-Louis", method: "delivery", regions: ["Saint-Louis"], fee: 1000, min_days: 1, max_days: 2 }, { name: "Expédition tout le Sénégal", method: "shipping", regions: [], fee: 2500, min_days: 2, max_days: 4 }],
    products: [
      { img: "karite", title: "Beurre de karité pur, pot de 250 g", price: 3500, cat: "soins-peau", sku: "FB-KA-250", description: "Beurre de karité brut non raffiné, pour la peau et les cheveux. Pot en verre de 250 g. Se conserve 18 mois à l'abri de la chaleur.", stock: 40 },
      { img: "savon", title: "Savon noir naturel au karité", price: 2000, cat: "beaute-naturelle", sku: "FB-SN-01", description: "Savon noir artisanal à base de karité et d'huile d'arachide. Nettoie en douceur le visage et le corps. Pain de 150 g.", stock: 60 },
      { img: "baobab", title: "Huile de baobab vierge 100 ml", price: 6000, cat: "soins-peau", sku: "FB-HB-100", description: "Huile de pépins de baobab pressée à froid. Nourrit les peaux sèches et les cheveux. Flacon ambré 100 ml avec compte-gouttes.", stock: 18 },
      { img: "encens", title: "Encens thiouraye traditionnel", price: 4000, cat: "parfums", sku: "FB-TH-01", description: "Thiouraye préparé à la main selon la recette familiale. Sachet de 100 g, parfum boisé et durable.", stock: 25 },
    ] },
  { email: "ibrahima.terroir@demo.msdshoppy.sn", logo: "ibrahima", name: "Terroir du Saloum", domain: "alimentation", specs: ["produits-locaux", "epicerie", "boissons"],
    region: "Kaolack", city: "Kaolack", phone: "771239900", whatsapp: "771239900",
    description: "Produits du terroir du Saloum : arachides, bissap, miel et céréales locales. Achat direct aux producteurs, conditionnement à Kaolack.",
    zones: [{ name: "Kaolack et environs", method: "delivery", regions: ["Kaolack", "Fatick", "Kaffrine"], fee: 1000, min_days: 1, max_days: 2 }],
    products: [
      { img: "arachides", title: "Arachides grillées du Saloum, sachet 1 kg", price: 2500, cat: "produits-locaux", sku: "TS-AR-1K", description: "Arachides de Kaolack grillées au feu de bois, légèrement salées. Sachet refermable de 1 kg.", stock: 50 },
      { img: "bissap", title: "Fleurs de bissap séchées 500 g", price: 3000, cat: "boissons", sku: "TS-BI-500", description: "Calices d'hibiscus séchés au soleil pour préparer le jus de bissap. 500 g donnent environ 10 litres de boisson.", stock: 35 },
      { img: "miel", title: "Miel pur de Casamance 500 g", price: 7500, cat: "produits-locaux", sku: "TS-MI-500", description: "Miel brut récolté en Casamance, non chauffé. Pot de 500 g.", stock: 12 },
      { img: "thiakry", title: "Thiakry prêt à préparer 1 kg", price: 2000, cat: "epicerie", sku: "TS-TK-1K", description: "Granulés de mil roulés à la main pour thiakry et dégué. Sachet de 1 kg. Actuellement en rupture : nouvelle production la semaine prochaine.", availability: "out_of_stock" },
    ] },
];

const pub = createClient(U, K, { auth: { persistSession: false } });
const domains = Object.fromEntries((must(await pub.from("domains").select("id, slug"), "domaines")).map((d) => [d.slug, d.id]));
const cats = Object.fromEntries((must(await pub.from("categories").select("id, slug"), "catégories")).map((c) => [c.slug, c.id]));
const created = {};

for (const s of SHOPS) {
  const sb = await login(s.email);
  const uid = (await sb.auth.getUser()).data.user.id;
  let shopId = (await sb.from("shops").select("id").eq("owner_id", uid).maybeSingle()).data?.id;
  if (!shopId) {
    shopId = must(await sb.rpc("create_shop", { p_name: s.name, p_description: s.description, p_domain_id: domains[s.domain], p_specialties: s.specs.map((c) => cats[c]),
      p_country: "SN", p_region: s.region, p_city: s.city, p_public_phone: s.phone, p_public_whatsapp: s.whatsapp, p_public_email: null, p_logo_url: null }), `boutique ${s.name}`);
  }
  const shop = must(await sb.from("shops").select("logo_url").eq("id", shopId).single(), "boutique");
  if (!shop.logo_url) {
    const logoPath = `shops/${shopId}/logo/${s.logo}-${Date.now()}.webp`;
    must(await sb.storage.from("media").upload(logoPath, readFileSync(`${IMG}/logo-${s.logo}.webp`), { contentType: "image/webp", upsert: false }), "logo");
    must(await sb.from("shops").update({ logo_url: sb.storage.from("media").getPublicUrl(logoPath).data.publicUrl, return_policy: "Échange sous 3 jours si le produit n'a pas été utilisé." }).eq("id", shopId), "logo url");
  }
  const { count: nz } = await sb.from("shop_delivery_zones").select("id", { count: "exact", head: true }).eq("shop_id", shopId);
  if (!nz) for (const z of s.zones) must(await sb.from("shop_delivery_zones").insert({ ...z, shop_id: shopId }), "zone");
  created[s.email] = { sb, shopId, products: [] };
  const existing = must(await sb.from("products").select("id, sku").eq("shop_id", shopId), "produits existants");
  for (const p of s.products) {
    let pid = existing.find((e) => e.sku === p.sku)?.id;
    if (!pid) {
      pid = must(await sb.from("products").insert({ shop_id: shopId, title: p.title, description: p.description, price: p.price, compare_at_price: p.compare ?? null,
        category_id: cats[p.cat], sku: p.sku, availability: p.availability ?? "in_stock", stock: p.stock ?? null }).select("id").single(), p.title).id;
      for (const [i, v] of (p.variants ?? []).entries()) must(await sb.from("product_variants").insert({ product_id: pid, size: v.size ?? null, color: v.color ?? null, stock: v.stock, position: i, sku: `${p.sku}-${v.size ?? v.color}` }), "variante");
      for (const n of [1, 2]) {
        const path = `shops/${shopId}/products/${p.img}-${n}-${Date.now()}.webp`;
        must(await sb.storage.from("media").upload(path, readFileSync(`${IMG}/${p.img}-${n}.webp`), { contentType: "image/webp", upsert: false }), "photo");
        must(await sb.from("product_images").insert({ product_id: pid, url: sb.storage.from("media").getPublicUrl(path).data.publicUrl, width: 1000, height: 1000, position: n - 1 }), "image");
      }
      must(await sb.rpc("publish_product", { p_product: pid }), `publication ${p.title}`);
    }
    const variants = must(await sb.from("product_variants").select("id").eq("product_id", pid).order("position"), "variantes");
    created[s.email].products.push({ id: pid, variant: variants[0]?.id ?? null, out: p.availability === "out_of_stock" });
  }
  log(`✓ ${s.name} : ${s.products.length} produits publiés`);
}

// ── Clients : consultations, commandes, traitement par les vendeurs, avis
const buyers = { aminata: await login("aminata.client@demo.msdshoppy.sn"), cheikh: await login("cheikh.client@demo.msdshoppy.sn") };
const delivery = { aminata: { recipient_name: "Aminata Ba", phone: "770001122", region: "Dakar", city: "Sacré-Cœur 3", address_details: "Villa 112, près de la pharmacie", payment_method: "cash_on_delivery" },
                   cheikh: { recipient_name: "Cheikh Sarr", phone: "780003344", region: "Thiès", city: "Thiès Nord", address_details: "", payment_method: "wave_direct" } };
const { count: existingOrders } = await buyers.aminata.from("orders").select("id", { count: "exact", head: true });
if (!existingOrders) {
  for (const b of Object.values(buyers)) for (const s of Object.values(created)) for (const p of s.products) {
    await b.rpc("track_event", { p_shop: s.shopId, p_type: "shop_view" }); await b.rpc("track_event", { p_shop: s.shopId, p_type: "product_view", p_product: p.id });
  }
  const plan = [
    ["awa.couture@demo.msdshoppy.sn", 0, "aminata", "completed", 5, "Robe magnifique, couture soignée et livrée en 24 h."],
    ["awa.couture@demo.msdshoppy.sn", 2, "cheikh", "completed", 5, "Ensemble offert à ma femme, elle l'adore."],
    ["awa.couture@demo.msdshoppy.sn", 3, "aminata", "completed", 4, "Beau tissu, couleurs fidèles aux photos."],
    ["awa.couture@demo.msdshoppy.sn", 0, "cheikh", "completed", 5, "Très professionnelle, je recommande."],
    ["awa.couture@demo.msdshoppy.sn", 3, "cheikh", "completed", 4, ""],
    ["awa.couture@demo.msdshoppy.sn", 2, "aminata", "preparing"],
    ["moussa.tech@demo.msdshoppy.sn", 1, "aminata", "completed", 4, "Bon son, autonomie conforme."],
    ["moussa.tech@demo.msdshoppy.sn", 2, "cheikh", "completed", 5, "Livré le jour même à Thiès."],
    ["moussa.tech@demo.msdshoppy.sn", 0, "cheikh", "shipped"],
    ["moussa.tech@demo.msdshoppy.sn", 1, "cheikh", "pending"],
    ["fatou.beaute@demo.msdshoppy.sn", 0, "aminata", "completed", 5, "Karité de très bonne qualité."],
    ["fatou.beaute@demo.msdshoppy.sn", 1, "cheikh", "completed", 4, "Savon doux, odeur agréable."],
    ["fatou.beaute@demo.msdshoppy.sn", 2, "aminata", "pending"],
    ["ibrahima.terroir@demo.msdshoppy.sn", 0, "cheikh", "confirmed"],
    ["ibrahima.terroir@demo.msdshoppy.sn", 2, "aminata", "refused"],
  ];
  const FLOW = ["confirmed", "preparing", "shipped", "delivered"];
  for (const [seller, pi, buyer, target, rating, comment] of plan) {
    const s = created[seller]; const p = s.products[pi]; const b = buyers[buyer];
    const zone = (await b.from("shop_delivery_zones").select("id").eq("shop_id", s.shopId).limit(1)).data?.[0]?.id;
    const res = must(await b.rpc("place_orders", { p_items: [{ product_id: p.id, variant_id: p.variant, quantity: 1 }], p_delivery: { ...delivery[buyer], zones: zone ? { [s.shopId]: zone } : {} } }), "commande");
    const oid = res[0].id;
    if (target === "refused") { must(await s.sb.rpc("set_order_status", { p_order: oid, p_status: "refused", p_note: "Produit réservé pour une autre commande, nous vous recontactons dès réception." }), "refus"); continue; }
    for (const st of FLOW) { if (target === "pending") break; must(await s.sb.rpc("set_order_status", { p_order: oid, p_status: st }), st); if (st === target) break; }
    if (target === "completed") {
      must(await b.rpc("set_order_status", { p_order: oid, p_status: "completed" }), "réception");
      must(await b.rpc("submit_review", { p_order: oid, p_rating: rating, p_comment: comment }), "avis");
    }
  }
  for (const b of Object.values(buyers)) {
    const all = Object.values(created).flatMap((s) => s.products.slice(0, 2).map((p) => ({ user_id: null, product_id: p.id })));
    const uid = (await b.auth.getUser()).data.user.id;
    await b.from("favorite_products").upsert(all.slice(0, 4).map((x) => ({ ...x, user_id: uid })), { ignoreDuplicates: true });
  }
  log(`✓ ${plan.length} commandes, avis et favoris créés`);
} else log("commandes déjà présentes : étape ignorée");
log("SHOP_IDS", JSON.stringify(Object.values(created).map((s) => s.shopId)));
