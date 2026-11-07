import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { SessionSync } from "@/components/layout/SessionSync";
import { PageTransition } from "@/components/layout/PageTransition";
import { getCategoryTree, getSettings } from "@/lib/queries";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { toWhatsAppNumber } from "@/lib/format";
import { SITE_URL } from "@/lib/env";
import { BRAND } from "@/lib/site";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [{ store, home }, tree] = await Promise.all([getSettings(), getCategoryTree()]);
  const categories = tree.map((c) => ({ name: c.name, slug: c.slug, children: c.children.map((s) => ({ name: s.name, slug: s.slug })) }));
  const phone = store.phone ? `+${toWhatsAppNumber(store.phone)}` : undefined;
  const orgLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: `${BRAND.name} ${BRAND.tagline}`,
        legalName: BRAND.legalName,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.png`,
        areaServed: { "@type": "Country", name: "Sénégal" },
        ...(store.email ? { email: store.email } : {}),
        ...(phone ? { telephone: phone, contactPoint: [{ "@type": "ContactPoint", telephone: phone, contactType: "customer service", availableLanguage: ["French", "Wolof"] }] } : {}),
        sameAs: [store.instagram, store.facebook, store.tiktok].filter((u) => u && u.startsWith("http")),
      },
      {
        "@type": "OnlineStore",
        "@id": `${SITE_URL}/#store`,
        name: `${BRAND.name} ${BRAND.tagline}`,
        url: SITE_URL,
        parentOrganization: { "@id": `${SITE_URL}/#organization` },
        currenciesAccepted: "XOF",
        paymentAccepted: "Wave, Orange Money, Paiement à la livraison",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: `${BRAND.name} ${BRAND.tagline}`,
        inLanguage: "fr-SN",
        potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/shop?q={search_term_string}`, "query-input": "required name=search_term_string" },
      },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd).replace(/</g, "\\u003c") }} />
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ivory focus:px-4 focus:py-2 focus:text-ink">
        Aller au contenu
      </a>
      <Header announcement={home.announcement} logoUrl={home.logo_url} categories={categories} />
      <main id="contenu" className="min-h-[60vh]">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer store={store} logoUrl={home.logo_url} categories={categories} />
      <CartDrawer />
      <SearchOverlay categories={categories} />
      <SessionSync />
      <WhatsAppFloat number={toWhatsAppNumber(store.whatsapp)} />
    </>
  );
}
