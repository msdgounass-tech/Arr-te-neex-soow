"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";
import type { DeliveryZone, PaymentMethod } from "@/lib/types";
import { formatPrice, PAYMENT_METHOD_LABEL, previewDeliveryFee } from "@/lib/format";
import { cartSubtotal, useCart } from "@/store/cart";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartValidation } from "@/hooks/useCartValidation";
import { EmptyState } from "@/components/ui/EmptyState";
import { CouponBox } from "./CouponBox";

type Mode = "api" | "lien" | "livraison" | null;

const METHODS: { id: PaymentMethod; hint: string; linkHint?: string }[] = [
  { id: "wave", hint: "Payez instantanément depuis l'application Wave.", linkHint: "Payez via le lien Wave de la boutique. La commande est confirmée après vérification du paiement." },
  { id: "orange_money", hint: "Validez le paiement dans Orange Money / Max it.", linkHint: "Payez via le lien Orange Money de la boutique. Confirmation après vérification." },
  { id: "carte", hint: "Visa, Mastercard — paiement sécurisé 3-D Secure." },
  { id: "livraison", hint: "Réglez en espèces ou par mobile money à la réception." },
];


type Form = Record<"customer_name" | "email" | "phone" | "whatsapp" | "address_line" | "city" | "region" | "zone_id" | "notes", string>;

export function CheckoutForm({ zones, modes, origin, prefill, loggedIn }: { zones: DeliveryZone[]; modes: Record<PaymentMethod, Mode>; origin: { lat: number; lng: number; factor: number } | null; prefill: Record<string, string>; loggedIn: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { lines, coupon, clear } = useCart();
  const { notice: cartNotice } = useCartValidation(hydrated);
  const [sameWa, setSameWa] = useState(!prefill.whatsapp);
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState<PaymentMethod | null>(modes.livraison ? "livraison" : (METHODS.find((m) => modes[m.id])?.id ?? null));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const locate = () => {
    if (!("geolocation" in navigator)) return setLocError("La géolocalisation n'est pas disponible sur cet appareil.");
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: Math.round(p.coords.latitude * 1e6) / 1e6, lng: Math.round(p.coords.longitude * 1e6) / 1e6 });
        setLocating(false);
      },
      () => {
        setLocError("Position non obtenue. Autorisez la localisation ou décrivez précisément votre adresse.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };
  const [f, setF] = useState<Form>({
    customer_name: prefill.customer_name || "",
    email: prefill.email || "",
    phone: prefill.phone || "",
    whatsapp: prefill.whatsapp || "",
    address_line: prefill.address_line || "",
    city: prefill.city || "",
    region: prefill.region || "",
    zone_id: zones.some((z) => z.id === prefill.zone_id) ? prefill.zone_id : zones[0]?.id || "",
    notes: "",
  });
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const subtotal = cartSubtotal(lines);
  const discount = coupon && coupon.subtotal === subtotal ? coupon.discount : 0;
  const zone = zones.find((z) => z.id === f.zone_id);
  const delivery = useMemo(() => (zone ? previewDeliveryFee(zone, subtotal - discount, pos, origin) : null), [zone, subtotal, discount, pos, origin]);
  const fee = delivery?.fee ?? 0;
  const total = subtotal - discount + fee;
  const feeLabel = !zone ? "—" : delivery?.free ? "Offerte" : delivery?.pending ? "À confirmer" : delivery?.needsLocation ? "Position requise" : delivery?.outOfRange ? "Hors zone" : fee === 0 ? "Offerte" : formatPrice(fee);

  if (!hydrated) return <div className="min-h-[60vh]" />;
  if (!lines.length) {
    return (
      <div className="container-luxe pt-24">
        <EmptyState title="Votre panier est vide" text="Ajoutez des pièces à votre panier pour passer commande." cta={{ href: "/shop", label: "Explorer la boutique" }} />
      </div>
    );
  }

  const confirm = async () => {
    if (!method) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          whatsapp: sameWa || !f.whatsapp ? f.phone : f.whatsapp,
          city: f.city || zone?.name || "Dakar",
          payment_method: method,
          coupon_code: discount ? coupon?.code : "",
          save_address: loggedIn && saveAddress,
          lat: pos?.lat ?? null,
          lng: pos?.lng ?? null,
          items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "La commande n'a pas pu être enregistrée.");
      clear();
      if (json.redirectUrl) {
        window.location.href = json.redirectUrl;
        return;
      }
      router.push(`/commande/confirmation/${json.orderNumber}?t=${json.token}${json.paymentError ? "&retour=erreur-init" : ""}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
      setSubmitting(false);
    }
  };

  const available = METHODS.filter((m) => modes[m.id]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!f.zone_id) return setError("Choisissez votre zone de livraison.");
    if (!method) return setError("Choisissez un moyen de paiement.");
    if (delivery?.needsLocation) return setError("Partagez votre position pour calculer la livraison.");
    if (delivery?.outOfRange) return setError("Votre position est hors de la zone choisie.");
    confirm();
  };

  return (
    <div className="container-luxe pt-10 md:pt-16">
      <h1 className="display mb-8 text-center text-4xl md:text-6xl">Commander</h1>
      {cartNotice && <p role="status" className="mb-6 border border-gold/40 bg-gold/[0.06] px-4 py-3 text-sm text-ivory">{cartNotice}</p>}
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <form onSubmit={submit} className="space-y-8">
          <div className="grid gap-5 md:grid-cols-2">
            <label><span className="label">Nom complet *</span><input required value={f.customer_name} onChange={set("customer_name")} autoComplete="name" className="field" /></label>
            <label><span className="label">Téléphone / WhatsApp *</span><input required type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="77 000 00 00" className="field" /></label>
          </div>

          <div>
            <p className="label mb-3">Zone de livraison *</p>
            {zones.length === 0 ? (
              <p className="border border-gold/30 p-4 text-sm">Livraison en cours de configuration. <Link className="text-gold" href="/contact">Nous contacter</Link></p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {zones.map((z) => (
                  <button
                    type="button"
                    key={z.id}
                    onClick={() => setF((s) => ({ ...s, zone_id: z.id }))}
                    aria-pressed={f.zone_id === z.id}
                    className={clsx("min-h-12 border px-3 py-2 text-left text-sm transition-colors", f.zone_id === z.id ? "border-gold bg-gold/10 text-gold" : "border-white/20 hover:border-white/40")}
                  >
                    {z.name}
                    {z.delay && <span className="block text-[0.72rem] text-mist">{z.delay}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="block"><span className="label">Adresse (quartier, rue, repère) *</span><input required value={f.address_line} onChange={set("address_line")} autoComplete="street-address" className="field" /></label>

          {zone?.fee_mode === "distance" && (
            <div className="flex items-center justify-between gap-3 border border-white/15 p-4 text-sm">
              <span>{pos ? `Position enregistrée${delivery?.km != null ? ` · ${delivery.km} km` : ""}` : "Position requise pour le tarif"}{locError && <span className="block text-xs text-danger">{locError}</span>}</span>
              <button type="button" onClick={locate} disabled={locating} className="btn btn-ghost-gold min-h-10 shrink-0 px-4">{locating ? "…" : pos ? "Mettre à jour" : "Ma position"}</button>
            </div>
          )}

          <div>
            <p className="label mb-3">Paiement *</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {available.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  aria-pressed={method === m.id}
                  className={clsx("flex min-h-12 items-center gap-3 border px-4 py-3 text-left text-sm transition-colors", method === m.id ? "border-gold bg-gold/10 text-gold" : "border-white/20 hover:border-white/40")}
                >
                  <span className={clsx("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", method === m.id ? "border-gold" : "border-white/40")}>{method === m.id && <span className="h-2 w-2 rounded-full bg-gold" />}</span>
                  {PAYMENT_METHOD_LABEL[m.id]}
                </button>
              ))}
            </div>
          </div>

          <details className="border-t border-white/[0.1] pt-4 text-sm">
            <summary className="cursor-pointer text-mist">Plus d&apos;options (e-mail, autre WhatsApp, note)</summary>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <label><span className="label">E-mail</span><input type="email" value={f.email} onChange={set("email")} autoComplete="email" className="field" /></label>
              <label><span className="label">Autre numéro WhatsApp</span><input type="tel" value={f.whatsapp} onChange={(e) => { setSameWa(!e.target.value); set("whatsapp")(e); }} className="field" /></label>
              <label className="md:col-span-2"><span className="label">Note pour la livraison</span><input value={f.notes} onChange={set("notes")} className="field" /></label>
            </div>
          </details>

          {delivery?.pending && <p className="text-xs text-gold">Frais de livraison confirmés par WhatsApp avant l&apos;envoi.</p>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={submitting} className="btn btn-gold w-full">
            {submitting ? "Envoi…" : `Commander · ${formatPrice(total)}`}
          </button>
          <p className="text-center text-xs text-mist">En commandant, vous acceptez nos <Link href="/conditions" className="text-gold">conditions de vente</Link>.</p>
        </form>

        <aside className="h-fit border border-white/[0.1] bg-ink-2 p-6 md:p-8 lg:sticky lg:top-28">
          <h2 className="display text-2xl">Votre commande</h2>
          <ul className="mt-6 max-h-72 space-y-4 overflow-y-auto pr-1">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-4">
                <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-ink-3">
                  {l.image && <Image src={l.image} alt="" fill sizes="64px" className="object-cover" />}
                  <span className="absolute right-0 top-0 bg-gold px-1.5 text-[0.78rem] font-bold text-ink">{l.quantity}</span>
                </span>
                <span className="flex-1 text-sm">
                  <span className="display block text-lg leading-tight">{l.name}</span>
                  <span className="text-xs text-mist">{[l.color, l.size].filter(Boolean).join(" · ")}</span>
                </span>
                <span className="text-sm">{formatPrice(l.unitPrice * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6"><CouponBox /></div>
          <dl className="mt-6 space-y-3 border-t border-white/[0.1] pt-6 text-sm">
            <div className="flex justify-between"><dt className="text-mist">Sous-total</dt><dd>{formatPrice(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-gold"><dt>Réduction ({coupon?.code})</dt><dd>-{formatPrice(discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-mist">Livraison</dt><dd className={delivery?.pending ? "text-gold" : ""}>{feeLabel}</dd></div>
          </dl>
          <div className="hairline my-5" />
          <div className="flex items-baseline justify-between">
            <span className="label">{delivery?.pending ? "Total hors livraison" : "Total"}</span>
            <span className="display text-3xl">{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
