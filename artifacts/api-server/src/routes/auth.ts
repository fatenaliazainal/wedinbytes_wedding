import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, userTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  adminLoginRateLimit,
  auditEvent,
  loginRateLimit,
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
      role: "buyer",
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
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

export default router;
