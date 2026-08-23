import { NextResponse } from "next/server";
import { getAllStretches } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stretches = await getAllStretches();
    return NextResponse.json({ stretches });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch stretches" },
      { status: 500 }
    );
  }
}
