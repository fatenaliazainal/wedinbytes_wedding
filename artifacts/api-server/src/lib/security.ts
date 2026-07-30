import type { NextFunction, Request, RequestHandler, Response } from "express";
import { rateLimit } from "express-rate-limit";

export function canManageInvitation(
  req: Request,
  invitation: { userId: number | null },
): boolean {
  return req.session.role === "admin"
    || Boolean(req.session.userId && invitation.userId === req.session.userId);
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