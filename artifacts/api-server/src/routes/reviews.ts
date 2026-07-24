import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, reviewTable } from "@workspace/db";

const router: IRouter = Router();

function adminGuard(req: any, res: any) {
  if (req.session?.role !== "admin") {
    res.status(403).json({ error: "Admin access only" });
    return false;
  }
  return true;
}

// Public: list approved reviews + average rating
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await db
      .select()
      .from(reviewTable)
      .where(eq(reviewTable.status, "approved"))
      .orderBy(reviewTable.createdAt);

    const avgRow = await db
      .select({ avg: sql<number>`COALESCE(AVG(${reviewTable.rating}), 0)` })
      .from(reviewTable)
      .where(eq(reviewTable.status, "approved"));

    const averageRating = Number(avgRow[0]?.avg ?? 0);

    res.json({ reviews, averageRating, totalReviews: reviews.length });
  } catch (err) {
    req.log.error({ err }, "Failed to list reviews");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public: submit a review (pending by default)
router.post("/reviews", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const customerName = (body.customerName as string)?.trim();
    const rating = Number(body.rating);
    const reviewText = (body.reviewText as string)?.trim();
    const weddingDate = (body.weddingDate as string)?.trim() || null;

    if (!customerName || !reviewText || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Name, rating (1-5), and review are required." });
      return;
    }

    const [created] = await db
      .insert(reviewTable)
      .values({
        customerName,
        rating,
        reviewText,
        weddingDate: weddingDate as string | null,
        status: "pending",
      })
      .returning();

    res.status(201).json({ success: true, review: created });
  } catch (err) {
    req.log.error({ err }, "Failed to submit review");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: list all reviews (with optional status filter)
router.get("/admin/reviews", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const status = req.query.status as string | undefined;
    let query = db.select().from(reviewTable).orderBy(reviewTable.createdAt);
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query = db.select().from(reviewTable).where(eq(reviewTable.status, status)).orderBy(reviewTable.createdAt) as any;
    }
    const reviews = await query;
    res.json({ reviews });
  } catch (err) {
    req.log.error({ err }, "Failed to list admin reviews");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: update review status
router.patch("/admin/reviews/:id", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid review id" });
      return;
    }
    const status = (req.body as { status?: string }).status;
    if (!["pending", "approved", "rejected"].includes(status || "")) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const [updated] = await db
      .update(reviewTable)
      .set({ status: status as "pending" | "approved" | "rejected" })
      .where(eq(reviewTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update review status");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: delete review
router.delete("/admin/reviews/:id", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid review id" });
      return;
    }
    await db.delete(reviewTable).where(eq(reviewTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete review");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
