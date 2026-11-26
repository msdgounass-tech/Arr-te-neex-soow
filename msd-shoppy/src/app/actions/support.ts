"use server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function submitTicketAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`ticket:${ip}`, 5, 60 * 60 * 1000)) return { ok: false, error: "Trop de messages envoyés. Réessayez dans une heure." };
  if (form.get("website")) return { ok: true, message: "Message envoyé." }; // champ piège anti-robot
  const parsed = z.object({
    email: z.email("Indiquez une adresse e-mail valide."),
    category: z.enum(["commande", "vendeur", "compte", "paiement", "signalement", "autre"]),
    subject: z.string().trim().min(3, "Indiquez un sujet.").max(140),
    message: z.string().trim().min(10, "Décrivez le problème en quelques mots (10 caractères minimum).").max(4000),
    page_url: z.string().trim().max(500).optional(),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  const { error } = await sb.from("support_tickets").insert({ ...parsed.data, page_url: parsed.data.page_url || null, user_id: data.user?.id ?? null });
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: "Message envoyé. L'équipe vous répondra par e-mail." };
}
