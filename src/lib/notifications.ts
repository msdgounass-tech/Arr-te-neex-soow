import "server-only";
import { getServiceSupabase, hasServiceKey } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/env";
import { formatPrice, ORDER_STATUS_LABEL, toWhatsAppNumber } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

export type NotificationEvent = "order_created" | "payment_received" | "status_changed" | "shipped" | "delivered" | "delivery_fee_set";

const message = (event: NotificationEvent, o: Order) => {
  const link = `${SITE_URL}/commande/confirmation/${o.order_number}?t=${o.access_token}`;
  switch (event) {
    case "order_created":
      return o.delivery_fee_pending
        ? `Votre commande ${o.order_number} (${formatPrice(o.total)} hors livraison) a bien été enregistrée. Nous vous confirmons les frais de livraison très vite. Suivi : ${link}`
        : `Votre commande ${o.order_number} (${formatPrice(o.total)}) a bien été enregistrée. Suivi : ${link}`;
    case "delivery_fee_set":
      return `Frais de livraison de votre commande ${o.order_number} : ${formatPrice(o.delivery_fee)}. Total à régler : ${formatPrice(o.total)}. Détails et paiement : ${link}`;
    case "payment_received":
      return `Nous avons reçu votre paiement de ${formatPrice(o.total)} pour la commande ${o.order_number}. Merci !`;
    case "shipped":
      return `Votre commande ${o.order_number} a été expédiée. Suivi : ${link}`;
    case "delivered":
      return `Votre commande ${o.order_number} a été livrée. Merci pour votre confiance — Wouro Maama.`;
    default:
      return `Le statut de votre commande ${o.order_number} est désormais : ${ORDER_STATUS_LABEL[o.status as OrderStatus]}. Suivi : ${link}`;
  }
};

async function log(orderId: string, channel: string, event: string, recipient: string | null, status: string, error?: string) {
  try {
    await getServiceSupabase().from("notifications").insert({ order_id: orderId, channel, event, recipient, status, error: error?.slice(0, 500) });
  } catch (e) {
    console.error("[notifications] journal", e);
  }
}

/**
 * WhatsApp Business Cloud API. Hors fenêtre de 24 h, Meta exige un modèle
 * approuvé : renseignez WHATSAPP_TEMPLATE_NAME (3 variables : nom, n° de commande, message).
 */
async function sendWhatsApp(to: string, name: string, orderNumber: string, text: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { skipped: true as const };
  const template = process.env.WHATSAPP_TEMPLATE_NAME;
  const payload = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "fr" },
          components: [{ type: "body", parameters: [name, orderNumber, text].map((t) => ({ type: "text", text: t.slice(0, 900) })) }],
        },
      }
    : { messaging_product: "whatsapp", to, type: "text", text: { body: `GOUNASS LUXURY — ${text}` } };
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { skipped: false as const };
}

async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { skipped: true as const };
  const html = `<div style="background:#080808;color:#F5F1E8;padding:40px;font-family:Georgia,serif">
    <p style="letter-spacing:6px;color:#C6A15B;font-size:12px">GOUNASS LUXURY</p>
    <h1 style="font-weight:400;font-size:26px">${subject}</h1>
    <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#d8d2c5">${text.replace(/(https?:\/\/\S+)/g, '<a style="color:#C6A15B" href="$1">$1</a>')}</p>
    <p style="font-style:italic;color:#C6A15B;margin-top:32px">Wouro Maama</p></div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!res.ok) throw new Error(`E-mail ${res.status}`);
  return { skipped: false as const };
}

const SUBJECT: Record<NotificationEvent, string> = {
  order_created: "Confirmation de commande",
  payment_received: "Paiement reçu",
  status_changed: "Mise à jour de votre commande",
  shipped: "Votre commande est en route",
  delivered: "Commande livrée",
  delivery_fee_set: "Frais de livraison confirmés",
};

/** Envoie les notifications d'un événement de commande (sans jamais bloquer le flux principal). */
export async function notifyOrder(orderId: string, event: NotificationEvent) {
  // Les envois automatiques (WhatsApp Cloud API / e-mail) nécessitent la clé service ; sans elle on s'abstient.
  if (!hasServiceKey()) return;
  try {
    const sb = getServiceSupabase();
    const { data: o } = await sb.from("orders").select("*").eq("id", orderId).single();
    if (!o) return;
    const order = o as Order;
    const text = message(event, order);
    const wa = toWhatsAppNumber(order.whatsapp || order.phone);

    const tasks: Promise<void>[] = [];
    tasks.push(
      sendWhatsApp(wa, order.customer_name, order.order_number, text)
        .then((r) => log(orderId, "whatsapp", event, wa, r.skipped ? "skipped" : "sent"))
        .catch((e) => log(orderId, "whatsapp", event, wa, "failed", String(e))),
    );
    if (order.email) {
      tasks.push(
        sendEmail(order.email, `${SUBJECT[event]} — ${order.order_number}`, text)
          .then((r) => log(orderId, "email", event, order.email, r.skipped ? "skipped" : "sent"))
          .catch((e) => log(orderId, "email", event, order.email, "failed", String(e))),
      );
    }
    const admin = process.env.WHATSAPP_ADMIN_NUMBER;
    if (admin && (event === "order_created" || event === "payment_received")) {
      const adminText =
        event === "order_created"
          ? `Nouvelle commande ${order.order_number} — ${order.customer_name} — ${formatPrice(order.total)} — ${order.city}. ${SITE_URL}/admin/commandes/${order.id}`
          : `Paiement reçu pour ${order.order_number} (${formatPrice(order.total)}).`;
      tasks.push(
        sendWhatsApp(admin, "Équipe", order.order_number, adminText)
          .then((r) => log(orderId, "whatsapp", `${event}_admin`, admin, r.skipped ? "skipped" : "sent"))
          .catch((e) => log(orderId, "whatsapp", `${event}_admin`, admin, "failed", String(e))),
      );
    }
    await Promise.all(tasks);
  } catch (e) {
    console.error("[notifications]", e);
  }
}

export const eventForStatus = (s: OrderStatus): NotificationEvent =>
  s === "expediee" ? "shipped" : s === "livree" ? "delivered" : "status_changed";
