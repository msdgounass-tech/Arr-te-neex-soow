import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { SalesInsights } from "@/lib/insights";

export const runtime = "nodejs";

const csv = (rows: (string | number | null)[][]) => "﻿" + rows.map((r) => r.map((v) => {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}).join(";")).join("\n");

/** Export CSV (formule Business) : produits avec statistiques, ou commandes. Données de la boutique connectée uniquement (RLS). */
export async function GET(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  const { data: lvl } = await sb.rpc("feature_level", { p_feature: "export" });
  if (!lvl || lvl === "none") return NextResponse.json({ error: "L'exportation est incluse dans la formule Business." }, { status: 403 });
  const url = new URL(req.url);
  const type = url.searchParams.get("type") === "commandes" ? "commandes" : "produits";
  const days = Math.min(180, Math.max(7, Number(url.searchParams.get("jours")) || 30));
  let body: string;
  if (type === "produits") {
    const { data } = await sb.rpc("ai_sales_insights", { p_days: days });
    const s = data as SalesInsights;
    body = csv([["Produit", "Prix (F)", "Statut", "Stock", "Coût d'achat (F)", "Consultations", "Consultations période préc.", "Favoris", "Commandes", "Unités", "CA terminé (F)"],
      ...s.products.map((p) => [p.title, p.price, p.status, p.stock, p.unit_cost, p.views, p.views_prev, p.favorites, p.orders, p.units, p.revenue])]);
  } else {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data: shop } = await sb.from("shops").select("id").eq("owner_id", user.id).single();
    const { data } = await sb.from("orders").select("number, created_at, status, subtotal, delivery_fee, total, region, city, delivery_method, payment_method")
      .eq("shop_id", shop!.id).gte("created_at", since).order("created_at", { ascending: false }).limit(5000);
    body = csv([["N°", "Date", "Statut", "Sous-total (F)", "Livraison (F)", "Total (F)", "Région", "Ville", "Mode", "Paiement"],
      ...(data ?? []).map((o) => [o.number, o.created_at.slice(0, 10), o.status, o.subtotal, o.delivery_fee, o.total, o.region, o.city, o.delivery_method, o.payment_method])]);
  }
  return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="shoppy-${type}-${days}j.csv"`, "Cache-Control": "no-store" } });
}
