-- Log It — Create Users Table
-- Migration 001: Users table per DATA_MODELS.md

-- Create custom types
CREATE TYPE privacy_level AS ENUM ('public', 'friends', 'private');

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  event_preferences TEXT[] DEFAULT '{}',
  default_privacy privacy_level DEFAULT 'public',
  firebase_uid TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_firebase_uid ON users (firebase_uid);
CREATE INDEX idx_users_email ON users (email);

-- Full-text search on username and display_name
CREATE INDEX idx_users_search ON users USING GIN (
  to_tsvector('english', COALESCE(username, '') || ' ' || COALESCE(display_name, ''))
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Username validation: lowercase only, alphanumeric + underscores, 3-30 chars
ALTER TABLE users ADD CONSTRAINT chk_username_format
  CHECK (username ~ '^[a-z0-9_]{3,30}$');
