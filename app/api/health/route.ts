import { NextResponse } from "next/server";
import { checkDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await checkDatabase();

  const envOk = {
    auth: Boolean(process.env.AUTH_SECRET && process.env.APP_PASSWORD),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    openai: Boolean(process.env.OPENAI_API_KEY),
    database: db.ok,
  };

  const allOk = Object.values(envOk).every(Boolean) && db.tableExists;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      env: envOk,
      database: db,
      hint: !db.tableExists
        ? "Run POST /api/setup with your APP_PASSWORD to create the database table."
        : undefined,
    },
    { status: allOk ? 200 : 503 }
  );
}
