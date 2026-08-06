import pg from "pg";
import { config } from "dotenv";

if (!process.env.DATABASE_URL) config({ path: "../../.env" });

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  const before = await pool.query("SELECT COUNT(*) as cnt FROM card_design");
  console.log("card_design rows BEFORE:", before.rows[0].cnt);

  await pool.query(`ALTER TABLE card_design ADD COLUMN IF NOT EXISTS colors jsonb`);
  await pool.query(`ALTER TABLE card_design ADD COLUMN IF NOT EXISTS category text`);

  const after = await pool.query("SELECT COUNT(*) as cnt FROM card_design");
  console.log("card_design rows AFTER:", after.rows[0].cnt);

  const cols = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'card_design' AND column_name IN ('colors', 'category')`
  );
  console.log("new columns:", cols.rows);

  await pool.end();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
