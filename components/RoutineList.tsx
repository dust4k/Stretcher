"use client";

import { useState } from "react";
import type { Stretch } from "@/lib/db/schema";
import { StretchCard } from "./StretchCard";

export function RoutineList({ stretches }: { stretches: Stretch[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (stretches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
        <p className="text-neutral-500">No stretches yet.</p>
        <a href="/add" className="mt-2 inline-block text-brand-600 hover:underline">
          Add your first stretch from Instagram
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stretches.map((stretch, i) => (
        <StretchCard
          key={stretch.id}
          stretch={stretch}
          index={i}
          expanded={expandedId === stretch.id}
          onToggle={() =>
            setExpandedId(expandedId === stretch.id ? null : stretch.id)
          }
        />
      ))}
    </div>
  );
}
