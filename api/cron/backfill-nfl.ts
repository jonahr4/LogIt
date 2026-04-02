/**
 * Log It — GET /api/cron/backfill-nfl
 * ONE-TIME script to backfill historical NFL seasons from ESPN.
 *
 * Usage: GET /api/cron/backfill-nfl?seasons=2021,2022,2023,2024,2025
 *   - seasons: comma-separated years (NFL season start year)
 *   - defaults to current season (2025) if not specified
 *
 * ESPN scoreboard by season: fetches week-by-week for each season type
 * (preseason=1, regular=2, postseason=3).
 *
 * DO NOT RUN until sync-nfl is verified working with ±7 day window.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';
import { upsertESPNGame, mapESPNStatus, type SportConfig } from '../../server-lib/espn';

function deriveNFLSeason(eventDate: string): string {
  const d = new Date(eventDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  if (month >= 8) return String(year);
  return String(year - 1);
}

const NFL_CONFIG: SportConfig = {
  sport: 'football',
  league: 'NFL',
  espnPath: 'football/nfl',
  venueType: 'stadium',
  deriveSeason: deriveNFLSeason,
};

// NFL season types for ESPN API
const SEASON_TYPES = [
  { type: 1, label: 'Preseason', weeks: 4 },
  { type: 2, label: 'Regular Season', weeks: 18 },
  { type: 3, label: 'Postseason', weeks: 5 },
];

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
  const results: { season: number; fetched: number; synced: number; updated: number; errors: number }[] = [];

  try {
    for (const seasonYear of seasons) {
      console.log(`\n🏈 ── NFL Backfill: Season ${seasonYear} ──────────────────`);

      let totalFetched = 0;
      let totalSynced = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      for (const st of SEASON_TYPES) {
        console.log(`\n  📋 ${st.label} (${st.weeks} weeks)`);

        for (let week = 1; week <= st.weeks; week++) {
          const url =
            `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` +
            `?seasontype=${st.type}&week=${week}&season=${seasonYear}&limit=100`;

          try {
            const response = await fetch(url);
            if (!response.ok) {
              console.log(`    ⚠ ESPN ${response.status} for ${st.label} week ${week}`);
              continue;
            }
            const data = await response.json();
            const games = data.events || [];
            totalFetched += games.length;

            if (games.length === 0) {
              console.log(`    Week ${week}: 0 games`);
              continue;
            }
            console.log(`    Week ${week}: ${games.length} games`);

            for (const game of games) {
              const title = game.name || 'Unknown';
              const status = game.status?.type?.state ? mapESPNStatus(game.status.type.state) : 'upcoming';
              const date = game.date ? new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '??';

              try {
                const result = await upsertESPNGame(supabase, game, NFL_CONFIG);
                const icon = result === 'inserted' ? '✅' : result === 'updated' ? '🔄' : '⏭️';
                console.log(`      ${icon} ${date} │ ${title} │ ${status} │ ${result}`);
                if (result === 'inserted') totalSynced++;
                else if (result === 'updated') totalUpdated++;
              } catch {
                console.error(`      ❌ ${date} │ ${title} │ ERROR`);
                totalErrors++;
              }
            }
          } catch (err) {
            console.error(`    ⚠ Fetch error for ${st.label} week ${week}:`, err);
          }
        }
      }

      results.push({
        season: seasonYear,
        fetched: totalFetched,
        synced: totalSynced,
        updated: totalUpdated,
        errors: totalErrors,
      });

      console.log(`\n  📊 Season ${seasonYear}: ${totalFetched} fetched │ ${totalSynced} inserted │ ${totalUpdated} updated │ ${totalErrors} errors`);
    }

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    console.log(`\n🏈 ── NFL Backfill Complete ──────────────────────`);
    console.log(`  Total: ${totalSynced} games inserted across ${seasons.length} season(s)\n`);

    return res.status(200).json({
      message: `Backfilled ${totalSynced} NFL games across ${seasons.length} season(s)`,
      results,
    });
  } catch (error: any) {
    console.error('❌ NFL backfill error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Backfill failed', status: 500 },
      partial_results: results,
    });
  }
}
