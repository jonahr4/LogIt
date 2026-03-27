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
        error: error.message || 'Failed to create account',
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
        error: error.message || 'Failed to sign in',
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
      set({
        isLoading: false,
        error: error.message || 'Failed to complete profile',
      });
      throw error;
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
