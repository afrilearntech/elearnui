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
if (apiBase) {
  try {
    const u = new URL(apiBase);
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

const nextConfig: NextConfig = {
  images: {
    // Skip /_next/image proxy (server-side fetch often times out for Spaces/LAN; browser loads URLs directly).
    unoptimized: true,
    remotePatterns,
  },
};

export default nextConfig;
