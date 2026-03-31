-- Allow anon role to update venue image_url (for admin portal edits)
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY venues_select_anon ON venues
  FOR SELECT TO anon USING (true);

CREATE POLICY venues_update_anon ON venues
  FOR UPDATE TO anon USING (true)
  WITH CHECK (true);
