import { NextResponse } from "next/server";
import type { MediaType } from "@/lib/db/schema";
import {
  extractInstagramPost,
  normalizeInstagramUrl,
  selectMediaItems,
  streamToBlob,
  uploadImageToBlob,
  type MediaItem,
} from "@/lib/instagram/extract";
import { analyzeAndPlaceStretch } from "@/lib/ai/place-stretch";
import { insertStretchAtIndex, getMaxSortOrder } from "@/lib/db/queries";

export const maxDuration = 60;

interface ManualIngestBody {
  manual: true;
  mediaType?: MediaType;
  videoUrl?: string;
  imageUrls?: string[];
  thumbnailUrl?: string;
  caption?: string;
  instagramUrl?: string;
}

interface UrlIngestBody {
  url: string;
  selectedIndices?: number[];
}

async function persistMediaItems(
  items: MediaItem[],
  shortcode: string
): Promise<{
  mediaType: MediaType;
  videoUrl?: string;
  imageUrls: string[];
  thumbnailUrl?: string;
}> {
  const videos = items.filter((i) => i.type === "video");
  const images = items.filter((i) => i.type === "image");

  if (videos.length === 1 && images.length === 0) {
    const blob = await streamToBlob(
      videos[0].url,
      `stretch-${shortcode}-${Date.now()}.mp4`,
      "video/mp4"
    );
    return {
      mediaType: "video",
      videoUrl: blob.url,
      imageUrls: [],
      thumbnailUrl: videos[0].thumbnailUrl
        ? await uploadImageToBlob(videos[0].thumbnailUrl, `thumb-${shortcode}-${Date.now()}.jpg`)
        : undefined,
    };
  }

  if (videos.length === 0 && images.length === 1) {
    const blob = await uploadImageToBlob(
      images[0].url,
      `stretch-${shortcode}-${Date.now()}.jpg`
    );
    if (!blob) throw new Error("Failed to download image");
    return {
      mediaType: "image",
      imageUrls: [blob],
      thumbnailUrl: blob,
    };
  }

  const uploadedImages: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const blob = await uploadImageToBlob(
      images[i].url,
      `stretch-${shortcode}-${i}-${Date.now()}.jpg`
    );
    if (blob) uploadedImages.push(blob);
  }

  if (uploadedImages.length === 0 && videos.length > 0) {
    const blob = await streamToBlob(
      videos[0].url,
      `stretch-${shortcode}-${Date.now()}.mp4`,
      "video/mp4"
    );
    return {
      mediaType: "video",
      videoUrl: blob.url,
      imageUrls: [],
      thumbnailUrl: videos[0].thumbnailUrl
        ? await uploadImageToBlob(videos[0].thumbnailUrl, `thumb-${shortcode}-${Date.now()}.jpg`)
        : undefined,
    };
  }

  if (uploadedImages.length === 0) {
    throw new Error("Failed to download any media from this post");
  }

  return {
    mediaType: "carousel",
    imageUrls: uploadedImages,
    thumbnailUrl: uploadedImages[0],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let mediaType: MediaType;
    let videoUrl: string | undefined;
    let imageUrls: string[] = [];
    let thumbnailUrl: string | undefined;
    let caption: string | undefined;
    let instagramUrl: string | undefined;

    if ("manual" in body && body.manual) {
      const manual = body as ManualIngestBody;
      mediaType = manual.mediaType ?? (manual.videoUrl ? "video" : manual.imageUrls?.length === 1 ? "image" : "carousel");
      videoUrl = manual.videoUrl;
      imageUrls = manual.imageUrls ?? [];
      thumbnailUrl = manual.thumbnailUrl ?? imageUrls[0];
      caption = manual.caption;
      instagramUrl = manual.instagramUrl;
    } else {
      const { url, selectedIndices } = body as UrlIngestBody;
      if (!url) {
        return NextResponse.json({ error: "Instagram URL required" }, { status: 400 });
      }

      instagramUrl = normalizeInstagramUrl(url);
      const post = await extractInstagramPost(instagramUrl);
      const items = selectMediaItems(post, selectedIndices);

      if (items.length === 0) {
        return NextResponse.json({ error: "No media selected" }, { status: 400 });
      }

      const shortcode = instagramUrl.match(/\/([A-Za-z0-9_-]+)\/?$/)?.[1] ?? Date.now().toString();
      const persisted = await persistMediaItems(items, shortcode);

      mediaType = persisted.mediaType;
      videoUrl = persisted.videoUrl;
      imageUrls = persisted.imageUrls;
      thumbnailUrl = persisted.thumbnailUrl;
      caption = post.caption;
    }

    const imageUrlsForAi =
      imageUrls.length > 0 ? imageUrls : thumbnailUrl ? [thumbnailUrl] : [];

    const placement = await analyzeAndPlaceStretch({
      caption,
      imageUrls: imageUrlsForAi,
      mediaCount: imageUrls.length || (videoUrl ? 1 : 0),
    });

    const maxOrder = await getMaxSortOrder();
    const insertIndex = Math.min(Math.max(0, placement.insertIndex), maxOrder + 1);

    const stretch = await insertStretchAtIndex(
      {
        title: placement.title,
        instructions: placement.instructions,
        instagramUrl,
        mediaType,
        videoUrl,
        imageUrls,
        thumbnailUrl,
        phase: placement.phase,
        bodyAreas: placement.bodyAreas,
        durationSec: placement.durationSec,
        placementRationale: placement.rationale,
      },
      insertIndex
    );

    return NextResponse.json({
      id: stretch.id,
      title: stretch.title,
      insertIndex: stretch.sortOrder,
      rationale: stretch.placementRationale,
      phase: stretch.phase,
      bodyAreas: stretch.bodyAreas,
      mediaType: stretch.mediaType,
      imageCount: stretch.imageUrls.length,
    });
  } catch (err) {
    console.error("Ingest error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to ingest stretch" },
      { status: 500 }
    );
  }
}
