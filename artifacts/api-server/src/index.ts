import app from "./app";
import { logger } from "./lib/logger";
import { autoSeedIfEmpty } from "./lib/autoSeed";
import { isR2Configured } from "./services/cloudflare/r2-storage-admin";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  if (!isR2Configured()) {
    logger.warn(
      {
        missing: [
          !process.env.CF_R2_ACCOUNT_ID && "CF_R2_ACCOUNT_ID",
          !process.env.CF_R2_ACCESS_KEY_ID && "CF_R2_ACCESS_KEY_ID",
          !process.env.CF_R2_SECRET_ACCESS_KEY && "CF_R2_SECRET_ACCESS_KEY",
          !process.env.CF_R2_BUCKET_NAME
            && !process.env.CF_R2_BUCKET_NAME_DEVELOPMENT
            && !process.env.CF_R2_BUCKET_NAME_PRODUCTION
            && "environment-specific R2 bucket name",
        ].filter(Boolean),
      },
      "R2 storage is NOT configured — photo uploads will return 503 until these secrets are added in the Replit Secrets panel",
    );
  } else {
    logger.info("R2 storage credentials detected — photo uploads enabled");
  }

  await autoSeedIfEmpty();
});
