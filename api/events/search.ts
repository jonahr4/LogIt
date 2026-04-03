/**
 * Log It — GET /api/events/search
 * Multi-field search using Postgres RPC function `search_events`
 * Searches across: title, venue name, venue city, team names, league, sport
 *
 * Query params:
 *   q          - search query — required (partial matches supported)
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

  const { q, event_type, date_from, date_to, limit: limitParam, league } = req.query;

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

  const limit = Math.min(Math.max(parseInt(String(limitParam)) || 40, 1), 100);
  const offset = Math.max(parseInt(String(req.query.offset)) || 0, 0);
  const supabase = getSupabaseAdmin();

  // Split multi-word queries into tokens. Search DB with primary token (longest meaningful word),
  // then post-filter results to require all other tokens appear somewhere in the event data.
  // e.g. "celtics golden state" → primary="celtics", secondary=["golden","state"]
  const tokens = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
  const primaryToken = tokens.reduce((a, b) => b.length > a.length ? b : a, tokens[0] || searchQuery);
  const secondaryTokens = tokens.filter(t => t !== primaryToken);

  // Helper: check if a result row contains all secondary tokens in any of its key fields
  function matchesAllTokens(row: any): boolean {
    if (secondaryTokens.length === 0) return true;
    const haystack = [
      row.title, row.home_team_name, row.away_team_name,
      row.venue_name, row.v_name, row.venue_city, row.v_city, row.league,
      row.round, row.sport,
    ].filter(Boolean).join(' ').toLowerCase();
    return secondaryTokens.every(t => haystack.includes(t));
  }

  try {
    const leagueFilter = (league && typeof league === 'string') ? league.trim() : '';

    // When filtering by league, fetch more results so post-filter has enough to work with
    const fetchLimit = leagueFilter ? 500 : limit + 1;

    // Call the multi-field search Postgres function using the primary token
    const { data: rows, error } = await supabase.rpc('search_events', {
      search_term: primaryToken,
      event_type_filter: (event_type && typeof event_type === 'string') ? event_type : null,
      date_from_filter: (date_from && typeof date_from === 'string') ? date_from : null,
      date_to_filter: (date_to && typeof date_to === 'string') ? date_to : null,
      result_limit: fetchLimit,
      result_offset: offset,
    });

    if (error) {
      console.error('RPC search error, falling back to ILIKE:', error);

      // Fallback: per-token ILIKE on title (works for multi-word queries)
      let query = supabase
        .from('events')
        .select(`
          id, event_type, title, status, event_date,
          venue_name, venue_city, venue_state, image_url, external_id,
          venues ( name, city, state, lat, lng, image_url ),
          sports_events (
            sport, league, season, season_type, round,
            home_team_id, away_team_id,
            home_team_name, away_team_name,
            home_team_logo, away_team_logo,
            home_score, away_score
          )
        `)
        .order('event_date', { ascending: false })
        .range(offset, offset + (leagueFilter ? 499 : limit));

      // Apply ILIKE for each token (all must match somewhere in title)
      for (const token of tokens) {
        query = query.ilike('title', `%${token}%`);
      }

      // If league filter, also filter in the query
      if (leagueFilter) {
        query = query.eq('sports_events.league', leagueFilter);
      }

      const { data: fallbackEvents, error: fallbackError } = await query;
      if (fallbackError) throw fallbackError;

      let fallbackFiltered = fallbackEvents || [];
      // Double-check league filter on formatted results
      if (leagueFilter) {
        fallbackFiltered = fallbackFiltered.filter((e: any) => {
          const se = Array.isArray(e.sports_events) ? e.sports_events[0] : e.sports_events;
          return se && se.league === leagueFilter;
        });
      }

      const hasMore = fallbackFiltered.length > limit;
      const pageData = fallbackFiltered.slice(0, limit);
      return res.status(200).json({
        data: pageData.map(formatFallbackEvent),
        meta: { count: pageData.length, query: searchQuery, offset, has_more: hasMore },
      });
    }

    // Post-filter RPC results to require all secondary tokens match
    let filtered = (rows || []).filter(matchesAllTokens);

    // Post-filter by league if specified
    if (leagueFilter) {
      filtered = filtered.filter((row: any) => row.league === leagueFilter);
    }

    const hasMore = filtered.length > limit;
    const formatted = filtered.slice(0, limit).map(formatRpcRow);

    // Enrich: ensure season_type/round are present (RPC may not return them if migration 016 wasn't applied)
    const sportsIds = formatted
      .filter((e: any) => e.type_metadata && e.type_metadata.season_type == null)
      .map((e: any) => e.id);

    if (sportsIds.length > 0) {
      const { data: enrichData } = await supabase
        .from('sports_events')
        .select('event_id, season_type, round')
        .in('event_id', sportsIds);

      if (enrichData) {
        const enrichMap = new Map(enrichData.map((r: any) => [r.event_id, r]));
        for (const event of formatted as any[]) {
          const extra = enrichMap.get(event.id);
          if (extra && event.type_metadata) {
            event.type_metadata.season_type = extra.season_type;
            event.type_metadata.round = extra.round;
          }
        }
      }
    }

    return res.status(200).json({
      data: formatted,
      meta: { count: formatted.length, query: searchQuery, offset, has_more: hasMore },
    });
  } catch (error: any) {
    console.error('Event search error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Search failed', status: 500 },
    });
  }
}

/**
 * Formats a row from the search_events RPC into EventSearchResult shape
 */
function formatRpcRow(row: any) {
  const base: any = {
    id: row.id,
    event_type: row.event_type,
    title: row.title,
    status: row.status,
    event_date: row.event_date,
    // Prefer venue table data, fall back to flat columns
    venue_name: row.v_name || row.venue_name,
    venue_city: row.v_city || row.venue_city,
    venue_state: row.v_state || row.venue_state,
    image_url: row.v_image_url || row.image_url,
    external_id: row.external_id,
  };

  let type_metadata = null;
  if (row.home_team_name) {
    type_metadata = {
      sport: row.sport,
      league: row.league,
      season: row.season,
      season_type: row.season_type,
      round: row.round,
      home_team_id: row.home_team_id,
      away_team_id: row.away_team_id,
      home_team_name: row.home_team_name,
      away_team_name: row.away_team_name,
      home_team_logo: row.home_team_logo,
      away_team_logo: row.away_team_logo,
      home_score: row.home_score,
      away_score: row.away_score,
    };
  }

  return { ...base, type_metadata };
}

/**
 * Formats a fallback Supabase row (used when RPC is not available)
 */
function formatFallbackEvent(row: any) {
  const { sports_events, venues, ...base } = row;
  const sportsData = Array.isArray(sports_events) ? sports_events[0] : sports_events;

  if (venues) {
    base.venue_name = venues.name || base.venue_name;
    base.venue_city = venues.city || base.venue_city;
    base.venue_state = venues.state || base.venue_state;
    base.image_url = venues.image_url || base.image_url;
  }

  let type_metadata = null;
  if (sportsData) {
    type_metadata = {
      sport: sportsData.sport,
      league: sportsData.league,
      season: sportsData.season,
      season_type: sportsData.season_type,
      round: sportsData.round,
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

  return { ...base, type_metadata };
}
