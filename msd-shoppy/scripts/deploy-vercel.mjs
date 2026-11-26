import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
const TEAM = "team_qlNgA5iMZrV4bVat4kgZs1cF", PROJECT = "prj_09oRPL6o5je5Gxl2tVYMaFpN9ylT";
const H = { Authorization: "Bearer proxyinjected" };
const files = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean)
  .filter((f) => !f.startsWith("supabase/tests/") && !f.startsWith("tests/") && !f.startsWith("scripts/"));
const list = [];
let n = 0;
for (const f of files) {
  const buf = readFileSync(f);
  const sha = createHash("sha1").update(buf).digest("hex");
  const r = await fetch(`https://api.vercel.com/v2/files?teamId=${TEAM}`, { method: "POST", headers: { ...H, "Content-Type": "application/octet-stream", "x-vercel-digest": sha, "Content-Length": String(buf.length) }, body: buf });
  if (!r.ok) { console.log("échec envoi", f, r.status, await r.text()); process.exit(1); }
  list.push({ file: f, sha, size: buf.length }); n++;
}
console.log(`${n} fichiers envoyés`);
const r = await fetch(`https://api.vercel.com/v13/deployments?teamId=${TEAM}&skipAutoDetectionConfirmation=1`, {
  method: "POST", headers: { ...H, "Content-Type": "application/json" },
  body: JSON.stringify({ name: "msd-shoppy", project: PROJECT, target: "production", files: list,
    projectSettings: { framework: "nextjs", nodeVersion: "22.x", rootDirectory: null } }),
});
const d = await r.json();
if (!r.ok) { console.log("échec déploiement", r.status, JSON.stringify(d).slice(0, 500)); process.exit(1); }
console.log("déploiement", d.id, d.url, d.readyState);
