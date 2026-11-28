import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { AiError, aiConfigured, getProvider } from "@/lib/ai/provider";
import { INPUTS, TASKS, type TaskName } from "@/lib/ai/tasks";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 60;
// À incrémenter à chaque changement des consignes : invalide le cache des anciennes générations.
const PROMPT_VERSION = "v2:";

const AI_ERRORS: Record<string, [number, string]> = {
  IA_NON_CONFIGUREE: [503, "Shoppy AI n'est pas encore activé sur la plateforme (clé du fournisseur d'IA non configurée). Les analyses calculées restent disponibles."],
  IA_REFUS: [422, "Shoppy AI n'a pas pu traiter cette demande. Reformulez-la."],
  IA_INDISPONIBLE: [503, "Le service d'IA est momentanément indisponible. Réessayez dans quelques minutes."],
  IA_REPONSE_INVALIDE: [502, "La réponse de l'IA était incomplète. Réessayez."],
};

const body = z.object({ task: z.enum(Object.keys(TASKS) as [TaskName, ...TaskName[]]), input: z.unknown() });

/** Point d'entrée unique de Shoppy AI générative : authentification, quota, cache, appel au fournisseur, suivi du coût. */
export async function POST(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous pour utiliser Shoppy AI." }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Demande invalide." }, { status: 400 });
  const { task } = parsed.data;
  const def = TASKS[task];
  const input = (INPUTS[task] as z.ZodType).safeParse(parsed.data.input);
  if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message ?? "Demande invalide." }, { status: 400 });

  if (!aiConfigured()) return NextResponse.json({ error: AI_ERRORS.IA_NON_CONFIGUREE[1], code: "IA_NON_CONFIGUREE" }, { status: 503 });

  // Contexte construit côté serveur, uniquement à partir des données autorisées de la boutique (RLS).
  let prompt: string;
  try { prompt = await buildPrompt(sb, task, input.data as Record<string, unknown>); }
  catch (e) { return NextResponse.json({ error: friendlyError(e as { message: string }) }, { status: 400 }); }
  const image = (input.data as { image?: { mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string } }).image;
  const hash = createHash("sha256").update(PROMPT_VERSION + task + "\n" + prompt + "\n" + (image?.data ?? "")).digest("hex");

  // Cache : une demande identique des 7 derniers jours est resservie sans consommer de quota.
  const { data: cached } = await sb.from("ai_usage").select("output").eq("input_hash", hash).eq("status", "ok")
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (cached?.output) return NextResponse.json({ result: cached.output, cached: true });

  const { data: reservation, error: rErr } = await sb.rpc("ai_reserve", { p_feature: def.feature, p_task: task, p_hash: hash });
  if (rErr) return NextResponse.json({ error: friendlyError(rErr), code: rErr.message }, { status: 403 });
  const r = reservation as { id: number; used: number; quota: number };

  try {
    const out = await getProvider().generate({ system: def.system, prompt, image, schema: def.schema, effort: def.effort, maxTokens: def.maxTokens });
    await sb.rpc("ai_finalize", { p_id: r.id, p_ok: true, p_model: out.model, p_input_tokens: out.inputTokens, p_output_tokens: out.outputTokens,
      p_cost_usd: out.costUsd, p_output: out.data, p_error: null });
    return NextResponse.json({ result: out.data, usage: { used: r.used, quota: r.quota } });
  } catch (e) {
    const code = e instanceof AiError ? e.code : "IA_INDISPONIBLE";
    await sb.rpc("ai_finalize", { p_id: r.id, p_ok: false, p_model: null, p_input_tokens: 0, p_output_tokens: 0, p_cost_usd: 0, p_output: null,
      p_error: String((e as Error).message ?? code) });
    const [status, message] = AI_ERRORS[code] ?? AI_ERRORS.IA_INDISPONIBLE;
    return NextResponse.json({ error: message, code }, { status });
  }
}

type Sb = Awaited<ReturnType<typeof supabaseServer>>;

async function buildPrompt(sb: Sb, task: TaskName, input: Record<string, unknown>): Promise<string> {
  const { data: shop } = await sb.from("shops").select("id, name, description, domain_id, city, region").eq("owner_id", (await sb.auth.getUser()).data.user!.id).maybeSingle();
  if (!shop) throw { message: "AUCUNE_BOUTIQUE" };
  const shopLine = `Boutique : ${shop.name} (${shop.city}, ${shop.region}). ${shop.description ? "Présentation : " + String(shop.description).slice(0, 300) : ""}`;

  switch (task) {
    case "product_content": {
      const { data: cats } = await sb.from("categories").select("slug, name").eq("domain_id", shop.domain_id).eq("active", true).order("position");
      return [shopLine,
        `Catégories possibles (slug : nom) : ${(cats ?? []).map((c) => `${c.slug} : ${c.name}`).join(" ; ") || "aucune"}`,
        input.title ? `Titre actuel : ${input.title}` : "", input.price ? `Prix : ${input.price} FCFA` : "",
        `Notes du vendeur : ${input.notes || "(aucune)"}`, input.image ? "Une photo du produit est jointe." : "Pas de photo."].filter(Boolean).join("\n");
    }
    case "ad_copy": {
      let product = "";
      if (input.productId) {
        const { data: p } = await sb.from("products").select("title, description, price, compare_at_price, availability, shop_id").eq("id", input.productId as string).maybeSingle();
        if (!p || p.shop_id !== shop.id) throw { message: "PRODUIT_INACCESSIBLE" };
        product = `Produit : ${p.title}\nPrix : ${p.price} FCFA${p.compare_at_price ? ` (au lieu de ${p.compare_at_price} FCFA)` : ""}\nDisponibilité : ${p.availability}\nDescription : ${String(p.description).slice(0, 1500)}`;
      }
      return [shopLine, product, `Consignes du vendeur : ${input.brief || "(aucune)"}`, "Lien de commande : la fiche produit sur Shoppy by MSD (le vendeur ajoutera le lien)."].filter(Boolean).join("\n");
    }
    case "translate":
      return `Langue cible : ${{ fr: "français", en: "anglais", wo: "wolof" }[input.target as "fr" | "en" | "wo"]}\nTexte à traduire :\n${input.text}`;
    case "advisor": {
      const [{ data: sales }, { data: comp }] = await Promise.all([sb.rpc("ai_sales_insights", { p_days: 30 }), sb.rpc("ai_competitor_insights")]);
      const s = sales as { days: number; totals: unknown; weekdays: unknown; products: Record<string, unknown>[] } | null;
      const products = (s?.products ?? []).slice(0, 25).map((p) => ({ titre: p.title, prix: p.price, statut: p.status, dispo: p.availability, stock: p.stock,
        qualite: p.quality, cout_achat: p.unit_cost, consultations: p.views, consultations_periode_prec: p.views_prev, favoris: p.favorites,
        commandes: p.orders, unites: p.units, ca_termine: p.revenue }));
      return [shopLine, `Données de la boutique (30 derniers jours, observées) :`,
        JSON.stringify({ totaux: s?.totals, commandes_par_jour_semaine_1_lundi: s?.weekdays, produits: products, marche_shoppy: comp }),
        `Question du vendeur : ${input.question}`].join("\n");
    }
    case "customer_reply":
      return [shopLine, input.context ? `Contexte donné par le vendeur : ${input.context}` : "", `Message du client :\n${input.message}`].filter(Boolean).join("\n");
  }
}
