import type { DeliveryZone } from "./types";

/** Seuil de livraison offerte commun à toutes les zones actives (null s'il varie ou n'existe pas). */
export function commonFreeThreshold(zones: Pick<DeliveryZone, "free_above">[]): number | null {
  if (!zones.length) return null;
  const values = zones.map((z) => z.free_above);
  if (values.some((v) => v == null)) return null;
  return values.every((v) => v === values[0]) ? (values[0] as number) : null;
}

/** Plus petit seuil de livraison offerte parmi les zones (pour un message « dès X FCFA selon la zone »). */
export function minFreeThreshold(zones: Pick<DeliveryZone, "free_above">[]): number | null {
  const v = zones.map((z) => z.free_above).filter((x): x is number => x != null);
  return v.length ? Math.min(...v) : null;
}
