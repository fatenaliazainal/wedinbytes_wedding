export function normalizeBusinessHomepageLink(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\/?business(?:\/|$)/i.test(trimmed)) return "";

  let url: URL;
  try {
    url = /^https?:\/\//i.test(trimmed)
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
  } catch {
    return "";
  }

  if (/\/business(?:\/|$)/i.test(url.pathname)) {
    return "";
  }

  return url.toString();
}