/**
 * Log It — Backfill Venues
 * Enriches venues that have null lat/lng or image_url.
 * Never overwrites existing data.
 *
 * Run: npx tsx api/scripts/backfill-venues.ts
 */

import { createClient } from '@supabase/supabase-js';
import { enrichVenueMetadata } from '../../server-lib/venue-lookup';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('🔍 Fetching unenriched venues...\n');

  // Only fetch venues with null lat, lng, or image_url
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, city, state, lat, lng, image_url')
    .or('lat.is.null,image_url.is.null');

  if (error) {
    console.error('❌ Failed to fetch venues:', error.message);
    process.exit(1);
  }

  if (!venues || venues.length === 0) {
    console.log('✅ All venues are already enriched!\n');
    return;
  }

  console.log(`Found ${venues.length} venues needing enrichment\n`);

  let enriched = 0;
  let failed = 0;

  for (const venue of venues) {
    console.log(`Processing: ${venue.name}, ${venue.city}...`);

    try {
      const meta = await enrichVenueMetadata(venue.name, venue.city, venue.state);

      // Only update fields that are currently null AND were successfully fetched
      const updates: Record<string, any> = {};
      if (venue.lat === null && meta.lat !== undefined) updates.lat = meta.lat;
      if (venue.lng === null && meta.lng !== undefined) updates.lng = meta.lng;
      if (venue.image_url === null && meta.image_url !== undefined) updates.image_url = meta.image_url;

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from('venues')
          .update(updates)
          .eq('id', venue.id);

        if (updateErr) {
          console.log(`  ⚠ DB update failed: ${updateErr.message}`);
          failed++;
        } else {
          console.log(`  ✅ Enriched: ${JSON.stringify(updates)}`);
          enriched++;
        }
      } else {
        console.log(`  ⚠ No data found`);
        failed++;
      }
    } catch (err: any) {
      console.log(`  ⚠ Error: ${err.message}`);
      failed++;
    }

    // Nominatim rate limit: 1 request per second
    await sleep(1100);
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`Done! Enriched ${enriched}/${venues.length} venues (${failed} could not be found)`);
  console.log(`${'═'.repeat(50)}\n`);
}

main().catch(console.error);
