-- Migration for photo/carousel support (run on existing databases)
ALTER TABLE stretches ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'video';
ALTER TABLE stretches ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]';
ALTER TABLE stretches ALTER COLUMN video_url DROP NOT NULL;
