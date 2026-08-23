import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "./connection";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (!client) {
    client = postgres(getDatabaseUrl(), { prepare: false });
  }
  return client;
}

export function getDb() {
  return drizzle(getClient(), { schema });
}

export async function checkDatabase(): Promise<{ ok: boolean; tableExists: boolean; error?: string }> {
  try {
    const sql = getClient();
    const rows = await sql`SELECT to_regclass('public.stretches') as table_exists`;
    return { ok: true, tableExists: Boolean(rows[0]?.table_exists) };
  } catch (err) {
    return {
      ok: false,
      tableExists: false,
      error: err instanceof Error ? err.message : "Database connection failed",
    };
  }
}

export async function runMigrations(): Promise<void> {
  const sql = getClient();
  await sql`
    CREATE TABLE IF NOT EXISTS stretches (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      instructions TEXT NOT NULL,
      instagram_url TEXT,
      media_type TEXT NOT NULL DEFAULT 'video',
      video_url TEXT,
      image_urls JSONB NOT NULL DEFAULT '[]',
      thumbnail_url TEXT,
      phase TEXT NOT NULL DEFAULT 'main',
      body_areas JSONB NOT NULL DEFAULT '[]',
      duration_sec INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      placement_rationale TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS stretches_sort_order_idx ON stretches (sort_order)`;
  // Safe upgrades for older schemas
  await sql`ALTER TABLE stretches ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'video'`;
  await sql`ALTER TABLE stretches ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]'`;
  await sql`ALTER TABLE stretches ALTER COLUMN video_url DROP NOT NULL`;
}
