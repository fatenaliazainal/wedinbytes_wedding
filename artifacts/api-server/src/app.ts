import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "node:path";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";

const PgSession = connectPgSimple(session);

const app: Express = express();
app.set("trust proxy", 1);
const configuredCorsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const sessionSecret = process.env.SESSION_SECRET;
if (process.env.NODE_ENV === "production" && !sessionSecret) {
  throw new Error("SESSION_SECRET is required in production.");
}

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
          if (!origin || configuredCorsOrigins.includes(origin)) {
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
    secret: sessionSecret || "wedding-invite-dev-secret-2025",
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

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const frontendIndex = path.resolve(
    __dirname,
    "../../wedding-invite/dist/public/index.html",
  );
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(frontendIndex);
  });
}

export default app;
