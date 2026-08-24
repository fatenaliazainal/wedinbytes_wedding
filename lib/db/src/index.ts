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

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // idleTimeoutMillis: drop idle connections before Neon's ~5-min forced eviction.
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 5_000,
});

// Neon (and other serverless PG providers) sometimes forcibly close idle
// connections. Without an 'error' listener on the pool, Node.js treats those
// as unhandled errors and crashes the process.
pool.on("error", (err) => {
  // Ignore benign connection termination codes; rethrow anything unexpected.
  const benign = ["57P01", "ECONNRESET", "EPIPE"];
  if (!benign.some((code) => String((err as NodeJS.ErrnoException).code ?? (err as unknown as Record<string,unknown>).code).includes(code))) {
    console.error("[pg-pool] unexpected pool error:", err);
  }
});
export const db = drizzle(pool, { schema });

export * from "./schema";
