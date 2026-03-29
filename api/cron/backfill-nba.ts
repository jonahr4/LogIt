/**
 * Log It — GET /api/cron/backfill-nba
 * ONE-TIME script to backfill historical NBA seasons into Supabase.
 * 
 * Usage: GET /api/cron/backfill-nba?seasons=2022,2023,2024,2025
 *   - seasons: comma-separated BDL season years (BDL uses start year, e.g. 2025 = 2025-26)
 *   - defaults to current season (2025) if not specified
 * 
 * NOTE: This can take 30-60 seconds per season due to pagination.
 *       Vercel functions have a 60s timeout on Hobby, so do 1-2 seasons at a time.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../lib/supabase-admin';
import { getVenueForTeam } from '../lib/nba-venues';

const BDL_BASE = 'https://api.balldontlie.io/v1';

interface BDLTeam {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

interface BDLGame {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  datetime: string | null;
  home_team: BDLTeam;
  visitor_team: BDLTeam;
}

function mapBDLStatus(bdlStatus: string): 'upcoming' | 'in_progress' | 'completed' {
  if (bdlStatus === 'Final') return 'completed';
  if (bdlStatus.includes('Q') || bdlStatus.includes('Half') || bdlStatus === 'In Progress') {
    return 'in_progress';
  }
  return 'upcoming';
}

function formatSeason(bdlSeason: number): string {
  return `${bdlSeason}-${String(bdlSeason + 1).slice(-2)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  const apiKey = process.env.BALL_DONT_LIE_API;
  if (!apiKey) {
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Missing BALL_DONT_LIE_API env var', status: 500 },
    });
  }

  // Parse seasons from query param
  const seasonsParam = typeof req.query.seasons === 'string' ? req.query.seasons : '2025';
  const seasons = seasonsParam.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));

  if (seasons.length === 0) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Provide at least one season year', status: 422 },
    });
  }

  const supabase = getSupabaseAdmin();
  const results: { season: string; fetched: number; synced: number; errors: number }[] = [];

  try {
    for (const seasonYear of seasons) {
      console.log(`Backfilling season ${seasonYear}...`);
      
      // Fetch ALL games for this season from BDL
      const allGames: BDLGame[] = [];
      let cursor: number | null = null;

      do {
        const cursorParam: string = cursor ? `&cursor=${cursor}` : '';
        const url: string = `${BDL_BASE}/games?seasons[]=${seasonYear}&per_page=100${cursorParam}`;

        const response: Response = await fetch(url, {
          headers: { Authorization: apiKey },
        });

        if (!response.ok) {
          console.error(`BDL error for season ${seasonYear}: ${response.status}`);
          break;
        }

        const data: { data: BDLGame[]; meta: { next_cursor: number | null; per_page: number } } = await response.json();
        allGames.push(...data.data);
        cursor = data.meta?.next_cursor ?? null;
        
        console.log(`  Fetched page... total so far: ${allGames.length}`);
      } while (cursor !== null);

      console.log(`Season ${seasonYear}: ${allGames.length} games fetched`);

      // Insert games into Supabase
      let synced = 0;
      let errors = 0;

      for (const game of allGames) {
        const externalId = String(game.id);
        const title = `${game.home_team.full_name} vs ${game.visitor_team.full_name}`;
        const status = mapBDLStatus(game.status);
        const eventDate = game.datetime || `${game.date}T00:00:00Z`;
        const venue = getVenueForTeam(game.home_team.id, game.home_team.city);

        try {
          // Check if already exists
          const { data: existing } = await supabase
            .from('events')
            .select('id')
            .eq('external_id', externalId)
            .eq('external_source', 'balldontlie')
            .maybeSingle();

          let eventId: string;

          if (existing) {
            eventId = existing.id;
            // Update score/status and fill in venue data
            await supabase
              .from('events')
              .update({
                status,
                event_date: eventDate,
                venue_name: venue.arena,
                venue_city: venue.city,
                venue_state: venue.state,
                venue_lat: venue.lat || null,
                venue_lng: venue.lng || null,
              })
              .eq('id', existing.id);
          } else {
            const { data: newEvent, error: insertError } = await supabase
              .from('events')
              .insert({
                event_type: 'sports',
                title,
                status,
                event_date: eventDate,
                venue_name: venue.arena,
                venue_city: venue.city,
                venue_state: venue.state,
                venue_lat: venue.lat || null,
                venue_lng: venue.lng || null,
                external_id: externalId,
                external_source: 'balldontlie',
              })
              .select('id')
              .single();

            if (insertError || !newEvent) {
              errors++;
              continue;
            }
            eventId = newEvent.id;
          }

          // Upsert sports_events
          await supabase
            .from('sports_events')
            .upsert(
              {
                event_id: eventId,
                sport: 'basketball',
                league: 'NBA',
                season: formatSeason(game.season),
                home_team_id: String(game.home_team.id),
                away_team_id: String(game.visitor_team.id),
                home_team_name: game.home_team.full_name,
                away_team_name: game.visitor_team.full_name,
                home_score: game.home_team_score || null,
                away_score: game.visitor_team_score || null,
              },
              { onConflict: 'event_id' }
            );

          synced++;
        } catch (err) {
          errors++;
        }
      }

      results.push({
        season: formatSeason(seasonYear),
        fetched: allGames.length,
        synced,
        errors,
      });
    }

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    return res.status(200).json({
      message: `Backfilled ${totalSynced} NBA games across ${seasons.length} season(s)`,
      results,
    });
  } catch (error: any) {
    console.error('Backfill error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Backfill failed', status: 500 },
      partial_results: results,
    });
  }
}
