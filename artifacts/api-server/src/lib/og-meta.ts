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
const FALLBACK_IMAGE = `${SITE_URL}/opengraph.jpg`;

/** Malay + English month name → 1-based month number */
const MONTH_NAMES: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  januari: 1, februari: 2, mac: 3, mei: 5, jun: 6, julai: 7,
  ogos: 8, oktober: 10, disember: 12,
};

/**
 * Parse an event date stored in any supported format and return { year, month, day }.
 * Supports ISO (2026-08-11), DD/MM/YYYY, and "11 Ogos 2026" / "11 August 2026".
 * Uses UTC values to avoid timezone drift between server and stored dates.
 */
function parseDateUtc(value: string | null | undefined): { year: number; month: number; day: number } | null {
  const s = (value ?? "").trim();
  if (!s) return null;

  // ISO: 2026-08-11
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3] };

  // DD/MM/YYYY or DD-MM-YYYY
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return { year: +m[3], month: +m[2], day: +m[1] };

  // "11 Ogos 2026" / "11 August 2026"
  m = s.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (m) {
    const monthNum = MONTH_NAMES[m[2]];
    if (monthNum) return { year: +m[3], month: monthNum, day: +m[1] };
  }

  return null;
}

/** The 6-digit YYMMDD code used in public invitation URLs */
function publicDateCode(eventDate: string | null | undefined): string | null {
  const d = parseDateUtc(eventDate);
  if (!d) return null;
  const yy = String(d.year).slice(2);
  const mm = String(d.month).padStart(2, "0");
  const dd = String(d.day).padStart(2, "0");
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
  language: string;
}

const INVITE_SELECT = {
  coverGroomName: invitationTable.coverGroomName,
  coverBrideName: invitationTable.coverBrideName,
  groomName: invitationTable.groomName,
  brideName: invitationTable.brideName,
  eventDate: invitationTable.eventDate,
  eventTitle: invitationTable.eventTitle,
  language: invitationTable.language,
  designCode: invitationTable.designCode,
  lockedSlug: invitationTable.lockedSlug,
  lockedDateCode: invitationTable.lockedDateCode,
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
  language: string | null;
  designCode: string | null;
}): Promise<InvitationOgData> {
  let designCardImageUrl: string | null = null;
  if (row.designCode) {
    const designs = await db
      .select({ cardImageUrl: cardDesignTable.cardImageUrl, envelopeImageUrl: cardDesignTable.envelopeImageUrl })
      .from(cardDesignTable)
      .where(eq(cardDesignTable.designCode, row.designCode))
      .limit(1);
    // Prefer card cover image; fall back to envelope image if cover isn't set
    designCardImageUrl = designs[0]?.cardImageUrl || designs[0]?.envelopeImageUrl || null;
  }

  return {
    groomDisplayName: row.coverGroomName || row.groomName || "",
    brideName: row.coverBrideName || row.brideName || "",
    eventDate: row.eventDate,
    designCardImageUrl,
    eventTitle: row.eventTitle,
    language: row.language || "ms",
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

  if (byLocked.length && (byLocked[0].lockedDateCode === dateCode || publicDateCode(byLocked[0].eventDate) === dateCode)) {
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

/** All prefixes the /api/r2 proxy accepts — keep in sync with cards.ts allowedPrefixes */
const R2_ALLOWED_PREFIXES = [
  "wed_card_design/", "gallery/", "initials/", "logos/",
  "business-logos/", "gift-qr/", "wax_seals/", "registry-thumb/", "DisplayWebsiteMockup/",
];

/** Build the public OG thumbnail URL from a stored R2 key.
 *  Uses /api/og-image which generates a square 1200×1200 JPEG with the
 *  Wedinstudio logo centred — the format WhatsApp/Telegram/FB expect.
 */
function ogImageUrl(designCardImageUrl: string | null | undefined): string {
  if (!designCardImageUrl) return FALLBACK_IMAGE;
  if (R2_ALLOWED_PREFIXES.some((p) => designCardImageUrl.startsWith(p))) {
    return `${SITE_URL}/api/og-image?key=${encodeURIComponent(designCardImageUrl)}`;
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
  const isEn = data.language === "en";
  const eventLabel = data.eventTitle || (isEn ? "Wedding Invitation" : "Jemputan Perkahwinan");
  const title = couple
    ? `${eventLabel} ${couple} | Wedinstudio`
    : `${eventLabel} | Wedinstudio`;
  const description = isEn
    ? (couple && dateStr
        ? `You are invited to the wedding of ${couple} on ${dateStr}. Open your digital invitation here.`
        : "You are invited! Open your digital wedding invitation here.")
    : (couple && dateStr
        ? `Anda dijemput ke majlis perkahwinan ${couple} pada ${dateStr}. Buka jemputan digital anda di sini.`
        : "Anda dijemput! Buka jemputan perkahwinan digital anda di sini.");
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
    // og:image:width / og:image:height — square 1200×1200 for WhatsApp square thumbnail
    [/<meta property="og:image:width"[^>]*>/, `<meta property="og:image:width" content="1200" />`],
    [/<meta property="og:image:height"[^>]*>/, `<meta property="og:image:height" content="1200" />`],
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

/**
 * Build a lightweight standalone HTML page that contains only OG/Twitter
 * meta tags plus an immediate JS/meta redirect for real browsers.
 *
 * Used in development (where dist/index.html doesn't exist) and as a
 * fallback so crawlers always get personalised tags even in dev mode.
 */
export function buildStandaloneOgHtml(data: InvitationOgData, canonicalUrl: string): string {
  const groomName   = data.groomDisplayName || "";
  const brideName   = data.brideName || "";
  const couple      = groomName && brideName ? `${groomName} & ${brideName}` : groomName || brideName;
  const dateStr     = formatEventDate(data.eventDate);
  const isEn        = data.language === "en";
  const eventLabel  = data.eventTitle || (isEn ? "Wedding Invitation" : "Jemputan Perkahwinan");
  const title       = couple
    ? `${eventLabel} ${couple} | Wedinstudio`
    : `${eventLabel} | Wedinstudio`;
  const description = isEn
    ? (couple && dateStr
        ? `You are invited to the wedding of ${couple} on ${dateStr}. Open your digital invitation here.`
        : "You are invited! Open your digital wedding invitation here.")
    : (couple && dateStr
        ? `Anda dijemput ke majlis perkahwinan ${couple} pada ${dateStr}. Buka jemputan digital anda di sini.`
        : "Anda dijemput! Buka jemputan perkahwinan digital anda di sini.");
  const image = ogImageUrl(data.designCardImageUrl);

  return `<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonicalUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${esc(canonicalUrl)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="1200" />
<meta property="og:site_name" content="Wedinstudio" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<meta http-equiv="refresh" content="0; url=${esc(canonicalUrl)}" />
<script>window.location.replace(${JSON.stringify(canonicalUrl)});</script>
</head>
<body></body>
</html>`;
}

/** Returns true when the User-Agent belongs to a link-preview crawler. */
export function isCrawler(ua: string | undefined): boolean {
  if (!ua) return false;
  return /whatsapp|facebookexternalhit|telegrambot|twitterbot|linkedinbot|slackbot|discordbot|applebot|googlebot|bingbot|duckduckbot|baiduspider|yandexbot|ia_archiver/i.test(ua);
}

export { findBySlug, findByToken };
