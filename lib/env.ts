import type { PutBlobResult } from "@vercel/blob";
import { put } from "@vercel/blob";

type PutBody = Parameters<typeof put>[1];

export function hasBlobStorage(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_STORE_ID ||
      process.env.BLOB_TOKEN
  );
}

export async function uploadToBlob(
  pathname: string,
  body: PutBody,
  contentType: string
): Promise<PutBlobResult> {
  const options: Parameters<typeof put>[2] = {
    access: "public",
    contentType,
  };

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    options.token = process.env.BLOB_READ_WRITE_TOKEN;
  }

  return put(pathname, body, options);
}

export function hasOpenAIKey(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.startsWith("sk-"));
}
