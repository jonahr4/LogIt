-- Log It — Row Level Security for Events, Sports Events, Logs, Companions
-- Migration 006: RLS policies

-- ═══════════════════════════════════════════
-- EVENTS — public read, server-only write
-- ═══════════════════════════════════════════
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read events
CREATE POLICY "events_select_all"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update (cron jobs, API routes)
-- No explicit policy needed — service role bypasses RLS

-- ═══════════════════════════════════════════
-- SPORTS_EVENTS — same as events
-- ═══════════════════════════════════════════
ALTER TABLE sports_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sports_events_select_all"
  ON sports_events FOR SELECT
  TO authenticated
  USING (true);

-- ═══════════════════════════════════════════
-- USER_EVENT_LOGS — owner CRUD, public read for public logs
-- ═══════════════════════════════════════════
ALTER TABLE user_event_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own logs
CREATE POLICY "logs_select_own"
  ON user_event_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Anyone can read public logs (for feed)
CREATE POLICY "logs_select_public"
  ON user_event_logs FOR SELECT
  TO authenticated
  USING (privacy = 'public');

-- Users can insert their own logs
CREATE POLICY "logs_insert_own"
  ON user_event_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own logs
CREATE POLICY "logs_update_own"
  ON user_event_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own logs
CREATE POLICY "logs_delete_own"
  ON user_event_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════
-- LOG_COMPANIONS — access via log ownership
-- ═══════════════════════════════════════════
ALTER TABLE log_companions ENABLE ROW LEVEL SECURITY;

-- Users can read companions of their own logs
CREATE POLICY "companions_select_own"
  ON log_companions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_event_logs
      WHERE user_event_logs.id = log_companions.log_id
        AND user_event_logs.user_id = auth.uid()
    )
  );

-- Users can read companions of public logs (for feed)
CREATE POLICY "companions_select_public"
  ON log_companions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_event_logs
      WHERE user_event_logs.id = log_companions.log_id
        AND user_event_logs.privacy = 'public'
    )
  );

-- Users can insert companions to their own logs
CREATE POLICY "companions_insert_own"
  ON log_companions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_event_logs
      WHERE user_event_logs.id = log_companions.log_id
        AND user_event_logs.user_id = auth.uid()
    )
  );

-- Users can delete companions from their own logs
CREATE POLICY "companions_delete_own"
  ON log_companions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_event_logs
      WHERE user_event_logs.id = log_companions.log_id
        AND user_event_logs.user_id = auth.uid()
    )
  );
