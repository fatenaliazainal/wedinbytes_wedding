import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { uploadImage, getImagePublicUrl, getImageSignedUrl, imageExists, deleteImage } from "./r2-storage-admin.ts";

const requiredEnv = [
  "CF_R2_ACCOUNT_ID",
  "CF_R2_ACCESS_KEY_ID",
  "CF_R2_SECRET_ACCESS_KEY",
  "CF_R2_BUCKET_NAME",
];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.warn(`Skipping Cloudflare R2 integration test for account ${process.env["CF_R2_ACCOUNT_ID"]}: missing env ${missingEnv.join(", ")}`);
  test.skip(`Cloudflare R2 integration test skipped: missing env ${missingEnv.join(", ")}`);
} else {
  test("Cloudflare R2 upload and public URL flow", async () => {
    const fileName = `integration-${Date.now()}.png`;
    const fileBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const contentType = "image/png" as const;
    const folder = "test-uploads";

    const key = await uploadImage({
      fileName,
      fileBuffer,
      contentType,
      folder,
    });

    assert.ok(typeof key === "string" && key.length > 0, "expected object key");

    const publicUrl = getImagePublicUrl(key);
    assert.ok(typeof publicUrl === "string" && publicUrl.startsWith("http"), "expected public URL");
    console.log(publicUrl)

    const exists = await imageExists(key);
    assert.strictEqual(exists, true, "uploaded object should exist");

    const publicImageSignedUrl = await getImageSignedUrl(key);
    assert.ok(typeof publicImageSignedUrl === "string" && publicImageSignedUrl.startsWith("http"), "expected signed URL");

    await deleteImage(key);

    const existsAfterDelete = await imageExists(key);
    assert.strictEqual(existsAfterDelete, false, "object should not exist after delete");
  });
}
