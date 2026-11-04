import "server-only";

const hits = new Map<string, { n: number; reset: number }>();

/** Limiteur simple en mémoire (best effort par instance). Pour une protection forte, utilisez Vercel WAF / Upstash. */
export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  h.n += 1;
  if (hits.size > 5000) hits.clear();
  return h.n <= limit;
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
