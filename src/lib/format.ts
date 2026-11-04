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

/** Normalise un numéro sénégalais au format international sans « + » (ex. 221771234567). */
export const toWhatsAppNumber = (raw: string) => {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 9) return "221" + digits;
  if (digits.startsWith("00")) return digits.slice(2);
  return digits;
};
