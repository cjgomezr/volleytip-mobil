import { supabase } from '../../../lib/supabase';
import { MOCK_COURSES, CourseItem, TrainingProgramCourse, VideoCollectionCourse, ProgramWeek, DayExercise } from '../../../data/courses.mock';
import type { DbCourse, DbCourseModule, DbModuleItem } from '../../../types/database.types';
import { CoursesFilter } from '../../../services/courses.service';

function dbCourseToBase(c: DbCourse) {
  return {
    id:            c.id,
    title:         c.title,
    description:   c.description ?? '',
    thumbnail_url: c.thumbnail_url,
    level:         c.level,
    is_free:       c.is_free,
    price_usd:     c.price ?? undefined,
    tags:          c.tags ?? [],
  };
}

export async function fetchCourses(filter?: CoursesFilter): Promise<CourseItem[]> {
  let query = supabase.from('courses').select('*').order('created_at', { ascending: false });

  if (filter?.type)  query = query.eq('type', filter.type) as typeof query;
  if (filter?.level) query = query.eq('level', filter.level) as typeof query;
  if (filter?.free !== undefined) query = query.eq('is_free', filter.free) as typeof query;

  const result = await query;
  const rows = result.data as DbCourse[] | null;

  if (!rows?.length) return applyLocalFilter(MOCK_COURSES, filter);

  let items: CourseItem[] = rows.map((c) => {
    const base = dbCourseToBase(c);
    if (c.type === 'training_program') {
      return {
        ...base,
        type:                          'training_program',
        total_weeks:                   0,
        sessions_per_week:             c.sessions_per_week ?? 3,
        estimated_minutes_per_session: c.estimated_minutes_per_session ?? 45,
        weeks:                         [],
      } as TrainingProgramCourse;
    }
    return { ...base, type: 'video_collection', video_ids: [] } as VideoCollectionCourse;
  });

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    items = items.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    );
  }
  return items;
}

export async function fetchCourseById(id: string): Promise<CourseItem | null> {
  // Mock has full structure (weeks/exercises) — prefer it
  const mock = MOCK_COURSES.find((c) => c.id === id);
  if (mock) return mock;

  // Not in mock → build from Supabase
  const [courseRes, modulesRes] = await Promise.all([
    supabase.from('courses').select('*').eq('id', id).single(),
    supabase.from('course_modules').select('*').eq('course_id', id).order('sort_order'),
  ]);

  const c = courseRes.data as DbCourse | null;
  if (!c) return null;

  const modules = (modulesRes.data as DbCourseModule[] | null) ?? [];

  if (modules.length === 0) {
    const base = dbCourseToBase(c);
    if (c.type === 'training_program') {
      return { ...base, type: 'training_program', total_weeks: 0, sessions_per_week: c.sessions_per_week ?? 3, estimated_minutes_per_session: c.estimated_minutes_per_session ?? 45, weeks: [] };
    }
    return { ...base, type: 'video_collection', video_ids: [] };
  }

  const moduleIds = modules.map((m) => m.id);
  const itemsRes = await supabase
    .from('module_items')
    .select('*')
    .in('module_id', moduleIds)
    .order('sort_order');
  const items = (itemsRes.data as DbModuleItem[] | null) ?? [];

  const base = dbCourseToBase(c);

  if (c.type === 'video_collection') {
    const video_ids = items.map((i) => i.video_id);
    return { ...base, type: 'video_collection', video_ids };
  }

  // Build training_program weeks/days
  const weekMap = new Map<number, Map<number, { module: DbCourseModule; items: DbModuleItem[] }>>();
  for (const mod of modules) {
    const wk = mod.week_number ?? 1;
    const dy = mod.day_number ?? 1;
    if (!weekMap.has(wk)) weekMap.set(wk, new Map());
    weekMap.get(wk)!.set(dy, { module: mod, items: items.filter((i) => i.module_id === mod.id) });
  }

  const weeks: ProgramWeek[] = Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([week_number, dayMap]) => ({
      week_number,
      days: Array.from(dayMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([day_number, { module, items: dayItems }]) => ({
          id:                `${module.id}`,
          day_number,
          title:             module.title,
          is_rest:           dayItems.length === 0,
          estimated_minutes: c.estimated_minutes_per_session ?? 45,
          exercises:         dayItems.map((item): DayExercise => ({
            id:               item.id,
            exercise_name:    item.exercise_name ?? item.video_id,
            sets:             item.sets ?? 3,
            reps:             item.reps ?? 10,
            duration_seconds: item.duration_seconds ?? 0,
            rest_seconds:     item.rest_seconds ?? 60,
            video_id:         item.video_id,
            note:             item.note ?? undefined,
          })),
        })),
    }));

  return {
    ...base,
    type:                          'training_program',
    total_weeks:                   weeks.length,
    sessions_per_week:             c.sessions_per_week ?? 3,
    estimated_minutes_per_session: c.estimated_minutes_per_session ?? 45,
    weeks,
  };
}

function applyLocalFilter(courses: CourseItem[], filter?: CoursesFilter) {
  let result = courses;
  if (filter?.type)   result = result.filter((c) => c.type === filter.type);
  if (filter?.level)  result = result.filter((c) => c.level === filter.level);
  if (filter?.free !== undefined) result = result.filter((c) => c.is_free === filter.free);
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    );
  }
  return result;
}
