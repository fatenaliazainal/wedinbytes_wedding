/**
 * Resolve an image URL from either local public/ assets or Cloudflare R2.
 *
 * Rules:
 *  - Absolute URLs (http/https) → returned as-is.
 *  - Paths starting with "/" → local Vite public asset, returned as-is.
 *  - Anything else → R2 object key, prefixed with VITE_R2_DOMAIN_URL.
 */
const R2_DOMAIN = (import.meta.env.VITE_R2_DOMAIN_URL as string | undefined) ?? "";

export function resolveImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  return R2_DOMAIN.replace(/\/$/, "") + "/" + path;
}
