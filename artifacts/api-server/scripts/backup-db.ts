#!/usr/bin/env tsx
/**
 * Production-only PostgreSQL backup script.
 *
 * Flow:
 *   1. Refuse to run unless NODE_ENV === "production"
 *   2. Validate required env vars
 *   3. pg_dump  → /tmp/wedinstudio-db-<timestamp>.sql
 *   4. gzip     → /tmp/wedinstudio-db-<timestamp>.sql.gz
 *   5. Upload   → R2 private bucket / db-backups/weekly/<filename>
 *   6. Delete local temp files  (only after successful upload)
 *   7. Retention cleanup        (keep latest 8; only after successful upload)
 *
 * Run via:
 *   pnpm --filter @workspace/api-server run backup:db
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  unlinkSync,
  writeFileSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// ─── Production guard ─────────────────────────────────────────────────────────
//
// This is the ONLY guard. If NODE_ENV is not exactly "production",
// we exit immediately without touching the database or R2.

if (process.env.NODE_ENV !== "production") {
  console.log("Database backup skipped: production only.");
  process.exit(0);
}

// ─── Required environment variables ──────────────────────────────────────────

const REQUIRED_VARS = [
  "DATABASE_URL",
  "CF_R2_ACCOUNT_ID",
  "CF_R2_ACCESS_KEY_ID",
  "CF_R2_SECRET_ACCESS_KEY",
  "CF_R2_BACKUP_BUCKET_NAME",
] as const;

const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `[backup] Aborted: missing required env vars: ${missing.join(", ")}`
  );
  process.exit(1);
}

// Assign after validation — TypeScript knows these are defined
const DATABASE_URL = process.env.DATABASE_URL!;
const ACCOUNT_ID = process.env.CF_R2_ACCOUNT_ID!;
const ACCESS_KEY = process.env.CF_R2_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.CF_R2_SECRET_ACCESS_KEY!;
const BACKUP_BUCKET = process.env.CF_R2_BACKUP_BUCKET_NAME!;

const BACKUP_PREFIX = "db-backups/weekly/";
const KEEP_COUNT = 8;

// ─── Timestamp ────────────────────────────────────────────────────────────────
// Format: YYYY-MM-DD-HHmm (UTC), e.g. 2026-08-07-0400
// Lexicographic sort of this format is chronological order.

function utcTimestamp(): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return [
    now.getUTCFullYear(),
    p(now.getUTCMonth() + 1),
    p(now.getUTCDate()),
  ].join("-") + "-" + p(now.getUTCHours()) + p(now.getUTCMinutes());
}

const timestamp = utcTimestamp();
const sqlFilename = `wedinstudio-db-${timestamp}.sql`;
const gzFilename = `${sqlFilename}.gz`;
const objectKey = `${BACKUP_PREFIX}wedinstudio-db-${timestamp}.sql.gz`;

const tmpSql = join(tmpdir(), sqlFilename);
const tmpGz = join(tmpdir(), gzFilename);

// ─── S3-compatible R2 client (backup bucket) ─────────────────────────────────

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deleteTempFiles(): void {
  for (const f of [tmpSql, tmpGz]) {
    if (existsSync(f)) {
      try {
        unlinkSync(f);
      } catch {
        /* best-effort */
      }
    }
  }
}

function abort(message: string, code = 1): never {
  console.error(`[backup] ${message}`);
  deleteTempFiles();
  process.exit(code);
}

// ─── Step 1: pg_dump ─────────────────────────────────────────────────────────
// READ-ONLY dump only: --no-owner --no-acl --format=plain
// DATABASE_URL is passed as an argv argument to avoid shell injection.
// It is never logged.

console.log(`[backup] Running pg_dump...`);

const dump = spawnSync(
  "pg_dump",
  ["--no-owner", "--no-acl", "--format=plain", DATABASE_URL],
  { stdio: ["ignore", "pipe", "pipe"], encoding: "buffer" }
);

if (dump.error) {
  abort(`pg_dump launch error: ${dump.error.message}`);
}
if (dump.status !== 0) {
  // Deliberately do NOT log stderr — it can contain connection strings.
  abort(`pg_dump exited with non-zero status: ${dump.status}`);
}
if (!dump.stdout || dump.stdout.length === 0) {
  abort("pg_dump produced empty output — aborting to avoid uploading a blank backup.");
}

writeFileSync(tmpSql, dump.stdout);
console.log(`[backup] pg_dump complete (${dump.stdout.length} bytes uncompressed).`);

// ─── Step 2: gzip ────────────────────────────────────────────────────────────
// gzip replaces tmpSql with tmpSql.gz in-place.

console.log(`[backup] Compressing...`);

const gz = spawnSync("gzip", [tmpSql], { stdio: ["ignore", "ignore", "pipe"] });
if (gz.error || gz.status !== 0) {
  abort(`gzip failed: ${gz.error?.message ?? `exit code ${gz.status}`}`);
}
if (!existsSync(tmpGz)) {
  abort(`Expected compressed file not found after gzip: ${tmpGz}`);
}

const compressedSize = statSync(tmpGz).size;
console.log(`[backup] Compression complete (${compressedSize} bytes compressed).`);

// ─── Step 3: Upload to R2 ────────────────────────────────────────────────────

console.log(`[backup] Uploading to bucket "${BACKUP_BUCKET}" key "${objectKey}"...`);

const fileBuffer = readFileSync(tmpGz);

try {
  await s3.send(
    new PutObjectCommand({
      Bucket: BACKUP_BUCKET,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: "application/gzip",
      ContentLength: compressedSize,
      Metadata: {
        "backup-timestamp": timestamp,
        "backup-system": "wedinstudio-db-backup",
        "backup-source": "api-server-scripts",
      },
    })
  );
} catch (err) {
  abort(`R2 upload failed: ${(err as Error).message}`);
}

console.log(`[backup] Upload succeeded: ${objectKey}`);

// ─── Step 4: Delete temp files (ONLY after successful upload) ────────────────

deleteTempFiles();
console.log("[backup] Local temp files deleted.");

// ─── Step 5: Retention cleanup — keep latest 8 ───────────────────────────────
// Only runs after the new backup has been confirmed uploaded.
// If listing or deletion fails it is non-fatal: the backup was still created.

console.log(`[backup] Running retention cleanup (keep ${KEEP_COUNT} most recent)...`);

try {
  const list = await s3.send(
    new ListObjectsV2Command({ Bucket: BACKUP_BUCKET, Prefix: BACKUP_PREFIX })
  );

  const backups = (list.Contents ?? [])
    .filter(
      (obj) =>
        obj.Key?.startsWith(BACKUP_PREFIX) &&
        obj.Key.endsWith(".sql.gz") &&
        obj.Key.includes("wedinstudio-db-")
    )
    // Lexicographic sort on YYYY-MM-DD-HHmm filenames = chronological order
    .sort((a, b) => (a.Key! < b.Key! ? -1 : 1));

  console.log(`[backup] ${backups.length} backup file(s) found in R2.`);

  if (backups.length > KEEP_COUNT) {
    const toDelete = backups.slice(0, backups.length - KEEP_COUNT);
    console.log(`[backup] Deleting ${toDelete.length} expired backup(s)...`);
    for (const obj of toDelete) {
      await s3.send(
        new DeleteObjectCommand({ Bucket: BACKUP_BUCKET, Key: obj.Key! })
      );
      console.log(`[backup] Deleted: ${obj.Key}`);
    }
  } else {
    console.log(
      `[backup] Retention limit not reached. No old backups deleted.`
    );
  }
} catch (err) {
  // Warn but do NOT exit non-zero — the backup itself succeeded.
  console.warn(
    `[backup] WARNING: Retention cleanup encountered an error: ${(err as Error).message}`
  );
  console.warn(
    "[backup] The new backup was successfully uploaded. Review R2 manually to remove old files."
  );
}

console.log("[backup] Backup completed successfully.");
