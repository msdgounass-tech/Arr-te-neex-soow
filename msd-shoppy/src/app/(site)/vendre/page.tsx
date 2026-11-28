import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyShop, getUser } from "@/lib/auth";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { PlanPicker, type PlanRow } from "@/components/seller/PlanPicker";
import { supabasePublic } from "@/lib/supabase/public";

export const metadata: Metadata = { title: "Vendre sur Shoppy by MSD", description: "Ouvrez votre boutique en ligne au Sénégal : 7 jours d'essai gratuit, un assistant pour vous guider, vos clients commandent directement chez vous." };

const POINTS = [
  ["store", "Votre boutique en ligne", "Logo, description, catalogue et coordonnées publiques que vous choisissez."],
  ["package", "Des commandes suivies", "Confirmez, préparez, expédiez : chaque étape est notifiée au client."],
  ["shield", "Une réputation qui se construit", "Avis vérifiés, commandes terminées et badges attribués sur des faits réels."],
  ["bulb", "Un assistant à vos côtés", "Guides pas à pas et conseils pour améliorer vos fiches et vos ventes."],
  ["sparkles", "Shoppy AI", "Analyse de vos ventes, de vos prix et de votre marché, fiches produits et publicités rédigées avec vous."],
] as const;

/** Parcours « Vendre » : s'adapte à la situation de chaque utilisateur. */
export default async function SellPage() {
  const user = await getUser();
  if (user) {
    const mine = await getMyShop();
    if (mine) redirect(mine.canManage ? "/vendeur" : "/vendeur/abonnement");
    redirect("/vendre/creer");
  }
  const { data } = await supabasePublic().from("subscription_plans").select("code, name, price_xof, price_year_xof").eq("active", true);
  const plans = (data ?? []) as PlanRow[];
  return (
    <div className="container-page max-w-5xl py-8 md:py-14">
      <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">Vendez à tout le Sénégal depuis votre téléphone.</h1>
      <p className="mt-3 max-w-xl text-lg text-slate">Ouvrez votre boutique en quelques minutes. Les 7 premiers jours sont gratuits, et vos données restent à vous.</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link href="/inscription?suite=/vendre/creer" className="btn btn-primary press">Créer mon compte vendeur</Link>
        <Link href="/connexion?suite=/vendre" className="btn btn-secondary press">J'ai déjà un compte</Link>
      </div>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {POINTS.map(([icon, title, text], i) => (
          <Reveal as="li" key={title} index={i} className="card flex gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-soft text-orange-text"><Icon name={icon} size={20} /></span>
            <span><b className="block">{title}</b><span className="text-sm text-slate">{text}</span></span>
          </Reveal>
        ))}
      </ul>
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Trois formules, selon votre activité</h2>
        <p className="mt-1 text-slate">7 jours d'essai gratuit avec toutes les fonctions Pro, sans engagement. Payez au mois ou à l'année, par Wave ou Orange Money.</p>
        <div className="mt-5"><PlanPicker plans={plans} /></div>
      </section>
      <p className="mt-8 text-sm text-slate">Un seul compte suffit pour acheter et pour vendre. <Link href="/aide/abonnements" className="link">Comment fonctionne l'abonnement</Link></p>
    </div>
  );
}
