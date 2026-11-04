"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Mode = "login" | "register" | "forgot" | "reset";

const safe = (p: string | null) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/compte");

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = safe(params.get("redirect"));
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getBrowserSupabase();
    if (!sb) return setError("Service d'authentification non configuré.");
    setLoading(true);
    setError("");
    setInfo("");
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) {
          throw new Error(
            error.message.includes("Invalid")
              ? "E-mail ou mot de passe incorrect."
              : error.message.toLowerCase().includes("confirm")
                ? "Votre compte est en cours d'activation. Réessayez dans un instant."
                : error.message,
          );
        }
        router.replace(redirectTo);
        router.refresh();
      } else if (mode === "register") {
        if (form.password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
        const { data, error } = await sb.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.full_name, phone: form.phone }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/compte` },
        });
        if (error) throw new Error(error.message.includes("registered") ? "Un compte existe déjà avec cet e-mail. Connectez-vous." : error.message);
        // Connexion immédiate : aucun e-mail de vérification n'est requis.
        if (!data.session) {
          const { error: loginError } = await sb.auth.signInWithPassword({ email: form.email, password: form.password });
          if (loginError) throw new Error("Compte créé. Connectez-vous avec votre e-mail et votre mot de passe.");
        }
        router.replace(redirectTo);
        router.refresh();
      } else if (mode === "forgot") {
        const { error } = await sb.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/auth/callback?next=/compte/nouveau-mot-de-passe` });
        if (error) throw new Error(error.message);
        setInfo("Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé.");
      } else {
        if (form.password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
        const { error } = await sb.auth.updateUser({ password: form.password });
        if (error) throw new Error(error.message);
        setInfo("Votre mot de passe a été mis à jour.");
        setTimeout(() => router.replace("/compte"), 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, [string, string]> = {
    login: ["Bon retour", "Connexion"],
    register: ["Rejoindre la maison", "Créer un compte"],
    forgot: ["Accès", "Mot de passe oublié"],
    reset: ["Sécurité", "Nouveau mot de passe"],
  };

  return (
    <div className="container-luxe max-w-md pt-20 md:pt-28">
      <p className="eyebrow text-center">{titles[mode][0]}</p>
      <h1 className="display mt-5 text-center text-5xl">{titles[mode][1]}</h1>
      <form onSubmit={submit} className="mt-12 space-y-7">
        {mode === "register" && (
          <>
            <label className="block"><span className="label">Nom complet</span><input required value={form.full_name} onChange={set("full_name")} autoComplete="name" className="field" /></label>
            <label className="block"><span className="label">Téléphone</span><input type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" className="field" /></label>
          </>
        )}
        {mode !== "reset" && (
          <label className="block"><span className="label">E-mail</span><input required type="email" value={form.email} onChange={set("email")} autoComplete="email" className="field" /></label>
        )}
        {mode !== "forgot" && (
          <label className="block">
            <span className="label">{mode === "reset" ? "Nouveau mot de passe" : "Mot de passe"}</span>
            <input required type="password" minLength={mode === "login" ? 1 : 8} value={form.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} className="field" />
          </label>
        )}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {info && <p role="status" className="text-sm text-gold">{info}</p>}
        <button disabled={loading} className="btn btn-gold w-full">
          {loading ? "Patientez…" : mode === "login" ? "Se connecter" : mode === "register" ? "Créer mon compte" : mode === "forgot" ? "Envoyer le lien" : "Enregistrer"}
        </button>
      </form>
      <div className="mt-10 space-y-3 text-center text-sm text-mist">
        {mode === "login" && (
          <>
            <p><Link href="/compte/mot-de-passe" className="hover:text-gold">Mot de passe oublié ?</Link></p>
            <p>Nouveau client ? <Link href={`/compte/inscription?redirect=${encodeURIComponent(redirectTo)}`} className="text-gold">Créer un compte</Link></p>
          </>
        )}
        {mode === "register" && <p>Déjà client ? <Link href="/compte/connexion" className="text-gold">Se connecter</Link></p>}
        {mode === "forgot" && <p><Link href="/compte/connexion" className="text-gold">Retour à la connexion</Link></p>}
      </div>
    </div>
  );
}
