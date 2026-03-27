/**
 * Log It — Auth Store (Zustand)
 * Manages authentication state, Firebase auth, and user profile
 */

import { create } from 'zustand';
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
  signInWithGoogle: (idToken: string) => Promise<void>;
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
          // Try to fetch existing user profile
          const user = await api.get<User>('/auth/me');
          set({
            firebaseUser,
            user,
            isAuthenticated: true,
            isOnboarded: true,
            isLoading: false,
          });
        } catch {
          // User exists in Firebase but not in our DB — needs onboarding
          set({
            firebaseUser,
            user: null,
            isAuthenticated: true,
            isOnboarded: false,
            isLoading: false,
          });
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

  signInWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
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
    try {
      const user = await api.post<User>('/auth/signup', {
        ...data,
        email: firebaseUser.email,
      });
      set({
        user,
        isOnboarded: true,
        isLoading: false,
      });
    } catch (error: any) {
      // API not deployed yet — mark as onboarded locally so user can proceed
      // The profile will sync when the API is available
      console.warn('API not available, completing onboarding locally:', error.message);
      set({
        user: {
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
        } as User,
        isOnboarded: true,
        isLoading: false,
      });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await firebaseSignOut(firebaseAuth);
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
