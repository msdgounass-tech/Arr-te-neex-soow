"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function signOut() {
  const sb = await getServerSupabase();
  await sb?.auth.signOut();
  redirect("/");
}

export type FormState = { ok?: boolean; error?: string; message?: string };

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const { sb, user } = await requireUser();
  const parsed = z
    .object({ full_name: z.string().trim().min(2).max(120), phone: z.string().trim().max(30), whatsapp: z.string().trim().max(30) })
    .safeParse({ full_name: fd.get("full_name"), phone: fd.get("phone") || "", whatsapp: fd.get("whatsapp") || "" });
  if (!parsed.success) return { error: "Vérifiez les informations saisies." };
  const { error } = await sb.from("profiles").update({ ...parsed.data, phone: parsed.data.phone || null, whatsapp: parsed.data.whatsapp || null }).eq("id", user.id);
  if (error) return { error: "Mise à jour impossible." };
  revalidatePath("/compte");
  return { ok: true, message: "Profil mis à jour." };
}

const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  address_line: z.string().trim().min(4).max(300),
  city: z.string().trim().min(2).max(80),
  region: z.string().trim().max(80).optional(),
  zone_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional(),
});

export async function addAddress(_: FormState, fd: FormData): Promise<FormState> {
  const { sb, user } = await requireUser("/compte/adresses");
  const parsed = addressSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Merci de compléter tous les champs obligatoires." };
  const { count } = await sb.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const { error } = await sb.from("addresses").insert({ ...parsed.data, zone_id: parsed.data.zone_id || null, user_id: user.id, is_default: !count });
  if (error) return { error: "Enregistrement impossible." };
  revalidatePath("/compte/adresses");
  return { ok: true, message: "Adresse ajoutée." };
}

export async function deleteAddress(fd: FormData) {
  const { sb, user } = await requireUser("/compte/adresses");
  await sb.from("addresses").delete().eq("id", String(fd.get("id"))).eq("user_id", user.id);
  revalidatePath("/compte/adresses");
}

export async function setDefaultAddress(fd: FormData) {
  const { sb, user } = await requireUser("/compte/adresses");
  await sb.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  await sb.from("addresses").update({ is_default: true }).eq("id", String(fd.get("id"))).eq("user_id", user.id);
  revalidatePath("/compte/adresses");
}
