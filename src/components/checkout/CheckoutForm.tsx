"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import clsx from "clsx";
import type { DeliveryZone, PaymentMethod } from "@/lib/types";
import { formatPrice, PAYMENT_METHOD_LABEL, previewDeliveryFee } from "@/lib/format";
import { cartSubtotal, useCart } from "@/store/cart";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartValidation } from "@/hooks/useCartValidation";
import { EmptyState } from "@/components/ui/EmptyState";
import { CouponBox } from "./CouponBox";
import { CheckIcon } from "@/components/ui/Icons";

type Mode = "api" | "lien" | "livraison" | null;

const METHODS: { id: PaymentMethod; hint: string; linkHint?: string }[] = [
  { id: "wave", hint: "Payez instantanément depuis l'application Wave.", linkHint: "Payez via le lien Wave de la boutique. La commande est confirmée après vérification du paiement." },
  { id: "orange_money", hint: "Validez le paiement dans Orange Money / Max it.", linkHint: "Payez via le lien Orange Money de la boutique. Confirmation après vérification." },
  { id: "carte", hint: "Visa, Mastercard — paiement sécurisé 3-D Secure." },
  { id: "livraison", hint: "Réglez en espèces ou par mobile money à la réception." },
];

const REGIONS = ["Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor", "Hors Sénégal"];

type Form = Record<"customer_name" | "email" | "phone" | "whatsapp" | "address_line" | "city" | "region" | "zone_id" | "notes", string>;

export function CheckoutForm({ zones, modes, origin, prefill, loggedIn }: { zones: DeliveryZone[]; modes: Record<PaymentMethod, Mode>; origin: { lat: number; lng: number; factor: number } | null; prefill: Record<string, string>; loggedIn: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { lines, coupon, clear } = useCart();
  const { notice: cartNotice } = useCartValidation(hydrated);
  const [step, setStep] = useState<1 | 2>(1);
  const [sameWa, setSameWa] = useState(!prefill.whatsapp);
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
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
    zone_id: zones.some((z) => z.id === prefill.zone_id) ? prefill.zone_id : "",
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

  const toRecap = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!f.zone_id) return setError("Choisissez une zone de livraison.");
    if (!method) return setError("Choisissez un moyen de paiement.");
    if (delivery?.needsLocation) return setError("Partagez votre position pour calculer les frais de livraison de cette zone.");
    if (delivery?.outOfRange) return setError("Votre position est en dehors de la zone de livraison choisie.");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          whatsapp: sameWa ? f.phone : f.whatsapp,
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

  return (
    <div className="container-luxe pt-12 md:pt-20">
      <header className="mb-12 text-center">
        <p className="eyebrow">Commande sécurisée</p>
        <h1 className="display mt-5 text-5xl md:text-7xl">{step === 1 ? "Vos informations" : "Récapitulatif"}</h1>
        <ol className="mx-auto mt-8 flex max-w-sm items-center justify-center gap-2 sm:gap-4 text-[0.78rem] uppercase tracking-[0.24em]">
          {["Informations", "Validation"].map((s, i) => (
            <li key={s} className={clsx("flex items-center gap-2", step >= i + 1 ? "text-gold" : "text-mist")}>
              <span className={clsx("flex h-6 w-6 items-center justify-center rounded-full border", step > i + 1 ? "border-gold bg-gold text-ink" : step === i + 1 ? "border-gold" : "border-white/20")}>
                {step > i + 1 ? <CheckIcon width={12} height={12} /> : i + 1}
              </span>
              {s}
              {i === 0 && <span className="ml-1 h-px w-6 bg-white/15 sm:ml-2 sm:w-10" />}
            </li>
          ))}
        </ol>
      </header>

      {cartNotice && <p role="status" className="mb-8 border border-gold/40 bg-gold/[0.06] px-4 py-3 text-sm text-ivory">{cartNotice}</p>}
      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form key="s1" onSubmit={toRecap} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5 }} className="space-y-12">
              <fieldset>
                <legend className="display mb-6 text-3xl">Coordonnées</legend>
                <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                  <label className="md:col-span-2"><span className="label">Nom complet *</span><input required value={f.customer_name} onChange={set("customer_name")} autoComplete="name" className="field" /></label>
                  <label><span className="label">Téléphone *</span><input required type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="77 000 00 00" className="field" /></label>
                  <label><span className="label">E-mail (pour le reçu)</span><input type="email" value={f.email} onChange={set("email")} autoComplete="email" className="field" /></label>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 text-sm text-ivory/90">
                      <input type="checkbox" checked={sameWa} onChange={(e) => setSameWa(e.target.checked)} className="h-4 w-4 accent-[#C6A15B]" />
                      Mon numéro WhatsApp est identique
                    </label>
                    {!sameWa && (
                      <label className="mt-4 block"><span className="label">Numéro WhatsApp *</span><input required type="tel" value={f.whatsapp} onChange={set("whatsapp")} className="field" /></label>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="display mb-6 text-3xl">Livraison</legend>
                {zones.length === 0 ? (
                  <p className="mb-8 border border-gold/30 p-4 text-sm text-ivory/90">
                    Les zones de livraison sont en cours de configuration. Contactez-nous pour finaliser votre commande. <Link className="text-gold" href="/contact">Nous contacter</Link>
                  </p>
                ) : (
                  <div className="mb-8 grid gap-3 sm:grid-cols-2">
                    {zones.map((z) => (
                      <button
                        type="button"
                        key={z.id}
                        onClick={() => setF((s) => ({ ...s, zone_id: z.id }))}
                        aria-pressed={f.zone_id === z.id}
                        className={clsx("flex items-start justify-between gap-3 border p-4 text-left transition-colors", f.zone_id === z.id ? "border-gold bg-gold/[0.06]" : "border-white/15 hover:border-white/30")}
                      >
                        <span>
                          <span className="block text-sm font-medium">{z.name}</span>
                          {z.delay && <span className="mt-1 block text-xs text-mist">{z.delay}</span>}
                        </span>
                        <span className="shrink-0 text-right text-sm text-gold">
                          {z.fee_mode === "quote" ? "Tarif à confirmer" : z.fee_mode === "distance" ? "Selon distance" : z.fee === 0 ? "Offerte" : formatPrice(z.fee)}
                          {z.free_above ? <span className="block text-[0.74rem] text-mist">Offerte dès {formatPrice(z.free_above)}</span> : null}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mb-8 flex flex-col gap-3 border border-white/15 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <p className="text-ivory/90">{pos ? "Position enregistrée pour la livraison" : "Localisation de livraison"}</p>
                    <p className="text-xs text-mist">
                      {pos
                        ? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}${delivery?.km != null ? ` · environ ${delivery.km} km` : ""}`
                        : "Partagez votre position pour une livraison précise et un tarif calculé selon la distance."}
                    </p>
                    {locError && <p className="mt-1 text-xs text-danger">{locError}</p>}
                  </div>
                  <button type="button" onClick={locate} disabled={locating} className="btn btn-ghost-gold min-h-10 shrink-0 px-4">
                    {locating ? "Localisation…" : pos ? "Mettre à jour" : "Utiliser ma position"}
                  </button>
                </div>
                <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                  <label className="md:col-span-2"><span className="label">Adresse de livraison *</span><input required value={f.address_line} onChange={set("address_line")} autoComplete="street-address" placeholder="Quartier, rue, villa, repère…" className="field" /></label>
                  <label><span className="label">Ville *</span><input required value={f.city} onChange={set("city")} autoComplete="address-level2" className="field" /></label>
                  <label>
                    <span className="label">Région</span>
                    <select value={f.region} onChange={set("region")} className="field">
                      <option value="">Sélectionner</option>
                      {REGIONS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </label>
                  <label className="md:col-span-2"><span className="label">Informations complémentaires</span><textarea rows={3} value={f.notes} onChange={set("notes")} placeholder="Horaires de livraison, instructions…" className="field resize-none" /></label>
                  {loggedIn && (
                    <label className="flex items-center gap-3 text-sm text-ivory/90 md:col-span-2">
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-[#C6A15B]" />
                      Enregistrer cette adresse dans mon compte
                    </label>
                  )}
                </div>
              </fieldset>

              <fieldset>
                <legend className="display mb-6 text-3xl">Paiement</legend>
                <div className="grid gap-3">
                  {METHODS.map((m) => {
                    const mode = modes[m.id];
                    const ok = Boolean(mode);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        disabled={!ok}
                        onClick={() => setMethod(m.id)}
                        aria-pressed={method === m.id}
                        className={clsx("flex items-center gap-4 border p-5 text-left transition-colors", method === m.id ? "border-gold bg-gold/[0.06]" : "border-white/15 hover:border-white/30", !ok && "cursor-not-allowed opacity-40")}
                      >
                        <span className={clsx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", method === m.id ? "border-gold" : "border-white/30")}>
                          {method === m.id && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
                        </span>
                        <span>
                          <span className="block text-sm font-medium">{PAYMENT_METHOD_LABEL[m.id]}</span>
                          <span className="mt-0.5 block text-xs text-mist">{!ok ? "Bientôt disponible" : mode === "lien" && m.linkHint ? m.linkHint : m.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {error && <p role="alert" className="text-sm text-danger">{error}</p>}
              <button type="submit" className="btn btn-gold w-full md:w-auto">Vérifier ma commande</button>
            </motion.form>
          ) : (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.5 }} className="space-y-8">
              <div className="grid gap-px bg-white/[0.06] md:grid-cols-2">
                <div className="bg-ink p-6">
                  <p className="label mb-3">Client</p>
                  <p>{f.customer_name}</p>
                  <p className="mt-1 text-sm text-ivory/90">{f.phone}</p>
                  <p className="text-sm text-ivory/90">WhatsApp : {sameWa ? f.phone : f.whatsapp}</p>
                  {f.email && <p className="text-sm text-ivory/90">{f.email}</p>}
                </div>
                <div className="bg-ink p-6">
                  <p className="label mb-3">Livraison — {zone?.name}</p>
                  <p>{f.address_line}</p>
                  <p className="mt-1 text-sm text-ivory/90">{[f.city, f.region].filter(Boolean).join(", ")}</p>
                  {zone?.delay && <p className="text-sm text-mist">Délai : {zone.delay}</p>}
                  {pos && <p className="text-sm text-mist">Position GPS partagée{delivery?.km != null ? ` · ${delivery.km} km` : ""}</p>}
                  {delivery?.pending && <p className="mt-2 text-xs text-gold">Frais de livraison à confirmer : notre équipe vous communique le montant sur WhatsApp avant l&apos;expédition.</p>}
                  {f.notes && <p className="mt-2 text-sm italic text-mist">« {f.notes} »</p>}
                </div>
                <div className="bg-ink p-6 md:col-span-2">
                  <p className="label mb-3">Paiement</p>
                  <p>{method && PAYMENT_METHOD_LABEL[method]}</p>
                  {method && method !== "livraison" && modes[method] === "api" && !delivery?.pending && <p className="mt-1 text-xs text-mist">Vous serez redirigé vers la page sécurisée du prestataire. La commande sera confirmée dès réception de la notification de paiement.</p>}
                  {method && modes[method] === "lien" && <p className="mt-1 text-xs text-mist">Après validation, le lien de paiement {PAYMENT_METHOD_LABEL[method]} s&apos;affichera avec le montant exact. Votre commande sera confirmée après vérification de la réception du paiement.</p>}
                  {method && method !== "livraison" && delivery?.pending && <p className="mt-1 text-xs text-mist">Le paiement vous sera proposé dès que les frais de livraison seront confirmés.</p>}
                </div>
              </div>
              {error && <p role="alert" className="text-sm text-danger">{error}</p>}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={confirm} disabled={submitting} className="btn btn-gold flex-1">
                  {submitting ? "Enregistrement…" : `Confirmer la commande · ${formatPrice(total)}`}
                </button>
                <button onClick={() => setStep(1)} disabled={submitting} className="btn btn-outline">Modifier</button>
              </div>
              <p className="text-xs text-mist">
                En confirmant, vous acceptez nos <Link href="/conditions" className="text-gold">conditions de vente</Link>. Les prix et le stock sont vérifiés au moment de la validation.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

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
          {step === 1 && <div className="mt-6"><CouponBox /></div>}
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
