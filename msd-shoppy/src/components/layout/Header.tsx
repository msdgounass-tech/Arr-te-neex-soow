import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "./Logo";
import { CartLink } from "./CartLink";
import { HeaderSearch } from "./HeaderSearch";
import { NavLinks } from "./NavLinks";
import { Icon } from "@/components/ui/Icon";

export function Header({ signedIn, unread }: { signedIn: boolean; unread: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />
        <div className="hidden flex-1 md:block md:max-w-md lg:max-w-lg">
          <Suspense fallback={<div className="h-11 rounded-full border border-line" />}><HeaderSearch /></Suspense>
        </div>
        <nav aria-label="Navigation principale" className="ml-auto hidden items-center gap-1 md:flex"><NavLinks /></nav>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link href="/explorer" className="press grid h-10 w-10 place-items-center rounded-full hover:bg-mist md:hidden" aria-label="Rechercher">
            <Icon name="search" size={22} />
          </Link>
          {signedIn && (
            <Link href="/notifications" className="press relative grid h-10 w-10 place-items-center rounded-full hover:bg-mist"
              aria-label={unread ? `Notifications, ${unread} non lue${unread > 1 ? "s" : ""}` : "Notifications"}>
              <Icon name="bell" size={22} />
              {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-orange ring-2 ring-white" />}
            </Link>
          )}
          <CartLink />
          <Link href="/vendre" className="btn btn-primary press ml-2 hidden md:inline-flex">
            <Icon name="store" size={18} /> Vendre
          </Link>
        </div>
      </div>
    </header>
  );
}
