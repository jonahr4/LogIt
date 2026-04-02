/**
 * Log It — GET /api/cron/sync-nhl
 * Vercel Cron Job: Syncs NHL games from ESPN into Supabase
 * Schedule: daily at 6:10 AM UTC (configured in vercel.json)
 *
 * Fetches games for today ± 7 days, upserts into events + sports_events.
 * Uses shared ESPN utility — see server-lib/espn.ts
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';
import { fetchESPNScoreboard, upsertESPNGame, type SportConfig } from '../../server-lib/espn';

/** NHL uses split-year seasons (e.g. '2025-26'). Oct+ = start year, Jan-Sep = previous year */
function deriveNHLSeason(eventDate: string): string {
  const d = new Date(eventDate);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  // NHL season starts in October. Games Oct+ belong to that start year.
  if (month >= 9) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  // Games Jan-Sep belong to the season that started the previous October
  return `${year - 1}-${String(year).slice(2)}`;
}

const NHL_CONFIG: SportConfig = {
  sport: 'hockey',
  league: 'NHL',
  espnPath: 'hockey/nhl',
  venueType: 'arena',
  deriveSeason: deriveNHLSeason,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  const cronSecret = req.headers['authorization'];
  const isDev = process.env.NODE_ENV === 'development' || !process.env.CRON_SECRET;
  if (!isDev && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret', status: 401 },
    });
  }

  try {
    const allGames = await fetchESPNScoreboard(NHL_CONFIG.espnPath);
    console.log(`Fetched ${allGames.length} NHL games from ESPN API`);

    if (allGames.length === 0) {
      return res.status(200).json({ message: 'No NHL games found for date range', synced: 0 });
    }

    const supabase = getSupabaseAdmin();
    let synced = 0;
    let updated = 0;

    for (const game of allGames) {
      try {
        const result = await upsertESPNGame(supabase, game, NHL_CONFIG);
        if (result === 'inserted') synced++;
        else if (result === 'updated') updated++;
      } catch (err) {
        console.error(`Unexpected error processing NHL game ${game.id}:`, err);
      }
    }

    console.log(`Synced ${synced} NHL games (${updated} updated)`);
    return res.status(200).json({
      message: `Synced ${synced} NHL games`,
      synced,
      updated,
      total_fetched: allGames.length,
    });
  } catch (error: any) {
    console.error('NHL sync error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'NHL sync failed', status: 500 },
    });
  }
}
