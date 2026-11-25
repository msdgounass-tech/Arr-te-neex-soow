"use client";
import { Icon } from "@/components/ui/Icon";
import { telLink, whatsappLink } from "@/lib/format";
import { track } from "@/lib/track";

/** Boutons d'appel et WhatsApp : uniquement les numéros publics choisis par le vendeur. */
export function ContactButtons({ shopId, productId, phone, whatsapp, message, size = "md" }:
  { shopId: string; productId?: string; phone: string | null; whatsapp: string | null; message: string; size?: "md" | "sm" }) {
  const wa = whatsappLink(whatsapp, message);
  const tel = telLink(phone);
  if (!wa && !tel) return null;
  const cls = size === "sm" ? "btn-sm" : "";
  return (
    <div className="flex gap-2">
      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => track(shopId, "whatsapp_click", productId)} className={`btn btn-whatsapp press flex-1 ${cls}`}>
        <Icon name="whatsapp" size={18} /> WhatsApp</a>}
      {tel && <a href={tel} onClick={() => track(shopId, "call_click", productId)} className={`btn btn-secondary press flex-1 ${cls}`}>
        <Icon name="phone" size={18} /> Appeler</a>}
    </div>
  );
}
