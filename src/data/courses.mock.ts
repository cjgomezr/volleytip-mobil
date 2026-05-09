import { ContentLevel, CourseType } from '../types/database.types';

// ── Exercise in a day ──────────────────────────────────────────────────────

export interface DayExercise {
  id:               string;
  exercise_name:    string;
  sets:             number;
  reps:             number;
  duration_seconds: number; // 0 = rep-based; >0 = duration-based (reps ignored)
  rest_seconds:     number;
  video_id:         string | null;
  note?:            string;
}

// ── Day status ────────────────────────────────────────────────────────────

export type DayStatus = 'done' | 'today' | 'pending' | 'rest' | 'locked' | 'missed';

// ── Program day / week ────────────────────────────────────────────────────

export interface ProgramDay {
  id:                 string; // used as workout route param → app/workout/[id]
  day_number:         number;
  title:              string;
  is_rest:            boolean;
  exercises:          DayExercise[];
  estimated_minutes:  number;
}

export interface ProgramWeek {
  week_number: number;
  days:        ProgramDay[];
}

// ── Course variants ───────────────────────────────────────────────────────

interface CourseBase {
  id:            string;
  title:         string;
  description:   string;
  thumbnail_url: string | null;
  level:         ContentLevel;
  is_free:       boolean;
  price_usd?:    number;
  tags:          string[];
}

export interface TrainingProgramCourse extends CourseBase {
  type:                          Extract<CourseType, 'training_program'>;
  total_weeks:                   number;
  sessions_per_week:             number;
  estimated_minutes_per_session: number;
  weeks:                         ProgramWeek[];
}

export interface VideoCollectionCourse extends CourseBase {
  type:     Extract<CourseType, 'video_collection'>;
  video_ids: string[];
}

export type CourseItem = TrainingProgramCourse | VideoCollectionCourse;

// ── Mock exercises pool ───────────────────────────────────────────────────

const JUMP_SQUATS: DayExercise = {
  id: 'ex-jumpsquats',
  exercise_name: 'Sentadillas con salto',
  sets: 4, reps: 10, duration_seconds: 0, rest_seconds: 60,
  video_id: 'v1',
  note: 'Aterrizá suave, rodillas alineadas con los pies.',
};

const BOX_JUMP: DayExercise = {
  id: 'ex-boxjump',
  exercise_name: 'Box Jump',
  sets: 3, reps: 8, duration_seconds: 0, rest_seconds: 90,
  video_id: 'v2',
  note: 'Bajá del cajón controlado, no saltes hacia atrás.',
};

const CALF_RAISES: DayExercise = {
  id: 'ex-calfraises',
  exercise_name: 'Elevaciones de pantorrilla',
  sets: 3, reps: 15, duration_seconds: 0, rest_seconds: 45,
  video_id: null,
};

const DEPTH_JUMP: DayExercise = {
  id: 'ex-depthjump',
  exercise_name: 'Depth Jump',
  sets: 3, reps: 6, duration_seconds: 0, rest_seconds: 120,
  video_id: 'v3',
  note: 'Mínimo tiempo de contacto con el suelo. Explosividad.',
};

const BROAD_JUMP: DayExercise = {
  id: 'ex-broadjump',
  exercise_name: 'Salto en largo parado',
  sets: 3, reps: 8, duration_seconds: 0, rest_seconds: 60,
  video_id: null,
};

const HIP_HINGE: DayExercise = {
  id: 'ex-hiphinge',
  exercise_name: 'Hip Hinge con banda',
  sets: 3, reps: 12, duration_seconds: 0, rest_seconds: 45,
  video_id: null,
};

const WALL_SIT: DayExercise = {
  id: 'ex-wallsit',
  exercise_name: 'Wall Sit',
  sets: 3, reps: 0, duration_seconds: 40, rest_seconds: 45,
  video_id: null,
};

const SINGLE_LEG_JUMP: DayExercise = {
  id: 'ex-singlelegjump',
  exercise_name: 'Salto a una pierna',
  sets: 3, reps: 8, duration_seconds: 0, rest_seconds: 75,
  video_id: 'v2',
  note: 'Alternár piernas entre series.',
};

const BROAD_JUMP_TRIPLE: DayExercise = {
  id: 'ex-triplejump',
  exercise_name: 'Triple salto en largo',
  sets: 3, reps: 5, duration_seconds: 0, rest_seconds: 90,
  video_id: null,
};

const NORDIC_CURL: DayExercise = {
  id: 'ex-nordic',
  exercise_name: 'Curl nórdico',
  sets: 3, reps: 6, duration_seconds: 0, rest_seconds: 90,
  video_id: null,
  note: 'Controlá la bajada, es la fase más importante.',
};

// ── Training program weeks ────────────────────────────────────────────────

const WEEK_1: ProgramWeek = {
  week_number: 1,
  days: [
    {
      id: '6weeks_w1_d1',
      day_number: 1,
      title: 'Potencia base',
      is_rest: false,
      estimated_minutes: 35,
      exercises: [JUMP_SQUATS, CALF_RAISES, HIP_HINGE, WALL_SIT],
    },
    {
      id: '6weeks_w1_d2',
      day_number: 2,
      title: 'Descanso activo',
      is_rest: true,
      estimated_minutes: 0,
      exercises: [],
    },
    {
      id: '6weeks_w1_d3',
      day_number: 3,
      title: 'Salto horizontal',
      is_rest: false,
      estimated_minutes: 30,
      exercises: [BROAD_JUMP, SINGLE_LEG_JUMP, CALF_RAISES],
    },
    {
      id: '6weeks_w1_d4',
      day_number: 4,
      title: 'Descanso',
      is_rest: true,
      estimated_minutes: 0,
      exercises: [],
    },
    {
      id: '6weeks_w1_d5',
      day_number: 5,
      title: 'Pliometría introductoria',
      is_rest: false,
      estimated_minutes: 40,
      exercises: [BOX_JUMP, DEPTH_JUMP, NORDIC_CURL],
    },
  ],
};

const WEEK_2: ProgramWeek = {
  week_number: 2,
  days: [
    {
      id: '6weeks_w2_d1',
      day_number: 1,
      title: 'Fuerza + potencia',
      is_rest: false,
      estimated_minutes: 40,
      exercises: [JUMP_SQUATS, BOX_JUMP, HIP_HINGE],
    },
    {
      id: '6weeks_w2_d2',
      day_number: 2,
      title: 'Descanso activo',
      is_rest: true,
      estimated_minutes: 0,
      exercises: [],
    },
    {
      id: '6weeks_w2_d3',
      day_number: 3,
      title: 'Reactividad',
      is_rest: false,
      estimated_minutes: 35,
      exercises: [DEPTH_JUMP, BROAD_JUMP_TRIPLE, CALF_RAISES],
    },
    {
      id: '6weeks_w2_d4',
      day_number: 4,
      title: 'Descanso',
      is_rest: true,
      estimated_minutes: 0,
      exercises: [],
    },
    {
      id: '6weeks_w2_d5',
      day_number: 5,
      title: 'Combinado salto',
      is_rest: false,
      estimated_minutes: 45,
      exercises: [JUMP_SQUATS, SINGLE_LEG_JUMP, NORDIC_CURL, WALL_SIT],
    },
  ],
};

// Weeks 3-6 as condensed placeholders (same structure, harder progression)
const WEEK_3: ProgramWeek = {
  week_number: 3,
  days: [
    { id: '6weeks_w3_d1', day_number: 1, title: 'Potencia avanzada', is_rest: false, estimated_minutes: 45, exercises: [JUMP_SQUATS, DEPTH_JUMP, HIP_HINGE] },
    { id: '6weeks_w3_d2', day_number: 2, title: 'Descanso activo', is_rest: true, estimated_minutes: 0, exercises: [] },
    { id: '6weeks_w3_d3', day_number: 3, title: 'Pliometría intensiva', is_rest: false, estimated_minutes: 40, exercises: [BOX_JUMP, BROAD_JUMP_TRIPLE, NORDIC_CURL] },
    { id: '6weeks_w3_d4', day_number: 4, title: 'Descanso', is_rest: true, estimated_minutes: 0, exercises: [] },
    { id: '6weeks_w3_d5', day_number: 5, title: 'Full body salto', is_rest: false, estimated_minutes: 50, exercises: [JUMP_SQUATS, BOX_JUMP, SINGLE_LEG_JUMP, WALL_SIT] },
  ],
};

const WEEK_4: ProgramWeek = {
  week_number: 4,
  days: [
    { id: '6weeks_w4_d1', day_number: 1, title: 'Descarga activa', is_rest: false, estimated_minutes: 30, exercises: [CALF_RAISES, HIP_HINGE, WALL_SIT] },
    { id: '6weeks_w4_d2', day_number: 2, title: 'Descanso', is_rest: true, estimated_minutes: 0, exercises: [] },
    { id: '6weeks_w4_d3', day_number: 3, title: 'Activación', is_rest: false, estimated_minutes: 30, exercises: [BROAD_JUMP, SINGLE_LEG_JUMP] },
    { id: '6weeks_w4_d4', day_number: 4, title: 'Descanso', is_rest: true, estimated_minutes: 0, exercises: [] },
    { id: '6weeks_w4_d5', day_number: 5, title: 'Recuperación técnica', is_rest: false, estimated_minutes: 35, exercises: [JUMP_SQUATS, CALF_RAISES, HIP_HINGE] },
  ],
};

const WEEK_5: ProgramWeek = {
  week_number: 5,
  days: [
    { id: '6weeks_w5_d1', day_number: 1, title: 'Máxima potencia', is_rest: false, estimated_minutes: 50, exercises: [DEPTH_JUMP, BOX_JUMP, NORDIC_CURL, CALF_RAISES] },
    { id: '6weeks_w5_d2', day_number: 2, title: 'Descanso activo', is_rest: true, estimated_minutes: 0, exercises: [] },
    { id: '6weeks_w5_d3', day_number: 3, title: 'Sprint & salto', is_rest: false, estimated_minutes: 45, exercises: [BROAD_JUMP_TRIPLE, SINGLE_LEG_JUMP, HIP_HINGE] },
    { id: '6weeks_w5_d4', day_number: 4, title: 'Descanso', is_rest: true, estimated_minutes: 0, exercises: [] },
    { id: '6weeks_w5_d5', day_number: 5, title: 'Circuito explosivo', is_rest: false, estimated_minutes: 55, exercises: [JUMP_SQUATS, BOX_JUMP, DEPTH_JUMP, WALL_SIT] },
  ],
};

const WEEK_6: ProgramWeek = {
  week_number: 6,
  days: [
    { id: '6weeks_w6_d1', day_number: 1, title: 'Test de salto', is_rest: false, estimated_minutes: 30, exercises: [JUMP_SQUATS, BROAD_JUMP] },
    { id: '6weeks_w6_d2', day_number: 2, title: 'Descanso', is_rest: true, estimated_minutes: 0, exercises: [] },
    { id: '6weeks_w6_d3', day_number: 3, title: 'Pliometría final', is_rest: false, estimated_minutes: 45, exercises: [BOX_JUMP, DEPTH_JUMP, SINGLE_LEG_JUMP] },
    { id: '6weeks_w6_d4', day_number: 4, title: 'Descanso', is_rest: true, estimated_minutes: 0, exercises: [] },
    { id: '6weeks_w6_d5', day_number: 5, title: 'Rutina de cierre', is_rest: false, estimated_minutes: 40, exercises: [JUMP_SQUATS, BOX_JUMP, NORDIC_CURL, CALF_RAISES] },
  ],
};

// ── Mock courses array ────────────────────────────────────────────────────

export const MOCK_COURSES: CourseItem[] = [
  // ── Training program ─────────────────────────────────────────────────
  {
    id: 'course-6weeks-saltabilidad',
    type: 'training_program',
    title: '6 Semanas para Mejorar tu Saltabilidad',
    description:
      'Un programa estructurado para voleibolistas que quieren ganar centímetros en su salto vertical. Cada semana aumenta la carga de forma progresiva: empezás con pliometría básica y terminás con circuitos de máxima potencia.',
    thumbnail_url: null,
    level: 'intermedio',
    is_free: false,
    price_usd: 9.99,
    tags: ['saltabilidad', 'fuerza', 'pliometría'],
    total_weeks: 6,
    sessions_per_week: 3,
    estimated_minutes_per_session: 40,
    weeks: [WEEK_1, WEEK_2, WEEK_3, WEEK_4, WEEK_5, WEEK_6],
  },

  // ── Video collections ─────────────────────────────────────────────────
  {
    id: 'course-fundamentos-saque',
    type: 'video_collection',
    title: 'Fundamentos del Saque',
    description:
      'Dominá el saque flotante, en salto y de potencia. Esta colección cubre desde la postura inicial hasta la fase de contacto y seguimiento. Ideal para jugadores que quieren hacer el saque una ventaja táctica.',
    thumbnail_url: null,
    level: 'basico',
    is_free: true,
    tags: ['técnica', 'saque'],
    video_ids: ['v8', 'v9', 'v1'],
  },
  {
    id: 'course-tecnica-recepcion',
    type: 'video_collection',
    title: 'Técnica de Recepción',
    description:
      'Aprende a leer el saque y posicionarte correctamente. Trabajamos el antebrazo, la postura baja y la lectura del juego contrario para construir una recepción sólida y consistente.',
    thumbnail_url: null,
    level: 'basico',
    is_free: false,
    price_usd: 4.99,
    tags: ['técnica', 'recepción'],
    video_ids: ['v4', 'v5', 'v6', 'v7'],
  },
];
