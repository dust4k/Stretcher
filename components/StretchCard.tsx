import type { Stretch } from "@/lib/db/schema";
import { StretchMedia } from "./StretchMedia";

const phaseColors: Record<string, string> = {
  warmup: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  main: "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200",
  cooldown: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
};

export function StretchCard({
  stretch,
  index,
  expanded,
  onToggle,
}: {
  stretch: Stretch;
  index: number;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{stretch.title}</h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs capitalize ${phaseColors[stretch.phase] ?? phaseColors.main}`}
            >
              {stretch.phase}
            </span>
          </div>
          {stretch.bodyAreas.length > 0 && (
            <p className="mt-1 text-xs text-neutral-500">
              {stretch.bodyAreas.join(" · ")}
            </p>
          )}
          {stretch.durationSec && (
            <p className="mt-0.5 text-xs text-neutral-400">{stretch.durationSec}s hold</p>
          )}
          {stretch.mediaType === "carousel" && stretch.imageUrls.length > 1 && (
            <p className="mt-0.5 text-xs text-neutral-400">{stretch.imageUrls.length} photos</p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 px-4 pb-4 pt-3 dark:border-neutral-800">
          <StretchMedia stretch={stretch} className="mb-3 w-full rounded-lg bg-black" />
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {stretch.instructions}
          </div>
          {stretch.placementRationale && (
            <p className="mt-3 text-xs italic text-neutral-400">
              {stretch.placementRationale}
            </p>
          )}
          {stretch.instagramUrl && (
            <a
              href={stretch.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-brand-600 hover:underline"
            >
              View on Instagram
            </a>
          )}
          <a
            href={`/stretch/${stretch.id}`}
            className="mt-2 ml-3 inline-block text-xs text-neutral-500 hover:underline"
          >
            Edit
          </a>
        </div>
      )}
    </article>
  );
}
