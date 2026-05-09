import { ContentLevel } from '../types/database.types';

export interface VideoItem {
  id:               string;
  title:            string;
  description:      string;
  /** Working fallback URL — used in dev or when R2_PUBLIC_URL is not set. */
  video_url:        string;
  /** R2 object key (e.g. 'saltabilidad/v1-squat-vertical.mp4'). Used in production. */
  video_key:        string | null;
  thumbnail_url:    string | null;
  /** R2 object key for the thumbnail (e.g. 'thumbnails/v1-squat-vertical.jpg'). */
  thumbnail_key:    string | null;
  category_id:      string;
  category_slug:    string;
  category_name:    string;
  level:            ContentLevel;
  duration_seconds: number;
  is_free:          boolean;
  key_points:       string[];
}

// Public MP4 samples used as fallback when R2_PUBLIC_URL is not configured.
// In production, each VideoItem's video_key is served from the R2 bucket instead.
const SAMPLES = {
  short1: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  short2: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  short3: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  short4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  short5: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  mid1:   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  mid2:   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  long1:  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  long2:  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
};

export const MOCK_VIDEOS: VideoItem[] = [
  // ── Saltabilidad ──────────────────────────────────────────────
  {
    id: 'v1',
    title: 'Salto vertical: fundamentos',
    description:
      'Aprende las bases del salto vertical para voleibol. Trabajamos postura de despegue, impulso de brazos y técnica de aterrizaje correcta para maximizar la altura y proteger las rodillas.',
    video_url:     SAMPLES.short1,
    video_key:     'saltabilidad/v1-salto-vertical-fundamentos.mp4',
    thumbnail_url: null,
    thumbnail_key: 'thumbnails/v1-salto-vertical-fundamentos.jpg',
    category_id:   'cat-saltabilidad',
    category_slug: 'saltabilidad',
    category_name: 'Saltabilidad',
    level:            'basico',
    duration_seconds: 180,
    is_free: true,
    key_points: [
      'Pies al ancho de los hombros antes del despegue',
      'Doblar rodillas a 90° para maximizar el impulso',
      'Extender brazos hacia adelante y arriba durante el salto',
      'Aterrizaje suave en metatarso, rodillas flexionadas',
    ],
  },
  {
    id: 'v2',
    title: 'Salto de potencia con cajón',
    description:
      'Ejercicios de caja pliométrica para aumentar la explosividad y la altura del salto. Progresión desde cajón bajo hasta altura competitiva.',
    video_url:     SAMPLES.short2,
    video_key:     'saltabilidad/v2-salto-potencia-cajon.mp4',
    thumbnail_url: null,
    thumbnail_key: 'thumbnails/v2-salto-potencia-cajon.jpg',
    category_id:   'cat-saltabilidad',
    category_slug: 'saltabilidad',
    category_name: 'Saltabilidad',
    level:            'intermedio',
    duration_seconds: 300,
    is_free: false,
    key_points: [
      'Altura del cajón: 40–60 cm según nivel',
      'Tiempo de contacto en suelo mínimo (reactividad)',
      'Mantener torso erguido durante el salto al cajón',
      'Bajar con control, sin caer, para proteger las rodillas',
    ],
  },
  {
    id: 'v3',
    title: 'Drop jumps y reactividad',
    description:
      'Protocolo avanzado de saltos reactivos desde altura para desarrollar la máxima potencia en el ciclo estiramiento-acortamiento.',
    video_url:     SAMPLES.short3,
    video_key:     'saltabilidad/v3-drop-jumps-reactividad.mp4',
    thumbnail_url: null,
    thumbnail_key: 'thumbnails/v3-drop-jumps-reactividad.jpg',
    category_id:   'cat-saltabilidad',
    category_slug: 'saltabilidad',
    category_name: 'Saltabilidad',
    level:            'avanzado',
    duration_seconds: 480,
    is_free: false,
    key_points: [
      'Caída inicial con rodillas semi-flexionadas, no bloqueadas',
      'Tiempo de contacto en suelo < 250 ms (usa cronómetro)',
      'Progresión de altura: 40 → 60 → 80 cm',
      '3–4 series de 5 repeticiones, 3 min de descanso entre series',
    ],
  },
  // ── Fuerza ────────────────────────────────────────────────────
  {
    id: 'v4',
    title: 'Sentadillas para voleibol',
    description:
      'Fundamentos de la sentadilla con enfoque en la transferencia de fuerza al salto vertical y la protección activa de rodillas.',
    video_url:     SAMPLES.short4,
    video_key:     'fuerza/v4-sentadillas-voley.mp4',
    thumbnail_url: null,
    thumbnail_key: 'thumbnails/v4-sentadillas-voley.jpg',
    category_id:   'cat-fuerza',
    category_slug: 'fuerza',
    category_name: 'Fuerza',
    level:            'basico',
    duration_seconds: 240,
    is_free: true,
    key_points: [
      'Pies al ancho de hombros, punta de pies a 30°',
      'Rodillas alineadas con el dedo mayor en todo el recorrido',
      'Descender hasta que los muslos queden paralelos al suelo',
      'Empuje desde los talones al subir, pecho erguido',
    ],
  },
  {
    id: 'v5',
    title: 'Press militar con mancuernas',
    description:
      'Fortalecimiento del complejo del hombro para mejorar la potencia de remate y la estabilidad articular en la red.',
    video_url:     SAMPLES.short5,
    video_key:     'fuerza/v5-press-militar-mancuernas.mp4',
    thumbnail_url: null,
    thumbnail_key: 'thumbnails/v5-press-militar-mancuernas.jpg',
    category_id:   'cat-fuerza',
    category_slug: 'fuerza',
    category_name: 'Fuerza',
    level:            'intermedio',
    duration_seconds: 320,
    is_free: false,
    key_points: [
      'Codos a 90° en posición inicial, a altura de hombros',
      'Empuje vertical sin hiperextender la espalda baja',
      'Fase excéntrica lenta: 3 s bajar, 1 s subir',
      '3 × 10 repeticiones con peso que permita control total',
    ],
  },
  // ── Potencia ──────────────────────────────────────────────────
  {
    id: 'v6',
    title: 'Pliometría de brazos para remate',
    description:
      'Circuito de ejercicios para desarrollar la explosividad de la cadena cinética del brazo de ataque.',
    video_url:     SAMPLES.mid1,
    video_key:     'potencia/v6-pliometria-brazos-remate.mp4',
    thumbnail_url: null,
    thumbnail_key: 'thumbnails/v6-pliometria-brazos-remate.jpg',
    category_id:   'cat-potencia',
    category_slug: 'potencia',
    category_name: 'Potencia',
    level:            'basico',
    duration_seconds: 200,
    is_free: true,
    key_points: [
      'Activación con banda elástica ligera para el manguito rotador',
      'Lanzamientos de balón medicinal 1–2 kg contra la pared',
      'Progresión: lento → rápido → explosivo',
      'Descanso completo entre series para preservar la potencia',
    ],
  },
  // ── Elasticidad ───────────────────────────────────────────────
  {
    id: 'v7',
    title: 'Estiramiento de cadera y cadena posterior',
    description:
      'Rutina de movilidad para liberar la cadera y el complejo isquiosural, mejorando el rango de movimiento en bloqueo y recepción baja.',
    video_url:     SAMPLES.long1,
    video_key:     'elasticidad/v7-estiramiento-cadera-cadena-posterior.mp4',
    thumbnail_url: null,
    thumbnail_key: 'thumbnails/v7-estiramiento-cadera-cadena-posterior.jpg',
    category_id:   'cat-elasticidad',
    category_slug: 'elasticidad',
    category_name: 'Elasticidad',
    level:            'basico',
    duration_seconds: 480,
    is_free: true,
    key_points: [
      'Mantener cada postura entre 30–45 segundos',
      'Respiración lenta y profunda para facilitar la relajación',
      'Trabajar en el umbral de tensión, nunca de dolor',
      'Repetir la secuencia 2 veces al terminar el entrenamiento',
    ],
  },
  // ── Técnica ───────────────────────────────────────────────────
  {
    id: 'v8',
    title: 'Voleo: posición de manos y contacto',
    description:
      'Técnica básica del voleo en voleibol: formación de manos, punto de contacto ideal y orientación corporal para dirigir el balón.',
    video_url:     SAMPLES.mid2,
    video_key:     'tecnica/v8-voleo-posicion-manos-contacto.mp4',
    thumbnail_url: null,
    thumbnail_key: 'thumbnails/v8-voleo-posicion-manos-contacto.jpg',
    category_id:   'cat-tecnica',
    category_slug: 'tecnica',
    category_name: 'Técnica',
    level:            'basico',
    duration_seconds: 300,
    is_free: true,
    key_points: [
      'Triángulo de manos: pulgares e índices forman un diamante',
      'Contacto en los tres segmentos distales de los dedos',
      'Codos a 90°, ligeramente por delante de la frente',
      'Extensión de piernas y codos simultánea para dar dirección',
    ],
  },
  {
    id: 'v9',
    title: 'Remate: aproximación y salto',
    description:
      'Descomposición paso a paso de la aproximación al remate: ritmo de pasos, impulso de brazos, salto y posición de contacto.',
    video_url:     SAMPLES.long2,
    video_key:     'tecnica/v9-remate-aproximacion-salto.mp4',
    thumbnail_url: null,
    thumbnail_key: 'thumbnails/v9-remate-aproximacion-salto.jpg',
    category_id:   'cat-tecnica',
    category_slug: 'tecnica',
    category_name: 'Técnica',
    level:            'intermedio',
    duration_seconds: 420,
    is_free: false,
    key_points: [
      'Aproximación de 3 pasos: derecho-izquierdo-derecho (diestros)',
      'Último paso largo y bajo para convertir velocidad horizontal en vertical',
      'Brazos atrás en el penúltimo paso, swing frontal en el último',
      'Contacto con el balón en el punto más alto, brazo completamente extendido',
    ],
  },
];
