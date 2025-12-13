import { create } from 'zustand';
import { User } from 'firebase/auth';
import { auth, onAuthChange } from '../lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user: User | null) => {
    set({ user, loading: false });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  initialize: () => {
    // Listen for auth state changes
    onAuthChange((user) => {
      set({ user, loading: false, initialized: true });
    });
  }
}));

// Initialize auth listener when the app starts
useAuthStore.getState().initialize();
