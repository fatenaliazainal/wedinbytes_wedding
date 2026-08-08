import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "node:path";
import fs from "node:fs";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";
import { globalRateLimit, uploadConcurrencyGuard } from "./lib/security";
import { findBySlug, findByToken, injectOgTags } from "./lib/og-meta";

const PgSession = connectPgSimple(session);

const app: Express = express();
app.set("trust proxy", 1);
const configuredCorsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// In development, also allow the Replit proxy domain so the preview iframe works.
if (process.env.NODE_ENV !== "production" && process.env.REPLIT_DEV_DOMAIN) {
  const devOrigin = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  if (!configuredCorsOrigins.includes(devOrigin)) {
    configuredCorsOrigins.push(devOrigin);
  }
}
const sessionSecret = process.env.SESSION_SECRET;
if (process.env.NODE_ENV === "production" && !sessionSecret) {
  throw new Error("SESSION_SECRET is required in production.");
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        // Audio/video URLs are user-supplied (music links) — must allow any source.
        mediaSrc: ["'self'", "blob:", "*"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // Cross-origin isolation not enforced — would break Google Fonts iframes.
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(
  cors({
    origin: configuredCorsOrigins.length
      ? (origin, callback) => {
          if (!origin) {
            // No Origin header — server-to-server request (e.g. payment callbacks).
            // Pass through without setting CORS headers; browsers always send Origin.
            callback(null, false);
          } else if (configuredCorsOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Origin is not allowed by CORS."));
          }
        }
      : process.env.NODE_ENV === "production" ? false : true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(
  session({
    store: new PgSession({
      pool,
      createTableIfMissing: false,
    }),
    // sessionSecret is guaranteed non-null in production by the startup check above.
    // The fallback string is only ever reached in development (NODE_ENV !== "production").
    secret: sessionSecret ?? "wedding-invite-dev-secret-DO-NOT-USE-IN-PROD",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: process.env.REPLIT_DEV_DOMAIN ? "none" : "lax",
      secure: process.env.NODE_ENV === "production" || Boolean(process.env.REPLIT_DEV_DOMAIN),
    },
  }),
);

if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(__dirname, "../../wedding-invite/dist/public");
  app.use(express.static(frontendDist));
}

// Limit concurrent multipart uploads to prevent RAM exhaustion from buffered file bytes
app.use((req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    uploadConcurrencyGuard(req, res, next);
    return;
  }
  next();
});

app.use("/api", globalRateLimit, router);

if (process.env.NODE_ENV === "production") {
  const frontendIndex = path.resolve(
    __dirname,
    "../../wedding-invite/dist/public/index.html",
  );
  // Read base HTML once at startup — injectOgTags returns a modified copy per request.
  let baseHtml: string;
  try {
    baseHtml = fs.readFileSync(frontendIndex, "utf8");
  } catch {
    baseHtml = "";
  }

  const serveWithOg = (html: string, res: express.Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store"); // OG content is dynamic per invitation
    res.send(html);
  };

  // ── /invite/:dateCode/:slug — pretty public URL ──────────────────────────
  app.get("/invite/:dateCode/:slug", async (req, res, next) => {
    if (!baseHtml) return next();
    try {
      const data = await findBySlug(req.params.dateCode, req.params.slug);
      if (!data) return next(); // invitation not found — fall through to generic 404 SPA
      const canonicalUrl = `https://wedinstudio.com/invite/${req.params.dateCode}/${req.params.slug}`;
      const html = injectOgTags(baseHtml, data, canonicalUrl);
      serveWithOg(html, res);
    } catch {
      next();
    }
  });

  // ── /invite/:token — internal token URL ──────────────────────────────────
  app.get("/invite/:token", async (req, res, next) => {
    if (!baseHtml) return next();
    try {
      const data = await findByToken(req.params.token);
      if (!data) return next();
      const canonicalUrl = `https://wedinstudio.com/invite/${req.params.token}`;
      const html = injectOgTags(baseHtml, data, canonicalUrl);
      serveWithOg(html, res);
    } catch {
      next();
    }
  });

  // ── Generic SPA fallback ──────────────────────────────────────────────────
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(frontendIndex);
  });
}

export default app;
