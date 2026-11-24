import { expect, test } from "@playwright/test";
import { expectNoOverflow, watchErrors } from "./helpers";

const PAGES = ["/", "/shop", "/men", "/women", "/accessories", "/montres", "/chaussures", "/collections", "/nouveautes", "/meilleures-ventes", "/promotions", "/contact", "/livraison", "/suivi", "/panier", "/favoris", "/conditions", "/confidentialite", "/compte/connexion"];

for (const path of PAGES) {
  test(`la page ${path} s'affiche sans erreur ni débordement`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(path);
    expect(res?.status(), "statut HTTP").toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.waitForLoadState("networkidle").catch(() => {});
    await expectNoOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("le contenu est visible avant le chargement de JavaScript", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/livraison");
  const opacity = await page.locator("main > div").first().evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(opacity)).toBe(1);
  await ctx.close();
});

test("page introuvable : 404", async ({ page }) => {
  const res = await page.goto("/produit/ce-produit-n-existe-pas");
  expect(res?.status()).toBe(404);
});

test("SEO : robots et sitemap", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap:");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/shop");
});
