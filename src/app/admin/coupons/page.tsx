import { requireRole } from "@/lib/auth";
import { Card, PageTitle } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/SimpleForms";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { deleteCoupon } from "../actions";

export default async function AdminCoupons() {
  const { sb } = await requireRole("manager");
  const { data } = await sb.from("coupons").select("*").order("created_at", { ascending: false });
  return (
    <>
      <PageTitle title="Codes promotionnels" subtitle="Les remises sont recalculées côté serveur à chaque commande." />
      <Card className="mb-6"><p className="label mb-4">Nouveau code</p><CouponForm /></Card>
      {(data || []).map((c) => (
        <Card key={c.id} className="mb-3">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="tracking-widest text-accent">{c.code} <span className="ml-3 text-xs tracking-normal text-mist">utilisé {c.used_count} fois</span></p>
            <form action={deleteCoupon}><input type="hidden" name="id" value={c.id} /><ConfirmSubmit message="Supprimer ce code ?" className="text-[0.78rem] uppercase tracking-[0.16em] text-mist hover:text-danger">Supprimer</ConfirmSubmit></form>
          </div>
          <CouponForm initial={c} />
        </Card>
      ))}
    </>
  );
}
