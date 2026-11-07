import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
  test("ordinateur : le méga-menu catalogue mène aux catégories", async ({ page, isMobile }) => {
    test.skip(isMobile, "menu ordinateur");
    await page.goto("/shop");
    await page.getByRole("button", { name: "Catalogue" }).hover();
    const mega = page.locator("#mega-menu");
    await expect(mega).toBeVisible();
    await mega.getByRole("link", { name: "Smartphones" }).click();
    await expect(page).toHaveURL(/\/categorie\/smartphones$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Smartphones");
  });

  test("mobile : menu plein écran, accordéon des univers", async ({ page, isMobile }) => {
    test.skip(!isMobile, "menu mobile");
    await page.goto("/");
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    const nav = page.getByRole("navigation", { name: "Menu mobile" });
    await expect(nav).toBeVisible();
    await nav.getByRole("button", { name: /Afficher les sous-catégories Téléphonie/ }).click();
    await nav.getByRole("link", { name: "Tablettes" }).click();
    await expect(page).toHaveURL(/\/categorie\/tablettes$/);
    await expect(nav).toBeHidden();
  });

  test("fil d'Ariane et pastilles de catégorie", async ({ page }) => {
    await page.goto("/categorie/smartphones");
    const crumbs = page.getByRole("navigation", { name: "Fil d'Ariane" });
    await expect(crumbs.getByRole("link", { name: "Téléphonie" })).toHaveAttribute("href", "/categorie/telephonie");
    await page.getByRole("link", { name: "Tablettes", exact: true }).first().click();
    await expect(page).toHaveURL(/\/categorie\/tablettes$/);
  });

  test("pied de page : liens d'aide fonctionnels", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    for (const [label, href] of [["Questions fréquentes", "/faq"], ["Garanties & retours", "/garanties"], ["Livraison", "/livraison"]]) {
      await expect(footer.getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href);
    }
  });
});
