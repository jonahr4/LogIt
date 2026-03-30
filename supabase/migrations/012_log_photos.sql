-- 012: log_photos table
-- Stores metadata for photos attached to a user's log entry.
-- Actual photo files are stored in Firebase Storage at photos/{userId}/{logId}/{uuid}.jpg
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS log_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES user_event_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  firebase_path TEXT NOT NULL,   -- path in Firebase Storage, for client-side deletion
  url TEXT NOT NULL,             -- public Firebase download URL
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_log_photos_log_id ON log_photos(log_id);

-- RLS
ALTER TABLE log_photos ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own photos
CREATE POLICY "Users can insert own photos"
  ON log_photos FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own photos"
  ON log_photos FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Anyone can read (privacy enforcement happens at the log level)
CREATE POLICY "Photos are publicly readable"
  ON log_photos FOR SELECT
  USING (true);
