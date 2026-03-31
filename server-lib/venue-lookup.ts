/**
 * Log It — Venue Lookup Helper
 * Finds or creates a venue row in Supabase by name + city.
 * Auto-enriches new venues with lat/lng (Nominatim) and image (Wikimedia Commons).
 * Used by cron sync and backfill scripts.
 */

import { SupabaseClient } from '@supabase/supabase-js';

// In-memory cache to avoid repeated DB lookups within a single run
const venueCache = new Map<string, string>();

function cacheKey(name: string, city: string): string {
  return `${name.toLowerCase()}|${city.toLowerCase()}`;
}

// ── Enrichment helpers ─────────────────────────────────────────────

const USER_AGENT = 'LogItApp/1.0 (venue-enrichment)';

/**
 * Geocode a venue using Nominatim (OpenStreetMap). Free, no API key.
 * Rate limit: max 1 req/sec (caller's responsibility to throttle for batch).
 */
async function geocodeVenue(
  name: string,
  city: string,
  state?: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const parts = [name, city, state].filter(Boolean).join(', ');
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(parts)}&format=json&limit=1`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!resp.ok) return null;
    const results = await resp.json();
    if (results.length === 0) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}

/**
 * Search Wikimedia Commons for a venue image. Free, no API key.
 * Includes city for disambiguation and filters out non-photo results.
 */
async function findVenueImage(
  name: string,
  city: string
): Promise<string | null> {
  // File extensions to reject (not photos of venues)
  const BAD_EXTENSIONS = ['.pdf', '.svg', '.ogg', '.ogv', '.webm', '.djvu', '.tif'];

  async function searchWikimedia(query: string): Promise<string | null> {
    try {
      const url =
        `https://commons.wikimedia.org/w/api.php?action=query` +
        `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=8` +
        `&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      const pages = data?.query?.pages;
      if (!pages) return null;

      // Score each result by relevance to venue name
      const nameLower = name.toLowerCase();
      const nameWords = nameLower.split(/[\s\-_]+/).filter(w => w.length > 2);
      const candidates: { url: string; score: number }[] = [];

      for (const page of Object.values(pages) as any[]) {
        const info = page?.imageinfo?.[0];
        const imageUrl = info?.thumburl || info?.url;
        if (!imageUrl) continue;

        // Skip non-photo file types
        const urlLower = imageUrl.toLowerCase();
        if (BAD_EXTENSIONS.some(ext => urlLower.includes(ext))) continue;

        // Score by how many venue name words appear in the filename
        const title = (page.title || '').toLowerCase();
        let score = 0;
        for (const word of nameWords) {
          if (title.includes(word)) score++;
        }

        candidates.push({ url: imageUrl, score });
      }

      if (candidates.length === 0) return null;

      // Return highest-scoring candidate
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].url;
    } catch {
      return null;
    }
  }

  // Try with city first for better disambiguation
  let result = await searchWikimedia(`${name} ${city}`);
  if (result) return result;

  // Fallback: just the venue name
  result = await searchWikimedia(name);
  return result;
}

/**
 * Enrich a venue with lat/lng and image_url.
 * Returns only non-null fields so we can merge without overwriting existing data.
 */
export async function enrichVenueMetadata(
  name: string,
  city: string,
  state?: string
): Promise<{ lat?: number; lng?: number; image_url?: string }> {
  const [geo, image] = await Promise.all([
    geocodeVenue(name, city, state),
    findVenueImage(name, city),
  ]);
  const result: { lat?: number; lng?: number; image_url?: string } = {};
  if (geo) {
    result.lat = geo.lat;
    result.lng = geo.lng;
  }
  if (image) {
    result.image_url = image;
  }
  return result;
}

// ── Main lookup ──────────────────────────────────────────────────

/**
 * Find or create a venue row. Returns the venue UUID.
 * If the venue already exists (by name+city), returns the existing ID.
 * Otherwise inserts a new row, enriches it with lat/lng + image, and returns the new ID.
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

  // ── Auto-enrich the newly created venue (fire-and-forget style) ──
  // Only enriches fields that are null; never blocks venue creation.
  try {
    const enriched = await enrichVenueMetadata(venue.name, venue.city, venue.state);
    if (Object.keys(enriched).length > 0) {
      await supabase
        .from('venues')
        .update(enriched)
        .eq('id', newVenue.id);
      console.log(`✅ Enriched venue: ${venue.name}, ${venue.city}`, enriched);
    } else {
      console.warn(`⚠ Could not enrich venue: ${venue.name}, ${venue.city}`);
    }
  } catch (err) {
    console.warn(`⚠ Enrichment failed for: ${venue.name}, ${venue.city}`, err);
  }

  return newVenue.id;
}
