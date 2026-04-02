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
import { upsertESPNGame, formatDate, mapESPNStatus, type SportConfig } from '../../server-lib/espn';

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
      console.log(`\n🏒 ── NHL Backfill: Season ${seasonLabel} ──────────────────`);

      let totalFetched = 0;
      let totalSynced = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      // NHL season runs roughly Oct 1 → Jun 30
      const seasonStart = new Date(startYear, 9, 1);   // Oct 1 of start year
      const seasonEnd = new Date(startYear + 1, 5, 30); // Jun 30 of end year

      const totalDays = Math.ceil((seasonEnd.getTime() - seasonStart.getTime()) / 86400000);
      let dayCount = 0;

      const current = new Date(seasonStart);
      while (current <= seasonEnd) {
        const dateStr = formatDate(current);
        dayCount++;

        try {
          const games = await fetchNHLDay(dateStr);
          totalFetched += games.length;

          if (games.length > 0) {
            const monthLabel = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            console.log(`\n  📅 ${monthLabel} (${dateStr}) — ${games.length} games  [day ${dayCount}/${totalDays}]`);

            for (const game of games) {
              const title = game.name || 'Unknown';
              const status = game.status?.type?.state ? mapESPNStatus(game.status.type.state) : 'upcoming';
              const comp = game.competitions?.[0];
              const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
              const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
              const scoreStr = home?.score && away?.score ? `${away.score}-${home.score}` : 'no score';

              try {
                const result = await upsertESPNGame(supabase, game, NHL_CONFIG);
                const icon = result === 'inserted' ? '✅' : result === 'updated' ? '🔄' : '⏭️';
                console.log(`    ${icon} ${title} │ ${scoreStr} │ ${status} │ ${result}`);
                if (result === 'inserted') totalSynced++;
                else if (result === 'updated') totalUpdated++;
              } catch {
                console.error(`    ❌ ${title} │ ERROR`);
                totalErrors++;
              }
            }
          }
        } catch (err) {
          console.error(`  ⚠ Fetch error for ${dateStr}:`, err);
        }

        // Progress log every 30 days for days with no games
        if (dayCount % 30 === 0) {
          console.log(`  ... day ${dayCount}/${totalDays} │ ${totalFetched} games found so far │ ${totalSynced} inserted`);
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

      console.log(`\n  📊 Season ${seasonLabel}: ${totalFetched} fetched │ ${totalSynced} inserted │ ${totalUpdated} updated │ ${totalErrors} errors`);
    }

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    console.log(`\n🏒 ── NHL Backfill Complete ──────────────────────`);
    console.log(`  Total: ${totalSynced} games inserted across ${seasons.length} season(s)\n`);

    return res.status(200).json({
      message: `Backfilled ${totalSynced} NHL games across ${seasons.length} season(s)`,
      results,
    });
  } catch (error: any) {
    console.error('❌ NHL backfill error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Backfill failed', status: 500 },
      partial_results: results,
    });
  }
}
