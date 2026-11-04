"use client";
import clsx from "clsx";
import { motion } from "framer-motion";
import { HeartIcon } from "@/components/ui/Icons";
import { useFavorites } from "@/store/favorites";
import { useUI } from "@/store/ui";
import { useHydrated } from "@/hooks/useHydrated";

export function FavoriteButton({ productId, className, withLabel = false }: { productId: string; className?: string; withLabel?: boolean }) {
  const hydrated = useHydrated();
  const active = useFavorites((s) => s.ids.includes(productId)) && hydrated;
  const toggle = useFavorites((s) => s.toggle);
  const notify = useUI((s) => s.notify);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      aria-pressed={active}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const on = await toggle(productId);
        notify(on ? "Ajouté à vos favoris" : "Retiré de vos favoris");
      }}
      className={clsx("flex items-center gap-3 transition-colors", active ? "text-gold" : "text-ivory/85 hover:text-gold", className)}
    >
      <HeartIcon filled={active} />
      {withLabel && <span className="text-[0.66rem] uppercase tracking-[0.26em]">{active ? "Dans vos favoris" : "Ajouter aux favoris"}</span>}
    </motion.button>
  );
}
