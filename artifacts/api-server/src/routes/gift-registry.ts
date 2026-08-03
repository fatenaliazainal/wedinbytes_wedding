import { Router, type IRouter } from "express";
import multer from "multer";
import { and, asc, eq } from "drizzle-orm";
import { db, giftRegistryItemTable, invitationTable } from "@workspace/db";
import { canManageInvitation } from "../lib/security";
import { invitationHasFeature } from "../lib/pricing-features";
import { uploadImage, isR2Configured } from "../services/cloudflare/r2-storage-admin";

const router: IRouter = Router();

const thumbUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, and WebP images are allowed."));
  },
});

const FEATURE = "Gift Registry";
const MAX_ITEMS = 20;

// ─── Public / owner read ─────────────────────────────────────────────────────
// No auth required — package check acts as the gate.
// Returns [] for non-Signature invitations so the public page never leaks data.
router.get("/registry/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const [invitation] = await db
      .select({ id: invitationTable.id, packageId: invitationTable.packageId })
      .from(invitationTable)
      .where(eq(invitationTable.token, token))
      .limit(1);
    if (!invitation) { res.status(404).json({ error: "Invitation not found" }); return; }
    const isDemo = token === "demo" || token === "demo-en";
    if (!isDemo && !(await invitationHasFeature(invitation, FEATURE))) {
      res.json([]); return;
    }
    const items = await db
      .select()
      .from(giftRegistryItemTable)
      .where(eq(giftRegistryItemTable.invitationToken, token))
      .orderBy(asc(giftRegistryItemTable.sortOrder), asc(giftRegistryItemTable.id));
    res.json(items);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// ─── Create item ──────────────────────────────────────────────────────────────
router.post("/registry/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const [invitation] = await db.select().from(invitationTable).where(eq(invitationTable.token, token)).limit(1);
    if (!invitation) { res.status(404).json({ error: "Invitation not found" }); return; }
    if (!(await canManageInvitation(req, invitation))) { res.status(403).json({ error: "Forbidden" }); return; }
    const isDemoCreate = token === "demo" || token === "demo-en";
    if (!isDemoCreate && !(await invitationHasFeature(invitation, FEATURE))) {
      res.status(403).json({ error: "Gift Registry is available with the Signature package." }); return;
    }
    const { name, url, notes } = req.body as Record<string, unknown>;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Product name is required." }); return;
    }
    const existing = await db
      .select({ id: giftRegistryItemTable.id })
      .from(giftRegistryItemTable)
      .where(eq(giftRegistryItemTable.invitationToken, token));
    if (existing.length >= MAX_ITEMS) {
      res.status(400).json({ error: `Maximum ${MAX_ITEMS} items allowed per registry.` }); return;
    }
    const [item] = await db
      .insert(giftRegistryItemTable)
      .values({
        invitationToken: token,
        name: name.trim(),
        url: typeof url === "string" && url.trim() ? url.trim() : null,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        sortOrder: existing.length,
      })
      .returning();
    res.status(201).json(item);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// ─── Update item ──────────────────────────────────────────────────────────────
router.patch("/registry/:token/:id", async (req, res) => {
  try {
    const { token, id } = req.params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) { res.status(400).json({ error: "Invalid item ID" }); return; }
    const [invitation] = await db.select().from(invitationTable).where(eq(invitationTable.token, token)).limit(1);
    if (!invitation) { res.status(404).json({ error: "Invitation not found" }); return; }
    if (!(await canManageInvitation(req, invitation))) { res.status(403).json({ error: "Forbidden" }); return; }
    const isDemoUpdate = token === "demo" || token === "demo-en";
    if (!isDemoUpdate && !(await invitationHasFeature(invitation, FEATURE))) {
      res.status(403).json({ error: "Gift Registry is available with the Signature package." }); return;
    }
    const { name, url, notes, sortOrder } = req.body as Record<string, unknown>;
    const updates: Partial<typeof giftRegistryItemTable.$inferInsert> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) { res.status(400).json({ error: "Product name cannot be empty." }); return; }
      updates.name = name.trim();
    }
    if (url !== undefined) updates.url = typeof url === "string" && url.trim() ? url.trim() : null;
    if (notes !== undefined) updates.notes = typeof notes === "string" && notes.trim() ? notes.trim() : null;
    if (typeof sortOrder === "number") updates.sortOrder = sortOrder;
    const [item] = await db
      .update(giftRegistryItemTable)
      .set(updates)
      .where(and(eq(giftRegistryItemTable.id, itemId), eq(giftRegistryItemTable.invitationToken, token)))
      .returning();
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
    res.json(item);
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// ─── Delete item ──────────────────────────────────────────────────────────────
router.delete("/registry/:token/:id", async (req, res) => {
  try {
    const { token, id } = req.params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) { res.status(400).json({ error: "Invalid item ID" }); return; }
    const [invitation] = await db.select().from(invitationTable).where(eq(invitationTable.token, token)).limit(1);
    if (!invitation) { res.status(404).json({ error: "Invitation not found" }); return; }
    if (!(await canManageInvitation(req, invitation))) { res.status(403).json({ error: "Forbidden" }); return; }
    const isDemoDelete = token === "demo" || token === "demo-en";
    if (!isDemoDelete && !(await invitationHasFeature(invitation, FEATURE))) {
      res.status(403).json({ error: "Gift Registry is available with the Signature package." }); return;
    }
    await db
      .delete(giftRegistryItemTable)
      .where(and(eq(giftRegistryItemTable.id, itemId), eq(giftRegistryItemTable.invitationToken, token)));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

// ─── Thumbnail upload ─────────────────────────────────────────────────────────
router.post("/registry-thumbnail-upload", thumbUpload.single("file"), async (req, res) => {
  if (!isR2Configured()) { res.status(503).json({ error: "Image upload is not configured." }); return; }
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided." }); return; }
    const invitationToken = String(req.body.invitationToken || "").trim();
    const itemId = parseInt(String(req.body.itemId || ""), 10);
    if (!invitationToken) { res.status(400).json({ error: "invitationToken is required." }); return; }
    if (isNaN(itemId)) { res.status(400).json({ error: "itemId is required." }); return; }
    const [invitation] = await db.select().from(invitationTable).where(eq(invitationTable.token, invitationToken)).limit(1);
    if (!invitation) { res.status(404).json({ error: "Invitation not found" }); return; }
    if (!(await canManageInvitation(req, invitation))) { res.status(403).json({ error: "Forbidden" }); return; }
    const isDemoThumb = invitationToken === "demo" || invitationToken === "demo-en";
    if (!isDemoThumb && !(await invitationHasFeature(invitation, FEATURE))) {
      res.status(403).json({ error: "Gift Registry is available with the Signature package." }); return;
    }
    const ext = req.file.mimetype === "image/png" ? "png" : req.file.mimetype === "image/webp" ? "webp" : "jpg";
    const ts = Date.now();
    const fileName = `${itemId}-${ts}.${ext}`;
    const key = await uploadImage({
      fileName,
      fileBuffer: req.file.buffer,
      contentType: req.file.mimetype as "image/jpeg" | "image/png" | "image/webp",
      folder: `registry-thumb/${invitationToken}`,
      objectKey: fileName,
    });
    await db
      .update(giftRegistryItemTable)
      .set({ thumbnailUrl: key })
      .where(and(eq(giftRegistryItemTable.id, itemId), eq(giftRegistryItemTable.invitationToken, invitationToken)));
    res.json({ key });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

export default router;
