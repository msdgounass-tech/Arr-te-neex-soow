import type { DeliverySettings, HomeSettings, PaymentSettings, StoreSettings } from "./types";

export const BRAND = {
  name: "GOUNASS LUXURY",
  slogan: "Wouro Maama",
  description:
    "GOUNASS LUXURY — mode, habillement et accessoires de luxe pour homme et femme au Sénégal. Une sélection exclusive pour affirmer votre style.",
};

/**
 * Visuels éditoriaux par défaut. Ils sont remplaçables sans redéploiement
 * depuis Admin > Paramètres (stockés dans Supabase Storage).
 * Les fichiers sont hébergés avec le site (public/images).
 */
/** Logo officiel (remplaçable dans Admin › Paramètres). */
export const DEFAULT_LOGO = "/images/logo/gounass-logo.png";

export const DEFAULT_IMAGES = {
  hero: "/images/hero.jpg",
  accessories: "/images/accessoires.jpg",
  /** Visuel de collection par défaut (motifs wax, grand boubou et robe wax). */
  collection: "/images/collection-wouro-maama.svg",
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

export const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  {
    href: "/men",
    label: "Men",
    children: [
      { href: "/men?categorie=homme-vetements", label: "Vêtements" },
      { href: "/men?categorie=homme-chaussures", label: "Chaussures" },
      { href: "/montres?genre=homme", label: "Montres" },
      { href: "/men?categorie=homme-sacs", label: "Sacs" },
      { href: "/men?categorie=homme-lunettes", label: "Lunettes" },
      { href: "/men?categorie=homme-parfums", label: "Parfums" },
      { href: "/men?categorie=homme-bijoux", label: "Bijoux" },
      { href: "/men?categorie=homme-accessoires", label: "Accessoires" },
    ],
  },
  {
    href: "/women",
    label: "Women",
    children: [
      { href: "/women?categorie=femme-vetements", label: "Vêtements" },
      { href: "/women?categorie=femme-robes", label: "Robes" },
      { href: "/women?categorie=femme-chaussures", label: "Chaussures" },
      { href: "/women?categorie=femme-sacs", label: "Sacs" },
      { href: "/montres?genre=femme", label: "Montres" },
      { href: "/women?categorie=femme-bijoux", label: "Bijoux" },
      { href: "/women?categorie=femme-accessoires", label: "Accessoires" },
    ],
  },
  {
    href: "/accessories",
    label: "Accessories",
    children: [
      { href: "/montres", label: "Montres" },
      { href: "/accessories?type=sacs", label: "Sacs" },
      { href: "/accessories?type=parfums", label: "Parfums" },
      { href: "/accessories?type=bijoux", label: "Bijoux" },
      { href: "/accessories?type=lunettes", label: "Lunettes" },
      { href: "/chaussures", label: "Chaussures" },
    ],
  },
  {
    href: "/collections",
    label: "Collections",
    children: [
      { href: "/nouveautes", label: "Nouvelle collection" },
      { href: "/meilleures-ventes", label: "Meilleures ventes" },
      { href: "/promotions", label: "Promotions" },
      { href: "/collections", label: "Toutes les collections" },
    ],
  },
  { href: "/contact", label: "Contact" },
];
