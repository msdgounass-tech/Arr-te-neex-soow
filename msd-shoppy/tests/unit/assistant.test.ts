import { test } from "node:test";
import assert from "node:assert/strict";
import { GUIDES, progressOf } from "../../src/lib/assistant.ts";

const empty = { hasLogo: false, descriptionLength: 0, hasContact: true, hasLocation: true, specialties: 0, publishedProducts: 0, averageQuality: null, shares: 0 };

test("8 étapes, chacune avec démonstration", () => {
  assert.equal(GUIDES.length, 8);
  for (const g of GUIDES) { assert.ok(g.steps.length >= 2, g.key); for (const s of g.steps) assert.ok(s.demo.caption, g.key); }
});
test("nouvelle boutique : seule la création est faite, prochaine étape = profil", () => {
  const p = progressOf(empty, {});
  assert.equal(p.done, 1);
  assert.equal(p.next?.key, "complete_profile");
});
test("une étape ignorée peut être reprise, et ne bloque pas la suivante", () => {
  const p = progressOf(empty, { complete_profile: "dismissed" });
  assert.equal(p.next?.key, "choose_domain");
  assert.equal(p.steps.find((s) => s.key === "complete_profile")?.dismissed, true);
});
test("progression détectée à partir des données réelles", () => {
  const p = progressOf({ ...empty, hasLogo: true, descriptionLength: 120, specialties: 2, publishedProducts: 3, averageQuality: 85, shares: 1 }, {});
  assert.equal(p.done, 6);
});
