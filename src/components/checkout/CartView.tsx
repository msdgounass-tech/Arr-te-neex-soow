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

export function CartView({ freeAbove = null, freeEverywhere = false }: { freeAbove?: number | null; freeEverywhere?: boolean }) {
  const hydrated = useHydrated();
  const { lines, setQuantity, remove, coupon } = useCart();
  const items = hydrated ? lines : [];
  const { notice } = useCartValidation(hydrated);
  const subtotal = cartSubtotal(items);
  const discount = coupon && coupon.subtotal === subtotal ? coupon.discount : 0;

  return (
    <div className="container-luxe pt-16 md:pt-24">
      <header className="mb-14 text-center">
        <p className="eyebrow">Votre sélection</p>
        <h1 className="display mt-5 text-5xl md:text-7xl">Panier</h1>
      </header>

      {!hydrated ? null : items.length === 0 ? (
        <EmptyState title="Votre panier est vide" text="Découvrez nos collections pour composer votre sélection." cta={{ href: "/shop", label: "Explorer la boutique" }} />
      ) : (
        <>
        {notice && <p role="status" className="mb-8 border border-gold/40 bg-gold/[0.06] px-4 py-3 text-sm text-ivory">{notice}</p>}
        <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr]">
          <ul className="border-t border-white/[0.1]">
            <AnimatePresence initial={false}>
              {items.map((l) => (
                <motion.li key={l.variantId} layout exit={{ opacity: 0, x: -30 }} className="flex gap-5 border-b border-white/[0.1] py-6">
                  <Link href={`/produit/${l.slug}`} className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden bg-ink-3 md:w-32">
                    {l.image && <Image src={l.image} alt={l.name} fill sizes="128px" className="object-cover" />}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex flex-col justify-between gap-2 md:flex-row">
                      <div>
                        <Link href={`/produit/${l.slug}`} className="display text-2xl hover:text-gold">{l.name}</Link>
                        <p className="mt-1 text-[0.8rem] uppercase tracking-[0.22em] text-mist">
                          Réf. {l.reference}
                          {l.color ? ` · ${l.color}` : ""}
                          {l.size ? ` · Taille ${l.size}` : ""}
                        </p>
                        <p className="mt-2 text-sm text-ivory/90">{formatPrice(l.unitPrice)} l&apos;unité</p>
                      </div>
                      <p className="display whitespace-nowrap text-xl">{formatPrice(l.unitPrice * l.quantity)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center border border-white/15">
                        <button aria-label="Diminuer" onClick={() => setQuantity(l.variantId, l.quantity - 1)} className="p-3 hover:text-gold"><MinusIcon width={14} height={14} /></button>
                        <span className="w-10 text-center text-sm">{l.quantity}</span>
                        <button aria-label="Augmenter" disabled={l.quantity >= l.maxStock} onClick={() => setQuantity(l.variantId, l.quantity + 1)} className="p-3 hover:text-gold disabled:opacity-30"><PlusIcon width={14} height={14} /></button>
                      </div>
                      <button onClick={() => remove(l.variantId)} className="flex items-center gap-2 text-[0.8rem] uppercase tracking-[0.2em] text-mist hover:text-danger">
                        <TrashIcon width={16} height={16} /> <span className="hidden sm:inline">Supprimer</span>
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <aside className="h-fit border border-white/[0.1] bg-ink-2 p-6 md:p-8 lg:sticky lg:top-28">
            <h2 className="display text-3xl">Récapitulatif</h2>
            <dl className="mt-8 space-y-4 text-sm">
              <div className="flex justify-between"><dt className="text-mist">Articles ({cartCount(items)})</dt><dd>{formatPrice(subtotal)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-gold"><dt>Réduction</dt><dd>-{formatPrice(discount)}</dd></div>}
              <div className="flex justify-between gap-4">
                <dt className="text-mist">Livraison</dt>
                <dd className="text-right text-mist">
                  {freeAbove && freeEverywhere && subtotal - discount >= freeAbove ? (
                    <span className="text-gold">Offerte</span>
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
            <Link href="/commande" className="btn btn-gold mt-8 w-full">Valider ma commande</Link>
            <Link href="/shop" className="btn btn-outline mt-3 w-full">Continuer mes achats</Link>
          </aside>
        </div>
        </>
      )}
    </div>
  );
}
