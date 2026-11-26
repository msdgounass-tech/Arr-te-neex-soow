import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TrustPanel, BADGES } from "@/components/shop/Trust";
import { PageTitle, Pill } from "@/components/ui/bits";
import { Icon } from "@/components/ui/Icon";
import { productQuality, qualityLabel } from "@/lib/quality";
import type { Trust } from "@/lib/types";

export const metadata = { title: "Confiance et qualité" };

export default async function TrustPage() {
  const { shop } = await requireShop();
  const sb = await supabaseServer();
  const [{ data: trust }, { data: products }] = await Promise.all([
    sb.rpc("get_shop_trust", { p_shop: shop.id }),
    sb.from("products").select("id, title, description, price, category_id, availability, stock, quality_score, status, images:product_images(width), variants:product_variants(stock, active)").eq("shop_id", shop.id).order("quality_score"),
  ]);
  const t = trust as Trust | null;
  const missing = Object.entries(BADGES).filter(([k]) => !t?.badges.includes(k));
  type P = { id: string; title: string; description: string; price: number; category_id: number | null; availability: "in_stock" | "out_of_stock" | "on_order"; stock: number | null; quality_score: number; status: string; images: { width: number }[]; variants: { stock: number | null; active: boolean }[] };
  const list = ((products ?? []) as P[]).map((p) => ({ ...p, q: productQuality({ title: p.title, description: p.description, price: p.price, categoryId: p.category_id, availability: p.availability, stock: p.stock, hasVariantStock: p.variants.some((v) => v.active && v.stock != null), images: p.images }) }));
  return (
    <div className="space-y-6">
      <PageTitle title="Confiance et qualité" subtitle="Deux évaluations distinctes : la fiabilité de votre boutique, et la qualité de présentation de vos produits." />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <TrustPanel trust={t} />
          {missing.length > 0 && (
            <section className="card p-5"><h2 className="font-semibold">Badges à obtenir</h2>
              <ul className="mt-3 space-y-2 text-sm">{missing.map(([k, b]) => (
                <li key={k} className="flex gap-2"><Icon name={b.icon} size={18} className="mt-0.5 text-slate" /><span><b>{b.label}</b> — <span className="text-slate">{b.rule}</span></span></li>))}</ul>
              <p className="mt-3 text-xs text-slate">Les badges sont calculés automatiquement à partir de votre activité réelle. Ils ne peuvent pas être achetés ni attribués manuellement par le vendeur. Le badge « Boutique vérifiée » est délivré par l'équipe MSD Shoppy après contrôle.</p></section>
          )}
        </div>
        <section className="card p-5"><h2 className="font-semibold">Qualité de vos fiches produits</h2>
          {!list.length ? <p className="mt-2 text-sm text-slate">Ajoutez un produit pour voir son score.</p> : (
            <ul className="mt-3 divide-y divide-line">{list.map((p) => {
              const ql = qualityLabel(p.q.score);
              return (<li key={p.id} className="py-3"><div className="flex items-center justify-between gap-3"><Link href={`/vendeur/produits/${p.id}`} className="truncate text-sm font-medium hover:underline">{p.title}</Link><Pill tone={ql.tone}>{p.q.score}/100</Pill></div>
                {p.q.tips[0] && <p className="mt-1 text-xs text-slate">Priorité : {p.q.tips[0].message.toLowerCase()} (+{p.q.tips[0].points} pts)</p>}</li>);
            })}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
