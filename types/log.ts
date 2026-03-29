/**
 * Log It — Log Types
 * Matches DATA_MODELS.md UserEventLog + LogCompanion entities
 */

import { PrivacyLevel } from '@/constants/config';

/** User event log as stored in Supabase `user_event_logs` table */
export interface UserEventLog {
  id: string;
  user_id: string;
  event_id: string;
  notes: string | null;
  privacy: PrivacyLevel;
  rating: number | null;
  photos: string[];
  logged_at: string;
  updated_at: string;
}

/** Log companion as stored in Supabase `log_companions` table */
export interface LogCompanion {
  id: string;
  log_id: string;
  user_id: string | null;
  name: string;
}

/** Request body for POST /api/logs/create */
export interface CreateLogRequest {
  event_id: string;
  notes?: string;
  privacy?: PrivacyLevel;
  rating?: number;
  photos?: string[];
  companions?: {
    user_id?: string;
    name: string;
  }[];
}

/** Response from POST /api/logs/create */
export interface CreateLogResponse {
  id: string;
  user_id: string;
  event_id: string;
  notes: string | null;
  privacy: PrivacyLevel;
  rating: number | null;
  photos: string[];
  companions: LogCompanion[];
  logged_at: string;
}
