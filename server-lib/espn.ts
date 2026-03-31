/**
 * Log It — Shared ESPN API Utility
 * Common fetch/parse/upsert logic for all ESPN-based sports sync scripts.
 * Each sport's sync script is a thin wrapper that provides a SportConfig.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { findOrCreateVenue } from './venue-lookup';

// ── Sport configuration ────────────────────────────────────────────

export interface SportConfig {
  sport: string;            // 'basketball', 'football', 'soccer', etc.
  league: string;           // 'NBA', 'NFL', 'MLS', 'Premier League', etc.
  espnPath: string;         // 'basketball/nba', 'football/nfl', 'soccer/eng.1'
  venueType: string;        // 'arena', 'stadium', 'pitch'
  deriveSeason: (eventDate: string) => string;
}

// ── Helpers ─────────────────────────────────────────────────────────

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function mapESPNStatus(espnState: string): 'upcoming' | 'in_progress' | 'completed' {
  if (espnState === 'post') return 'completed';
  if (espnState === 'in') return 'in_progress';
  return 'upcoming';
}

// ── Fetch ───────────────────────────────────────────────────────────

/**
 * Fetch games from ESPN scoreboard API for a given date range.
 * Works identically for any sport — just pass the right espnPath.
 */
export async function fetchESPNScoreboard(
  espnPath: string,
  daysBack: number = 7,
  daysForward: number = 7,
  limit: number = 300
): Promise<any[]> {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - daysBack);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + daysForward);

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const url = `https://site.api.espn.com/apis/site/v2/sports/${espnPath}/scoreboard?dates=${startStr}-${endStr}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }
  const data = await response.json();
  return data.events || [];
}

// ── Upsert ──────────────────────────────────────────────────────────

/**
 * Upsert a single ESPN game into Supabase (events + sports_events).
 * Returns 'inserted' | 'updated' | 'skipped'.
 */
export async function upsertESPNGame(
  supabase: SupabaseClient,
  game: any,
  config: SportConfig
): Promise<'inserted' | 'updated' | 'skipped'> {
  const externalId = game.id;
  const title = game.name;
  const status = mapESPNStatus(game.status.type.state);
  const eventDate = game.date;

  // Ensure we have competition data
  if (!game.competitions || !game.competitions[0]) return 'skipped';

  const comp = game.competitions[0];
  const venueData = comp.venue || {};
  const competitors = comp.competitors || [];

  const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
  const awayTeam = competitors.find((c: any) => c.homeAway === 'away');
  if (!homeTeam || !awayTeam) return 'skipped';

  // Find or create venue
  const venueName = venueData.fullName || '';
  const venueCity = venueData.address?.city || '';
  const venueState = venueData.address?.state || '';

  let venueId: string | null = null;
  if (venueName && venueCity) {
    venueId = await findOrCreateVenue(supabase, {
      name: venueName,
      city: venueCity,
      state: venueState,
      venue_type: config.venueType,
    });
  }

  // Check if event already exists
  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('external_id', externalId)
    .eq('external_source', 'espn')
    .maybeSingle();

  let eventId: string;

  if (existing) {
    // Update existing event
    const { error: updateError } = await supabase
      .from('events')
      .update({ title, status, event_date: eventDate, venue_id: venueId })
      .eq('id', existing.id);

    if (updateError) {
      console.error(`Error updating event ${game.id}:`, updateError);
      return 'skipped';
    }
    eventId = existing.id;
  } else {
    // Insert new event
    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert({
        event_type: 'sports',
        title,
        status,
        event_date: eventDate,
        venue_id: venueId,
        external_id: externalId,
        external_source: 'espn',
      })
      .select('id')
      .single();

    if (insertError || !newEvent) {
      console.error(`Error inserting event ${game.id}:`, insertError);
      return 'skipped';
    }
    eventId = newEvent.id;
  }

  // Upsert sports_events child record
  const homeScore = homeTeam.score ? parseInt(homeTeam.score, 10) : null;
  const awayScore = awayTeam.score ? parseInt(awayTeam.score, 10) : null;

  const { error: sportsError } = await supabase
    .from('sports_events')
    .upsert({
      event_id: eventId,
      sport: config.sport,
      league: config.league,
      season: config.deriveSeason(eventDate),
      home_team_id: homeTeam.team.id,
      away_team_id: awayTeam.team.id,
      home_team_name: homeTeam.team.displayName,
      away_team_name: awayTeam.team.displayName,
      home_team_logo: homeTeam.team.logo || null,
      away_team_logo: awayTeam.team.logo || null,
      home_score: isNaN(homeScore as number) ? null : homeScore,
      away_score: isNaN(awayScore as number) ? null : awayScore,
    }, { onConflict: 'event_id' });

  if (sportsError) {
    console.error(`Error upserting sports_events for ${game.id}:`, sportsError);
    return 'skipped';
  }

  return existing ? 'updated' : 'inserted';
}
