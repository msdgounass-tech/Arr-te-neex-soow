import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES, FAQ } from "@/lib/help";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Centre d'aide", description: "Questions fréquentes, guides pour acheter et vendre, signalement d'un problème." };

export default function HelpPage() {
  const guides = ARTICLES.filter((a) => !["conditions", "confidentialite"].includes(a.slug));
  return (
    <div className="container-page max-w-3xl py-6 md:py-10">
      <h1 className="text-2xl font-bold md:text-3xl">Centre d'aide</h1>
      <p className="mt-1 text-slate">Guides, questions fréquentes et assistance.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {guides.map((a) => (
          <li key={a.slug}><Link href={`/aide/${a.slug}`} className="card press block h-full p-4 hover:border-[#cfd3db]">
            <b>{a.title}</b><p className="mt-1 text-sm text-slate">{a.summary}</p></Link></li>
        ))}
        <li><Link href="/aide/signaler" className="press flex h-full items-center gap-3 rounded-2xl bg-ink p-4 text-white"><Icon name="flag" /><span><b className="block">Signaler un problème</b><span className="text-sm text-white/80">Contacter l'assistance</span></span></Link></li>
      </ul>
      <section id="faq" className="mt-10" aria-labelledby="faq-title">
        <h2 id="faq-title" className="mb-3 text-xl font-bold">Questions fréquentes</h2>
        <div className="card divide-y divide-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 font-medium">{f.q}<Icon name="chevron-down" size={18} className="shrink-0 transition-transform duration-200 group-open:rotate-180" /></summary>
              <p className="pb-4 text-sm text-slate">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <p className="mt-8 text-sm text-slate"><Link href="/aide/conditions" className="link">Conditions d'utilisation</Link> · <Link href="/aide/confidentialite" className="link">Confidentialité</Link></p>
    </div>
  );
}
