import { EmptyState } from "@/components/ui/bits";

export default function NotFound() {
  return (
    <div className="container-page py-12">
      <EmptyState icon="compass" title="Cette page n'existe pas ou n'est plus disponible"
        text="Le produit ou la boutique a peut-être été retiré. Continuez votre recherche dans le catalogue."
        action={{ href: "/explorer", label: "Explorer le catalogue" }} />
    </div>
  );
}
