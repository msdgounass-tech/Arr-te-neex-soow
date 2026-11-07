import { expect, test } from "@playwright/test";

test.describe("Formulaires et liens WhatsApp", () => {
  test("contact : champs obligatoires vérifiés avant envoi (aucun message envoyé)", async ({ page }) => {
    await page.goto("/contact");
    const form = page.locator("form").last();
    const required = form.locator("[required]");
    expect(await required.count()).toBeGreaterThan(0);
    const valid = await form.evaluate((f: HTMLFormElement) => f.checkValidity());
    expect(valid).toBe(false);
  });

  test("tous les liens WhatsApp visent wa.me avec un numéro international", async ({ page }) => {
    for (const path of ["/", "/faq", "/garanties", "/contact"]) {
      await page.goto(path);
      const hrefs = await page.locator('a[href*="wa.me"]').evaluateAll((as) => as.map((a) => a.getAttribute("href") || ""));
      for (const h of hrefs) expect(h, `${path} : ${h}`).toMatch(/^https:\/\/wa\.me\/\d{11,15}(\?text=.+)?$/);
    }
  });

  test("suivi de commande : formulaire avec numéro de commande", async ({ page }) => {
    await page.goto("/suivi");
    await expect(page.locator("main form")).toBeVisible();
    await expect(page.locator("main form").getByText("Numéro de commande")).toBeVisible();
  });
});
