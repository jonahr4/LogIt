-- 019: Add rooted_team column to user_event_logs
-- Tracks which team the user rooted for: 'home', 'away', or NULL (no preference).
-- W/L badge in the UI is based on this value.
-- Default existing logs to 'home' to preserve current W/L behavior.

ALTER TABLE user_event_logs
  ADD COLUMN rooted_team text DEFAULT NULL;

-- Backfill existing sports logs to 'home' so current W/L badges are preserved
UPDATE user_event_logs
SET rooted_team = 'home'
WHERE event_id IN (
  SELECT event_id FROM sports_events
);
