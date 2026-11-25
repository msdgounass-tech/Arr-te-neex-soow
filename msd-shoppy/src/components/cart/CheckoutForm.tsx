"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { cart, groupByShop, useCart } from "@/lib/store/cart";
import { supabaseBrowser } from "@/lib/supabase/client";
import { placeOrdersAction } from "@/app/actions/orders";
import { formatPrice } from "@/lib/format";
import type { Address, DeliveryZone, Region } from "@/lib/types";
import { EmptyState } from "@/components/ui/bits";
import { Icon } from "@/components/ui/Icon";
import { useCartCheck } from "./useCartCheck";

const PAYMENTS = [
  ["cash_on_delivery", "Paiement à la livraison ou au retrait", "Vous payez le vendeur en espèces ou par mobile money à la réception."],
  ["wave_direct", "Wave, directement au vendeur", "Le vendeur vous indique son numéro Wave après confirmation."],
  ["orange_money_direct", "Orange Money, directement au vendeur", "Le vendeur vous indique son numéro Orange Money après confirmation."],
] as const;

export function CheckoutForm({ regions, addresses, defaultName, defaultPhone }:
  { regions: Region[]; addresses: Address[]; defaultName: string; defaultPhone: string }) {
  const router = useRouter();
  const lines = useCart();
  const groups = groupByShop(lines);
  const { issues, checked } = useCartCheck(lines);
  const def = addresses.find((a) => a.is_default) ?? addresses[0];
  const [form, setForm] = useState({
    recipient_name: def?.recipient_name ?? defaultName, phone: def?.phone ?? defaultPhone, region: def?.region ?? "", city: def?.city ?? "",
    address_details: def?.details ?? "", note: "", payment_method: "cash_on_delivery", save_address: addresses.length === 0,
  });
  const [zones, setZones] = useState<Record<string, DeliveryZone[]>>({});
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const shopKey = groups.map((g) => g.shopId).join(",");

  useEffect(() => {
    if (!shopKey) return;
    void supabaseBrowser().from("shop_delivery_zones").select("*").in("shop_id", shopKey.split(",")).eq("active", true).order("created_at")
      .then(({ data }: { data: unknown }) => {
        const map: Record<string, DeliveryZone[]> = {};
        for (const z of (data ?? []) as DeliveryZone[]) (map[z.shop_id] ??= []).push(z);
        setZones(map);
      });
  }, [shopKey]);

  const zonesFor = (shopId: string) => (zones[shopId] ?? []).filter((z) => !z.regions.length || !form.region || z.regions.includes(form.region));
  useEffect(() => {
    setChosen((c) => {
      const next = { ...c };
      for (const g of groups) { const list = zonesFor(g.shopId); if (!list.find((z) => z.id === next[g.shopId])) next[g.shopId] = list[0]?.id ?? ""; }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones, form.region, shopKey]);

  const totals = useMemo(() => groups.map((g) => {
    const z = zonesFor(g.shopId).find((x) => x.id === chosen[g.shopId]);
    return { ...g, zone: z, fee: z?.fee ?? null, total: g.subtotal + (z?.fee ?? 0) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [groups, chosen, zones, form.region]);

  if (!lines.length) return <EmptyState icon="cart" title="Votre panier est vide" action={{ href: "/explorer", label: "Explorer le catalogue" }} />;
  const blocked = Object.values(issues).some((m) => !m.startsWith("Le prix"));
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setErrors({});
    start(async () => {
      const res = await placeOrdersAction(lines.map((l) => ({ product_id: l.productId, variant_id: l.variantId, quantity: l.quantity })),
        { ...form, zones: Object.fromEntries(Object.entries(chosen).filter(([, v]) => v)) });
      if (!res.ok) { setError(res.error); setErrors(res.fields ?? {}); return; }
      cart.clear();
      router.replace(`/commande/confirmation?n=${encodeURIComponent((res.data ?? []).map((o) => o.number).join(","))}`);
    });
  }
  const field = (k: string) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${k}-err` : undefined });
  const err = (k: string) => errors[k] ? <p id={`${k}-err`} className="error-text">{errors[k]}</p> : null;

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 md:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card space-y-4 p-5">
          <h2 className="text-lg font-semibold">Livraison</h2>
          {addresses.length > 1 && (
            <div><label className="label" htmlFor="addr">Adresse enregistrée</label>
              <select id="addr" className="field" onChange={(e) => { const a = addresses.find((x) => x.id === e.target.value); if (a) setForm({ ...form, recipient_name: a.recipient_name, phone: a.phone, region: a.region, city: a.city, address_details: a.details }); }} defaultValue={def?.id}>
                {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.city}</option>)}</select></div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="recipient_name">Nom de la personne qui reçoit</label><input id="recipient_name" className="field" autoComplete="name" value={form.recipient_name} onChange={set("recipient_name")} {...field("recipient_name")} />{err("recipient_name")}</div>
            <div><label className="label" htmlFor="phone">Téléphone</label><input id="phone" className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="77 123 45 67" value={form.phone} onChange={set("phone")} {...field("phone")} />{err("phone")}</div>
            <div><label className="label" htmlFor="region">Région</label><select id="region" className="field" value={form.region} onChange={set("region")} {...field("region")}><option value="">Choisir…</option>{regions.map((r) => <option key={r.id}>{r.name}</option>)}</select>{err("region")}</div>
            <div><label className="label" htmlFor="city">Ville ou quartier</label><input id="city" className="field" autoComplete="address-level2" value={form.city} onChange={set("city")} {...field("city")} />{err("city")}</div>
          </div>
          <div><label className="label" htmlFor="address_details">Précisions pour trouver l'adresse</label><textarea id="address_details" rows={2} className="field" placeholder="Rue, repère, étage…" value={form.address_details} onChange={set("address_details")} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--color-orange-strong)]" checked={form.save_address} onChange={set("save_address")} />Enregistrer cette adresse dans mon compte</label>
        </section>

        {totals.map((g) => (
          <section key={g.shopId} className="card p-5">
            <h2 className="flex items-center gap-2 font-semibold"><Icon name="store" size={18} className="text-orange-text" />{g.shopName}</h2>
            <ul className="mt-2 space-y-1 text-sm">{g.lines.map((l) => <li key={`${l.productId}:${l.variantId}`} className="flex justify-between gap-3"><span className="truncate">{l.quantity} × {l.title}{l.variantLabel ? ` (${l.variantLabel})` : ""}</span><span className="shrink-0">{formatPrice(l.price * l.quantity)}</span></li>)}</ul>
            <fieldset className="mt-4"><legend className="label">Mode de livraison</legend>
              {zonesFor(g.shopId).length ? zonesFor(g.shopId).map((z) => (
                <label key={z.id} className="mb-2 flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-[:checked]:border-orange-strong">
                  <input type="radio" name={`zone-${g.shopId}`} className="mt-1 accent-[var(--color-orange-strong)]" checked={chosen[g.shopId] === z.id} onChange={() => setChosen({ ...chosen, [g.shopId]: z.id })} />
                  <span className="text-sm"><b>{z.name}</b><br /><span className="text-slate">{z.fee == null ? "Frais à convenir avec le vendeur" : z.fee === 0 ? "Gratuit" : formatPrice(z.fee)} · {z.min_days}–{z.max_days} jours</span></span>
                </label>
              )) : <p className="rounded-xl bg-mist p-3 text-sm text-slate">Le vendeur vous contactera pour convenir de la livraison et de ses frais.</p>}
            </fieldset>
          </section>
        ))}

        <section className="card p-5">
          <fieldset><legend className="text-lg font-semibold">Paiement</legend>
            <p className="mb-3 mt-1 text-sm text-slate">Le paiement se fait directement avec le vendeur. MSD Shoppy n'encaisse aucune somme.</p>
            {PAYMENTS.map(([v, l, h]) => (
              <label key={v} className="mb-2 flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-[:checked]:border-orange-strong">
                <input type="radio" name="payment" value={v} className="mt-1 accent-[var(--color-orange-strong)]" checked={form.payment_method === v} onChange={set("payment_method")} />
                <span className="text-sm"><b>{l}</b><br /><span className="text-slate">{h}</span></span></label>))}
          </fieldset>
          <label className="label mt-3" htmlFor="note">Message au vendeur (facultatif)</label>
          <textarea id="note" rows={2} className="field" value={form.note} onChange={set("note")} maxLength={500} />
        </section>
      </div>

      <aside className="card h-fit space-y-2 p-5 md:sticky md:top-20">
        <h2 className="text-lg font-semibold">Récapitulatif</h2>
        {totals.map((g) => (
          <div key={g.shopId} className="border-b border-line pb-2 text-sm">
            <p className="font-medium">{g.shopName}</p>
            <p className="flex justify-between text-slate"><span>Articles</span><span>{formatPrice(g.subtotal)}</span></p>
            <p className="flex justify-between text-slate"><span>Livraison</span><span>{g.fee == null ? "à convenir" : g.fee === 0 ? "gratuite" : formatPrice(g.fee)}</span></p>
          </div>
        ))}
        <p className="flex justify-between pt-1 text-base"><span className="font-semibold">Total</span><b>{formatPrice(totals.reduce((s, g) => s + g.total, 0))}</b></p>
        {totals.some((g) => g.fee == null) && <p className="text-xs text-slate">Hors frais de livraison à convenir.</p>}
        {blocked && <p className="text-sm text-danger">Certains articles ne sont plus disponibles. <a href="/panier" className="link">Modifier le panier</a></p>}
        {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
        <button type="submit" disabled={pending || blocked || !checked} className="btn btn-primary press w-full">{pending ? "Envoi…" : groups.length > 1 ? `Envoyer les ${groups.length} commandes` : "Envoyer la commande"}</button>
        <p className="text-xs text-slate">Le vendeur confirme ensuite votre commande. Vous suivez chaque étape dans votre compte.</p>
      </aside>
    </form>
  );
}
