import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/site";
import { SITE_URL } from "@/lib/env";
import { Toast } from "@/components/ui/Toast";

const sora = Sora({
  subsets: ["latin"],
  // Titres uniquement : deux graisses suffisent.
  weight: ["500", "600"],
  variable: "--font-sora",
  display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} ${BRAND.tagline} — ${BRAND.slogan}`, template: `%s — ${BRAND.name} ${BRAND.tagline}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: BRAND.name,
    title: `${BRAND.name} ${BRAND.tagline} — ${BRAND.slogan}`,
    description: BRAND.description,
  },
  twitter: { card: "summary_large_image" },
  keywords: ["boutique high-tech Sénégal", "smartphone Dakar", "ordinateur portable Dakar", "écouteurs", "montre connectée", "accessoires téléphone", "prix FCFA", BRAND.name],
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07080B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sora.variable} ${manrope.variable}`}>
      <body className="min-h-dvh bg-ink text-ivory">
        {children}
        <Toast />
      </body>
    </html>
  );
}
