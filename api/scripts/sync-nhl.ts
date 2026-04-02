/**
 * Log It — NHL Sync (standalone runner)
 * Run locally: npx tsx api/scripts/sync-nhl.ts
 *
 * Fetches NHL games for today ±7 days from ESPN and upserts into Supabase.
 * Same logic as api/cron/sync-nhl.ts but runs as a CLI script.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { fetchESPNScoreboard, upsertESPNGame, mapESPNStatus, type SportConfig } from '../../server-lib/espn';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function deriveNHLSeason(eventDate: string): string {
  const d = new Date(eventDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

const NHL_CONFIG: SportConfig = {
  sport: 'hockey',
  league: 'NHL',
  espnPath: 'hockey/nhl',
  venueType: 'arena',
  deriveSeason: deriveNHLSeason,
};

async function main() {
  console.log(`\n🏒 ── NHL Sync (local) ──────────────────────────`);
  console.log(`  Fetching ESPN scoreboard (±7 days)...`);

  const allGames = await fetchESPNScoreboard(NHL_CONFIG.espnPath);
  console.log(`  📡 ESPN returned ${allGames.length} games\n`);

  if (allGames.length === 0) {
    console.log(`  ⚠ No NHL games found for date range`);
    return;
  }

  let synced = 0;
  let updated = 0;
  let skipped = 0;

  for (const game of allGames) {
    const title = game.name || 'Unknown';
    const status = game.status?.type?.state ? mapESPNStatus(game.status.type.state) : 'upcoming';
    const date = game.date ? new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '??';
    const comp = game.competitions?.[0];
    const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
    const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
    const scoreStr = home?.score && away?.score ? `${away.score}-${home.score}` : 'no score';

    try {
      const result = await upsertESPNGame(supabase, game, NHL_CONFIG);
      const icon = result === 'inserted' ? '✅' : result === 'updated' ? '🔄' : '⏭️';
      console.log(`  ${icon} ${date} │ ${title} │ ${scoreStr} │ ${status} │ ${result}`);
      if (result === 'inserted') synced++;
      else if (result === 'updated') updated++;
      else skipped++;
    } catch (err) {
      console.error(`  ❌ ${date} │ ${title} │ ERROR: ${err}`);
      skipped++;
    }
  }

  console.log(`\n🏒 ── NHL Sync Complete ──────────────────────────`);
  console.log(`  📊 ${synced} inserted │ ${updated} updated │ ${skipped} skipped │ ${allGames.length} total\n`);
}

main().catch(console.error);
