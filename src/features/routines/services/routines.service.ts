import { supabase } from '../../../lib/supabase';
import { MOCK_ROUTINES, Routine, RoutineExercise } from '../../../data/routines.mock';
import type { ContentLevel } from '../../../types/database.types';

interface DbRoutineRow {
  id: string; user_id: string; name: string; description: string;
  is_public: boolean; likes_count: number; estimated_minutes: number;
  level: string; tags: string[]; author_name: string; created_at: string;
}

interface DbRoutineExRow {
  id: string; routine_id: string; exercise_id: string; exercise_name: string;
  sets: number; reps: number; duration_seconds: number; rest_seconds: number;
  note: string | null; sort_order: number;
}

function toRoutine(r: DbRoutineRow, exercises: RoutineExercise[]): Routine {
  return {
    id:                r.id,
    title:             r.name,
    description:       r.description ?? '',
    author_id:         r.user_id,
    author_name:       r.author_name || 'Atleta',
    author_avatar:     null,
    exercises,
    estimated_minutes: r.estimated_minutes ?? 0,
    likes_count:       r.likes_count ?? 0,
    is_saved:          false,
    is_mine:           false,
    level:             (r.level as ContentLevel) ?? 'basico',
    tags:              r.tags ?? [],
    created_at:        r.created_at,
  };
}

export async function fetchCommunityRoutines(sort: 'mostLiked' | 'newest' = 'mostLiked'): Promise<Routine[]> {
  const order = sort === 'mostLiked' ? 'likes_count' : 'created_at';
  const result = await supabase
    .from('routines')
    .select('*')
    .eq('is_public', true)
    .order(order, { ascending: false })
    .limit(20);

  const rows = result.data as DbRoutineRow[] | null;
  if (!rows?.length) return MOCK_ROUTINES.filter((r) => !r.is_mine);

  return rows.map((r) => toRoutine(r, []));
}

export async function fetchRoutineById(id: string): Promise<Routine | null> {
  const mock = MOCK_ROUTINES.find((r) => r.id === id);
  if (mock) return mock;

  const [rRes, exRes] = await Promise.all([
    supabase.from('routines').select('*').eq('id', id).single(),
    supabase.from('routine_exercises').select('*').eq('routine_id', id).order('sort_order'),
  ]);

  const r = rRes.data as DbRoutineRow | null;
  if (!r) return null;

  const exRows = (exRes.data as DbRoutineExRow[] | null) ?? [];
  const exercises: RoutineExercise[] = exRows.map((e) => ({
    id:               e.id,
    exercise_name:    e.exercise_name || e.exercise_id,
    sets:             e.sets ?? 3,
    reps:             e.reps ?? 10,
    duration_seconds: e.duration_seconds ?? 0,
    rest_seconds:     e.rest_seconds ?? 60,
    video_id:         null,
    note:             e.note ?? undefined,
  }));

  return toRoutine(r, exercises);
}
