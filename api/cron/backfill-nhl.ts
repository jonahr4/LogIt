/**
 * Log It — GET /api/cron/backfill-nhl
 * ONE-TIME script to backfill historical NHL seasons from ESPN.
 *
 * Usage: GET /api/cron/backfill-nhl?seasons=2023,2024,2025
 *   - seasons: comma-separated start-years (e.g. 2025 = the 2025-26 season)
 *   - defaults to current season (2025) if not specified
 *
 * NHL backfill uses date-range iteration (not week-based like NFL),
 * stepping day-by-day from Oct 1 through Jun 30 for each season.
 *
 * DO NOT RUN until sync-nhl is verified working with ±7 day window.
 * This is a MANUAL endpoint — not scheduled as a cron job.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';
import { upsertESPNGame, formatDate, type SportConfig } from '../../server-lib/espn';

function deriveNHLSeason(eventDate: string): string {
  const d = new Date(eventDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  if (month >= 9) return `${year}-${String(year + 1).slice(2)}`;
  return `${year - 1}-${String(year).slice(2)}`;
}

const NHL_CONFIG: SportConfig = {
  sport: 'hockey',
  league: 'NHL',
  espnPath: 'hockey/nhl',
  venueType: 'arena',
  deriveSeason: deriveNHLSeason,
};

/** Fetch a single day's NHL scoreboard from ESPN */
async function fetchNHLDay(dateStr: string): Promise<any[]> {
  const url =
    `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard` +
    `?dates=${dateStr}&limit=100`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return data.events || [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  const seasonsParam = typeof req.query.seasons === 'string' ? req.query.seasons : '2025';
  const seasons = seasonsParam.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));

  if (seasons.length === 0) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Provide at least one season start year', status: 422 },
    });
  }

  const supabase = getSupabaseAdmin();
  const results: { season: string; fetched: number; synced: number; updated: number; errors: number }[] = [];

  try {
    for (const startYear of seasons) {
      const seasonLabel = `${startYear}-${String(startYear + 1).slice(2)}`;
      console.log(`\nBackfilling NHL season ${seasonLabel}...`);

      let totalFetched = 0;
      let totalSynced = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      // NHL season runs roughly Oct 1 → Jun 30
      const seasonStart = new Date(startYear, 9, 1);   // Oct 1 of start year
      const seasonEnd = new Date(startYear + 1, 5, 30); // Jun 30 of end year

      const current = new Date(seasonStart);
      while (current <= seasonEnd) {
        const dateStr = formatDate(current);

        try {
          const games = await fetchNHLDay(dateStr);
          totalFetched += games.length;

          if (games.length > 0) {
            console.log(`  ${dateStr}: ${games.length} games`);
            for (const game of games) {
              try {
                const result = await upsertESPNGame(supabase, game, NHL_CONFIG);
                if (result === 'inserted') totalSynced++;
                else if (result === 'updated') totalUpdated++;
              } catch {
                totalErrors++;
              }
            }
          }
        } catch (err) {
          console.error(`  ⚠ Fetch error for ${dateStr}:`, err);
        }

        // Next day
        current.setDate(current.getDate() + 1);
      }

      results.push({
        season: seasonLabel,
        fetched: totalFetched,
        synced: totalSynced,
        updated: totalUpdated,
        errors: totalErrors,
      });

      console.log(`Season ${seasonLabel}: ${totalFetched} fetched, ${totalSynced} inserted, ${totalUpdated} updated`);
    }

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    return res.status(200).json({
      message: `Backfilled ${totalSynced} NHL games across ${seasons.length} season(s)`,
      results,
    });
  } catch (error: any) {
    console.error('NHL backfill error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Backfill failed', status: 500 },
      partial_results: results,
    });
  }
}
