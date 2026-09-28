import type { NextConfig } from "next";

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [
  {
    protocol: "https",
    hostname: "afrilearnspace.ams3.digitaloceanspaces.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "images.unsplash.com",
    pathname: "/**",
  },
  // HTTP + LAN/dev hosts (game assets like /assets/word_games/…)
  { protocol: "http", hostname: "localhost", pathname: "/**" },
  { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
  { protocol: "http", hostname: "10.42.0.1", pathname: "/**" },
  { protocol: "https", hostname: "localhost", pathname: "/**" },
  { protocol: "https", hostname: "127.0.0.1", pathname: "/**" },
];

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
let apiOrigin = "";
if (apiBase) {
  try {
    const u = new URL(apiBase);
    apiOrigin = u.origin;
    const protocol = u.protocol === "https:" ? "https" : "http";
    const hostname = u.hostname;
    const exists = remotePatterns.some(
      (p) => p.hostname === hostname && p.protocol === protocol
    );
    if (hostname && !exists) {
      remotePatterns.push({
        protocol,
        hostname,
        pathname: "/**",
      });
    }
  } catch {
    /* ignore invalid env */
  }
}

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `img-src 'self' data: blob: https://afrilearnspace.ams3.digitaloceanspaces.com https://images.unsplash.com${apiOrigin ? ` ${apiOrigin}` : ""}`,
  `media-src 'self' data: blob:${apiOrigin ? ` ${apiOrigin}` : ""}`,
  `connect-src 'self' https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com${apiOrigin ? ` ${apiOrigin}` : ""}`,
  `frame-src 'self' blob:${apiOrigin ? ` ${apiOrigin}` : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
  ...(!isDevelopment
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    // Skip /_next/image proxy (server-side fetch often times out for Spaces/LAN; browser loads URLs directly).
    unoptimized: true,
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
