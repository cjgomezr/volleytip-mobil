import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '../lib/supabase';
import * as authService from '../services/auth.service';
import { DbUser } from '../types/database.types';

interface AuthState {
  session:     Session | null;
  user:        DbUser | null;
  initialized: boolean;
  loading:     boolean;

  initialize:       () => void;
  signIn:           (email: string, password: string) => Promise<void>;
  signUp:           (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  signOut:          () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

async function loadProfile(userId: string): Promise<DbUser | null> {
  return authService.fetchUserProfile(userId).catch(() => null);
}

export const useAuthStore = create<AuthState>((set) => ({
  session:     null,
  user:        null,
  initialized: false,
  loading:     false,

  initialize() {
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        const user = session?.user ? await loadProfile(session.user.id) : null;
        set({ session, user, initialized: true });
      })
      .catch(() => {
        // Network or storage error — still unblock the app
        set({ initialized: true });
      });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ? await loadProfile(session.user.id) : null;
      set({ session, user });
    });
  },

  async signIn(email, password) {
    set({ loading: true });
    try {
      await authService.signIn(email, password);
    } finally {
      set({ loading: false });
    }
  },

  async signUp(email, password, fullName) {
    set({ loading: true });
    try {
      const data = await authService.signUp(email, password, fullName);
      return { needsConfirmation: !data.session };
    } finally {
      set({ loading: false });
    }
  },

  async signOut() {
    set({ loading: true });
    try {
      await authService.signOut();
      set({ session: null, user: null });
    } finally {
      set({ loading: false });
    }
  },

  async signInWithGoogle() {
    set({ loading: true });
    try {
      await authService.signInWithGoogle();
    } finally {
      set({ loading: false });
    }
  },
}));
