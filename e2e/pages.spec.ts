import { expect, test } from "@playwright/test";
import { expectNoOverflow, watchErrors } from "./helpers";

const PAGES = ["/", "/shop", "/categorie/telephonie", "/categorie/smartphones", "/nouveautes", "/promotions", "/meilleures-ventes", "/collections", "/faq", "/garanties", "/livraison", "/contact", "/suivi", "/panier", "/favoris", "/conditions", "/confidentialite", "/compte/connexion"];

for (const path of PAGES) {
  test(`la page ${path} s'affiche sans erreur ni débordement`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(path, { waitUntil: "networkidle" });
    expect(res?.status(), "statut HTTP").toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await page.locator("h1").count(), "un seul titre H1").toBe(1);
    await expectNoOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("page introuvable : 404 avec un lien de retour", async ({ page }) => {
  const res = await page.goto("/produit/ce-produit-n-existe-pas");
  expect(res?.status()).toBe(404);
});

test("les anciennes adresses de la boutique de mode sont redirigées", async ({ page }) => {
  await page.goto("/men");
  await expect(page).toHaveURL(/\/shop$/);
  await page.goto("/montres");
  await expect(page).toHaveURL(/\/categorie\/montres-connectees$/);
  await page.goto("/accessories");
  await expect(page).toHaveURL(/\/categorie\/accessoires-tech$/);
});

test("SEO : robots, sitemap, métadonnées et données structurées", async ({ page, request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap:");
  expect(robots).toContain("Disallow: /admin");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/categorie/smartphones");
  expect(sitemap).toContain("/faq");

  await page.goto("/");
  expect(await page.locator('meta[name="description"]').getAttribute("content")).toBeTruthy();
  expect(await page.locator('meta[property="og:title"]').getAttribute("content")).toBeTruthy();
  expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBeTruthy();
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.join(" ")).toContain('"Organization"');

  await page.goto("/faq");
  const faq = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(faq.join(" ")).toContain('"FAQPage"');
});
