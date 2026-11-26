import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ARTICLES } from "@/lib/help";
import { PageTitle } from "@/components/ui/bits";

export function generateStaticParams() { return ARTICLES.map((a) => ({ slug: a.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  return a ? { title: a.title, description: a.summary } : { title: "Aide" };
}

export default async function HelpArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "faq") redirect("/aide#faq");
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();
  return (
    <div className="container-page max-w-2xl py-6 md:py-10">
      <PageTitle title={a.title} subtitle={a.summary} back="/aide" />
      {a.sections.map((s) => (
        <section key={s.heading} className="mt-8"><h2 className="text-lg font-semibold">{s.heading}</h2>
          {s.body.map((p) => <p key={p} className="mt-2 leading-relaxed text-ink/90">{p}</p>)}</section>
      ))}
    </div>
  );
}
