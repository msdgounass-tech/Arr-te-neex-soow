import { expect, test } from "@playwright/test";
import { firstProductSlug } from "./helpers";

const num = (s: string | null) => Number((s || "").replace(/\D/g, ""));

test.describe("Fiche produit, panier et commande", () => {
  test("fiche produit : prix FCFA, disponibilité, WhatsApp et données structurées", async ({ page }) => {
    const slug = await firstProductSlug(page);
    test.skip(!slug, "catalogue vide");
    await page.goto(`/produit/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main").getByText(/FCFA/).first()).toBeVisible();
    await expect(page.getByText(/En stock|Plus que|Épuisé|épuisée/).first()).toBeVisible();

    const wa = page.getByRole("link", { name: "Commander sur WhatsApp" }).first();
    if (await wa.count()) {
      const href = decodeURIComponent((await wa.getAttribute("href")) || "");
      expect(href).toContain("Réf.");
      expect(href).toContain(`/produit/${slug}`);
    }
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(" ");
    expect(ld).toContain('"Product"');
    expect(ld).toContain('"XOF"');
  });

  test("panier : ajout, quantité, total, suppression", async ({ page }) => {
    const slug = await firstProductSlug(page);
    test.skip(!slug, "catalogue vide");
    await page.goto(`/produit/${slug}`);
    const add = page.getByRole("button", { name: "Ajouter au panier" }).first();
    test.skip(await add.isDisabled(), "produit épuisé");
    await add.click();

    const drawer = page.getByRole("dialog", { name: "Votre panier" });
    await expect(drawer).toBeVisible();
    await expect(page.getByText("Ajouté à votre panier")).toBeVisible();
    const subtotal = drawer.getByTestId("cart-subtotal");
    const before = num(await subtotal.textContent());
    expect(before).toBeGreaterThan(0);

    const plus = drawer.getByRole("button", { name: "Augmenter la quantité" }).first();
    if (await plus.isEnabled()) {
      await plus.click();
      await expect.poll(async () => num(await subtotal.textContent())).toBe(before * 2);
      await drawer.getByRole("button", { name: "Diminuer la quantité" }).first().click();
      await expect.poll(async () => num(await subtotal.textContent())).toBe(before);
    }

    // le panier survit à la navigation
    await drawer.getByRole("link", { name: "Voir le panier" }).click();
    await expect(page).toHaveURL(/\/panier$/);
    await expect(page.getByRole("link", { name: /Passer commande|Commander/ }).first()).toBeVisible();

    await page.locator("main").getByRole("button", { name: /Supprimer .* du panier/ }).first().click();
    await expect(page.getByText(/panier est vide/i).first()).toBeVisible();
  });

  test("commande : formulaire, validation et récapitulatif (sans validation finale)", async ({ page }) => {
    const slug = await firstProductSlug(page);
    test.skip(!slug, "catalogue vide");
    await page.goto(`/produit/${slug}`);
    const buy = page.getByRole("button", { name: "Acheter maintenant" });
    test.skip(await buy.isDisabled(), "produit épuisé");
    await buy.click();
    await expect(page).toHaveURL(/\/commande$/);
    await expect(page.getByRole("heading", { name: "Vos informations" })).toBeVisible();

    // champs obligatoires : la validation native bloque l'envoi
    await page.getByRole("button", { name: "Vérifier ma commande" }).click();
    await expect(page.getByRole("heading", { name: "Vos informations" })).toBeVisible();
    // Le récapitulatif n'est pas validé ici : aucun ordre réel n'est créé par les tests.
  });

  test("favoris : ajout puis page Mes favoris", async ({ page }) => {
    const slug = await firstProductSlug(page);
    test.skip(!slug, "catalogue vide");
    await page.goto(`/produit/${slug}`);
    await page.getByRole("button", { name: "Ajouter aux favoris" }).first().click();
    await expect(page.getByText("Ajouté à vos favoris")).toBeVisible();
    await page.goto("/favoris");
    await expect(page.locator(`main a[href="/produit/${slug}"]`).first()).toBeVisible();
  });
});
