import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { SessionSync } from "@/components/layout/SessionSync";
import { PageTransition } from "@/components/layout/PageTransition";
import { getSettings } from "@/lib/queries";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { store, home } = await getSettings();
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">
        Aller au contenu
      </a>
      <Header announcement={home.announcement} />
      <main id="contenu" className="min-h-[60vh]">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer store={store} />
      <CartDrawer />
      <SearchOverlay />
      <SessionSync />
    </>
  );
}
