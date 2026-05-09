import { ContentLevel, CourseType } from '../../../types/database.types';

export interface HomeFeaturedVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  level: ContentLevel;
  category_name: string;
}

export interface HomeCoursePurchased {
  id: string;
  title: string;
  thumbnail_url: string | null;
  type: CourseType;
  level: ContentLevel;
}

export interface HomeFeaturedCourse {
  id: string;
  title: string;
  thumbnail_url: string | null;
  type: CourseType;
  level: ContentLevel;
  is_free: boolean;
  price_usd: number | null;
}

export interface HomeCommunityRoutine {
  id: string;
  title: string;
  likes_count: number;
  author_name: string | null;
  estimated_minutes: number;
  level: ContentLevel | null;
}
