const MAP: Record<string, string> = {
  PANIER_VIDE: "Votre panier est vide.",
  PANIER_TROP_GRAND: "Votre panier contient trop d'articles.",
  ZONE_INVALIDE: "La zone de livraison choisie n'est pas disponible.",
  QUANTITE_INVALIDE: "Une quantité est invalide.",
  PRODUIT_INDISPONIBLE: "Un article de votre panier n'est plus disponible.",
  STOCK_INSUFFISANT: "Stock insuffisant pour",
  COUPON_INVALIDE: "Le code promotionnel n'est plus valide pour cette commande.",
  POSITION_REQUISE: "Pour cette zone, partagez votre position afin de calculer les frais de livraison.",
  POSITION_INVALIDE: "La position transmise est invalide.",
  HORS_ZONE: "Votre adresse est en dehors de la zone de livraison choisie.",
};

export function orderErrorMessage(raw: string) {
  const key = Object.keys(MAP).find((k) => raw.includes(k));
  if (!key) return "La commande n'a pas pu être enregistrée. Veuillez réessayer.";
  if (key === "STOCK_INSUFFISANT") {
    const name = raw.split("STOCK_INSUFFISANT:")[1]?.trim();
    return `${MAP[key]} « ${name || "un article"} ». Ajustez la quantité.`;
  }
  return MAP[key];
}
