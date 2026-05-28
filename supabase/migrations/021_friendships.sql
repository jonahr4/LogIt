-- Migration 021: Friendships table
-- Bidirectional friend system with pending/accepted/declined/blocked states

CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate requests and self-requests
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Indexes for common queries
CREATE INDEX idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id, status);
CREATE INDEX idx_friendships_status ON friendships(status) WHERE status = 'accepted';

-- RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can read friendships they're part of
CREATE POLICY "Users can read own friendships"
  ON friendships FOR SELECT
  USING (
    requester_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub')
    OR addressee_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- We use service role (supabase admin) for all writes, so no INSERT/UPDATE/DELETE policies needed
-- The API layer handles authorization checks
