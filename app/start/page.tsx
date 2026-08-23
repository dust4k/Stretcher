"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Stretch } from "@/lib/db/schema";
import { StretchMedia } from "@/components/StretchMedia";

export default function StartPage() {
  const router = useRouter();
  const [stretches, setStretches] = useState<Stretch[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stretches")
      .then((r) => r.json())
      .then((data) => {
        setStretches(data.stretches ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (stretches.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-500">No stretches in your routine yet.</p>
        <button
          onClick={() => router.push("/add")}
          className="mt-4 text-brand-600 hover:underline"
        >
          Add a stretch
        </button>
      </div>
    );
  }

  const current = stretches[index];
  const isFirst = index === 0;
  const isLast = index === stretches.length - 1;

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="mb-2 flex items-center justify-between text-sm text-neutral-500">
        <span>
          {index + 1} of {stretches.length}
        </span>
        <span className="capitalize">{current.phase}</span>
      </div>

      <h1 className="mb-4 text-2xl font-bold">{current.title}</h1>

      <StretchMedia stretch={current} autoPlay className="mb-4 w-full rounded-xl bg-black" />

      {current.durationSec && (
        <p className="mb-3 text-center text-sm font-medium text-brand-600">
          Hold for {current.durationSec} seconds
        </p>
      )}

      <div className="mb-6 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {current.instructions}
      </div>

      {current.bodyAreas.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {current.bodyAreas.map((area) => (
            <span
              key={area}
              className="rounded-full bg-neutral-100 px-3 py-1 text-xs dark:bg-neutral-800"
            >
              {area}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex gap-3">
        <button
          onClick={() => setIndex((i) => i - 1)}
          disabled={isFirst}
          className="flex-1 rounded-lg border border-neutral-300 py-3 font-medium disabled:opacity-30 dark:border-neutral-700"
        >
          Previous
        </button>
        {isLast ? (
          <button
            onClick={() => router.push("/")}
            className="flex-1 rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700"
          >
            Done
          </button>
        ) : (
          <button
            onClick={() => setIndex((i) => i + 1)}
            className="flex-1 rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
