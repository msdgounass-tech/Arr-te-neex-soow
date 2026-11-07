"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { sortedImages } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { CheckIcon, PlusIcon } from "@/components/ui/Icons";

/**
 * Ajout rapide depuis une carte produit.
 * Produit à déclinaison unique en stock : ajout direct au panier.
 * Plusieurs déclinaisons (capacité, couleur…) : ouverture de la fiche pour choisir.
 */
export function QuickAdd({ product, variantId, disabled }: { product: Product; variantId: string | null; disabled?: boolean }) {
  const add = useCart((s) => s.add);
  const notify = useUI((s) => s.notify);
  const router = useRouter();
  const [done, setDone] = useState(false);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (!variantId) {
      router.push(`/produit/${product.slug}`);
      return;
    }
    const v = product.product_variants.find((x) => x.id === variantId);
    if (!v) return;
    const stock = v.inventory?.quantity ?? 0;
    add({
      variantId: v.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      reference: product.reference,
      image: sortedImages(product)[0]?.url ?? null,
      size: v.size,
      color: v.color,
      unitPrice: v.price_override ?? product.price,
      quantity: 1,
      maxStock: stock,
    });
    notify("Ajouté au panier");
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };

  const label = disabled ? "Produit épuisé" : variantId ? `Ajouter ${product.name} au panier` : `Choisir les options de ${product.name}`;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={variantId ? "Ajouter au panier" : "Choisir les options"}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory text-ink shadow-lg transition-all duration-500 hover:scale-110 hover:bg-white hover:shadow-[0_0_0_5px_rgba(126,164,255,.25)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-mist disabled:shadow-none"
    >
      {done ? <CheckIcon width={18} height={18} /> : <PlusIcon width={18} height={18} strokeWidth={2.2} />}
    </motion.button>
  );
}
