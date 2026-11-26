import { test } from "node:test";
import assert from "node:assert/strict";
import { imageSize } from "../../src/lib/image-meta.ts";

test("dimensions PNG lues dans l'en-tête", () => {
  const png = new Uint8Array(24); png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  new DataView(png.buffer).setUint32(16, 1200); new DataView(png.buffer).setUint32(20, 900);
  assert.deepEqual(imageSize(png), { type: "png", width: 1200, height: 900 });
});
test("dimensions WebP (VP8X)", () => {
  const w = new Uint8Array(30); w.set([...Buffer.from("RIFF")], 0); w.set([...Buffer.from("WEBPVP8X")], 8);
  const W = 1599, H = 799; w.set([W & 255, (W >> 8) & 255, W >> 16, H & 255, (H >> 8) & 255, H >> 16], 24);
  assert.deepEqual(imageSize(w), { type: "webp", width: 1600, height: 800 });
});
test("fichier non image refusé", () => assert.equal(imageSize(new TextEncoder().encode("<svg onload=alert(1)>")), null));
