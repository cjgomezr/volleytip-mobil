// ── Enums ──────────────────────────────────────────────────

export type ContentLevel = 'basico' | 'intermedio' | 'avanzado';
export type CourseType   = 'video_collection' | 'training_program';

// ── Database schema ─────────────────────────────────────────

export type Database = {
  public: {
    Tables: {

      users: {
        Row: {
          id:         string;
          email:      string;
          name:       string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id:          string;
          email:       string;
          name?:       string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          name?:       string;
          avatar_url?: string | null;
        };
      };

      categories: {
        Row: {
          id:   string;
          name: string;
          slug: string;
          icon: string | null;
        };
        Insert: {
          id?:  string;
          name: string;
          slug: string;
          icon?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          icon?: string | null;
        };
      };

      videos: {
        Row: {
          id:               string;
          title:            string;
          description:      string | null;
          video_url:        string;
          thumbnail_url:    string | null;
          category_id:      string | null;
          level:            ContentLevel;
          duration_seconds: number;
          created_at:       string;
        };
        Insert: {
          id?:              string;
          title:            string;
          description?:     string | null;
          video_url:        string;
          thumbnail_url?:   string | null;
          category_id?:     string | null;
          level?:           ContentLevel;
          duration_seconds?: number;
          created_at?:      string;
        };
        Update: {
          title?:           string;
          description?:     string | null;
          video_url?:       string;
          thumbnail_url?:   string | null;
          category_id?:     string | null;
          level?:           ContentLevel;
          duration_seconds?: number;
        };
      };

      exercises: {
        Row: {
          id:           string;
          video_id:     string;
          name:         string;
          muscle_group: string | null;
          category:     string | null;
        };
        Insert: {
          id?:           string;
          video_id:      string;
          name:          string;
          muscle_group?: string | null;
          category?:     string | null;
        };
        Update: {
          name?:         string;
          muscle_group?: string | null;
          category?:     string | null;
        };
      };

      courses: {
        Row: {
          id:            string;
          title:         string;
          description:   string | null;
          type:          CourseType;
          price:         number | null;
          is_free:       boolean;
          level:         ContentLevel;
          thumbnail_url: string | null;
          created_at:    string;
        };
        Insert: {
          id?:            string;
          title:          string;
          description?:   string | null;
          type?:          CourseType;
          price?:         number | null;
          is_free?:       boolean;
          level?:         ContentLevel;
          thumbnail_url?: string | null;
          created_at?:    string;
        };
        Update: {
          title?:         string;
          description?:   string | null;
          type?:          CourseType;
          price?:         number | null;
          is_free?:       boolean;
          level?:         ContentLevel;
          thumbnail_url?: string | null;
        };
      };

      course_modules: {
        Row: {
          id:          string;
          course_id:   string;
          title:       string;
          week_number: number | null;
          day_number:  number | null;
          sort_order:  number;
        };
        Insert: {
          id?:          string;
          course_id:    string;
          title:        string;
          week_number?: number | null;
          day_number?:  number | null;
          sort_order?:  number;
        };
        Update: {
          title?:       string;
          week_number?: number | null;
          day_number?:  number | null;
          sort_order?:  number;
        };
      };

      module_items: {
        Row: {
          id:           string;
          module_id:    string;
          video_id:     string;
          sets:         number | null;
          reps:         number | null;
          rest_seconds: number | null;
          sort_order:   number;
        };
        Insert: {
          id?:           string;
          module_id:     string;
          video_id:      string;
          sets?:         number | null;
          reps?:         number | null;
          rest_seconds?: number | null;
          sort_order?:   number;
        };
        Update: {
          sets?:         number | null;
          reps?:         number | null;
          rest_seconds?: number | null;
          sort_order?:   number;
        };
      };

      purchases: {
        Row: {
          id:            string;
          user_id:       string;
          course_id:     string;
          revenuecat_id: string | null;
          purchased_at:  string;
        };
        Insert: {
          id?:            string;
          user_id:        string;
          course_id:      string;
          revenuecat_id?: string | null;
          purchased_at?:  string;
        };
        Update: {
          revenuecat_id?: string | null;
        };
      };

      user_progress: {
        Row: {
          id:           string;
          user_id:      string;
          module_id:    string;
          completed:    boolean;
          completed_at: string | null;
        };
        Insert: {
          id?:           string;
          user_id:       string;
          module_id:     string;
          completed?:    boolean;
          completed_at?: string | null;
        };
        Update: {
          completed?:    boolean;
          completed_at?: string | null;
        };
      };

      video_views: {
        Row: {
          id:              string;
          user_id:         string;
          video_id:        string;
          watched_seconds: number;
          last_watched_at: string;
        };
        Insert: {
          id?:              string;
          user_id:          string;
          video_id:         string;
          watched_seconds?: number;
          last_watched_at?: string;
        };
        Update: {
          watched_seconds?: number;
          last_watched_at?: string;
        };
      };

      routines: {
        Row: {
          id:          string;
          user_id:     string;
          name:        string;
          is_public:   boolean;
          likes_count: number;
          created_at:  string;
        };
        Insert: {
          id?:         string;
          user_id:     string;
          name:        string;
          is_public?:  boolean;
          likes_count?: number;
          created_at?: string;
        };
        Update: {
          name?:      string;
          is_public?: boolean;
        };
      };

      routine_exercises: {
        Row: {
          id:          string;
          routine_id:  string;
          exercise_id: string;
          sets:        number;
          reps:        number;
          sort_order:  number;
        };
        Insert: {
          id?:          string;
          routine_id:   string;
          exercise_id:  string;
          sets?:        number;
          reps?:        number;
          sort_order?:  number;
        };
        Update: {
          sets?:       number;
          reps?:       number;
          sort_order?: number;
        };
      };

      routine_likes: {
        Row: {
          id:         string;
          user_id:    string;
          routine_id: string;
          liked_at:   string;
        };
        Insert: {
          id?:         string;
          user_id:     string;
          routine_id:  string;
          liked_at?:   string;
        };
        Update: never;
      };

      routine_saves: {
        Row: {
          id:         string;
          user_id:    string;
          routine_id: string;
          saved_at:   string;
        };
        Insert: {
          id?:         string;
          user_id:     string;
          routine_id:  string;
          saved_at?:   string;
        };
        Update: never;
      };

    };
    Enums: {
      content_level: ContentLevel;
      course_type:   CourseType;
    };
    Functions: Record<string, never>;
    Views:     Record<string, never>;
  };
};

// ── Helpers para acceso rápido ──────────────────────────────

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

// ── Tipos de conveniencia por entidad ──────────────────────

export type DbUser            = Tables<'users'>;
export type DbCategory        = Tables<'categories'>;
export type DbVideo           = Tables<'videos'>;
export type DbExercise        = Tables<'exercises'>;
export type DbCourse          = Tables<'courses'>;
export type DbCourseModule    = Tables<'course_modules'>;
export type DbModuleItem      = Tables<'module_items'>;
export type DbPurchase        = Tables<'purchases'>;
export type DbUserProgress    = Tables<'user_progress'>;
export type DbVideoView       = Tables<'video_views'>;
export type DbRoutine         = Tables<'routines'>;
export type DbRoutineExercise = Tables<'routine_exercises'>;
export type DbRoutineLike     = Tables<'routine_likes'>;
export type DbRoutineSave     = Tables<'routine_saves'>;
