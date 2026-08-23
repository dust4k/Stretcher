import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { checkDatabase, runMigrations } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!password || !verifyPassword(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await runMigrations();
    const db = await checkDatabase();

    return NextResponse.json({
      ok: true,
      message: "Database setup complete",
      tableExists: db.tableExists,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Setup failed",
      },
      { status: 500 }
    );
  }
}
