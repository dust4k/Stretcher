import { NextResponse } from "next/server";
import { checkDatabase } from "@/lib/db";
import { hasBlobStorage, hasOpenAIKey } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await checkDatabase();

  const envOk = {
    appPassword: Boolean(process.env.APP_PASSWORD),
    authSecret: Boolean(process.env.AUTH_SECRET),
    blob: hasBlobStorage(),
    openai: hasOpenAIKey(),
    database: db.ok,
  };
  const authReady = envOk.appPassword && envOk.authSecret;

  const allOk = authReady && envOk.blob && envOk.openai && db.tableExists;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      env: envOk,
      database: db,
      hint: !db.tableExists
        ? "Run POST /api/setup with your APP_PASSWORD to create the database table."
        : !hasOpenAIKey()
          ? "Add a valid OPENAI_API_KEY (sk-...) in Vercel environment variables."
          : !hasBlobStorage()
            ? "Connect a Vercel Blob store to this project."
            : undefined,
    },
    { status: allOk ? 200 : 503 }
  );
}
