import { Router, type IRouter } from "express";
import { db, cardTable, invitationTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import multer from "multer";
import { deleteImage, uploadImage, downloadImage, getImagePublicUrl, isR2Configured } from "../services/cloudflare/r2-storage-admin";

const router: IRouter = Router();

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

function adminGuard(req: { session?: { role?: string } }, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (req.session?.role !== "admin") {
    res.status(403).json({ error: "Admin access only" });
    return false;
  }
  return true;
}

async function canUploadForInvitation(req: { session?: { userId?: number; role?: string } }, token: string) {
  if (!token || token === "unknown") return false;
  if (req.session?.role === "admin") return true;
  if (!req.session?.userId) return false;
  const [invitation] = await db
    .select({ userId: invitationTable.userId })
    .from(invitationTable)
    .where(eq(invitationTable.token, token))
    .limit(1);
  return invitation?.userId === req.session.userId;
}

// Serve R2 object keys through the same origin when no public R2 domain is configured.
// This keeps uploaded gallery images visible without exposing storage credentials.
router.get("/r2", async (req, res) => {
  const key = typeof req.query.key === "string" ? req.query.key : "";
  const allowedPrefix = /^(wed_card_design|gallery|logos)\//;
  if (!key || key.includes("..") || key.startsWith("/") || !allowedPrefix.test(key)) {
    res.status(400).json({ error: "A valid R2 object key is required" });
    return;
  }
  if (!isR2Configured()) {
    res.status(503).json({ error: "Photo storage is not configured" });
    return;
  }
  try {
    const image = await downloadImage(key);
    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
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
// Returns card rows mapped to { id, name, path, category, publicUrl }
router.get("/cards", async (req, res) => {
  if (!adminGuard(req, res)) return;
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
      publicUrl: row.path ? getImagePublicUrl(row.path) : undefined,
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
router.post("/raw-card", upload.single("file"), async (req, res) => {
  if (!adminGuard(req, res)) return;
  if (!isR2Configured()) {
    res.status(503).json({
      error:
        "Photo storage is not configured. The server administrator must set the CF_R2_ACCOUNT_ID, CF_R2_ACCESS_KEY_ID, CF_R2_SECRET_ACCESS_KEY, and CF_R2_BUCKET_NAME secrets before uploads will work.",
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
    const mimeType = req.file.mimetype as "image/png" | "image/jpeg";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
      res.status(400).json({ error: "Invalid image type" });
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
    let created: typeof cardTable.$inferSelect;
    try {
      [created] = await db
        .insert(cardTable)
        .values({
          name: body.name.trim() as string,
          path: imageKey,
          category: (body.category as string) || "design",
        })
        .returning();
    } catch (dbError) {
      await deleteImage(imageKey).catch((cleanupError) =>
        req.log.error({ err: cleanupError, imageKey }, "Failed to clean up card image after DB failure"),
      );
      throw dbError;
    }

    res.status(201).json(stripNulls(created));
  } catch (err) {
    req.log.error({ err }, "Failed to create raw card");
    res.status(500).json({ error: "Failed to create card" });
  }
});

// ── Replace a raw card image and/or metadata ──────────────────────────────────
router.patch("/raw-card/:id", upload.single("file"), async (req, res) => {
  if (!adminGuard(req, res)) return;
  if (!isR2Configured()) {
    res.status(503).json({ error: "Photo storage is not configured." });
    return;
  }

  try {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid card id" });
      return;
    }
    const [card] = await db.select().from(cardTable).where(eq(cardTable.id, id)).limit(1);
    if (!card) {
      res.status(404).json({ error: "Card not found" });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const update: Partial<typeof cardTable.$inferInsert> = {};
    if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
    if (typeof body.category === "string" && body.category.trim()) update.category = body.category.trim();

    let newImageKey: string | undefined;
    if (req.file) {
      const mimeType = req.file.mimetype as "image/png" | "image/jpeg" | "image/webp" | "image/gif";
      newImageKey = await uploadImage({
        fileName: req.file.originalname,
        fileBuffer: req.file.buffer,
        contentType: mimeType,
        folder: "wed_card_design",
        metadata: { name: typeof body.name === "string" ? body.name.trim() : card.name },
      });
      update.path = newImageKey;
    }
    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    try {
      const [updated] = await db.update(cardTable).set(update).where(eq(cardTable.id, id)).returning();
      if (newImageKey && card.path && isR2StorageKey(card.path)) {
        await deleteImage(card.path).catch((err) =>
          req.log.error({ err, imageKey: card.path }, "Failed to clean up replaced card image"),
        );
      }
      res.json(stripNulls(updated));
    } catch (dbError) {
      if (newImageKey) await deleteImage(newImageKey).catch(() => undefined);
      throw dbError;
    }
  } catch (err) {
    req.log.error({ err }, "Failed to update raw card");
    res.status(500).json({ error: "Failed to update card" });
  }
});

// ── Upload a gallery image to R2 (returns the storage key) ─────────────────────
router.post("/gallery-upload", upload.single("file"), async (req, res) => {
  if (!isR2Configured()) {
    res.status(503).json({
      error:
        "Photo storage is not configured. The server administrator must set the CF_R2_ACCOUNT_ID, CF_R2_ACCESS_KEY_ID, CF_R2_SECRET_ACCESS_KEY, and CF_R2_BUCKET_NAME secrets before uploads will work.",
    });
    return;
  }

  try {
    if (!req.file) {
      res.status(400).json({ error: "Image file is required (jpeg/png/webp/gif, max 10 MB)" });
      return;
    }

    const mimeType = req.file.mimetype as "image/png" | "image/jpeg" | "image/webp" | "image/gif";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
      res.status(400).json({ error: "Invalid image type" });
      return;
    }

    const invitationToken = req.body.invitationToken || req.query.invitationToken || "";
    if (typeof invitationToken !== "string" || !(await canUploadForInvitation(req, invitationToken))) {
      res.status(403).json({ error: "You do not own this invitation" });
      return;
    }
    const imageKey = await uploadImage({
      fileName: req.file.originalname,
      fileBuffer: req.file.buffer,
      contentType: mimeType,
      folder: invitationToken && typeof invitationToken === "string" ? `gallery/${invitationToken}` : "gallery",
      metadata: { uploadedAt: new Date().toISOString(), invitationToken: typeof invitationToken === "string" ? invitationToken : "" },
    });

    res.json({ key: imageKey });
  } catch (err) {
    req.log.error({ err }, "Failed to upload gallery image");
    res.status(500).json({ error: "Failed to upload gallery image" });
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
    const mimeType = req.file.mimetype as "image/png" | "image/jpeg" | "image/webp";
    const invitationToken = req.body.invitationToken || req.query.invitationToken || "";
    if (typeof invitationToken !== "string" || !(await canUploadForInvitation(req, invitationToken))) {
      res.status(403).json({ error: "You do not own this invitation" });
      return;
    }
    const imageKey = await uploadImage({
      fileName: req.file.originalname,
      fileBuffer: req.file.buffer,
      contentType: mimeType,
      folder: invitationToken && typeof invitationToken === "string" ? `logos/${invitationToken}` : "logos",
      metadata: { uploadedAt: new Date().toISOString(), invitationToken: typeof invitationToken === "string" ? invitationToken : "" },
    });
    res.json({ key: imageKey });
  } catch (err) {
    req.log.error({ err }, "Failed to upload initials logo");
    res.status(500).json({ error: "Failed to upload logo" });
  }
});

// ── Delete raw card ──────────────────────────────────────────────────────────
router.delete("/raw-card/:id", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const id = parseInt(req.params.id, 10);
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

    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete raw card");
    res.status(500).json({ error: "Failed to delete card" });
  }
});

function isR2StorageKey(value: string) {
  return Boolean(value) && !value.startsWith("http://") && !value.startsWith("https://") && !value.startsWith("/");
}

export default router;
