import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByToken } from "@/lib/orders";
import { getSettings } from "@/lib/queries";
import { formatPrice, PAYMENT_METHOD_LABEL, toWhatsAppNumber } from "@/lib/format";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PrintButton, RetryPayment, WhatsAppShare } from "@/components/order/OrderActions";
import { Emblem } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "Votre commande", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; retour?: string }> };

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { number } = await params;
  const { t, retour } = await searchParams;
  if (!t) notFound();
  const res = await getOrderByToken(decodeURIComponent(number), t);
  if (!res) notFound();
  const { order, qrCode, payLink } = res;
  const { store } = await getSettings();

  const paid = order.payment_status === "reussi";
  const online = order.payment_method !== "livraison";
  const feePending = Boolean(order.delivery_fee_pending);
  const awaitingPayment = online && !paid && order.status !== "annulee" && !feePending;
  const cancelledReturn = retour?.includes("annule") || retour?.includes("erreur");

  const lines = (order.order_items || []).map((i) => `• ${i.product_name}${i.size ? ` (${i.size})` : ""}${i.color ? ` ${i.color}` : ""} x${i.quantity} — ${formatPrice(i.line_total)}`);
  const waText = [`Bonjour GOUNASS LUXURY, voici ma commande ${order.order_number} :`, ...lines, `Total : ${formatPrice(order.total)}`, `Paiement : ${PAYMENT_METHOD_LABEL[order.payment_method]}`, `Livraison : ${order.address_line}, ${order.city}`, `Nom : ${order.customer_name} — ${order.phone}`].join("\n");

  let title = "Merci pour votre commande";
  let text = "Votre commande est enregistrée. Notre équipe vous contactera pour confirmer la livraison.";
  if (feePending) {
    title = "Commande enregistrée";
    text = "Les frais de livraison pour votre adresse vont vous être confirmés par notre équipe sur WhatsApp. " + (online ? "Le paiement vous sera ensuite proposé sur cette page." : "Vous réglerez à la réception.");
  } else if (paid) {
    title = "Paiement confirmé";
    text = "Nous avons reçu votre paiement. Votre commande est en cours de traitement.";
  } else if (awaitingPayment && payLink) {
    title = "Finalisez votre paiement";
    text = "Réglez le montant exact via le lien ci-dessous en indiquant votre numéro de commande. Votre commande sera confirmée dès que notre équipe aura vérifié la réception du paiement.";
  } else if (awaitingPayment && !cancelledReturn && retour) {
    title = "Paiement en cours de vérification";
    text = "Nous attendons la confirmation du prestataire. Cette page se mettra à jour dès sa réception — actualisez-la dans quelques instants.";
  } else if (awaitingPayment) {
    title = "Paiement en attente";
    text = cancelledReturn
      ? "Le paiement n'a pas abouti. Votre commande est conservée : vous pouvez relancer le paiement ci-dessous."
      : "Votre commande est enregistrée. Finalisez le paiement pour qu'elle soit confirmée.";
  }

  return (
    <div className="container-luxe max-w-5xl pt-16 md:pt-24">
      <header className="mb-14 text-center">
        <Emblem className="mx-auto h-16 w-16" />
        <p className="eyebrow mt-8">Commande {order.order_number}</p>
        <h1 className="display mt-5 text-4xl md:text-6xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-xl text-ivory/70">{text}</p>
      </header>

      {feePending && (
        <div className="mb-12 border border-gold/30 bg-gold/[0.04] p-6 text-center text-sm text-ivory/80">
          Frais de livraison <strong className="text-gold">à confirmer</strong> — total actuel hors livraison : {formatPrice(order.total)}.
        </div>
      )}

      {awaitingPayment && (
        <div className="mb-12 flex flex-col items-center gap-6 border border-gold/30 bg-gold/[0.04] p-8 text-center">
          <p className="text-sm text-ivory/80">Montant à régler : <strong className="text-gold">{formatPrice(order.total)}</strong> via {PAYMENT_METHOD_LABEL[order.payment_method]}</p>
          {order.payment_method === "orange_money" && qrCode && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR code Orange Money" className="h-48 w-48 bg-white p-2" />
          )}
          {payLink ? (
            <>
              <a href={payLink} target="_blank" rel="noopener noreferrer" className="btn btn-gold">Payer {formatPrice(order.total)} avec {PAYMENT_METHOD_LABEL[order.payment_method]}</a>
              <p className="max-w-md text-xs leading-relaxed text-mist">
                Vérifiez que le montant affiché est bien <strong className="text-ivory">{formatPrice(order.total)}</strong> et indiquez la référence <strong className="text-ivory">{order.order_number}</strong> si l&apos;application vous le propose. Le statut « Payé » s&apos;affichera ici après vérification.
              </p>
            </>
          ) : (
            <RetryPayment orderNumber={order.order_number} token={t} />
          )}
        </div>
      )}

      <OrderSummary order={order} />

      <div className="mt-12 flex flex-wrap justify-center gap-3 print:hidden">
        {store.whatsapp && <WhatsAppShare number={toWhatsAppNumber(store.whatsapp)} text={waText} />}
        <PrintButton />
        <Link href="/shop" className="btn btn-ghost-gold">Continuer mes achats</Link>
      </div>
      <p className="mt-8 text-center text-xs text-mist">Conservez ce lien : il vous permet de suivre votre commande à tout moment.</p>
    </div>
  );
}
