-- 011: Improved fuzzy search + pagination offset
--
-- Fixes over migration 009:
--   1. Adds fuzzystrmatch (levenshtein) for transposition typos ("celitcs" → "Celtics")
--   2. Fixes pg_trgm threshold — migration 009 used session-level set_limit() which didn't
--      persist across API calls. Now called inside the function so it applies every time.
--   3. Adds word_similarity (better for partial term matching than similarity alone)
--   4. Adds result_offset param for client-side pagination
--   5. Bumps default limit to 40
--
-- Run in Supabase SQL Editor

-- Enable levenshtein (available in Supabase by default, no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Drop old versions (covers both old and new signatures)
DROP FUNCTION IF EXISTS search_events(text, text, timestamptz, timestamptz, int);
DROP FUNCTION IF EXISTS search_events(text, text, timestamptz, timestamptz, int, int);

CREATE OR REPLACE FUNCTION search_events(
  search_term TEXT,
  event_type_filter TEXT DEFAULT NULL,
  date_from_filter TIMESTAMPTZ DEFAULT NULL,
  date_to_filter TIMESTAMPTZ DEFAULT NULL,
  result_limit INT DEFAULT 40,
  result_offset INT DEFAULT 0
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
  v_name TEXT,
  v_city TEXT,
  v_state TEXT,
  v_lat DOUBLE PRECISION,
  v_lng DOUBLE PRECISION,
  v_image_url TEXT,
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
  relevance REAL
) AS $$
DECLARE
  pattern TEXT := '%' || search_term || '%';
  term_len INT := length(search_term);
BEGIN
  -- Fix: set threshold for this function's transaction.
  -- Migration 009 called set_limit() in a migration script (session-only),
  -- so it reverted to the default 0.3 on every new API call.
  PERFORM set_limit(0.15);

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
      -- Relevance: best score across similarity, word_similarity, and levenshtein proximity
      GREATEST(
        similarity(e.title, search_term),
        word_similarity(search_term, e.title),
        similarity(COALESCE(e.venue_name, ''), search_term),
        similarity(COALESCE(e.venue_city, ''), search_term),
        similarity(COALESCE(v.name, ''), search_term),
        word_similarity(search_term, COALESCE(v.name, '')),
        similarity(COALESCE(se.home_team_name, ''), search_term),
        word_similarity(search_term, COALESCE(se.home_team_name, '')),
        similarity(COALESCE(se.away_team_name, ''), search_term),
        word_similarity(search_term, COALESCE(se.away_team_name, '')),
        similarity(COALESCE(se.league, ''), search_term),
        -- Levenshtein proximity score: 1.0 = exact match, decays per edit
        -- Only applied to team names (short strings where it's most useful)
        CASE WHEN term_len >= 4 AND se.home_team_name IS NOT NULL
          THEN GREATEST(0, 1.0 - levenshtein(lower(search_term), lower(se.home_team_name))::float / 5.0)
          ELSE 0 END,
        CASE WHEN term_len >= 4 AND se.away_team_name IS NOT NULL
          THEN GREATEST(0, 1.0 - levenshtein(lower(search_term), lower(se.away_team_name))::float / 5.0)
          ELSE 0 END
      ) AS relevance
    FROM events e
    LEFT JOIN venues v ON e.venue_id = v.id
    LEFT JOIN sports_events se ON se.event_id = e.id
    WHERE (
      -- Fast path: exact substring match (uses trgm index)
      e.title ILIKE pattern
      OR e.venue_name ILIKE pattern
      OR e.venue_city ILIKE pattern
      OR v.name ILIKE pattern
      OR v.city ILIKE pattern
      OR se.home_team_name ILIKE pattern
      OR se.away_team_name ILIKE pattern
      OR se.league ILIKE pattern
      OR se.sport::text ILIKE pattern
      -- Trigram similarity (handles one-letter typos, uses index)
      OR e.title % search_term
      OR COALESCE(v.name, '') % search_term
      OR COALESCE(se.home_team_name, '') % search_term
      OR COALESCE(se.away_team_name, '') % search_term
      -- Levenshtein: catches transposition typos ("celitcs" → "Celtics")
      -- Splits team name into individual words and checks each word separately.
      -- e.g. "Boston Celtics" → checks "boston" and "celtics" independently.
      -- Only fires for terms >= 4 chars; edit distance <= 2
      OR (term_len >= 4 AND se.home_team_name IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(regexp_split_to_array(lower(se.home_team_name), '\s+')) w
          WHERE levenshtein(lower(search_term), w) <= 2
      ))
      OR (term_len >= 4 AND se.away_team_name IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(regexp_split_to_array(lower(se.away_team_name), '\s+')) w
          WHERE levenshtein(lower(search_term), w) <= 2
      ))
    )
    AND (event_type_filter IS NULL OR e.event_type = event_type_filter)
    AND (date_from_filter IS NULL OR e.event_date >= date_from_filter)
    AND (date_to_filter IS NULL OR e.event_date <= date_to_filter)
  ) sub
  ORDER BY sub.relevance DESC, sub.event_date DESC, sub.id
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql STABLE;
