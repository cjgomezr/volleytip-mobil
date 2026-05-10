// Exercise library used by the routine builder

export type ExerciseCategory =
  | 'saltabilidad'
  | 'fuerza'
  | 'pliometria'
  | 'tecnica'
  | 'movilidad'
  | 'core';

export interface ExerciseItem {
  id:           string;
  name:         string;
  category:     ExerciseCategory;
  muscle_group: string | null;
  default_sets: number;
  default_reps: number;
  default_duration_seconds: number; // 0 = rep-based
  default_rest_seconds:     number;
  video_id:     string | null;
  note?:        string;
}

export const EXERCISE_CATEGORIES: Array<{ key: ExerciseCategory; label: string; icon: string }> = [
  { key: 'saltabilidad', label: 'Saltabilidad', icon: 'arrow-up-circle-outline' },
  { key: 'fuerza',       label: 'Fuerza',       icon: 'barbell-outline' },
  { key: 'pliometria',   label: 'Pliometría',   icon: 'flash-outline' },
  { key: 'tecnica',      label: 'Técnica',      icon: 'basketball-outline' },
  { key: 'movilidad',    label: 'Movilidad',    icon: 'body-outline' },
  { key: 'core',         label: 'Core',         icon: 'fitness-outline' },
];

export const MOCK_EXERCISES: ExerciseItem[] = [
  // ── Saltabilidad ──────────────────────────────────────────────────────
  { id: 'ex-squat-jump',       name: 'Squat Jump',                  category: 'saltabilidad', muscle_group: 'Piernas',         default_sets: 4, default_reps: 10, default_duration_seconds: 0,  default_rest_seconds: 60, video_id: 'v1' },
  { id: 'ex-calf-raise',       name: 'Elevación de pantorrilla',    category: 'saltabilidad', muscle_group: 'Piernas',         default_sets: 3, default_reps: 20, default_duration_seconds: 0,  default_rest_seconds: 45, video_id: null },
  { id: 'ex-broad-jump',       name: 'Salto en largo parado',       category: 'saltabilidad', muscle_group: 'Piernas',         default_sets: 3, default_reps: 8,  default_duration_seconds: 0,  default_rest_seconds: 60, video_id: null },
  { id: 'ex-single-leg-jump',  name: 'Salto a una pierna',          category: 'saltabilidad', muscle_group: 'Piernas',         default_sets: 3, default_reps: 8,  default_duration_seconds: 0,  default_rest_seconds: 75, video_id: 'v2', note: 'Alternar piernas entre series.' },
  { id: 'ex-approach-jump',    name: 'Salto de remate (sin red)',   category: 'saltabilidad', muscle_group: 'Cuerpo completo', default_sets: 3, default_reps: 8,  default_duration_seconds: 0,  default_rest_seconds: 75, video_id: 'v2' },
  { id: 'ex-jump-rope',        name: 'Soga de saltar',              category: 'saltabilidad', muscle_group: 'Piernas',         default_sets: 4, default_reps: 0,  default_duration_seconds: 45, default_rest_seconds: 30, video_id: null },

  // ── Fuerza ────────────────────────────────────────────────────────────
  { id: 'ex-hip-hinge',        name: 'Hip Hinge con banda',         category: 'fuerza',       muscle_group: 'Glúteos',         default_sets: 3, default_reps: 12, default_duration_seconds: 0,  default_rest_seconds: 45, video_id: null },
  { id: 'ex-wall-sit',         name: 'Wall Sit',                    category: 'fuerza',       muscle_group: 'Piernas',         default_sets: 3, default_reps: 0,  default_duration_seconds: 40, default_rest_seconds: 45, video_id: null },
  { id: 'ex-step-up',          name: 'Step-up explosivo',           category: 'fuerza',       muscle_group: 'Piernas',         default_sets: 3, default_reps: 8,  default_duration_seconds: 0,  default_rest_seconds: 60, video_id: 'v3' },
  { id: 'ex-nordic-curl',      name: 'Curl nórdico',                category: 'fuerza',       muscle_group: 'Isquiotibiales',  default_sets: 3, default_reps: 6,  default_duration_seconds: 0,  default_rest_seconds: 90, video_id: null, note: 'Controlá la bajada.' },
  { id: 'ex-shoulder-press',   name: 'Press de hombro con mancuerna', category: 'fuerza',    muscle_group: 'Hombros',         default_sets: 3, default_reps: 10, default_duration_seconds: 0,  default_rest_seconds: 60, video_id: null },
  { id: 'ex-romanian-dl',      name: 'Peso muerto rumano',          category: 'fuerza',       muscle_group: 'Espalda',         default_sets: 3, default_reps: 10, default_duration_seconds: 0,  default_rest_seconds: 75, video_id: null },

  // ── Pliometría ────────────────────────────────────────────────────────
  { id: 'ex-box-jump',         name: 'Box Jump',                    category: 'pliometria',   muscle_group: 'Piernas',         default_sets: 3, default_reps: 8,  default_duration_seconds: 0,  default_rest_seconds: 90,  video_id: 'v2', note: 'Bajá del cajón controlado.' },
  { id: 'ex-depth-jump',       name: 'Depth Jump',                  category: 'pliometria',   muscle_group: 'Piernas',         default_sets: 3, default_reps: 6,  default_duration_seconds: 0,  default_rest_seconds: 120, video_id: 'v3', note: 'Mínimo tiempo de contacto.' },
  { id: 'ex-triple-jump',      name: 'Triple salto en largo',       category: 'pliometria',   muscle_group: 'Piernas',         default_sets: 3, default_reps: 5,  default_duration_seconds: 0,  default_rest_seconds: 90,  video_id: null },
  { id: 'ex-lateral-shuffle',  name: 'Desplazamiento lateral',      category: 'pliometria',   muscle_group: 'Piernas',         default_sets: 3, default_reps: 0,  default_duration_seconds: 30, default_rest_seconds: 45,  video_id: null, note: '5m ida y vuelta, explosivo.' },

  // ── Técnica ───────────────────────────────────────────────────────────
  { id: 'ex-wall-pass',        name: 'Pase contra la pared',        category: 'tecnica',      muscle_group: 'Brazos',          default_sets: 3, default_reps: 20, default_duration_seconds: 0,  default_rest_seconds: 30, video_id: 'v8' },
  { id: 'ex-forearm-pass',     name: 'Antebrazo con compañero',     category: 'tecnica',      muscle_group: 'Brazos',          default_sets: 4, default_reps: 15, default_duration_seconds: 0,  default_rest_seconds: 30, video_id: 'v9' },
  { id: 'ex-serve-toss',       name: 'Tossing de saque',            category: 'tecnica',      muscle_group: 'Hombros',         default_sets: 3, default_reps: 15, default_duration_seconds: 0,  default_rest_seconds: 20, video_id: null },
  { id: 'ex-arm-swing',        name: 'Swing de brazo (sin salto)',  category: 'tecnica',      muscle_group: 'Hombros',         default_sets: 3, default_reps: 12, default_duration_seconds: 0,  default_rest_seconds: 30, video_id: null },

  // ── Movilidad ─────────────────────────────────────────────────────────
  { id: 'ex-hip-flexor',       name: 'Estiramiento de flexor de cadera', category: 'movilidad', muscle_group: 'Caderas',      default_sets: 2, default_reps: 0,  default_duration_seconds: 30, default_rest_seconds: 20, video_id: null },
  { id: 'ex-shoulder-rot',     name: 'Rotación de hombro con banda', category: 'movilidad',   muscle_group: 'Hombros',        default_sets: 3, default_reps: 15, default_duration_seconds: 0,  default_rest_seconds: 30, video_id: null, note: 'Peso bajo, movimiento controlado.' },
  { id: 'ex-wrist-roll',       name: 'Rodillo de muñeca',           category: 'movilidad',    muscle_group: 'Brazos',         default_sets: 2, default_reps: 0,  default_duration_seconds: 40, default_rest_seconds: 20, video_id: null },
  { id: 'ex-ankle-circles',    name: 'Círculos de tobillo',         category: 'movilidad',    muscle_group: 'Piernas',        default_sets: 2, default_reps: 15, default_duration_seconds: 0,  default_rest_seconds: 15, video_id: null },
  { id: 'ex-t-spine',          name: 'Rotación torácica',           category: 'movilidad',    muscle_group: 'Espalda',        default_sets: 2, default_reps: 10, default_duration_seconds: 0,  default_rest_seconds: 20, video_id: null },

  // ── Core ──────────────────────────────────────────────────────────────
  { id: 'ex-plank',            name: 'Plancha',                     category: 'core',         muscle_group: 'Core',           default_sets: 3, default_reps: 0,  default_duration_seconds: 45, default_rest_seconds: 40, video_id: null },
  { id: 'ex-side-plank',       name: 'Plancha lateral',             category: 'core',         muscle_group: 'Core',           default_sets: 3, default_reps: 0,  default_duration_seconds: 30, default_rest_seconds: 30, video_id: null },
  { id: 'ex-core-rotation',    name: 'Rotación de core con pelota', category: 'core',         muscle_group: 'Core',           default_sets: 3, default_reps: 12, default_duration_seconds: 0,  default_rest_seconds: 40, video_id: null },
  { id: 'ex-dead-bug',         name: 'Dead Bug',                    category: 'core',         muscle_group: 'Core',           default_sets: 3, default_reps: 10, default_duration_seconds: 0,  default_rest_seconds: 45, video_id: null, note: 'Espalda baja pegada al piso.' },
  { id: 'ex-bird-dog',         name: 'Bird Dog',                    category: 'core',         muscle_group: 'Core',           default_sets: 3, default_reps: 10, default_duration_seconds: 0,  default_rest_seconds: 40, video_id: null },
  { id: 'ex-balance',          name: 'Equilibrio a una pierna',     category: 'core',         muscle_group: 'Core',           default_sets: 3, default_reps: 0,  default_duration_seconds: 30, default_rest_seconds: 20, video_id: null },
];
