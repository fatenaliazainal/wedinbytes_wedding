import { Router, type IRouter } from "express";
import { eq, sql, asc } from "drizzle-orm";
import { db, pricingPackageTable, pricingFeatureTable } from "@workspace/db";

const router: IRouter = Router();

function adminGuard(req: any, res: any) {
  if (req.session?.role !== "admin") {
    res.status(403).json({ error: "Admin access only" });
    return false;
  }
  return true;
}

// Public: list active packages with their features
router.get("/pricing", async (req, res) => {
  try {
    const packages = await db
      .select()
      .from(pricingPackageTable)
      .where(eq(pricingPackageTable.isActive, true))
      .orderBy(asc(pricingPackageTable.sortOrder), asc(pricingPackageTable.id));

    const features = await db
      .select()
      .from(pricingFeatureTable)
      .orderBy(asc(pricingFeatureTable.sortOrder), asc(pricingFeatureTable.id));

    const featuresByPackage = new Map<number, typeof features>();
    for (const f of features) {
      if (!featuresByPackage.has(f.packageId)) featuresByPackage.set(f.packageId, []);
      featuresByPackage.get(f.packageId)!.push(f);
    }

    const result = packages.map((pkg) => ({
      ...pkg,
      features: featuresByPackage.get(pkg.id) ?? [],
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list pricing");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: list all packages with their features
router.get("/admin/pricing", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const packages = await db
      .select()
      .from(pricingPackageTable)
      .orderBy(asc(pricingPackageTable.sortOrder), asc(pricingPackageTable.id));

    const features = await db
      .select()
      .from(pricingFeatureTable)
      .orderBy(asc(pricingFeatureTable.sortOrder), asc(pricingFeatureTable.id));

    const featuresByPackage = new Map<number, typeof features>();
    for (const f of features) {
      if (!featuresByPackage.has(f.packageId)) featuresByPackage.set(f.packageId, []);
      featuresByPackage.get(f.packageId)!.push(f);
    }

    const result = packages.map((pkg) => ({
      ...pkg,
      features: featuresByPackage.get(pkg.id) ?? [],
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list admin pricing");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: create a package
router.post("/admin/pricing", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const body = req.body as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const price = String(body.price ?? "").trim();
    if (!name || !price) {
      res.status(400).json({ error: "Name and price are required" });
      return;
    }
    const maxOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(${pricingPackageTable.sortOrder}), 0)` })
      .from(pricingPackageTable);
    const sortOrder = (maxOrder[0]?.max ?? 0) + 1;
    const [created] = await db
      .insert(pricingPackageTable)
      .values({
        name,
        price,
        description: String(body.description ?? ""),
        badgeText: String(body.badgeText ?? ""),
        showBadge: Boolean(body.showBadge ?? false),
        isFeatured: Boolean(body.isFeatured ?? false),
        isActive: Boolean(body.isActive ?? true),
        sortOrder,
      })
      .returning();
    res.status(201).json({ ...created, features: [] });
  } catch (err) {
    req.log.error({ err }, "Failed to create pricing package");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: update a package
router.patch("/admin/pricing/:id", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid package id" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    const fields = ["name", "price", "description", "badgeText", "showBadge", "isFeatured", "isActive", "sortOrder"];
    for (const field of fields) {
      if (field in body) update[field] = body[field];
    }
    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }
    const [updated] = await db
      .update(pricingPackageTable)
      .set(update)
      .where(eq(pricingPackageTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update pricing package");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: delete a package and its features
router.delete("/admin/pricing/:id", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid package id" });
      return;
    }
    await db.delete(pricingFeatureTable).where(eq(pricingFeatureTable.packageId, id));
    await db.delete(pricingPackageTable).where(eq(pricingPackageTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete pricing package");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: add a feature to a package
router.post("/admin/pricing/:id/features", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const packageId = parseInt(req.params.id, 10);
    if (isNaN(packageId)) {
      res.status(400).json({ error: "Invalid package id" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    if (!name) {
      res.status(400).json({ error: "Feature name is required" });
      return;
    }
    const maxOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(${pricingFeatureTable.sortOrder}), 0)` })
      .from(pricingFeatureTable)
      .where(eq(pricingFeatureTable.packageId, packageId));
    const sortOrder = (maxOrder[0]?.max ?? 0) + 1;
    const [created] = await db
      .insert(pricingFeatureTable)
      .values({
        packageId,
        name,
        icon: String(body.icon ?? "Check"),
        sortOrder,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create pricing feature");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: update a feature
router.patch("/admin/pricing/:id/features/:featureId", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const featureId = parseInt(req.params.featureId, 10);
    if (isNaN(featureId)) {
      res.status(400).json({ error: "Invalid feature id" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    const fields = ["name", "icon", "sortOrder"];
    for (const field of fields) {
      if (field in body) update[field] = body[field];
    }
    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }
    const [updated] = await db
      .update(pricingFeatureTable)
      .set(update)
      .where(eq(pricingFeatureTable.id, featureId))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update pricing feature");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: delete a feature
router.delete("/admin/pricing/:id/features/:featureId", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const featureId = parseInt(req.params.featureId, 10);
    if (isNaN(featureId)) {
      res.status(400).json({ error: "Invalid feature id" });
      return;
    }
    await db.delete(pricingFeatureTable).where(eq(pricingFeatureTable.id, featureId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete pricing feature");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
