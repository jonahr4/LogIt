/**
 * Log It — App Configuration
 */

export const Config = {
  app: {
    name: 'LogIt',
    tagline: 'Log the events you live.',
    version: '1.0.0',
  },
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
    timeout: 3000,
  },
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  },
  auth: {
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    googleIosClientId: '329819496492-ddp4q2jfq9dq5lm2hl0p8an1svm3s4bg.apps.googleusercontent.com',
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 50,
  },
} as const;

export const EventTypes = ['sports', 'movie', 'concert', 'restaurant', 'manual'] as const;
export type EventType = (typeof EventTypes)[number];

export const PrivacyLevels = ['public', 'friends', 'private'] as const;
export type PrivacyLevel = (typeof PrivacyLevels)[number];

export const Sports = ['basketball', 'baseball', 'football', 'hockey'] as const;
export type Sport = (typeof Sports)[number];
