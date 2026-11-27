import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDomains, getShopBySlug, getShopReviews, searchProducts } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/product/ProductCard";
import { ContactButtons } from "@/components/product/ContactButtons";
import { ShareButton } from "@/components/product/ShareButtons";
import { TrustPanel } from "@/components/shop/Trust";
import { ShopAvatar } from "@/components/shop/ShopCard";
import { FollowShopButton, ShopViewTracker } from "@/components/shop/ShopActions";
import { EmptyState, Stars } from "@/components/ui/bits";
import { Icon } from "@/components/ui/Icon";
import { formatDate, formatPrice, memberSince } from "@/lib/format";
import { SITE } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getShopBySlug(slug);
  if (!data) return { title: "Boutique introuvable" };
  const { shop } = data;
  const description = (shop.description || `${shop.name}, boutique à ${shop.city} sur Shoppy by MSD.`).slice(0, 160);
  return { title: shop.name, description, alternates: { canonical: `/b/${shop.slug}` },
    openGraph: { title: shop.name, description, url: `/b/${shop.slug}`, images: shop.logo_url ? [shop.logo_url] : undefined } };
}

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getShopBySlug(slug);
  if (!data) notFound();
  const { shop, trust, zones, specialties } = data;
  const [products, reviews, domains, user] = await Promise.all([searchProducts({ shop: shop.id, perPage: 48, sort: "newest" }), getShopReviews(shop.id), getDomains(), getUser()]);
  let following = false;
  if (user) {
    const sb = await supabaseServer();
    const { data: f } = await sb.from("favorite_shops").select("shop_id").eq("shop_id", shop.id).maybeSingle();
    following = Boolean(f);
  }
  const domain = domains.find((d) => d.id === shop.domain_id);
  const jsonLd = { "@context": "https://schema.org", "@type": "Store", name: shop.name, description: shop.description || undefined,
    url: `${SITE.url}/b/${shop.slug}`, image: shop.logo_url || undefined, telephone: shop.public_phone || undefined,
    address: { "@type": "PostalAddress", addressLocality: shop.city, addressRegion: shop.region, addressCountry: shop.country_code } };

  return (
    <div>
      <ShopViewTracker shopId={shop.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="relative h-32 bg-orange-soft md:h-48">
        {shop.cover_url && <Image src={shop.cover_url} alt="" fill priority sizes="100vw" className="object-cover" />}
      </div>
      <div className="container-page">
        <div className="relative z-10 -mt-10 flex items-end gap-4">
          <div className="rounded-3xl bg-white p-1"><ShopAvatar shop={shop} size={88} /></div>
        </div>
        <div className="mt-3 grid gap-6 md:grid-cols-[1fr_340px]">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">{shop.name}{shop.verified_at && <Icon name="badge" size={22} className="text-success" title="Boutique vérifiée" />}</h1>
            {shop.is_demo && <p className="mt-2 inline-flex rounded-full bg-mist px-3 py-1 text-xs font-semibold text-slate">Boutique de démonstration : produits, commandes et avis fictifs</p>}
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate">
              {domain && <span>{domain.name}</span>}
              <span className="inline-flex items-center gap-1"><Icon name="map-pin" size={14} />{shop.city}, {shop.region}</span>
              <span>{memberSince(shop.created_at)}</span>
            </p>
            {specialties.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{specialties.map((c) => <li key={c.id}><a href={`/explorer?categorie=${c.id}`} className="chip press">{c.name}</a></li>)}</ul>}
            {shop.description && <p className="mt-4 max-w-2xl whitespace-pre-line text-[0.95rem] leading-relaxed">{shop.description}</p>}
            <div className="mt-4 max-w-md space-y-2">
              <ContactButtons shopId={shop.id} phone={shop.public_phone} whatsapp={shop.public_whatsapp} message={`Bonjour ${shop.name}, je vous contacte depuis Shoppy by MSD (${SITE.url}/b/${shop.slug}).`} />
              <div className="flex gap-2"><FollowShopButton shopId={shop.id} userId={user?.id ?? null} initial={following} /><ShareButton url={`/b/${shop.slug}`} title={shop.name} shopId={shop.id} /></div>
            </div>

            <section className="mt-10" aria-labelledby="products-title">
              <h2 id="products-title" className="mb-4 text-xl font-bold">Produits <span className="font-normal text-slate">({products.total})</span></h2>
              {products.items.length ? <ProductGrid items={products.items} priorityCount={4} /> : <EmptyState icon="package" title="Aucun produit publié pour le moment" />}
            </section>
          </div>

          <aside className="space-y-4">
            <TrustPanel trust={trust} />
            {zones.length > 0 && (
              <section className="card p-5"><h2 className="text-lg font-semibold">Livraison et retrait</h2>
                <ul className="mt-3 space-y-2 text-sm">{zones.map((z) => (
                  <li key={z.id}><b>{z.name}</b><br /><span className="text-slate">{z.fee == null ? "Frais à convenir" : z.fee === 0 ? "Gratuit" : formatPrice(z.fee)} · {z.min_days}–{z.max_days} jours{z.regions.length ? ` · ${z.regions.join(", ")}` : ""}</span></li>))}</ul>
                {shop.return_policy && <p className="mt-3 border-t border-line pt-3 text-sm"><b>Retours :</b> {shop.return_policy}</p>}
              </section>
            )}
            <section className="card p-5" aria-labelledby="reviews-title">
              <h2 id="reviews-title" className="text-lg font-semibold">Avis clients</h2>
              {reviews.length ? (
                <ul className="mt-3 divide-y divide-line">{reviews.map((r) => (
                  <li key={r.id} className="py-3"><div className="flex items-center justify-between"><Stars value={r.rating} /><span className="text-xs text-slate">{formatDate(r.created_at)}</span></div>
                    {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}<p className="mt-1 text-xs text-success">Achat vérifié</p></li>))}</ul>
              ) : <p className="mt-2 text-sm text-slate">Aucun avis pour le moment. Seuls les clients ayant reçu leur commande peuvent laisser un avis.</p>}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
