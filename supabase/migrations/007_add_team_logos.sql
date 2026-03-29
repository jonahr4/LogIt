-- Log It — Add Team Logos to sports_events
-- Migration 007: Store high-res logos natively from ESPN API

ALTER TABLE sports_events
ADD COLUMN home_team_logo TEXT,
ADD COLUMN away_team_logo TEXT;

-- Clear old BDL events to prepare for ESPN sync
-- (This cascades and deletes the related sports_events rows)
DELETE FROM events WHERE external_source = 'balldontlie';
