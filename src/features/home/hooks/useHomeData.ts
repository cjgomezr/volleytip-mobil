import { useQuery } from '@tanstack/react-query';
import {
  fetchCommunityRoutines,
  fetchFeaturedCourses,
  fetchFeaturedVideos,
  fetchPurchasedCourses,
} from '../services/home.service';

export function useFeaturedVideos() {
  return useQuery({
    queryKey: ['home', 'featured-videos'],
    queryFn: fetchFeaturedVideos,
  });
}

export function useFeaturedCourses() {
  return useQuery({
    queryKey: ['home', 'featured-courses'],
    queryFn: fetchFeaturedCourses,
  });
}

export function usePurchasedCourses(ownedCourseIds: Set<string>) {
  const ids = Array.from(ownedCourseIds);
  return useQuery({
    queryKey: ['home', 'purchased-courses', ids],
    queryFn: () => fetchPurchasedCourses(ids),
    enabled: ids.length > 0,
  });
}

export function useCommunityRoutines() {
  return useQuery({
    queryKey: ['home', 'community-routines'],
    queryFn: fetchCommunityRoutines,
  });
}
