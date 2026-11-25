import Link from "next/link";
import Image from "next/image";
import type { Shop, Domain } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

export function ShopAvatar({ shop, size = 56 }: { shop: Pick<Shop, "name" | "logo_url">; size?: number }) {
  return shop.logo_url
    ? <Image src={shop.logo_url} alt="" width={size} height={size} className="shrink-0 rounded-2xl border border-line object-cover" style={{ width: size, height: size }} />
    : <span className="grid shrink-0 place-items-center rounded-2xl bg-orange-soft font-display text-lg font-bold text-orange-text" style={{ width: size, height: size }} aria-hidden="true">
        {shop.name.slice(0, 1).toUpperCase()}</span>;
}

export function ShopCard({ shop, domain }: { shop: Shop; domain?: Domain }) {
  return (
    <Link href={`/b/${shop.slug}`} className="card card-interactive press flex items-center gap-3 p-3">
      <ShopAvatar shop={shop} />
      <div className="min-w-0">
        <p className="flex items-center gap-1 truncate font-semibold">{shop.name}{shop.verified_at && <Icon name="badge" size={15} className="shrink-0 text-success" title="Boutique vérifiée" />}</p>
        <p className="truncate text-xs text-slate">{domain?.name ?? "Boutique"}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate"><Icon name="map-pin" size={12} />{shop.city}, {shop.region}</p>
      </div>
    </Link>
  );
}
