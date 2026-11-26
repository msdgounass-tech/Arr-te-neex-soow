"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Category, Domain, Product, ProductImage, ProductVariant } from "@/lib/types";
import { saveProductAction, uploadProductImageAction, deleteProductImageAction } from "@/app/actions/seller";
import { compressImage } from "@/lib/compress";
import { QualityPanel } from "./QualityPanel";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/toast";
import { SuccessMark } from "@/components/motion/SuccessMark";

type V = { key: string; id?: string; size: string; color: string; model: string; sku: string; price: string; stock: string };
const toV = (v: ProductVariant): V => ({ key: v.id, id: v.id, size: v.size ?? "", color: v.color ?? "", model: v.model ?? "", sku: v.sku ?? "", price: v.price ? String(v.price) : "", stock: v.stock != null ? String(v.stock) : "" });

export function ProductForm({ product, images: initialImages, variants: initialVariants, domains, categories, canManage, firstProduct }:
  { product: Product | null; images: ProductImage[]; variants: ProductVariant[]; domains: Domain[]; categories: Category[]; canManage: boolean; firstProduct: boolean }) {
  const router = useRouter();
  const [productId, setProductId] = useState(product?.id ?? null);
  const [f, setF] = useState({
    title: product?.title ?? "", description: product?.description ?? "", price: product ? String(product.price) : "",
    compare_at_price: product?.compare_at_price ? String(product.compare_at_price) : "", category_id: product?.category_id ? String(product.category_id) : "",
    sku: product?.sku ?? "", availability: product?.availability ?? "in_stock", stock: product?.stock != null ? String(product.stock) : "",
  });
  const [images, setImages] = useState(initialImages);
  const [variants, setVariants] = useState<V[]>(initialVariants.map(toV));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const [pending, start] = useTransition();
  const [celebrate, setCelebrate] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const inv = (k: string) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${k}-e` : undefined });
  const err = (k: string) => errors[k] ? <p id={`${k}-e`} className="error-text">{errors[k]}</p> : null;

  const qualityInput = useMemo(() => ({
    title: f.title, description: f.description, price: Number(f.price) || 0, categoryId: f.category_id ? Number(f.category_id) : null,
    availability: f.availability as Product["availability"], stock: f.stock === "" ? null : Number(f.stock),
    hasVariantStock: variants.some((v) => v.stock !== "" && (v.size || v.color || v.model)), images: images.map((i) => ({ width: i.width })),
  }), [f, variants, images]);

  async function save(publish: boolean) {
    setError(null); setErrors({});
    return new Promise<string | null>((resolve) => start(async () => {
      const res = await saveProductAction({ id: productId ?? undefined, fields: f, imageOrder: images.map((i) => i.id), publish,
        variants: variants.map((v) => ({ id: v.id, size: v.size, color: v.color, model: v.model, sku: v.sku,
          price: v.price ? Number(v.price) : null, stock: v.stock === "" ? null : Number(v.stock) })) });
      if (res.data?.id && !productId) { setProductId(res.data.id); router.replace(`/vendeur/produits/${res.data.id}`, { scroll: false }); }
      if (!res.ok) { setError(res.error); setErrors(res.fields ?? {}); resolve(res.data?.id ?? null); return; }
      if (publish) { if (firstProduct) setCelebrate(true); toast("Produit publié"); } else toast("Brouillon enregistré");
      router.refresh();
      resolve(res.data?.id ?? null);
    }));
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    let id = productId;
    if (!id) {
      if (f.title.trim().length < 3 || !Number(f.price)) { setError("Indiquez d'abord le titre et le prix, puis ajoutez les photos."); return; }
      id = await save(false);
      if (!id) return;
    }
    for (const file of Array.from(files).slice(0, 8 - images.length)) {
      setUploading((n) => n + 1);
      try {
        const out = await compressImage(file);
        if (out.width < 200 || out.height < 200) throw new Error("Photo trop petite (200 × 200 pixels minimum).");
        const fd = new FormData(); fd.append("file", out.file);
        const res = await uploadProductImageAction(id, fd);
        if (!res.ok) throw new Error(res.error);
        setImages((imgs) => [...imgs, { id: res.data!.id, product_id: id!, url: res.data!.url, width: res.data!.width, height: 0, position: imgs.length }]);
      } catch (e) { toast((e as Error).message, "error", 5000); }
      finally { setUploading((n) => n - 1); }
    }
  }

  const move = (i: number, d: -1 | 1) => setImages((imgs) => { const n = [...imgs]; const j = i + d; if (j < 0 || j >= n.length) return imgs; [n[i], n[j]] = [n[j], n[i]]; return n; });

  if (celebrate) {
    return (
      <div className="card p-8 text-center"><div className="flex justify-center"><SuccessMark /></div>
        <h2 className="mt-4 text-2xl font-bold">Votre premier produit est en ligne</h2>
        <p className="mt-2 text-slate">Il est visible dans Explorer et sur votre boutique. Partagez-le pour obtenir vos premières visites.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" className="btn btn-primary press" onClick={() => { setCelebrate(false); router.push("/vendeur/produits/nouveau"); }}>Ajouter un autre produit</button>
          <a href="/vendeur/promouvoir" className="btn btn-secondary press">Partager mon produit</a></div></div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(true); }} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <fieldset disabled={!canManage} className="space-y-5">
        <section className="card space-y-4 p-5">
          <h2 className="font-semibold">Photos <span className="font-normal text-slate">({images.length}/8)</span></h2>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img, i) => (
              <li key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-mist">
                <Image src={img.url} alt={`Photo ${i + 1}`} fill sizes="160px" className="object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-white">Principale</span>}
                <div className="absolute inset-x-1 bottom-1 flex justify-between">
                  <span className="flex gap-1">
                    <button type="button" aria-label="Avancer" disabled={i === 0} onClick={() => move(i, -1)} className="press grid h-7 w-7 place-items-center rounded-full bg-white/90 disabled:opacity-40"><Icon name="chevron-left" size={14} /></button>
                    <button type="button" aria-label="Reculer" disabled={i === images.length - 1} onClick={() => move(i, 1)} className="press grid h-7 w-7 place-items-center rounded-full bg-white/90 disabled:opacity-40"><Icon name="chevron-right" size={14} /></button>
                  </span>
                  <button type="button" aria-label="Supprimer la photo" onClick={async () => { const r = await deleteProductImageAction(img.id); if (r.ok) setImages((x) => x.filter((y) => y.id !== img.id)); else toast(r.error, "error"); }}
                    className="press grid h-7 w-7 place-items-center rounded-full bg-white/90 text-danger"><Icon name="trash" size={14} /></button>
                </div>
              </li>
            ))}
            {Array.from({ length: uploading }).map((_, i) => <li key={`u${i}`} className="skeleton aspect-square rounded-xl" aria-label="Envoi en cours" />)}
            {images.length + uploading < 8 && (
              <li><label className="press flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-xs text-slate hover:border-[#cfd3db]">
                <Icon name="upload" /> Ajouter<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} /></label></li>
            )}
          </ul>
          <p className="hint">Lumière du jour, fond uni, plusieurs angles. Les photos sont optimisées automatiquement avant l'envoi.</p>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-semibold">Informations</h2>
          <div><label className="label" htmlFor="title">Titre</label><input id="title" className="field" maxLength={120} value={f.title} onChange={set("title")} placeholder="Ex. Robe wax coupe droite, 100 % coton" {...inv("title")} />{err("title")}<p className="hint">{f.title.trim().length} / 80 caractères conseillés</p></div>
          <div><label className="label" htmlFor="description">Description</label><textarea id="description" rows={6} maxLength={5000} className="field" value={f.description} onChange={set("description")} placeholder="Matière, dimensions, entretien, ce qui est inclus, délai…" /><p className="hint">{f.description.trim().length} caractères · 200 conseillés</p></div>
          <div><label className="label" htmlFor="category_id">Catégorie</label>
            <select id="category_id" className="field" value={f.category_id} onChange={set("category_id")} {...inv("category_id")}><option value="">Choisir…</option>
              {domains.map((d) => <optgroup key={d.id} label={d.name}>{categories.filter((c) => c.domain_id === d.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}</select>{err("category_id")}</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="price">Prix (FCFA)</label><input id="price" inputMode="numeric" className="field" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, "") })} {...inv("price")} />{err("price")}</div>
            <div><label className="label" htmlFor="compare_at_price">Ancien prix (facultatif)</label><input id="compare_at_price" inputMode="numeric" className="field" value={f.compare_at_price} onChange={(e) => setF({ ...f, compare_at_price: e.target.value.replace(/\D/g, "") })} {...inv("compare_at_price")} />{err("compare_at_price")}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="sku">Référence (facultatif)</label><input id="sku" className="field" maxLength={60} value={f.sku} onChange={set("sku")} placeholder="Ex. RW-001" /></div>
            <div><label className="label" htmlFor="availability">Disponibilité</label><select id="availability" className="field" value={f.availability} onChange={set("availability")}>
              <option value="in_stock">En stock</option><option value="on_order">Sur commande</option><option value="out_of_stock">Rupture de stock</option></select></div>
          </div>
          {variants.length === 0 && <div><label className="label" htmlFor="stock">Quantité en stock (facultatif)</label><input id="stock" inputMode="numeric" className="field" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value.replace(/\D/g, "") })} placeholder="Laisser vide si non suivi" /></div>}
        </section>

        <section className="card space-y-3 p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Variantes</h2>
            <button type="button" className="btn btn-secondary btn-sm press" onClick={() => setVariants([...variants, { key: crypto.randomUUID(), size: "", color: "", model: "", sku: "", price: "", stock: "" }])}><Icon name="plus" size={16} /> Ajouter</button></div>
          <p className="text-sm text-slate">Tailles, couleurs ou modèles. Chaque variante peut avoir son prix et son stock. Laissez le prix vide pour utiliser le prix du produit.</p>
          {variants.map((v, i) => (
            <fieldset key={v.key} className="grid grid-cols-2 gap-2 rounded-xl border border-line p-3 sm:grid-cols-6">
              <legend className="sr-only">Variante {i + 1}</legend>
              {(["size", "color", "model", "sku", "price", "stock"] as const).map((k) => (
                <label key={k} className="text-xs"><span className="mb-1 block text-slate">{{ size: "Taille", color: "Couleur", model: "Modèle", sku: "Réf.", price: "Prix", stock: "Stock" }[k]}</span>
                  <input className="field min-h-0 py-2 text-sm" inputMode={k === "price" || k === "stock" ? "numeric" : undefined} value={v[k]}
                    onChange={(e) => setVariants(variants.map((x) => x.key === v.key ? { ...x, [k]: k === "price" || k === "stock" ? e.target.value.replace(/\D/g, "") : e.target.value } : x))} /></label>
              ))}
              <button type="button" className="press col-span-2 justify-self-end text-sm text-danger sm:col-span-6" onClick={() => setVariants(variants.filter((x) => x.key !== v.key))}>Retirer la variante</button>
            </fieldset>
          ))}
        </section>
      </fieldset>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
        <QualityPanel input={qualityInput} />
        {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
        {!canManage && <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">Gestion en lecture seule tant que l'abonnement n'est pas réactivé.</p>}
        <div className="grid gap-2">
          <button type="submit" disabled={pending || !canManage || uploading > 0} className="btn btn-primary press">{product?.status === "published" ? "Enregistrer" : "Publier"}</button>
          <button type="button" disabled={pending || !canManage || uploading > 0} className="btn btn-secondary press" onClick={() => void save(false)}>Enregistrer comme brouillon</button>
        </div>
      </aside>
    </form>
  );
}
