import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCollectionBySlug, getProducts } from "@/lib/queries";
import { DEFAULT_IMAGES } from "@/lib/site";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";

export const revalidate = 60;
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = await getCollectionBySlug((await params).slug);
  return c ? { title: c.name, description: c.description || c.tagline || undefined, openGraph: c.image_url ? { images: [c.image_url] } : undefined } : {};
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { slug } = await params;
  const c = await getCollectionBySlug(slug);
  if (!c) notFound();
  const { items } = await getProducts({ collectionSlug: slug, limit: 48 });
  return (
    <>
      <section className="relative -mt-[72px] h-[80vh] min-h-[520px] overflow-hidden lg:-mt-[84px]">
        <Image src={c.image_url || DEFAULT_IMAGES.hero} alt={c.name} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/50" />
        <div className="container-luxe relative flex h-full flex-col items-center justify-end pb-20 text-center">
          <Reveal>
            <p className="eyebrow">{c.is_exclusive ? "Collection exclusive" : "Collection"}</p>
            <h1 className="display mt-6 text-6xl md:text-9xl">{c.name}</h1>
            {c.tagline && <p className="display mt-5 text-2xl italic text-ivory/90">{c.tagline}</p>}
          </Reveal>
        </div>
      </section>
      <div className="container-luxe pt-16">
        {c.description && <p className="mx-auto mb-16 max-w-2xl text-center leading-relaxed text-ivory/90">{c.description}</p>}
        {items.length ? <ProductGrid products={items} /> : <EmptyState title="Bientôt disponible" text="Les pièces de cette collection seront bientôt dévoilées." />}
      </div>
    </>
  );
}
