-- Log It — Create User Event Logs & Log Companions Tables
-- Migration 005: user_event_logs + log_companions per DATA_MODELS.md

-- Create user_event_logs table
CREATE TABLE user_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  notes TEXT,
  privacy privacy_level DEFAULT 'public',  -- reuses enum from migration 001
  rating INT CHECK (rating >= 1 AND rating <= 5),
  photos TEXT[] DEFAULT '{}',
  logged_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- One log per user per event (prevent duplicates)
CREATE UNIQUE INDEX idx_user_event_logs_unique
  ON user_event_logs (user_id, event_id);

-- Query indexes
CREATE INDEX idx_user_event_logs_user_date ON user_event_logs (user_id, logged_at DESC);
CREATE INDEX idx_user_event_logs_event ON user_event_logs (event_id);
CREATE INDEX idx_user_event_logs_privacy ON user_event_logs (privacy);
CREATE INDEX idx_user_event_logs_logged_at ON user_event_logs (logged_at DESC);

-- Updated_at trigger
CREATE TRIGGER user_event_logs_updated_at
  BEFORE UPDATE ON user_event_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create log_companions table
CREATE TABLE log_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES user_event_logs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- nullable: linked friend
  name TEXT NOT NULL                                      -- freeform or auto-filled from profile
);

-- Query indexes
CREATE INDEX idx_log_companions_log ON log_companions (log_id);
CREATE INDEX idx_log_companions_user ON log_companions (user_id) WHERE user_id IS NOT NULL;
