import { test } from "node:test";
import assert from "node:assert/strict";
import { confidence, delta, conversion, margin, minPriceForMargin, stockCover, salesFindings, stockAlerts, type SalesInsights, type ProductStat } from "../../src/lib/insights.ts";
import { yearlySaving } from "../../src/lib/plans.ts";

const base: ProductStat = { id: "p1", title: "Robe", slug: "robe", price: 10000, status: "published", availability: "in_stock", stock: 5, quality: 80,
  category_id: 1, unit_cost: null, extra_cost: null, views: 0, views_prev: 0, favorites: 0, orders: 0, units: 0, revenue: 0, last_order_at: null };
const ins = (products: ProductStat[]): SalesInsights => ({ days: 30, totals: { views: 0, views_prev: 0, orders: 0, orders_prev: 0, revenue: 0, revenue_prev: 0 }, weekdays: [], products });

test("économie annuelle conforme aux formules", () => {
  assert.equal(yearlySaving(2900, 31900), 2900);
  assert.equal(yearlySaving(5000, 52500), 7500);
  assert.equal(yearlySaving(12000, 120000), 24000);
});

test("indicateurs : variation, conversion, confiance", () => {
  assert.equal(delta(150, 100), 50);
  assert.equal(delta(10, 0), null, "pas de comparaison sans période précédente");
  assert.equal(conversion(0, 0), null);
  assert.equal(conversion(200, 5), 2.5);
  assert.equal(confidence(5), "faible");
  assert.equal(confidence(50), "moyenne");
  assert.equal(confidence(10, 25), "bonne");
});

test("marge et prix minimum", () => {
  assert.equal(margin(10000, null), null, "pas de marge sans coût d'achat");
  assert.deepEqual(margin(10000, 6000, 1000), { cost: 7000, value: 3000, rate: 30 });
  assert.equal(minPriceForMargin(7000, 30), 10000);
  assert.equal(minPriceForMargin(7000, 100), null);
});

test("stock : rythme et couverture", () => {
  assert.deepEqual(stockCover(30, 30, 5), { perDay: 1, coverDays: 5 });
  assert.deepEqual(stockCover(0, 30, 5), { perDay: 0, coverDays: null });
});

test("constats : produit consulté sans commande, rupture, incohérence", () => {
  const f = salesFindings(ins([{ ...base, views: 40, orders: 0 }]));
  assert.equal(f[0].kind, "views_no_orders");
  const a = stockAlerts(ins([{ ...base, availability: "out_of_stock", views: 3 }, { ...base, id: "p2", stock: 0 }]));
  assert.ok(a.some((x) => x.level === "rupture"));
  assert.ok(a.some((x) => x.level === "incoherent"));
});
