/**
 * Resolve an image URL from either local public/ assets or Cloudflare R2.
 *
 * Rules:
 *  - Absolute URLs (http/https) → returned as-is.
 *  - Paths starting with "/" → local Vite public asset, returned as-is.
 *  - R2 object keys → public R2 domain when configured, otherwise the API image proxy.
 */
const R2_DOMAIN = (import.meta.env.VITE_R2_DOMAIN_URL as string | undefined) ?? "";

export function resolveImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  if (R2_DOMAIN) return R2_DOMAIN.replace(/\/$/, "") + "/" + path;
  return `/api/r2?key=${encodeURIComponent(path)}`;
}
