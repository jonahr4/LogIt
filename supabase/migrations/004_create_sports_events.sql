-- Log It — Create Sports Events Child Table
-- Migration 004: sports_events extends events (1:1 via event_id)

-- Create sport type enum
CREATE TYPE sport_type AS ENUM ('basketball', 'baseball', 'football', 'hockey');

-- Create sports_events child table
CREATE TABLE sports_events (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  sport sport_type NOT NULL,
  league TEXT NOT NULL,           -- 'NBA', 'MLB', 'NFL', 'NHL'
  season TEXT,                    -- e.g. '2025-26'
  home_team_id TEXT,
  away_team_id TEXT,
  home_team_name TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_score INT,
  away_score INT
);

-- Query indexes
CREATE INDEX idx_sports_events_sport ON sports_events (sport);
CREATE INDEX idx_sports_events_league ON sports_events (league);
CREATE INDEX idx_sports_events_home_team ON sports_events (home_team_id);
CREATE INDEX idx_sports_events_away_team ON sports_events (away_team_id);
CREATE INDEX idx_sports_events_season ON sports_events (season);
