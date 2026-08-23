import { getAllStretches } from "@/lib/db/queries";
import { RoutineList } from "@/components/RoutineList";
import Link from "next/link";
import type { Stretch } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let stretches: Stretch[] = [];
  try {
    stretches = await getAllStretches();
  } catch {
    stretches = [];
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Routine</h1>
          <p className="text-sm text-neutral-500">
            {stretches.length} stretch{stretches.length !== 1 ? "es" : ""}
          </p>
        </div>
        {stretches.length > 0 && (
          <Link
            href="/start"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Start
          </Link>
        )}
      </div>
      <RoutineList stretches={stretches} />
    </div>
  );
}
