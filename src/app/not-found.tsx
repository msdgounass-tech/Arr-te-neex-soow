import Link from "next/link";
import { BrandLogo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <BrandLogo size={128} className="h-32 w-32" />
      <p className="eyebrow mt-10">Erreur 404</p>
      <h1 className="display mt-5 text-5xl md:text-7xl">Page introuvable</h1>
      <p className="mt-5 max-w-md text-ivory/90">La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
      <Link href="/" className="btn btn-gold mt-10">Retour à l&apos;accueil</Link>
    </div>
  );
}
