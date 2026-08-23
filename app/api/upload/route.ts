import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("media") as File[];
    const singleVideo = formData.get("video") as File | null;
    const singleImage = formData.get("image") as File | null;
    const instagramUrl = formData.get("instagramUrl") as string | null;
    const caption = formData.get("caption") as string | null;

    const uploads: File[] = [
      ...files.filter(Boolean),
      ...(singleVideo ? [singleVideo] : []),
      ...(singleImage ? [singleImage] : []),
    ];

    if (uploads.length === 0) {
      return NextResponse.json({ error: "Media file required" }, { status: 400 });
    }

    const videoUrls: string[] = [];
    const imageUrls: string[] = [];

    for (let i = 0; i < uploads.length; i++) {
      const file = uploads[i];
      const isVideo = file.type.startsWith("video/");
      const ext = isVideo ? "mp4" : "jpg";
      const filename = `stretch-manual-${Date.now()}-${i}.${ext}`;
      const blob = await put(filename, file, {
        access: "public",
        contentType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      if (isVideo) {
        videoUrls.push(blob.url);
      } else {
        imageUrls.push(blob.url);
      }
    }

    let mediaType: "video" | "image" | "carousel" = "video";
    if (videoUrls.length === 0 && imageUrls.length === 1) mediaType = "image";
    if (imageUrls.length > 1 || (imageUrls.length >= 1 && videoUrls.length === 0 && uploads.length > 1)) {
      mediaType = imageUrls.length > 1 ? "carousel" : mediaType;
    }

    return NextResponse.json({
      mediaType,
      videoUrl: videoUrls[0],
      imageUrls,
      thumbnailUrl: imageUrls[0] ?? undefined,
      instagramUrl: instagramUrl ?? undefined,
      caption: caption ?? undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
