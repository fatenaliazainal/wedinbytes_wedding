import type { NextFunction, Request, RequestHandler, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { db, businessProfileTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { PgRateLimitStore } from "./rate-limit-pg-store";

export async function canManageInvitation(
  req: Request,
  invitation: { userId: number | null; businessId?: number | null },
): Promise<boolean> {
  if (req.session.role === "admin") return true;
  if (!req.session.userId) return false;
  if (invitation.userId === req.session.userId) return true;
  if (req.session.role !== "business_account" || !invitation.businessId) return false;
  const [profile] = await db.select({ userId: businessProfileTable.userId })
    .from(businessProfileTable)
    .where(eq(businessProfileTable.id, invitation.businessId))
    .limit(1);
  return profile?.userId === req.session.userId;
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "Admin access only" });
    return;
  }
  next();
};

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

export const adminLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many admin login attempts. Please try again later." },
});

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again later." },
});

export const passwordResetRequestRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please try again later." },
});

export const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many password reset attempts. Please try again later." },
});

export const pinUnlockRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many PIN attempts. Please try again later." },
});

export const rsvpSubmitRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many RSVP submissions. Please try again later." },
});

export const reviewSubmitRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many review submissions. Please try again later." },
});

export const customerFormSubmitRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many form submissions. Please try again later." },
});

// Global safety net: prevents bots/DDOS from overwhelming unauthenticated endpoints.
// 200 req/min is generous for any human user (editors, guests, admins) but stops
// automated floods. Applied to every /api route before route-specific limiters.
// Backed by PostgreSQL so counters survive server restarts (a crash won't reset the window).
export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: new PgRateLimitStore(60 * 1000),
  message: { error: "Too many requests. Please slow down and try again." },
});

// R2 image proxy — cap bandwidth abuse by limiting how often a single IP can
// pull files from R2 through the same-origin proxy.
export const r2RateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many image requests. Please slow down." },
});

// Business search — ILIKE on the DB; keep bots from running continuous scans.
export const businessSearchRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many search requests. Please slow down." },
});

// Public invitation page — each wedding typically has many guests opening the link.
// 60/min is generous for real guests but deters automated scanners.
export const publicInvitationRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

// Public wishes feed — guests may refresh; keep limit permissive.
export const wishesRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

// RSVP token lookup — read-only but should not be enumerated.
export const tokenLookupRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

// Upload concurrency guard — limits simultaneous in-flight multipart uploads
// so a burst of large files cannot exhaust server RAM.
let _activeUploads = 0;
const MAX_CONCURRENT_UPLOADS = 10;

export const uploadConcurrencyGuard: RequestHandler = (_req, res, next) => {
  if (_activeUploads >= MAX_CONCURRENT_UPLOADS) {
    res.status(503).json({ error: "Server is busy processing your file. Please try again shortly." });
    return;
  }
  _activeUploads++;
  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      _activeUploads--;
    }
  };
  res.on("finish", release);
  res.on("close", release);
  next();
};

export function regenerateSession(
  req: Request,
  userId: number,
  role: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      req.session.userId = userId;
      req.session.role = role;
      resolve();
    });
  });
}

export function auditEvent(
  req: Request,
  event: string,
  details: Record<string, unknown> = {},
): void {
  req.log.info({
    audit: true,
    event,
    actorUserId: req.session.userId ?? null,
    actorRole: req.session.role ?? null,
    ...details,
  }, `Audit event: ${event}`);
}

export function handleAsyncError(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }
  req.log.error({ err: error }, "Unhandled request error");
  res.status(500).json({ error: "Internal server error" });
}