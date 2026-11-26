import { Suspense } from "react";
import { requireShop } from "@/lib/auth";
import { getSellerOverview } from "@/lib/seller";
import { progressOf } from "@/lib/assistant";
import { Checklist } from "@/components/seller/Checklist";
import { AssistantView } from "@/components/seller/AssistantView";
import { PageTitle } from "@/components/ui/bits";

export const metadata = { title: "Assistant vendeur" };

export default async function AssistantPage() {
  const { shop } = await requireShop();
  const o = await getSellerOverview(shop);
  const p = progressOf(o.facts, o.manual);
  return (
    <div className="space-y-6">
      <PageTitle title="Assistant vendeur" subtitle="Des guides pas à pas pour bien démarrer et vendre davantage. Vous pouvez ignorer une étape et la reprendre plus tard." />
      <Checklist steps={p.steps} done={p.done} total={p.total} compact />
      <Suspense><AssistantView status={Object.fromEntries(p.steps.map((s) => [s.key, { done: s.done, dismissed: s.dismissed }]))} /></Suspense>
    </div>
  );
}
