/**
 * Log It — GET /api/events/box-score
 * Sport-agnostic box score fetcher — calls ESPN summary API.
 *
 * Query params:
 *   external_id - ESPN game ID (stored on our events table)
 *   league      - optional, e.g. "NBA" or "NFL". If not provided,
 *                 we look it up from sports_events via Supabase.
 *
 * Returns a generic structure that works for any sport:
 *   { available, teams: [{ abbreviation, full_name, categories: [{ name, labels, players }] }] }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';

const LEAGUE_PATHS: Record<string, string> = {
  NBA: 'basketball/nba',
  NFL: 'football/nfl',
  MLB: 'baseball/mlb',
  NHL: 'hockey/nhl',
  MLS: 'soccer/usa.1',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  const { external_id, league: leagueParam } = req.query;

  if (!external_id || typeof external_id !== 'string') {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'external_id is required', status: 422 },
    });
  }

  // Determine the ESPN sport path
  let leagueStr = typeof leagueParam === 'string' ? leagueParam.toUpperCase() : '';

  // If no league passed, look it up from the DB
  if (!leagueStr) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('events')
        .select('sports_events(league)')
        .eq('external_id', external_id)
        .eq('external_source', 'espn')
        .maybeSingle();

      const se = data?.sports_events;
      const seRecord = Array.isArray(se) ? se[0] : se;
      leagueStr = (seRecord?.league || 'NBA').toUpperCase();
    } catch {
      leagueStr = 'NBA';
    }
  }

  const espnPath = LEAGUE_PATHS[leagueStr] || 'basketball/nba';

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${espnPath}/summary?event=${external_id}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`ESPN summary error: ${response.status} for ${leagueStr} game ${external_id}`);
      return res.status(502).json({
        error: { code: 'UPSTREAM_ERROR', message: 'Failed to fetch box score', status: 502 },
      });
    }

    const data = await response.json();

    if (!data.boxscore || !data.boxscore.players) {
      return res.status(200).json({ available: false });
    }

    // Generic parser — works for any sport's boxscore.players structure
    const formattedTeams = data.boxscore.players.map((teamData: any) => {
      if (!teamData.statistics || teamData.statistics.length === 0) return null;

      // Each sport has different stat categories:
      // NBA: one category with names [MIN, PTS, REB, AST, ...]
      // NFL: multiple categories [passing, rushing, receiving, ...]
      const categories = teamData.statistics.map((statGroup: any) => {
        const labels = statGroup.labels || statGroup.names || [];
        const players = (statGroup.athletes || []).map((ath: any) => ({
          name: ath.athlete?.displayName || 'Unknown',
          position: ath.athlete?.position?.abbreviation || '',
          stats: ath.stats || [],
        }));

        return {
          name: statGroup.name || statGroup.type || 'stats',
          labels,
          players,
        };
      });

      return {
        abbreviation: teamData.team?.abbreviation || '',
        full_name: teamData.team?.displayName || '',
        categories,
      };
    }).filter(Boolean);

    return res.status(200).json({
      available: formattedTeams.length > 0,
      league: leagueStr,
      teams: formattedTeams,
    });
  } catch (error: any) {
    console.error('Box score error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to fetch box score', status: 500 },
    });
  }
}
