import { ImageResponse } from "next/og";

export const alt = "MSD Shoppy — les boutiques du Sénégal au même endroit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Aperçu par défaut des liens partagés (WhatsApp, Facebook). Les produits et boutiques utilisent leur propre photo. */
export default function OgImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f26b1d", padding: 72, color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 44, fontWeight: 800 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "#fff", display: "flex" }} />MSD Shoppy
      </div>
      <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 950 }}>Les boutiques du Sénégal, réunies en un seul endroit.</div>
      <div style={{ fontSize: 32, opacity: 0.95 }}>Trouvez, comparez, commandez directement chez le vendeur.</div>
    </div>,
    size,
  );
}
