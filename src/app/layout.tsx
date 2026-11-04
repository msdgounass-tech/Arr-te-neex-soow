import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { BRAND, DEFAULT_IMAGES } from "@/lib/site";
import { SITE_URL } from "@/lib/env";
import { Toast } from "@/components/ui/Toast";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} — ${BRAND.slogan}`, template: `%s — ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.slogan}`,
    description: BRAND.description,
    images: [{ url: DEFAULT_IMAGES.hero, width: 1600, height: 900, alt: "GOUNASS LUXURY — Wouro Maama" }],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_IMAGES.hero] },
  alternates: { canonical: "/" },
  keywords: ["boutique de luxe Sénégal", "mode de luxe Dakar", "montres de luxe", "sacs de luxe", "parfums", "bijoux", "GOUNASS LUXURY"],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#21150F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-dvh bg-ink text-ivory">
        {children}
        <Toast />
      </body>
    </html>
  );
}
