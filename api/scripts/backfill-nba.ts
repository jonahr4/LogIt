/**
 * Log It — NBA Backfill (standalone runner)
 * Run locally: npx tsx api/scripts/backfill-nba.ts [seasons]
 * Example: npx tsx api/scripts/backfill-nba.ts 2020,2021,2022,2023,2024,2025
 *
 * Season arg is the START year (e.g. 2025 = 2025-26 season).
 * Iterates by 7-day date windows across Oct → Jun.
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

function deriveNBASeason(eventDate: string): string {
  const d = new Date(eventDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  // NBA: Oct-Dec = start year, Jan-Sep = previous year is start
  const startYear = month >= 9 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}-${String(endYear).slice(-2)}`;
}

const NBA_CONFIG: SportConfig = {
  sport: 'basketball',
  league: 'NBA',
  espnPath: 'basketball/nba',
  venueType: 'arena',
  deriveSeason: deriveNBASeason,
};

/**
 * NBA season date ranges:
 * - Preseason: early October (1-15)
 * - Regular season: mid October → mid April
 * - Play-in: mid April
 * - Postseason: mid April → late June
 */
function getSeasonDateRange(startYear: number): { start: Date; end: Date } {
  return {
    start: new Date(startYear, 9, 1),      // October 1 of start year
    end: new Date(startYear + 1, 5, 30),   // June 30 of end year
  };
}

async function fetchWeek(startDate: Date, endDate: Date): Promise<any[]> {
  const url =
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard` +
    `?dates=${formatDate(startDate)}-${formatDate(endDate)}&limit=1000`;

  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return data.events || [];
}

async function main() {
  // Default: last 6 years
  const seasonsArg = process.argv[2] || '2020,2021,2022,2023,2024,2025';
  const seasons = seasonsArg.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));

  console.log(`\n🏀 NBA Backfill — Seasons: ${seasons.map(y => `${y}-${String(y+1).slice(-2)}`).join(', ')}\n`);

  let grandTotal = { fetched: 0, inserted: 0, updated: 0, errors: 0 };

  for (const startYear of seasons) {
    const range = getSeasonDateRange(startYear);
    console.log(`${'═'.repeat(50)}`);
    console.log(`Season ${startYear}-${String(startYear + 1).slice(-2)} (${formatDate(range.start)} → ${formatDate(range.end)})`);
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
            const result = await upsertESPNGame(supabase, game, NBA_CONFIG);
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

      // Small delay to be kind to ESPN API
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log(`\n  Total: ${totalFetched} fetched, ${totalSynced} inserted, ${totalUpdated} updated, ${totalErrors} errors\n`);
    grandTotal.fetched += totalFetched;
    grandTotal.inserted += totalSynced;
    grandTotal.updated += totalUpdated;
    grandTotal.errors += totalErrors;
  }

  console.log(`${'═'.repeat(50)}`);
  console.log(`Grand Total: ${grandTotal.fetched} fetched, ${grandTotal.inserted} inserted, ${grandTotal.updated} updated, ${grandTotal.errors} errors`);
  console.log(`🏀 Done!\n`);
}

main().catch(console.error);
