import type { DbPurchase } from '../types/database.types';
import { supabase } from '../lib/supabase';

/** Returns all course IDs the user has purchased (from Supabase). */
export async function fetchOwnedCourseIds(userId: string): Promise<string[]> {
  const result = await supabase
    .from('purchases')
    .select('course_id')
    .eq('user_id', userId);

  if (result.error) throw result.error;
  const rows = result.data as Pick<DbPurchase, 'course_id'>[] | null;
  return (rows ?? []).map((r) => r.course_id);
}

/**
 * Records a purchase in Supabase.
 * Safe to call multiple times for the same (user, course) pair —
 * duplicate inserts are silently ignored (error code 23505).
 */
export async function recordPurchase(
  userId:       string,
  courseId:     string,
  revenuecatId: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('purchases') as any)
    .insert({ user_id: userId, course_id: courseId, revenuecat_id: revenuecatId });

  // 23505 = unique_violation (already purchased) — not an error for us
  if (error && error.code !== '23505') throw error;
}
