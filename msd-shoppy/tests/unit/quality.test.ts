import { test } from "node:test";
import assert from "node:assert/strict";
import { productQuality } from "../../src/lib/quality.ts";

test("même score que la base pour le produit de référence (69)", () => {
  // Cas identique à supabase/tests/business.test.sql : 1 photo 1200 px, titre 30 car., description 47 car., stock suivi.
  const r = productQuality({ title: "Robe wax élégante coupe droite", description: "Robe en tissu wax 100 % coton, cousue à Dakar.",
    price: 15000, categoryId: 1, availability: "in_stock", stock: 5, hasVariantStock: false, images: [{ width: 1200 }] });
  assert.equal(r.score, 69);
  assert.equal(r.tips[0].key, "description"); // 18 points à gagner, avant les photos (13)
});

test("fiche complète = 100, sans recommandation", () => {
  const r = productQuality({ title: "Sac en cuir tressé fait main", description: "x".repeat(220), price: 20000, categoryId: 3,
    availability: "in_stock", stock: 4, hasVariantStock: false, images: [{ width: 1000 }, { width: 900 }, { width: 1200 }] });
  assert.equal(r.score, 100);
  assert.equal(r.tips.length, 0);
});

test("fiche vide : score bas et conseils triés par impact", () => {
  const r = productQuality({ title: "Sac", description: "", price: 0, categoryId: null, availability: "in_stock", stock: null,
    hasVariantStock: false, images: [] });
  assert.equal(r.score, 3 + 5);
  assert.equal(r.tips[0].points, 25);
});
