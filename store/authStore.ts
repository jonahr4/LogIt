/**
 * Log It — Auth Store (Zustand)
 * Manages authentication state, Firebase auth, and user profile
 * Persists onboarding state locally via AsyncStorage
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
  OAuthProvider,
} from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';
import { api } from '@/lib/api';
import type { User, SignupData } from '@/types/user';
import { Config } from '@/constants/config';

const STORAGE_KEY_USER = '@logit_user_profile';
const STORAGE_KEY_ONBOARDED = '@logit_is_onboarded';

// Google Sign-In only works in native builds, not Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let _GoogleSignin: any = null;
function getGoogleSignin(): typeof import('@react-native-google-signin/google-signin').GoogleSignin {
  if (isExpoGo) {
    throw new Error('Google Sign-In requires a development build. Use email or Apple Sign-In in Expo Go.');
  }
  if (!_GoogleSignin) {
    _GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  }
  return _GoogleSignin;
}

let _googleConfigured = false;

/** Map Firebase error codes to user-friendly messages */
function friendlyError(error: any, context: 'signin' | 'signup' | 'general' = 'general'): string {
  const code = error?.code || '';

  const messages: Record<string, string> = {
    // Sign-in specific
    'auth/user-not-found': 'No account found with that email — try signing up!',
    'auth/invalid-credential': context === 'signin'
      ? 'No account found or wrong password — try signing up!'
      : 'Invalid credentials. Please try again.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',

    // Sign-up specific
    'auth/email-already-in-use': 'An account with this email already exists — try signing in!',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',

    // General
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/invalid-api-key': 'App configuration error. Please contact support.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  };

  return messages[code] || error?.message || 'Something went wrong. Please try again.';
}

interface AuthState {
  // State
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: (identityToken: string, nonce: string) => Promise<void>;
  completeOnboarding: (data: Omit<SignupData, 'email'>) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isOnboarded: false,
  isLoading: true,
  error: null,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Try to fetch existing user profile from API
          const user = await api.get<User>('/auth/me');
          // Persist locally for offline access
          await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
          await AsyncStorage.setItem(STORAGE_KEY_ONBOARDED, 'true');
          set({
            firebaseUser,
            user,
            isAuthenticated: true,
            isOnboarded: true,
            isLoading: false,
          });
        } catch {
          // API unavailable — check local storage for previously onboarded user
          try {
            const wasOnboarded = await AsyncStorage.getItem(STORAGE_KEY_ONBOARDED);
            const storedUser = await AsyncStorage.getItem(STORAGE_KEY_USER);

            if (wasOnboarded === 'true' && storedUser) {
              // Previously onboarded, use cached profile
              set({
                firebaseUser,
                user: JSON.parse(storedUser),
                isAuthenticated: true,
                isOnboarded: true,
                isLoading: false,
              });
            } else {
              // No local data — check Firebase metadata to determine if returning user
              // If account was created more than 2 minutes ago, they likely already onboarded
              const creationTime = firebaseUser.metadata?.creationTime;
              const isReturningUser = creationTime
                ? (Date.now() - new Date(creationTime).getTime()) > 2 * 60 * 1000
                : false;

              if (isReturningUser) {
                // Returning user whose local data was lost — create profile from Firebase
                const localUser = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  username: firebaseUser.email?.split('@')[0] || firebaseUser.uid.slice(0, 8),
                  first_name: firebaseUser.displayName?.split(' ')[0] || '',
                  last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                  display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
                  avatar_url: firebaseUser.photoURL || null,
                  bio: null,
                  event_preferences: ['sports'],
                  default_privacy: 'public',
                  created_at: creationTime || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                } as User;

                await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(localUser));
                await AsyncStorage.setItem(STORAGE_KEY_ONBOARDED, 'true');

                set({
                  firebaseUser,
                  user: localUser,
                  isAuthenticated: true,
                  isOnboarded: true,
                  isLoading: false,
                });
              } else {
                // Genuinely new user — needs onboarding
                set({
                  firebaseUser,
                  user: null,
                  isAuthenticated: true,
                  isOnboarded: false,
                  isLoading: false,
                });
              }
            }
          } catch {
            set({
              firebaseUser,
              user: null,
              isAuthenticated: true,
              isOnboarded: false,
              isLoading: false,
            });
          }
        }
      } else {
        set({
          firebaseUser: null,
          user: null,
          isAuthenticated: false,
          isOnboarded: false,
          isLoading: false,
        });
      }
    });
    return unsubscribe;
  },

  signUpWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      set({
        isLoading: false,
        error: friendlyError(error, 'signup'),
      });
      throw error;
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      set({
        isLoading: false,
        error: friendlyError(error, 'signin'),
      });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const GS = getGoogleSignin();
      if (!_googleConfigured) {
        GS.configure({
          iosClientId: Config.auth.googleIosClientId,
          webClientId: Config.auth.googleWebClientId,
        });
        _googleConfigured = true;
      }
      await GS.hasPlayServices();
      const signInResult = await GS.signIn();
      const idToken = signInResult?.data?.idToken;
      if (!idToken) throw new Error('No ID token from Google Sign-In');
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(firebaseAuth, credential);
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Google sign-in failed',
      });
      throw error;
    }
  },

  signInWithApple: async (identityToken: string, nonce: string) => {
    set({ isLoading: true, error: null });
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
      await signInWithCredential(firebaseAuth, credential);
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Apple sign-in failed',
      });
      throw error;
    }
  },

  completeOnboarding: async (data: Omit<SignupData, 'email'>) => {
    const { firebaseUser } = get();
    if (!firebaseUser?.email) throw new Error('No authenticated user');

    set({ isLoading: true, error: null });

    let user: User;
    try {
      user = await api.post<User>('/auth/signup', {
        ...data,
        email: firebaseUser.email,
      });
    } catch {
      // API not deployed yet — create user profile locally
      user = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: data.display_name || data.first_name,
        avatar_url: firebaseUser.photoURL || null,
        bio: null,
        event_preferences: data.event_preferences || [],
        default_privacy: data.default_privacy || 'public',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User;
    }

    // Persist to local storage
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEY_ONBOARDED, 'true');

    set({
      user,
      isOnboarded: true,
      isLoading: false,
    });
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await firebaseSignOut(firebaseAuth);
      // Clear persisted state
      await AsyncStorage.multiRemove([STORAGE_KEY_USER, STORAGE_KEY_ONBOARDED]);
      set({
        user: null,
        firebaseUser: null,
        isAuthenticated: false,
        isOnboarded: false,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to sign out',
      });
    }
  },

  clearError: () => set({ error: null }),
  setUser: (user: User) => set({ user }),
}));
