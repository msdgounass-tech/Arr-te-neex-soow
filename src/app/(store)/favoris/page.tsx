import type { Metadata } from "next";
import { FavoritesView } from "@/components/account/FavoritesView";

export const metadata: Metadata = { title: "Mes favoris", robots: { index: false } };

export default function FavoritesPage() {
  return <FavoritesView />;
}
