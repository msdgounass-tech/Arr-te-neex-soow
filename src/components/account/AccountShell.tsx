import Link from "next/link";
import { signOut } from "@/app/(store)/compte/actions";

const LINKS = [
  ["/compte", "Profil"],
  ["/compte/commandes", "Commandes"],
  ["/compte/adresses", "Adresses"],
  ["/favoris", "Favoris"],
];

export function AccountShell({ title, active, children, isStaff }: { title: string; active: string; children: React.ReactNode; isStaff?: boolean }) {
  return (
    <div className="container-luxe pt-14 md:pt-20">
      <header className="mb-12">
        <p className="eyebrow">Mon espace</p>
        <h1 className="display mt-4 text-5xl md:text-6xl">{title}</h1>
      </header>
      <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Espace client" className="no-scrollbar flex gap-6 overflow-x-auto border-b border-white/[0.1] pb-4 lg:flex-col lg:gap-4 lg:border-b-0 lg:border-r lg:pb-0">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={`shrink-0 text-[0.74rem] uppercase tracking-[0.26em] ${active === href ? "text-gold" : "text-ivory/90 hover:text-ivory"}`}>
              {label}
            </Link>
          ))}
          {isStaff && <Link href="/admin" className="shrink-0 text-[0.74rem] uppercase tracking-[0.26em] text-gold/80 hover:text-gold">Administration</Link>}
          <form action={signOut}>
            <button className="shrink-0 text-[0.74rem] uppercase tracking-[0.26em] text-mist hover:text-danger">Déconnexion</button>
          </form>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
