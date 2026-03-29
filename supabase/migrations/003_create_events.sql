-- Log It — Create Events Table
-- Migration 003: Base events table per DATA_MODELS.md
-- Polymorphic base — child tables (sports_events, movie_events, etc.) extend via FK

-- Create enums
CREATE TYPE event_type AS ENUM ('sports', 'movie', 'concert', 'restaurant', 'nightlife', 'manual');
CREATE TYPE event_status AS ENUM ('upcoming', 'in_progress', 'completed');

-- Create base events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type event_type NOT NULL,
  title TEXT NOT NULL,
  status event_status DEFAULT 'upcoming',
  event_date TIMESTAMPTZ,
  venue_name TEXT,
  venue_city TEXT,
  venue_state TEXT,
  venue_lat DOUBLE PRECISION,
  venue_lng DOUBLE PRECISION,
  image_url TEXT,
  external_id TEXT,
  external_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deduplication: one external event = one row
CREATE UNIQUE INDEX idx_events_external_dedup
  ON events (external_id, external_source)
  WHERE external_id IS NOT NULL;

-- Query indexes
CREATE INDEX idx_events_event_type ON events (event_type);
CREATE INDEX idx_events_event_date ON events (event_date);
CREATE INDEX idx_events_venue_name ON events (venue_name);
CREATE INDEX idx_events_status ON events (status);

-- Full-text search on title + venue_name
CREATE INDEX idx_events_search ON events USING GIN (
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(venue_name, '') || ' ' || COALESCE(venue_city, ''))
);

-- Reuse updated_at trigger from migration 001
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
