// Tests unitaires des calculs (prix, remises, livraison, formats).
// Lancement : npm test  (Node ≥ 22, sans dépendance supplémentaire)
import { test } from "node:test";
import assert from "node:assert/strict";
import { discountPercent, formatPhone, formatPrice, isOnSale, previewDeliveryFee, roadDistanceKm, slugify, toWhatsAppNumber, totalStock, variantPrice } from "../src/lib/format.ts";
import { commonFreeThreshold, minFreeThreshold } from "../src/lib/delivery.ts";

const zone = (o: Partial<Parameters<typeof previewDeliveryFee>[0]> = {}) => ({ fee: 2000, free_above: 10000, fee_mode: "fixed" as const, per_km_fee: 150, max_km: 60, ...o });

test("formatPrice : FCFA sans décimales, espaces normaux", () => {
  assert.equal(formatPrice(145000), "145 000 FCFA");
  assert.equal(formatPrice(0), "0 FCFA");
  assert.equal(formatPrice(999.6), "1 000 FCFA");
});

test("promotions : prix barré et pourcentage", () => {
  assert.equal(isOnSale({ price: 95000, compare_at_price: 115000 }), true);
  assert.equal(isOnSale({ price: 95000, compare_at_price: 95000 }), false);
  assert.equal(isOnSale({ price: 95000, compare_at_price: null }), false);
  assert.equal(discountPercent({ price: 80000, compare_at_price: 100000 }), 20);
});

test("prix de déclinaison : le prix spécifique remplace le prix de base", () => {
  assert.equal(variantPrice({ price: 50000 }, { price_override: 45000 }), 45000);
  assert.equal(variantPrice({ price: 50000 }, { price_override: null }), 50000);
});

test("stock total : ignore les déclinaisons inactives", () => {
  const v = (q: number, a = true) => ({ id: "x", size: null, color: null, color_hex: null, sku: "s", price_override: null, position: 0, is_active: a, inventory: { quantity: q } });
  assert.equal(totalStock({ product_variants: [v(3), v(2), v(9, false)] }), 5);
});

test("livraison : offerte à partir du seuil (inclus)", () => {
  assert.equal(previewDeliveryFee(zone(), 10000, null, null).free, true);
  assert.equal(previewDeliveryFee(zone(), 10000, null, null).fee, 0);
  assert.equal(previewDeliveryFee(zone(), 9999, null, null).fee, 2000);
});

test("livraison : tarif à confirmer n'invente aucun montant", () => {
  const r = previewDeliveryFee(zone({ fee_mode: "quote" }), 5000, null, null);
  assert.equal(r.pending, true);
  assert.equal(r.fee, 0);
});

test("livraison selon la distance : position requise, puis calcul arrondi à la centaine", () => {
  const z = zone({ fee_mode: "distance", fee: 1000, max_km: 150 });
  assert.equal(previewDeliveryFee(z, 5000, null, { lat: 14.6928, lng: -17.4467, factor: 1.3 }).needsLocation, true);
  const r = previewDeliveryFee(z, 5000, { lat: 14.791, lng: -16.9359 }, { lat: 14.6928, lng: -17.4467, factor: 1.3 });
  assert.equal(r.km, 72.8); // même valeur que la fonction SQL road_distance_km
  assert.equal(r.fee, 12000);
  assert.equal(previewDeliveryFee(zone({ fee_mode: "distance", max_km: 50 }), 5000, { lat: 14.791, lng: -16.9359 }, { lat: 14.6928, lng: -17.4467, factor: 1.3 }).outOfRange, true);
});

test("distance routière : zéro pour un même point", () => {
  assert.equal(roadDistanceKm(14.7, -17.4, 14.7, -17.4), 0);
});

test("seuils de livraison offerte entre zones", () => {
  assert.equal(commonFreeThreshold([{ free_above: 10000 }, { free_above: 10000 }]), 10000);
  assert.equal(commonFreeThreshold([{ free_above: 10000 }, { free_above: 20000 }]), null);
  assert.equal(commonFreeThreshold([{ free_above: 10000 }, { free_above: null }]), null);
  assert.equal(minFreeThreshold([{ free_above: 20000 }, { free_above: null }, { free_above: 15000 }]), 15000);
  assert.equal(commonFreeThreshold([]), null);
});

test("téléphones sénégalais : WhatsApp international et affichage", () => {
  assert.equal(toWhatsAppNumber("70 570 41 21"), "221705704121");
  assert.equal(toWhatsAppNumber("+221 70 570 41 21"), "221705704121");
  assert.equal(toWhatsAppNumber("00221705704121"), "221705704121");
  assert.equal(formatPhone("705704121"), "70 570 41 21");
});

test("slugify : accents et caractères spéciaux", () => {
  assert.equal(slugify("Robe longue drapée émeraude"), "robe-longue-drapee-emeraude");
  assert.equal(slugify("  Montre Héritage acier & or "), "montre-heritage-acier-or");
});
