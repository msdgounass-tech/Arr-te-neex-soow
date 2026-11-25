"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/explorer", label: "Explorer" },
  { href: "/favoris", label: "Favoris" },
  { href: "/compte", label: "Compte" },
];

export function NavLinks() {
  const path = usePathname();
  return LINKS.map((l) => {
    const active = path === l.href || path.startsWith(l.href + "/");
    return (
      <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
        className={`press rounded-full px-3.5 py-2 text-sm font-medium hover:bg-mist ${active ? "text-orange-text" : "text-ink"}`}>
        {l.label}
      </Link>
    );
  });
}
