"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { toast } from "@/components/ui/toast";
import { Icon } from "@/components/ui/Icon";

export interface DemoAccount { email: string; name: string; role: string; detail: string; next: string; icon: string }

/** Connexion en un clic à un compte de démonstration (mot de passe de démo public, comptes sans données réelles). */
export function DemoLogin({ accounts, password }: { accounts: DemoAccount[]; password: string }) {
  const [pending, setPending] = useState<string | null>(null);
  async function go(a: DemoAccount) {
    setPending(a.email);
    const sb = supabaseBrowser();
    await sb.auth.signOut();
    const { error } = await sb.auth.signInWithPassword({ email: a.email, password });
    setPending(null);
    if (error) { toast(friendlyError(error), "error"); return; }
    toast(`Connecté en tant que ${a.name}`);
    window.location.assign(a.next); return;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {accounts.map((a) => (
        <li key={a.email} className="card flex flex-col p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-soft text-orange-text"><Icon name={a.icon} size={20} /></span>
            <div className="min-w-0"><p className="font-semibold">{a.name}</p><p className="text-xs text-slate">{a.role}</p></div>
          </div>
          <p className="mt-2 flex-1 text-sm text-slate">{a.detail}</p>
          <button type="button" disabled={pending !== null} onClick={() => go(a)} className="btn btn-primary press mt-3">
            {pending === a.email ? "Connexion…" : "Se connecter"}
          </button>
        </li>
      ))}
    </ul>
  );
}
