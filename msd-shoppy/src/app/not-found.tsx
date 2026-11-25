import Link from "next/link";
export default function RootNotFound() {
  return <main className="grid min-h-dvh place-items-center p-6 text-center"><div><h1 className="text-2xl font-bold">Page introuvable</h1><Link href="/" className="link mt-4 inline-block">Revenir à l'accueil</Link></div></main>;
}
