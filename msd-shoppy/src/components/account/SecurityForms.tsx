"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { toast } from "@/components/ui/toast";

export function ChangePassword() {
  const [pending, setPending] = useState(false);
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget); const p = String(f.get("password")); const c = String(f.get("confirm"));
      if (p.length < 8) return toast("8 caractères minimum.", "error");
      if (p !== c) return toast("Les deux mots de passe ne correspondent pas.", "error");
      setPending(true); const { error } = await supabaseBrowser().auth.updateUser({ password: p }); setPending(false);
      if (error) toast(friendlyError(error), "error"); else { toast("Mot de passe modifié."); e.currentTarget.reset(); }
    }}>
      <div><label className="label" htmlFor="np">Nouveau mot de passe</label><input id="np" name="password" type="password" autoComplete="new-password" className="field" /></div>
      <div><label className="label" htmlFor="npc">Confirmer</label><input id="npc" name="confirm" type="password" autoComplete="new-password" className="field" /></div>
      <button type="submit" disabled={pending} className="btn btn-primary press">Modifier le mot de passe</button>
    </form>
  );
}

export function ChangeEmail({ current }: { current: string }) {
  const [pending, setPending] = useState(false);
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); const email = String(new FormData(e.currentTarget).get("email")).trim();
      setPending(true); const { error } = await supabaseBrowser().auth.updateUser({ email }, { emailRedirectTo: `${location.origin}/auth/callback?suite=/compte/securite` }); setPending(false);
      if (error) toast(friendlyError(error), "error"); else toast("Confirmez le changement avec le lien envoyé à la nouvelle adresse.", "info", 6000);
    }}>
      <div><label className="label" htmlFor="em">Adresse e-mail</label><input id="em" name="email" type="email" defaultValue={current} autoComplete="email" className="field" /></div>
      <button type="submit" disabled={pending} className="btn btn-secondary press">Changer d'adresse</button>
    </form>
  );
}

export function SignOutEverywhere() {
  return <button type="button" className="btn btn-secondary press" onClick={async () => { await supabaseBrowser().auth.signOut({ scope: "global" }); location.href = "/connexion"; }}>Se déconnecter de tous les appareils</button>;
}
