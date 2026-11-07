"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { discountPercent, formatPrice, isOnSale, sortedImages } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { BagIcon, MinusIcon, PlusIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { FavoriteButton } from "./FavoriteButton";

export function ProductPurchase({ product, whatsapp, productUrl }: { product: Product; whatsapp?: string; productUrl: string }) {
  const variants = useMemo(() => product.product_variants.filter((v) => v.is_active).sort((a, b) => a.position - b.position), [product]);
  const colors = useMemo(() => {
    const m = new Map<string, string | null>();
    variants.forEach((v) => v.color && !m.has(v.color) && m.set(v.color, v.color_hex));
    return [...m.entries()];
  }, [variants]);
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[], [variants]);

  const firstInStock = variants.find((v) => (v.inventory?.quantity ?? 0) > 0) || variants[0];
  const [color, setColor] = useState<string | null>(firstInStock?.color ?? null);
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : firstInStock?.size ?? null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [showBar, setShowBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
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
  const soldOut = variants.length === 0 || stockOf(null, null) === 0;

  // Barre d'achat collante (mobile) quand les boutons principaux sortent de l'écran
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addToCart = (buyNow = false): boolean => {
    setError("");
    const fail = (m: string) => {
      setError(m);
      ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    };
    if (sizes.length && !size) return fail("Veuillez choisir une version.");
    if (colors.length && !color) return fail("Veuillez choisir une couleur.");
    if (!selected) return fail("Cette combinaison n'est pas disponible.");
    if (stock < 1) return fail("Cette version est épuisée.");
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

  const waHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        [
          `Bonjour, je souhaite commander :`,
          `• ${product.name}${product.brand ? ` (${product.brand})` : ""}`,
          [size && `Version : ${size}`, color && `Couleur : ${color}`].filter(Boolean).join(" · "),
          `Quantité : ${qty}`,
          `Prix affiché : ${formatPrice(price)} l'unité`,
          `Réf. ${product.reference}`,
          productUrl,
        ]
          .filter(Boolean)
          .join("\n"),
      )}`
    : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className={clsx("display whitespace-nowrap text-[2rem] md:text-4xl", sale && "text-accent-light")}>{formatPrice(price)}</p>
        {sale && (
          <>
            <p className="whitespace-nowrap text-mist line-through">{formatPrice(product.compare_at_price!)}</p>
            <span className="whitespace-nowrap rounded-full bg-accent px-2.5 py-0.5 text-[0.78rem] font-bold text-ink">-{discountPercent(product)} %</span>
          </>
        )}
      </div>
      <p className={clsx("mt-3 inline-flex items-center gap-2 text-sm font-semibold", stock > 0 ? (stock <= 3 ? "text-accent-light" : "text-success") : "text-danger")}>
        <span className={clsx("h-2 w-2 rounded-full", stock > 0 ? (stock <= 3 ? "bg-accent" : "bg-success") : "bg-danger")} />
        {stock > 0 ? (stock <= 3 ? `Plus que ${stock} en stock` : "En stock, prêt à être livré") : soldOut ? "Épuisé" : "Cette version est épuisée"}
      </p>

      {sizes.length > 0 && (
        <fieldset className="mt-8">
          <legend className="label">Version : <span className="normal-case tracking-normal text-ivory">{size || "à choisir"}</span></legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const out = stockOf(color, s) === 0;
              const v = variants.find((x) => x.size === s && (colors.length ? x.color === color : true));
              const extra = v?.price_override != null && v.price_override !== product.price ? formatPrice(v.price_override) : null;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => !out && setSize(s)}
                  disabled={out}
                  aria-pressed={size === s}
                  className={clsx(
                    "flex min-h-12 flex-col items-start justify-center rounded-2xl border px-4 py-2 text-left text-sm transition-all",
                    size === s ? "border-ivory bg-white/[0.06] shadow-[0_0_0_3px_rgba(126,164,255,.18)]" : "border-white/12 hover:border-white/35",
                    out && "cursor-not-allowed opacity-35",
                  )}
                >
                  <span className={clsx("font-semibold", out && "line-through")}>{s}</span>
                  {extra && <span className="text-xs text-mist">{extra}</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {colors.length > 0 && (
        <fieldset className="mt-7">
          <legend className="label">Couleur : <span className="normal-case tracking-normal text-ivory">{color || "—"}</span></legend>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {colors.map(([name, hex]) => {
              const out = stockOf(name, size) === 0;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setColor(name)}
                  aria-pressed={color === name}
                  aria-label={`${name}${out ? " (épuisé)" : ""}`}
                  title={name}
                  className={clsx("flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm transition-all", color === name ? "border-ivory bg-white/[0.06]" : "border-white/12 hover:border-white/35", out && "opacity-40")}
                >
                  <span className="h-6 w-6 rounded-full border border-white/25 shadow-inner" style={{ background: hex || "#888" }} />
                  {name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div ref={ctaRef} className="mt-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-white/12">
            <button type="button" aria-label="Diminuer la quantité" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/[0.06]">
              <MinusIcon width={16} height={16} />
            </button>
            <output aria-live="polite" aria-label="Quantité" className="w-8 text-center font-semibold">{qty}</output>
            <button type="button" aria-label="Augmenter la quantité" onClick={() => setQty((q) => Math.min(Math.max(stock, 1), q + 1, 99))} className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/[0.06]">
              <PlusIcon width={16} height={16} />
            </button>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => addToCart(false)} disabled={soldOut} className="btn btn-primary flex-1">
            <BagIcon width={18} height={18} />
            {soldOut ? "Épuisé" : "Ajouter au panier"}
          </motion.button>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/12">
            <FavoriteButton productId={product.id} className="p-3" />
          </span>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-3 text-sm text-danger">
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => addToCart(true)} disabled={soldOut} className="btn btn-outline">
            Acheter maintenant
          </button>
          {waHref ? (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <WhatsAppIcon width={20} height={20} /> Commander sur WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      {/* Barre d'achat collante sur mobile */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="glass fixed inset-x-0 bottom-0 z-[65] border-x-0 border-b-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-mist">{product.name}</p>
                <p className="font-bold">{formatPrice(price)}</p>
              </div>
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Commander sur WhatsApp" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1fa855] text-white">
                  <WhatsAppIcon width={22} height={22} />
                </a>
              )}
              <button type="button" onClick={() => addToCart(false)} disabled={soldOut} className="btn btn-primary min-h-12 px-5">
                {soldOut ? "Épuisé" : "Ajouter"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
