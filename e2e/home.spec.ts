import { expect, test } from "@playwright/test";
import { expectNoOverflow, watchErrors } from "./helpers";

test.describe("Accueil", () => {
  test("hero : titre, boutons d'action et scène 3D WebGL", async ({ page }) => {
    const errors = watchErrors(page);
    // « ?3d » force la scène même sans GPU (le navigateur de test rend le WebGL en logiciel)
    await page.goto("/?3d");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("La technologie");

    const discover = page.getByRole("link", { name: "Découvrir nos produits" });
    await expect(discover).toHaveAttribute("href", "/shop");

    // Bouton WhatsApp du hero (le numéro vient des paramètres de la boutique)
    const wa = page.locator('section[aria-labelledby="hero-title"] a[href^="https://wa.me/"]');
    if (await wa.count()) {
      const href = await wa.first().getAttribute("href");
      expect(href).toMatch(/^https:\/\/wa\.me\/221\d{9}\?text=/);
    }

    // La 3D est chargée en différé : un vrai canvas WebGL apparaît
    const canvas = page.locator('section[aria-labelledby="hero-title"] canvas');
    await expect(canvas).toHaveCount(1, { timeout: 15_000 });
    const hasGl = await canvas.evaluate((c: HTMLCanvasElement) => Boolean(c.getContext("webgl2") || c.getContext("webgl")));
    expect(hasGl).toBe(true);

    // Les angles de vue sont des boutons qui fonctionnent
    const back = page.getByRole("button", { name: "Dos" });
    await back.click();
    await expect(back).toHaveAttribute("aria-pressed", "true");

    await expectNoOverflow(page);
    expect(errors).toEqual([]);
  });

  test("sans accélération graphique, la silhouette statique remplace la 3D", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("img", { name: /Smartphone en 3D/ })).toBeVisible();
    await page.waitForTimeout(2500);
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("le rendu 3D se met en pause hors écran", async ({ page }) => {
    await page.goto("/?3d");
    await expect(page.locator("canvas")).toHaveCount(1, { timeout: 15_000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    // le canvas existe toujours (pas de remontage coûteux au retour)
    await expect(page.locator("canvas")).toHaveCount(1);
  });

  test("respecte prefers-reduced-motion : le texte est immédiatement lisible", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    const opacity = await page.locator("#hero-title span span").first().evaluate((el) => getComputedStyle(el).transform);
    expect(opacity === "none" || opacity === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
    await ctx.close();
  });
});
