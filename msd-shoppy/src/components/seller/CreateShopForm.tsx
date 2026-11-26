"use client";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import type { Category, Domain, Region } from "@/lib/types";
import { createShopAction } from "@/app/actions/seller";
import { ShopFields } from "./ShopFields";
import { SuccessMark } from "@/components/motion/SuccessMark";

const STEPS = [["identity", "Votre boutique"], ["activity", "Activité et localisation"], ["contact", "Coordonnées publiques"]] as const;

export function CreateShopForm({ domains, categories, regions }: { domains: Domain[]; categories: Category[]; regions: Region[] }) {
  const [state, action, pending] = useActionState(createShopAction, null);
  const [step, setStep] = useState(0);
  const errors = state && !state.ok ? state.fields ?? {} : {};
  useEffect(() => {
    if (state && !state.ok && state.fields) {
      const first = Object.keys(state.fields)[0];
      setStep(["name"].includes(first) ? 0 : ["domain_id", "region", "city", "specialties"].includes(first) ? 1 : 2);
    }
  }, [state]);

  if (state?.ok) {
    return (
      <div className="card p-8 text-center">
        <div className="flex justify-center"><SuccessMark /></div>
        <h2 className="mt-4 text-2xl font-bold">Votre boutique est ouverte</h2>
        <p className="mt-2 text-slate">Votre essai gratuit de 7 jours commence maintenant. Ajoutez vos premiers produits pour être visible.</p>
        {state.message && <p className="mt-3 text-sm text-warning">{state.message}</p>}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/vendeur/produits/nouveau" className="btn btn-primary press">Ajouter mon premier produit</Link>
          <Link href="/vendeur" className="btn btn-secondary press">Aller à mon espace vendeur</Link>
        </div>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="card p-5 md:p-6">
      <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Étapes">
        {STEPS.map(([, label], i) => (
          <li key={label} aria-current={i === step ? "step" : undefined} className="text-xs">
            <span className={`mb-1.5 block h-1.5 rounded-full ${i <= step ? "bg-orange-strong" : "bg-line"}`} />
            <span className={i === step ? "font-semibold" : "text-slate"}>{i + 1}. {label}</span>
          </li>
        ))}
      </ol>
      <ShopFields domains={domains} categories={categories} regions={regions} errors={errors} step={STEPS[step][0]} />
      {state && !state.ok && <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <div className="mt-6 flex gap-2">
        {step > 0 && <button type="button" className="btn btn-secondary press" onClick={() => setStep(step - 1)}>Retour</button>}
        {step < STEPS.length - 1
          ? <button type="button" className="btn btn-primary press ml-auto" onClick={() => setStep(step + 1)}>Continuer</button>
          : <button type="submit" disabled={pending} className="btn btn-primary press ml-auto">{pending ? "Création…" : "Créer ma boutique"}</button>}
      </div>
      <p className="mt-4 text-xs text-slate">En créant votre boutique, vous démarrez un essai gratuit de 7 jours. Aucun paiement n'est demandé maintenant.</p>
    </form>
  );
}
