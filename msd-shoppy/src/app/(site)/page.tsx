import Link from "next/link";
import { Suspense } from "react";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { ProductRail } from "@/components/product/ProductCard";
import { ShopCard } from "@/components/shop/ShopCard";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";
import { getDomains, getTrustMap, searchProducts, searchShops } from "@/lib/queries";
import type { ProductCardData, Trust } from "@/lib/types";

export const revalidate = 60;

function Section({ title, href, children, reveal = true }: { title: string; href?: string; children: React.ReactNode; reveal?: boolean }) {
  const Wrap = reveal ? Reveal : "section";
  return (
    <Wrap {...(reveal ? { as: "section" as const } : {})} className="container-page mt-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
        {href && <Link href={href} className="link shrink-0 text-sm">Tout voir</Link>}
      </div>
      {children}
    </Wrap>
  );
}

export default async function HomePage() {
  const [domains, newest, popular, recommended, shops] = await Promise.all([
    getDomains(),
    searchProducts({ sort: "newest", perPage: 10 }),
    searchProducts({ sort: "popular", perPage: 10 }),
    searchProducts({ sort: "relevance", perPage: 10 }),
    searchShops(undefined, undefined, undefined, 8),
  ]);
  const all: ProductCardData[] = [...newest.items, ...popular.items, ...recommended.items];
  const trust: Record<string, Trust> = await getTrustMap(all.map((p) => p.shop.id));
  const domainById = new Map(domains.map((d) => [d.id, d]));
  const empty = newest.total === 0;

  return (
    <>
      <section className="bg-orange">
        <div className="container-page pb-8 pt-7 md:pb-14 md:pt-12">
          <h1 className="max-w-2xl text-[2rem] font-extrabold leading-[1.05] text-white md:text-5xl">
            Les boutiques du Sénégal, réunies en un seul endroit.
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/95 md:text-lg">Trouvez un produit, comparez les vendeurs et commandez directement chez eux.</p>
          <div className="mt-5 max-w-2xl"><Suspense fallback={<div className="h-14 rounded-full bg-white" />}><HeaderSearch large placeholder="Robe wax, téléphone, engrais…" /></Suspense></div>
        </div>
      </section>

      {domains.length > 0 && <section aria-labelledby="cat-title" className="container-page mt-8">
        <h2 id="cat-title" className="mb-4 text-xl font-bold md:text-2xl">Catégories</h2>
        <ul className="grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-8">
          {domains.map((d) => (
            <li key={d.id}>
              <Link href={`/explorer?domaine=${d.id}`} className="press flex h-full flex-col items-center gap-2 rounded-2xl p-2 text-center hover:bg-mist">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-soft text-orange-text"><Icon name={d.icon} size={26} /></span>
                <span className="text-xs font-medium leading-tight">{d.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>}

      {empty ? (
        <section className="container-page mt-10">
          <div className="rounded-3xl bg-mist p-6 md:p-10">
            <h2 className="text-2xl font-bold">Les premières boutiques s'installent</h2>
            <p className="mt-2 max-w-xl text-slate">Vous vendez au Sénégal ? Ouvrez votre boutique en quelques minutes et soyez parmi les premiers vendeurs visibles sur MSD Shoppy.</p>
            <Link href="/vendre" className="btn btn-primary press mt-5"><Icon name="store" size={18} /> Ouvrir ma boutique</Link>
          </div>
        </section>
      ) : (
        <>
          <Section title="Nouveautés" href="/explorer?tri=newest" reveal={false}><ProductRail items={newest.items} trust={trust} /></Section>
          {shops.length > 0 && (
            <Section title="Boutiques à découvrir" href="/explorer?vue=boutiques">
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{shops.map((s) => <li key={s.id}><ShopCard shop={s} domain={domainById.get(s.domain_id)} /></li>)}</ul>
            </Section>
          )}
          <Section title="Produits populaires" href="/explorer?tri=popular"><ProductRail items={popular.items} trust={trust} /></Section>
          <Section title="Recommandés pour vous" href="/explorer"><ProductRail items={recommended.items} trust={trust} /></Section>
        </>
      )}

      <Reveal as="section" className="container-page mt-12 grid gap-3 md:grid-cols-2">
        <Link href="/vendre" className="press flex items-center gap-4 rounded-3xl bg-ink p-6 text-white">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange"><Icon name="store" size={24} /></span>
          <span><span className="block text-lg font-bold">Vendez sur MSD Shoppy</span>
            <span className="text-sm text-white/80">7 jours d'essai gratuit, un assistant pour vous guider pas à pas.</span></span>
        </Link>
        <Link href="/aide/confiance" className="press flex items-center gap-4 rounded-3xl border border-line p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-success-soft text-success"><Icon name="shield" size={24} /></span>
          <span><span className="block text-lg font-bold">Achetez en confiance</span>
            <span className="text-sm text-slate">Avis vérifiés, commandes terminées et badges calculés sur des données réelles.</span></span>
        </Link>
      </Reveal>
    </>
  );
}
