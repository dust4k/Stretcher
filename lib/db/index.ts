import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!client) {
    client = postgres(process.env.DATABASE_URL, { prepare: false });
  }
  return client;
}

export function getDb() {
  return drizzle(getClient(), { schema });
}
