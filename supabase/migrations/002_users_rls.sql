-- Log It — Row Level Security for Users
-- Migration 002: RLS policies

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read public user fields
-- (field-level filtering happens in the API layer)
CREATE POLICY users_select_authenticated
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can only update their own profile
CREATE POLICY users_update_own
  ON users
  FOR UPDATE
  TO authenticated
  USING (firebase_uid = auth.jwt() ->> 'sub')
  WITH CHECK (firebase_uid = auth.jwt() ->> 'sub');

-- Policy: Insert is done via service role from API (no direct client inserts)
-- The Vercel API uses the service role key for signups
CREATE POLICY users_insert_service
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Users cannot delete their own account (admin only)
CREATE POLICY users_delete_admin
  ON users
  FOR DELETE
  TO service_role
  USING (true);
