/**
 * Log It — User Types
 * Matches DATA_MODELS.md User entity
 */

import { EventType, PrivacyLevel } from '@/constants/config';

/** Full user profile as stored in Supabase */
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  event_preferences: EventType[];
  default_privacy: PrivacyLevel;
  firebase_uid: string;
  created_at: string;
  updated_at: string;
}

/** Public-facing user profile (visible to everyone) */
export interface PublicUserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

/** Friend-level user profile (visible to friends) */
export interface FriendUserProfile extends PublicUserProfile {
  first_name: string | null;
  last_name: string | null;
}

/** Data sent during signup to create user profile */
export interface SignupData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  display_name: string;
  event_preferences: EventType[];
  default_privacy: PrivacyLevel;
}

/** Data for updating user profile */
export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  event_preferences?: EventType[];
  default_privacy?: PrivacyLevel;
}
