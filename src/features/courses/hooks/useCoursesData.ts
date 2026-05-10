import { useQuery } from '@tanstack/react-query';
import { CourseItem } from '../../../data/courses.mock';
import { CoursesFilter } from '../../../services/courses.service';
import { fetchCourseById, fetchCourses } from '../services/courses.service';

export function useCourses(filter?: CoursesFilter) {
  return useQuery<CourseItem[]>({
    queryKey: ['courses', filter],
    queryFn:  () => fetchCourses(filter),
  });
}

export function useCourseById(id: string) {
  return useQuery<CourseItem | null>({
    queryKey: ['courses', id],
    queryFn:  () => fetchCourseById(id),
    enabled:  !!id,
  });
}
