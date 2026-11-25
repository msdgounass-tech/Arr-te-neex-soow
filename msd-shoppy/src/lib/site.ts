export const SITE = {
  name: "MSD Shoppy",
  description: "Les boutiques du Sénégal au même endroit : découvrez des produits, comparez les vendeurs et commandez directement.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  country: "SN",
  currency: "XOF",
  locale: "fr-SN",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
  adsManagerUrl: "https://www.facebook.com/adsmanager/",
  trialDays: 7,
} as const;
