import "server-only";
import { getCategoryTree } from "./queries";

/** Filtre « univers » des pages de catalogue : pastilles + correspondance univers → slugs inclus. */
export async function universeFilter() {
  const tree = await getCategoryTree();
  return {
    categories: tree.map((u) => ({ label: u.name, value: u.slug })),
    mapCategory: (value: string) => {
      const u = tree.find((x) => x.slug === value);
      if (u) return [u.slug, ...u.children.map((c) => c.slug)];
      return [value];
    },
  };
}
