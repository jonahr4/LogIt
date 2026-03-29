-- 009: Multi-field fuzzy search with typo tolerance
-- Uses pg_trgm for trigram similarity (handles typos like "Celitcs" → "Celtics")
-- Run in Supabase SQL Editor

-- Enable the trigram extension (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for fast fuzzy matching
CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON events USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_venue_name_trgm ON events USING gin (venue_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_venues_name_trgm ON venues USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sports_home_team_trgm ON sports_events USING gin (home_team_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sports_away_team_trgm ON sports_events USING gin (away_team_name gin_trgm_ops);

-- Lower the similarity threshold for more forgiving typo tolerance (default is 0.3)
SELECT set_limit(0.2);

-- Drop old version if return type changed
DROP FUNCTION IF EXISTS search_events(text, text, timestamptz, timestamptz, int);

-- Multi-field fuzzy search function
CREATE OR REPLACE FUNCTION search_events(
  search_term TEXT,
  event_type_filter TEXT DEFAULT NULL,
  date_from_filter TIMESTAMPTZ DEFAULT NULL,
  date_to_filter TIMESTAMPTZ DEFAULT NULL,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  title TEXT,
  status TEXT,
  event_date TIMESTAMPTZ,
  venue_name TEXT,
  venue_city TEXT,
  venue_state TEXT,
  image_url TEXT,
  external_id TEXT,
  -- Venue (from venues table)
  v_name TEXT,
  v_city TEXT,
  v_state TEXT,
  v_lat DOUBLE PRECISION,
  v_lng DOUBLE PRECISION,
  v_image_url TEXT,
  -- Sports metadata
  sport TEXT,
  league TEXT,
  season TEXT,
  home_team_id TEXT,
  away_team_id TEXT,
  home_team_name TEXT,
  away_team_name TEXT,
  home_team_logo TEXT,
  away_team_logo TEXT,
  home_score INT,
  away_score INT,
  -- Relevance score for ordering
  relevance REAL
) AS $$
DECLARE
  pattern TEXT := '%' || search_term || '%';
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (sub.relevance, sub.event_date, sub.id)
    sub.*
  FROM (
    SELECT
      e.id,
      e.event_type,
      e.title,
      e.status,
      e.event_date,
      e.venue_name,
      e.venue_city,
      e.venue_state,
      e.image_url,
      e.external_id,
      v.name AS v_name,
      v.city AS v_city,
      v.state AS v_state,
      v.lat AS v_lat,
      v.lng AS v_lng,
      v.image_url AS v_image_url,
      se.sport,
      se.league,
      se.season,
      se.home_team_id,
      se.away_team_id,
      se.home_team_name,
      se.away_team_name,
      se.home_team_logo,
      se.away_team_logo,
      se.home_score,
      se.away_score,
      -- Compute best similarity score across all fields
      GREATEST(
        similarity(e.title, search_term),
        similarity(COALESCE(e.venue_name, ''), search_term),
        similarity(COALESCE(e.venue_city, ''), search_term),
        similarity(COALESCE(v.name, ''), search_term),
        similarity(COALESCE(v.city, ''), search_term),
        similarity(COALESCE(se.home_team_name, ''), search_term),
        similarity(COALESCE(se.away_team_name, ''), search_term),
        similarity(COALESCE(se.league, ''), search_term)
      ) AS relevance
    FROM events e
    LEFT JOIN venues v ON e.venue_id = v.id
    LEFT JOIN sports_events se ON se.event_id = e.id
    WHERE (
      -- Exact substring match (fast, handles "bos" → "Boston")
      e.title ILIKE pattern
      OR e.venue_name ILIKE pattern
      OR e.venue_city ILIKE pattern
      OR v.name ILIKE pattern
      OR v.city ILIKE pattern
      OR se.home_team_name ILIKE pattern
      OR se.away_team_name ILIKE pattern
      OR se.league ILIKE pattern
      OR se.sport ILIKE pattern
      -- Fuzzy trigram match (handles typos like "Celitcs" → "Celtics")
      OR e.title % search_term
      OR COALESCE(e.venue_name, '') % search_term
      OR COALESCE(v.name, '') % search_term
      OR COALESCE(se.home_team_name, '') % search_term
      OR COALESCE(se.away_team_name, '') % search_term
    )
    AND (event_type_filter IS NULL OR e.event_type = event_type_filter)
    AND (date_from_filter IS NULL OR e.event_date >= date_from_filter)
    AND (date_to_filter IS NULL OR e.event_date <= date_to_filter)
  ) sub
  ORDER BY sub.relevance DESC, sub.event_date DESC, sub.id
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
