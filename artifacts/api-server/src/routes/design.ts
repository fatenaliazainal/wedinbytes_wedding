import { Router, type IRouter } from "express";
import { GetActiveDesignResponse, ListDesignsResponse, ActivateDesignResponse } from "@workspace/api-zod";
import { db, cardDesignTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

// Uploads directory — served as static assets by the wedding-invite Vite dev server.
// process.cwd() = artifacts/api-server (set by pnpm filter), so ../wedding-invite resolves correctly.
const UPLOADS_DIR = path.resolve(process.cwd(), "../wedding-invite/public/designs");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `design_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(null, ok);
  },
});

const ALLOWED_DESIGN_FIELDS = [
  "envelopeImageUrl","cardImageUrl","musicUrl","musicTitle","musicArtist",
  "colorPrimary","colorSecondary","colorAccent","colorBackground","colorCard",
  "fontHeading","fontBody","nameFontFamily","nameFontSize","nameColor",
  "cardMaxWidth","openingAnimation","designCode","openButtonText","name",
];

function stripNulls<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v])
  ) as T;
}

// ── Upload image ─────────────────────────────────────────────────────────────
router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File too large — maximum size is 20 MB." });
      } else {
        res.status(400).json({ error: err.message ?? "Upload failed." });
      }
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No valid image uploaded (jpeg/png/webp/gif, max 20 MB)" });
      return;
    }
    const url = `/designs/${req.file.filename}`;
    res.json({ url });
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

// ── List all designs ─────────────────────────────────────────────────────────
router.get("/design", async (req, res) => {
  try {
    const rows = await db.select().from(cardDesignTable).orderBy(cardDesignTable.id);
    res.json(rows.map(stripNulls));
  } catch (err) {
    req.log.error({ err }, "Failed to list designs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Create design ────────────────────────────────────────────────────────────
router.post("/design", async (req, res) => {
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
    res.status(201).json(stripNulls(created));
  } catch (err) {
    req.log.error({ err }, "Failed to create design");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update design ────────────────────────────────────────────────────────────
router.patch("/design/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
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
  } catch (err) {
    req.log.error({ err }, "Failed to update design");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Activate design ──────────────────────────────────────────────────────────
router.post("/design/:id/activate", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid design id" });
      return;
    }
    await db.update(cardDesignTable).set({ isActive: false });
    const [updated] = await db
      .update(cardDesignTable)
      .set({ isActive: true })
      .where(eq(cardDesignTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Design not found" });
      return;
    }
    const data = ActivateDesignResponse.parse(stripNulls(updated));
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to activate design");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete design ────────────────────────────────────────────────────────────
router.delete("/design/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
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
  } catch (err) {
    req.log.error({ err }, "Failed to delete design");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
