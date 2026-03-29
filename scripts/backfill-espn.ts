import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { getVenueForTeam } from '../server-lib/nba-venues';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

async function fetchAndUpsertGamesForDate(dateStr: string) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    
    const events = data.events || [];
    if (events.length === 0) return 0;

    let successCount = 0;

    for (const game of events) {
      if (!game.competitions || !game.competitions[0]) continue;
      
      const comp = game.competitions[0];
      const venueData = comp.venue || {};
      const competitors = comp.competitors || [];
      
      const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
      const awayTeam = competitors.find((c: any) => c.homeAway === 'away');

      if (!homeTeam || !awayTeam) continue;

      const externalId = String(game.id);
      const title = game.name;
      const status = mapESPNStatus(game.status.type.state);
      const eventDate = game.date;

      // Get rich venue data from our mapping
      const mappedVenue = getVenueForTeam(homeTeam.team.abbreviation, venueData.address?.city || 'Unknown');

      // Upsert event manually (to avoid partial index ON CONFLICT errors)
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('external_id', externalId)
        .eq('external_source', 'espn')
        .maybeSingle();

      let eventId: string;

      if (existing) {
        // Update
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
          console.error(`Failed to update event ${externalId}:`, updateError);
          continue;
        }
        eventId = existing.id;
      } else {
        // Insert
        const { data: newEvent, error: insertError } = await supabase
          .from('events')
          .insert({
            event_type: 'sports',
            title,
            status,
            event_date: eventDate,
            venue_name: venueData.fullName || null,
            venue_city: venueData.address?.city || null,
            venue_state: venueData.address?.state || null,
            external_id: externalId,
            external_source: 'espn',
          })
          .select('id')
          .single();

        if (insertError || !newEvent) {
          console.error(`Failed to insert event ${externalId}:`, insertError);
          continue;
        }
        eventId = newEvent.id;
      }

      // Upsert sports_events child record
      const homeScore = homeTeam.score ? parseInt(homeTeam.score, 10) : null;
      const awayScore = awayTeam.score ? parseInt(awayTeam.score, 10) : null;

      const { error: sportsError } = await supabase
        .from('sports_events')
        .upsert(
          {
            event_id: eventId,
            sport: 'basketball',
            league: 'NBA',
            season: data.season ? String(data.season.year) : 'Unknown', // e.g. '2024'
            home_team_id: homeTeam.team.id,
            away_team_id: awayTeam.team.id,
            home_team_name: homeTeam.team.displayName,
            away_team_name: awayTeam.team.displayName,
            home_team_logo: homeTeam.team.logo || null,
            away_team_logo: awayTeam.team.logo || null,
            home_score: isNaN(homeScore as number) ? null : homeScore,
            away_score: isNaN(awayScore as number) ? null : awayScore,
          },
          { onConflict: 'event_id' }
        );

      if (sportsError) {
        console.error(`Failed to upsert sports_event ${externalId}:`, sportsError);
      } else {
        successCount++;
      }
    }
    return successCount;

  } catch (err: any) {
    console.error(`Error fetching/upserting for ${dateStr}:`, err.message);
    return 0;
  }
}

async function main() {
  console.log('--- LogIt ESPN Data Backfill ---');
  // Backfill 5 years = ~1825 days
  const numDays = 1825;
  
  const today = new Date();
  
  // Starting from today and going backward
  console.log(`Starting backfill for the last ${numDays} days...`);

  let totalGames = 0;
  
  for (let i = 0; i < numDays; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    const dateStr = formatDate(targetDate);

    process.stdout.write(`Fetching ${dateStr}... `);
    
    // Process one date
    const count = await fetchAndUpsertGamesForDate(dateStr);
    totalGames += count;
    
    console.log(`✅ Upserted ${count} games `);
    
    // Slight delay to avoid ESPN rate limits
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n🎉 Backfill complete! Inserted/Upserted ${totalGames} historical games.`);
}

main().catch(console.error);
