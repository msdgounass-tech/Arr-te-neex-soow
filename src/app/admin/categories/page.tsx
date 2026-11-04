import { requireRole } from "@/lib/auth";
import { Card, PageTitle } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/SimpleForms";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { deleteCategory } from "../actions";

export default async function AdminCategories() {
  const { sb } = await requireRole("manager");
  const { data } = await sb.from("categories").select("*").order("position");
  const all = data || [];
  const parents = all.filter((c) => !c.parent_id);
  return (
    <>
      <PageTitle title="Catégories" subtitle="Organisation Homme / Femme et sous-catégories." />
      <Card className="mb-6"><p className="label mb-4">Nouvelle catégorie</p><CategoryForm parents={parents} /></Card>
      {parents.map((p) => (
        <Card key={p.id} className="mb-4 space-y-5">
          <CategoryForm parents={parents.filter((x) => x.id !== p.id)} initial={p} />
          <div className="space-y-4 border-l border-gold/20 pl-4 md:pl-8">
            {all.filter((c) => c.parent_id === p.id).map((c) => (
              <div key={c.id} className="flex flex-col gap-2 md:flex-row md:items-end">
                <div className="flex-1"><CategoryForm parents={parents} initial={c} /></div>
                <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><ConfirmSubmit message="Supprimer cette catégorie ? Les produits associés n'auront plus de catégorie." className="pb-3 text-[0.6rem] uppercase tracking-[0.16em] text-mist hover:text-danger">Supprimer</ConfirmSubmit></form>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </>
  );
}
