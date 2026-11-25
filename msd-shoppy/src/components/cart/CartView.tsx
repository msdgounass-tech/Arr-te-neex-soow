"use client";
import Image from "next/image";
import Link from "next/link";
import { cart, groupByShop, useCart } from "@/lib/store/cart";
import { formatPrice } from "@/lib/format";
import { EmptyState } from "@/components/ui/bits";
import { Icon } from "@/components/ui/Icon";
import { useCartCheck } from "./useCartCheck";

export function CartView() {
  const lines = useCart();
  const { issues } = useCartCheck(lines);
  const groups = groupByShop(lines);
  if (!lines.length) return <EmptyState icon="cart" title="Votre panier est vide" text="Ajoutez des produits depuis le catalogue." action={{ href: "/explorer", label: "Explorer le catalogue" }} />;
  const total = groups.reduce((s, g) => s + g.subtotal, 0);
  const blocked = Object.values(issues).some((m) => !m.startsWith("Le prix"));
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {groups.length > 1 && <p className="rounded-2xl bg-orange-soft p-3 text-sm text-orange-text">Votre panier contient des produits de {groups.length} boutiques : une commande sera envoyée à chaque boutique.</p>}
        {groups.map((g) => (
          <section key={g.shopId} className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Icon name="store" size={18} className="text-orange-text" /><Link href={`/b/${g.shopSlug}`} className="hover:underline">{g.shopName}</Link></h2>
            <ul className="divide-y divide-line">
              {g.lines.map((l) => {
                const issue = issues[`${l.productId}:${l.variantId}`];
                return (
                  <li key={`${l.productId}:${l.variantId}`} className="flex gap-3 py-3">
                    <Link href={`/p/${l.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-mist">
                      {l.image && <Image src={l.image} alt="" fill sizes="80px" className="object-cover" />}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/p/${l.slug}`} className="line-clamp-2 text-sm font-medium">{l.title}</Link>
                      {l.variantLabel && <p className="text-xs text-slate">{l.variantLabel}</p>}
                      <p className="mt-1 font-semibold">{formatPrice(l.price)}</p>
                      {issue && <p role="alert" className="mt-1 text-xs font-medium text-danger">{issue}</p>}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-line">
                          <button type="button" className="press grid h-8 w-8 place-items-center" aria-label="Diminuer" onClick={() => cart.setQuantity(l.productId, l.variantId, l.quantity - 1)}>−</button>
                          <span className="w-7 text-center text-sm font-semibold">{l.quantity}</span>
                          <button type="button" className="press grid h-8 w-8 place-items-center" aria-label="Augmenter" onClick={() => cart.setQuantity(l.productId, l.variantId, l.quantity + 1)}>+</button>
                        </div>
                        <button type="button" className="press text-sm text-slate hover:text-danger" onClick={() => cart.remove(l.productId, l.variantId)}>Retirer</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 flex justify-between border-t border-line pt-3 text-sm"><span className="text-slate">Sous-total boutique</span><b>{formatPrice(g.subtotal)}</b></p>
          </section>
        ))}
      </div>
      <aside className="card h-fit p-5 md:sticky md:top-20">
        <p className="flex justify-between"><span>Total des articles</span><b>{formatPrice(total)}</b></p>
        <p className="mt-1 text-xs text-slate">Les frais de livraison s'ajoutent selon la zone choisie à l'étape suivante.</p>
        {blocked && <p className="mt-3 text-sm text-danger">Retirez ou ajustez les articles signalés pour continuer.</p>}
        <Link href="/commande" aria-disabled={blocked} className={`btn btn-primary press mt-4 w-full ${blocked ? "pointer-events-none opacity-50" : ""}`}>Passer la commande</Link>
      </aside>
    </div>
  );
}
