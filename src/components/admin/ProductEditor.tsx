"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { saveProduct } from "@/app/admin/actions";
import { uploadImage } from "@/lib/upload";
import { slugify } from "@/lib/format";
import { Card } from "./ui";
import { ChevronLeft, ChevronRight, TrashIcon } from "@/components/ui/Icons";

export interface EditableProduct {
  id: string;
  name: string;
  slug: string;
  reference: string;
  description: string | null;
  details: string | null;
  category_id: string | null;
  collection_id: string | null;
  gender: "homme" | "femme" | "unisexe";
  price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  tags?: string[];
  product_images: { id: string; url: string; storage_path: string | null; alt: string | null; position: number }[];
  product_variants: { id: string; size: string | null; color: string | null; color_hex: string | null; sku: string; price_override: number | null; position: number; is_active: boolean; inventory: { quantity: number } | null }[];
}

type Img = { id?: string; url: string; storage_path?: string | null; alt?: string | null };
type Var = { id?: string; size: string; color: string; color_hex: string; sku: string; price_override: string; stock: string; is_active: boolean };

interface Props {
  product?: EditableProduct;
  categories: { id: string; name: string; slug: string; parent_id: string | null; gender: string | null }[];
  collections: { id: string; name: string }[];
}

export function ProductEditor({ product, categories, collections }: Props) {
  const router = useRouter();
  const [f, setF] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    reference: product?.reference || "",
    description: product?.description || "",
    details: product?.details || "",
    category_id: product?.category_id || "",
    collection_id: product?.collection_id || "",
    gender: product?.gender || "homme",
    price: product ? String(product.price) : "",
    compare_at_price: product?.compare_at_price ? String(product.compare_at_price) : "",
    is_featured: product?.is_featured ?? false,
    is_new: product?.is_new ?? true,
    is_active: product?.is_active ?? true,
    seo_title: product?.seo_title || "",
    seo_description: product?.seo_description || "",
    tags: (product?.tags || []).join(", "),
  });
  const [images, setImages] = useState<Img[]>(() => [...(product?.product_images || [])].sort((a, b) => a.position - b.position));
  const [variants, setVariants] = useState<Var[]>(() =>
    product?.product_variants.length
      ? [...product.product_variants].sort((a, b) => a.position - b.position).map((v) => ({ id: v.id, size: v.size || "", color: v.color || "", color_hex: v.color_hex || "", sku: v.sku, price_override: v.price_override != null ? String(v.price_override) : "", stock: String(v.inventory?.quantity ?? 0), is_active: v.is_active }))
      : [{ size: "", color: "", color_hex: "", sku: "", price_override: "", stock: "0", is_active: true }],
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
  const setVar = (i: number, k: keyof Var, v: string | boolean) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMsg(null);
    try {
      const folder = product?.id || `tmp-${slugify(f.name || "produit")}`;
      for (const file of Array.from(files).slice(0, 12)) {
        const { url, path } = await uploadImage(file, "products", folder);
        setImages((imgs) => [...imgs, { url, storage_path: path, alt: f.name }]);
      }
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Téléversement impossible." });
    } finally {
      setUploading(false);
    }
  };
  const move = (i: number, d: number) => setImages((imgs) => { const n = [...imgs]; const j = i + d; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const genSku = (i: number) => {
    const v = variants[i];
    const base = (f.reference || "GL").toUpperCase();
    return [base, v.color && slugify(v.color).slice(0, 4).toUpperCase(), v.size && v.size.toUpperCase().replace(/\s/g, "")].filter(Boolean).join("-");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await saveProduct({
      ...f,
      tags: f.tags.split(",").map((t) => slugify(t)).filter(Boolean),
      id: product?.id,
      category_id: f.category_id || null,
      collection_id: f.collection_id || null,
      price: Number(f.price || 0),
      compare_at_price: f.compare_at_price ? Number(f.compare_at_price) : null,
      images,
      variants: variants.map((v, i) => ({ ...v, sku: v.sku || genSku(i), size: v.size || null, color: v.color || null, color_hex: v.color_hex || null, price_override: v.price_override ? Number(v.price_override) : null, stock: Number(v.stock || 0) })),
    });
    setSaving(false);
    if (res.error) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: res.message || "Enregistré." });
    if (!product && res.id) router.replace(`/admin/produits/${res.id}`);
    else router.refresh();
  };

  const parents = categories.filter((c) => !c.parent_id);

  return (
    <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <Card>
          <p className="label mb-4">Informations</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2"><span className="label">Nom *</span><input required value={f.name} onChange={set("name")} className="field-box mt-1" /></label>
            <label><span className="label">Référence *</span><input required value={f.reference} onChange={set("reference")} placeholder="GL-H-0001" className="field-box mt-1 uppercase" /></label>
            <label><span className="label">Slug (URL)</span><input value={f.slug} onChange={set("slug")} placeholder={slugify(f.name) || "genere-automatiquement"} className="field-box mt-1" /></label>
            <label className="md:col-span-2"><span className="label">Description</span><textarea rows={5} value={f.description} onChange={set("description")} className="field-box mt-1" /></label>
            <label className="md:col-span-2"><span className="label">Détails &amp; entretien</span><textarea rows={3} value={f.details} onChange={set("details")} className="field-box mt-1" /></label>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="label">Photos ({images.length}) — la première est l&apos;image principale</p>
            <label className={clsx("btn btn-ghost-gold min-h-9 cursor-pointer px-4", uploading && "opacity-50")}>
              {uploading ? "Téléversement…" : "Ajouter des photos"}
              <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>
          {images.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img, i) => (
                <li key={img.url} className={clsx("relative border", i === 0 ? "border-gold" : "border-white/15")}>
                  <div className="relative aspect-[3/4]"><Image src={img.url} alt="" fill sizes="200px" className="object-cover" /></div>
                  <input value={img.alt || ""} onChange={(e) => setImages((x) => x.map((m, j) => (j === i ? { ...m, alt: e.target.value } : m)))} placeholder="Texte alternatif" className="w-full bg-ink px-2 py-1 text-xs focus:outline-none" />
                  <div className="flex justify-between bg-ink-3 px-1 py-1">
                    <button type="button" aria-label="Déplacer à gauche" onClick={() => move(i, -1)} className="p-1 hover:text-gold"><ChevronLeft width={14} height={14} /></button>
                    <button type="button" aria-label="Retirer" onClick={() => setImages((x) => x.filter((_, j) => j !== i))} className="p-1 hover:text-danger"><TrashIcon width={14} height={14} /></button>
                    <button type="button" aria-label="Déplacer à droite" onClick={() => move(i, 1)} className="p-1 hover:text-gold"><ChevronRight width={14} height={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mist">Aucune photo. Formats JPG, PNG, WebP — 8 Mo max par image. Privilégiez un ratio portrait 3:4.</p>
          )}
        </Card>

        <Card className="overflow-x-auto">
          <div className="mb-4 flex items-center justify-between">
            <p className="label">Déclinaisons, tailles, couleurs &amp; stock</p>
            <button type="button" onClick={() => setVariants((v) => [...v, { size: "", color: v.at(-1)?.color || "", color_hex: v.at(-1)?.color_hex || "", sku: "", price_override: "", stock: "0", is_active: true }])} className="btn btn-ghost-gold min-h-9 px-4">Ajouter</button>
          </div>
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="text-left text-[0.68rem] uppercase tracking-[0.16em] text-mist"><th className="pb-2 pr-2 font-normal">Taille</th><th className="pb-2 pr-2 font-normal">Couleur</th><th className="pb-2 pr-2 font-normal">Teinte</th><th className="pb-2 pr-2 font-normal">SKU</th><th className="pb-2 pr-2 font-normal">Prix spécifique</th><th className="pb-2 pr-2 font-normal">Stock</th><th className="pb-2 pr-2 font-normal">Actif</th><th /></tr></thead>
            <tbody>
              {variants.map((v, i) => (
                <tr key={v.id || i}>
                  <td className="pb-2 pr-2"><input value={v.size} onChange={(e) => setVar(i, "size", e.target.value)} placeholder="M, 42, Unique…" className="field-box py-1.5" /></td>
                  <td className="pb-2 pr-2"><input value={v.color} onChange={(e) => setVar(i, "color", e.target.value)} placeholder="Noir" className="field-box py-1.5" /></td>
                  <td className="pb-2 pr-2"><input type="color" value={v.color_hex || "#000000"} onChange={(e) => setVar(i, "color_hex", e.target.value)} className="h-9 w-12 cursor-pointer border border-line bg-transparent" /></td>
                  <td className="pb-2 pr-2"><input value={v.sku} onChange={(e) => setVar(i, "sku", e.target.value)} placeholder={genSku(i)} className="field-box py-1.5 uppercase" /></td>
                  <td className="pb-2 pr-2"><input inputMode="numeric" value={v.price_override} onChange={(e) => setVar(i, "price_override", e.target.value.replace(/\D/g, ""))} placeholder="—" className="field-box py-1.5" /></td>
                  <td className="pb-2 pr-2"><input inputMode="numeric" value={v.stock} onChange={(e) => setVar(i, "stock", e.target.value.replace(/\D/g, ""))} className="field-box w-20 py-1.5" /></td>
                  <td className="pb-2 pr-2 text-center"><input type="checkbox" checked={v.is_active} onChange={(e) => setVar(i, "is_active", e.target.checked)} className="accent-[#C6A15B]" /></td>
                  <td className="pb-2"><button type="button" aria-label="Supprimer la déclinaison" disabled={variants.length === 1} onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))} className="p-1 text-mist hover:text-danger disabled:opacity-20"><TrashIcon width={16} height={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-mist">Laissez « Teinte » à noir si la couleur n&apos;a pas d&apos;échantillon. Le prix spécifique remplace le prix de base pour cette déclinaison.</p>
        </Card>

        <Card>
          <p className="label mb-4">Référencement (SEO)</p>
          <div className="grid gap-4">
            <label><span className="label">Titre SEO</span><input value={f.seo_title} onChange={set("seo_title")} placeholder={f.name} className="field-box mt-1" /></label>
            <label><span className="label">Méta-description</span><textarea rows={2} value={f.seo_description} onChange={set("seo_description")} className="field-box mt-1" /></label>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="xl:sticky xl:top-6">
          <p className="label mb-4">Prix (FCFA)</p>
          <label className="block"><span className="label">Prix de vente *</span><input required inputMode="numeric" value={f.price} onChange={(e) => setF((s) => ({ ...s, price: e.target.value.replace(/\D/g, "") }))} className="field-box mt-1" /></label>
          <label className="mt-4 block"><span className="label">Prix barré (promotion)</span><input inputMode="numeric" value={f.compare_at_price} onChange={(e) => setF((s) => ({ ...s, compare_at_price: e.target.value.replace(/\D/g, "") }))} placeholder="Laisser vide si aucune promotion" className="field-box mt-1" /></label>

          <p className="label mb-3 mt-8">Classement</p>
          <label className="block"><span className="label">Univers</span>
            <select value={f.gender} onChange={set("gender")} className="field-box mt-1"><option value="homme">Homme</option><option value="femme">Femme</option><option value="unisexe">Unisexe</option></select>
          </label>
          <label className="mt-4 block"><span className="label">Catégorie</span>
            <select value={f.category_id} onChange={set("category_id")} className="field-box mt-1">
              <option value="">—</option>
              {parents.map((p) => (
                <optgroup key={p.id} label={p.name}>
                  {categories.filter((c) => c.parent_id === p.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="mt-4 block"><span className="label">Collection</span>
            <select value={f.collection_id} onChange={set("collection_id")} className="field-box mt-1"><option value="">—</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </label>

          <label className="mt-4 block">
            <span className="label">Styles (séparés par des virgules)</span>
            <input value={f.tags} onChange={set("tags")} placeholder="luxe, classique, sportive, connectee" className="field-box mt-1" />
            <span className="mt-1 block text-xs text-mist">Utilisés par la page Montres et les filtres de style.</span>
          </label>

          <div className="mt-8 space-y-3 text-sm">
            <label className="flex items-center gap-3"><input type="checkbox" checked={f.is_active} onChange={set("is_active")} className="accent-[#C6A15B]" /> En ligne</label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={f.is_new} onChange={set("is_new")} className="accent-[#C6A15B]" /> Nouveauté</label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={f.is_featured} onChange={set("is_featured")} className="accent-[#C6A15B]" /> Mettre en vedette</label>
          </div>

          {msg && <p className={clsx("mt-6 text-sm", msg.ok ? "text-gold" : "text-danger")}>{msg.text}</p>}
          <button disabled={saving || uploading} className="btn btn-gold mt-6 w-full">{saving ? "Enregistrement…" : "Enregistrer le produit"}</button>
        </Card>
      </div>
    </form>
  );
}
