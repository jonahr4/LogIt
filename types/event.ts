/**
 * Log It — Event Types
 * Matches DATA_MODELS.md Event + SportsEvent entities
 */

import { EventType } from '@/constants/config';

/** Event status */
export type EventStatus = 'upcoming' | 'in_progress' | 'completed';

/** Base event as stored in Supabase `events` table */
export interface Event {
  id: string;
  event_type: EventType;
  title: string;
  status: EventStatus;
  event_date: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  image_url: string | null;
  external_id: string | null;
  external_source: string | null;
  created_at: string;
  updated_at: string;
}

/** Sports-specific metadata from `sports_events` child table */
export interface SportsEvent {
  event_id: string;
  sport: 'basketball' | 'baseball' | 'football' | 'hockey';
  league: string;
  season: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
}

/** Combined event with type-specific metadata (API response shape) */
export interface EventWithMetadata extends Event {
  type_metadata: SportsEventMetadata | null;
}

/** Flattened sports metadata for API responses */
export interface SportsEventMetadata {
  sport: 'basketball' | 'baseball' | 'football' | 'hockey';
  league: string;
  season: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
}

/** Event search result from our Supabase DB */
export interface EventSearchResult {
  id: string;
  event_type: EventType;
  title: string;
  status: EventStatus;
  event_date: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  image_url: string | null;
  type_metadata: SportsEventMetadata | null;
}

// ────────────────────────────────────────────
// Ball Don't Lie API Types
// ────────────────────────────────────────────

/** BDL Team response */
export interface BDLTeam {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

/** BDL Game response */
export interface BDLGame {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  datetime: string | null;
  home_team: BDLTeam;
  visitor_team: BDLTeam;
}

/** BDL paginated response */
export interface BDLResponse<T> {
  data: T[];
  meta: {
    next_cursor: number | null;
    per_page: number;
  };
}
