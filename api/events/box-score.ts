/**
 * Log It — GET /api/events/box-score
 * On-demand box score fetcher — calls ESPN API
 *
 * Query params:
 *   external_id - ESPN game ID (stored on our events table)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${external_id}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`ESPN stats error: ${response.status}`);
      return res.status(502).json({
        error: { code: 'UPSTREAM_ERROR', message: 'Failed to fetch box score', status: 502 },
      });
    }

    const data = await response.json();

    if (!data.boxscore || !data.boxscore.players) {
      return res.status(200).json({ available: false });
    }

    const formattedTeams = data.boxscore.players.map((teamData: any) => {
      const statsBlock = teamData.statistics[0];
      if (!statsBlock) return null;

      const keys = statsBlock.names;
      const idxMin = keys.indexOf('MIN');
      const idxPts = keys.indexOf('PTS');
      const idxReb = keys.indexOf('REB');
      const idxAst = keys.indexOf('AST');

      const players = statsBlock.athletes.map((ath: any) => {
        const stats = ath.stats;
        return {
          player: { name: ath.athlete.displayName },
          minutes: idxMin >= 0 ? stats[idxMin] : '-',
          points: idxPts >= 0 ? parseInt(stats[idxPts], 10) || 0 : 0,
          rebounds: idxReb >= 0 ? parseInt(stats[idxReb], 10) || 0 : 0,
          assists: idxAst >= 0 ? parseInt(stats[idxAst], 10) || 0 : 0,
        };
      });

      // Sort players by points descendings
      players.sort((a: any, b: any) => b.points - a.points);

      return {
        abbreviation: teamData.team.abbreviation,
        full_name: teamData.team.displayName,
        players,
      };
    }).filter(Boolean);

    return res.status(200).json({
      available: true,
      teams: formattedTeams,
    });
  } catch (error: any) {
    console.error('Box score error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to fetch box score', status: 500 },
    });
  }
}
