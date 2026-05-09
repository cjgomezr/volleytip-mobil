-- ============================================================
-- VolleyTip — Esquema inicial de base de datos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── ENUMS ──────────────────────────────────────────────────

create type public.content_level as enum ('basico', 'intermedio', 'avanzado');
create type public.course_type   as enum ('video_collection', 'training_program');


-- ── TABLAS ─────────────────────────────────────────────────

-- 1. users
-- El id es FK a auth.users. Se crea automáticamente via trigger.
create table public.users (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null unique,
  name        text        not null default '',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- 2. categories
create table public.categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  slug  text not null unique,
  icon  text
);

-- 3. videos
create table public.videos (
  id               uuid              primary key default gen_random_uuid(),
  title            text              not null,
  description      text,
  video_url        text              not null,
  thumbnail_url    text,
  category_id      uuid              references public.categories(id) on delete set null,
  level            public.content_level not null default 'basico',
  duration_seconds integer           not null default 0,
  created_at       timestamptz       not null default now()
);

-- 4. exercises (cada video puede tener un ejercicio asociado)
create table public.exercises (
  id           uuid primary key default gen_random_uuid(),
  video_id     uuid not null references public.videos(id) on delete cascade,
  name         text not null,
  muscle_group text,
  category     text
);

-- 5. courses
create table public.courses (
  id            uuid              primary key default gen_random_uuid(),
  title         text              not null,
  description   text,
  type          public.course_type not null default 'video_collection',
  price         numeric(10, 2),
  is_free       boolean           not null default false,
  level         public.content_level not null default 'basico',
  thumbnail_url text,
  created_at    timestamptz       not null default now()
);

-- 6. course_modules (semanas/días de un programa, o secciones de una colección)
create table public.course_modules (
  id          uuid    primary key default gen_random_uuid(),
  course_id   uuid    not null references public.courses(id) on delete cascade,
  title       text    not null,
  week_number integer,
  day_number  integer,
  sort_order  integer not null default 0
);

-- 7. module_items (ejercicios dentro de un módulo)
create table public.module_items (
  id           uuid    primary key default gen_random_uuid(),
  module_id    uuid    not null references public.course_modules(id) on delete cascade,
  video_id     uuid    not null references public.videos(id) on delete cascade,
  sets         integer,
  reps         integer,
  rest_seconds integer,
  sort_order   integer not null default 0
);

-- 8. purchases
create table public.purchases (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references public.users(id) on delete cascade,
  course_id      uuid        not null references public.courses(id) on delete cascade,
  revenuecat_id  text,
  purchased_at   timestamptz not null default now(),
  unique (user_id, course_id)
);

-- 9. user_progress (progreso por módulo)
create table public.user_progress (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.users(id) on delete cascade,
  module_id    uuid        not null references public.course_modules(id) on delete cascade,
  completed    boolean     not null default false,
  completed_at timestamptz,
  unique (user_id, module_id)
);

-- 10. video_views (seguimiento de reproducción)
create table public.video_views (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.users(id) on delete cascade,
  video_id        uuid        not null references public.videos(id) on delete cascade,
  watched_seconds integer     not null default 0,
  last_watched_at timestamptz not null default now(),
  unique (user_id, video_id)
);

-- 11. routines
create table public.routines (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.users(id) on delete cascade,
  name        text        not null,
  is_public   boolean     not null default false,
  likes_count integer     not null default 0,
  created_at  timestamptz not null default now()
);

-- 12. routine_exercises
create table public.routine_exercises (
  id          uuid    primary key default gen_random_uuid(),
  routine_id  uuid    not null references public.routines(id) on delete cascade,
  exercise_id uuid    not null references public.exercises(id) on delete cascade,
  sets        integer not null default 3,
  reps        integer not null default 10,
  sort_order  integer not null default 0
);

-- 13. routine_likes
create table public.routine_likes (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  routine_id uuid        not null references public.routines(id) on delete cascade,
  liked_at   timestamptz not null default now(),
  unique (user_id, routine_id)
);

-- 14. routine_saves
create table public.routine_saves (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  routine_id uuid        not null references public.routines(id) on delete cascade,
  saved_at   timestamptz not null default now(),
  unique (user_id, routine_id)
);


-- ── ÍNDICES ────────────────────────────────────────────────

create index idx_videos_category   on public.videos(category_id);
create index idx_videos_level      on public.videos(level);
create index idx_videos_created    on public.videos(created_at desc);

create index idx_exercises_video   on public.exercises(video_id);

create index idx_modules_course    on public.course_modules(course_id, week_number, day_number, sort_order);
create index idx_items_module      on public.module_items(module_id, sort_order);

create index idx_purchases_user    on public.purchases(user_id);
create index idx_progress_user     on public.user_progress(user_id);
create index idx_views_user        on public.video_views(user_id);

create index idx_routines_user     on public.routines(user_id);
create index idx_routines_public   on public.routines(is_public, likes_count desc) where is_public = true;
create index idx_re_routine        on public.routine_exercises(routine_id, sort_order);
create index idx_likes_routine     on public.routine_likes(routine_id);
create index idx_likes_user        on public.routine_likes(user_id);
create index idx_saves_user        on public.routine_saves(user_id);


-- ── TRIGGER: auto-crear perfil al registrarse ──────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── TRIGGER: mantener likes_count en routines ─────────────

create or replace function public.update_routine_likes_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.routines
    set likes_count = likes_count + 1
    where id = NEW.routine_id;

  elsif TG_OP = 'DELETE' then
    update public.routines
    set likes_count = greatest(likes_count - 1, 0)
    where id = OLD.routine_id;
  end if;
  return null;
end;
$$;

create trigger trigger_routine_likes_count
  after insert or delete on public.routine_likes
  for each row execute function public.update_routine_likes_count();


-- ── ROW LEVEL SECURITY ─────────────────────────────────────

alter table public.users             enable row level security;
alter table public.categories        enable row level security;
alter table public.videos            enable row level security;
alter table public.exercises         enable row level security;
alter table public.courses           enable row level security;
alter table public.course_modules    enable row level security;
alter table public.module_items      enable row level security;
alter table public.purchases         enable row level security;
alter table public.user_progress     enable row level security;
alter table public.video_views       enable row level security;
alter table public.routines          enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.routine_likes     enable row level security;
alter table public.routine_saves     enable row level security;


-- ── POLÍTICAS RLS ──────────────────────────────────────────

-- users
create policy "Usuarios autenticados pueden ver perfiles"
  on public.users for select to authenticated using (true);

create policy "Usuarios pueden actualizar su propio perfil"
  on public.users for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- categories, videos, exercises, courses, course_modules, module_items: lectura pública
create policy "Lectura pública de categorías"
  on public.categories for select using (true);

create policy "Lectura pública de videos"
  on public.videos for select using (true);

create policy "Lectura pública de ejercicios"
  on public.exercises for select using (true);

create policy "Lectura pública de cursos"
  on public.courses for select using (true);

create policy "Lectura pública de módulos"
  on public.course_modules for select using (true);

create policy "Lectura pública de ítems de módulo"
  on public.module_items for select using (true);

-- purchases
create policy "Usuarios ven sus propias compras"
  on public.purchases for select to authenticated
  using (auth.uid() = user_id);

create policy "Usuarios registran sus propias compras"
  on public.purchases for insert to authenticated
  with check (auth.uid() = user_id);

-- user_progress
create policy "Usuarios ven su propio progreso"
  on public.user_progress for select to authenticated
  using (auth.uid() = user_id);

create policy "Usuarios insertan su propio progreso"
  on public.user_progress for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Usuarios actualizan su propio progreso"
  on public.user_progress for update to authenticated
  using (auth.uid() = user_id);

-- video_views
create policy "Usuarios ven sus propias reproducciones"
  on public.video_views for select to authenticated
  using (auth.uid() = user_id);

create policy "Usuarios insertan sus propias reproducciones"
  on public.video_views for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Usuarios actualizan sus propias reproducciones"
  on public.video_views for update to authenticated
  using (auth.uid() = user_id);

-- routines: propias (todas) + ajenas públicas
create policy "Ver rutinas públicas y propias"
  on public.routines for select to authenticated
  using (is_public = true or auth.uid() = user_id);

create policy "Crear rutinas propias"
  on public.routines for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Actualizar rutinas propias"
  on public.routines for update to authenticated
  using (auth.uid() = user_id);

create policy "Eliminar rutinas propias"
  on public.routines for delete to authenticated
  using (auth.uid() = user_id);

-- routine_exercises: heredan visibilidad de la rutina padre
create policy "Ver ejercicios de rutinas visibles"
  on public.routine_exercises for select to authenticated
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id
        and (r.is_public = true or r.user_id = auth.uid())
    )
  );

create policy "Agregar ejercicios a rutinas propias"
  on public.routine_exercises for insert to authenticated
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "Actualizar ejercicios de rutinas propias"
  on public.routine_exercises for update to authenticated
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "Eliminar ejercicios de rutinas propias"
  on public.routine_exercises for delete to authenticated
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

-- routine_likes: ver los propios + dar/quitar like
create policy "Ver likes propios"
  on public.routine_likes for select to authenticated
  using (auth.uid() = user_id);

create policy "Dar like a rutinas"
  on public.routine_likes for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Quitar like propio"
  on public.routine_likes for delete to authenticated
  using (auth.uid() = user_id);

-- routine_saves
create policy "Ver saves propios"
  on public.routine_saves for select to authenticated
  using (auth.uid() = user_id);

create policy "Guardar rutinas"
  on public.routine_saves for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Eliminar saves propios"
  on public.routine_saves for delete to authenticated
  using (auth.uid() = user_id);


-- ── DATOS INICIALES: categorías ────────────────────────────

insert into public.categories (name, slug, icon) values
  ('Saltabilidad', 'saltabilidad', 'trending-up'),
  ('Fuerza',       'fuerza',       'barbell'),
  ('Elasticidad',  'elasticidad',  'body'),
  ('Potencia',     'potencia',     'flash'),
  ('Técnica',      'tecnica',      'school');
