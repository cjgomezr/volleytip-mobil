import { ContentLevel } from '../types/database.types';

// ── Routine exercise ───────────────────────────────────────────────────────

export interface RoutineExercise {
  id:               string;
  exercise_name:    string;
  sets:             number;
  reps:             number;
  duration_seconds: number; // 0 = rep-based
  rest_seconds:     number;
  video_id:         string | null;
  note?:            string;
}

// ── Routine ────────────────────────────────────────────────────────────────

export interface Routine {
  id:                 string;
  title:              string;
  description:        string;
  author_id:          string;
  author_name:        string;
  author_avatar:      string | null;
  exercises:          RoutineExercise[];
  estimated_minutes:  number;
  likes_count:        number;
  is_saved:           boolean;
  is_mine:            boolean;
  level:              ContentLevel;
  tags:               string[];
  created_at:         string;
}

// ── Exercise pool ──────────────────────────────────────────────────────────

const SQUAT_JUMP: RoutineExercise = {
  id: 'rex-squatjump', exercise_name: 'Squat Jump',
  sets: 4, reps: 10, duration_seconds: 0, rest_seconds: 60,
  video_id: 'v1', note: 'Aterrizá suave sobre la punta del pie.',
};
const APPROACH_JUMP: RoutineExercise = {
  id: 'rex-approach', exercise_name: 'Salto de remate (sin red)',
  sets: 3, reps: 8, duration_seconds: 0, rest_seconds: 75,
  video_id: 'v2',
};
const LATERAL_SHUFFLE: RoutineExercise = {
  id: 'rex-lateral', exercise_name: 'Desplazamiento lateral',
  sets: 3, reps: 0, duration_seconds: 30, rest_seconds: 45,
  video_id: null, note: '5m ida y vuelta, explosivo al cambiar.',
};
const PLANK: RoutineExercise = {
  id: 'rex-plank', exercise_name: 'Plancha',
  sets: 3, reps: 0, duration_seconds: 45, rest_seconds: 40,
  video_id: null,
};
const HIP_FLEXOR: RoutineExercise = {
  id: 'rex-hipflexor', exercise_name: 'Estiramiento de flexor de cadera',
  sets: 2, reps: 0, duration_seconds: 30, rest_seconds: 20,
  video_id: null,
};
const SHOULDER_ROTATION: RoutineExercise = {
  id: 'rex-shoulder', exercise_name: 'Rotación de hombro con banda',
  sets: 3, reps: 15, duration_seconds: 0, rest_seconds: 30,
  video_id: null, note: 'Peso bajo, movimiento controlado.',
};
const CALF_JUMP: RoutineExercise = {
  id: 'rex-calfjump', exercise_name: 'Salto de pantorrilla (bilateral)',
  sets: 3, reps: 20, duration_seconds: 0, rest_seconds: 45,
  video_id: null,
};
const BROAD_JUMP_R: RoutineExercise = {
  id: 'rex-broadjump', exercise_name: 'Salto en largo parado',
  sets: 3, reps: 6, duration_seconds: 0, rest_seconds: 60,
  video_id: null,
};
const EXPLOSIVE_STEP: RoutineExercise = {
  id: 'rex-expstep', exercise_name: 'Step-up explosivo',
  sets: 3, reps: 8, duration_seconds: 0, rest_seconds: 60,
  video_id: 'v3',
};
const WRIST_ROLL: RoutineExercise = {
  id: 'rex-wrist', exercise_name: 'Rodillo de muñeca',
  sets: 2, reps: 0, duration_seconds: 40, rest_seconds: 20,
  video_id: null,
};
const CORE_ROTATION: RoutineExercise = {
  id: 'rex-corerot', exercise_name: 'Rotación de core con pelota',
  sets: 3, reps: 12, duration_seconds: 0, rest_seconds: 40,
  video_id: null,
};
const SINGLE_LEG_BALANCE: RoutineExercise = {
  id: 'rex-balance', exercise_name: 'Equilibrio a una pierna',
  sets: 3, reps: 0, duration_seconds: 30, rest_seconds: 20,
  video_id: null, note: 'Ojos cerrados para mayor dificultad.',
};
const WALL_PASS: RoutineExercise = {
  id: 'rex-wallpass', exercise_name: 'Pase contra la pared',
  sets: 3, reps: 20, duration_seconds: 0, rest_seconds: 30,
  video_id: 'v8',
};
const FOREARM_PASS: RoutineExercise = {
  id: 'rex-forearm', exercise_name: 'Antebrazo con compañero (simulado)',
  sets: 4, reps: 15, duration_seconds: 0, rest_seconds: 30,
  video_id: 'v9',
};
const JUMP_ROPE: RoutineExercise = {
  id: 'rex-jumprope', exercise_name: 'Soga de saltar',
  sets: 4, reps: 0, duration_seconds: 45, rest_seconds: 30,
  video_id: null,
};

// ── Mock routines ──────────────────────────────────────────────────────────

export const MOCK_ROUTINES: Routine[] = [
  {
    id: 'routine-explosividad-basica',
    title: 'Explosividad básica para voleibol',
    description:
      'Rutina de 25 minutos para trabajar la base de la explosividad: salto, desplazamiento y core. Ideal como calentamiento previo a la práctica o como sesión de mejora independiente.',
    author_id:  'user-mock-1',
    author_name: 'Valentina Torres',
    author_avatar: null,
    level: 'basico',
    tags: ['explosividad', 'calentamiento', 'salto'],
    estimated_minutes: 25,
    likes_count: 142,
    is_saved: false,
    is_mine: false,
    created_at: '2025-09-12T10:00:00Z',
    exercises: [JUMP_ROPE, SQUAT_JUMP, LATERAL_SHUFFLE, PLANK, HIP_FLEXOR],
  },
  {
    id: 'routine-potencia-remate',
    title: 'Potencia de remate',
    description:
      'Circuito enfocado en el salto de ataque y la potencia de hombro. Combina pliometría con trabajo específico de hombro para maximizar la velocidad de brazo en el remate.',
    author_id:  'user-mock-2',
    author_name: 'Mateo Ríos',
    author_avatar: null,
    level: 'intermedio',
    tags: ['remate', 'potencia', 'hombro'],
    estimated_minutes: 35,
    likes_count: 89,
    is_saved: true,
    is_mine: false,
    created_at: '2025-10-01T14:30:00Z',
    exercises: [APPROACH_JUMP, EXPLOSIVE_STEP, SHOULDER_ROTATION, CORE_ROTATION, BROAD_JUMP_R],
  },
  {
    id: 'routine-recepcion-agilidad',
    title: 'Recepción y agilidad defensiva',
    description:
      'Trabaja la posición baja, los desplazamientos defensivos y la técnica de antebrazo. Rutina corta ideal para hacer 3 veces por semana como complemento de tu entrenamiento técnico.',
    author_id:  'user-mock-3',
    author_name: 'Luciana Méndez',
    author_avatar: null,
    level: 'basico',
    tags: ['recepción', 'agilidad', 'defensa'],
    estimated_minutes: 20,
    likes_count: 215,
    is_saved: false,
    is_mine: false,
    created_at: '2025-08-22T09:15:00Z',
    exercises: [LATERAL_SHUFFLE, SINGLE_LEG_BALANCE, FOREARM_PASS, WALL_PASS],
  },
  {
    id: 'routine-salto-avanzado',
    title: 'Salto avanzado: máxima altura',
    description:
      'Protocolo pliométrico avanzado para jugadores con buena base. Combina saltos reactivos, unilaterales y de profundidad para llevar el salto vertical al siguiente nivel.',
    author_id:  'user-mock-4',
    author_name: 'Santiago Vega',
    author_avatar: null,
    level: 'avanzado',
    tags: ['salto', 'pliometría', 'avanzado'],
    estimated_minutes: 40,
    likes_count: 67,
    is_saved: false,
    is_mine: false,
    created_at: '2025-11-05T16:00:00Z',
    exercises: [SQUAT_JUMP, BROAD_JUMP_R, APPROACH_JUMP, EXPLOSIVE_STEP, CALF_JUMP],
  },
  {
    id: 'routine-movilidad-pase',
    title: 'Movilidad y técnica de pase',
    description:
      'Sesión de movilidad articular combinada con trabajo técnico de pase. Perfecta para días de recuperación activa o para ejecutar antes de un partido.',
    author_id:  'user-mock-1',
    author_name: 'Valentina Torres',
    author_avatar: null,
    level: 'basico',
    tags: ['movilidad', 'pase', 'recuperación'],
    estimated_minutes: 18,
    likes_count: 178,
    is_saved: true,
    is_mine: false,
    created_at: '2025-07-30T11:00:00Z',
    exercises: [HIP_FLEXOR, WRIST_ROLL, WALL_PASS, SINGLE_LEG_BALANCE],
  },
];
