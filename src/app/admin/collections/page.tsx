import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { Card, PageTitle } from "@/components/admin/ui";
import { CollectionEditor } from "@/components/admin/CollectionEditor";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { deleteCollection } from "../actions";

export default async function AdminCollections() {
  const { sb } = await requireRole("manager");
  const { data } = await sb.from("collections").select("*").order("position");
  return (
    <>
      <PageTitle title="Collections" subtitle="Une seule collection peut être en vedette sur la page d'accueil. Associez les produits depuis leur fiche." />
      <Card className="mb-6"><p className="label mb-4">Nouvelle collection</p><CollectionEditor /></Card>
      {(data || []).map((c) => (
        <Card key={c.id} className="mb-4">
          <div className="mb-4 flex items-baseline justify-between">
            <Link href={`/collections/${c.slug}`} target="_blank" className="display text-2xl hover:text-accent">{c.name}</Link>
            <form action={deleteCollection}><input type="hidden" name="id" value={c.id} /><ConfirmSubmit message="Supprimer cette collection ?" className="text-[0.78rem] uppercase tracking-[0.16em] text-mist hover:text-danger">Supprimer</ConfirmSubmit></form>
          </div>
          <CollectionEditor initial={c} />
        </Card>
      ))}
    </>
  );
}
