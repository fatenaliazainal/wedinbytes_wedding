import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { db, userTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  adminLoginRateLimit,
  auditEvent,
  loginRateLimit,
  passwordResetRateLimit,
  passwordResetRequestRateLimit,
  regenerateSession,
  registerRateLimit,
} from "../lib/security";

const router: IRouter = Router();

declare module "express-session" {
  interface SessionData {
    userId: number;
    role: string;
  }
}

router.post("/auth/register", registerRateLimit, async (req, res) => {
  try {
      const { email, password, name } = req.body;
      const requestedRole = req.body?.accountType === "business_account" ? "business_account" : "buyer";
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, kata laluan dan nama diperlukan." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Kata laluan mesti sekurang-kurangnya 6 aksara." });
      return;
    }

    const existing = await db.select().from(userTable).where(eq(userTable.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Emel ini sudah didaftarkan." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(userTable).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      role: requestedRole,
    }).returning();

    await regenerateSession(req, user.id, user.role);
    auditEvent(req, "auth.register", { userId: user.id });

    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    req.log.error({ err }, "Register failed");
    res.status(500).json({ error: "Ralat pelayan. Sila cuba lagi." });
  }
});

router.post("/auth/login", loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Emel dan kata laluan diperlukan." });
      return;
    }

    const [user] = await db.select().from(userTable).where(eq(userTable.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.status(401).json({ error: "Emel atau kata laluan salah." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Emel atau kata laluan salah." });
      return;
    }

    await regenerateSession(req, user.id, user.role);
    auditEvent(req, "auth.login", { userId: user.id });

    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Ralat pelayan. Sila cuba lagi." });
  }
});

router.post("/auth/forgot-password", passwordResetRequestRateLimit, async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const genericResponse = {
      message: "Jika emel ini wujud, pautan reset kata laluan telah dijana.",
    };

    if (!email) {
      res.status(400).json({ error: "Emel diperlukan." });
      return;
    }

    const [user] = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, email)).limit(1);
    if (!user) {
      res.json(genericResponse);
      return;
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.update(userTable)
      .set({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      })
      .where(eq(userTable.id, user.id));

    const resetUrl = `/forgot-password?token=${encodeURIComponent(token)}`;
    res.json({
      ...genericResponse,
      ...(process.env.NODE_ENV !== "production" ? { resetUrl } : {}),
    });
  } catch (err) {
    req.log.error({ err }, "Forgot password request failed");
    res.status(500).json({ error: "Ralat pelayan. Sila cuba lagi." });
  }
});

router.post("/auth/reset-password", passwordResetRateLimit, async (req, res) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!token || !password) {
      res.status(400).json({ error: "Token dan kata laluan diperlukan." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Kata laluan mesti sekurang-kurangnya 6 aksara." });
      return;
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const [user] = await db.select({
      id: userTable.id,
      passwordResetExpiresAt: userTable.passwordResetExpiresAt,
    }).from(userTable).where(eq(userTable.passwordResetTokenHash, tokenHash)).limit(1);

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
      res.status(400).json({ error: "Pautan reset tidak sah atau telah tamat tempoh." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(userTable)
      .set({
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      })
      .where(eq(userTable.id, user.id));

    auditEvent(req, "auth.password_reset", { userId: user.id });
    res.json({ message: "Kata laluan berjaya dikemaskini." });
  } catch (err) {
    req.log.error({ err }, "Password reset failed");
    res.status(500).json({ error: "Ralat pelayan. Sila cuba lagi." });
  }
});

router.get("/auth/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ error: "Tidak log masuk." });
      return;
    }
    const [user] = await db.select().from(userTable).where(eq(userTable.id, req.session.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Pengguna tidak dijumpai." });
      return;
    }
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    req.log.error({ err }, "Me failed");
    res.status(500).json({ error: "Ralat pelayan." });
  }
});

router.patch("/auth/profile", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Tidak log masuk." });
    return;
  }

  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!name || name.length > 120) {
      res.status(400).json({ error: "Nama penuh diperlukan dan mestilah tidak melebihi 120 aksara." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      res.status(400).json({ error: "Sila masukkan alamat emel yang sah." });
      return;
    }

    const [existing] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);
    if (existing && existing.id !== req.session.userId) {
      res.status(409).json({ error: "Emel ini sudah digunakan oleh akaun lain." });
      return;
    }

    const [updated] = await db
      .update(userTable)
      .set({ name, email })
      .where(eq(userTable.id, req.session.userId))
      .returning({ id: userTable.id, name: userTable.name, email: userTable.email, role: userTable.role });

    if (!updated) {
      res.status(404).json({ error: "Pengguna tidak dijumpai." });
      return;
    }

    auditEvent(req, "auth.profile_update", { userId: updated.id });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Profile update failed");
    res.status(500).json({ error: "Ralat pelayan. Sila cuba lagi." });
  }
});

router.post("/auth/change-password", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Tidak log masuk." });
    return;
  }

  try {
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    const confirmPassword = typeof req.body?.confirmPassword === "string" ? req.body.confirmPassword : "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ error: "Semua medan kata laluan diperlukan." });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "Kata laluan baharu mesti sekurang-kurangnya 6 aksara." });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: "Pengesahan kata laluan tidak sepadan." });
      return;
    }
    if (newPassword === currentPassword) {
      res.status(400).json({ error: "Kata laluan baharu mesti berbeza daripada kata laluan semasa." });
      return;
    }

    const [user] = await db
      .select({ id: userTable.id, passwordHash: userTable.passwordHash })
      .from(userTable)
      .where(eq(userTable.id, req.session.userId))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "Pengguna tidak dijumpai." });
      return;
    }

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      res.status(400).json({ error: "Kata laluan semasa tidak betul." });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(userTable).set({ passwordHash }).where(eq(userTable.id, user.id));
    auditEvent(req, "auth.password_change", { userId: user.id });
    res.json({ message: "Kata laluan berjaya dikemaskini." });
  } catch (err) {
    req.log.error({ err }, "Password change failed");
    res.status(500).json({ error: "Ralat pelayan. Sila cuba lagi." });
  }
});

router.post("/auth/admin-login", adminLoginRateLimit, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ error: "Kata laluan diperlukan." });
      return;
    }

    const [user] = await db.select().from(userTable).where(eq(userTable.role, "admin")).limit(1);
    if (!user) {
      res.status(401).json({ error: "Akaun admin tidak dijumpai." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Kata laluan salah." });
      return;
    }

    await regenerateSession(req, user.id, user.role);
    auditEvent(req, "auth.admin_login", { userId: user.id });

    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    req.log.error({ err }, "Admin login failed");
    res.status(500).json({ error: "Ralat pelayan. Sila cuba lagi." });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      req.log.error({ err: error }, "Logout failed");
      res.status(500).json({ error: "Unable to log out." });
      return;
    }
    res.clearCookie("connect.sid", {
      httpOnly: true,
      sameSite: process.env.REPLIT_DEV_DOMAIN ? "none" : "lax",
      secure: process.env.NODE_ENV === "production" || Boolean(process.env.REPLIT_DEV_DOMAIN),
    });
    res.json({ ok: true });
  });
});

export default router;
