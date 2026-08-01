import { Router } from "express";
import multer from "multer";
import { db, waxSealTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { isR2Configured, uploadImage } from "../services/cloudflare/r2-storage-admin";
import { requireAdmin } from "../lib/security";
import { inspectImage, type SupportedImageMime } from "../lib/image-validation";

const router: Router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB — wax seals are small decorative images
  fileFilter: (_req, file, cb) => {
    // Transparent formats preferred for wax seals
    const ok = /^image\/(png|webp|jpeg)$/.test(file.mimetype);
    cb(null, ok);
  },
});

// ── Public: active seals for customer dropdown ──────────────────────────────
router.get("/wax-seals", async (_req, res) => {
  try {
    const seals = await db
      .select()
      .from(waxSealTable)
      .where(eq(waxSealTable.isActive, true))
      .orderBy(asc(waxSealTable.sortOrder), asc(waxSealTable.id));
    res.json(seals);
  } catch {
    res.status(500).json({ error: "Failed to load wax seals" });
  }
});

// ── Public: single seal by ID (renders even if disabled, for existing invitations) ──
router.get("/wax-seals/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const rows = await db.select().from(waxSealTable).where(eq(waxSealTable.id, id)).limit(1);
    if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to load wax seal" });
  }
});

// ── Admin: list all seals (active + inactive) ────────────────────────────────
router.get("/admin/wax-seals", requireAdmin, async (_req, res) => {
  try {
    const seals = await db
      .select()
      .from(waxSealTable)
      .orderBy(asc(waxSealTable.sortOrder), asc(waxSealTable.id));
    res.json(seals);
  } catch {
    res.status(500).json({ error: "Failed to load wax seals" });
  }
});

// ── Admin: upload image to R2 ────────────────────────────────────────────────
router.post("/admin/wax-seals/upload", requireAdmin, (req, res, _next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message ?? "Upload failed." });
      return;
    }
    if (!isR2Configured()) {
      res.status(503).json({ error: "R2 storage not configured." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No valid image uploaded. Use PNG, WebP, or JPEG, max 2 MB." });
      return;
    }
    const mimeType = req.file.mimetype as SupportedImageMime;
    try {
      inspectImage(req.file.buffer, mimeType);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid image" });
      return;
    }
    const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.replace("image/", "");
    const objectKey = `wax-seal-${Date.now()}.${extension}`;
    uploadImage({
      fileName: req.file.originalname,
      fileBuffer: req.file.buffer,
      contentType: mimeType,
      folder: "wax_seals",
      objectKey,
      metadata: { uploadedAt: new Date().toISOString(), type: "wax-seal" },
    })
      .then((key) => res.json({ key, url: key }))
      .catch(() => res.status(500).json({ error: "Failed to upload wax seal image." }));
  });
});

// ── Admin: create ────────────────────────────────────────────────────────────
router.post("/admin/wax-seals", requireAdmin, async (req, res) => {
  const { name, imageUrl, isActive = true, sortOrder = 0 } = req.body;
  if (!name || !imageUrl) {
    res.status(400).json({ error: "name and imageUrl are required" });
    return;
  }
  try {
    const [seal] = await db
      .insert(waxSealTable)
      .values({ name, imageUrl, isActive: Boolean(isActive), sortOrder: Number(sortOrder) || 0 })
      .returning();
    res.status(201).json(seal);
  } catch {
    res.status(500).json({ error: "Failed to create wax seal" });
  }
});

// ── Admin: update name / isActive / sortOrder ────────────────────────────────
router.patch("/admin/wax-seals/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const update: Partial<{ name: string; isActive: boolean; sortOrder: number }> = {};
  if (req.body.name !== undefined) update.name = String(req.body.name);
  if (req.body.isActive !== undefined) update.isActive = Boolean(req.body.isActive);
  if (req.body.sortOrder !== undefined) update.sortOrder = Number(req.body.sortOrder) || 0;
  try {
    const [seal] = await db.update(waxSealTable).set(update).where(eq(waxSealTable.id, id)).returning();
    if (!seal) { res.status(404).json({ error: "Not found" }); return; }
    res.json(seal);
  } catch {
    res.status(500).json({ error: "Failed to update wax seal" });
  }
});

// ── Admin: delete ────────────────────────────────────────────────────────────
router.delete("/admin/wax-seals/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(waxSealTable).where(eq(waxSealTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete wax seal" });
  }
});

export default router;
