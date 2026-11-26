"use server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin, hasServiceRole } from "@/lib/supabase/admin";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { imageSize } from "@/lib/image-meta";
import { isValidSenegalPhone } from "@/lib/format";

const MAX_BYTES = 5 * 1024 * 1024;

async function ctx() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  const user = data.user;
  const { data: shop } = user ? await sb.from("shops").select("id, slug, owner_id").eq("owner_id", user.id).maybeSingle() : { data: null };
  return { sb, user, shop: shop as { id: string; slug: string; owner_id: string } | null };
}

const phone = z.string().trim().refine((v) => v === "" || isValidSenegalPhone(v), "Numéro sénégalais invalide (ex. 77 123 45 67).");
const shopSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(60, "60 caractères maximum."),
  description: z.string().trim().max(2000),
  domain_id: z.coerce.number().int().positive("Choisissez un domaine d'activité."),
  specialties: z.array(z.coerce.number().int()).max(10, "10 spécialités maximum."),
  region: z.string().trim().min(2, "Choisissez la région."),
  city: z.string().trim().min(2, "Indiquez la ville.").max(80),
  public_phone: phone, public_whatsapp: phone,
  public_email: z.string().trim().refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Adresse e-mail invalide."),
}).refine((d) => d.public_phone || d.public_whatsapp, { message: "Indiquez au moins un numéro public : téléphone ou WhatsApp.", path: ["public_phone"] });

function readShopForm(form: FormData) {
  return { name: form.get("name"), description: form.get("description") ?? "", domain_id: form.get("domain_id"),
    specialties: form.getAll("specialties"), region: form.get("region"), city: form.get("city"),
    public_phone: form.get("public_phone") ?? "", public_whatsapp: form.get("public_whatsapp") ?? "", public_email: form.get("public_email") ?? "" };
}
function fieldErrors(err: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const i of err.issues) fields[String(i.path[0])] ??= i.message;
  return fields;
}

/** Envoie une image dans le stockage après vérification du propriétaire. Retourne l'URL publique. */
async function storeImage(shopId: string, file: File, folder: string): Promise<{ url: string; width: number; height: number } | { error: string }> {
  if (!hasServiceRole()) return { error: "Le stockage des images n'est pas encore configuré sur ce serveur." };
  if (file.size > MAX_BYTES) return { error: "Image trop lourde (5 Mo maximum)." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const meta = imageSize(bytes);
  if (!meta) return { error: "Format non pris en charge. Utilisez une photo JPEG, PNG ou WebP." };
  if (meta.width < 200 || meta.height < 200) return { error: "Image trop petite (200 × 200 pixels minimum)." };
  const path = `shops/${shopId}/${folder}/${randomUUID()}.${meta.type === "jpeg" ? "jpg" : meta.type}`;
  const admin = supabaseAdmin();
  const { error } = await admin.storage.from("media").upload(path, bytes, { contentType: `image/${meta.type}`, cacheControl: "31536000", upsert: false });
  if (error) return { error: "L'envoi de l'image a échoué. Réessayez." };
  return { url: admin.storage.from("media").getPublicUrl(path).data.publicUrl, width: meta.width, height: meta.height };
}

export async function createShopAction(_: ActionResult<{ slug: string }> | null, form: FormData): Promise<ActionResult<{ slug: string }>> {
  const parsed = shopSchema.safeParse(readShopForm(form));
  if (!parsed.success) return { ok: false, error: "Vérifiez les informations de la boutique.", fields: fieldErrors(parsed.error) };
  const { sb, user } = await ctx();
  if (!user) return { ok: false, error: "Connectez-vous pour créer votre boutique." };
  const d = parsed.data;
  const { data: id, error } = await sb.rpc("create_shop", {
    p_name: d.name, p_description: d.description, p_domain_id: d.domain_id, p_specialties: d.specialties, p_country: "SN",
    p_region: d.region, p_city: d.city, p_public_phone: d.public_phone, p_public_whatsapp: d.public_whatsapp, p_public_email: d.public_email, p_logo_url: null,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  const logo = form.get("logo");
  let warning: string | undefined;
  if (logo instanceof File && logo.size > 0) {
    const up = await storeImage(id as string, logo, "logo");
    if ("error" in up) warning = `Boutique créée, mais le logo n'a pas pu être enregistré : ${up.error}`;
    else await sb.from("shops").update({ logo_url: up.url }).eq("id", id);
  }
  const { data: shop } = await sb.from("shops").select("slug").eq("id", id).single();
  revalidatePath("/vendeur"); revalidatePath("/");
  return { ok: true, data: { slug: shop?.slug ?? "" }, message: warning };
}

export async function updateShopAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const parsed = shopSchema.safeParse(readShopForm(form));
  if (!parsed.success) return { ok: false, error: "Vérifiez les informations de la boutique.", fields: fieldErrors(parsed.error) };
  const { sb, shop } = await ctx();
  if (!shop) return { ok: false, error: "Boutique introuvable." };
  const { specialties, ...d } = parsed.data;
  const patch: Record<string, unknown> = { ...d, public_phone: d.public_phone || null, public_whatsapp: d.public_whatsapp || null, public_email: d.public_email || null,
    return_policy: String(form.get("return_policy") ?? "").trim().slice(0, 1000) || null, address_public: String(form.get("address_public") ?? "").trim().slice(0, 200) || null,
    is_published: form.get("is_published") === "on" };
  for (const [key, folder] of [["logo", "logo"], ["cover", "cover"]] as const) {
    const f = form.get(key);
    if (f instanceof File && f.size > 0) {
      const up = await storeImage(shop.id, f, folder);
      if ("error" in up) return { ok: false, error: up.error };
      patch[`${key}_url`] = up.url;
    }
  }
  const { error } = await sb.from("shops").update(patch).eq("id", shop.id);
  if (error) return { ok: false, error: friendlyError(error) };
  await sb.from("shop_specialties").delete().eq("shop_id", shop.id);
  if (specialties.length) {
    const { error: e2 } = await sb.from("shop_specialties").insert(specialties.map((c) => ({ shop_id: shop.id, category_id: c })));
    if (e2) return { ok: false, error: friendlyError(e2) };
  }
  revalidatePath("/vendeur", "layout"); revalidatePath(`/b/${shop.slug}`);
  return { ok: true, message: "Boutique mise à jour." };
}

// ───────────── Produits ─────────────
const productSchema = z.object({
  title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères.").max(120, "120 caractères maximum."),
  description: z.string().trim().max(5000),
  price: z.coerce.number({ message: "Indiquez un prix." }).int("Prix en francs CFA, sans décimales.").min(1, "Indiquez un prix.").max(100_000_000),
  compare_at_price: z.union([z.literal(""), z.coerce.number().int().positive()]).transform((v) => (v === "" ? null : v)),
  category_id: z.union([z.literal(""), z.coerce.number().int().positive()]).transform((v) => (v === "" ? null : v)),
  sku: z.string().trim().max(60).transform((v) => v || null),
  availability: z.enum(["in_stock", "out_of_stock", "on_order"]),
  stock: z.union([z.literal(""), z.coerce.number().int().min(0)]).transform((v) => (v === "" ? null : v)),
});
const variantSchema = z.object({
  id: z.string().optional(), size: z.string().trim().max(40).optional(), color: z.string().trim().max(40).optional(), model: z.string().trim().max(60).optional(),
  sku: z.string().trim().max(60).optional(), price: z.number().int().positive().nullable().optional(), stock: z.number().int().min(0).nullable().optional(),
});

export async function saveProductAction(input: { id?: string; fields: Record<string, string>; variants: unknown; imageOrder: string[]; publish: boolean }):
  Promise<ActionResult<{ id: string; status: string }>> {
  const p = productSchema.safeParse(input.fields);
  if (!p.success) return { ok: false, error: "Vérifiez les informations du produit.", fields: fieldErrors(p.error) };
  const v = z.array(variantSchema).max(50).safeParse(input.variants ?? []);
  if (!v.success) return { ok: false, error: "Une variante est invalide." };
  if (p.data.compare_at_price != null && p.data.compare_at_price <= p.data.price) return { ok: false, error: "L'ancien prix doit être supérieur au prix actuel.", fields: { compare_at_price: "Doit être supérieur au prix." } };
  const { sb, shop } = await ctx();
  if (!shop) return { ok: false, error: "Créez d'abord votre boutique." };

  let id = input.id;
  if (id) {
    const { error } = await sb.from("products").update(p.data).eq("id", id).eq("shop_id", shop.id);
    if (error) return { ok: false, error: friendlyError(error) };
  } else {
    const { data, error } = await sb.from("products").insert({ ...p.data, shop_id: shop.id, status: "draft" }).select("id").single();
    if (error) return { ok: false, error: friendlyError(error) };
    id = data.id as string;
  }
  // Variantes : on remplace l'ensemble (les commandes conservent un instantané, rien n'est perdu)
  const variants = v.data.filter((x) => x.size || x.color || x.model);
  const keep = variants.filter((x) => x.id).map((x) => x.id!);
  const del = sb.from("product_variants").delete().eq("product_id", id);
  const { error: dErr } = keep.length ? await del.not("id", "in", `(${keep.join(",")})`) : await del;
  if (dErr) return { ok: false, error: friendlyError(dErr) };
  for (const [i, x] of variants.entries()) {
    const row = { product_id: id, size: x.size || null, color: x.color || null, model: x.model || null, sku: x.sku || null, price: x.price ?? null, stock: x.stock ?? null, position: i, active: true };
    const { error } = x.id ? await sb.from("product_variants").update(row).eq("id", x.id) : await sb.from("product_variants").insert(row);
    if (error) return { ok: false, error: friendlyError(error) };
  }
  for (const [i, imgId] of input.imageOrder.entries()) await sb.from("product_images").update({ position: i }).eq("id", imgId).eq("product_id", id);

  let status = "draft";
  if (input.publish) {
    const { error } = await sb.rpc("publish_product", { p_product: id });
    if (error) { revalidatePath("/vendeur/produits"); return { ok: false, error: friendlyError(error), data: { id, status: "draft" } } as ActionResult<{ id: string; status: string }>; }
    status = "published";
  } else {
    const { data } = await sb.from("products").select("status").eq("id", id).single();
    status = data?.status ?? "draft";
  }
  revalidatePath("/vendeur/produits"); revalidatePath(`/b/${shop.slug}`); revalidatePath("/");
  return { ok: true, data: { id, status } };
}

export async function uploadProductImageAction(productId: string, form: FormData): Promise<ActionResult<{ id: string; url: string; width: number }>> {
  const { sb, shop } = await ctx();
  if (!shop) return { ok: false, error: "Créez d'abord votre boutique." };
  const { data: product } = await sb.from("products").select("id").eq("id", productId).eq("shop_id", shop.id).maybeSingle();
  if (!product) return { ok: false, error: "Produit introuvable." };
  const { count } = await sb.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
  if ((count ?? 0) >= 8) return { ok: false, error: "8 photos maximum par produit." };
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Aucune image reçue." };
  const up = await storeImage(shop.id, file, "products");
  if ("error" in up) return { ok: false, error: up.error };
  const { data, error } = await sb.from("product_images").insert({ product_id: productId, url: up.url, width: up.width, height: up.height, position: count ?? 0 }).select("id").single();
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath(`/vendeur/produits/${productId}`);
  return { ok: true, data: { id: data.id as string, url: up.url, width: up.width } };
}

export async function deleteProductImageAction(imageId: string): Promise<ActionResult> {
  const { sb } = await ctx();
  const { error } = await sb.from("product_images").delete().eq("id", imageId);
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true };
}

export async function setProductStatusAction(productId: string, status: "published" | "hidden" | "draft"): Promise<ActionResult> {
  const { sb, shop } = await ctx();
  if (!shop) return { ok: false, error: "Boutique introuvable." };
  const { error } = status === "published" ? await sb.rpc("publish_product", { p_product: productId })
    : await sb.from("products").update({ status }).eq("id", productId).eq("shop_id", shop.id);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/vendeur/produits"); revalidatePath(`/b/${shop.slug}`);
  return { ok: true, message: status === "published" ? "Produit publié." : status === "hidden" ? "Produit masqué." : "Produit repassé en brouillon." };
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  const { sb, shop } = await ctx();
  if (!shop) return { ok: false, error: "Boutique introuvable." };
  const { error } = await sb.from("products").delete().eq("id", productId).eq("shop_id", shop.id);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/vendeur/produits"); revalidatePath(`/b/${shop.slug}`);
  return { ok: true, message: "Produit supprimé. Les commandes passées restent consultables." };
}

// ───────────── Livraison ─────────────
const zoneSchema = z.object({
  name: z.string().trim().min(2, "Donnez un nom à cette option.").max(60), method: z.enum(["delivery", "pickup", "shipping"]),
  regions: z.array(z.string()).max(14), fee: z.union([z.literal(""), z.coerce.number().int().min(0)]).transform((v) => (v === "" ? null : v)),
  min_days: z.coerce.number().int().min(0).max(60), max_days: z.coerce.number().int().min(0).max(90),
}).refine((z) => z.max_days >= z.min_days, { message: "Le délai maximum doit être supérieur ou égal au minimum.", path: ["max_days"] });

export async function saveZoneAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const parsed = zoneSchema.safeParse({ name: form.get("name"), method: form.get("method"), regions: form.getAll("regions"), fee: form.get("fee") ?? "",
    min_days: form.get("min_days"), max_days: form.get("max_days") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { sb, shop } = await ctx();
  if (!shop) return { ok: false, error: "Boutique introuvable." };
  const id = String(form.get("id") ?? "");
  const { error } = id ? await sb.from("shop_delivery_zones").update(parsed.data).eq("id", id).eq("shop_id", shop.id)
    : await sb.from("shop_delivery_zones").insert({ ...parsed.data, shop_id: shop.id });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/vendeur/livraison"); revalidatePath(`/b/${shop.slug}`);
  return { ok: true, message: "Option de livraison enregistrée." };
}

export async function deleteZoneAction(id: string): Promise<ActionResult> {
  const { sb, shop } = await ctx();
  if (!shop) return { ok: false, error: "Boutique introuvable." };
  const { error } = await sb.from("shop_delivery_zones").update({ active: false }).eq("id", id).eq("shop_id", shop.id);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/vendeur/livraison");
  return { ok: true };
}

// ───────────── Assistant & abonnement ─────────────
export async function setAssistantStepAction(stepKey: string, status: "done" | "dismissed" | "reset"): Promise<ActionResult> {
  const { sb, user } = await ctx();
  if (!user) return { ok: false, error: "Connectez-vous." };
  const { error } = status === "reset" ? await sb.from("assistant_progress").delete().eq("user_id", user.id).eq("step_key", stepKey)
    : await sb.from("assistant_progress").upsert({ user_id: user.id, step_key: stepKey, status, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/vendeur", "layout");
  return { ok: true };
}

export async function declarePaymentAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const parsed = z.object({ method: z.enum(["wave", "orange_money", "autre"]), reference: z.string().trim().min(3, "Indiquez la référence de la transaction.").max(80),
    plan: z.string().optional() }).safeParse({ method: form.get("method"), reference: form.get("reference"), plan: form.get("plan") || undefined });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { sb } = await ctx();
  const { error } = await sb.rpc("declare_subscription_payment", { p_method: parsed.data.method, p_reference: parsed.data.reference, p_plan: parsed.data.plan ?? null, p_amount: null });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/vendeur", "layout");
  return { ok: true, message: "Paiement déclaré. Il sera vérifié avant l'activation de votre abonnement." };
}
