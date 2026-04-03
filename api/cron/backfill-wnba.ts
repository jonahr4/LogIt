/**
 * Log It — GET /api/cron/backfill-wnba
 * ONE-TIME script to backfill historical WNBA seasons from ESPN.
 *
 * Usage: GET /api/cron/backfill-wnba?seasons=2023,2024,2025
 *   - seasons: comma-separated years (e.g. 2025)
 *   - defaults to current season (2025) if not specified
 *
 * WNBA season runs roughly May 1 → Oct 31.
 * Uses day-by-day date iteration (same pattern as MLB backfill).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';
import { upsertESPNGame, formatDate, mapESPNStatus, type SportConfig } from '../../server-lib/espn';

function deriveWNBASeason(eventDate: string): string {
  const d = new Date(eventDate);
  return String(d.getFullYear());
}

const WNBA_CONFIG: SportConfig = {
  sport: 'basketball',
  league: 'WNBA',
  espnPath: 'basketball/wnba',
  venueType: 'arena',
  deriveSeason: deriveWNBASeason,
};

/** Fetch a single day's WNBA scoreboard from ESPN */
async function fetchWNBADay(dateStr: string): Promise<any[]> {
  const url =
    `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard` +
    `?dates=${dateStr}&limit=1000`;
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
      error: { code: 'VALIDATION_ERROR', message: 'Provide at least one season year', status: 422 },
    });
  }

  const supabase = getSupabaseAdmin();
  const results: { season: string; fetched: number; synced: number; updated: number; errors: number }[] = [];

  try {
    for (const year of seasons) {
      const seasonLabel = String(year);
      console.log(`\n🏀 ── WNBA Backfill: Season ${seasonLabel} ──────────────────`);

      let totalFetched = 0;
      let totalSynced = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      // WNBA season runs roughly May 1 → Oct 31
      const seasonStart = new Date(year, 4, 1);    // May 1
      const seasonEnd = new Date(year, 9, 31);     // Oct 31

      const totalDays = Math.ceil((seasonEnd.getTime() - seasonStart.getTime()) / 86400000);
      let dayCount = 0;

      const current = new Date(seasonStart);
      while (current <= seasonEnd) {
        const dateStr = formatDate(current);
        dayCount++;

        try {
          const games = await fetchWNBADay(dateStr);
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
                const result = await upsertESPNGame(supabase, game, WNBA_CONFIG);
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

        if (dayCount % 30 === 0) {
          console.log(`  ... day ${dayCount}/${totalDays} │ ${totalFetched} games found so far │ ${totalSynced} inserted`);
        }

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
    console.log(`\n🏀 ── WNBA Backfill Complete ──────────────────────`);
    console.log(`  Total: ${totalSynced} games inserted across ${seasons.length} season(s)\n`);

    return res.status(200).json({
      message: `Backfilled ${totalSynced} WNBA games across ${seasons.length} season(s)`,
      results,
    });
  } catch (error: any) {
    console.error('❌ WNBA backfill error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Backfill failed', status: 500 },
      partial_results: results,
    });
  }
}
