"use client";
import { useState, useTransition } from "react";
import { setPromotionsAction } from "@/app/actions/account";
import { toast } from "@/components/ui/toast";

export function PromoToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <label className="flex items-start justify-between gap-4">
      <span><b className="block text-sm">Conseils et annonces de Shoppy by MSD</b><span className="text-sm text-slate">Nouveautés de la plateforme et conseils. Les notifications de commande et d'abonnement restent toujours actives.</span></span>
      <input type="checkbox" role="switch" checked={on} disabled={pending} className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-orange-strong)]"
        onChange={(e) => { const v = e.target.checked; setOn(v); start(async () => { const r = await setPromotionsAction(v); if (!r.ok) { setOn(!v); toast(r.error, "error"); } else if (r.message) toast(r.message, "info"); }); }} />
    </label>
  );
}
