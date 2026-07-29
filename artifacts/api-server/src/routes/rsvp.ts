import { Router, type IRouter } from "express";
import { CreateRsvpBody, ListRsvpsResponse, ListRsvpsResponseItem, GetRsvpCountResponse } from "@workspace/api-zod";
import { db, rsvpTable, invitationTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";

const router: IRouter = Router();

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeRsvpForApi(r: typeof rsvpTable.$inferSelect) {
  return {
    ...r,
    timeSlot: r.timeSlot ?? undefined,
    message: r.message ?? undefined,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/rsvp", async (req, res) => {
  try {
    const invitationToken = req.query.invitationToken as string | undefined;
    let query = db.select().from(rsvpTable).orderBy(rsvpTable.createdAt);
    if (invitationToken) {
      query = query.where(eq(rsvpTable.invitationToken, invitationToken)) as typeof query;
    }
    const rows = await query;
    const data = ListRsvpsResponse.parse(rows.map(normalizeRsvpForApi));
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to list RSVPs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Buyer RSVP dashboard: return every owned card with only that card's RSVP rows.
router.get("/rsvp/buyer", async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ error: "Tidak log masuk." });
      return;
    }
    const invitations = await db
      .select({
        id: invitationTable.id,
        token: invitationTable.token,
        groomName: invitationTable.groomName,
        brideName: invitationTable.brideName,
        eventType: invitationTable.eventType,
        eventDate: invitationTable.eventDate,
        rsvpEnabled: invitationTable.rsvpEnabled,
      })
      .from(invitationTable)
      .where(eq(invitationTable.userId, req.session.userId))
      .orderBy(invitationTable.createdAt);

    const cards = await Promise.all(invitations.map(async (invitation) => {
      const rows = await db
        .select()
        .from(rsvpTable)
        .where(eq(rsvpTable.invitationToken, invitation.token))
        .orderBy(rsvpTable.createdAt);
      return {
        ...invitation,
        rsvps: rows.map(normalizeRsvpForApi),
      };
    }));
    res.json({ cards });
  } catch (err) {
    req.log.error({ err }, "Failed to load buyer RSVP dashboard");
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

    const { invitationToken, name, attending, numberOfGuests, timeSlot, message } = body.data;

    if (!invitationToken) {
      res.status(400).json({ error: "Invitation token is required" });
      return;
    }

    const invitationRows = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.token, invitationToken))
      .limit(1);
    if (invitationRows.length === 0) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    const invitation = invitationRows[0];

    if (!invitation.rsvpEnabled) {
      res.status(400).json({ error: "RSVP is currently disabled" });
      return;
    }

    if (invitation.rsvpDeadline) {
      const deadline = new Date(invitation.rsvpDeadline);
      if (deadline.getTime() < Date.now()) {
        res.status(400).json({ error: "RSVP deadline has passed" });
        return;
      }
    }

    const maxGuestsPerInvitation = Math.max(1, Number(invitation.rsvpMaxGuestsPerInvitation) || 10);
    if (attending && numberOfGuests > maxGuestsPerInvitation) {
      res.status(400).json({ error: `Maximum ${maxGuestsPerInvitation} guests per invitation allowed` });
      return;
    }

    const configuredSlots = safeJsonParse<string[]>(invitation.rsvpTimeSlots, []);
    if (configuredSlots.length > 0) {
      if (!timeSlot || !configuredSlots.includes(timeSlot)) {
        res.status(400).json({ error: "Selected time slot is not available" });
        return;
      }
    }

    const maxOverallGuests = Math.max(0, Number(invitation.rsvpMaxOverallGuests) || 1000);
    if (attending && maxOverallGuests > 0) {
      const existing = await db
        .select({ totalGuests: sql<number>`coalesce(sum(${rsvpTable.numberOfGuests}),0)::int` })
        .from(rsvpTable)
        .where(eq(rsvpTable.invitationToken, invitationToken));
      const currentGuests = existing[0]?.totalGuests ?? 0;

      // For existing guests, find their previous count to calculate net change
      const previousRows = await db
        .select({ numberOfGuests: rsvpTable.numberOfGuests, attending: rsvpTable.attending })
        .from(rsvpTable)
        .where(and(eq(rsvpTable.invitationToken, invitationToken), eq(rsvpTable.name, name)))
        .limit(1);
      const previousGuests = previousRows[0]?.attending ? (previousRows[0].numberOfGuests ?? 0) : 0;

      const netGuests = currentGuests - previousGuests + (attending ? numberOfGuests : 0);
      if (netGuests > maxOverallGuests) {
        res.status(400).json({ error: "Guest limit has been reached" });
        return;
      }
    }

    const [upserted] = await db
      .insert(rsvpTable)
      .values({ invitationToken, name, attending, numberOfGuests, timeSlot: timeSlot ?? null, message: message ?? null })
      .onConflictDoUpdate({
        target: [rsvpTable.invitationToken, rsvpTable.name],
        set: {
          attending: body.data.attending,
          numberOfGuests: body.data.numberOfGuests,
          timeSlot: timeSlot ?? null,
          message: message ?? null,
        },
      })
      .returning();
    const data = ListRsvpsResponseItem.parse(normalizeRsvpForApi(upserted));
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create RSVP");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/rsvp/count", async (req, res) => {
  try {
    const invitationToken = req.query.invitationToken as string | undefined;
    let query = db
      .select({
        attending: rsvpTable.attending,
        count: sql<number>`count(*)::int`,
        totalGuests: sql<number>`sum(${rsvpTable.numberOfGuests})::int`,
      })
      .from(rsvpTable);
    if (invitationToken) {
      query = query.where(eq(rsvpTable.invitationToken, invitationToken)) as typeof query;
    }
    const rows = await query.groupBy(rsvpTable.attending);

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
