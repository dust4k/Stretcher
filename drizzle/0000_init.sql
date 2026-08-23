CREATE TABLE IF NOT EXISTS stretches (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  instagram_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'video',
  video_url TEXT,
  image_urls JSONB NOT NULL DEFAULT '[]',
  thumbnail_url TEXT,
  phase TEXT NOT NULL DEFAULT 'main',
  body_areas JSONB NOT NULL DEFAULT '[]',
  duration_sec INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  placement_rationale TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stretches_sort_order_idx ON stretches (sort_order);
