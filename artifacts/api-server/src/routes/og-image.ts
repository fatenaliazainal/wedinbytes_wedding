/**
 * GET /api/og-image?key=<r2key>
 *
 * Generates a square 1200×1200 JPEG OG thumbnail by:
 *   1. Fetching the design card image from R2
 *   2. Cropping/resizing to a square via sharp (cover strategy)
 *   3. Compositing the Wedinstudio logo centred with reduced opacity
 *
 * WhatsApp, Telegram, Facebook crawlers call this directly — they do NOT run JS.
 */

import { Router, type IRouter } from "express";
import path from "node:path";
import sharp from "sharp";
import { downloadImage, isR2Configured } from "../services/cloudflare/r2-storage-admin";
import { r2RateLimit } from "../lib/security";

const router: IRouter = Router();

// In dev and production, __dirname = dist/ so ../assets/ = artifacts/api-server/assets/
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo-wedinstudio.png");
const OG_SIZE = 1200;          // square px
const LOGO_SIZE = Math.round(OG_SIZE * 0.28); // ~336 px
const LOGO_OPACITY = 0.55;     // 0 – 1

const ALLOWED_PREFIXES = [
  "wed_card_design/", "gallery/", "initials/", "logos/",
  "business-logos/", "gift-qr/", "wax_seals/", "registry-thumb/", "DisplayWebsiteMockup/",
];

/** Simple in-memory cache — 30 min TTL */
const ogCache = new Map<string, { buffer: Buffer; cachedAt: number }>();
const OG_CACHE_TTL = 30 * 60 * 1000;

/**
 * Resize logo to LOGO_SIZE × LOGO_SIZE (contain, transparent bg) then scale
 * every pixel's alpha channel by LOGO_OPACITY so the logo appears semi-transparent.
 */
async function buildLogoOverlay(): Promise<Buffer> {
  // Resize with transparent padding to a square canvas
  const resized = await sharp(LOGO_PATH)
    .resize(LOGO_SIZE, LOGO_SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const channels = info.channels as number; // 4 = RGBA
  // Scale alpha channel in-place
  for (let i = 3; i < data.length; i += channels) {
    data[i] = Math.round(data[i] * LOGO_OPACITY);
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: channels as 1 | 2 | 3 | 4 },
  })
    .png()
    .toBuffer();
}

async function buildOgImage(r2Key: string): Promise<Buffer> {
  // 1. Cache hit
  const cached = ogCache.get(r2Key);
  if (cached && Date.now() - cached.cachedAt < OG_CACHE_TTL) return cached.buffer;

  // 2. Fetch source image from R2
  const r2Image = await downloadImage(r2Key);

  // 3. Resize + crop to square
  const squareBase = await sharp(r2Image.buffer)
    .resize(OG_SIZE, OG_SIZE, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88 })
    .toBuffer();

  // 4. Build logo with opacity
  const logoBuffer = await buildLogoOverlay();

  // 5. Composite logo centred
  const offset = Math.round((OG_SIZE - LOGO_SIZE) / 2);
  const result = await sharp(squareBase)
    .composite([{ input: logoBuffer, top: offset, left: offset, blend: "over" }])
    .jpeg({ quality: 88 })
    .toBuffer();

  ogCache.set(r2Key, { buffer: result, cachedAt: Date.now() });
  return result;
}

router.get("/og-image", r2RateLimit, async (req, res) => {
  const key = typeof req.query.key === "string" ? req.query.key : "";

  if (!key || key.includes("..") || key.startsWith("/")
    || !ALLOWED_PREFIXES.some((p) => key.startsWith(p))) {
    res.status(400).json({ error: "A valid R2 object key is required" });
    return;
  }

  if (!isR2Configured()) {
    res.status(503).json({ error: "Photo storage is not configured" });
    return;
  }

  try {
    const buffer = await buildOgImage(key);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buffer);
  } catch (err) {
    req.log.error({ err, key }, "og-image generation failed");
    res.status(404).json({ error: "Image not available" });
  }
});

export default router;
