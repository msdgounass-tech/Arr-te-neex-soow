import { requireRole } from "@/lib/auth";
import { PageTitle, Card } from "@/components/admin/ui";
import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { EMPTY_HOME, EMPTY_STORE } from "@/lib/site";
import { paymentAvailability } from "@/lib/payments/config";
import { PAYMENT_METHOD_LABEL } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

export default async function AdminSettings() {
  const { sb } = await requireRole("admin");
  const { data } = await sb.from("settings").select("key, value").in("key", ["store", "home"]);
  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  const pay = paymentAvailability();
  const integrations = [
    ["WhatsApp Cloud API", Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)],
    ["E-mails (Resend)", Boolean(process.env.RESEND_API_KEY)],
  ] as const;
  return (
    <>
      <PageTitle title="Paramètres" />
      <SettingsEditor store={{ ...EMPTY_STORE, ...(map.store || {}) }} home={{ ...EMPTY_HOME, ...(map.home || {}) }} />
      <Card className="mt-4">
        <p className="label mb-4">Intégrations (configurées par variables d&apos;environnement sur le serveur)</p>
        <ul className="grid gap-2 text-sm md:grid-cols-3">
          {(Object.keys(pay) as PaymentMethod[]).map((m) => (
            <li key={m} className="flex justify-between border border-white/[0.06] px-4 py-3">{PAYMENT_METHOD_LABEL[m]}<span className={pay[m] ? "text-success" : "text-mist"}>{pay[m] ? "Actif" : "Non configuré"}</span></li>
          ))}
          {integrations.map(([l, ok]) => (
            <li key={l} className="flex justify-between border border-white/[0.06] px-4 py-3">{l}<span className={ok ? "text-success" : "text-mist"}>{ok ? "Actif" : "Non configuré"}</span></li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-mist">Les clés secrètes ne sont jamais stockées en base ni exposées au navigateur. Voir README › Configuration.</p>
      </Card>
    </>
  );
}
