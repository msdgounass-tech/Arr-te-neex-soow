import { NextResponse } from "next/server";
import { getProducts } from "@/lib/queries";
import { sortedImages } from "@/lib/format";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 60) || "";
  if (q.trim().length < 2) return NextResponse.json({ items: [] });
  const { items } = await getProducts({ q, limit: 6 });
  return NextResponse.json(
    {
      items: items.map((p) => ({ id: p.id, name: p.name, slug: p.slug, price: p.price, image: sortedImages(p)[0]?.url ?? null, category: p.category?.name ?? null, brand: p.brand ?? null })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
