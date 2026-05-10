import { supabase } from '../../../lib/supabase';
import type { DbUser } from '../../../types/database.types';

export async function updateProfile(
  userId: string,
  updates: Pick<DbUser, 'name'> | Pick<DbUser, 'avatar_url'> | Partial<Pick<DbUser, 'name' | 'avatar_url'>>,
): Promise<void> {
  const result = await (supabase.from('users') as unknown as {
    update: (v: typeof updates) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
  }).update(updates).eq('id', userId);

  if (result.error) throw new Error(result.error.message);
}

export async function uploadAvatar(
  userId: string,
  localUri: string,
): Promise<string> {
  const ext = (localUri.split('.').pop() ?? 'jpg').toLowerCase();
  const path = `${userId}/avatar.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
