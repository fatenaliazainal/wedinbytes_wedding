import { Router, type IRouter } from "express";
import { GetActiveDesignResponse, ListDesignsResponse, ActivateDesignResponse } from "@workspace/api-zod";
import { db, cardDesignTable } from "@workspace/db";
import { eq, ilike, and, or, sql, type SQL } from "drizzle-orm";
import multer from "multer";
import { isR2Configured, uploadImage } from "../services/cloudflare/r2-storage-admin";
import { auditEvent, requireAdmin } from "../lib/security";
import { inspectImage, type SupportedImageMime } from "../lib/image-validation";

const router: IRouter = Router();

const upload = multer({
  // Card design artwork is durable application data, so keep it in R2 rather
  // than the API/frontend container filesystem.
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(null, ok);
  },
});

const ALLOWED_DESIGN_FIELDS = [
  "envelopeImageUrl","cardImageUrl","thumbnailImageUrl","musicUrl","musicTitle","musicArtist",
  "colorPrimary","colorSecondary","colorAccent","colorBackground","colorCard","colorForeground","colorHeading","colorMuted",
  "fontHeading","fontBody","nameFontFamily","nameFontSize","badgeFontSize","greetingFontSize","nameColor","greetingColor",
  "cardMaxWidth","openingAnimation","designCode","openButtonText","name",
  "contentOverlayColor","contentOverlayOpacity","overlayEnabled","waxSealId",
  "colors","category",
];

function stripNulls<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v])
  ) as T;
}

// ── Upload image ─────────────────────────────────────────────────────────────
router.post("/upload", requireAdmin, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File too large — maximum size is 20 MB." });
      } else {
        res.status(400).json({ error: err.message ?? "Upload failed." });
      }
      return;
    }
    if (!isR2Configured()) {
      res.status(503).json({
        error: "Card design storage is not configured. Add the CF_R2_* secrets before uploading designs.",
      });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No valid image uploaded (jpeg/png/webp/gif, max 20 MB)" });
      return;
    }
    const designCode = typeof req.body.designCode === "string"
      ? req.body.designCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "")
      : "";
    const assetType = req.body.assetType === "envelope"
      ? "envelope"
      : req.body.assetType === "thumbnail"
        ? "thumbnail"
        : "card";
    if (!designCode) {
      res.status(400).json({ error: "Design code is required for image upload." });
      return;
    }
    const mimeType = req.file.mimetype as SupportedImageMime;
    try {
      inspectImage(req.file.buffer, mimeType);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid image dimensions" });
      return;
    }
    const extension = mimeType === "image/jpeg"
      ? "jpg"
      : mimeType.replace("image/", "");
    // Include a timestamp in the key so each upload produces a unique URL.
    // Same-key re-uploads hit the 1-hour browser cache on the R2 proxy and
    // the new image would not be visible until the cache expires.
    const objectKey = `${designCode}-${assetType}-${Date.now()}.${extension}`;
    uploadImage({
      fileName: req.file.originalname,
      fileBuffer: req.file.buffer,
      contentType: mimeType,
      folder: "wed_card_design",
      objectKey,
      metadata: { uploadedAt: new Date().toISOString(), type: "card-design", designCode, assetType },
    })
      .then((key) => {
        auditEvent(req, "design.asset_upload", { designCode, assetType });
        res.json({ key, url: key });
      })
      .catch((uploadError) => {
        req.log.error({ err: uploadError }, "Failed to upload card design image to R2");
        res.status(500).json({ error: "Failed to upload card design image." });
      });
  });
});

// ── Get active design ────────────────────────────────────────────────────────
router.get("/design/active", async (req, res) => {
  try {
    const rows = await db.select().from(cardDesignTable).where(eq(cardDesignTable.isActive, true)).limit(1);
    if (!rows.length) {
      res.status(404).json({ error: "No active design found" });
      return;
    }
    res.json(stripNulls(rows[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to get active design");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── List designs ─────────────────────────────────────────────────────────────
// Admins see all designs; everyone else sees only active (catalog-visible) ones.
// Optional query params: search (name/designCode), color (exact tag), category (exact match).
router.get("/design", async (req, res) => {
  try {
    const isAdmin = req.session.role === "admin";
    const { search, color, category } = req.query as Record<string, string | undefined>;

    const conditions: SQL[] = [];

    // Visibility — non-admins only see active designs
    if (!isAdmin) conditions.push(eq(cardDesignTable.isActive, true));

    // Search by name or design code (case-insensitive partial match)
    if (search?.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(or(
        ilike(cardDesignTable.name, pattern),
        ilike(cardDesignTable.designCode, pattern),
      ) as SQL);
    }

    // Filter by category (exact match, case-insensitive)
    if (category?.trim()) {
      conditions.push(ilike(cardDesignTable.category, category.trim()));
    }

    const rows = await db
      .select()
      .from(cardDesignTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(cardDesignTable.id);

    // Filter by color in JS — jsonb @> requires a cast and the array is small
    const filtered = color?.trim()
      ? rows.filter((r) => Array.isArray(r.colors) && r.colors.includes(color.trim()))
      : rows;

    res.json(filtered.map(stripNulls));
  } catch (err) {
    req.log.error({ err }, "Failed to list designs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Create design ────────────────────────────────────────────────────────────
router.post("/design", requireAdmin, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    // Auto-generate design code if not supplied
    let designCode = (body.designCode as string | undefined)?.trim();
    if (!designCode) {
      const existing = await db.select({ id: cardDesignTable.id }).from(cardDesignTable);
      designCode = `FL${String(existing.length + 1).padStart(3, "0")}`;
    }

    // New designs start inactive — admin must explicitly show them in the catalog.
    const insert: Record<string, unknown> = {
      name: body.name.trim(),
      isActive: false,
      designCode,
    };
    for (const field of ALLOWED_DESIGN_FIELDS) {
      if (field === "designCode" || field === "name") continue;
      if (field in body && body[field] !== "") insert[field] = body[field];
    }
    const [created] = await db.insert(cardDesignTable).values(insert as never).returning();
    auditEvent(req, "design.create", { designId: created.id, designCode });
    res.status(201).json(stripNulls(created));
  } catch (err) {
    req.log.error({ err }, "Failed to create design");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update design ────────────────────────────────────────────────────────────
router.patch("/design/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid design id" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    for (const field of ALLOWED_DESIGN_FIELDS) {
      if (field in body) update[field] = body[field];
    }
    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }
    const [updated] = await db
      .update(cardDesignTable)
      .set(update)
      .where(eq(cardDesignTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Design not found" });
      return;
    }
    res.json(stripNulls(updated));
    auditEvent(req, "design.update", { designId: id, fields: Object.keys(update) });
  } catch (err) {
    req.log.error({ err }, "Failed to update design");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Toggle catalog visibility ─────────────────────────────────────────────────
// Flips isActive for the given design independently of all other designs.
router.post("/design/:id/activate", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid design id" });
      return;
    }
    const [current] = await db
      .select({ isActive: cardDesignTable.isActive })
      .from(cardDesignTable)
      .where(eq(cardDesignTable.id, id))
      .limit(1);
    if (!current) {
      res.status(404).json({ error: "Design not found" });
      return;
    }
    const [updated] = await db
      .update(cardDesignTable)
      .set({ isActive: !current.isActive })
      .where(eq(cardDesignTable.id, id))
      .returning();
    const data = ActivateDesignResponse.parse(stripNulls(updated));
    auditEvent(req, "design.toggleActive", { designId: id, isActive: updated.isActive });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to toggle design active state");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete design ────────────────────────────────────────────────────────────
router.delete("/design/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid design id" });
      return;
    }
    const [deleted] = await db
      .delete(cardDesignTable)
      .where(eq(cardDesignTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Design not found" });
      return;
    }
    res.json({ ok: true });
    auditEvent(req, "design.delete", { designId: id });
  } catch (err) {
    req.log.error({ err }, "Failed to delete design");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
