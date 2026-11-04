"use client";
import { getBrowserSupabase } from "@/lib/supabase/client";

/** Téléverse une image dans Supabase Storage (droits vérifiés par les règles RLS du bucket). */
export async function uploadImage(file: File, bucket: "products" | "site", folder: string) {
  const sb = getBrowserSupabase();
  if (!sb) throw new Error("Supabase non configuré.");
  if (!file.type.startsWith("image/")) throw new Error("Format non pris en charge.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image trop lourde (8 Mo max).");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw new Error(error.message.includes("security") ? "Droits insuffisants pour téléverser." : error.message);
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}
