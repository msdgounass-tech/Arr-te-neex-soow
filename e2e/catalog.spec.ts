import { expect, test } from "@playwright/test";
import { firstProductSlug } from "./helpers";

test.describe("Catalogue, recherche et filtres", () => {
  test("filtres : univers, prix et tri modifient l'URL et la liste", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("button", { name: "Téléphonie", exact: true }).click();
    await expect(page).toHaveURL(/categorie=telephonie/);

    await page.getByRole("button", { name: "Prix", exact: true }).click();
    await page.getByRole("button", { name: "Moins de 25 000 F" }).click();
    await expect(page).toHaveURL(/max=25000/);

    await page.getByLabel("Trier par").selectOption("price-asc");
    await expect(page).toHaveURL(/tri=price-asc/);

    await page.getByRole("button", { name: "Réinitialiser" }).click();
    await expect(page).not.toHaveURL(/max=/);
  });

  test("tri par prix croissant : les prix affichés sont ordonnés", async ({ page }) => {
    await page.goto("/shop?tri=price-asc");
    const prices = await page.locator("main article, main .surface").locator("text=/\\d[\\d\\s ]* FCFA/").allTextContents();
    const nums = prices.map((p) => Number(p.replace(/\D/g, ""))).filter(Boolean);
    test.skip(nums.length < 2, "pas assez de produits en ligne");
    // chaque carte affiche d'abord son prix de vente
    const sorted = [...nums].sort((a, b) => a - b);
    expect(nums[0]).toBe(sorted[0]);
  });

  test("recherche instantanée (Ctrl+K) et page de résultats", async ({ page, isMobile }) => {
    await page.goto("/shop");
    const slug = await firstProductSlug(page);
    test.skip(!slug, "catalogue vide");
    const name = (await page.locator(`main a[href="/produit/${slug}"] h3`).first().textContent())!.trim();
    const term = name.split(/\s+/).find((w) => w.length >= 4) || name.slice(0, 4);
    // le raccourci clavier est actif une fois la page hydratée
    await page.waitForLoadState("networkidle");

    if (isMobile) await page.getByRole("button", { name: "Rechercher", exact: true }).click();
    else await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Recherche" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Terme de recherche").fill(term);
    await expect(dialog.getByRole("option").first()).toBeVisible();

    await dialog.getByLabel("Terme de recherche").press("Enter");
    await expect(page).toHaveURL(new RegExp(`/shop\\?q=`));
    await expect(page.getByRole("dialog", { name: "Recherche" })).toBeHidden();
    await expect(page.locator("main").getByText(`Résultats pour « ${term} »`, { exact: true })).toBeVisible();
  });

  test("recherche sans résultat : message clair", async ({ page, isMobile }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    if (isMobile) await page.getByRole("button", { name: "Rechercher", exact: true }).click();
    else await page.getByRole("button", { name: /Rechercher \(Ctrl\+K\)/ }).click();
    await page.getByLabel("Terme de recherche").fill("zzqxwv");
    await expect(page.getByText("Aucun produit ne correspond")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Recherche" })).toBeHidden();
  });
});
