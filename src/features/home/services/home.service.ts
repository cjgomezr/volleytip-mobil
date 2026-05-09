import { supabase } from '../../../lib/supabase';
import { MOCK_VIDEOS } from '../../../data/videos.mock';
import { MOCK_COURSES } from '../../../data/courses.mock';
import { MOCK_ROUTINES } from '../../../data/routines.mock';
import type { DbCourse, DbRoutine, DbVideo } from '../../../types/database.types';
import type {
  HomeCommunityRoutine,
  HomeCoursePurchased,
  HomeFeaturedCourse,
  HomeFeaturedVideo,
} from '../types';

// Supabase TS inference returns `never` for data with the current Database type
// definition. The queries work correctly at runtime — we cast to the known Row type.

export async function fetchFeaturedVideos(): Promise<HomeFeaturedVideo[]> {
  const result = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  const rows = result.data as DbVideo[] | null;

  if (rows?.length) {
    return rows.map((v) => ({
      id: v.id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      duration_seconds: v.duration_seconds,
      level: v.level,
      category_name: v.category_id ?? '',
    }));
  }

  return MOCK_VIDEOS.slice(0, 6).map((v) => ({
    id: v.id,
    title: v.title,
    thumbnail_url: v.thumbnail_url,
    duration_seconds: v.duration_seconds,
    level: v.level,
    category_name: v.category_name,
  }));
}

export async function fetchPurchasedCourses(
  courseIds: string[],
): Promise<HomeCoursePurchased[]> {
  if (!courseIds.length) return [];

  const result = await supabase
    .from('courses')
    .select('*')
    .in('id', courseIds)
    .limit(3);

  const rows = result.data as DbCourse[] | null;

  if (rows?.length) {
    return rows.map((c) => ({
      id: c.id,
      title: c.title,
      thumbnail_url: c.thumbnail_url,
      type: c.type,
      level: c.level,
    }));
  }

  return MOCK_COURSES.filter((c) => courseIds.includes(c.id))
    .slice(0, 3)
    .map((c) => ({
      id: c.id,
      title: c.title,
      thumbnail_url: c.thumbnail_url,
      type: c.type,
      level: c.level,
    }));
}

export async function fetchFeaturedCourses(): Promise<HomeFeaturedCourse[]> {
  const result = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  const rows = result.data as DbCourse[] | null;

  if (rows?.length) {
    return rows.map((c) => ({
      id: c.id,
      title: c.title,
      thumbnail_url: c.thumbnail_url,
      type: c.type,
      level: c.level,
      is_free: c.is_free,
      price_usd: c.price,
    }));
  }

  return MOCK_COURSES.slice(0, 3).map((c) => ({
    id: c.id,
    title: c.title,
    thumbnail_url: c.thumbnail_url,
    type: c.type,
    level: c.level,
    is_free: c.is_free,
    price_usd: c.price_usd ?? null,
  }));
}

export async function fetchCommunityRoutines(): Promise<HomeCommunityRoutine[]> {
  const result = await supabase
    .from('routines')
    .select('*')
    .eq('is_public', true)
    .order('likes_count', { ascending: false })
    .limit(4);

  const rows = result.data as DbRoutine[] | null;

  if (rows?.length) {
    return rows.map((r) => ({
      id: r.id,
      title: r.name,
      likes_count: r.likes_count,
      author_name: null,
      estimated_minutes: 0,
      level: null,
    }));
  }

  return MOCK_ROUTINES.filter((r) => !r.is_mine)
    .slice(0, 4)
    .map((r) => ({
      id: r.id,
      title: r.title,
      likes_count: r.likes_count,
      author_name: r.author_name,
      estimated_minutes: r.estimated_minutes,
      level: r.level,
    }));
}
