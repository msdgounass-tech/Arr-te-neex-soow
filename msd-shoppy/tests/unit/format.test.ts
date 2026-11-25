import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPrice, toInternational, isValidSenegalPhone, whatsappLink } from "../../src/lib/format.ts";

test("prix en FCFA", () => assert.equal(formatPrice(15000).replace(/\s/g, " "), "15 000 FCFA"));
test("numéros sénégalais", () => {
  assert.equal(toInternational("77 123 45 67"), "221771234567");
  assert.equal(toInternational("+221 77 123 45 67"), "221771234567");
  assert.equal(toInternational("123"), null);
  assert.ok(isValidSenegalPhone("77 123 45 67"));
  assert.ok(!isValidSenegalPhone("12 345 67 89"));
});
test("lien WhatsApp prérempli", () => {
  assert.equal(whatsappLink("771234567", "Bonjour"), "https://wa.me/221771234567?text=Bonjour");
  assert.equal(whatsappLink(null, "x"), null);
});
