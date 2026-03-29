/**
 * Log It — GET /api/cron/sync-nba
 * Vercel Cron Job: Syncs NBA games from Ball Don't Lie into Supabase
 * Schedule: daily at 6:00 AM UTC (configured in vercel.json)
 *
 * Fetches games for today ± 7 days, upserts into events + sports_events
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../lib/supabase-admin';

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

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function mapBDLStatus(bdlStatus: string): 'upcoming' | 'in_progress' | 'completed' {
  if (bdlStatus === 'Final') return 'completed';
  if (bdlStatus.includes('Q') || bdlStatus.includes('Half') || bdlStatus === 'In Progress') {
    return 'in_progress';
  }
  return 'upcoming';
}

function formatSeason(bdlSeason: number): string {
  // BDL uses start year (e.g. 2025 = 2025-26 season)
  return `${bdlSeason}-${String(bdlSeason + 1).slice(-2)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  // Verify cron secret (Vercel sends this header for cron jobs)
  // In dev, allow without secret
  const cronSecret = req.headers['authorization'];
  const isDev = process.env.NODE_ENV === 'development' || !process.env.CRON_SECRET;
  if (!isDev && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret', status: 401 },
    });
  }

  const apiKey = process.env.BALL_DONT_LIE_API;
  if (!apiKey) {
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Missing BALL_DONT_LIE_API env var', status: 500 },
    });
  }

  try {
    // Calculate date range: today ± 7 days
    const today = new Date();
    const dates: string[] = [];
    for (let i = -7; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(formatDate(d));
    }

    // Fetch games from BDL for each date
    // BDL supports multiple dates[] params
    const dateParams = dates.map((d) => `dates[]=${d}`).join('&');
    const allGames: BDLGame[] = [];
    let cursor: number | null = null;

    // Paginate through all results
    do {
      const cursorParam: string = cursor ? `&cursor=${cursor}` : '';
      const url: string = `${BDL_BASE}/games?${dateParams}&per_page=100${cursorParam}`;

      const response: Response = await fetch(url, {
        headers: { Authorization: apiKey },
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`BDL API error: ${response.status} ${errText}`);
        throw new Error(`BDL API error: ${response.status}`);
      }

      const data: { data: BDLGame[]; meta: { next_cursor: number | null; per_page: number } } = await response.json();
      allGames.push(...data.data);
      cursor = data.meta?.next_cursor ?? null;
    } while (cursor !== null);

    console.log(`Fetched ${allGames.length} NBA games from Ball Don't Lie`);

    if (allGames.length === 0) {
      return res.status(200).json({ message: 'No games found for date range', synced: 0 });
    }

    const supabase = getSupabaseAdmin();
    let synced = 0;
    let updated = 0;

    for (const game of allGames) {
      const externalId = String(game.id);
      const title = `${game.home_team.full_name} vs ${game.visitor_team.full_name}`;
      const status = mapBDLStatus(game.status);
      const eventDate = game.datetime || `${game.date}T00:00:00Z`;

      // Upsert into events table
      const { data: eventRow, error: eventError } = await supabase
        .from('events')
        .upsert(
          {
            event_type: 'sports',
            title,
            status,
            event_date: eventDate,
            venue_city: game.home_team.city,
            external_id: externalId,
            external_source: 'balldontlie',
          },
          { onConflict: 'external_id,external_source' }
        )
        .select('id')
        .single();

      if (eventError) {
        console.error(`Error upserting event for game ${game.id}:`, eventError);
        continue;
      }

      // Upsert into sports_events child table
      const { error: sportsError } = await supabase
        .from('sports_events')
        .upsert(
          {
            event_id: eventRow.id,
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

      if (sportsError) {
        console.error(`Error upserting sports_event for game ${game.id}:`, sportsError);
        continue;
      }

      if (status === 'completed') {
        updated++;
      }
      synced++;
    }

    console.log(`Synced ${synced} games (${updated} with scores)`);
    return res.status(200).json({
      message: `Synced ${synced} NBA games`,
      synced,
      updated,
      total_fetched: allGames.length,
    });
  } catch (error: any) {
    console.error('NBA sync error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Sync failed', status: 500 },
    });
  }
}
