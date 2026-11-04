import { NextResponse } from "next/server";
import { getProducts } from "@/lib/queries";

/** Liste de produits par identifiants (favoris). */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") || "")
    .split(",")
    .filter((s) => /^[0-9a-f-]{36}$/i.test(s))
    .slice(0, 60);
  if (!ids.length) return NextResponse.json({ items: [] });
  const { items } = await getProducts({ ids, limit: 60 });
  return NextResponse.json({ items });
}
