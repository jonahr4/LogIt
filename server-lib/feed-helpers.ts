/**
 * Log It — Feed helpers
 * Shared logic for formatting feed cards from log + event + sports joins
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Given an array of raw log rows (with events + users joined),
 * fetch sports metadata + companions + photos and return formatted feed cards.
 */
export async function formatFeedCards(
  supabase: SupabaseClient,
  logs: any[]
): Promise<any[]> {
  if (!logs || logs.length === 0) return [];

  const eventIds = logs.map((l: any) => l.events?.id).filter(Boolean);
  const logIds = logs.map((l: any) => l.id);

  // Fetch sports metadata in bulk
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

  // Fetch companions in bulk
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

  // Fetch photos in bulk
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

  // Format feed cards
  return logs.map((log: any) => {
    const event = log.events;
    const user = log.users;
    const sports = event ? sportsMap[event.id] : null;

    return {
      log_id: log.id,
      user: user ? {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      } : null,
      event: event ? {
        id: event.id,
        event_type: event.event_type,
        title: event.title,
        status: event.status,
        event_date: event.event_date,
        venue_name: event.venues?.name || event.venue_name,
        venue_city: event.venues?.city || event.venue_city,
        venue_state: event.venues?.state || event.venue_state,
        image_url: event.venues?.image_url || event.image_url,
        type_metadata: sports ? {
          sport: sports.sport,
          league: sports.league,
          season: sports.season,
          season_type: sports.season_type,
          round: sports.round,
          home_team_name: sports.home_team_name,
          away_team_name: sports.away_team_name,
          home_team_logo: sports.home_team_logo,
          away_team_logo: sports.away_team_logo,
          home_score: sports.home_score,
          away_score: sports.away_score,
        } : {},
      } : null,
      notes: log.notes,
      privacy: log.privacy,
      rating: log.rating,
      rooted_team: log.rooted_team || null,
      photos: photosMap[log.id] || [],
      companions: companionsMap[log.id] || [],
      logged_at: log.logged_at,
    };
  });
}

/** Standard log select with event + user joins */
export const LOG_SELECT = `
  id,
  notes,
  privacy,
  rating,
  rooted_team,
  logged_at,
  users (
    id,
    username,
    display_name,
    avatar_url
  ),
  events (
    id,
    event_type,
    title,
    status,
    event_date,
    venue_name,
    venue_city,
    venue_state,
    image_url,
    venues (
      id,
      name,
      city,
      state,
      image_url
    )
  )
`;
