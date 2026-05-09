import { ContentLevel, CourseType } from '../types/database.types';
import { CourseItem, MOCK_COURSES, ProgramDay, TrainingProgramCourse } from '../data/courses.mock';
import { MOCK_VIDEOS, VideoItem } from '../data/videos.mock';

export interface CoursesFilter {
  type?:   CourseType;
  level?:  ContentLevel;
  search?: string;
  free?:   boolean;
}

export function getAllCourses(filter?: CoursesFilter): CourseItem[] {
  let result = MOCK_COURSES;

  if (filter?.type) {
    result = result.filter((c) => c.type === filter.type);
  }
  if (filter?.level) {
    result = result.filter((c) => c.level === filter.level);
  }
  if (filter?.free !== undefined) {
    result = result.filter((c) => c.is_free === filter.free);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return result;
}

export function getCourseById(id: string): CourseItem | null {
  return MOCK_COURSES.find((c) => c.id === id) ?? null;
}

export function getWorkoutDay(dayId: string): { day: ProgramDay; course: TrainingProgramCourse } | null {
  for (const course of MOCK_COURSES) {
    if (course.type !== 'training_program') continue;
    for (const week of course.weeks) {
      const day = week.days.find((d) => d.id === dayId);
      if (day) return { day, course };
    }
  }
  return null;
}

export function getCourseVideos(courseId: string): VideoItem[] {
  const course = getCourseById(courseId);
  if (!course || course.type !== 'video_collection') return [];
  return course.video_ids
    .map((vid) => MOCK_VIDEOS.find((v) => v.id === vid))
    .filter((v): v is VideoItem => v !== undefined);
}
