"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Product, ProductVariant, Shop } from "@/lib/types";
import { cart } from "@/lib/store/cart";
import { formatPrice } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/track";

const variantLabel = (v: ProductVariant) => [v.size, v.color, v.model].filter(Boolean).join(" · ");

export function BuyBox({ product, variants, shop, image }: { product: Product; variants: ProductVariant[]; shop: Shop; image: string | null }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState<string | null>(variants.length === 1 ? variants[0].id : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { track(shop.id, "product_view", product.id); }, [shop.id, product.id]);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const price = variant?.price ?? product.price;
  const stock = variant ? variant.stock : product.stock;
  const out = product.availability === "out_of_stock" || (stock != null && stock <= 0);
  const groups = useMemo(() => ({ size: [...new Set(variants.map((v) => v.size).filter(Boolean))], color: [...new Set(variants.map((v) => v.color).filter(Boolean))] }), [variants]);

  function add(goToCheckout: boolean) {
    if (variants.length > 0 && !variant) { setError("Choisissez une option avant de continuer."); return; }
    setError(null);
    cart.add({ productId: product.id, variantId: variant?.id ?? null, quantity: qty, title: product.title, slug: product.slug, price,
      image, variantLabel: variant ? variantLabel(variant) : null, shopId: shop.id, shopName: shop.name, shopSlug: shop.slug, maxQuantity: stock });
    if (goToCheckout) router.push("/commande");
    else toast("Ajouté au panier");
  }

  return (
    <div className="space-y-4">
      <p className="flex items-baseline gap-3">
        <span className="font-display text-3xl font-bold">{formatPrice(price)}</span>
        {product.compare_at_price && product.compare_at_price > price && <s className="text-slate">{formatPrice(product.compare_at_price)}</s>}
      </p>
      <p className="flex items-center gap-2 text-sm">
        {out ? <span className="font-semibold text-danger">Rupture de stock</span>
          : product.availability === "on_order" ? <span className="font-semibold text-warning">Sur commande</span>
          : <span className="font-semibold text-success">En stock{stock != null && stock <= 5 ? ` : plus que ${stock}` : ""}</span>}
        {product.sku && <span className="text-slate">Réf. {product.sku}</span>}
      </p>

      {variants.length > 0 && (
        <fieldset>
          <legend className="label">{groups.size.length && groups.color.length ? "Taille et couleur" : groups.size.length ? "Taille" : groups.color.length ? "Couleur" : "Modèle"}</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const vOut = v.stock != null && v.stock <= 0;
              return (
                <button key={v.id} type="button" disabled={vOut} aria-pressed={variantId === v.id} onClick={() => { setVariantId(v.id); setError(null); }}
                  className="chip press disabled:line-through disabled:opacity-50">
                  {variantLabel(v) || "Standard"}{v.price && v.price !== product.price ? ` · ${formatPrice(v.price)}` : ""}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {!out && (
        <div className="flex items-center gap-3">
          <span className="label mb-0">Quantité</span>
          <div className="flex items-center rounded-full border border-line">
            <button type="button" className="press grid h-10 w-10 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuer">−</button>
            <output aria-live="polite" className="w-8 text-center font-semibold">{qty}</output>
            <button type="button" className="press grid h-10 w-10 place-items-center" onClick={() => setQty((q) => Math.min(stock ?? 99, 99, q + 1))} aria-label="Augmenter">+</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="error-text">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={out} onClick={() => add(false)} className="btn btn-secondary press"><Icon name="cart" size={18} /> Ajouter</button>
        <button type="button" disabled={out} onClick={() => add(true)} className="btn btn-primary press">Commander</button>
      </div>
    </div>
  );
}
