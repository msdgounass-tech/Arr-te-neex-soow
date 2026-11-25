"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/toast";
import { track } from "@/lib/track";
import { friendlyError } from "@/lib/errors";

export function ShopViewTracker({ shopId }: { shopId: string }) {
  useEffect(() => { track(shopId, "shop_view"); }, [shopId]);
  return null;
}

/** Suivre une boutique (favoris boutiques) — nécessite un compte. */
export function FollowShopButton({ shopId, userId, initial }: { shopId: string; userId: string | null; initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  async function toggle() {
    if (!userId) { router.push(`/connexion?suite=${encodeURIComponent(location.pathname)}`); return; }
    const sb = supabaseBrowser();
    setOn(!on);
    const { error } = on ? await sb.from("favorite_shops").delete().eq("user_id", userId).eq("shop_id", shopId)
      : await sb.from("favorite_shops").insert({ user_id: userId, shop_id: shopId });
    if (error) { setOn(on); toast(friendlyError(error), "error"); } else toast(on ? "Boutique retirée de vos favoris" : "Boutique ajoutée à vos favoris", "info");
  }
  return (
    <button type="button" onClick={toggle} aria-pressed={on} data-active={on} className="fav-btn btn btn-secondary press">
      <Icon name="heart" size={18} filled={on} className={`fav-icon ${on ? "text-orange" : ""}`} />{on ? "Suivie" : "Suivre"}
    </button>
  );
}
