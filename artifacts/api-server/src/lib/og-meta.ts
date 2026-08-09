/**
 * Server-side Open Graph meta tag injection for invitation pages.
 *
 * WhatsApp, Telegram, Facebook, and other crawlers do NOT execute JavaScript,
 * so a React SPA cannot update <meta> tags dynamically for social previews.
 * Instead, we intercept invitation URLs in the Express layer, fetch the
 * invitation from the DB, and inject personalised OG tags into the HTML
 * before serving it.
 */

import { db, invitationTable, cardDesignTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SITE_URL = "https://wedinstudio.com";
const FALLBACK_IMAGE = `${SITE_URL}/og-image.png`;

/** The 6-digit YYMMDD code used in public invitation URLs */
function publicDateCode(eventDate: string | null | undefined): string | null {
  if (!eventDate) return null;
  const d = new Date(eventDate);
  if (isNaN(d.getTime())) return null;
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

interface InvitationOgData {
  /** Display name — cover name preferred, falls back to main name */
  groomDisplayName: string;
  brideName: string;
  eventDate: string | null;
  /** R2 key from card_design.card_image_url for the design used by this invitation */
  designCardImageUrl: string | null;
  eventTitle: string | null;
}

const INVITE_SELECT = {
  coverGroomName: invitationTable.coverGroomName,
  coverBrideName: invitationTable.coverBrideName,
  groomName: invitationTable.groomName,
  brideName: invitationTable.brideName,
  eventDate: invitationTable.eventDate,
  eventTitle: invitationTable.eventTitle,
  designCode: invitationTable.designCode,
  lockedSlug: invitationTable.lockedSlug,
} as const;

/**
 * Resolve the invitation row into display data, joining card_design
 * to get the card image URL for the OG thumbnail.
 */
async function toOgData(row: {
  coverGroomName: string | null;
  coverBrideName: string | null;
  groomName: string | null;
  brideName: string | null;
  eventDate: string | null;
  eventTitle: string | null;
  designCode: string | null;
}): Promise<InvitationOgData> {
  let designCardImageUrl: string | null = null;
  if (row.designCode) {
    const designs = await db
      .select({ cardImageUrl: cardDesignTable.cardImageUrl })
      .from(cardDesignTable)
      .where(eq(cardDesignTable.designCode, row.designCode))
      .limit(1);
    designCardImageUrl = designs[0]?.cardImageUrl ?? null;
  }

  return {
    groomDisplayName: row.coverGroomName || row.groomName || "",
    brideName: row.coverBrideName || row.brideName || "",
    eventDate: row.eventDate,
    designCardImageUrl,
    eventTitle: row.eventTitle,
  };
}

/** Look up invitation by the public slug URL (/invite/:dateCode/:slug) */
async function findBySlug(dateCode: string, slug: string): Promise<InvitationOgData | null> {
  const slugify = (s: string | null | undefined) =>
    (s ?? "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // Fast path — paid invitations store lockedSlug
  const byLocked = await db
    .select(INVITE_SELECT)
    .from(invitationTable)
    .where(eq(invitationTable.lockedSlug, slug))
    .limit(1);

  if (byLocked.length && publicDateCode(byLocked[0].eventDate) === dateCode) {
    return toOgData(byLocked[0]);
  }

  // Slow path — scan all invitations for matching dateCode + cover/main names
  const candidates = await db.select(INVITE_SELECT).from(invitationTable);

  const match = candidates.find((c) => {
    if (publicDateCode(c.eventDate) !== dateCode) return false;
    const g = slugify(c.coverGroomName || c.groomName);
    const b = slugify(c.coverBrideName || c.brideName);
    return slug === (g && b ? `${g}-${b}` : g || b);
  });

  return match ? toOgData(match) : null;
}

/** Look up invitation by its internal token (/invite/:token) */
async function findByToken(token: string): Promise<InvitationOgData | null> {
  if (!token || token === "demo" || token === "demo-en") return null;
  const rows = await db
    .select(INVITE_SELECT)
    .from(invitationTable)
    .where(eq(invitationTable.token, token))
    .limit(1);
  if (!rows[0]) return null;
  return toOgData(rows[0]);
}

/** Build the public R2 image URL from a stored card_design key */
function ogImageUrl(designCardImageUrl: string | null | undefined): string {
  if (!designCardImageUrl) return FALLBACK_IMAGE;
  // card_design.card_image_url keys use the wed_card_design/ prefix — publicly accessible via /api/r2
  if (designCardImageUrl.startsWith("wed_card_design/")) {
    return `${SITE_URL}/api/r2?key=${encodeURIComponent(designCardImageUrl)}`;
  }
  return FALLBACK_IMAGE;
}

/** Format event date as "14 Ogos 2026" */
function formatEventDate(eventDate: string | null): string {
  if (!eventDate) return "";
  const d = new Date(eventDate);
  if (isNaN(d.getTime())) return eventDate;
  return d.toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" });
}

/** Escape text for safe inclusion in HTML attribute values */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Inject invitation-specific OG meta tags into the base HTML string.
 * Replaces the generic og:title, og:description, og:image, og:url,
 * twitter:title, twitter:description, twitter:image, and <title> tags.
 */
export function injectOgTags(
  html: string,
  data: InvitationOgData,
  canonicalUrl: string,
): string {
  const groomName = data.groomDisplayName || "";
  const brideName = data.brideName || "";
  const couple = groomName && brideName ? `${groomName} & ${brideName}` : groomName || brideName;
  const dateStr = formatEventDate(data.eventDate);
  const title = couple
    ? `Jemputan Perkahwinan ${couple} | Wedinstudio`
    : "Jemputan Perkahwinan Digital | Wedinstudio";
  const description = couple && dateStr
    ? `Anda dijemput ke majlis perkahwinan ${couple} pada ${dateStr}. Buka jemputan digital anda di sini.`
    : "Anda dijemput! Buka jemputan perkahwinan digital anda di sini.";
  const image = ogImageUrl(data.designCardImageUrl);

  const replacements: [RegExp, string][] = [
    // <title>
    [/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`],
    // og:title
    [/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`],
    // og:description
    [/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`],
    // og:image
    [/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(image)}" />`],
    // og:image:width / og:image:height — remove fixed dimensions since images vary
    [/<meta property="og:image:width"[^>]*>\s*/, ""],
    [/<meta property="og:image:height"[^>]*>\s*/, ""],
    // og:url
    [/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(canonicalUrl)}" />`],
    // og:type
    [/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="website" />`],
    // twitter:title
    [/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`],
    // twitter:description
    [/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(description)}" />`],
    // twitter:image
    [/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${esc(image)}" />`],
    // canonical
    [/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(canonicalUrl)}" />`],
  ];

  let result = html;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export { findBySlug, findByToken };
