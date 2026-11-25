import type { Metadata } from "next";
import Link from "next/link";
import { SuccessMark } from "@/components/motion/SuccessMark";

export const metadata: Metadata = { title: "Commande envoyée", robots: { index: false } };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const { n } = await searchParams;
  const numbers = (n ?? "").split(",").filter((x) => /^MS-\d{6}-\d+$/.test(x));
  return (
    <div className="container-page max-w-lg py-12 text-center">
      <div className="flex justify-center"><SuccessMark /></div>
      <h1 className="mt-5 text-2xl font-bold">{numbers.length > 1 ? "Commandes envoyées" : "Commande envoyée"}</h1>
      <p className="mt-2 text-slate">Le vendeur a été prévenu. Vous serez notifié dès qu'il confirme{numbers.length > 1 ? " chaque commande" : ""}.</p>
      {numbers.length > 0 && <ul className="mt-5 space-y-1">{numbers.map((x) => <li key={x} className="font-display text-lg font-bold">{x}</li>)}</ul>}
      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href="/compte/commandes" className="btn btn-primary press">Suivre mes commandes</Link>
        <Link href="/explorer" className="btn btn-secondary press">Continuer mes achats</Link>
      </div>
    </div>
  );
}
