"use client";

import { useState } from "react";
import type { Stretch } from "@/lib/db/schema";

export function StretchMedia({
  stretch,
  autoPlay = false,
  className = "mb-3 w-full rounded-lg bg-black",
}: {
  stretch: Pick<Stretch, "mediaType" | "videoUrl" | "imageUrls" | "thumbnailUrl">;
  autoPlay?: boolean;
  className?: string;
}) {
  const [slide, setSlide] = useState(0);

  if (stretch.mediaType === "video" && stretch.videoUrl) {
    return (
      <video
        src={stretch.videoUrl}
        controls
        autoPlay={autoPlay}
        playsInline
        loop
        className={className}
        poster={stretch.thumbnailUrl ?? undefined}
      />
    );
  }

  const images =
    stretch.imageUrls.length > 0
      ? stretch.imageUrls
      : stretch.thumbnailUrl
        ? [stretch.thumbnailUrl]
        : [];

  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 text-sm text-neutral-400 ${className}`}>
        No media
      </div>
    );
  }

  if (images.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={images[0]}
        alt="Stretch reference"
        className={`${className} object-contain`}
      />
    );
  }

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[slide]}
        alt={`Stretch step ${slide + 1}`}
        className={`${className} object-contain`}
      />
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSlide((s) => Math.max(0, s - 1))}
          disabled={slide === 0}
          className="rounded px-3 py-1 text-sm disabled:opacity-30"
        >
          Prev
        </button>
        <span className="text-xs text-neutral-500">
          {slide + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={() => setSlide((s) => Math.min(images.length - 1, s + 1))}
          disabled={slide === images.length - 1}
          className="rounded px-3 py-1 text-sm disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
