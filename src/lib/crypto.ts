import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const hmacHex = (secret: string, payload: string) => createHmac("sha256", secret).update(payload, "utf8").digest("hex");

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Analyse un en-tête de signature du type « t=123,v1=abc,v1=def ». */
export function parseSignatureHeader(header: string | null) {
  const out: { t?: string; v1: string[] } = { v1: [] };
  (header || "").split(",").forEach((part) => {
    const [k, v] = part.trim().split("=");
    if (k === "t") out.t = v;
    if (k === "v1" && v) out.v1.push(v);
  });
  return out;
}
