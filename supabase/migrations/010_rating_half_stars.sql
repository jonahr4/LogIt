-- 010: Support half-star ratings (0.5 increments)
-- Changes the rating column from INT to NUMERIC(2,1) to allow values like 3.5, 4.5
-- Run in Supabase SQL Editor

-- Drop existing CHECK constraint (Postgres names it automatically)
ALTER TABLE user_event_logs DROP CONSTRAINT IF EXISTS user_event_logs_rating_check;

-- Change column type from INT to NUMERIC(2,1)
ALTER TABLE user_event_logs ALTER COLUMN rating TYPE NUMERIC(2,1) USING rating::NUMERIC(2,1);

-- Add new CHECK constraint allowing 0.5 increments from 0.5 to 5.0
ALTER TABLE user_event_logs ADD CONSTRAINT user_event_logs_rating_check
  CHECK (rating >= 0.5 AND rating <= 5.0 AND (rating * 2) = FLOOR(rating * 2));
