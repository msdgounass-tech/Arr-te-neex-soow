// Télécharge les visuels éditoriaux par défaut dans public/images pour les héberger avec le site.
// Usage : npm run fetch-images — puis, dans src/lib/site.ts, remplacez les URL de DEFAULT_IMAGES
// par "/images/hero.jpg" et "/images/accessoires.jpg".
import { writeFile, mkdir } from "node:fs/promises";

const files = {
  "hero.jpg": "https://cdn.alexya.ai/dd67244e-5214-4dfd-a952-36d82038cb1a/images/output/generated-1793807740525.jpg",
  "accessoires.jpg": "https://cdn.alexya.ai/dd67244e-5214-4dfd-a952-36d82038cb1a/images/output/generated-1793807737717.jpg",
};
await mkdir("public/images", { recursive: true });
for (const [name, url] of Object.entries(files)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  await writeFile(`public/images/${name}`, Buffer.from(await res.arrayBuffer()));
  console.log("✓", name);
}
