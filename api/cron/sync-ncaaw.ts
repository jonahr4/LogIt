/**
 * Log It — GET /api/cron/sync-ncaaw
 * Vercel Cron Job: Syncs WNCAA Basketball games from ESPN into Supabase
 *
 * Fetches games for today ± 7 days, upserts into events + sports_events.
 * Uses shared ESPN utility — see server-lib/espn.ts
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';
import { fetchESPNScoreboard, upsertESPNGame, mapESPNStatus, type SportConfig } from '../../server-lib/espn';

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
    console.log(`\n🏀 ── WNCAA Basketball Sync Starting ──────────────────────────`);
    console.log(`  Fetching ESPN scoreboard (±7 days)...`);

    const allGames = await fetchESPNScoreboard(CONFIG.espnPath);
    console.log(`  📡 ESPN returned ${allGames.length} games\n`);

    if (allGames.length === 0) {
      console.log(`  ⚠ No WNCAA Basketball games found for date range`);
      return res.status(200).json({ message: 'No WNCAA Basketball games found for date range', synced: 0 });
    }

    const supabase = getSupabaseAdmin();
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
        const result = await upsertESPNGame(supabase, game, CONFIG);
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

    console.log(`\n🏀 ── WNCAA Basketball Sync Complete ──────────────────────────`);
    console.log(`  📊 ${synced} inserted │ ${updated} updated │ ${skipped} skipped │ ${allGames.length} total\n`);

    return res.status(200).json({
      message: `Synced ${synced} WNCAA Basketball games`,
      synced,
      updated,
      skipped,
      total_fetched: allGames.length,
    });
  } catch (error: any) {
    console.error('❌ WNCAA Basketball sync error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'WNCAA Basketball sync failed', status: 500 },
    });
  }
}
