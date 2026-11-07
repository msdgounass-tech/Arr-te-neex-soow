"use client";
import { useActionState } from "react";
import { updateProfile, type FormState } from "@/app/(store)/compte/actions";

export function ProfileForm({ profile, email }: { profile: { full_name: string | null; phone: string | null; whatsapp: string | null }; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="grid max-w-2xl gap-x-8 gap-y-7 md:grid-cols-2">
      <label className="md:col-span-2"><span className="label">E-mail</span><input value={email} disabled className="field opacity-60" /></label>
      <label className="md:col-span-2"><span className="label">Nom complet</span><input name="full_name" required defaultValue={profile.full_name || ""} className="field" /></label>
      <label><span className="label">Téléphone</span><input name="phone" type="tel" defaultValue={profile.phone || ""} className="field" /></label>
      <label><span className="label">WhatsApp</span><input name="whatsapp" type="tel" defaultValue={profile.whatsapp || ""} className="field" /></label>
      <div className="md:col-span-2">
        {state.error && <p className="mb-4 text-sm text-danger">{state.error}</p>}
        {state.message && <p className="mb-4 text-sm text-accent">{state.message}</p>}
        <button disabled={pending} className="btn btn-primary">{pending ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}
