"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { eventForStatus, notifyOrder } from "@/lib/notifications";
import type { OrderStatus } from "@/lib/types";

export type ActionResult = { ok?: boolean; error?: string; message?: string; id?: string };

const int = z.coerce.number().int().min(0);
const optInt = z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(0).nullable());

const revalidateCatalog = () => {
  ["/", "/shop", "/men", "/women", "/accessories", "/nouveautes", "/promotions", "/collections", "/meilleures-ventes"].forEach((p) => revalidatePath(p));
  revalidatePath("/produit/[slug]", "page");
  revalidatePath("/collections/[slug]", "page");
};

const dbError = (e: { message: string; code?: string } | null) =>
  e?.code === "23505" ? "Cette valeur existe déjà (slug, référence ou SKU en double)." : e?.message.includes("row-level security") ? "Action non autorisée pour votre rôle." : "Enregistrement impossible.";

// ─── Produits ──────────────────────────────────────────────────────
const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(90).optional(),
  reference: z.string().trim().min(2).max(40),
  description: z.string().trim().max(5000).optional().default(""),
  details: z.string().trim().max(5000).optional().default(""),
  category_id: z.string().uuid().nullable().optional(),
  collection_id: z.string().uuid().nullable().optional(),
  gender: z.enum(["homme", "femme", "unisexe"]),
  price: int,
  compare_at_price: optInt,
  is_featured: z.boolean(),
  is_new: z.boolean(),
  is_active: z.boolean(),
  seo_title: z.string().trim().max(160).optional().default(""),
  seo_description: z.string().trim().max(320).optional().default(""),
  images: z.array(z.object({ id: z.string().uuid().optional(), url: z.string().url(), storage_path: z.string().nullable().optional(), alt: z.string().max(200).nullable().optional() })).max(20),
  variants: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        size: z.string().trim().max(30).nullable().optional(),
        color: z.string().trim().max(40).nullable().optional(),
        color_hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional().or(z.literal("")),
        sku: z.string().trim().min(1).max(60),
        price_override: optInt,
        stock: int,
        is_active: z.boolean(),
      }),
    )
    .min(1, "Ajoutez au moins une déclinaison (taille / couleur / stock).")
    .max(120),
});

export async function saveProduct(input: unknown): Promise<ActionResult> {
  const { sb } = await requireRole("manager");
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Formulaire invalide." };
  const { images, variants, id, ...p } = parsed.data;
  if (p.compare_at_price != null && p.compare_at_price <= p.price) p.compare_at_price = null;
  const row = { ...p, slug: slugify(p.slug || p.name), reference: p.reference.toUpperCase(), category_id: p.category_id || null, collection_id: p.collection_id || null };

  const { data: saved, error } = id ? await sb.from("products").update(row).eq("id", id).select("id").single() : await sb.from("products").insert(row).select("id").single();
  if (error || !saved) return { error: dbError(error) };
  const productId = saved.id as string;

  // Images : suppression des retirées, puis upsert ordonné
  const { data: existingImgs } = await sb.from("product_images").select("id").eq("product_id", productId);
  const keepImg = new Set(images.map((i) => i.id).filter(Boolean));
  const removeImg = (existingImgs || []).filter((i) => !keepImg.has(i.id)).map((i) => i.id);
  if (removeImg.length) await sb.from("product_images").delete().in("id", removeImg);
  if (images.length) {
    const { error: e } = await sb.from("product_images").upsert(images.map((img, position) => ({ ...(img.id ? { id: img.id } : {}), product_id: productId, url: img.url, storage_path: img.storage_path ?? null, alt: img.alt ?? null, position })));
    if (e) return { error: dbError(e), id: productId };
  }

  // Déclinaisons + stock
  const { data: existingVar } = await sb.from("product_variants").select("id").eq("product_id", productId);
  const keepVar = new Set(variants.map((v) => v.id).filter(Boolean));
  const removeVar = (existingVar || []).filter((v) => !keepVar.has(v.id)).map((v) => v.id);
  if (removeVar.length) await sb.from("product_variants").delete().in("id", removeVar);
  for (const [position, v] of variants.entries()) {
    const vr = { product_id: productId, size: v.size || null, color: v.color || null, color_hex: v.color_hex || null, sku: v.sku.toUpperCase(), price_override: v.price_override, is_active: v.is_active, position };
    const { data: sv, error: ve } = v.id ? await sb.from("product_variants").update(vr).eq("id", v.id).select("id").single() : await sb.from("product_variants").insert(vr).select("id").single();
    if (ve || !sv) return { error: dbError(ve), id: productId };
    const { error: ie } = await sb.from("inventory").upsert({ variant_id: sv.id, quantity: v.stock });
    if (ie) return { error: dbError(ie), id: productId };
  }

  revalidateCatalog();
  revalidatePath("/admin/produits");
  return { ok: true, message: "Produit enregistré.", id: productId };
}

export async function deleteProduct(fd: FormData) {
  const { sb } = await requireRole("manager");
  const id = String(fd.get("id"));
  const { data: imgs } = await sb.from("product_images").select("storage_path").eq("product_id", id);
  const paths = (imgs || []).map((i) => i.storage_path).filter(Boolean) as string[];
  if (paths.length) await sb.storage.from("products").remove(paths);
  await sb.from("products").delete().eq("id", id);
  revalidateCatalog();
  revalidatePath("/admin/produits");
  redirect("/admin/produits");
}

export async function toggleProduct(fd: FormData) {
  const { sb } = await requireRole("manager");
  const field = String(fd.get("field"));
  if (!["is_active", "is_featured", "is_new"].includes(field)) return;
  await sb.from("products").update({ [field]: fd.get("value") === "true" }).eq("id", String(fd.get("id")));
  revalidateCatalog();
  revalidatePath("/admin/produits");
}

// ─── Commandes ─────────────────────────────────────────────────────
const STATUSES = ["en_attente", "confirmee", "en_preparation", "expediee", "livree", "annulee"] as const;

export async function updateOrderStatus(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { sb } = await requireRole("staff");
  const id = String(fd.get("id"));
  const status = String(fd.get("status")) as OrderStatus;
  const notify = fd.get("notify") === "on";
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return { error: "Statut invalide." };
  const { error } = await sb.from("orders").update({ status }).eq("id", id);
  if (error) return { error: error.message.includes("COMMANDE_ANNULEE") ? "Une commande annulée ne peut plus changer de statut." : dbError(error) };
  if (notify) after(() => notifyOrder(id, eventForStatus(status)));
  revalidatePath(`/admin/commandes/${id}`);
  revalidatePath("/admin/commandes");
  return { ok: true, message: "Statut mis à jour." };
}

export async function updateDelivery(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { sb } = await requireRole("staff");
  const orderId = String(fd.get("order_id"));
  const { error } = await sb
    .from("deliveries")
    .update({
      carrier: String(fd.get("carrier") || "").slice(0, 80) || null,
      tracking_number: String(fd.get("tracking_number") || "").slice(0, 80) || null,
      scheduled_for: String(fd.get("scheduled_for") || "") || null,
      notes: String(fd.get("notes") || "").slice(0, 500) || null,
    })
    .eq("order_id", orderId);
  if (error) return { error: dbError(error) };
  revalidatePath(`/admin/commandes/${orderId}`);
  return { ok: true, message: "Livraison mise à jour." };
}

export async function setDeliveryFee(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { sb } = await requireRole("staff");
  const id = String(fd.get("id"));
  const fee = Number(String(fd.get("fee") || "").replace(/\D/g, ""));
  if (!Number.isFinite(fee) || String(fd.get("fee") || "").trim() === "") return { error: "Indiquez un montant." };
  const { error } = await sb.rpc("set_delivery_fee", { p_order_id: id, p_fee: fee });
  if (error) return { error: error.message.includes("DEJA_PAYEE") ? "Commande déjà payée : montant non modifiable." : "Mise à jour impossible." };
  if (fd.get("notify") === "on") after(() => notifyOrder(id, "delivery_fee_set"));
  revalidatePath(`/admin/commandes/${id}`);
  return { ok: true, message: "Frais de livraison enregistrés." };
}

export async function confirmManualPayment(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { sb } = await requireRole("staff");
  const id = String(fd.get("id"));
  const reference = String(fd.get("reference") || "").trim();
  const { error } = await sb.rpc("confirm_manual_payment", { p_order_id: id, p_reference: reference });
  if (error) {
    const m = error.message;
    return {
      error: m.includes("REFERENCE_REQUISE")
        ? "Saisissez la référence de la transaction (au moins 4 caractères)."
        : m.includes("COMMANDE_NON_PAYABLE")
          ? "Fixez d'abord les frais de livraison (ou la commande est annulée)."
          : "Confirmation impossible.",
    };
  }
  after(() => notifyOrder(id, "payment_received"));
  revalidatePath(`/admin/commandes/${id}`);
  return { ok: true, message: "Paiement confirmé." };
}

export async function markCodPaid(fd: FormData) {
  const { sb } = await requireRole("staff");
  const id = String(fd.get("id"));
  await sb.from("orders").update({ payment_status: "reussi", paid_at: new Date().toISOString() }).eq("id", id).eq("payment_method", "livraison");
  after(() => notifyOrder(id, "payment_received"));
  revalidatePath(`/admin/commandes/${id}`);
}

// ─── Catégories & collections ─────────────────────────────────────
export async function saveCategory(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { sb } = await requireRole("manager");
  const parsed = z
    .object({
      id: z.string().uuid().optional().or(z.literal("")),
      name: z.string().trim().min(2).max(80),
      parent_id: z.string().uuid().optional().or(z.literal("")),
      gender: z.enum(["homme", "femme", "unisexe", ""]).optional(),
      position: z.coerce.number().int().default(0),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Formulaire invalide." };
  const d = parsed.data;
  const row = {
    name: d.name,
    parent_id: d.parent_id || null,
    gender: d.gender || null,
    position: d.position,
    is_accessory: fd.get("is_accessory") === "on",
    is_active: fd.get("is_active") !== null ? fd.get("is_active") === "on" : true,
  };
  const { error } = d.id
    ? await sb.from("categories").update(row).eq("id", d.id)
    : await sb.from("categories").insert({ ...row, slug: slugify(`${d.gender ? d.gender + "-" : ""}${d.name}`) });
  if (error) return { error: dbError(error) };
  revalidatePath("/admin/categories");
  revalidateCatalog();
  return { ok: true, message: "Catégorie enregistrée." };
}

export async function deleteCategory(fd: FormData) {
  const { sb } = await requireRole("manager");
  await sb.from("categories").delete().eq("id", String(fd.get("id")));
  revalidatePath("/admin/categories");
}

export async function saveCollection(input: unknown): Promise<ActionResult> {
  const { sb } = await requireRole("manager");
  const parsed = z
    .object({
      id: z.string().uuid().optional(),
      name: z.string().trim().min(2).max(120),
      tagline: z.string().trim().max(200).optional().default(""),
      description: z.string().trim().max(3000).optional().default(""),
      image_url: z.string().url().nullable().optional(),
      is_featured: z.boolean(),
      is_exclusive: z.boolean(),
      is_active: z.boolean(),
      position: z.coerce.number().int().default(0),
    })
    .safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };
  const { id, ...row } = parsed.data;
  if (row.is_featured) await sb.from("collections").update({ is_featured: false }).neq("id", id || "00000000-0000-0000-0000-000000000000");
  const { error } = id ? await sb.from("collections").update(row).eq("id", id) : await sb.from("collections").insert({ ...row, slug: slugify(row.name) });
  if (error) return { error: dbError(error) };
  revalidatePath("/admin/collections");
  revalidateCatalog();
  return { ok: true, message: "Collection enregistrée." };
}

export async function deleteCollection(fd: FormData) {
  const { sb } = await requireRole("manager");
  await sb.from("collections").delete().eq("id", String(fd.get("id")));
  revalidatePath("/admin/collections");
  revalidateCatalog();
}

// ─── Codes promo ───────────────────────────────────────────────────
export async function saveCoupon(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { sb } = await requireRole("manager");
  const parsed = z
    .object({
      id: z.string().uuid().optional().or(z.literal("")),
      code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/, "Code : lettres, chiffres, - et _ uniquement."),
      description: z.string().trim().max(200).optional(),
      discount_type: z.enum(["percent", "fixed"]),
      value: z.coerce.number().int().min(1),
      min_order: z.coerce.number().int().min(0).default(0),
      max_uses: optInt,
      starts_at: z.string().optional(),
      ends_at: z.string().optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Formulaire invalide." };
  const { id, ...d } = parsed.data;
  if (d.discount_type === "percent" && d.value > 100) return { error: "Un pourcentage ne peut dépasser 100." };
  const row = { ...d, code: d.code.toUpperCase(), starts_at: d.starts_at || null, ends_at: d.ends_at || null, is_active: fd.get("is_active") === "on" };
  const { error } = id ? await sb.from("coupons").update(row).eq("id", id) : await sb.from("coupons").insert(row);
  if (error) return { error: dbError(error) };
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Code enregistré." };
}

export async function deleteCoupon(fd: FormData) {
  const { sb } = await requireRole("manager");
  await sb.from("coupons").delete().eq("id", String(fd.get("id")));
  revalidatePath("/admin/coupons");
}

// ─── Livraison ─────────────────────────────────────────────────────
export async function saveZone(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { sb } = await requireRole("admin");
  const parsed = z
    .object({
      id: z.string().uuid().optional().or(z.literal("")),
      name: z.string().trim().min(2).max(80),
      fee: z.coerce.number().int().min(0),
      free_above: optInt,
      delay: z.string().trim().max(120).optional(),
      position: z.coerce.number().int().default(0),
      fee_mode: z.enum(["fixed", "distance", "quote"]),
      per_km_fee: z.coerce.number().int().min(0).default(0),
      max_km: optInt,
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Formulaire invalide." };
  const { id, ...d } = parsed.data;
  const row = { ...d, free_above: d.free_above || null, max_km: d.max_km || null, delay: d.delay || null, is_active: fd.get("is_active") === "on" };
  const { error } = id ? await sb.from("delivery_zones").update(row).eq("id", id) : await sb.from("delivery_zones").insert({ ...row, slug: slugify(d.name) });
  if (error) return { error: dbError(error) };
  revalidatePath("/admin/livraison");
  revalidatePath("/livraison");
  return { ok: true, message: "Zone enregistrée." };
}

// ─── Clients & rôles ───────────────────────────────────────────────
export async function setRole(fd: FormData) {
  const { sb, user } = await requireRole("admin");
  const id = String(fd.get("id"));
  const role = String(fd.get("role"));
  if (id === user.id || !["customer", "staff", "manager", "admin"].includes(role)) return;
  await sb.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/admin/clients");
}

// ─── Paramètres ────────────────────────────────────────────────────
export async function saveSettings(key: "store" | "home" | "delivery" | "payments", value: Record<string, string>): Promise<ActionResult> {
  const { sb } = await requireRole("admin");
  const clean = Object.fromEntries(Object.entries(value).map(([k, v]) => [k.slice(0, 40), String(v ?? "").trim().slice(0, 500)]));
  if (key === "payments") {
    for (const v of [clean.wave_link, clean.orange_money_link]) if (v && !/^https:\/\/\S+$/.test(v)) return { error: "Les liens de paiement doivent commencer par https://" };
  }
  if (key === "delivery") {
    const lat = Number(clean.origin_lat), lng = Number(clean.origin_lng);
    if ((clean.origin_lat || clean.origin_lng) && (!(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180))) return { error: "Coordonnées invalides." };
  }
  const { error } = await sb.from("settings").upsert({ key, value: clean, is_public: true });
  if (error) return { error: dbError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Paramètres enregistrés." };
}

export async function markMessageRead(fd: FormData) {
  const { sb } = await requireRole("staff");
  await sb.from("contact_messages").update({ is_read: true }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/messages");
}
