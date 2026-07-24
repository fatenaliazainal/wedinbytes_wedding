import { Router, type IRouter } from "express";
import { CreateRsvpBody, ListRsvpsResponse, ListRsvpsResponseItem, GetRsvpCountResponse } from "@workspace/api-zod";
import { db, rsvpTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/rsvp", async (req, res) => {
  try {
    const rows = await db.select().from(rsvpTable).orderBy(rsvpTable.createdAt);
    const data = ListRsvpsResponse.parse(
      rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
    );
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to list RSVPs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/rsvp", async (req, res) => {
  try {
    const body = CreateRsvpBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Validation error", details: String(body.error) });
      return;
    }
    const [upserted] = await db
      .insert(rsvpTable)
      .values(body.data)
      .onConflictDoUpdate({
        target: rsvpTable.name,
        set: {
          attending: body.data.attending,
          numberOfGuests: body.data.numberOfGuests,
          side: body.data.side ?? null,
          message: body.data.message ?? null,
        },
      })
      .returning();
    const data = ListRsvpsResponseItem.parse({ ...upserted, createdAt: upserted.createdAt.toISOString() });
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create RSVP");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/rsvp/count", async (req, res) => {
  try {
    const rows = await db
      .select({
        attending: rsvpTable.attending,
        count: sql<number>`count(*)::int`,
        totalGuests: sql<number>`sum(${rsvpTable.numberOfGuests})::int`,
      })
      .from(rsvpTable)
      .groupBy(rsvpTable.attending);

    let attending = 0;
    let notAttending = 0;
    let totalGuests = 0;
    for (const row of rows) {
      if (row.attending) {
        attending = row.count;
        totalGuests = row.totalGuests ?? 0;
      } else {
        notAttending = row.count;
      }
    }
    const data = GetRsvpCountResponse.parse({ attending, notAttending, totalGuests });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get RSVP count");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
