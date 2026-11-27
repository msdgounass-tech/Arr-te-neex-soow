"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/env";
import { SITE } from "@/lib/site";
import { toast } from "@/components/ui/toast";

type Mode = "signin" | "signup" | "forgot" | "reset";

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/compte");

export function AuthForm({ mode, next }: { mode: Mode; next: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured) { setError("La base de données n'est pas encore configurée."); return; }
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim().toLowerCase();
    const password = String(f.get("password") ?? "");
    const fullName = String(f.get("full_name") ?? "").trim();
    setError(null);
    if (mode === "signup" && fullName.length < 2) return setError("Indiquez votre nom.");
    if ((mode === "signup" || mode === "reset") && password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (mode === "signup" && !f.get("terms")) return setError("Acceptez les conditions d'utilisation pour créer votre compte.");
    setPending(true);
    const sb = supabaseBrowser();
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast("Vous êtes connecté.");
        router.replace(safeNext(next)); router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password, options: {
          data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback?suite=${encodeURIComponent(safeNext(next))}` } });
        if (error) throw error;
        if (data.session) { toast("Compte créé. Bienvenue sur Shoppy by MSD."); router.replace(safeNext(next)); router.refresh(); }
        else setSent(true);
      } else if (mode === "forgot") {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?suite=/nouveau-mot-de-passe` });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw error;
        toast("Mot de passe modifié.");
        router.replace("/compte");
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-lg font-semibold">Vérifiez votre boîte e-mail</h2>
        <p className="mt-2 text-sm text-slate">
          {mode === "signup" ? "Nous vous avons envoyé un lien pour confirmer votre adresse. Ouvrez-le pour activer votre compte."
            : "Si un compte existe avec cette adresse, vous recevrez un lien pour choisir un nouveau mot de passe."}
        </p>
      </div>
    );
  }

  const nextQ = next ? `?suite=${encodeURIComponent(next)}` : "";
  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-4 p-5 md:p-6">
      {mode === "signup" && (
        <div><label className="label" htmlFor="full_name">Nom complet</label>
          <input id="full_name" name="full_name" autoComplete="name" required className="field" /></div>
      )}
      {mode !== "reset" && (
        <div><label className="label" htmlFor="email">Adresse e-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required className="field" /></div>
      )}
      {mode !== "forgot" && (
        <div>
          <div className="flex items-baseline justify-between">
            <label className="label" htmlFor="password">{mode === "reset" ? "Nouveau mot de passe" : "Mot de passe"}</label>
            {mode === "signin" && <Link href="/mot-de-passe-oublie" className="link text-sm">Mot de passe oublié ?</Link>}
          </div>
          <input id="password" name="password" type="password" required minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"} className="field" />
          {mode !== "signin" && <p className="hint">8 caractères minimum.</p>}
        </div>
      )}
      {mode === "signup" && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" className="mt-1 h-4 w-4 accent-[var(--color-orange-strong)]" />
          <span>J'accepte les <Link href="/aide/conditions" className="link">conditions d'utilisation</Link> et la <Link href="/aide/confidentialite" className="link">politique de confidentialité</Link> de {SITE.name}.</span>
        </label>
      )}
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary press w-full">
        {pending ? "Patientez…" : { signin: "Se connecter", signup: "Créer mon compte", forgot: "Recevoir le lien", reset: "Enregistrer le mot de passe" }[mode]}
      </button>
      {mode === "signin" && <p className="text-center text-sm text-slate">Pas encore de compte ? <Link href={`/inscription${nextQ}`} className="link">Créer un compte</Link></p>}
      {mode === "signup" && <p className="text-center text-sm text-slate">Déjà inscrit ? <Link href={`/connexion${nextQ}`} className="link">Se connecter</Link></p>}
    </form>
  );
}
