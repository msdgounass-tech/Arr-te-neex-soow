const nf = new Intl.NumberFormat("fr-FR");

/** 15000 → « 15 000 FCFA » */
export function formatPrice(amount: number | null | undefined): string {
  if (amount == null) return "Prix sur demande";
  return `${nf.format(amount)} FCFA`;
}

export function formatNumber(n: number): string {
  return nf.format(n);
}

export function formatDate(iso: string, withTime = false): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Dakar",
  }).format(new Date(iso));
}

export function formatRelativeDays(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "aujourd'hui";
  if (days < 30) return `il y a ${days} jour${days > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

export function memberSince(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 30) return "Nouvelle boutique";
  return `Sur Shoppy by MSD depuis ${formatRelativeDays(iso).replace("il y a ", "")}`;
}

/** Normalise un numéro sénégalais en format international sans « + » (ex. 221771234567). */
export function toInternational(phone: string | null | undefined, prefix = "221"): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = prefix + digits;
  return digits.length >= 11 ? digits : null;
}

export function isValidSenegalPhone(phone: string): boolean {
  const d = phone.replace(/\D/g, "").replace(/^(00)?221/, "");
  return /^(70|71|72|75|76|77|78|33|30)\d{7}$/.test(d);
}

export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "").replace(/^(00)?221/, "");
  if (d.length !== 9) return phone;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

export function whatsappLink(phone: string | null | undefined, message: string): string | null {
  const intl = toInternational(phone);
  return intl ? `https://wa.me/${intl}?text=${encodeURIComponent(message)}` : null;
}

export function telLink(phone: string | null | undefined): string | null {
  const intl = toInternational(phone);
  return intl ? `tel:+${intl}` : null;
}

export function plural(n: number, one: string, many: string): string {
  return `${formatNumber(n)} ${n > 1 ? many : one}`;
}
