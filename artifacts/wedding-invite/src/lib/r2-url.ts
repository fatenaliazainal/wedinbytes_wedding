/**
 * Resolve an image URL from either local public/ assets or Cloudflare R2.
 *
 * Rules:
 *  - Absolute URLs (http/https) → returned as-is.
 *  - Paths starting with "/" → local Vite public asset, returned as-is.
 *  - R2 object keys → same-origin API image proxy.
 *
 * The proxy is intentional here: it keeps every browser-facing image request
 * on the app origin and avoids failures caused by an unset/misconfigured R2
 * public domain or bucket CORS settings.
 */
export function resolveImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  return `/api/r2?key=${encodeURIComponent(path)}`;
}

/**
 * Same-origin fallback for R2 objects. This is useful when a browser cannot
 * load the public R2 hostname because of a stale cache, CORS policy, or a
 * temporary public-domain issue.
 */
export function resolveImageFallbackUrl(path: string | null | undefined): string | undefined {
  if (!path || path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return undefined;
  }
  return `/api/r2?key=${encodeURIComponent(path)}`;
}

export function fallbackToR2Proxy(
  event: React.SyntheticEvent<HTMLImageElement>,
  path: string | null | undefined,
) {
  const fallback = resolveImageFallbackUrl(path);
  const image = event.currentTarget;
  if (fallback && image.src !== new URL(fallback, window.location.origin).href) {
    image.onerror = null;
    image.src = fallback;
  } else {
    image.onerror = null;
  }
}
