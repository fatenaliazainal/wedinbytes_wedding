import { Router, type IRouter } from "express";
import { db, cardTable, invitationTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import multer from "multer";
import { deleteImage, uploadImage, downloadImage, isR2Configured } from "../services/cloudflare/r2-storage-admin";
import { auditEvent, canManageInvitation, requireAdmin, r2RateLimit, uploadConcurrencyGuard } from "../lib/security";
import { hasPngAlphaChannel, inspectImage, type SupportedImageMime } from "../lib/image-validation";
import { invitationHasFeature } from "../lib/pricing-features";
import { isEventDatePassed } from "../lib/invitation-expiration";

const router: IRouter = Router();

// ── In-memory R2 image cache ─────────────────────────────────────────────────
// Avoids a round-trip to Cloudflare R2 on every request for the same image.
// Design/card images are effectively static; 30-minute TTL is conservative.
const R2_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const R2_CACHE_MAX_ENTRIES = 200;
interface R2CacheEntry {
  buffer: Buffer;
  contentType: string;
  etag: string;
  cachedAt: number;
}
const r2Cache = new Map<string, R2CacheEntry>();

function r2CacheGet(key: string): R2CacheEntry | null {
  const entry = r2Cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > R2_CACHE_TTL_MS) {
    r2Cache.delete(key);
    return null;
  }
  return entry;
}

function r2CacheSet(key: string, entry: R2CacheEntry): void {
  // Evict oldest entries when at capacity
  if (r2Cache.size >= R2_CACHE_MAX_ENTRIES) {
    const oldest = [...r2Cache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt)[0];
    if (oldest) r2Cache.delete(oldest[0]);
  }
  r2Cache.set(key, entry);
}

// ── Multer configuration (memory storage) ────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(null, ok);
  },
});
const logoUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp)$/.test(file.mimetype);
    cb(null, ok);
  },
});
const initialsUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype === "image/png"),
});
const giftQrUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp)$/.test(file.mimetype);
    cb(null, ok);
  },
});

// Serve R2 object keys through the same origin when no public R2 domain is configured.
// This keeps uploaded gallery images visible without exposing storage credentials.
router.get("/r2", r2RateLimit, async (req, res) => {
  const key = typeof req.query.key === "string" ? req.query.key : "";
  const allowedPrefixes = ["wed_card_design/", "gallery/", "initials/", "logos/", "business-logos/", "gift-qr/", "wax_seals/", "registry-thumb/", "DisplayWebsiteMockup/"];
  if (!key || key.includes("..") || key.startsWith("/")
    || !allowedPrefixes.some((prefix) => key.startsWith(prefix))) {
    res.status(400).json({ error: "A valid R2 object key is required" });
    return;
  }
  if (!isR2Configured()) {
    res.status(503).json({ error: "Photo storage is not configured" });
    return;
  }
  try {
    // 1. Check server-side cache first
    const cached = r2CacheGet(key);
    const etag = cached?.etag ?? null;

    // 2. Honour If-None-Match — return 304 without touching R2
    const clientEtag = req.headers["if-none-match"];
    if (etag && clientEtag && clientEtag === etag) {
      res.setHeader("ETag", etag);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.status(304).end();
      return;
    }

    // 3. Serve from cache (no R2 call)
    if (cached) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("ETag", cached.etag);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(cached.buffer);
      return;
    }

    // 4. Cache miss — fetch from R2 and populate cache
    const image = await downloadImage(key);
    const newEtag = image.etag ?? `"${image.size}-${Date.now()}"`;
    r2CacheSet(key, {
      buffer: image.buffer,
      contentType: image.contentType,
      etag: newEtag,
      cachedAt: Date.now(),
    });
    res.setHeader("Content-Type", image.contentType);
    res.setHeader("ETag", newEtag);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(image.buffer);
  } catch (err) {
    req.log.error({ err, key }, "Failed to serve R2 image");
    res.status(404).json({ error: "Image not found" });
  }
});

function stripNulls<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v])
  ) as T;
}

// ── List all cards (for Raw Card tab in admin) ────────────────────────────────
// Returns card rows mapped to { id, name, path, category }.
// The frontend resolves the stored key through the same-origin R2 proxy.
router.get("/cards", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: cardTable.id,
        name: cardTable.name,
        path: cardTable.path,
        category: cardTable.category,
        updatedAt: cardTable.updatedAt,
        createdAt: cardTable.createdAt ,
      })
      .from(cardTable)
      .orderBy(cardTable.id);

    const cards = rows.map((row) => ({
      id: row.id,
      name: row.name,
      path: row.path ?? "",
      category: row.category ?? "design",
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
    }));

    res.json(cards);
  } catch (err) {
    req.log.error({ err }, "Failed to list cards");
    res.status(500).json({ error: "Failed to list cards" });
  }
});

// ── Create raw card with image upload ────────────────────────────────────────
router.post("/raw-card", requireAdmin, upload.single("file"), async (req, res) => {
  if (!isR2Configured()) {
    res.status(503).json({
      error:
        "Photo storage is not configured. The server administrator must set the R2 account credentials and the environment-specific bucket name before uploads will work.",
    });
    return;
  }

  try {
    const body = req.body as Record<string, unknown>;
    
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "Image file is required (jpeg/png/webp/gif, max 10 MB)" });
      return;
    }

    // Determine MIME type for R2 upload
    const mimeType = req.file.mimetype as SupportedImageMime;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
      res.status(400).json({ error: "Invalid image type" });
      return;
    }
    try {
      inspectImage(req.file.buffer, mimeType);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid image dimensions" });
      return;
    }

    // Upload image to R2 storage
    const imageKey = await uploadImage({
      fileName: req.file.originalname,
      fileBuffer: req.file.buffer,
      contentType: mimeType,
      folder: "wed_card_design",
      metadata: { name: body.name as string },
    });

    // Save card record to database
    const [created] = await db
      .insert(cardTable)
      .values({
        name: body.name.trim() as string,
        path: imageKey,
        category: (body.category as string) || "design",
      })
      .returning();

    auditEvent(req, "raw_card.create", { cardId: created.id });
    res.status(201).json(stripNulls(created));
  } catch (err) {
    req.log.error({ err }, "Failed to create raw card");
    res.status(500).json({ error: "Failed to create card" });
  }
});

// ── Upload a gallery image to R2 (returns the storage key) ─────────────────────
router.post("/gallery-upload", upload.single("file"), async (req, res) => {
  if (!isR2Configured()) {
    res.status(503).json({
      error:
        "Photo storage is not configured. The server administrator must set the R2 account credentials and the environment-specific bucket name before uploads will work.",
    });
    return;
  }

  try {
    if (!req.file) {
      res.status(400).json({ error: "Image file is required (jpeg/png/webp/gif, max 10 MB)" });
      return;
    }

    const mimeType = req.file.mimetype as SupportedImageMime;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
      res.status(400).json({ error: "Invalid image type" });
      return;
    }

    try {
      inspectImage(req.file.buffer, mimeType);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid image dimensions" });
      return;
    }

    const invitationToken = typeof (req.body.invitationToken || req.query.invitationToken) === "string"
      ? String(req.body.invitationToken || req.query.invitationToken).trim()
      : "";
    if (!invitationToken) {
      res.status(400).json({ error: "Invitation token is required." });
      return;
    }
    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.token, invitationToken))
      .limit(1);
    if (!invitation) {
      res.status(404).json({ error: "Invitation not found." });
      return;
    }
    if (!(await canManageInvitation(req, invitation))) {
      res.status(403).json({ error: "You do not own this invitation." });
      return;
    }
    if (req.session.role !== "admin" && invitation.isPurchased && isEventDatePassed(invitation.eventDate)) {
      res.status(423).json({ error: "This paid invitation is locked because its event date has passed." });
      return;
    }
    const imageKey = await uploadImage({
      fileName: req.file.originalname,
      fileBuffer: req.file.buffer,
      contentType: mimeType,
      folder: `gallery/${invitationToken}`,
      metadata: { uploadedAt: new Date().toISOString(), invitationToken },
    });

    auditEvent(req, "invitation.gallery_upload", { invitationToken });
    res.json({ key: imageKey });
  } catch (err) {
    req.log.error({ err }, "Failed to upload gallery image");
    res.status(500).json({ error: "Failed to upload gallery image" });
  }
});

// ── Upload one premium money-gift QR image for an invitation ────────────────
router.post("/gift-qr-upload", giftQrUpload.single("file"), async (req, res) => {
  if (!isR2Configured()) {
    res.status(503).json({ error: "Photo storage is not configured." });
    return;
  }
  try {
    if (!req.file) {
      res.status(400).json({ error: "QR image is required (jpeg/png/webp, max 5 MB)." });
      return;
    }
    const invitationToken = typeof (req.body.invitationToken || req.query.invitationToken) === "string"
      ? String(req.body.invitationToken || req.query.invitationToken).trim()
      : "";
    if (!invitationToken) {
      res.status(400).json({ error: "Invitation token is required." });
      return;
    }
    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.token, invitationToken))
      .limit(1);
    if (!invitation) {
      res.status(404).json({ error: "Invitation not found." });
      return;
    }
    if (!(await canManageInvitation(req, invitation))) {
      res.status(403).json({ error: "You do not own this invitation." });
      return;
    }
    if (req.session.role !== "admin" && invitation.isPurchased && isEventDatePassed(invitation.eventDate)) {
      res.status(423).json({ error: "This paid invitation is locked because its event date has passed." });
      return;
    }
    if (invitationToken !== "demo" && !(await invitationHasFeature(invitation, "Money Gift"))) {
      res.status(403).json({ error: "Money Gift is available with the Premium package." });
      return;
    }
    const existing = Array.isArray(invitation.giftQrCodes) ? invitation.giftQrCodes : [];
    if (existing.length >= 2) {
      res.status(400).json({ error: "You can upload up to 2 gift QR images." });
      return;
    }
    const mimeType = req.file.mimetype as SupportedImageMime;
    try {
      inspectImage(req.file.buffer, mimeType);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid image dimensions" });
      return;
    }
    const imageKey = await uploadImage({
      fileName: req.file.originalname,
      fileBuffer: req.file.buffer,
      contentType: mimeType,
      folder: `gift-qr/${invitationToken}`,
      metadata: { uploadedAt: new Date().toISOString(), invitationToken },
    });
    auditEvent(req, "invitation.gift_qr_upload", { invitationToken });
    res.json({ key: imageKey });
  } catch (err) {
    req.log.error({ err }, "Failed to upload gift QR image");
    res.status(500).json({ error: "Failed to upload gift QR image." });
  }
});

// ── Upload a small initials/logo image for an invitation ─────────────────────
router.post("/logo-upload", logoUpload.single("file"), async (req, res) => {
  if (!isR2Configured()) {
    res.status(503).json({ error: "Photo storage is not configured." });
    return;
  }
  try {
    if (!req.file) {
      res.status(400).json({ error: "Logo image is required (jpeg/png/webp, max 2 MB)" });
      return;
    }
    const mimeType = req.file.mimetype as SupportedImageMime;
    const invitationToken = typeof (req.body.invitationToken || req.query.invitationToken) === "string"
      ? String(req.body.invitationToken || req.query.invitationToken).trim()
      : "";
    if (!invitationToken) {
      res.status(400).json({ error: "Invitation token is required." });
      return;
    }
    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.token, invitationToken))
      .limit(1);
    if (!invitation) {
      res.status(404).json({ error: "Invitation not found." });
      return;
    }
    if (!(await canManageInvitation(req, invitation))) {
      res.status(403).json({ error: "You do not own this invitation." });
      return;
    }
    if (req.session.role !== "admin" && invitation.isPurchased && isEventDatePassed(invitation.eventDate)) {
      res.status(423).json({ error: "This paid invitation is locked because its event date has passed." });
      return;
    }
    try {
      inspectImage(req.file.buffer, mimeType);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid image dimensions" });
      return;
    }
    const imageKey = await uploadImage({
      fileName: req.file.originalname,
      fileBuffer: req.file.buffer,
      contentType: mimeType,
      folder: `logos/${invitationToken}`,
      metadata: { uploadedAt: new Date().toISOString(), invitationToken },
    });
    auditEvent(req, "invitation.logo_upload", { invitationToken });
    res.json({ key: imageKey });
  } catch (err) {
    req.log.error({ err }, "Failed to upload initials logo");
    res.status(500).json({ error: "Failed to upload logo" });
  }
});

// ── Upload optional initials artwork for the invitation's own order ──────────
// The storage record belongs to the order, not card_design or invitation. An
// invitation may have more than one order, so the newest linked order is used.
router.post("/order-initials-upload", initialsUpload.single("file"), async (req, res) => {
  if (!isR2Configured()) {
    res.status(503).json({ error: "Photo storage is not configured." });
    return;
  }
  try {
    if (!req.file) {
      res.status(400).json({ error: "Initials image is required (transparent PNG, max 2 MB)." });
      return;
    }
    const invitationToken = typeof req.body.invitationToken === "string"
      ? req.body.invitationToken.trim()
      : "";
    if (!invitationToken) {
      res.status(400).json({ error: "Invitation token is required." });
      return;
    }

    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.token, invitationToken))
      .limit(1);
    if (!invitation) {
      res.status(404).json({ error: "Invitation not found." });
      return;
    }
    if (!(await canManageInvitation(req, invitation))) {
      res.status(403).json({ error: "You do not own this invitation." });
      return;
    }
    if (req.session.role !== "admin" && invitation.isPurchased && isEventDatePassed(invitation.eventDate)) {
      res.status(423).json({ error: "This paid invitation is locked because its event date has passed." });
      return;
    }

    if (req.file.mimetype !== "image/png" || !hasPngAlphaChannel(req.file.buffer)) {
      res.status(400).json({ error: "Initials artwork mesti PNG dengan transparent background." });
      return;
    }
    try {
      inspectImage(req.file.buffer, "image/png");
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid image dimensions" });
      return;
    }

    const mimeType = "image/png" as const;
    const imageKey = await uploadImage({
      fileName: req.file.originalname,
      fileBuffer: req.file.buffer,
      contentType: mimeType,
      folder: `initials/${invitation.token}`,
      objectKey: "initials.png",
      metadata: {
        uploadedAt: new Date().toISOString(),
        type: "invitation-initials",
        invitationToken,
      },
    });

    const [updatedInvitation] = await db
      .update(invitationTable)
      .set({ initialsImageUrl: imageKey })
      .where(eq(invitationTable.id, invitation.id))
      .returning({ id: invitationTable.id, initialsImageUrl: invitationTable.initialsImageUrl });

    auditEvent(req, "invitation.initials_upload", { invitationToken });
    res.json({ invitationId: updatedInvitation.id, key: updatedInvitation.initialsImageUrl });
  } catch (err) {
    req.log.error({ err }, "Failed to upload order initials");
    res.status(500).json({ error: "Failed to upload initials artwork." });
  }
});

// ── Delete raw card ──────────────────────────────────────────────────────────
router.delete("/raw-card/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid card id" });
      return;
    }

    const card = await db
      .select()
      .from(cardTable)
      .where(eq(cardTable.id, id))
      .limit(1);

    if (!card.length) {
      res.status(404).json({ error: "Card not found" });
      return;
    }

    const imageKey = card[0].path;
    let imageDeleted = false;

    // Delete from R2 first with retries
    if (imageKey) {
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          await deleteImage(imageKey);
          imageDeleted = true;
          break;
        } catch (err) {
          if (attempt === 2) {
            req.log.error(
              { err, imageKey },
              "R2 delete failed after retries"
            );
            res.status(500).json({ error: "Failed to delete image from R2" });
            return;
          }
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        }
      }
    } else {
      imageDeleted = true;
    }

    // Delete from database
    try {
      await db.delete(cardTable).where(eq(cardTable.id, id));
    } catch (err) {
      if (imageDeleted) {
        req.log.error(
          { err, cardId: id, imageKey },
          "DB record not deleted after successful R2 removal — orphan record"
        );
      }
      res.status(500).json({ error: "Failed to delete card record" });
      return;
    }

    auditEvent(req, "raw_card.delete", { cardId: id, imageKey });
    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete raw card");
    res.status(500).json({ error: "Failed to delete card" });
  }
});

export default router;
