"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { MinusIcon, PlusIcon, TrashIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { CouponBox } from "./CouponBox";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartValidation } from "@/hooks/useCartValidation";
import { PageHeader } from "@/components/ui/PageHeader";

export function CartView({ freeAbove = null, freeEverywhere = false }: { freeAbove?: number | null; freeEverywhere?: boolean }) {
  const hydrated = useHydrated();
  const { lines, setQuantity, remove, coupon } = useCart();
  const items = hydrated ? lines : [];
  const { notice } = useCartValidation(hydrated);
  const subtotal = cartSubtotal(items);
  const discount = coupon && coupon.subtotal === subtotal ? coupon.discount : 0;

  return (
    <div className="container-luxe">
      <PageHeader eyebrow="Votre sélection" title="Panier" />

      {!hydrated ? null : items.length === 0 ? (
        <EmptyState title="Votre panier est vide" text="Smartphones, audio, accessoires : explorez le catalogue." cta={{ href: "/shop", label: "Explorer le catalogue" }} />
      ) : (
        <>
        {notice && <p role="status" className="mb-8 rounded-2xl border border-accent/40 bg-accent/[0.06] px-4 py-3 text-sm text-ivory">{notice}</p>}
        <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr]">
          <ul className="surface divide-y divide-white/[0.06] px-4 md:px-6">
            <AnimatePresence initial={false}>
              {items.map((l) => (
                <motion.li key={l.variantId} layout exit={{ opacity: 0, x: -30 }} className="flex gap-4 py-5 md:gap-5">
                  <Link href={`/produit/${l.slug}`} className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] md:w-28">
                    {l.image && <Image src={l.image} alt={l.name} fill sizes="112px" className="object-contain p-2" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-col justify-between gap-2 md:flex-row">
                      <div>
                        <Link href={`/produit/${l.slug}`} className="font-semibold leading-snug hover:text-white md:text-lg">{l.name}</Link>
                        <p className="mt-1 text-xs text-mist">
                          Réf. {l.reference}
                          {l.color ? ` · ${l.color}` : ""}
                          {l.size ? ` · ${l.size}` : ""}
                        </p>
                        <p className="mt-2 text-sm text-ivory/90">{formatPrice(l.unitPrice)} l&apos;unité</p>
                      </div>
                      <p className="whitespace-nowrap text-lg font-bold">{formatPrice(l.unitPrice * l.quantity)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center rounded-full border border-white/12">
                        <button aria-label="Diminuer la quantité" onClick={() => setQuantity(l.variantId, l.quantity - 1)} className="rounded-full p-2.5 hover:bg-white/[0.06]"><MinusIcon width={14} height={14} /></button>
                        <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{l.quantity}</span>
                        <button aria-label="Augmenter la quantité" disabled={l.quantity >= l.maxStock} onClick={() => setQuantity(l.variantId, l.quantity + 1)} className="rounded-full p-2.5 hover:bg-white/[0.06] disabled:opacity-30"><PlusIcon width={14} height={14} /></button>
                      </div>
                      <button onClick={() => remove(l.variantId)} aria-label={`Supprimer ${l.name} du panier`} className="flex items-center gap-2 rounded-full px-2 py-2 text-sm text-mist hover:text-danger">
                        <TrashIcon width={16} height={16} /> <span className="hidden sm:inline">Supprimer</span>
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <aside className="surface h-fit p-6 md:p-8 lg:sticky lg:top-28">
            <h2 className="display text-3xl">Récapitulatif</h2>
            <dl className="mt-8 space-y-4 text-sm">
              <div className="flex justify-between"><dt className="text-mist">Articles ({cartCount(items)})</dt><dd>{formatPrice(subtotal)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-accent"><dt>Réduction</dt><dd>-{formatPrice(discount)}</dd></div>}
              <div className="flex justify-between gap-4">
                <dt className="text-mist">Livraison</dt>
                <dd className="text-right text-mist">
                  {freeAbove && freeEverywhere && subtotal - discount >= freeAbove ? (
                    <span className="text-accent">Offerte</span>
                  ) : freeAbove ? (
                    <>Offerte dès {formatPrice(freeAbove)}{freeEverywhere ? "" : " selon la zone"}<br />sinon selon la zone</>
                  ) : (
                    "Selon la zone, à l'étape suivante"
                  )}
                </dd>
              </div>
            </dl>
            <div className="hairline my-6" />
            <div className="flex items-baseline justify-between">
              <span className="label">Total estimé</span>
              <span className="display text-3xl">{formatPrice(subtotal - discount)}</span>
            </div>
            <div className="mt-8"><CouponBox /></div>
            <Link href="/commande" className="btn btn-primary mt-8 w-full">Valider ma commande</Link>
            <Link href="/shop" className="btn btn-outline mt-3 w-full">Continuer mes achats</Link>
          </aside>
        </div>
        </>
      )}
    </div>
  );
}
