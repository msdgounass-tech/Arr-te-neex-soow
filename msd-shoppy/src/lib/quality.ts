// Indicateur de qualité de présentation — mêmes règles que public.compute_product_quality (SQL).
// Il ne bloque jamais la publication : seules les informations obligatoires le font (catégorie + 1 photo).

export interface QualityInput {
  title: string; description: string; price: number; categoryId: number | null;
  availability: "in_stock" | "out_of_stock" | "on_order"; stock: number | null; hasVariantStock: boolean;
  images: { width: number }[];
}
export interface QualityTip { key: string; points: number; message: string; how: string }

export function productQuality(p: QualityInput): { score: number; tips: QualityTip[] } {
  const tips: QualityTip[] = [];
  let score = 0;
  const n = p.images.length;
  const minW = n ? Math.min(...p.images.map((i) => i.width)) : 0;
  const photo = n >= 3 ? 25 : n === 2 ? 20 : n === 1 ? 12 : 0;
  score += photo;
  if (n < 3) tips.push({ key: "photos", points: 25 - photo, message: n === 0 ? "Ajoutez des photos" : `Ajoutez ${3 - n} photo${3 - n > 1 ? "s" : ""} de plus`,
    how: "Montrez le produit de face, de dos et en situation. Trois photos rassurent l'acheteur." });
  if (n > 0 && minW >= 800) score += 5;
  else if (n > 0) tips.push({ key: "resolution", points: 5, message: "Utilisez des photos plus nettes (800 px de large minimum)",
    how: "Photographiez à la lumière du jour, sans zoom numérique, puis recadrez." });

  const tl = p.title.trim().length;
  const t = tl >= 15 && tl <= 80 ? 15 : tl >= 8 ? 8 : tl >= 3 ? 3 : 0;
  score += t;
  if (t < 15) tips.push({ key: "title", points: 15 - t, message: tl > 80 ? "Raccourcissez le titre (80 caractères maximum)" : "Précisez le titre",
    how: "Indiquez le type de produit, la matière ou la marque et un détail utile : « Robe wax coupe droite, coton ». " });

  const dl = p.description.trim().length;
  const d = dl >= 200 ? 25 : dl >= 80 ? 15 : dl >= 20 ? 7 : 0;
  score += d;
  if (d < 25) tips.push({ key: "description", points: 25 - d, message: dl === 0 ? "Ajoutez une description" : "Complétez la description (200 caractères conseillés)",
    how: "Décrivez les dimensions, la matière, l'entretien, ce qui est inclus et le délai de livraison." });

  if (p.price > 0) score += 10;
  else tips.push({ key: "price", points: 10, message: "Indiquez un prix", how: "Un prix affiché attire plus de commandes qu'un « prix sur demande »." });
  if (p.categoryId != null) score += 10;
  else tips.push({ key: "category", points: 10, message: "Choisissez une catégorie", how: "La catégorie permet aux acheteurs de trouver votre produit dans Explorer." });

  const avail = p.availability !== "in_stock" || p.stock != null || p.hasVariantStock ? 10 : 5;
  score += avail;
  if (avail < 10) tips.push({ key: "stock", points: 5, message: "Indiquez la quantité disponible",
    how: "Un stock renseigné évite les commandes impossibles à honorer." });

  return { score: Math.min(score, 100), tips: tips.sort((a, b) => b.points - a.points) };
}

export function qualityLabel(score: number): { label: string; tone: "success" | "warning" | "danger" } {
  if (score >= 80) return { label: "Excellente présentation", tone: "success" };
  if (score >= 55) return { label: "Bonne présentation, à compléter", tone: "warning" };
  return { label: "Présentation à améliorer", tone: "danger" };
}
