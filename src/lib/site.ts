import type { HomeSettings, StoreSettings } from "./types";

export const BRAND = {
  name: "GOUNASS LUXURY",
  slogan: "Wouro Maama",
  description:
    "GOUNASS LUXURY — mode, habillement et accessoires de luxe pour homme et femme au Sénégal. Une sélection exclusive pour affirmer votre style.",
};

/**
 * Visuels éditoriaux par défaut. Ils sont remplaçables sans redéploiement
 * depuis Admin > Paramètres (stockés dans Supabase Storage).
 * Pour héberger les fichiers vous-même : `npm run fetch-images` puis remplacez
 * les URL ci-dessous par /images/hero.jpg et /images/accessoires.jpg.
 */
export const DEFAULT_IMAGES = {
  hero: "https://cdn.alexya.ai/dd67244e-5214-4dfd-a952-36d82038cb1a/images/output/generated-1793807740525.jpg",
  accessories: "https://cdn.alexya.ai/dd67244e-5214-4dfd-a952-36d82038cb1a/images/output/generated-1793807737717.jpg",
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
};

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/men", label: "Men" },
  { href: "/women", label: "Women" },
  { href: "/accessories", label: "Accessories" },
  { href: "/collections", label: "Collections" },
  { href: "/contact", label: "Contact" },
];
