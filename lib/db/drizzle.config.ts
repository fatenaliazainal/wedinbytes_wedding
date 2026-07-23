import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // Load .env from the workspace root
  config({ path: "../../.env" });

  if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL, ensure the database is provisioned");
  }
  console.log("Loaded DATABASE_URL from .env file [development mode]");

}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
