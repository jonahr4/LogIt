-- 020: Merge restaurant + nightlife → food_drinks, add theater
-- NOTE: In Postgres, ALTER TYPE ADD VALUE must be committed before the new
-- values can be referenced. Run the two blocks below in separate transactions
-- (or separate executions in the Supabase SQL editor).

-- ── Step 1: Add new enum values ──────────────────────────────────────────────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'food_drinks';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'theater';

-- ── Step 2: Run AFTER Step 1 is committed ────────────────────────────────────

-- Drop old child tables (no data exists)
DROP TABLE IF EXISTS restaurant_events;
DROP TABLE IF EXISTS nightlife_events;

-- Create merged food_drinks_events
CREATE TABLE food_drinks_events (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  cuisine TEXT,                    -- e.g. 'Italian', 'Japanese', 'Mexican'
  price_level TEXT,                -- '$', '$$', '$$$', '$$$$'
  venue_type TEXT,                 -- 'restaurant', 'bar', 'club', 'lounge', 'rooftop', 'pub', 'cafe'
  vibe TEXT,                       -- 'chill', 'high-energy', 'romantic', 'underground'
  dress_code TEXT,                 -- 'casual', 'smart casual', 'formal'
  music_genre TEXT                 -- 'house', 'hip-hop', 'live DJ', 'jazz'
);

CREATE INDEX idx_food_drinks_cuisine ON food_drinks_events (cuisine);
CREATE INDEX idx_food_drinks_venue_type ON food_drinks_events (venue_type);

-- Create theater_events
CREATE TABLE theater_events (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  show_name TEXT,                  -- e.g. 'Hamilton', 'The Lion King'
  performer TEXT,                  -- lead performer or company
  seat_section TEXT,               -- 'Orchestra', 'Mezzanine', 'Balcony'
  production_company TEXT,         -- e.g. 'Broadway', 'National Tour'
  show_type TEXT                   -- 'musical', 'play', 'comedy', 'opera', 'ballet', 'standup'
);

CREATE INDEX idx_theater_show_name ON theater_events (show_name);
CREATE INDEX idx_theater_show_type ON theater_events (show_type);
