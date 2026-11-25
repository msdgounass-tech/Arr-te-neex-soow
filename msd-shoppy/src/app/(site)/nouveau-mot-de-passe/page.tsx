import type { Metadata } from "next";
import { AuthForm } from "@/components/account/AuthForm";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  return (
    <div className="container-page max-w-md py-8 md:py-14">
      <h1 className="text-2xl font-bold md:text-3xl">Nouveau mot de passe</h1>
      <p className="mb-6 mt-1 text-slate">Choisissez un mot de passe d'au moins 8 caractères.</p>
      <AuthForm mode="reset" next={suite ?? null} />
    </div>
  );
}
