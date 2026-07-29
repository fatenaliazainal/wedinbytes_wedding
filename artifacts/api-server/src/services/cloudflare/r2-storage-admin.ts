import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

/**
 * Cloudflare R2 Storage Service
 * Handles image file uploads, downloads, and management
 * R2 is S3-compatible, so we use AWS SDK v3
 */

// Configuration - Replace with actual values or set environment variables
const R2_CONFIG = {
  accountId: process.env.CF_R2_ACCOUNT_ID ?? "",
  accessKeyId: process.env.CF_R2_ACCESS_KEY_ID ?? "",
  secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY ?? "",
  bucketName: process.env.CF_R2_BUCKET_NAME ?? "",
  region: process.env.CF_R2_REGION ?? "auto",
  /**
   * Optional custom public domain for R2 objects (e.g. "https://assets.example.com").
   * When set, getImagePublicUrl() returns URLs under this domain instead of the
   * private r2.cloudflarestorage.com endpoint.
   *
   * Configure in Cloudflare: R2 bucket → Settings → Custom Domains.
   * Then set the CF_R2_PUBLIC_DOMAIN secret to that domain (no trailing slash).
   */
  publicDomain: process.env.CF_R2_PUBLIC_DOMAIN ?? "",
};

/**
 * Returns true when all required R2 environment variables are present.
 */
export function isR2Configured(): boolean {
  return Boolean(
    R2_CONFIG.accountId &&
      R2_CONFIG.accessKeyId &&
      R2_CONFIG.secretAccessKey &&
      R2_CONFIG.bucketName,
  );
}

/**
 * Throws a descriptive error listing any missing R2 environment variables.
 * Call this at the top of any function that needs R2 access.
 */
function assertR2Configured(): void {
  const missing: string[] = [];
  if (!R2_CONFIG.accountId) missing.push("CF_R2_ACCOUNT_ID");
  if (!R2_CONFIG.accessKeyId) missing.push("CF_R2_ACCESS_KEY_ID");
  if (!R2_CONFIG.secretAccessKey) missing.push("CF_R2_SECRET_ACCESS_KEY");
  if (!R2_CONFIG.bucketName) missing.push("CF_R2_BUCKET_NAME");

  if (missing.length > 0) {
    throw new Error(
      `R2 storage is not configured. Missing environment variables: ${missing.join(", ")}. ` +
        `Set these secrets in the Replit Secrets panel and restart the server.`,
    );
  }
}

// Initialize S3 client pointing to Cloudflare R2
const s3Client = new S3Client({
  region: R2_CONFIG.region,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
  endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
});

export interface ImageUploadOptions {
  fileName: string;
  fileBuffer: Buffer;
  contentType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  metadata?: Record<string, string>;
  folder?: string; // Optional folder/prefix within the bucket
  objectKey?: string; // Optional deterministic object name within the folder
}

export interface ImageDownloadResult {
  buffer: Buffer;
  contentType: string;
  size: number;
}

/**
 * Upload an image file to R2 storage
 * @param options - Upload configuration
 * @returns The S3 object key of the uploaded file
 */
export async function uploadImage(
  options: ImageUploadOptions,
): Promise<string> {
  assertR2Configured();
  const { fileName, fileBuffer, contentType, metadata, folder, objectKey } = options;

  const key = (folder ? `${folder}/` : "") + (objectKey || generateFileKey(fileName));

  try {
    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: metadata,
    });

    await s3Client.send(command);
    console.log(`Image uploaded successfully: ${key}`);
    return key;
  } catch (error) {
    console.error("Error uploading image to R2:", error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Download an image file from R2 storage
 * @param fileKey - The S3 object key of the file
 * @returns The file buffer and metadata
 */
export async function downloadImage(fileKey: string): Promise<ImageDownloadResult> {
  assertR2Configured();
  try {
    const command = new GetObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: fileKey,
    });

    const response = await s3Client.send(command);
    const buffer = await collectResponseBody(response.Body);

    return {
      buffer,
      contentType: response.ContentType || "application/octet-stream",
      size: buffer.length,
    };
  } catch (error) {
    console.error("Error downloading image from R2:", error);
    throw new Error(
      `Failed to download image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

async function collectResponseBody(body: unknown): Promise<Buffer> {
  if (!body) {
    return Buffer.alloc(0);
  }

  if (body instanceof Readable) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of body) {
      chunks.push(chunk as Uint8Array);
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)));
  }

  if (typeof (body as any).arrayBuffer === "function") {
    const arrayBuffer = await (body as any).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (typeof body === "string") {
    return Buffer.from(body, "utf-8");
  }

  if (typeof (body as any).getReader === "function") {
    const reader = (body as any).getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value as Uint8Array);
      }
    }

    return Buffer.concat(chunks.map((c) => Buffer.from(c)));
  }

  throw new TypeError("Unsupported response body type");
}

/**
 * Delete an image file from R2 storage
 * @param fileKey - The S3 object key of the file
 */
export async function deleteImage(fileKey: string): Promise<void> {
  assertR2Configured();
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: fileKey,
    });

    await s3Client.send(command);
    console.log(`Image deleted successfully: ${fileKey}`);
  } catch (error) {
    console.error("Error deleting image from R2:", error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Check if an image exists in R2 storage
 * @param fileKey - The S3 object key of the file
 * @returns True if the file exists, false otherwise
 */
export async function imageExists(fileKey: string): Promise<boolean> {
  assertR2Configured();
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: fileKey,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.error("Error checking image existence:", error);
    throw new Error(
      `Failed to check image existence: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Generate a public URL for an image.
 *
 * If CF_R2_PUBLIC_DOMAIN is set (e.g. "https://assets.example.com"), that custom
 * domain is used — recommended for production because:
 *   - Custom domains support CORS configuration via Cloudflare dashboard.
 *   - They are cacheable by Cloudflare's CDN.
 *
 * Otherwise falls back to the private r2.cloudflarestorage.com endpoint, which
 * requires public bucket access to be enabled and does NOT support browser CORS.
 *
 * @param fileKey - The S3 object key of the file
 * @returns The public URL
 */
export function getImagePublicUrl(fileKey: string): string {
  if (R2_CONFIG.publicDomain) {
    return `${R2_CONFIG.publicDomain.replace(/\/$/, "")}/${fileKey}`;
  }
  return `https://${R2_CONFIG.bucketName}.${R2_CONFIG.accountId}.r2.cloudflarestorage.com/${fileKey}`;
}

/**
 * Configure CORS on the R2 bucket so the wedding-invite frontend can load images.
 *
 * Call this once during initial bucket setup or after changing allowed origins.
 * R2 accepts CORS rules via the S3-compatible PutBucketCors API.
 *
 * @param allowedOrigins - List of origins to allow (e.g. ["https://yourdomain.com"]).
 *   Pass ["*"] only during development; restrict to real origins in production.
 */
export async function configureBucketCors(allowedOrigins: string[]): Promise<void> {
  assertR2Configured();
  try {
    const command = new PutBucketCorsCommand({
      Bucket: R2_CONFIG.bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: allowedOrigins,
            AllowedMethods: ["GET", "HEAD"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["Content-Type", "Content-Length", "ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });
    await s3Client.send(command);
    console.log(`CORS configured for bucket ${R2_CONFIG.bucketName} — allowed origins: ${allowedOrigins.join(", ")}`);
  } catch (error) {
    console.error("Error configuring bucket CORS:", error);
    throw new Error(
      `Failed to configure bucket CORS: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Read the current CORS rules from the R2 bucket.
 * Useful for verifying that CORS is correctly configured.
 */
export async function getBucketCors(): Promise<Array<{
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAgeSeconds: number;
}>> {
  assertR2Configured();
  try {
    const command = new GetBucketCorsCommand({ Bucket: R2_CONFIG.bucketName });
    const response = await s3Client.send(command);
    return (response.CORSRules ?? []).map((rule) => ({
      allowedOrigins: rule.AllowedOrigins ?? [],
      allowedMethods: rule.AllowedMethods ?? [],
      allowedHeaders: rule.AllowedHeaders ?? [],
      maxAgeSeconds: rule.MaxAgeSeconds ?? 0,
    }));
  } catch (error: any) {
    // NoSuchCORSConfiguration means CORS has never been set
    if (error.name === "NoSuchCORSConfiguration" || error.$metadata?.httpStatusCode === 404) {
      return [];
    }
    console.error("Error reading bucket CORS:", error);
    throw new Error(
      `Failed to read bucket CORS: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Generate a signed URL for temporary access to an image
 * Useful for private buckets or time-limited downloads
 * @param fileKey - The S3 object key of the file
 * @param expirationSeconds - How long the URL is valid (default: 1 hour)
 * @returns The signed URL
 */
export async function getImageSignedUrl(
  fileKey: string,
  expirationSeconds: number = 3600,
): Promise<string> {
  assertR2Configured();
  try {
    const command = new GetObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: fileKey,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expirationSeconds,
    });

    return url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error(
      `Failed to generate signed URL: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * List all images in the bucket (useful for debugging)
 * @param prefix - Optional prefix to filter results
 * @returns Array of file keys
 */
export async function listImages(prefix?: string): Promise<string[]> {
  assertR2Configured();
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return (response.Contents || []).map((item) => item.Key || "");
  } catch (error) {
    console.error("Error listing images:", error);
    throw new Error(
      `Failed to list images: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Helper function to generate a unique file key with timestamp
 * @param originalFileName - The original file name
 * @returns A unique file key with timestamp
 */
function generateFileKey(originalFileName: string): string {
  const now = new Date();

  const pad = (n: number) => String(n).padStart(2, "0");

  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(
    now.getSeconds()
  )}`;

  const extension = originalFileName.split(".").pop() || "jpg";

  const name = originalFileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  return `${datePart}-${name}.${extension}`;
}

/**
 * Validate if a file is a supported image type
 * @param contentType - The MIME type of the file
 * @returns True if the file is a supported image type
 */
export function isValidImageType(contentType: string): boolean {
  const supportedTypes = ["image/png", "image/jpeg", "image/jpg"];
  return supportedTypes.includes(contentType.toLowerCase());
}

export default {
  uploadImage,
  downloadImage,
  deleteImage,
  imageExists,
  getImagePublicUrl,
  getImageSignedUrl,
  listImages,
  isValidImageType,
  configureBucketCors,
  getBucketCors,
};
