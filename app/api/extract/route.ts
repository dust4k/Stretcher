import { NextResponse } from "next/server";
import {
  defaultSelectedIndices,
  extractInstagramPost,
  normalizeInstagramUrl,
} from "@/lib/instagram/extract";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "Instagram URL required" }, { status: 400 });
    }

    const normalized = normalizeInstagramUrl(url);
    const post = await extractInstagramPost(normalized);

    const items = post.items.map((item, index) => ({
      index,
      type: item.type,
      previewUrl: item.thumbnailUrl ?? item.url,
    }));

    const defaultSelection = defaultSelectedIndices(post.items);

    return NextResponse.json({
      caption: post.caption,
      source: post.source,
      items,
      defaultSelection,
      needsPicker: post.items.length > 1,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to extract media" },
      { status: 500 }
    );
  }
}
