import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { signOutAction } from "@/app/actions/account";

export const ACCOUNT_LINKS = [
  ["/compte/profil", "Informations personnelles", "user"], ["/compte/commandes", "Mes commandes", "package"],
  ["/favoris", "Favoris", "heart"], ["/compte/adresses", "Adresses", "map-pin"], ["/notifications", "Notifications", "bell"],
  ["/compte/parametres", "Paramètres", "settings"], ["/compte/securite", "Sécurité du compte", "lock"], ["/aide", "Aide et assistance", "help"],
] as const;

export function AccountMenu() {
  return (
    <nav aria-label="Mon compte" className="card divide-y divide-line">
      {ACCOUNT_LINKS.map(([href, label, icon]) => (
        <Link key={href} href={href} className="press flex items-center gap-3 px-4 py-3.5 hover:bg-mist">
          <Icon name={icon} size={20} className="text-orange-text" /><span className="flex-1 font-medium">{label}</span><Icon name="chevron-right" size={18} className="text-slate" />
        </Link>
      ))}
      <form action={signOutAction}>
        <button type="submit" className="press flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-mist">
          <Icon name="logout" size={20} className="text-slate" /><span className="flex-1 font-medium">Se déconnecter</span>
        </button>
      </form>
    </nav>
  );
}
