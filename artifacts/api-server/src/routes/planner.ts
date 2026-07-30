import { Router, type IRouter, type Request, type Response } from "express";
import { and, count, eq, ilike, or } from "drizzle-orm";
import {
  db,
  eventPlannerProfileTable,
  invitationTable,
  userTable,
} from "@workspace/db";
import { auditEvent, canManageInvitation } from "../lib/security";

const router: IRouter = Router();

const PROFILE_FIELDS = [
  "companyName",
  "displayName",
  "description",
  "phone",
  "whatsapp",
  "email",
  "website",
  "instagram",
  "facebook",
  "tiktok",
  "logoUrl",
  "coverImage",
  "businessAddress",
  "googleMapsUrl",
  "businessHours",
  "slug",
  "isActive",
] as const;

type PlannerProfile = typeof eventPlannerProfileTable.$inferSelect;

function slugPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publicPlanner(profile: PlannerProfile, invitationCount?: number) {
  const {
    userId: _userId,
    isActive: _isActive,
    id: _id,
    ...safe
  } = profile;
  return invitationCount === undefined
    ? safe
    : { ...safe, invitationCount };
}

function requireEventPlanner(req: Request, res: Response): boolean {
  if (req.session.role !== "event_planner" && req.session.role !== "admin") {
    res.status(403).json({ error: "Event Planner access only" });
    return false;
  }
  return true;
}

async function getOrCreateProfile(userId: number) {
  const [existing] = await db
    .select()
    .from(eventPlannerProfileTable)
    .where(eq(eventPlannerProfileTable.userId, userId))
    .limit(1);
  if (existing) return existing;

  const [user] = await db
    .select({ id: userTable.id, name: userTable.name, email: userTable.email })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  if (!user) return null;

  const base = slugPart(user.name) || `planner-${user.id}`;
  const [created] = await db
    .insert(eventPlannerProfileTable)
    .values({
      userId,
      companyName: user.name,
      displayName: user.name,
      email: user.email,
      slug: `${base}-${user.id}`,
    })
    .returning();
  return created;
}

async function profileWithInvitationCount(profile: PlannerProfile) {
  const [result] = await db
    .select({ value: count(invitationTable.id) })
    .from(invitationTable)
    .where(eq(invitationTable.eventPlannerId, profile.id));
  return publicPlanner(profile, Number(result?.value ?? 0));
}

router.get("/planner/search", async (req, res) => {
  try {
    const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const query = rawQuery.slice(0, 80);
    const where = and(
      eq(eventPlannerProfileTable.isActive, true),
      query
        ? or(
            ilike(eventPlannerProfileTable.companyName, `%${query}%`),
            ilike(eventPlannerProfileTable.displayName, `%${query}%`),
            ilike(eventPlannerProfileTable.slug, `%${query}%`),
          )
        : undefined,
    );
    const rows = await db
      .select()
      .from(eventPlannerProfileTable)
      .where(where)
      .limit(30);
    res.json(rows.map((profile) => publicPlanner(profile)));
  } catch (err) {
    req.log.error({ err }, "Failed to search event planners");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/planner/me", async (req, res) => {
  try {
    if (req.session.role !== "event_planner" || !req.session.userId) {
      res.status(403).json({ error: "Event Planner access only" });
      return;
    }
    const profile = await getOrCreateProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Planner profile not found" });
      return;
    }
    res.json(await profileWithInvitationCount(profile));
  } catch (err) {
    req.log.error({ err }, "Failed to get planner profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/planner/me", async (req, res) => {
  try {
    if (req.session.role !== "event_planner" || !req.session.userId) {
      res.status(403).json({ error: "Event Planner access only" });
      return;
    }
    const profile = await getOrCreateProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Planner profile not found" });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    for (const field of PROFILE_FIELDS) {
      if (!(field in body)) continue;
      const value = body[field];
      if (field === "slug") {
        if (typeof value !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())) {
          res.status(400).json({ error: "Slug must contain lowercase letters, numbers and hyphens only" });
          return;
        }
        update[field] = value.trim();
      } else if (field === "isActive") {
        update[field] = value === true;
      } else {
        update[field] = value === null || typeof value === "string" ? value : String(value);
      }
    }
    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "No valid profile fields to update" });
      return;
    }
    update.updatedAt = new Date();

    const [updated] = await db
      .update(eventPlannerProfileTable)
      .set(update)
      .where(eq(eventPlannerProfileTable.id, profile.id))
      .returning();
    auditEvent(req, "planner.profile_update", { plannerId: profile.id });
    res.json(await profileWithInvitationCount(updated));
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      res.status(409).json({ error: "That planner slug is already in use" });
      return;
    }
    req.log.error({ err }, "Failed to update planner profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/planner/invitations", async (req, res) => {
  try {
    if (!requireEventPlanner(req, res)) return;
    let plannerId: number | undefined;
    if (req.session.role === "event_planner" && req.session.userId) {
      const profile = await getOrCreateProfile(req.session.userId);
      plannerId = profile?.id;
    }
    const rows = plannerId
      ? await db
          .select({
            id: invitationTable.id,
            token: invitationTable.token,
            groomName: invitationTable.groomName,
            brideName: invitationTable.brideName,
            eventType: invitationTable.eventType,
            eventDate: invitationTable.eventDate,
            eventDay: invitationTable.eventDay,
            eventTime: invitationTable.eventTime,
            venueName: invitationTable.venueName,
            venueCity: invitationTable.venueCity,
            venueState: invitationTable.venueState,
            websiteStatus: invitationTable.websiteStatus,
            createdAt: invitationTable.createdAt,
          })
          .from(invitationTable)
          .where(eq(invitationTable.eventPlannerId, plannerId))
      : await db
          .select({
            id: invitationTable.id,
            token: invitationTable.token,
            groomName: invitationTable.groomName,
            brideName: invitationTable.brideName,
            eventType: invitationTable.eventType,
            eventDate: invitationTable.eventDate,
            eventDay: invitationTable.eventDay,
            eventTime: invitationTable.eventTime,
            venueName: invitationTable.venueName,
            venueCity: invitationTable.venueCity,
            venueState: invitationTable.venueState,
            websiteStatus: invitationTable.websiteStatus,
            createdAt: invitationTable.createdAt,
          })
          .from(invitationTable);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list planner invitations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/planner/:slug", async (req, res) => {
  try {
    const [profile] = await db
      .select()
      .from(eventPlannerProfileTable)
      .where(and(
        eq(eventPlannerProfileTable.slug, req.params.slug),
        eq(eventPlannerProfileTable.isActive, true),
      ))
      .limit(1);
    if (!profile) {
      res.status(404).json({ error: "Planner profile not found" });
      return;
    }
    res.json(await profileWithInvitationCount(profile));
  } catch (err) {
    req.log.error({ err }, "Failed to get public planner profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/invitation/:token/assign-planner", async (req, res) => {
  try {
    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.token, String(req.params.token)))
      .limit(1);
    if (!invitation) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    if (!req.session.userId || !canManageInvitation(req, invitation)) {
      res.status(403).json({ error: "Only the invitation owner or admin can assign a planner" });
      return;
    }

    const plannerId = Number(req.body?.plannerId);
    const plannerSlug = typeof req.body?.slug === "string" ? req.body.slug.trim() : "";
    const [planner] = await db
      .select()
      .from(eventPlannerProfileTable)
      .where(plannerId
        ? and(eq(eventPlannerProfileTable.id, plannerId), eq(eventPlannerProfileTable.isActive, true))
        : and(eq(eventPlannerProfileTable.slug, plannerSlug), eq(eventPlannerProfileTable.isActive, true)))
      .limit(1);
    if (!planner) {
      res.status(404).json({ error: "Active planner not found" });
      return;
    }
    const [updated] = await db
      .update(invitationTable)
      .set({ eventPlannerId: planner.id })
      .where(eq(invitationTable.id, invitation.id))
      .returning();
    auditEvent(req, "invitation.assign_planner", { invitationToken: invitation.token, plannerId: planner.id });
    res.json({ invitation: updated, planner: publicPlanner(planner) });
  } catch (err) {
    req.log.error({ err }, "Failed to assign planner");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/invitation/:token/remove-planner", async (req, res) => {
  try {
    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.token, String(req.params.token)))
      .limit(1);
    if (!invitation) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    if (!req.session.userId || !canManageInvitation(req, invitation)) {
      res.status(403).json({ error: "Only the invitation owner or admin can remove a planner" });
      return;
    }
    const [updated] = await db
      .update(invitationTable)
      .set({ eventPlannerId: null })
      .where(eq(invitationTable.id, invitation.id))
      .returning();
    auditEvent(req, "invitation.remove_planner", { invitationToken: invitation.token });
    res.json({ invitation: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to remove planner");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;