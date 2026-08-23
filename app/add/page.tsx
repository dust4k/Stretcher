"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "input" | "picker" | "processing" | "success" | "error";

interface PreviewItem {
  index: number;
  type: "video" | "image";
  previewUrl: string;
}

export default function AddPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [result, setResult] = useState<{
    title: string;
    rationale: string;
    insertIndex: number;
    id: number;
    mediaType?: string;
    imageCount?: number;
  } | null>(null);
  const [manualFiles, setManualFiles] = useState<File[]>([]);
  const [manualCaption, setManualCaption] = useState("");

  async function ingest(selected: number[]) {
    setStep("processing");
    setStatus("Downloading & analyzing…");
    setError("");

    const res = await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), selectedIndices: selected }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add stretch");

    setResult(data);
    setStep("success");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setStep("processing");
    setStatus("Fetching post media…");
    setError("");

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract media");

      if (data.needsPicker && data.items.length > 1) {
        setPreviewItems(data.items);
        setSelectedIndices(data.defaultSelection ?? data.items.map((i: PreviewItem) => i.index));
        setStep("picker");
        return;
      }

      await ingest(data.defaultSelection ?? [0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

  function toggleIndex(index: number) {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)
    );
  }

  async function handleManualUpload(e: React.FormEvent) {
    e.preventDefault();
    if (manualFiles.length === 0) return;

    setStep("processing");
    setStatus("Uploading media…");
    setError("");

    try {
      const formData = new FormData();
      for (const file of manualFiles) {
        formData.append("media", file);
      }
      if (url.trim()) formData.append("instagramUrl", url.trim());
      if (manualCaption.trim()) formData.append("caption", manualCaption.trim());

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      setStatus("Analyzing stretch…");

      const ingestRes = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual: true,
          mediaType: uploadData.mediaType,
          videoUrl: uploadData.videoUrl,
          imageUrls: uploadData.imageUrls,
          thumbnailUrl: uploadData.thumbnailUrl,
          caption: manualCaption || uploadData.caption,
          instagramUrl: url.trim() || undefined,
        }),
      });

      const data = await ingestRes.json();
      if (!ingestRes.ok) throw new Error(data.error || "Failed to add stretch");

      setResult(data);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="text-neutral-600">{status}</p>
      </div>
    );
  }

  if (step === "picker") {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold">Select Media</h1>
        <p className="mb-6 text-sm text-neutral-500">
          This post has {previewItems.length} items. Select which to include in your stretch.
        </p>
        <div className="mb-6 grid grid-cols-2 gap-3">
          {previewItems.map((item) => {
            const selected = selectedIndices.includes(item.index);
            return (
              <button
                key={item.index}
                type="button"
                onClick={() => toggleIndex(item.index)}
                className={`relative overflow-hidden rounded-lg border-2 ${
                  selected ? "border-brand-600" : "border-neutral-200 dark:border-neutral-700"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={`${item.type} ${item.index + 1}`}
                  className="aspect-square w-full object-cover"
                />
                <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs capitalize text-white">
                  {item.type}
                </span>
                {selected && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setStep("input")}
            className="flex-1 rounded-lg border border-neutral-300 py-3 font-medium dark:border-neutral-700"
          >
            Back
          </button>
          <button
            onClick={() => ingest(selectedIndices)}
            disabled={selectedIndices.length === 0}
            className="flex-1 rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Add {selectedIndices.length} item{selectedIndices.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    );
  }

  if (step === "success" && result) {
    return (
      <div className="py-8">
        <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-6 dark:border-brand-800 dark:bg-brand-950/30">
          <h2 className="text-xl font-bold text-brand-800 dark:text-brand-200">
            Added: {result.title}
          </h2>
          <p className="mt-2 text-sm text-brand-700 dark:text-brand-300">
            Placed at position {result.insertIndex + 1}
            {result.mediaType === "carousel" && result.imageCount
              ? ` · ${result.imageCount} photos`
              : result.mediaType === "image"
                ? " · photo"
                : ""}
          </p>
          <p className="mt-3 text-sm italic text-neutral-600 dark:text-neutral-400">
            {result.rationale}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700"
          >
            View Routine
          </button>
          <button
            onClick={() => {
              setStep("input");
              setUrl("");
              setResult(null);
              setManualFiles([]);
              setManualCaption("");
              setPreviewItems([]);
            }}
            className="flex-1 rounded-lg border border-neutral-300 py-3 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Add Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Add Stretch</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Paste an Instagram reel or post link. We&apos;ll download videos or photos and add them to your routine.
      </p>

      {step === "error" && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="mb-1 block text-sm font-medium">
            Instagram URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/reel/..."
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base dark:border-neutral-700 dark:bg-neutral-900"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Download &amp; Add
        </button>
      </form>

      {(step === "error" || step === "input") && (
        <div className="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <h2 className="mb-2 text-sm font-medium text-neutral-600">Manual fallback</h2>
          <p className="mb-4 text-xs text-neutral-400">
            If auto-download fails, save the video or photos from Instagram and upload them here.
          </p>
          <form onSubmit={handleManualUpload} className="space-y-4">
            <div>
              <label htmlFor="caption" className="mb-1 block text-sm font-medium">
                Caption / notes (optional)
              </label>
              <textarea
                id="caption"
                value={manualCaption}
                onChange={(e) => setManualCaption(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base dark:border-neutral-700 dark:bg-neutral-900"
                placeholder="Paste the post caption or describe the stretch…"
              />
            </div>
            <div>
              <label htmlFor="media" className="mb-1 block text-sm font-medium">
                Video or photo(s)
              </label>
              <input
                id="media"
                type="file"
                accept="video/mp4,video/quicktime,video/*,image/jpeg,image/png,image/webp,image/*"
                multiple
                onChange={(e) => setManualFiles(Array.from(e.target.files ?? []))}
                className="w-full text-sm"
                required={step === "error"}
              />
              {manualFiles.length > 1 && (
                <p className="mt-1 text-xs text-neutral-400">
                  {manualFiles.length} files selected — will be added as a step-by-step carousel
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={manualFiles.length === 0}
              className="w-full rounded-lg border border-neutral-300 py-3 font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Upload &amp; Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
