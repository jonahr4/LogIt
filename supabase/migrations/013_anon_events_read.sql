-- Log It — Allow anon (unauthenticated) reads on events & sports_events
-- Migration 013: Public event data access
-- 
-- Events and sports schedules are public information.
-- This allows the admin portal and any future public-facing
-- features to read event data without authentication.

-- Events: anon can SELECT
CREATE POLICY "events_select_anon"
  ON events FOR SELECT
  TO anon
  USING (true);

-- Sports Events: anon can SELECT  
CREATE POLICY "sports_events_select_anon"
  ON sports_events FOR SELECT
  TO anon
  USING (true);
