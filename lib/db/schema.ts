import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export type MediaType = "video" | "image" | "carousel";

export const stretches = pgTable("stretches", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  instructions: text("instructions").notNull(),
  instagramUrl: text("instagram_url"),
  mediaType: text("media_type").notNull().default("video"),
  videoUrl: text("video_url"),
  imageUrls: jsonb("image_urls").$type<string[]>().notNull().default([]),
  thumbnailUrl: text("thumbnail_url"),
  phase: text("phase").notNull().default("main"),
  bodyAreas: jsonb("body_areas").$type<string[]>().notNull().default([]),
  durationSec: integer("duration_sec"),
  sortOrder: integer("sort_order").notNull().default(0),
  placementRationale: text("placement_rationale"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Stretch = typeof stretches.$inferSelect;
export type NewStretch = typeof stretches.$inferInsert;

export function getStretchMediaUrls(stretch: Stretch): string[] {
  if (stretch.mediaType === "video" && stretch.videoUrl) {
    return [stretch.videoUrl];
  }
  if (stretch.imageUrls.length > 0) {
    return stretch.imageUrls;
  }
  if (stretch.videoUrl) {
    return [stretch.videoUrl];
  }
  return [];
}
