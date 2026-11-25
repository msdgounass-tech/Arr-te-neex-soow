"use client";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { Icon } from "@/components/ui/Icon";

export function CartLink() {
  const lines = useCart();
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  return (
    <Link href="/panier" className="press relative grid h-10 w-10 place-items-center rounded-full hover:bg-mist"
      aria-label={count ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier"}>
      <Icon name="cart" size={22} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-orange-strong px-1 text-[11px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
