import type { DeliverySettings, HomeSettings, PaymentSettings, StoreSettings } from "./types";

export const BRAND = {
  /** Nom affiché partout sur le site (un seul endroit à modifier). */
  name: "GOUNASS",
  /** Signature affichée sous le nom. */
  tagline: "High-Tech",
  /** Nom commercial légal (conditions de vente, paiements). */
  legalName: "GOUNASS LUXURY",
  slogan: "La technologie, en version premium",
  description:
    "GOUNASS High-Tech : smartphones, ordinateurs, audio, objets connectés et accessoires au Sénégal. Prix en FCFA, livraison à Dakar et dans les régions, commande en ligne ou sur WhatsApp.",
};

/** Logo par défaut (remplaçable dans Admin › Paramètres). Vide : monogramme vectoriel. */
export const DEFAULT_LOGO = "";

export const DEFAULT_IMAGES = {
  /** Visuel par défaut d'une collection sans photo. */
  collection: "/images/collection-tech.svg",
};

export const EMPTY_STORE: StoreSettings = {
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  city: "",
  instagram: "",
  tiktok: "",
  facebook: "",
  opening_hours: "",
};

export const EMPTY_HOME: HomeSettings = {
  hero_image: "",
  men_image: "",
  women_image: "",
  accessories_image: "",
  editorial_image: "",
  announcement: "",
  logo_url: "",
};

export const EMPTY_DELIVERY: DeliverySettings = { origin_lat: "", origin_lng: "", road_factor: "1.3" };
export const EMPTY_PAYMENTS: PaymentSettings = { wave_link: "", orange_money_link: "" };

export interface NavItem {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

/** Liens fixes de la navigation ; les univers de catégories sont ajoutés depuis la base. */
export const NAV_TAIL: NavItem[] = [
  {
    href: "/promotions",
    label: "Offres",
    children: [
      { href: "/promotions", label: "Promotions" },
      { href: "/nouveautes", label: "Nouveautés" },
      { href: "/meilleures-ventes", label: "Meilleures ventes" },
    ],
  },
  {
    href: "/aide",
    label: "Aide",
    children: [
      { href: "/faq", label: "Questions fréquentes" },
      { href: "/livraison", label: "Livraison" },
      { href: "/garanties", label: "Garanties & retours" },
      { href: "/suivi", label: "Suivre une commande" },
      { href: "/contact", label: "Contact" },
    ],
  },
];
