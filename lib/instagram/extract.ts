import { uploadToBlob } from "@/lib/env";

export interface MediaItem {
  type: "video" | "image";
  url: string;
  thumbnailUrl?: string;
}

export interface ExtractedPost {
  items: MediaItem[];
  caption?: string;
  source: string;
}

export function normalizeInstagramUrl(url: string): string {
  const trimmed = url.trim();
  const match = trimmed.match(
    /https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/
  );
  if (!match) {
    throw new Error("Invalid Instagram URL. Use a /reel/, /p/, or /tv/ link.");
  }
  const type = trimmed.includes("/reel/") ? "reel" : trimmed.includes("/tv/") ? "tv" : "p";
  return `https://www.instagram.com/${type}/${match[1]}/`;
}

function dedupeItems(items: MediaItem[]): MediaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

async function extractWithUltraIgdl(url: string): Promise<ExtractedPost | null> {
  try {
    const { default: UltraIgdl } = await import("ultra-igdl");
    const sessionId = process.env.INSTAGRAM_SESSION_ID;
    const ig = new UltraIgdl(sessionId ? { sessionId } : {});
    const result = await ig.download(url);

    if (!("media" in result) || !result.media?.length) return null;

    const items: MediaItem[] = result.media.map((m) => ({
      type: m.type === "video" ? "video" : "image",
      url: m.url,
      thumbnailUrl: m.thumbnail,
    }));

    return {
      items: dedupeItems(items),
      caption: result.caption || undefined,
      source: "ultra-igdl",
    };
  } catch {
    return null;
  }
}

async function extractWithInstagramUrlDirect(url: string): Promise<ExtractedPost | null> {
  try {
    const { instagramGetUrl } = await import("instagram-url-direct");
    const data = await instagramGetUrl(url);

    const items: MediaItem[] = [];

    if (data.media_details?.length) {
      for (const m of data.media_details) {
        items.push({
          type: m.type === "video" ? "video" : "image",
          url: m.url,
          thumbnailUrl: m.thumbnail,
        });
      }
    } else if (data.url_list?.length) {
      for (const mediaUrl of data.url_list) {
        items.push({
          type: mediaUrl.includes(".mp4") ? "video" : "image",
          url: mediaUrl,
        });
      }
    }

    if (items.length === 0) return null;

    return {
      items: dedupeItems(items),
      caption: undefined,
      source: "instagram-url-direct",
    };
  } catch {
    return null;
  }
}

async function extractFromHtml(url: string): Promise<ExtractedPost | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const ogVideo = html.match(/property="og:video" content="([^"]+)"/)?.[1];
    const ogImage = html.match(/property="og:image" content="([^"]+)"/)?.[1];
    const ogDesc = html.match(/property="og:description" content="([^"]+)"/)?.[1];

    const items: MediaItem[] = [];

    if (ogVideo) {
      items.push({
        type: "video",
        url: ogVideo.replace(/&amp;/g, "&"),
        thumbnailUrl: ogImage?.replace(/&amp;/g, "&"),
      });
    } else {
      const jsonVideo = html.match(/"video_url":"([^"]+)"/)?.[1];
      if (jsonVideo) {
        items.push({
          type: "video",
          url: jsonVideo.replace(/\\u0026/g, "&").replace(/\\\//g, "/"),
          thumbnailUrl: ogImage?.replace(/&amp;/g, "&"),
        });
      }
    }

    if (items.length === 0 && ogImage) {
      items.push({
        type: "image",
        url: ogImage.replace(/&amp;/g, "&"),
      });
    }

    if (items.length === 0) return null;

    return {
      items,
      caption: ogDesc?.replace(/&amp;/g, "&"),
      source: ogVideo ? "html-og" : "html-image",
    };
  } catch {
    return null;
  }
}

export async function extractInstagramPost(url: string): Promise<ExtractedPost> {
  const normalized = normalizeInstagramUrl(url);

  const extractors = [
    () => extractWithUltraIgdl(normalized),
    () => extractWithInstagramUrlDirect(normalized),
    () => extractFromHtml(normalized),
  ];

  for (const extract of extractors) {
    const result = await extract();
    if (result && result.items.length > 0) return result;
  }

  throw new Error(
    "Could not extract media from this Instagram post. Try setting INSTAGRAM_SESSION_ID or use manual upload."
  );
}

export function selectMediaItems(
  post: ExtractedPost,
  selectedIndices?: number[]
): MediaItem[] {
  if (!selectedIndices || selectedIndices.length === 0) {
    return post.items;
  }
  return selectedIndices
    .filter((i) => i >= 0 && i < post.items.length)
    .map((i) => post.items[i]);
}

export function defaultSelectedIndices(items: MediaItem[]): number[] {
  const videoIndex = items.findIndex((i) => i.type === "video");
  if (videoIndex >= 0 && items.length === 1) {
    return [videoIndex];
  }
  if (items.every((i) => i.type === "image")) {
    return items.map((_, i) => i);
  }
  const videos = items.map((item, i) => (item.type === "video" ? i : -1)).filter((i) => i >= 0);
  if (videos.length === 1 && items.length > 1) {
    return videos;
  }
  return items.map((_, i) => i);
}

export async function streamToBlob(
  mediaUrl: string,
  filename: string,
  contentType: string
): Promise<{ url: string; pathname: string }> {
  const res = await fetch(mediaUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.instagram.com/",
    },
  });

  if (!res.ok || !res.body) {
    throw new Error(`Failed to download media (${res.status})`);
  }

  const blob = await uploadToBlob(filename, res.body, contentType);

  return { url: blob.url, pathname: blob.pathname };
}

export async function uploadImageToBlob(
  imageUrl: string,
  filename: string
): Promise<string | undefined> {
  try {
    const result = await streamToBlob(imageUrl, filename, "image/jpeg");
    return result.url;
  } catch {
    return undefined;
  }
}

// Backward-compatible alias
export async function extractInstagramMedia(url: string) {
  const post = await extractInstagramPost(url);
  const video = post.items.find((i) => i.type === "video");
  if (!video) {
    throw new Error("No video found in post");
  }
  return {
    videoUrl: video.url,
    thumbnailUrl: video.thumbnailUrl ?? post.items.find((i) => i.type === "image")?.url,
    caption: post.caption,
    source: post.source,
  };
}

export async function uploadThumbnailToBlob(
  thumbnailUrl: string,
  filename: string
): Promise<string | undefined> {
  return uploadImageToBlob(thumbnailUrl, filename);
}
