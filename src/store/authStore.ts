import { create } from 'zustand';

import type { UserProfile } from '@/types/models';

interface AuthState {
  /** true mientras se resuelve el estado inicial de sesión (onAuthStateChanged). */
  initializing: boolean;
  firebaseUid: string | null;
  email: string | null;
  profile: UserProfile | null;
  setSession: (uid: string | null, email: string | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setInitializing: (value: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  initializing: true,
  firebaseUid: null,
  email: null,
  profile: null,
  setSession: (uid, email) => set({ firebaseUid: uid, email }),
  setProfile: (profile) => set({ profile }),
  setInitializing: (value) => set({ initializing: value }),
  reset: () => set({ firebaseUid: null, email: null, profile: null }),
}));
