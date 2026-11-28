// Calculs de Shoppy AI sur les données réelles de la boutique (aucune donnée inventée).
// Chaque indicateur indique son niveau de confiance selon le volume de données observé.

export interface ProductStat {
  id: string; title: string; slug: string; price: number; status: string; availability: string;
  stock: number | null; quality: number; category_id: number | null; unit_cost: number | null; extra_cost: number | null;
  views: number; views_prev: number; favorites: number; orders: number; units: number; revenue: number; last_order_at: string | null;
}
export interface SalesInsights {
  days: number;
  totals: { views: number; views_prev: number; orders: number; orders_prev: number; revenue: number; revenue_prev: number };
  weekdays: { dow: number; orders: number }[];
  products: ProductStat[];
}

export type Confidence = "faible" | "moyenne" | "bonne";
/** Confiance selon le nombre d'observations : en dessous de 30 consultations ou 5 commandes, prudence. */
export function confidence(views: number, orders = 0): Confidence {
  if (views >= 200 || orders >= 20) return "bonne";
  if (views >= 30 || orders >= 5) return "moyenne";
  return "faible";
}

/** Variation en % entre deux périodes ; null si la période précédente est vide (comparaison impossible). */
export function delta(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Taux de conversion consultations → commandes, en %. */
export function conversion(views: number, orders: number): number | null {
  if (!views) return null;
  return Math.round((orders / views) * 1000) / 10;
}

/** Marge unitaire et taux de marge, si le coût d'achat est renseigné. */
export function margin(price: number, unitCost: number | null, extraCost: number | null = 0) {
  if (unitCost == null) return null;
  const cost = unitCost + (extraCost ?? 0);
  const value = price - cost;
  return { cost, value, rate: price > 0 ? Math.round((value / price) * 1000) / 10 : 0 };
}

/** Prix minimum pour atteindre une marge souhaitée (en % du prix de vente). */
export function minPriceForMargin(cost: number, targetRatePct: number): number | null {
  if (targetRatePct >= 100 || targetRatePct < 0) return null;
  return Math.ceil(cost / (1 - targetRatePct / 100));
}

/** Rythme de vente (unités/jour) et nombre de jours de stock restants. */
export function stockCover(units: number, days: number, stock: number | null) {
  const perDay = days > 0 ? units / days : 0;
  const coverDays = stock == null || perDay === 0 ? null : Math.floor(stock / perDay);
  return { perDay: Math.round(perDay * 100) / 100, coverDays };
}

export interface Finding { kind: string; productId?: string; title: string; text: string; confidence: Confidence; tone: "danger" | "warning" | "success" | "neutral" }

/** Constats commerciaux par produit, classés par importance. */
export function salesFindings(ins: SalesInsights): Finding[] {
  const out: Finding[] = [];
  const pub = ins.products.filter((p) => p.status === "published");
  for (const p of pub) {
    const conv = conversion(p.views, p.orders);
    if (p.views >= 10 && p.orders === 0) {
      out.push({ kind: "views_no_orders", productId: p.id, tone: "warning", confidence: confidence(p.views),
        title: `« ${p.title} » attire mais ne se vend pas`,
        text: `${p.views} consultations sur ${ins.days} jours, aucune commande. Vérifiez le prix, les photos, la description et les frais de livraison.` });
    } else if (conv != null && conv >= 5 && p.views >= 5 && p.views < 30) {
      out.push({ kind: "converts_low_traffic", productId: p.id, tone: "success", confidence: confidence(p.views, p.orders),
        title: `« ${p.title} » convertit bien`,
        text: `${conv} % des visiteurs commandent, mais il n'a que ${p.views} consultations. Mettez-le en avant (partage, publicité).` });
    }
    const d = delta(p.views, p.views_prev);
    if (d != null && d <= -40 && p.views_prev >= 15) {
      out.push({ kind: "views_drop", productId: p.id, tone: "danger", confidence: confidence(p.views_prev),
        title: `Baisse des consultations de « ${p.title} »`, text: `${d} % par rapport à la période précédente (${p.views_prev} → ${p.views}).` });
    }
  }
  const order: Record<Finding["tone"], number> = { danger: 0, warning: 1, success: 2, neutral: 3 };
  return out.sort((a, b) => order[a.tone] - order[b.tone]);
}

export interface StockAlert { productId: string; title: string; level: "rupture" | "faible" | "dormant" | "incoherent"; text: string }

export function stockAlerts(ins: SalesInsights): StockAlert[] {
  const out: StockAlert[] = [];
  const now = Date.now();
  for (const p of ins.products.filter((x) => x.status === "published")) {
    const cov = stockCover(p.units, ins.days, p.stock);
    if (p.availability === "out_of_stock" && p.views > 0) out.push({ productId: p.id, title: p.title, level: "rupture", text: `En rupture alors que ${p.views} personnes l'ont consulté sur ${ins.days} jours.` });
    else if (cov.coverDays != null && cov.coverDays <= 7) out.push({ productId: p.id, title: p.title, level: "faible", text: `Il reste ${p.stock} unité(s), soit environ ${cov.coverDays} jour(s) au rythme actuel (${cov.perDay}/jour). Estimation.` });
    if (p.stock === 0 && p.availability === "in_stock") out.push({ productId: p.id, title: p.title, level: "incoherent", text: "Stock à 0 mais affiché « en stock » : corrigez la disponibilité." });
    const last = p.last_order_at ? new Date(p.last_order_at).getTime() : null;
    if ((p.stock ?? 0) > 0 && (last == null || now - last > 60 * 86400000)) out.push({ productId: p.id, title: p.title, level: "dormant", text: `Aucune vente depuis ${last ? "plus de 60 jours" : "sa mise en ligne"} avec ${p.stock} unité(s) en stock. Pensez à une offre groupée ou une promotion.` });
  }
  return out;
}

export const WEEKDAYS = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
