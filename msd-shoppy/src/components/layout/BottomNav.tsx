"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const ITEMS = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/explorer", label: "Explorer", icon: "compass" },
  { href: "/vendre", label: "Vendre", icon: "store", center: true },
  { href: "/favoris", label: "Favoris", icon: "heart" },
  { href: "/compte", label: "Compte", icon: "user" },
];

export function BottomNav() {
  const path = usePathname();
  const isActive = (href: string) => href === "/" ? path === "/" : path === href || path.startsWith(href + "/") ||
    (href === "/vendre" && path.startsWith("/vendeur"));
  return (
    <nav aria-label="Navigation" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white md:hidden">
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {ITEMS.map((it) => {
          const active = isActive(it.href);
          if (it.center) {
            return (
              <li key={it.href} className="flex justify-center">
                <Link href={it.href} aria-current={active ? "page" : undefined}
                  className="press -mt-5 flex flex-col items-center gap-1 text-[11px] font-semibold text-orange-text">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-strong text-white shadow-[0_8px_20px_-6px_rgb(201_72_11/0.6)] ring-4 ring-white">
                    <Icon name={it.icon} size={26} />
                  </span>
                  {it.label}
                </Link>
              </li>
            );
          }
          return (
            <li key={it.href}>
              <Link href={it.href} aria-current={active ? "page" : undefined}
                className={`press flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? "text-orange-text" : "text-slate"}`}>
                <Icon name={it.icon} size={22} filled={active && it.icon === "heart"} strokeWidth={active ? 2.2 : 1.8} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
