import { supabase } from '../../../lib/supabase';
import { MOCK_VIDEOS, VideoItem } from '../../../data/videos.mock';
import type { DbVideo } from '../../../types/database.types';

function toVideoItem(v: DbVideo): VideoItem {
  return {
    id:               v.id,
    title:            v.title,
    description:      v.description ?? '',
    video_url:        v.video_url,
    video_key:        v.video_key ?? null,
    thumbnail_url:    v.thumbnail_url,
    thumbnail_key:    v.thumbnail_key ?? null,
    category_id:      v.category_id ?? '',
    category_slug:    v.category_slug ?? v.category_id ?? '',
    category_name:    v.category_slug ?? v.category_id ?? '',
    level:            v.level,
    duration_seconds: v.duration_seconds,
    is_free:          v.is_free ?? true,
    key_points:       v.key_points ?? [],
  };
}

export async function fetchVideos(filter?: {
  categorySlug?: string;
  level?: string;
  search?: string;
}): Promise<VideoItem[]> {
  let query = supabase.from('videos').select('*').order('created_at', { ascending: false });

  if (filter?.categorySlug) query = query.eq('category_slug', filter.categorySlug) as typeof query;
  if (filter?.level)        query = query.eq('level', filter.level) as typeof query;

  const result = await query;
  const rows = result.data as DbVideo[] | null;

  if (!rows?.length) return applyLocalFilter(MOCK_VIDEOS, filter);

  let items = rows.map(toVideoItem);
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    items = items.filter((v) => v.title.toLowerCase().includes(q));
  }
  return items;
}

export async function fetchVideoById(id: string): Promise<VideoItem | null> {
  const mock = MOCK_VIDEOS.find((v) => v.id === id);
  if (mock) return mock;

  const result = await supabase.from('videos').select('*').eq('id', id).single();
  const row = result.data as DbVideo | null;
  return row ? toVideoItem(row) : null;
}

export async function fetchRelatedVideos(video: VideoItem, limit = 4): Promise<VideoItem[]> {
  const result = await supabase
    .from('videos')
    .select('*')
    .eq('category_slug', video.category_slug)
    .neq('id', video.id)
    .limit(limit);

  const rows = result.data as DbVideo[] | null;
  if (rows?.length) return rows.map(toVideoItem);

  return MOCK_VIDEOS
    .filter((v) => v.id !== video.id && v.category_slug === video.category_slug)
    .slice(0, limit);
}

function applyLocalFilter(videos: VideoItem[], filter?: { categorySlug?: string; level?: string; search?: string }) {
  let result = videos;
  if (filter?.categorySlug) result = result.filter((v) => v.category_slug === filter.categorySlug);
  if (filter?.level)        result = result.filter((v) => v.level === filter.level);
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    result = result.filter((v) => v.title.toLowerCase().includes(q));
  }
  return result;
}
