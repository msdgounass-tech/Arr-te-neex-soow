import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dur, ease } from "../../src/lib/motion/tokens.ts";

const css = readFileSync(new URL("../../src/styles/motion.css", import.meta.url), "utf8");
const cssVar = (name: string) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();

test("courbes identiques en CSS et en TypeScript", () => {
  for (const [key, name] of [["out", "ease-out"], ["inOut", "ease-in-out"], ["drawer", "ease-drawer"]] as const) {
    assert.equal(cssVar(name), `cubic-bezier(${ease[key].join(", ")})`);
  }
});

test("durées identiques en CSS et en TypeScript", () => {
  for (const [key, value] of Object.entries(dur)) {
    const name = key === "stagger" ? "stagger" : `dur-${key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}`;
    assert.equal(cssVar(name), `${Math.round(value * 1000)}ms`, name);
  }
});

test("aucune courbe interdite dans le CSS d'animation", () => {
  assert.doesNotMatch(css, /transition:\s*all/);
  assert.doesNotMatch(css, /scale\(0\)/);
  assert.doesNotMatch(css, /\bease-in\b(?!-out)/);
});
