"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin, hasServiceRole } from "@/lib/supabase/admin";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { isValidSenegalPhone } from "@/lib/format";

async function userOrFail() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return { sb, user: data.user };
}

export async function updateProfileAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const parsed = z.object({
    full_name: z.string().trim().min(2, "Indiquez votre nom.").max(80),
    phone: z.string().trim().refine((v) => v === "" || isValidSenegalPhone(v), "Numéro sénégalais invalide."),
  }).safeParse({ full_name: form.get("full_name"), phone: form.get("phone") ?? "" });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { sb, user } = await userOrFail();
  if (!user) return { ok: false, error: "Connectez-vous pour continuer." };
  const { error } = await sb.from("profiles").update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null }).eq("id", user.id);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/compte");
  return { ok: true, message: "Informations enregistrées." };
}

const addressSchema = z.object({
  label: z.string().trim().min(1).max(40), recipient_name: z.string().trim().min(2, "Indiquez le nom du destinataire.").max(80),
  phone: z.string().trim().refine(isValidSenegalPhone, "Numéro sénégalais invalide."), region: z.string().trim().min(2, "Choisissez la région."),
  city: z.string().trim().min(2, "Indiquez la ville.").max(80), details: z.string().trim().max(300), is_default: z.boolean(),
});

export async function saveAddressAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const parsed = addressSchema.safeParse({ ...Object.fromEntries(form), is_default: form.get("is_default") === "on" });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { sb, user } = await userOrFail();
  if (!user) return { ok: false, error: "Connectez-vous pour continuer." };
  const id = String(form.get("id") ?? "");
  if (parsed.data.is_default) await sb.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  const { error } = id ? await sb.from("addresses").update(parsed.data).eq("id", id)
    : await sb.from("addresses").insert({ ...parsed.data, user_id: user.id });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/compte/adresses");
  return { ok: true, message: "Adresse enregistrée." };
}

export async function deleteAddressAction(id: string): Promise<ActionResult> {
  const { sb } = await userOrFail();
  const { error } = await sb.from("addresses").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/compte/adresses");
  return { ok: true };
}

export async function setPromotionsAction(enabled: boolean): Promise<ActionResult> {
  const { sb, user } = await userOrFail();
  if (!user) return { ok: false, error: "Connectez-vous pour continuer." };
  const { error } = await sb.from("profiles").update({ notify_promotions: enabled }).eq("id", user.id);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/compte/parametres");
  return { ok: true, message: enabled ? "Conseils et annonces activés." : "Conseils et annonces désactivés." };
}

export async function markNotificationsReadAction(ids?: string[]): Promise<ActionResult> {
  const { sb } = await userOrFail();
  let q = sb.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (ids?.length) q = q.in("id", ids);
  const { error } = await q;
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/notifications", "layout");
  return { ok: true };
}

export async function signOutAction() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/");
}

/** Suppression du compte : données personnelles effacées, commandes anonymisées, accès fermé. */
export async function deleteAccountAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (form.get("confirm") !== "SUPPRIMER") return { ok: false, error: "Saisissez SUPPRIMER pour confirmer." };
  const { sb, user } = await userOrFail();
  if (!user) return { ok: false, error: "Connectez-vous pour continuer." };
  const { error } = await sb.rpc("delete_my_account");
  if (error) return { ok: false, error: friendlyError(error) };
  if (hasServiceRole()) {
    const admin = supabaseAdmin();
    const { count } = await admin.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", user.id);
    if (!count) await admin.auth.admin.deleteUser(user.id);
    else await admin.auth.admin.updateUserById(user.id, { email: `supprime-${user.id}@invalid.local`, ban_duration: "876000h", user_metadata: {} });
  }
  await sb.auth.signOut();
  redirect("/?compte=supprime");
}
