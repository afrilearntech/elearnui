/**
 * Next.js `/_next/image` fetches remote URLs on the **server** to resize/optimize.
 * That often fails or times out for: LAN hosts, HTTP APIs, and public CDNs (e.g. DigitalOcean Spaces)
 * when the dev server has no/slow outbound access — while the **browser** can still load the same URL.
 *
 * Use `unoptimized` for those `src` values so the browser requests the image directly (like `<img>`).
 * Paths under `public` (`/...`) and `data:` URLs keep using the optimizer where appropriate.
 */

/**
 * True → pass `unoptimized` to `next/image` / `SafeImage` so the image is not proxied through `/_next/image`.
 */
export function shouldUnoptimizeRemoteImage(src: string): boolean {
  if (!src) return true;
  if (src.startsWith("/") || src.startsWith("data:")) return false;

  try {
    const u = new URL(src, "http://local.invalid");
    if (u.protocol === "blob:") return true;
    if (u.protocol === "http:" || u.protocol === "https:") return true;
    return true;
  } catch {
    return true;
  }
}
