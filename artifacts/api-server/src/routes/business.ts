import { Router, type IRouter } from "express";
import { and, count, eq, ilike, or } from "drizzle-orm";
import {
  businessClientTable,
  businessProfileTable,
  db,
  invitationTable,
  userTable,
} from "@workspace/db";
import { auditEvent } from "../lib/security";

const router: IRouter = Router();

const PROFILE_FIELDS = [
  "businessName", "businessType", "displayName", "description", "phone",
  "whatsapp", "email", "website", "instagram", "facebook", "tiktok",
  "logoUrl", "coverImage", "address", "googleMapsUrl", "businessHours", "slug",
] as const;

function slugPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publicBusiness(profile: typeof businessProfileTable.$inferSelect, invitationCount?: number) {
  const {
    userId: _userId,
    isActive: _isActive,
    id: _id,
    ...safe
  } = profile;
  return invitationCount === undefined ? safe : { ...safe, invitationCount };
}

function requireBusiness(req: { session: { role?: string; userId?: number } }, res: any): req is typeof req & { session: { userId: number } } {
  if (req.session.role !== "business_account" || !req.session.userId) {
    res.status(403).json({ error: "Business Account access only" });
    return false;
  }
  return true;
}

export async function getOrCreateBusinessProfile(userId: number) {
  const [existing] = await db.select().from(businessProfileTable)
    .where(eq(businessProfileTable.userId, userId)).limit(1);
  if (existing) return existing;
  const [user] = await db.select({ id: userTable.id, name: userTable.name, email: userTable.email })
    .from(userTable).where(eq(userTable.id, userId)).limit(1);
  if (!user) return null;
  const base = slugPart(user.name) || `business-${user.id}`;
  const [created] = await db.insert(businessProfileTable).values({
    userId,
    businessName: user.name,
    displayName: user.name,
    email: user.email,
    slug: `${base}-${user.id}`,
  }).returning();
  return created;
}

async function profileWithInvitationCount(profile: typeof businessProfileTable.$inferSelect) {
  const [result] = await db.select({ value: count(invitationTable.id) })
    .from(invitationTable).where(eq(invitationTable.businessId, profile.id));
  return publicBusiness(profile, Number(result?.value ?? 0));
}

router.get("/business/me", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    res.json(await profileWithInvitationCount(profile));
  } catch (err) {
    req.log.error({ err }, "Failed to get business profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/business/me", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
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
      } else {
        update[field] = value === null || typeof value === "string" ? value : String(value);
      }
    }
    if (!Object.keys(update).length) {
      res.status(400).json({ error: "No valid profile fields to update" });
      return;
    }
    update.updatedAt = new Date();
    const [updated] = await db.update(businessProfileTable).set(update)
      .where(eq(businessProfileTable.id, profile.id)).returning();
    auditEvent(req, "business.profile_update", { businessId: profile.id });
    res.json(await profileWithInvitationCount(updated));
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      res.status(409).json({ error: "That business slug is already in use" });
      return;
    }
    req.log.error({ err }, "Failed to update business profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/business/clients", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    res.json(await db.select().from(businessClientTable)
      .where(eq(businessClientTable.businessId, profile.id))
      .orderBy(businessClientTable.createdAt));
  } catch (err) {
    req.log.error({ err }, "Failed to list business clients");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/business/clients", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const [created] = await db.insert(businessClientTable).values({
      businessId: profile.id,
      brideName: typeof body.brideName === "string" ? body.brideName.trim() : "",
      groomName: typeof body.groomName === "string" ? body.groomName.trim() : "",
      phone: typeof body.phone === "string" ? body.phone.trim() : null,
      email: typeof body.email === "string" ? body.email.trim() : null,
      eventDate: typeof body.eventDate === "string" ? body.eventDate.trim() : null,
      notes: typeof body.notes === "string" ? body.notes.trim() : null,
      status: typeof body.status === "string" && body.status.trim() ? body.status.trim() : "ACTIVE",
    }).returning();
    auditEvent(req, "business.client_create", { businessId: profile.id, clientId: created.id });
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create business client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/business/clients/:id", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    const id = Number(req.params.id);
    if (!profile || !Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid client id" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    for (const field of ["brideName", "groomName", "phone", "email", "eventDate", "notes", "status"] as const) {
      if (field in body) update[field] = body[field] === null ? null : String(body[field] ?? "").trim();
    }
    update.updatedAt = new Date();
    const [updated] = await db.update(businessClientTable).set(update)
      .where(and(eq(businessClientTable.id, id), eq(businessClientTable.businessId, profile.id))).returning();
    if (!updated) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update business client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/business/clients/:id", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    const id = Number(req.params.id);
    if (!profile || !Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid client id" });
      return;
    }
    const deleted = await db.delete(businessClientTable)
      .where(and(eq(businessClientTable.id, id), eq(businessClientTable.businessId, profile.id))).returning({ id: businessClientTable.id });
    if (!deleted.length) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete business client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/business/invitations", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    const rows = await db.select().from(invitationTable)
      .where(eq(invitationTable.businessId, profile.id))
      .orderBy(invitationTable.createdAt);
    res.json(rows.map(({ userId: _userId, businessId: _businessId, lockPinHash: _lockPinHash, ...safe }) => safe));
  } catch (err) {
    req.log.error({ err }, "Failed to list business invitations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/business/search", async (req, res) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
    const rows = await db.select().from(businessProfileTable).where(and(
      eq(businessProfileTable.isActive, true),
      query ? or(
        ilike(businessProfileTable.businessName, `%${query}%`),
        ilike(businessProfileTable.businessType, `%${query}%`),
        ilike(businessProfileTable.slug, `%${query}%`),
      ) : undefined,
    )).limit(30);
    res.json(rows.map((profile) => publicBusiness(profile)));
  } catch (err) {
    req.log.error({ err }, "Failed to search businesses");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/business/:slug", async (req, res) => {
  try {
    const [profile] = await db.select().from(businessProfileTable).where(and(
      eq(businessProfileTable.slug, req.params.slug),
      eq(businessProfileTable.isActive, true),
    )).limit(1);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    res.json(await profileWithInvitationCount(profile));
  } catch (err) {
    req.log.error({ err }, "Failed to get public business profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;