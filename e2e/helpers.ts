import { expect, type Page } from "@playwright/test";

/** Collecte les erreurs console, exceptions et réponses HTTP en erreur de la page. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`exception: ${e.message}`));
  page.on("response", (r) => {
    const url = r.url();
    // les liens externes (WhatsApp, Supabase Storage…) ne sont pas vérifiés ici
    if (r.status() >= 400 && url.startsWith(new URL(page.url() || "http://localhost").origin)) errors.push(`HTTP ${r.status()} ${url}`);
  });
  return errors;
}

/**
 * Éléments visibles qui dépassent à droite de la fenêtre (débordement horizontal).
 * Ignore ce qui est à l'intérieur d'un conteneur défilant horizontalement (rails, pastilles)
 * et les éléments masqués.
 */
export async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    const scrollsX = (el: Element | null): boolean => {
      for (let p = el?.parentElement; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (["auto", "scroll", "hidden", "clip"].includes(s.overflowX)) return true;
      }
      return false;
    };
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const s = getComputedStyle(el);
      if (s.position === "fixed" || s.visibility === "hidden" || s.opacity === "0") return;
      if (r.right > vw + 1 && !scrollsX(el)) out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} → ${Math.round(r.right)}px`);
    });
    return out.slice(0, 10);
  });
}

export async function expectNoOverflow(page: Page) {
  expect(await horizontalOverflow(page), "débordement horizontal").toEqual([]);
}

/** Premier produit en ligne du catalogue (null si le catalogue est vide). */
export async function firstProductSlug(page: Page): Promise<string | null> {
  await page.goto("/shop");
  const href = await page.locator('main a[href^="/produit/"]').first().getAttribute("href", { timeout: 5000 }).catch(() => null);
  return href ? href.replace("/produit/", "") : null;
}
