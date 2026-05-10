import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '../lib/supabase';
import { DbUser } from '../types/database.types';

export async function signIn(emailOrUsername: string, password: string) {
  let email = emailOrUsername.trim();

  if (!email.includes('@')) {
    // Resolve username → email via RPC (requires find_email_by_username function in Supabase)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('find_email_by_username', { p_username: email });
    if (error || !data) throw new Error('invalid credentials');
    email = data as string;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, fullName: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: fullName, username } },
  });
  if (error) throw error;

  // Save username to profile immediately (works when email confirmation is disabled)
  if (data.user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('users') as any).update({ username }).eq('id', data.user.id);
  }

  return data;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string): Promise<void> {
  const redirectTo = makeRedirectUri({ scheme: 'volleytip', path: 'reset-password' });
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = makeRedirectUri({ scheme: 'volleytip', path: 'auth/callback' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw error ?? new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return;

  // Parse tokens from URL fragment or query string
  const raw = result.url;
  const hashIdx = raw.indexOf('#');
  const qIdx    = raw.indexOf('?');
  const fragment = hashIdx !== -1
    ? raw.slice(hashIdx + 1)
    : qIdx !== -1 ? raw.slice(qIdx + 1) : '';

  const params       = new URLSearchParams(fragment);
  const code         = params.get('code');
  const accessToken  = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (code) {
    const { error: err } = await supabase.auth.exchangeCodeForSession(code);
    if (err) throw err;
  } else if (accessToken) {
    const { error: err } = await supabase.auth.setSession({
      access_token:  accessToken,
      refresh_token: refreshToken ?? '',
    });
    if (err) throw err;
  }
}

export async function fetchUserProfile(userId: string): Promise<DbUser> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export function mapAuthError(message: string): 'errorInvalidCredentials' | 'errorEmailInUse' | 'errorWeakPassword' | null {
  const m = message.toLowerCase();
  if (m.includes('invalid') || m.includes('credentials')) return 'errorInvalidCredentials';
  if (m.includes('already') || m.includes('registered'))   return 'errorEmailInUse';
  if (m.includes('password') && m.includes('character'))   return 'errorWeakPassword';
  return null;
}
