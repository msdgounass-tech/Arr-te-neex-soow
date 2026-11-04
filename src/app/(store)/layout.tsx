import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { SessionSync } from "@/components/layout/SessionSync";
import { PageTransition } from "@/components/layout/PageTransition";
import { getSettings } from "@/lib/queries";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { toWhatsAppNumber } from "@/lib/format";
import { SITE_URL } from "@/lib/env";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { store, home } = await getSettings();
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "GOUNASS LUXURY",
    slogan: "Wouro Maama",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    areaServed: "SN",
    currenciesAccepted: "XOF",
    ...(store.email ? { email: store.email } : {}),
    ...(store.phone ? { telephone: `+${toWhatsAppNumber(store.phone)}` } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd).replace(/</g, "\\u003c") }} />
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">
        Aller au contenu
      </a>
      <Header announcement={home.announcement} logoUrl={home.logo_url} />
      <main id="contenu" className="min-h-[60vh]">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer store={store} logoUrl={home.logo_url} />
      <CartDrawer />
      <SearchOverlay />
      <SessionSync />
      <WhatsAppFloat number={toWhatsAppNumber(store.whatsapp)} />
    </>
  );
}
