/**
 * Log It — GET /api/cron/backfill-ncaaw
 * Backfill historical WNCAA Basketball seasons from ESPN.
 *
 * Usage: GET /api/cron/backfill-ncaaw?seasons=2023,2024
 *   - seasons: comma-separated start years (e.g. 2024 for the 2024-25 season)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';
import { upsertESPNGame, formatDate, mapESPNStatus, type SportConfig } from '../../server-lib/espn';

function deriveNCAAWSeason(eventDate: string): string {
  const d = new Date(eventDate);
  const m = d.getMonth();
  const y = d.getFullYear();
  return m >= 9 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
}

const CONFIG: SportConfig = {
  sport: 'basketball',
  league: 'NCAAW',
  espnPath: 'basketball/womens-college-basketball',
  venueType: 'arena',
  deriveSeason: deriveNCAAWSeason,
};

async function fetchDay(dateStr: string): Promise<any[]> {
  const url =
    `https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard` +
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

  const seasonsParam = typeof req.query.seasons === 'string' ? req.query.seasons : '2024';
  const seasons = seasonsParam.split(',').map((x) => parseInt(x.trim())).filter((n) => !isNaN(n));

  if (seasons.length === 0) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Provide at least one season year', status: 422 },
    });
  }

  const supabase = getSupabaseAdmin();
  const results: { season: string; fetched: number; synced: number; updated: number; errors: number }[] = [];

  try {
    for (const year of seasons) {
      const seasonLabel = `${year}-${String(year + 1).slice(2)}`;
      console.log(`\n🏀 ── WNCAA Basketball Backfill: Season ${seasonLabel} ──────────────────`);

      let totalFetched = 0;
      let totalSynced = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      const seasonStart = new Date(year, 10, 1);
      const seasonEnd = new Date(year + 1, 3, 10);

      const totalDays = Math.ceil((seasonEnd.getTime() - seasonStart.getTime()) / 86400000);
      let dayCount = 0;

      const current = new Date(seasonStart);
      while (current <= seasonEnd) {
        const dateStr = formatDate(current);
        dayCount++;

        try {
          const games = await fetchDay(dateStr);
          totalFetched += games.length;

          if (games.length > 0) {
            const monthLabel = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            console.log(`\n  📅 ${monthLabel} (${dateStr}) — ${games.length} games  [day ${dayCount}/${totalDays}]`);

            for (const game of games) {
              try {
                const result = await upsertESPNGame(supabase, game, CONFIG);
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

    const total = results.reduce((sum, r) => sum + r.synced, 0);
    console.log(`\n🏀 ── WNCAA Basketball Backfill Complete ──────────────────────`);
    console.log(`  Total: ${total} games inserted across ${seasons.length} season(s)\n`);

    return res.status(200).json({
      message: `Backfilled ${total} WNCAA Basketball games across ${seasons.length} season(s)`,
      results,
    });
  } catch (error: any) {
    console.error('❌ WNCAA Basketball backfill error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Backfill failed', status: 500 },
      partial_results: results,
    });
  }
}
