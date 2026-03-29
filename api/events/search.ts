/**
 * Log It — GET /api/events/search
 * Searches our Supabase events table using full-text search
 * Returns events with type-specific metadata
 *
 * Query params:
 *   q          - search query (searches title, venue, city) — required
 *   event_type - filter by type (e.g. 'sports')
 *   date_from  - ISO date string
 *   date_to    - ISO date string
 *   limit      - results per page (default 20, max 50)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  const { q, event_type, date_from, date_to, limit: limitParam } = req.query;

  const searchQuery = typeof q === 'string' ? q.trim() : '';
  if (!searchQuery) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Query parameter "q" is required',
        status: 422,
      },
    });
  }

  const limit = Math.min(Math.max(parseInt(String(limitParam)) || 20, 1), 50);
  const supabase = getSupabaseAdmin();

  try {
    // Build the base query with a join to sports_events
    // We use a text search approach: Postgres full-text search via to_tsquery
    // Convert the user's search into a tsquery-compatible format
    const tsQuery = searchQuery
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => `${word}:*`)  // prefix matching for partial words
      .join(' & ');

    // Build query
    let query = supabase
      .from('events')
      .select(`
        id,
        event_type,
        title,
        status,
        event_date,
        venue_name,
        venue_city,
        venue_state,
        image_url,
        external_id,
        sports_events (
          sport,
          league,
          season,
          home_team_id,
          away_team_id,
          home_team_name,
          away_team_name,
          home_team_logo,
          away_team_logo,
          home_score,
          away_score
        )
      `)
      .textSearch(
        'title',
        tsQuery,
        { type: 'websearch' }
      )
      .order('event_date', { ascending: false })
      .limit(limit);

    // Apply filters
    if (event_type && typeof event_type === 'string') {
      query = query.eq('event_type', event_type);
    }
    if (date_from && typeof date_from === 'string') {
      query = query.gte('event_date', date_from);
    }
    if (date_to && typeof date_to === 'string') {
      query = query.lte('event_date', date_to);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Event search error:', error);

      // Fallback: if full-text search fails, try ilike pattern match
      const fallbackQuery = supabase
        .from('events')
        .select(`
          id,
          event_type,
          title,
          status,
          event_date,
          venue_name,
          venue_city,
          venue_state,
          image_url,
          external_id,
          sports_events (
            sport,
            league,
            season,
            home_team_id,
            away_team_id,
            home_team_name,
            away_team_name,
            home_team_logo,
            away_team_logo,
            home_score,
            away_score
          )
        `)
        .ilike('title', `%${searchQuery}%`)
        .order('event_date', { ascending: false })
        .limit(limit);

      if (event_type && typeof event_type === 'string') {
        fallbackQuery.eq('event_type', event_type);
      }

      const { data: fallbackEvents, error: fallbackError } = await fallbackQuery;

      if (fallbackError) {
        throw fallbackError;
      }

      return res.status(200).json({
        data: (fallbackEvents || []).map(formatEvent),
        meta: { count: fallbackEvents?.length || 0, query: searchQuery },
      });
    }

    return res.status(200).json({
      data: (events || []).map(formatEvent),
      meta: { count: events?.length || 0, query: searchQuery },
    });
  } catch (error: any) {
    console.error('Event search error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Search failed', status: 500 },
    });
  }
}

/**
 * Formats a raw Supabase row into the EventSearchResult shape
 * Flattens the child table join into a type_metadata object
 */
function formatEvent(row: any) {
  const { sports_events, ...base } = row;

  // sports_events comes as an array from the join — take first (1:1)
  const sportsData = Array.isArray(sports_events) ? sports_events[0] : sports_events;

  let type_metadata = null;
  if (sportsData) {
    type_metadata = {
      sport: sportsData.sport,
      league: sportsData.league,
      season: sportsData.season,
      home_team_id: sportsData.home_team_id,
      away_team_id: sportsData.away_team_id,
      home_team_name: sportsData.home_team_name,
      away_team_name: sportsData.away_team_name,
      home_team_logo: sportsData.home_team_logo,
      away_team_logo: sportsData.away_team_logo,
      home_score: sportsData.home_score,
      away_score: sportsData.away_score,
    };
  }

  return {
    ...base,
    type_metadata,
  };
}
