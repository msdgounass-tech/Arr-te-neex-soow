"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/toast";
import { Sheet } from "@/components/ui/Sheet";
import { track } from "@/lib/track";
import { SITE } from "@/lib/site";

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy"); ta.remove(); return ok;
  }
}

/** Partage (WhatsApp, Facebook, lien direct, partage natif du téléphone). */
export function ShareButton({ url, title, shopId, productId, compact = false }: { url: string; title: string; shopId: string; productId?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const full = url.startsWith("http") ? url : `${SITE.url}${url}`;
  async function onShare() {
    track(shopId, "share_click", productId);
    if (navigator.share) {
      try { await navigator.share({ title, url: full }); return; } catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    setOpen(true);
  }
  return (
    <>
      <button type="button" onClick={onShare} className={compact ? "press grid h-11 w-11 place-items-center rounded-full border border-line" : "btn btn-secondary press"} aria-label="Partager">
        <Icon name="share" size={18} />{compact ? null : "Partager"}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Partager">
        <div className="grid gap-2">
          <a className="btn btn-whatsapp press" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${title} ${full}`)}`}>
            <Icon name="whatsapp" size={18} /> Partager sur WhatsApp</a>
          <a className="btn btn-secondary press" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(full)}`}>
            <Icon name="facebook" size={18} /> Partager sur Facebook</a>
          <button type="button" className="btn btn-secondary press" onClick={async () => { if (await copy(full)) { toast("Lien copié"); setOpen(false); } }}>
            <Icon name="copy" size={18} /> Copier le lien</button>
        </div>
      </Sheet>
    </>
  );
}

/** « Promouvoir sur Facebook » : prépare le lien, le copie et ouvre le Gestionnaire de publicités. Aucune campagne n'est créée automatiquement. */
export function PromoteButton({ url, label = "Promouvoir sur Facebook" }: { url: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const full = url.startsWith("http") ? url : `${SITE.url}${url}`;
  return (
    <>
      <button type="button" className="btn btn-secondary press" onClick={() => setOpen(true)}><Icon name="facebook" size={18} />{label}</button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Promouvoir sur Facebook">
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-soft text-xs font-bold text-orange-text">1</span>
            <div className="min-w-0 flex-1"><p className="font-medium">Copiez le lien de votre page</p>
              <div className="mt-2 flex gap-2"><input readOnly value={full} className="field text-sm" aria-label="Lien à promouvoir" onFocus={(e) => e.currentTarget.select()} />
                <button type="button" className="btn btn-secondary btn-sm press shrink-0" onClick={async () => { if (await copy(full)) toast("Lien copié"); }}><Icon name="copy" size={16} />Copier</button></div></div></li>
          <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-soft text-xs font-bold text-orange-text">2</span>
            <p>Ouvrez le Gestionnaire de publicités Meta et créez une campagne « Trafic » ou « Messages ».</p></li>
          <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-soft text-xs font-bold text-orange-text">3</span>
            <p>Collez le lien comme destination. Vous choisissez vous-même le budget, la durée et le public.</p></li>
        </ol>
        <p className="mt-4 rounded-xl bg-mist p-3 text-xs text-slate">Shoppy by MSD ne crée pas de publicité à votre place et ne débite rien : la campagne et son paiement se gèrent dans votre compte Meta.</p>
        <a href={SITE.adsManagerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary press mt-4 w-full"
          onClick={() => { void copy(full); }}><Icon name="external" size={18} /> Copier le lien et ouvrir Ads Manager</a>
      </Sheet>
    </>
  );
}
