"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AI_LINKS } from "@/lib/ai/links";

export function AiNav() {
  const path = usePathname();
  return (
    <nav aria-label="Modules Shoppy AI" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      {AI_LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className="chip press shrink-0">{label}</Link>
      ))}
    </nav>
  );
}
