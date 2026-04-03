/**
 * Log It — WNCAA Basketball Backfill (standalone runner)
 * Run locally: npx tsx api/scripts/backfill-ncaaw.ts [seasons]
 * Example: npx tsx api/scripts/backfill-ncaaw.ts 2023,2024
 *
 * Iterates by 7-day date windows across the season.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { upsertESPNGame, formatDate, mapESPNStatus, type SportConfig } from '../../server-lib/espn';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

function getSeasonDateRange(startYear: number): { start: Date; end: Date } {
  return {
    start: new Date(startYear, 10, 1),
    end: new Date(startYear + 1, 3, 10),
  };
}

async function fetchDay(date: Date): Promise<any[]> {
  const url =
    `https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard` +
    `?dates=${formatDate(date)}&limit=1000`;

  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return data.events || [];
}

async function main() {
  const seasonsArg = process.argv[2] || '2024';
  const seasons = seasonsArg.split(',').map((x) => parseInt(x.trim())).filter((n) => !isNaN(n));

  console.log(`\n🏀 WNCAA Basketball Backfill — Seasons: ${seasons.join(', ')}\n`);

  let grandTotal = { fetched: 0, inserted: 0, updated: 0, errors: 0 };

  for (const year of seasons) {
    const range = getSeasonDateRange(year);
    const seasonLabel = `${year}-${String(year + 1).slice(2)}`;
    console.log(`${'═'.repeat(55)}`);
    console.log(`Season ${seasonLabel} (${formatDate(range.start)} → ${formatDate(range.end)})`);
    console.log(`${'═'.repeat(55)}`);

    let totalFetched = 0;
    let totalSynced = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    const cursor = new Date(range.start);
    while (cursor < range.end) {
      const games = await fetchDay(cursor);

      if (games.length > 0) {
        process.stdout.write(`  ${formatDate(cursor)}: ${games.length} games... `);

        let daySynced = 0;
        let dayUpdated = 0;
        for (const game of games) {
          try {
            const result = await upsertESPNGame(supabase, game, CONFIG);
            if (result === 'inserted') daySynced++;
            else if (result === 'updated') dayUpdated++;
          } catch {
            totalErrors++;
          }
        }
        totalSynced += daySynced;
        totalUpdated += dayUpdated;
        totalFetched += games.length;
        console.log(`✅ ${daySynced} new, ${dayUpdated} updated`);
      }

      cursor.setDate(cursor.getDate() + 1);
      await new Promise((r) => setTimeout(r, 100));
    }

    console.log(`\n  Total: ${totalFetched} fetched, ${totalSynced} inserted, ${totalUpdated} updated, ${totalErrors} errors\n`);
    grandTotal.fetched += totalFetched;
    grandTotal.inserted += totalSynced;
    grandTotal.updated += totalUpdated;
    grandTotal.errors += totalErrors;
  }

  console.log(`${'═'.repeat(55)}`);
  console.log(`Grand Total: ${grandTotal.fetched} fetched, ${grandTotal.inserted} inserted, ${grandTotal.updated} updated, ${grandTotal.errors} errors`);
  console.log(`🏀 Done!\n`);
}

main().catch(console.error);
