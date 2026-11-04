"use client";
import Image from "next/image";
import { useState } from "react";
import { uploadImage } from "@/lib/upload";

export function ImageField({ label, value, onChange, bucket, folder }: { label: string; value: string; onChange: (url: string) => void; bucket: "products" | "site"; folder: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div>
      <span className="label">{label}</span>
      <div className="mt-2 flex items-center gap-4">
        <span className="relative h-20 w-28 shrink-0 overflow-hidden border border-white/10 bg-ink-3">{value && <Image src={value} alt="" fill sizes="112px" className="object-cover" />}</span>
        <div className="space-y-2">
          <label className="btn btn-ghost-gold min-h-9 cursor-pointer px-4">
            {busy ? "Téléversement…" : value ? "Remplacer" : "Téléverser"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                setErr("");
                try {
                  onChange((await uploadImage(file, bucket, folder)).url);
                } catch (x) {
                  setErr(x instanceof Error ? x.message : "Erreur");
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {value && <button type="button" onClick={() => onChange("")} className="block text-[0.6rem] uppercase tracking-[0.16em] text-mist hover:text-danger">Retirer</button>}
          {err && <p className="text-xs text-danger">{err}</p>}
        </div>
      </div>
    </div>
  );
}
