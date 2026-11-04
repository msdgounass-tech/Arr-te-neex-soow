import { NextResponse, after } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { startPayment } from "@/lib/payments";
import { paymentAvailability } from "@/lib/payments/config";
import { getSettings } from "@/lib/queries";
import { notifyOrder } from "@/lib/notifications";
import { orderErrorMessage } from "@/lib/order-errors";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const phone = z.string().trim().min(7, "Téléphone invalide").max(30).regex(/^[+\d\s().-]+$/, "Téléphone invalide");

const schema = z.object({
  customer_name: z.string().trim().min(2, "Nom requis").max(120),
  email: z.string().trim().email("E-mail invalide").max(160).optional().or(z.literal("")),
  phone,
  whatsapp: phone.optional().or(z.literal("")),
  address_line: z.string().trim().min(4, "Adresse requise").max(300),
  city: z.string().trim().min(2, "Ville requise").max(80),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  zone_id: z.string().uuid("Zone de livraison requise"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  payment_method: z.enum(["wave", "orange_money", "carte", "livraison"]),
  coupon_code: z.string().trim().max(40).optional().or(z.literal("")),
  save_address: z.boolean().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  items: z
    .array(z.object({ variant_id: z.string().uuid(), quantity: z.number().int().min(1).max(99) }))
    .min(1, "Panier vide")
    .max(50),
});

export async function POST(req: Request) {
  if (!rateLimit(`order:${clientIp(req)}`, 8, 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives. Patientez une minute." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Formulaire invalide." }, { status: 400 });
  }
  const input = parsed.data;
  const { payments: paySettings } = await getSettings();
  if (!paymentAvailability(paySettings)[input.payment_method]) {
    return NextResponse.json({ error: "Ce moyen de paiement n'est pas encore disponible." }, { status: 400 });
  }

  const session = await getServerSupabase();
  if (!session) return NextResponse.json({ error: "Boutique en cours de configuration." }, { status: 503 });
  const user = (await session.auth.getUser()).data.user;

  const { save_address, ...payload } = input;
  // L'identité du client est déterminée par la session côté base (auth.uid()).
  const { data, error } = await session.rpc("place_order_public", { p: payload });
  if (error || !data) {
    console.error("[orders] place_order", error?.message);
    return NextResponse.json({ error: orderErrorMessage(error?.message || "") }, { status: 409 });
  }
  const order = data as { order_id: string; order_number: string; access_token: string; total: number; payment_id: string; delivery_fee_pending: boolean };

  if (user && save_address) {
    const { count } = await session.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if (!count) {
      await session.from("addresses").insert({
        user_id: user.id,
        label: "Principale",
        full_name: input.customer_name,
        phone: input.phone,
        address_line: input.address_line,
        city: input.city,
        region: input.region || null,
        zone_id: input.zone_id,
        is_default: true,
      });
    }
  }

  after(() => notifyOrder(order.order_id, "order_created"));

  let redirectUrl: string | null = null;
  let paymentError: string | null = null;
  // Frais de livraison « à confirmer » : le paiement en ligne est proposé une fois le montant définitif fixé.
  if (order.delivery_fee_pending && input.payment_method !== "livraison") {
    return NextResponse.json({ orderNumber: order.order_number, token: order.access_token, redirectUrl: null, paymentError: null });
  }
  try {
    const r = await startPayment(input.payment_method, {
      paymentId: order.payment_id,
      orderId: order.order_id,
      orderNumber: order.order_number,
      accessToken: order.access_token,
      amount: order.total,
      customerName: input.customer_name,
      email: input.email || null,
    });
    redirectUrl = r?.redirectUrl ?? null;
  } catch (e) {
    console.error("[orders] paiement", e);
    paymentError = "Votre commande est enregistrée, mais le paiement n'a pas pu être initié. Vous pouvez réessayer depuis la page de suivi.";
  }

  return NextResponse.json({ orderNumber: order.order_number, token: order.access_token, redirectUrl, paymentError });
}
