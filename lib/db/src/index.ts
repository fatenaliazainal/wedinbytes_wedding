import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  // Load .env from the workspace root
  config({ path: "../../.env"});

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  console.log("Loaded DATABASE_URL from .env file [development mode]");
}

// Keep at least 1 connection open so the first real request doesn't pay the
// ~1s TCP + TLS + auth handshake cost of a brand-new connection.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 1,
  idleTimeoutMillis: 30_000,  // drop idle connections after 30s to avoid stale sockets
  connectionTimeoutMillis: 5_000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
