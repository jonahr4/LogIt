/**
 * Log It — Venue Lookup Helper
 * Finds or creates a venue row in Supabase by name + city.
 * Used by cron sync and backfill scripts.
 */

import { SupabaseClient } from '@supabase/supabase-js';

// In-memory cache to avoid repeated DB lookups within a single run
const venueCache = new Map<string, string>();

function cacheKey(name: string, city: string): string {
  return `${name.toLowerCase()}|${city.toLowerCase()}`;
}

/**
 * Find or create a venue row. Returns the venue UUID.
 * If the venue already exists (by name+city), returns the existing ID.
 * Otherwise inserts a new row and returns the new ID.
 */
export async function findOrCreateVenue(
  supabase: SupabaseClient,
  venue: {
    name: string;
    city: string;
    state?: string;
    lat?: number;
    lng?: number;
    image_url?: string;
    venue_type?: string;
  }
): Promise<string | null> {
  if (!venue.name || !venue.city) return null;

  const key = cacheKey(venue.name, venue.city);

  // Check in-memory cache first
  const cached = venueCache.get(key);
  if (cached) return cached;

  // Try to find existing venue
  const { data: existing } = await supabase
    .from('venues')
    .select('id')
    .ilike('name', venue.name)
    .ilike('city', venue.city)
    .maybeSingle();

  if (existing) {
    venueCache.set(key, existing.id);
    return existing.id;
  }

  // Insert new venue
  const { data: newVenue, error } = await supabase
    .from('venues')
    .insert({
      name: venue.name,
      city: venue.city,
      state: venue.state || null,
      lat: venue.lat || null,
      lng: venue.lng || null,
      image_url: venue.image_url || null,
      venue_type: venue.venue_type || 'arena',
    })
    .select('id')
    .single();

  if (error || !newVenue) {
    // Could be a race condition duplicate — try to find again
    const { data: retry } = await supabase
      .from('venues')
      .select('id')
      .ilike('name', venue.name)
      .ilike('city', venue.city)
      .maybeSingle();

    if (retry) {
      venueCache.set(key, retry.id);
      return retry.id;
    }
    console.error('Failed to find or create venue:', error);
    return null;
  }

  venueCache.set(key, newVenue.id);
  return newVenue.id;
}
