import { requireRole } from "@/lib/auth";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { PageTitle } from "@/components/admin/ui";

export default async function NewProduct() {
  const { sb } = await requireRole("manager");
  const [{ data: categories }, { data: collections }] = await Promise.all([
    sb.from("categories").select("id, name, slug, parent_id, gender, is_active").order("position"),
    sb.from("collections").select("id, name").order("position"),
  ]);
  return (
    <>
      <PageTitle title="Nouveau produit" />
      <ProductEditor categories={categories || []} collections={collections || []} />
    </>
  );
}
