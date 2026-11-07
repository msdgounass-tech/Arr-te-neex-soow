"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { useHydrated } from "@/hooks/useHydrated";

export function CartDrawer() {
  const { open, setOpen, lines, setQuantity, remove } = useCart();
  const hydrated = useHydrated();
  const items = hydrated ? lines : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-label="Votre panier"
            className="fixed inset-y-0 right-0 z-[81] flex w-full max-w-[460px] flex-col border-l border-white/[0.08] bg-ink-2/95 backdrop-blur-2xl sm:inset-y-3 sm:right-3 sm:rounded-3xl sm:border"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-white/[0.1] px-6 py-6">
              <div>
                <p className="eyebrow">Votre sélection</p>
                <h2 className="display mt-1 text-2xl">Panier ({cartCount(items)})</h2>
              </div>
              <button aria-label="Fermer le panier" onClick={() => setOpen(false)} className="rounded-full p-2.5 text-ivory/90 hover:bg-white/[0.06]">
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="display text-2xl text-ivory/90">Votre panier est vide</p>
                  <p className="mt-3 max-w-xs text-sm text-mist">Smartphones, audio, accessoires : explorez le catalogue.</p>
                  <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-outline mt-8">
                    Explorer le catalogue
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.06]">
                  <AnimatePresence initial={false}>
                    {items.map((l) => (
                      <motion.li
                        key={l.variantId}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className="flex gap-4 py-5"
                      >
                        <Link href={`/produit/${l.slug}`} onClick={() => setOpen(false)} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04]">
                          {l.image && <Image src={l.image} alt={l.name} fill sizes="96px" className="object-contain p-2" />}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex justify-between gap-3">
                            <Link href={`/produit/${l.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 font-semibold leading-snug hover:text-white">
                              {l.name}
                            </Link>
                            <p className="shrink-0 text-sm font-semibold">{formatPrice(l.unitPrice * l.quantity)}</p>
                          </div>
                          <p className="mt-1 text-xs text-mist">
                            {[l.color, l.size].filter(Boolean).join(" · ") || l.reference}
                          </p>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center rounded-full border border-white/12">
                              <button aria-label="Diminuer la quantité" className="rounded-full p-2.5 hover:bg-white/[0.06]" onClick={() => setQuantity(l.variantId, l.quantity - 1)}>
                                <MinusIcon width={14} height={14} />
                              </button>
                              <span className="w-7 text-center text-sm font-semibold" aria-live="polite">{l.quantity}</span>
                              <button
                                aria-label="Augmenter la quantité"
                                className="rounded-full p-2.5 hover:bg-white/[0.06] disabled:opacity-30"
                                disabled={l.quantity >= l.maxStock}
                                onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                              >
                                <PlusIcon width={14} height={14} />
                              </button>
                            </div>
                            <button onClick={() => remove(l.variantId)} aria-label={`Retirer ${l.name} du panier`} className="text-sm text-mist hover:text-danger">
                              Retirer
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-white/[0.1] px-6 py-6">
                <div className="flex items-baseline justify-between">
                  <span className="label">Sous-total</span>
                  <span data-testid="cart-subtotal" className="display text-2xl">{formatPrice(cartSubtotal(items))}</span>
                </div>
                <p className="mt-2 text-xs text-mist">Livraison et codes promotionnels calculés à l&apos;étape suivante.</p>
                <div className="mt-5 grid gap-3">
                  <Link href="/commande" onClick={() => setOpen(false)} className="btn btn-primary w-full">
                    Passer commande
                  </Link>
                  <Link href="/panier" onClick={() => setOpen(false)} className="btn btn-outline w-full">
                    Voir le panier
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
