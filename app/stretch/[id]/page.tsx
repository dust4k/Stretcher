"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Stretch } from "@/lib/db/schema";
import { StretchMedia } from "@/components/StretchMedia";

export default function StretchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [stretch, setStretch] = useState<Stretch | null>(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then(({ id: stretchId }) => {
      setId(stretchId);
      fetch(`/api/stretches/${stretchId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.stretch) {
            setStretch(data.stretch);
            setTitle(data.stretch.title);
            setInstructions(data.stretch.instructions);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [params]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/stretches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, instructions }),
      });
      if (res.ok) router.push("/");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this stretch from your routine?")) return;
    await fetch(`/api/stretches/${id}`, { method: "DELETE" });
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!stretch) {
    return <p className="py-20 text-center text-neutral-500">Stretch not found.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Stretch</h1>

      <StretchMedia stretch={stretch} className="mb-6 w-full rounded-xl bg-black" />

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900"
            required
          />
        </div>
        <div>
          <label htmlFor="instructions" className="mb-1 block text-sm font-medium">
            Instructions
          </label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>

      <button
        onClick={handleDelete}
        className="mt-4 w-full rounded-lg border border-red-300 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
      >
        Delete stretch
      </button>
    </div>
  );
}
