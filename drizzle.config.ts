import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./lib/db/connection";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
