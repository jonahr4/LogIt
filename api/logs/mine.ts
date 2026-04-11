/**
 * Log It — GET /api/logs/mine
 * Fetches the authenticated user's event logs with full event details.
 * Returns logs joined with events + sports_events for rich display.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, type AuthenticatedRequest } from '../../server-lib/auth';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  // Verify Firebase auth
  const authReq = req as AuthenticatedRequest;
  const isAuthenticated = await verifyAuth(authReq, res);
  if (!isAuthenticated) return;

  const supabase = getSupabaseAdmin();

  try {
    // Look up user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authReq.firebaseUid!)
      .single();

    if (userError || !user) {
      // New user who hasn't been written to Supabase yet — return empty logbook
      return res.status(200).json({ logs: [], total: 0 });
    }

    // Fetch user's logs with event data
    const { data: logs, error: logsError } = await supabase
      .from('user_event_logs')
      .select(`
        id,
        notes,
        privacy,
        rating,
        photos,
        rooted_team,
        logged_at,
        events (
          id,
          event_type,
          title,
          status,
          event_date,
          venue_name,
          venue_city,
          venue_state,
          venue_lat,
          venue_lng,
          image_url,
          external_id,
          external_source,
          venues (
            id,
            name,
            city,
            state,
            lat,
            lng,
            image_url,
            venue_type
          )
        )
      `)
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false });

    if (logsError) {
      console.error('Logs fetch error:', logsError);
      throw logsError;
    }

    // Fetch sports metadata for sports events
    const eventIds = (logs || [])
      .map((l: any) => l.events?.id)
      .filter(Boolean);

    let sportsMap: Record<string, any> = {};
    if (eventIds.length > 0) {
      const { data: sportsData } = await supabase
        .from('sports_events')
        .select('event_id, sport, league, season, season_type, round, home_team_name, away_team_name, home_team_logo, away_team_logo, home_score, away_score')
        .in('event_id', eventIds);

      if (sportsData) {
        for (const s of sportsData) {
          sportsMap[s.event_id] = s;
        }
      }
    }

    // Fetch companions for all logs
    const logIds = (logs || []).map((l: any) => l.id);
    let companionsMap: Record<string, any[]> = {};
    if (logIds.length > 0) {
      const { data: companions } = await supabase
        .from('log_companions')
        .select('log_id, name, user_id')
        .in('log_id', logIds);

      if (companions) {
        for (const c of companions) {
          if (!companionsMap[c.log_id]) companionsMap[c.log_id] = [];
          companionsMap[c.log_id].push({ name: c.name, user_id: c.user_id });
        }
      }
    }

    // Fetch photos for all logs
    let photosMap: Record<string, any[]> = {};
    if (logIds.length > 0) {
      const { data: photos } = await supabase
        .from('log_photos')
        .select('id, log_id, url, firebase_path, display_order')
        .in('log_id', logIds)
        .order('display_order', { ascending: true });

      if (photos) {
        for (const p of photos) {
          if (!photosMap[p.log_id]) photosMap[p.log_id] = [];
          photosMap[p.log_id].push({ id: p.id, url: p.url, firebase_path: p.firebase_path, display_order: p.display_order });
        }
      }
    }

    // Format response
    const formattedLogs = (logs || []).map((log: any) => {
      const event = log.events;
      const sports = event ? sportsMap[event.id] : null;

      return {
        id: log.id,
        notes: log.notes,
        privacy: log.privacy,
        rating: log.rating,
        photos: photosMap[log.id] || [],
        rooted_team: log.rooted_team || null,
        logged_at: log.logged_at,
        companions: companionsMap[log.id] || [],
        event: event ? {
          id: event.id,
          event_type: event.event_type,
          title: event.title,
          status: event.status,
          event_date: event.event_date,
          // Venue data: prefer venues table, fallback to flat columns
          venue_name: event.venues?.name || event.venue_name,
          venue_city: event.venues?.city || event.venue_city,
          venue_state: event.venues?.state || event.venue_state,
          venue_lat: event.venues?.lat || event.venue_lat,
          venue_lng: event.venues?.lng || event.venue_lng,
          image_url: event.venues?.image_url || event.image_url,
          external_id: event.external_id,
          external_source: event.external_source,
          // Sports-specific
          ...(sports ? {
            sport: sports.sport,
            league: sports.league,
            season: sports.season,
            home_team_name: sports.home_team_name,
            away_team_name: sports.away_team_name,
            home_team_logo: sports.home_team_logo,
            away_team_logo: sports.away_team_logo,
            home_score: sports.home_score,
            away_score: sports.away_score,
            season_type: sports.season_type,
            round: sports.round,
          } : {}),
        } : null,
      };
    });

    return res.status(200).json({
      logs: formattedLogs,
      total: formattedLogs.length,
    });
  } catch (error: any) {
    console.error('Logs fetch error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to fetch logs', status: 500 },
    });
  }
}
