import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  uploadImage,
  getImagePublicUrl,
  getImageSignedUrl,
  imageExists,
  deleteImage,
  configureBucketCors,
  getBucketCors,
} from "./r2-storage-admin.ts";

const requiredEnv = [
  "CF_R2_ACCOUNT_ID",
  "CF_R2_ACCESS_KEY_ID",
  "CF_R2_SECRET_ACCESS_KEY",
  "CF_R2_BUCKET_NAME",
];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.warn(
    `Skipping Cloudflare R2 integration test for account ${process.env["CF_R2_ACCOUNT_ID"]}: missing env ${missingEnv.join(", ")}`,
  );
  test.skip(
    `Cloudflare R2 integration test skipped: missing env ${missingEnv.join(", ")}`,
  );
} else {
  // ── CORS setup ──────────────────────────────────────────────────────────────
  test("configureBucketCors sets GET/HEAD rules for the bucket", async () => {
    // Allow any origin during CI; restrict to your real domain in production.
    await configureBucketCors(["*"]);

    const rules = await getBucketCors();
    assert.ok(rules.length > 0, "expected at least one CORS rule after configuration");

    const rule = rules[0];
    assert.ok(
      rule.allowedOrigins.includes("*") || rule.allowedOrigins.length > 0,
      "expected allowedOrigins to be set",
    );
    assert.ok(
      rule.allowedMethods.includes("GET"),
      "expected GET to be an allowed CORS method",
    );
    assert.ok(
      rule.allowedMethods.includes("HEAD"),
      "expected HEAD to be an allowed CORS method",
    );
    console.log("CORS rules:", JSON.stringify(rules, null, 2));
  });

  // ── Upload + public URL flow ─────────────────────────────────────────────────
  test("Cloudflare R2 upload, public URL reachability, and cleanup", async () => {
    const fileName = `integration-${Date.now()}.png`;
    // Minimal valid 1×1 PNG (67 bytes)
    const fileBuffer = Buffer.from(
      "89504e470d0a1a0a0000000d49484452000000010000000108060000001f" +
        "15c4890000000a49444154789c6260000000020001e221bc330000000049454e44ae426082",
      "hex",
    );
    const contentType = "image/png" as const;
    const folder = "test-uploads";

    // ── 1. Upload ──────────────────────────────────────────────────────────────
    const key = await uploadImage({ fileName, fileBuffer, contentType, folder });

    assert.ok(typeof key === "string" && key.length > 0, "expected a non-empty object key");
    console.log("Uploaded key:", key);

    // ── 2. Public URL shape ────────────────────────────────────────────────────
    const publicUrl = getImagePublicUrl(key);
    assert.ok(
      typeof publicUrl === "string" && publicUrl.startsWith("http"),
      "expected public URL to start with http",
    );
    console.log("Public URL:", publicUrl);

    // ── 3. Signed URL is reachable (always works; confirms the object exists
    //       and R2 credentials are correct) ────────────────────────────────────
    const signedUrl = await getImageSignedUrl(key, 120);
    assert.ok(
      typeof signedUrl === "string" && signedUrl.startsWith("http"),
      "expected signed URL",
    );

    const signedRes = await fetch(signedUrl, { method: "GET" });
    assert.strictEqual(
      signedRes.status,
      200,
      `signed URL should return 200 but got ${signedRes.status}`,
    );
    const contentTypeHeader = signedRes.headers.get("content-type") ?? "";
    assert.ok(
      contentTypeHeader.startsWith("image/"),
      `expected image content-type but got "${contentTypeHeader}"`,
    );
    console.log("Signed URL status:", signedRes.status, "content-type:", contentTypeHeader);

    // ── 4. Public URL reachability (requires public bucket access or custom domain)
    //       If CF_R2_PUBLIC_DOMAIN is set, assert 200; otherwise warn and skip. ─
    const publicDomain = process.env.CF_R2_PUBLIC_DOMAIN;
    if (publicDomain) {
      const pubRes = await fetch(publicUrl, {
        method: "GET",
        headers: {
          // Simulate a browser request from the wedding-invite frontend
          Origin: "https://localhost",
        },
      });
      assert.strictEqual(
        pubRes.status,
        200,
        `public URL should return 200 but got ${pubRes.status}. ` +
          `Ensure the R2 bucket has public access enabled and CF_R2_PUBLIC_DOMAIN is correct.`,
      );

      // Verify CORS response header is present (R2 custom domains honour bucket CORS rules)
      const corsHeader = pubRes.headers.get("access-control-allow-origin");
      assert.ok(
        corsHeader !== null,
        "public URL response should include Access-Control-Allow-Origin CORS header. " +
          "Configure CORS via the Cloudflare R2 dashboard or call configureBucketCors().",
      );
      console.log("Public URL CORS header:", corsHeader);
    } else {
      console.warn(
        "CF_R2_PUBLIC_DOMAIN not set — skipping public URL HTTP reachability check.\n" +
          "Set CF_R2_PUBLIC_DOMAIN to your R2 custom domain (e.g. https://assets.yourdomain.com) " +
          "to enable this assertion.\n" +
          "The signed URL check above already confirms the object is stored correctly.",
      );
    }

    // ── 5. S3 existence check ──────────────────────────────────────────────────
    const exists = await imageExists(key);
    assert.strictEqual(exists, true, "uploaded object should exist via S3 HeadObject");

    // ── 6. Cleanup ─────────────────────────────────────────────────────────────
    await deleteImage(key);
    const existsAfterDelete = await imageExists(key);
    assert.strictEqual(existsAfterDelete, false, "object should not exist after delete");

    console.log("Integration test passed — R2 upload/delete cycle complete.");
  });
}
