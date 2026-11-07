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
            className="fixed inset-y-0 right-0 z-[81] flex w-full max-w-[460px] flex-col border-l border-white/[0.1] bg-ink-2"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-white/[0.1] px-6 py-6">
              <div>
                <p className="eyebrow">Votre sélection</p>
                <h2 className="display mt-1 text-3xl">Panier ({cartCount(items)})</h2>
              </div>
              <button aria-label="Fermer le panier" onClick={() => setOpen(false)} className="p-2 text-ivory/90 hover:text-gold">
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="display text-2xl text-ivory/90">Votre panier est vide</p>
                  <p className="mt-3 max-w-xs text-sm text-mist">Explorez nos collections et composez votre allure.</p>
                  <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-ghost-gold mt-8">
                    Explorer la boutique
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
                        <Link href={`/produit/${l.slug}`} onClick={() => setOpen(false)} className="relative h-28 w-[88px] shrink-0 overflow-hidden bg-ink-3">
                          {l.image && <Image src={l.image} alt={l.name} fill sizes="88px" className="object-cover" />}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex justify-between gap-3">
                            <Link href={`/produit/${l.slug}`} onClick={() => setOpen(false)} className="display truncate text-lg hover:text-gold">
                              {l.name}
                            </Link>
                            <p className="shrink-0 text-sm">{formatPrice(l.unitPrice * l.quantity)}</p>
                          </div>
                          <p className="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-mist">
                            {[l.color, l.size].filter(Boolean).join(" · ") || l.reference}
                          </p>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-white/15">
                              <button aria-label="Diminuer la quantité" className="p-3 hover:text-gold" onClick={() => setQuantity(l.variantId, l.quantity - 1)}>
                                <MinusIcon width={14} height={14} />
                              </button>
                              <span className="w-8 text-center text-sm">{l.quantity}</span>
                              <button
                                aria-label="Augmenter la quantité"
                                className="p-3 hover:text-gold disabled:opacity-30"
                                disabled={l.quantity >= l.maxStock}
                                onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                              >
                                <PlusIcon width={14} height={14} />
                              </button>
                            </div>
                            <button onClick={() => remove(l.variantId)} aria-label={`Retirer ${l.name} du panier`} className="text-[0.8rem] uppercase tracking-[0.2em] text-mist hover:text-danger">
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
                  <Link href="/commande" onClick={() => setOpen(false)} className="btn btn-gold w-full">
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
