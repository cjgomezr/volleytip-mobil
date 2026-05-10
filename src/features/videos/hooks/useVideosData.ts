import { useQuery } from '@tanstack/react-query';
import { VideoItem } from '../../../data/videos.mock';
import { fetchVideoById, fetchVideos, fetchRelatedVideos } from '../services/videos.service';

export function useVideos(filter?: { categorySlug?: string; level?: string; search?: string }) {
  return useQuery<VideoItem[]>({
    queryKey: ['videos', filter],
    queryFn:  () => fetchVideos(filter),
  });
}

export function useVideoById(id: string) {
  return useQuery<VideoItem | null>({
    queryKey: ['videos', id],
    queryFn:  () => fetchVideoById(id),
    enabled:  !!id,
  });
}

export function useRelatedVideos(video: VideoItem | null | undefined) {
  return useQuery<VideoItem[]>({
    queryKey: ['videos', 'related', video?.id],
    queryFn:  () => fetchRelatedVideos(video!),
    enabled:  !!video,
  });
}
