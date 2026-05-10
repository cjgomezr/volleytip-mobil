-- =====================================================
-- VolleyTip – Schema migrations + Seed data
-- Pegar en: Supabase Dashboard → SQL Editor → Run
-- =====================================================

-- ── 1. Migración de columnas faltantes (idempotente) ────

ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS video_key         text,
  ADD COLUMN IF NOT EXISTS thumbnail_key     text,
  ADD COLUMN IF NOT EXISTS is_free           boolean  NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS key_points        text[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category_slug     text     NOT NULL DEFAULT '';

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS thumbnail_key                  text,
  ADD COLUMN IF NOT EXISTS tags                           text[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS instructor                     text,
  ADD COLUMN IF NOT EXISTS sessions_per_week              integer  NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS estimated_minutes_per_session  integer  NOT NULL DEFAULT 30;

ALTER TABLE routines
  ADD COLUMN IF NOT EXISTS description        text     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS estimated_minutes  integer  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level              text     NOT NULL DEFAULT 'basico',
  ADD COLUMN IF NOT EXISTS tags               text[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS author_name        text     NOT NULL DEFAULT 'Atleta';

ALTER TABLE routine_exercises
  ADD COLUMN IF NOT EXISTS exercise_name     text     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS duration_seconds  integer  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rest_seconds      integer  NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS note              text;

ALTER TABLE module_items
  ADD COLUMN IF NOT EXISTS exercise_name     text,
  ADD COLUMN IF NOT EXISTS duration_seconds  integer  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS note              text;

-- ── 2. Categorías ───────────────────────────────────────

INSERT INTO categories (name, slug, icon) VALUES
  ('Saltabilidad', 'saltabilidad', 'fitness-outline'),
  ('Fuerza',       'fuerza',       'barbell-outline'),
  ('Elasticidad',  'elasticidad',  'body-outline'),
  ('Potencia',     'potencia',     'flash-outline'),
  ('Técnica',      'tecnica',      'school-outline')
ON CONFLICT (slug) DO NOTHING;

-- ── 3. Videos (MP4 directos de Google sample bucket) ────

INSERT INTO videos
  (id, title, description, video_url, thumbnail_url,
   category_slug, level, duration_seconds, is_free, key_points)
VALUES

-- Saltabilidad
('00000000-0000-0000-0001-000000000001',
 'Técnica de Salto Vertical',
 'Aprende la biomecánica correcta del salto vertical para maximizar tu altura en el remate.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
 'https://picsum.photos/id/1015/640/360',
 'saltabilidad', 'basico', 480, true,
 ARRAY['Flexión de rodillas a 90°', 'Impulso de brazos hacia arriba', 'Caer con rodillas semiflexionadas']),

('00000000-0000-0000-0001-000000000002',
 'Salto con Contramovimiento (CMJ)',
 'El CMJ es la base de todos los saltos explosivos en voleibol. Domina la fase excéntrica.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
 'https://picsum.photos/id/1016/640/360',
 'saltabilidad', 'intermedio', 360, false,
 ARRAY['Fase excéntrica rápida', 'Transición elástica', 'Triple extensión tobillo-rodilla-cadera']),

-- Fuerza
('00000000-0000-0000-0001-000000000003',
 'Sentadilla para Voleibolistas',
 'La sentadilla trasera es el ejercicio más completo para desarrollar fuerza de tren inferior.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
 'https://picsum.photos/id/1011/640/360',
 'fuerza', 'basico', 420, true,
 ARRAY['Espalda recta durante toda la bajada', 'Rodillas sobre los pies', 'Subir empujando el suelo']),

('00000000-0000-0000-0001-000000000004',
 'Romanian Deadlift',
 'El peso muerto rumano activa isquiotibiales y glúteos, clave para la potencia del salto.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
 'https://picsum.photos/id/1020/640/360',
 'fuerza', 'intermedio', 300, false,
 ARRAY['Bisagra de cadera controlada', 'Barra pegada al cuerpo', 'Activar core durante el movimiento']),

-- Elasticidad
('00000000-0000-0000-0001-000000000005',
 'Movilidad de Cadera para Voleibol',
 'La movilidad de cadera determina tu rango de movimiento y previene lesiones en la cancha.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
 'https://picsum.photos/id/1023/640/360',
 'elasticidad', 'basico', 540, true,
 ARRAY['Mantener cada posición 30 segundos', 'Respiración profunda', 'No forzar el rango']),

('00000000-0000-0000-0001-000000000006',
 'Cadena Posterior: Flexibilidad Profunda',
 'Rutina de estiramiento para isquiotibiales, gemelos y glúteos orientada a deportistas.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
 'https://picsum.photos/id/1025/640/360',
 'elasticidad', 'intermedio', 720, false,
 ARRAY['Estiramiento activo vs pasivo', 'Progresión de 2 semanas', 'Integración con calentamiento']),

-- Potencia
('00000000-0000-0000-0001-000000000007',
 'Box Jumps: Progresión Completa',
 'Desde el box jump básico hasta el drop jump. Domina la familia de saltos pliométricos.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
 'https://picsum.photos/id/1026/640/360',
 'potencia', 'intermedio', 600, true,
 ARRAY['Aterrizaje silencioso = buena técnica', 'Altura de caja según nivel', 'Descanso completo entre series']),

('00000000-0000-0000-0001-000000000008',
 'Lanzamientos de Balón Medicinal',
 'El lanzamiento overhead con balón medicinal transfiere fuerza directamente al remate.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
 'https://picsum.photos/id/1033/640/360',
 'potencia', 'avanzado', 480, false,
 ARRAY['Iniciar movimiento desde piernas', 'Rotación de tronco completa', 'Soltar en punto más alto']),

-- Técnica
('00000000-0000-0000-0001-000000000009',
 'Mecánica del Remate: Approach y Swing',
 'Análisis completo del approach de 3 pasos y la mecánica de brazo en el remate.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
 'https://picsum.photos/id/1043/640/360',
 'tecnica', 'basico', 660, true,
 ARRAY['Approach: izquierda-derecha-izquierda', 'Último paso más largo', 'Sincronizar brazos con piernas']),

('00000000-0000-0000-0001-000000000010',
 'Defensa y Recepción: Posición Baja',
 'La posición defensiva correcta y el patrón de movimiento para una recepción perfecta.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
 'https://picsum.photos/id/1002/640/360',
 'tecnica', 'basico', 540, true,
 ARRAY['Centro de gravedad bajo', 'Peso en la punta de los pies', 'Plataforma estable con antebrazos'])

ON CONFLICT (id) DO NOTHING;

-- ── 4. Ejercicios ───────────────────────────────────────

INSERT INTO exercises (id, video_id, name, muscle_group, category) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'Salto vertical',               'piernas',   'saltabilidad'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', 'Salto de caída',               'piernas',   'saltabilidad'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000002', 'CMJ (Counter Movement Jump)',  'piernas',   'saltabilidad'),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000003', 'Sentadilla trasera',           'piernas',   'fuerza'),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000003', 'Sentadilla goblet',            'piernas',   'fuerza'),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0001-000000000004', 'Romanian deadlift',            'posterior', 'fuerza'),
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0001-000000000005', 'Hip flexor stretch',           'cadera',    'elasticidad'),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0001-000000000006', 'Estiramiento isquiotibiales',  'posterior', 'elasticidad'),
  ('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0001-000000000007', 'Box jump',                     'piernas',   'potencia'),
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000007', 'Depth jump',                   'piernas',   'potencia'),
  ('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000008', 'Overhead med ball throw',      'hombros',   'potencia'),
  ('00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000009', 'Approach spike drill',         'full body', 'tecnica'),
  ('00000000-0000-0000-0002-000000000013', '00000000-0000-0000-0001-000000000010', 'Defensive stance drill',       'piernas',   'tecnica')
ON CONFLICT (id) DO NOTHING;

-- ── 5. Cursos ───────────────────────────────────────────

INSERT INTO courses
  (id, title, description, type, price, is_free, level,
   thumbnail_url, tags, instructor, sessions_per_week, estimated_minutes_per_session)
VALUES
  ('00000000-0000-0000-0003-000000000001',
   'Biblioteca de Técnica',
   'Colección completa de videos técnicos para jugadores de todos los niveles. Mejorá tu remate, recepción y defensa con ejercicios guiados por expertos.',
   'video_collection', NULL, true, 'basico',
   'https://picsum.photos/id/1043/640/360',
   ARRAY['tecnica', 'basico', 'gratis'],
   'Prof. Carlos Mendez', 2, 25),

  ('00000000-0000-0000-0003-000000000002',
   'Salto Explosivo: 4 Semanas',
   'Programa intensivo para aumentar tu salto vertical. Combina fuerza, potencia y pliometría con progresiones semanales diseñadas por especialistas en voleibol.',
   'training_program', 29.99, false, 'intermedio',
   'https://picsum.photos/id/1015/640/360',
   ARRAY['saltabilidad', 'potencia', 'fuerza'],
   'Coach Ana Ríos', 3, 45)

ON CONFLICT (id) DO NOTHING;

-- ── 6. Módulos del curso gratis (video_collection) ──────

INSERT INTO course_modules (id, course_id, title, week_number, day_number, sort_order) VALUES
  ('00000000-0000-0000-0004-000000000001',
   '00000000-0000-0000-0003-000000000001',
   'Técnica Fundamental', NULL, NULL, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO module_items (id, module_id, video_id, sort_order) VALUES
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0001-000000000009', 1),
  ('00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0001-000000000010', 2),
  ('00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0001-000000000001', 3),
  ('00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0001-000000000003', 4)
ON CONFLICT (id) DO NOTHING;

-- ── 7. Módulos del programa de entrenamiento (2 semanas × 3 días) ──

INSERT INTO course_modules (id, course_id, title, week_number, day_number, sort_order) VALUES
  ('00000000-0000-0000-0004-000000000011', '00000000-0000-0000-0003-000000000002', 'Semana 1 · Día 1: Fuerza base',     1, 1, 1),
  ('00000000-0000-0000-0004-000000000012', '00000000-0000-0000-0003-000000000002', 'Semana 1 · Día 2: Potencia',        1, 2, 2),
  ('00000000-0000-0000-0004-000000000013', '00000000-0000-0000-0003-000000000002', 'Semana 1 · Día 3: Pliometría',      1, 3, 3),
  ('00000000-0000-0000-0004-000000000014', '00000000-0000-0000-0003-000000000002', 'Semana 2 · Día 1: Fuerza avanzada', 2, 1, 4),
  ('00000000-0000-0000-0004-000000000015', '00000000-0000-0000-0003-000000000002', 'Semana 2 · Día 2: Potencia máxima', 2, 2, 5),
  ('00000000-0000-0000-0004-000000000016', '00000000-0000-0000-0003-000000000002', 'Semana 2 · Día 3: Pliometría alta', 2, 3, 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO module_items
  (id, module_id, video_id, exercise_name, sets, reps, duration_seconds, rest_seconds, sort_order)
VALUES
  ('00000000-0000-0000-0005-000000000011', '00000000-0000-0000-0004-000000000011', '00000000-0000-0000-0001-000000000003', 'Sentadilla trasera',  4, 8,  0, 120, 1),
  ('00000000-0000-0000-0005-000000000012', '00000000-0000-0000-0004-000000000011', '00000000-0000-0000-0001-000000000004', 'Romanian deadlift',   3, 10, 0,  90, 2),
  ('00000000-0000-0000-0005-000000000013', '00000000-0000-0000-0004-000000000012', '00000000-0000-0000-0001-000000000007', 'Box jump',            4, 5,  0, 120, 1),
  ('00000000-0000-0000-0005-000000000014', '00000000-0000-0000-0004-000000000012', '00000000-0000-0000-0001-000000000008', 'Med ball throw',      3, 8,  0,  90, 2),
  ('00000000-0000-0000-0005-000000000015', '00000000-0000-0000-0004-000000000013', '00000000-0000-0000-0001-000000000001', 'Salto vertical',      5, 6,  0, 120, 1),
  ('00000000-0000-0000-0005-000000000016', '00000000-0000-0000-0004-000000000013', '00000000-0000-0000-0001-000000000002', 'CMJ',                 4, 8,  0,  90, 2),
  ('00000000-0000-0000-0005-000000000017', '00000000-0000-0000-0004-000000000014', '00000000-0000-0000-0001-000000000003', 'Sentadilla trasera',  5, 5,  0, 150, 1),
  ('00000000-0000-0000-0005-000000000018', '00000000-0000-0000-0004-000000000014', '00000000-0000-0000-0001-000000000004', 'Romanian deadlift',   4, 8,  0, 120, 2),
  ('00000000-0000-0000-0005-000000000019', '00000000-0000-0000-0004-000000000015', '00000000-0000-0000-0001-000000000007', 'Box jump (30cm)',     5, 5,  0, 120, 1),
  ('00000000-0000-0000-0005-000000000020', '00000000-0000-0000-0004-000000000015', '00000000-0000-0000-0001-000000000008', 'Med ball overhead',   4, 6,  0, 100, 2),
  ('00000000-0000-0000-0005-000000000021', '00000000-0000-0000-0004-000000000016', '00000000-0000-0000-0001-000000000001', 'Salto con obstáculo', 5, 8,  0, 120, 1),
  ('00000000-0000-0000-0005-000000000022', '00000000-0000-0000-0004-000000000016', '00000000-0000-0000-0001-000000000002', 'CMJ avanzado',        5, 6,  0,  90, 2)
ON CONFLICT (id) DO NOTHING;

-- ── 8. Rutinas de comunidad ──────────────────────────────
-- Las rutinas necesitan un user_id válido de auth.users.
-- Para agregarlas: ir a Authentication → Users, copiar tu UUID
-- y ejecutar este bloque reemplazando TU_UUID_AQUI:

/*
INSERT INTO routines
  (id, user_id, name, description, is_public, likes_count, estimated_minutes, level, tags, author_name)
VALUES
  ('00000000-0000-0000-0006-000000000001',
   'TU_UUID_AQUI',
   'Rutina Fuerza Básica',
   'Rutina ideal para comenzar a desarrollar la base de fuerza necesaria para el voleibol.',
   true, 42, 35, 'basico', ARRAY['fuerza', 'principiante'], 'CoachVolley'),

  ('00000000-0000-0000-0006-000000000002',
   'TU_UUID_AQUI',
   'Potencia Explosiva',
   'Combina pliometría y fuerza para maximizar tu salto en el remate.',
   true, 87, 45, 'intermedio', ARRAY['potencia', 'saltabilidad'], 'JumpMaster'),

  ('00000000-0000-0000-0006-000000000003',
   'TU_UUID_AQUI',
   'Movilidad y Prevención',
   'Estiramiento dinámico y movilidad articular para evitar lesiones.',
   true, 31, 25, 'basico', ARRAY['elasticidad', 'prevencion'], 'FisioVol')

ON CONFLICT (id) DO NOTHING;
*/

-- ── 9. Migración: username en users ────────────────────────
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;
CREATE INDEX IF NOT EXISTS idx_users_username ON users (lower(username));

-- Función para buscar email por username (login sin @)
CREATE OR REPLACE FUNCTION find_email_by_username(p_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM users WHERE lower(username) = lower(p_username) LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION find_email_by_username(text) TO anon, authenticated;

-- ── 10. Fix video URLs (si los videos ya existen en la BD) ──
-- Ejecutar si ya corriste el seed anterior (que tenía URLs incorrectas)

UPDATE videos
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
WHERE id IN (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0001-000000000003',
  '00000000-0000-0000-0001-000000000005',
  '00000000-0000-0000-0001-000000000007',
  '00000000-0000-0000-0001-000000000009'
);

UPDATE videos
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
WHERE id IN (
  '00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0001-000000000004',
  '00000000-0000-0000-0001-000000000006',
  '00000000-0000-0000-0001-000000000008',
  '00000000-0000-0000-0001-000000000010'
);
