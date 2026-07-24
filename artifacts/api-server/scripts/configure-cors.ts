import { configureBucketCors } from "../src/services/cloudflare/r2-storage-admin";

async function main() {
  const origins = process.argv.slice(2);
  if (origins.length === 0) {
    console.error("Usage: tsx configure-cors.ts <origin1> [origin2] ...");
    process.exit(1);
  }
  await configureBucketCors(origins);
  console.log("CORS configured for:", origins);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
