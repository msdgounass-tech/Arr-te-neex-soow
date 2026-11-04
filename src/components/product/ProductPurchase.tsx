"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { discountPercent, formatPrice, isOnSale, sortedImages } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { FavoriteButton } from "./FavoriteButton";

export function ProductPurchase({ product }: { product: Product }) {
  const variants = useMemo(() => product.product_variants.filter((v) => v.is_active).sort((a, b) => a.position - b.position), [product]);
  const colors = useMemo(() => {
    const m = new Map<string, string | null>();
    variants.forEach((v) => v.color && !m.has(v.color) && m.set(v.color, v.color_hex));
    return [...m.entries()];
  }, [variants]);
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[], [variants]);

  const firstInStock = variants.find((v) => (v.inventory?.quantity ?? 0) > 0) || variants[0];
  const [color, setColor] = useState<string | null>(firstInStock?.color ?? null);
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const add = useCart((s) => s.add);
  const setCartOpen = useCart((s) => s.setOpen);
  const router = useRouter();
  const notify = useUI((s) => s.notify);

  const stockOf = (c: string | null, s: string | null) =>
    variants.filter((v) => (c == null || v.color === c) && (s == null || v.size === s)).reduce((a, v) => a + (v.inventory?.quantity ?? 0), 0);

  const selected = variants.find((v) => (colors.length ? v.color === color : true) && (sizes.length ? v.size === size : true));
  const stock = selected ? selected.inventory?.quantity ?? 0 : stockOf(color, size);
  const price = selected?.price_override ?? product.price;
  const sale = isOnSale(product) && !selected?.price_override;

  const addToCart = (buyNow = false): boolean => {
    setError("");
    const fail = (m: string) => {
      setError(m);
      return false;
    };
    if (sizes.length && !size) return fail("Veuillez choisir une taille.");
    if (colors.length && !color) return fail("Veuillez choisir une couleur.");
    if (!selected) return fail("Cette combinaison n'est pas disponible.");
    if (stock < 1) return fail("Cette déclinaison est épuisée.");
    const img = sortedImages(product)[0];
    add({
      variantId: selected.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      reference: product.reference,
      image: img?.url ?? null,
      size: selected.size,
      color: selected.color,
      unitPrice: price,
      quantity: Math.min(qty, stock),
      maxStock: stock,
    });
    setQty(1);
    if (buyNow) {
      setCartOpen(false);
      router.push("/commande");
    } else notify("Ajouté à votre panier");
    return true;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className={clsx("display whitespace-nowrap text-3xl", sale && "text-gold")}>{formatPrice(price)}</p>
        {sale && (
          <>
            <p className="whitespace-nowrap text-mist line-through">{formatPrice(product.compare_at_price!)}</p>
            <span className="whitespace-nowrap bg-gold px-2 py-0.5 text-[0.78rem] font-bold text-ink">-{discountPercent(product)} %</span>
          </>
        )}
      </div>

      {colors.length > 0 && (
        <div className="mt-10">
          <p className="label">Couleur : <span className="text-ivory">{color || "—"}</span></p>
          <div className="mt-4 flex flex-wrap gap-3">
            {colors.map(([name, hex]) => {
              const out = stockOf(name, size) === 0;
              return (
                <button
                  key={name}
                  onClick={() => setColor(name)}
                  aria-pressed={color === name}
                  title={name}
                  className={clsx("relative flex items-center gap-2 border px-3 py-2 text-xs transition-colors", color === name ? "border-gold text-ivory" : "border-white/15 text-ivory/90 hover:border-white/40", out && "opacity-40")}
                >
                  {hex && <span className="h-4 w-4 rounded-full border border-white/20" style={{ background: hex }} />}
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="mt-8">
          <p className="label">Taille : <span className="text-ivory">{size || "à choisir"}</span></p>
          <div className="mt-4 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const out = stockOf(color, s) === 0;
              return (
                <button
                  key={s}
                  onClick={() => !out && setSize(s)}
                  disabled={out}
                  aria-pressed={size === s}
                  className={clsx(
                    "min-w-12 border px-3 py-3 text-xs tracking-wider transition-colors",
                    size === s ? "border-gold bg-gold text-ink" : "border-white/15 hover:border-gold",
                    out && "cursor-not-allowed line-through opacity-30",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center gap-6">
        <div className="flex items-center border border-white/15">
          <button aria-label="Diminuer la quantité" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3.5 hover:text-gold">
            <MinusIcon width={16} height={16} />
          </button>
          <span className="w-10 text-center">{qty}</span>
          <button aria-label="Augmenter la quantité" onClick={() => setQty((q) => Math.min(Math.max(stock, 1), q + 1, 99))} className="p-3.5 hover:text-gold">
            <PlusIcon width={16} height={16} />
          </button>
        </div>
        <p className={clsx("text-xs uppercase tracking-[0.2em]", stock > 0 ? (stock <= 3 ? "text-gold" : "text-mist") : "text-danger")}>
          {stock > 0 ? (stock <= 3 ? `Plus que ${stock} en stock` : "En stock") : "Épuisé"}
        </p>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-8 flex gap-3">
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => addToCart(false)} disabled={variants.length === 0 || stockOf(null, null) === 0} className="btn btn-gold flex-1">
          {stockOf(null, null) === 0 ? "Épuisé" : "Ajouter au panier"}
        </motion.button>
        <span className="flex w-14 items-center justify-center border border-white/15">
          <FavoriteButton productId={product.id} className="p-3" />
        </span>
      </div>
      <button
        type="button"
        onClick={() => addToCart(true)}
        disabled={variants.length === 0 || stockOf(null, null) === 0}
        className="btn btn-outline mt-3 w-full"
      >
        Acheter maintenant
      </button>
    </div>
  );
}
