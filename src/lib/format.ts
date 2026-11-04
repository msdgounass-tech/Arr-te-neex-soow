import type { OrderStatus, PaymentMethod, PaymentStatus, Product, ProductVariant } from "./types";

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n)).replace(/ | /g, " ") + " FCFA";

export const formatDate = (d: string | Date, withTime = false) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Dakar",
  }).format(new Date(d));

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = ["en_attente", "confirmee", "en_preparation", "expediee", "livree"];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  en_attente: "En attente",
  initie: "Initié",
  reussi: "Payé",
  echoue: "Échoué",
  annule: "Annulé",
  rembourse: "Remboursé",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  carte: "Carte bancaire",
  livraison: "Paiement à la livraison",
};

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const variantPrice = (p: Pick<Product, "price">, v?: Pick<ProductVariant, "price_override"> | null) =>
  v?.price_override ?? p.price;

export const totalStock = (p: Pick<Product, "product_variants">) =>
  (p.product_variants || []).filter((v) => v.is_active).reduce((a, v) => a + (v.inventory?.quantity ?? 0), 0);

export const isOnSale = (p: Pick<Product, "price" | "compare_at_price">) =>
  p.compare_at_price != null && p.compare_at_price > p.price;

export const discountPercent = (p: Pick<Product, "price" | "compare_at_price">) =>
  isOnSale(p) ? Math.round((1 - p.price / (p.compare_at_price as number)) * 100) : 0;

export const sortedImages = (p: Pick<Product, "product_images">) =>
  [...(p.product_images || [])].sort((a, b) => a.position - b.position);

/** Affiche un numéro sénégalais à 9 chiffres sous la forme « 70 570 41 21 ». */
export const formatPhone = (raw: string) => {
  const d = (raw || "").replace(/\D/g, "").replace(/^221/, "");
  return d.length === 9 ? `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}` : raw;
};

/** Distance routière estimée (km) — même formule que la fonction SQL road_distance_km. */
export const roadDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number, factor = 1.3) => {
  const r = (x: number) => (x * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * factor * 10) / 10;
};

/** Aperçu des frais de livraison (le serveur recalcule toujours le montant définitif). */
export function previewDeliveryFee(
  zone: { fee: number; free_above: number | null; fee_mode: "fixed" | "distance" | "quote"; per_km_fee: number; max_km: number | null },
  amount: number,
  pos: { lat: number; lng: number } | null,
  origin: { lat: number; lng: number; factor: number } | null,
): { fee: number; pending: boolean; free: boolean; km: number | null; needsLocation: boolean; outOfRange: boolean } {
  const base = { fee: 0, pending: false, free: false, km: null as number | null, needsLocation: false, outOfRange: false };
  if (zone.free_above != null && amount >= zone.free_above) return { ...base, free: true };
  if (zone.fee_mode === "quote") return { ...base, pending: true };
  if (zone.fee_mode === "fixed") return { ...base, fee: zone.fee };
  if (!pos || !origin) return { ...base, needsLocation: true };
  const km = roadDistanceKm(origin.lat, origin.lng, pos.lat, pos.lng, origin.factor);
  if (zone.max_km != null && km > zone.max_km) return { ...base, km, outOfRange: true };
  return { ...base, km, fee: zone.fee + Math.ceil((km * zone.per_km_fee) / 100) * 100 };
}

/** Normalise un numéro sénégalais au format international sans « + » (ex. 221771234567). */
export const toWhatsAppNumber = (raw: string) => {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 9) return "221" + digits;
  if (digits.startsWith("00")) return digits.slice(2);
  return digits;
};
