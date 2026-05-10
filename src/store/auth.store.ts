import { AppState } from 'react-native';
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
  signIn:           (emailOrUsername: string, password: string) => Promise<void>;
  signUp:           (email: string, password: string, fullName: string, username: string) => Promise<{ needsConfirmation: boolean }>;
  signOut:          () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUser:       (updates: Partial<DbUser>) => void;
}

async function loadProfile(userId: string): Promise<DbUser | null> {
  return authService.fetchUserProfile(userId).catch(() => null);
}

// Module-level flag: prevents double-init from React StrictMode double-effect.
// Resets to false on HMR / full bundle reload (module re-evaluation), which is
// exactly what we want — a fresh init after a code change.
let _initCalled = false;

export const useAuthStore = create<AuthState>((set) => ({
  session:     null,
  user:        null,
  initialized: false,
  loading:     false,

  initialize() {
    if (_initCalled) return;
    _initCalled = true;

    // `settled` ensures only one path (success / timeout / error) marks the app ready.
    let settled = false;

    const settle = (session: Session | null) => {
      if (settled) return;
      settled = true;
      set({ session, initialized: true });
    };

    // ── Safety timeout: 5 s max wait ────────────────────────────────────────
    // If getSession() or the network hangs, we clear the session and unblock
    // the UI. The user lands on login instead of a white/black screen forever.
    const timer = setTimeout(() => {
      supabase.auth.signOut().catch(() => {});
      settle(null);
    }, 5000);

    // ── Primary init path ────────────────────────────────────────────────────
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(timer);
        if (settled) return; // timeout already fired — don't touch state

        if (!session) { settle(null); return; }

        // If the stored token is expired, attempt a silent refresh before proceeding.
        // A corrupted / old-version token would fail here and route the user to login.
        const now = Math.floor(Date.now() / 1000);
        if ((session.expires_at ?? Infinity) < now) {
          const { data, error } = await supabase.auth.refreshSession();
          if (error || !data.session) {
            await supabase.auth.signOut().catch(() => {});
            settle(null);
            return;
          }
          settle(data.session);
        } else {
          settle(session);
        }

        // Profile load runs in the background — navigation is already unblocked.
        if (session.user?.id) {
          loadProfile(session.user.id)
            .then((user) => { if (user) set({ user }); })
            .catch(() => {});
        }
      })
      .catch(() => {
        // getSession() itself threw (corrupted storage, etc.) → clear and proceed.
        clearTimeout(timer);
        supabase.auth.signOut().catch(() => {});
        settle(null);
      });

    // ── Auth state change listener ───────────────────────────────────────────
    // Handles sign-in, sign-out, token refresh, and Google OAuth callbacks.
    supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (!session?.user) {
          set({ session: null, user: null });
          return;
        }
        const user = await loadProfile(session.user.id);
        // Sync username from auth metadata if not yet saved in profile
        const metaUsername = session.user.user_metadata?.username as string | undefined;
        if (metaUsername && user && !user.username) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('users') as any).update({ username: metaUsername }).eq('id', session.user.id).then(() => {});
          set({ session, user: { ...user, username: metaUsername } });
        } else {
          set({ session, user });
        }
      } catch {
        // Any error inside the listener (loadProfile throw, etc.) → sign out
        // so the app never ends up in a half-authenticated stuck state.
        await supabase.auth.signOut().catch(() => {});
        set({ session: null, user: null });
      }
    });

    // ── Dev: re-verify session on app foreground ─────────────────────────────
    // After Metro reconnects or the user switches back to the app, confirm the
    // stored session is still valid. If not, redirect to login immediately.
    if (__DEV__) {
      AppState.addEventListener('change', (nextState) => {
        if (nextState !== 'active') return;
        supabase.auth.getSession()
          .then(({ data: { session: fresh } }) => {
            if (!fresh) {
              supabase.auth.signOut().catch(() => {});
              set({ session: null, user: null });
            }
          })
          .catch(() => {
            set({ session: null, user: null });
          });
      });
    }
  },

  async signIn(emailOrUsername, password) {
    set({ loading: true });
    try {
      await authService.signIn(emailOrUsername, password);
    } finally {
      set({ loading: false });
    }
  },

  async signUp(email, password, fullName, username) {
    set({ loading: true });
    try {
      const data = await authService.signUp(email, password, fullName, username);
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

  updateUser(updates) {
    set((prev) => ({
      user: prev.user ? { ...prev.user, ...updates } : prev.user,
    }));
  },
}));
