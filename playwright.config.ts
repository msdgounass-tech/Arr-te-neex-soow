import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout (GOUNASS LUXURY). Ils lisent le catalogue réel (Supabase, clé publique)
 * mais ne créent JAMAIS de commande, de message ni d'inscription : les formulaires
 * sont vérifiés jusqu'au récapitulatif, sans validation finale.
 *
 *   npm run build && npm run e2e
 */
const PORT = Number(process.env.E2E_PORT || 3100);

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
    locale: "fr-FR",
    launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
