import { MOCK_VIDEOS, VideoItem } from '../data/videos.mock';

export interface VideoFilter {
  categorySlug?: string;
  level?:        string;
  search?:       string;
}

export function getVideos(filter: VideoFilter = {}): VideoItem[] {
  let results = MOCK_VIDEOS;

  if (filter.categorySlug) {
    results = results.filter((v) => v.category_slug === filter.categorySlug);
  }
  if (filter.level) {
    results = results.filter((v) => v.level === filter.level);
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    results = results.filter((v) => v.title.toLowerCase().includes(q));
  }

  return results;
}

export function getVideoById(id: string): VideoItem | undefined {
  return MOCK_VIDEOS.find((v) => v.id === id);
}

export function getRelatedVideos(video: VideoItem, limit = 4): VideoItem[] {
  return MOCK_VIDEOS
    .filter((v) => v.id !== video.id && v.category_slug === video.category_slug)
    .slice(0, limit);
}

export function getCategories(): Array<{ slug: string; nameKey: string }> {
  return [
    { slug: 'saltabilidad', nameKey: 'videos.categories.saltabilidad' },
    { slug: 'fuerza',       nameKey: 'videos.categories.fuerza' },
    { slug: 'potencia',     nameKey: 'videos.categories.potencia' },
    { slug: 'elasticidad',  nameKey: 'videos.categories.elasticidad' },
    { slug: 'tecnica',      nameKey: 'videos.categories.tecnica' },
  ];
}
