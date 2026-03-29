/**
 * Log It — GET /api/events/box-score
 * On-demand box score fetcher — calls Ball Don't Lie only when user requests it.
 * NOT stored in our DB — purely a proxy to avoid exposing the API key.
 *
 * Query params:
 *   external_id - BDL game ID (stored on our events table)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const BDL_BASE = 'https://api.balldontlie.io/v1';

interface BDLPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  jersey_number: string;
  team: {
    id: number;
    abbreviation: string;
    full_name: string;
  };
}

interface BDLStat {
  id: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  turnover: number;
  pf: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  player: BDLPlayer;
  game: { id: number };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  const { external_id } = req.query;

  if (!external_id || typeof external_id !== 'string') {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'external_id is required', status: 422 },
    });
  }

  const apiKey = process.env.BALL_DONT_LIE_API;
  if (!apiKey) {
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Missing API key', status: 500 },
    });
  }

  try {
    // Fetch player stats for this game
    const url = `${BDL_BASE}/stats?game_ids[]=${external_id}&per_page=100`;
    const response = await fetch(url, {
      headers: { Authorization: apiKey },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`BDL stats error: ${response.status} ${errText}`);
      return res.status(502).json({
        error: { code: 'UPSTREAM_ERROR', message: 'Failed to fetch box score', status: 502 },
      });
    }

    const data: { data: BDLStat[] } = await response.json();

    if (!data.data || data.data.length === 0) {
      return res.status(200).json({ home: [], away: [], available: false });
    }

    // Group stats by team
    // Determine home/away from the first stat's game context
    // BDL stats don't have home/away directly, so we group by team abbreviation
    const teamGroups: Record<string, any[]> = {};

    for (const stat of data.data) {
      const teamAbbr = stat.player.team.abbreviation;
      if (!teamGroups[teamAbbr]) {
        teamGroups[teamAbbr] = [];
      }

      teamGroups[teamAbbr].push({
        player: {
          id: stat.player.id,
          name: `${stat.player.first_name} ${stat.player.last_name}`,
          position: stat.player.position,
          jersey: stat.player.jersey_number,
        },
        minutes: stat.min,
        points: stat.pts,
        rebounds: stat.reb,
        assists: stat.ast,
        steals: stat.stl,
        blocks: stat.blk,
        turnovers: stat.turnover,
        fouls: stat.pf,
        fg: `${stat.fgm}/${stat.fga}`,
        fg_pct: stat.fg_pct,
        three_pt: `${stat.fg3m}/${stat.fg3a}`,
        three_pct: stat.fg3_pct,
        ft: `${stat.ftm}/${stat.fta}`,
        ft_pct: stat.ft_pct,
        off_reb: stat.oreb,
        def_reb: stat.dreb,
      });
    }

    // Sort players by points (descending) within each team
    const teams = Object.keys(teamGroups);
    for (const team of teams) {
      teamGroups[team].sort((a: any, b: any) => b.points - a.points);
    }

    // Return as two team arrays
    return res.status(200).json({
      available: true,
      teams: teams.map((abbr) => ({
        abbreviation: abbr,
        full_name: data.data.find((s) => s.player.team.abbreviation === abbr)?.player.team.full_name || abbr,
        players: teamGroups[abbr],
      })),
    });
  } catch (error: any) {
    console.error('Box score error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to fetch box score', status: 500 },
    });
  }
}
