"use client";
import { favorites, useFavorites } from "@/lib/store/favorites";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/errors";

export function FavoriteButton({ productId, shopId, variant = "overlay" }: { productId: string; shopId: string; variant?: "overlay" | "button" }) {
  const { products } = useFavorites();
  const active = products.includes(productId);
  async function onClick(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    try {
      await favorites.toggle(productId, shopId); // le cœur qui se remplit suffit comme retour
    } catch (err) { toast(friendlyError(err), "error"); }
  }
  const label = active ? "Retirer des favoris" : "Ajouter aux favoris";
  if (variant === "button") {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} data-active={active} className="fav-btn btn btn-secondary">
        <Icon name="heart" size={18} filled={active} className={`fav-icon ${active ? "text-orange" : ""}`} />
        {active ? "Dans vos favoris" : "Favori"}
      </button>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-pressed={active} aria-label={label} data-active={active}
      className="fav-btn absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm">
      <Icon name="heart" size={18} filled={active} className={`fav-icon ${active ? "text-orange" : ""}`} />
    </button>
  );
}
