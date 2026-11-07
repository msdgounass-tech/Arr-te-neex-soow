import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;
  } catch {
    return undefined;
  }
})();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // NEXT_IMAGE_UNOPTIMIZED=1 : le navigateur charge les images directement (utile en prévisualisation)
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "1",
    formats: ["image/avif", "image/webp"],
    // Illustrations produits locales en SVG : servies en pièce jointe, sans script.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : []),
    ],
  },
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  // Anciennes adresses de la boutique de mode : redirigées vers le catalogue high-tech.
  async redirects() {
    return [
      { source: "/men", destination: "/shop", permanent: true },
      { source: "/women", destination: "/shop", permanent: true },
      { source: "/chaussures", destination: "/shop", permanent: true },
      { source: "/accessories", destination: "/categorie/accessoires-tech", permanent: true },
      { source: "/montres", destination: "/categorie/montres-connectees", permanent: true },
      { source: "/aide", destination: "/faq", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
