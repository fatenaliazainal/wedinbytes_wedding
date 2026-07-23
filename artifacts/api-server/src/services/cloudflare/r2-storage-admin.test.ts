import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { S3Client } from "@aws-sdk/client-s3";
import * as s3RequestPresigner from "@aws-sdk/s3-request-presigner";

const originalSend = S3Client.prototype.send;
let r2StorageAdmin: typeof import("./r2-storage-admin.ts");

before(async () => {
  S3Client.prototype.send = async function (command: any) {
    const commandName = command?.constructor?.name;
    const key = command?.input?.Key;

    switch (commandName) {
      case "PutObjectCommand":
        return {};
      case "GetObjectCommand":
        if (key === "missing-file.png") {
          const err = new Error("NotFound");
          (err as any).name = "NotFound";
          (err as any).$metadata = { httpStatusCode: 404 };
          throw err;
        }
        return {
          Body: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
          ContentType: "image/png",
        };
      case "DeleteObjectCommand":
        return {};
      case "HeadObjectCommand":
        if (key === "missing-file.png") {
          const err = new Error("NotFound");
          (err as any).name = "NotFound";
          (err as any).$metadata = { httpStatusCode: 404 };
          throw err;
        }
        return {};
      case "ListObjectsV2Command":
        return { Contents: [{ Key: "test-uploads/test.png" }, { Key: "test-uploads/sample.jpg" }] };
      default:
        return {};
    }
  } as any;

  r2StorageAdmin = await import("./r2-storage-admin.ts");
});

after(() => {
  S3Client.prototype.send = originalSend;
});

test("isValidImageType accepts PNG and JPEG", () => {
  assert.ok(r2StorageAdmin.isValidImageType("image/png"));
  assert.ok(r2StorageAdmin.isValidImageType("image/jpeg"));
});

test("isValidImageType rejects unsupported mime types", () => {
  assert.strictEqual(r2StorageAdmin.isValidImageType("image/webp"), false);
  assert.strictEqual(r2StorageAdmin.isValidImageType("text/plain"), false);
});

test("getImagePublicUrl returns an R2 public URL containing the bucket and key", () => {
  const url = r2StorageAdmin.getImagePublicUrl("test-uploads/test.png");
  assert.ok(url.includes("wedinbytesdev"));
  assert.ok(url.endsWith("/test-uploads/test.png"));
});

test("uploadImage returns a generated object key", async () => {
  const key = await r2StorageAdmin.uploadImage({
    fileName: "test-image.png",
    fileBuffer: Buffer.from([1, 2, 3]),
    contentType: "image/png",
  });

  assert.match(key, /^[0-9]+-[a-z0-9]{7}\.png$/);
});

test("downloadImage returns the image buffer and metadata", async () => {
  const result = await r2StorageAdmin.downloadImage("test-uploads/test.png");

  assert.ok(Buffer.isBuffer(result.buffer));
  assert.strictEqual(result.contentType, "image/png");
  assert.strictEqual(result.size, result.buffer.length);
});

test("downloadImage throws a handled error for missing files", async () => {
  await assert.rejects(
    r2StorageAdmin.downloadImage("missing-file.png"),
    /Failed to download image:/,
  );
});

test("deleteImage resolves successfully for existing files", async () => {
  await assert.doesNotReject(r2StorageAdmin.deleteImage("test-uploads/test.png"));
});

test("imageExists returns true when object exists", async () => {
  assert.strictEqual(await r2StorageAdmin.imageExists("test-uploads/test.png"), true);
});

test("imageExists returns false for missing files", async () => {
  assert.strictEqual(await r2StorageAdmin.imageExists("missing-file.png"), false);
});

test("getImageSignedUrl returns a signed URL", async () => {
  const url = await r2StorageAdmin.getImageSignedUrl("test-uploads/test.png");
  assert.ok(typeof url === "string" && url.startsWith("http"));
});

test("listImages returns a list of keys", async () => {
  const keys = await r2StorageAdmin.listImages("test-uploads/");
  assert.deepStrictEqual(keys, ["test-uploads/test.png", "test-uploads/sample.jpg"]);
});
