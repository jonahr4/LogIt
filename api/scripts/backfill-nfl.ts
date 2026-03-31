/**
 * Log It — NFL Backfill (standalone runner)
 * Run locally: npx tsx api/scripts/backfill-nfl.ts [seasons]
 * Example: npx tsx api/scripts/backfill-nfl.ts 2021,2022,2023,2024,2025
 *
 * Uses ESPN's dates parameter (not season/week) because the season param
 * returns HTTP 500 for NFL. Iterates week-by-week using date ranges.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { upsertESPNGame, formatDate, type SportConfig } from '../../server-lib/espn';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

/**
 * NFL season date ranges (approximate):
 * - Preseason: early August → early September
 * - Regular season: early September → early January
 * - Postseason: mid January → mid February (Super Bowl)
 *
 * We fetch in 7-day chunks to avoid ESPN response limits.
 */
function getSeasonDateRange(seasonYear: number): { start: Date; end: Date } {
  return {
    start: new Date(seasonYear, 7, 1),    // August 1
    end: new Date(seasonYear + 1, 1, 20), // February 20 (covers Super Bowl)
  };
}

async function fetchWeek(startDate: Date, endDate: Date): Promise<any[]> {
  const url =
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` +
    `?dates=${formatDate(startDate)}-${formatDate(endDate)}&limit=100`;

  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return data.events || [];
}

async function main() {
  const seasonsArg = process.argv[2] || '2025';
  const seasons = seasonsArg.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));

  console.log(`\n🏈 NFL Backfill — Seasons: ${seasons.join(', ')}\n`);

  for (const seasonYear of seasons) {
    const range = getSeasonDateRange(seasonYear);
    console.log(`${'═'.repeat(50)}`);
    console.log(`Season ${seasonYear} (${formatDate(range.start)} → ${formatDate(range.end)})`);
    console.log(`${'═'.repeat(50)}`);

    let totalFetched = 0;
    let totalSynced = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    // Iterate in 7-day windows
    const cursor = new Date(range.start);
    while (cursor < range.end) {
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 7);
      if (weekEnd > range.end) weekEnd.setTime(range.end.getTime());

      const games = await fetchWeek(cursor, weekEnd);

      if (games.length > 0) {
        process.stdout.write(`  ${formatDate(cursor)}-${formatDate(weekEnd)}: ${games.length} games... `);

        let weekSynced = 0;
        let weekUpdated = 0;
        for (const game of games) {
          try {
            const result = await upsertESPNGame(supabase, game, NFL_CONFIG);
            if (result === 'inserted') weekSynced++;
            else if (result === 'updated') weekUpdated++;
          } catch {
            totalErrors++;
          }
        }
        totalSynced += weekSynced;
        totalUpdated += weekUpdated;
        totalFetched += games.length;
        console.log(`✅ ${weekSynced} new, ${weekUpdated} updated`);
      }

      cursor.setDate(cursor.getDate() + 7);
    }

    console.log(`\n  Total: ${totalFetched} fetched, ${totalSynced} inserted, ${totalUpdated} updated, ${totalErrors} errors\n`);
  }

  console.log(`🏈 Done!\n`);
}

main().catch(console.error);
