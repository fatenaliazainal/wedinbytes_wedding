/**
 * PostgreSQL-backed store for express-rate-limit.
 *
 * Counters persist across server restarts, so a DDOS that crashes
 * and immediately restarts the process cannot reset the rate limit window.
 * Uses the shared connection pool — no extra credentials needed.
 */

import type { Store, IncrementResponse, Options } from "express-rate-limit";
import { pool } from "@workspace/db";

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS rate_limit_hits (
    rl_key   TEXT        PRIMARY KEY,
    count    INTEGER     NOT NULL DEFAULT 0,
    reset_ts TIMESTAMPTZ NOT NULL
  )
`;

const CLEANUP_SQL = `DELETE FROM rate_limit_hits WHERE reset_ts < NOW()`;

const UPSERT_SQL = `
  INSERT INTO rate_limit_hits (rl_key, count, reset_ts)
  VALUES ($1, 1, $2)
  ON CONFLICT (rl_key) DO UPDATE SET
    count    = CASE WHEN rate_limit_hits.reset_ts <= NOW() THEN 1
                    ELSE rate_limit_hits.count + 1 END,
    reset_ts = CASE WHEN rate_limit_hits.reset_ts <= NOW() THEN $2
                    ELSE rate_limit_hits.reset_ts END
  RETURNING count, reset_ts
`;

export class PgRateLimitStore implements Store {
  private readonly windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  /** Called once by express-rate-limit when the middleware is created. */
  async init(_options: Options): Promise<void> {
    await pool.query(CREATE_TABLE_SQL);
    // Remove stale rows left over from a previous run
    await pool.query(CLEANUP_SQL);
  }

  async increment(key: string): Promise<IncrementResponse> {
    const resetTs = new Date(Date.now() + this.windowMs);
    const result = await pool.query<{ count: number; reset_ts: Date }>(
      UPSERT_SQL,
      [key, resetTs],
    );
    const row = result.rows[0];
    return {
      totalHits: row.count,
      resetTime: row.reset_ts,
    };
  }

  async decrement(key: string): Promise<void> {
    await pool.query(
      `UPDATE rate_limit_hits SET count = GREATEST(0, count - 1) WHERE rl_key = $1`,
      [key],
    );
  }

  async resetKey(key: string): Promise<void> {
    await pool.query(`DELETE FROM rate_limit_hits WHERE rl_key = $1`, [key]);
  }

  async resetAll(): Promise<void> {
    await pool.query(`DELETE FROM rate_limit_hits`);
  }
}
