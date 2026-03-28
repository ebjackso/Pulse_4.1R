import { create } from 'zustand';
import { signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebaseService';

interface AuthStore {
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  isSignedIn: boolean;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  userId: null,
  isLoading: false,
  error: null,
  isSignedIn: false,

  signInAnonymously: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await signInAnonymously(auth);
      set({
        userId: result.user.uid,
        isSignedIn: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await signOut(auth);
      set({
        userId: null,
        isSignedIn: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  checkAuthStatus: () => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        set({
          userId: user.uid,
          isSignedIn: true,
        });
      } else {
        set({
          userId: null,
          isSignedIn: false,
        });
      }
    });
  },
}));
