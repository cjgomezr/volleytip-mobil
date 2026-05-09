import { ContentLevel } from '../types/database.types';
import { MOCK_ROUTINES, Routine } from '../data/routines.mock';

export interface RoutinesFilter {
  level?:   ContentLevel;
  search?:  string;
  savedOnly?: boolean;
  mineOnly?:  boolean;
}

export type RoutinesSortKey = 'mostLiked' | 'newest';

export function getCommunityRoutines(
  filter?: RoutinesFilter,
  sort: RoutinesSortKey = 'mostLiked',
): Routine[] {
  let result = MOCK_ROUTINES.filter((r) => !r.is_mine);

  if (filter?.level) {
    result = result.filter((r) => r.level === filter.level);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return sort === 'mostLiked'
    ? result.sort((a, b) => b.likes_count - a.likes_count)
    : result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getSavedRoutines(): Routine[] {
  return MOCK_ROUTINES.filter((r) => r.is_saved);
}

export function getMyRoutines(): Routine[] {
  return MOCK_ROUTINES.filter((r) => r.is_mine);
}

export function getRoutineById(id: string): Routine | null {
  return MOCK_ROUTINES.find((r) => r.id === id) ?? null;
}
