import { useQuery } from '@tanstack/react-query';
import { Routine } from '../../../data/routines.mock';
import { RoutinesSortKey } from '../../../services/routines.service';
import { fetchCommunityRoutines, fetchRoutineById } from '../services/routines.service';

export function useCommunityRoutines(sort: RoutinesSortKey = 'mostLiked') {
  return useQuery<Routine[]>({
    queryKey: ['routines', 'community', sort],
    queryFn:  () => fetchCommunityRoutines(sort),
  });
}

export function useRoutineById(id: string) {
  return useQuery<Routine | null>({
    queryKey: ['routines', id],
    queryFn:  () => fetchRoutineById(id),
    enabled:  !!id,
  });
}
