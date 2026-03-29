-- 008: Create venues table + add venue_id FK to events
-- Run in Supabase SQL Editor

-- 1. Create the venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  image_url TEXT,
  venue_type TEXT DEFAULT 'other',  -- arena, stadium, theater, restaurant, bar, club, other
  capacity INTEGER,
  external_id TEXT,
  external_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create unique index on name+city for dedup
CREATE UNIQUE INDEX IF NOT EXISTS venues_name_city_idx ON venues (LOWER(name), LOWER(city));

-- 3. Add venue_id FK to events (nullable — we'll backfill)
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id);

-- 4. Create index on venue_id for join performance
CREATE INDEX IF NOT EXISTS events_venue_id_idx ON events (venue_id);

-- 5. Seed NBA venues from our known mapping
INSERT INTO venues (name, city, state, lat, lng, image_url, venue_type, external_source) VALUES
  ('State Farm Arena', 'Atlanta', 'GA', 33.7573, -84.3963, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/State_Farm_%28Philips%29_Arena%2C_Atlanta%2C_GA_%2846558861525%29_-_2019.jpg/1280px-State_Farm_%28Philips%29_Arena%2C_Atlanta%2C_GA_%2846558861525%29_-_2019.jpg', 'arena', 'nba'),
  ('TD Garden', 'Boston', 'MA', 42.3662, -71.0621, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/TD_Garden_%2854960947755%29.jpg/1280px-TD_Garden_%2854960947755%29.jpg', 'arena', 'nba'),
  ('Barclays Center', 'Brooklyn', 'NY', 40.6826, -73.9754, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Barclays_Center_-_May_2_2025.jpg/1280px-Barclays_Center_-_May_2_2025.jpg', 'arena', 'nba'),
  ('Spectrum Center', 'Charlotte', 'NC', 35.2251, -80.8392, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Spectrum_Center_2018.jpg/1280px-Spectrum_Center_2018.jpg', 'arena', 'nba'),
  ('United Center', 'Chicago', 'IL', 41.8807, -87.6742, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/United_Center_1.jpg/1280px-United_Center_1.jpg', 'arena', 'nba'),
  ('Rocket Mortgage FieldHouse', 'Cleveland', 'OH', 41.4965, -81.6882, 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80', 'arena', 'nba'),
  ('American Airlines Center', 'Dallas', 'TX', 32.7905, -96.8103, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/American_Airlines_Center_August_2015.jpg/1280px-American_Airlines_Center_August_2015.jpg', 'arena', 'nba'),
  ('Ball Arena', 'Denver', 'CO', 39.7487, -105.0077, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Ball_Arena_exterior_2022.jpg/1280px-Ball_Arena_exterior_2022.jpg', 'arena', 'nba'),
  ('Little Caesars Arena', 'Detroit', 'MI', 42.3411, -83.0553, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Little_Caesars_Arena_panorama.jpg/1280px-Little_Caesars_Arena_panorama.jpg', 'arena', 'nba'),
  ('Chase Center', 'San Francisco', 'CA', 37.768, -122.3877, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Chase_Center.jpg/1280px-Chase_Center.jpg', 'arena', 'nba'),
  ('Toyota Center', 'Houston', 'TX', 29.7508, -95.3621, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Toyota_Center_entr.jpg/1280px-Toyota_Center_entr.jpg', 'arena', 'nba'),
  ('Gainbridge Fieldhouse', 'Indianapolis', 'IN', 39.764, -86.1555, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Bankers_Life_Fieldhouse%2C_Indian%C3%A1polis%2C_Estados_Unidos%2C_2012-10-22%2C_DD_02.jpg/1280px-Bankers_Life_Fieldhouse%2C_Indian%C3%A1polis%2C_Estados_Unidos%2C_2012-10-22%2C_DD_02.jpg', 'arena', 'nba'),
  ('Intuit Dome', 'Inglewood', 'CA', 33.9425, -118.3414, 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Intuit_Dome_Fa%C3%A7ade.jpg/1280px-Intuit_Dome_Fa%C3%A7ade.jpg', 'arena', 'nba'),
  ('Crypto.com Arena', 'Los Angeles', 'CA', 34.043, -118.2673, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Crypto.com_Arena_exterior_2023.jpg/1280px-Crypto.com_Arena_exterior_2023.jpg', 'arena', 'nba'),
  ('FedExForum', 'Memphis', 'TN', 35.1382, -90.0505, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/FedExForum_at_night.jpg/1280px-FedExForum_at_night.jpg', 'arena', 'nba'),
  ('Kaseya Center', 'Miami', 'FL', 25.7814, -80.187, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Kaseya_Center_Downtown_Miami_FL%2C_5_April_2024.jpg/1280px-Kaseya_Center_Downtown_Miami_FL%2C_5_April_2024.jpg', 'arena', 'nba'),
  ('Fiserv Forum', 'Milwaukee', 'WI', 43.0451, -87.9174, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Milwaukee_Fiserv_Forum.jpg/1280px-Milwaukee_Fiserv_Forum.jpg', 'arena', 'nba'),
  ('Target Center', 'Minneapolis', 'MN', 44.9795, -93.2761, 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/TargetCenter.jpg/1280px-TargetCenter.jpg', 'arena', 'nba'),
  ('Smoothie King Center', 'New Orleans', 'LA', 29.949, -90.0821, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/New_Orleans_Arena%2C_exterior_view%2C_10_January_2022_%28cropped%29.jpg/1280px-New_Orleans_Arena%2C_exterior_view%2C_10_January_2022_%28cropped%29.jpg', 'arena', 'nba'),
  ('Madison Square Garden', 'New York', 'NY', 40.7505, -73.9934, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Madison_Square_Garden_%28MSG%29_-_Full_%2848124330357%29.jpg/1280px-Madison_Square_Garden_%28MSG%29_-_Full_%2848124330357%29.jpg', 'arena', 'nba'),
  ('Paycom Center', 'Oklahoma City', 'OK', 35.4634, -97.5151, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Paycom_Center_exterior_aerial_view.jpg/1280px-Paycom_Center_exterior_aerial_view.jpg', 'arena', 'nba'),
  ('Amway Center', 'Orlando', 'FL', 28.5392, -81.3839, 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80', 'arena', 'nba'),
  ('Wells Fargo Center', 'Philadelphia', 'PA', 39.9012, -75.172, 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80', 'arena', 'nba'),
  ('Footprint Center', 'Phoenix', 'AZ', 33.4457, -112.0712, 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80', 'arena', 'nba'),
  ('Moda Center', 'Portland', 'OR', 45.5316, -122.6668, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Modacenter2019.jpg/1280px-Modacenter2019.jpg', 'arena', 'nba'),
  ('Golden 1 Center', 'Sacramento', 'CA', 38.5802, -121.4997, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Golden_1_Center_2017.jpg/1280px-Golden_1_Center_2017.jpg', 'arena', 'nba'),
  ('Frost Bank Center', 'San Antonio', 'TX', 29.427, -98.4375, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Texasdd.JPG/1280px-Texasdd.JPG', 'arena', 'nba'),
  ('Scotiabank Arena', 'Toronto', 'ON', 43.6435, -79.3791, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Scotiabank_Arena_-_2018_%28cropped%29.jpg/1280px-Scotiabank_Arena_-_2018_%28cropped%29.jpg', 'arena', 'nba'),
  ('Delta Center', 'Salt Lake City', 'UT', 40.7683, -111.9011, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Delta_Center_2023.jpg/1280px-Delta_Center_2023.jpg', 'arena', 'nba'),
  ('Capital One Arena', 'Washington', 'DC', 38.8981, -77.0209, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Capital_One_Arena_-_Washington%2C_D.C.jpg/1280px-Capital_One_Arena_-_Washington%2C_D.C.jpg', 'arena', 'nba')
ON CONFLICT (LOWER(name), LOWER(city)) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  updated_at = now();

-- 6. Backfill venue_id on existing events by matching venue_name/venue_city
UPDATE events e
SET venue_id = v.id
FROM venues v
WHERE LOWER(e.venue_name) = LOWER(v.name)
  AND LOWER(e.venue_city) = LOWER(v.city)
  AND e.venue_id IS NULL;

-- 7. Enable RLS (optional — admin-only writes, everyone can read)
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read venues" ON venues
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage venues" ON venues
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
