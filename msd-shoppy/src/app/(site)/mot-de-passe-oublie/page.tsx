import type { Metadata } from "next";
import { AuthForm } from "@/components/account/AuthForm";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  return (
    <div className="container-page max-w-md py-8 md:py-14">
      <h1 className="text-2xl font-bold md:text-3xl">Mot de passe oublié</h1>
      <p className="mb-6 mt-1 text-slate">Indiquez l'adresse e-mail de votre compte.</p>
      <AuthForm mode="forgot" next={suite ?? null} />
    </div>
  );
}
