import type { Metadata } from "next";
import { AuthForm } from "@/components/account/AuthForm";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  return (
    <div className="container-page max-w-md py-8 md:py-14">
      <h1 className="text-2xl font-bold md:text-3xl">Créer un compte</h1>
      <p className="mb-6 mt-1 text-slate">Un seul compte pour acheter et pour vendre.</p>
      <AuthForm mode="signup" next={suite ?? null} />
    </div>
  );
}
