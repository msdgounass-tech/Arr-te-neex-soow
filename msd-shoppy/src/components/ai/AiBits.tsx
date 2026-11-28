"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/toast";

export function CopyBlock({ label, text, onTranslate }: { label: string; text: string; onTranslate?: (target: "en" | "wo" | "fr") => void }) {
  const [value, setValue] = useState(text);
  return (
    <div className="rounded-2xl border border-line p-3">
      <div className="mb-2 flex items-center justify-between gap-2"><b className="text-sm">{label}</b>
        <div className="flex gap-1">
          {onTranslate && <><button type="button" className="chip press" onClick={() => onTranslate("en")}>EN</button><button type="button" className="chip press" onClick={() => onTranslate("wo")}>Wolof</button></>}
          <button type="button" className="chip press" onClick={() => { void navigator.clipboard.writeText(value).then(() => toast("Copié")); }}><Icon name="copy" size={14} /> Copier</button>
        </div></div>
      <textarea className="field min-h-24 text-sm" value={value} onChange={(e) => setValue(e.target.value)} aria-label={`${label} (modifiable)`} />
    </div>
  );
}

export function AiError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{message}</p>;
}

export function UsageLine({ usage, cached }: { usage: { used: number; quota: number } | null; cached: boolean }) {
  if (cached) return <p className="text-xs text-slate">Résultat déjà généré récemment : resservi sans consommer votre quota.</p>;
  if (!usage) return null;
  const left = usage.quota - usage.used;
  return <p className={`text-xs ${left <= Math.ceil(usage.quota * 0.2) ? "font-semibold text-warning" : "text-slate"}`}>{usage.used} / {usage.quota} générations utilisées ce mois-ci{left <= Math.ceil(usage.quota * 0.2) ? ` · plus que ${left}` : ""}.</p>;
}

export function Thinking({ label = "Shoppy AI prépare votre proposition…" }: { label?: string }) {
  return <p role="status" className="flex items-center gap-2 text-sm text-slate"><span className="h-2 w-2 animate-pulse rounded-full bg-orange" />{label}</p>;
}
