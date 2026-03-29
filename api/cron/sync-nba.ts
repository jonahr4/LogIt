/**
 * Log It — GET /api/cron/sync-nba
 * Vercel Cron Job: Syncs NBA games from ESPN into Supabase
 * Schedule: daily at 6:00 AM UTC (configured in vercel.json)
 *
 * Fetches games for today ± 7 days, upserts into events + sports_events
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';
import { getVenueForTeam } from '../../server-lib/nba-venues';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function mapESPNStatus(espnState: string): 'upcoming' | 'in_progress' | 'completed' {
  if (espnState === 'post') return 'completed';
  if (espnState === 'in') return 'in_progress';
  return 'upcoming';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  // Verify cron secret (Vercel sends this header for cron jobs)
  // In dev, allow without secret
  const cronSecret = req.headers['authorization'];
  const isDev = process.env.NODE_ENV === 'development' || !process.env.CRON_SECRET;
  if (!isDev && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret', status: 401 },
    });
  }

  try {
    // Calculate date range: today ± 7 days
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    // Fetch games from ESPN for the date range
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${startStr}-${endStr}&limit=300`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    const allGames = data.events || [];

    console.log(`Fetched ${allGames.length} NBA games from ESPN API`);

    if (allGames.length === 0) {
      return res.status(200).json({ message: 'No games found for date range', synced: 0 });
    }

    const supabase = getSupabaseAdmin();
    let synced = 0;
    let updated = 0;

    for (const game of allGames) {
      const externalId = game.id;
      const title = game.name;
      const status = mapESPNStatus(game.status.type.state);
      const eventDate = game.date;

      // Ensure we have competition data
      if (!game.competitions || !game.competitions[0]) continue;
      
      const comp = game.competitions[0];
      const venueData = comp.venue || {};
      const competitors = comp.competitors || [];
      
      const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
      const awayTeam = competitors.find((c: any) => c.homeAway === 'away');

      if (!homeTeam || !awayTeam) continue;

      const mappedVenue = getVenueForTeam(homeTeam.team.abbreviation, venueData.address?.city || 'Unknown');

      try {
        // Check if event already exists by external_id
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('external_id', externalId)
          .eq('external_source', 'espn')
          .maybeSingle();

        let eventId: string;

        if (existing) {
          // Update existing event (scores, status may have changed)
          const { error: updateError } = await supabase
            .from('events')
            .update({
              title,
              status,
              event_date: eventDate,
              venue_name: mappedVenue.arena || venueData.fullName || null,
              venue_city: mappedVenue.city || venueData.address?.city || null,
              venue_state: mappedVenue.state || venueData.address?.state || null,
              venue_lat: mappedVenue.lat || null,
              venue_lng: mappedVenue.lng || null,
              image_url: mappedVenue.image_url || null,
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Error updating event ${game.id}:`, updateError);
            continue;
          }
          eventId = existing.id;
        } else {
          // Insert new event
          const { data: newEvent, error: insertError } = await supabase
            .from('events')
            .insert({
              event_type: 'sports',
              title,
              status,
              event_date: eventDate,
              venue_name: mappedVenue.arena || venueData.fullName || null,
              venue_city: mappedVenue.city || venueData.address?.city || null,
              venue_state: mappedVenue.state || venueData.address?.state || null,
              venue_lat: mappedVenue.lat || null,
              venue_lng: mappedVenue.lng || null,
              image_url: mappedVenue.image_url || null,
              external_id: externalId,
              external_source: 'espn',
            })
            .select('id')
            .single();

          if (insertError || !newEvent) {
            console.error(`Error inserting event ${game.id}:`, insertError);
            continue;
          }
          eventId = newEvent.id;
        }

        // Upsert sports_events child record
        const homeScore = homeTeam.score ? parseInt(homeTeam.score, 10) : null;
        const awayScore = awayTeam.score ? parseInt(awayTeam.score, 10) : null;

        const { error: sportsError } = await supabase
          .from('sports_events')
          .upsert({
            event_id: eventId,
            sport: 'basketball',
            league: 'NBA',
            season: '2024-25',
            home_team_id: homeTeam.team.id,
            away_team_id: awayTeam.team.id,
            home_team_name: homeTeam.team.displayName,
            away_team_name: awayTeam.team.displayName,
            home_team_logo: homeTeam.team.logo || null,
            away_team_logo: awayTeam.team.logo || null,
            home_score: isNaN(homeScore as number) ? null : homeScore,
            away_score: isNaN(awayScore as number) ? null : awayScore,
          }, { onConflict: 'event_id' });

        if (sportsError) {
          console.error(`Error upserting sports_events for ${game.id}:`, sportsError);
        } else {
          if (existing) updated++;
          else synced++;
        }
      } catch (err) {
        console.error(`Unexpected error processing game ${game.id}:`, err);
      }
    }

    console.log(`Synced ${synced} games (${updated} with scores)`);
    return res.status(200).json({
      message: `Synced ${synced} NBA games`,
      synced,
      updated,
      total_fetched: allGames.length,
    });
  } catch (error: any) {
    console.error('NBA sync error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Sync failed', status: 500 },
    });
  }
}
