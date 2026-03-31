-- Add season_type and round columns to sports_events
-- season_type: 1=preseason, 2=regular, 3=postseason, 4=offseason (from ESPN season.type)
-- round: playoff round name from ESPN notes headline, e.g. "Super Bowl LX", "NBA Finals - Game 7"

ALTER TABLE sports_events
  ADD COLUMN IF NOT EXISTS season_type INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS round TEXT;

-- Index for filtering by season type
CREATE INDEX IF NOT EXISTS idx_sports_events_season_type ON sports_events (season_type);
