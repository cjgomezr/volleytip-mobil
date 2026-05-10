# VolleyTip — Estado del Proyecto

Última actualización: 2026-05-10 — Módulos completados: M1–M14 + extras + generador de rutinas

---

## 1. Stack Técnico

| Tecnología | Versión | Rol |
|---|---|---|
| React Native | 0.81.5 | Base mobile |
| React | 19.1.0 | UI library |
| Expo (SDK) | 54.0.33 | Managed workflow |
| Expo Router | 6.0.23 | File-system routing |
| TypeScript | 5.9.2 | Tipado estático |
| Zustand | 5.0.13 | Estado global |
| Supabase JS | 2.105.4 | Auth + DB + Storage |
| i18next | 26.0.10 | Internacionalización |
| react-i18next | 17.0.7 | Integración React |
| expo-video | 3.0.16 | Reproductor de video |
| expo-image | — | Imágenes optimizadas (caché, blur-up) |
| expo-localization | 17.0.8 | Detección idioma dispositivo |
| react-native-gesture-handler | 2.28.0 | Gestos |
| react-native-reanimated | 4.1.1 | Animaciones |
| react-native-safe-area-context | 5.6.0 | Safe areas |
| @expo-google-fonts/roboto | 0.4.3 | Tipografía Roboto |
| @react-native-async-storage/async-storage | 2.2.0 | Persistencia local |
| expo-dev-client | 6.0.21 | Dev Client (Android) |
| @tanstack/react-query | 5.x | Server state + cache |
| react-native-purchases | pendiente instalar | RevenueCat — pagos |
| cross-env | 10.1.0 | Scripts multi-env |
| dotenv | 17.4.2 | Variables de entorno |

**Directorio:** `C:\Users\user\Documents\volleytip-mobilapp\volleytip-app`

**Repositorio GitHub:** `https://github.com/cjgomezr/volleytip-mobil.git`

**Runtime actual:** Expo Dev Client (Android) ✅ — EAS projectId: `156d9c99-788b-4cbf-a413-59b48a2c93cd`
- `npm start` → Metro con Dev Client (usar la app instalada en el emulador)
- `npm run start:go` → Expo Go (fallback, sin native modules)
- `npm run build:android:dev` → nuevo APK de desarrollo vía EAS

**Instalar RevenueCat (aún pendiente):**
```bash
npx expo install react-native-purchases
```

---

## 2. Diseño / Tema Global

- **Fondo principal:** `#111116`
- **Cards / superficies:** `#1a1a22`
- **Acento (cyan):** `#00CFCF`
- **Navbar:** `#0d0d12`
- **Tipografía:** Roboto (400 Regular / 500 Medium / 700 Bold / 900 Black)
- **Archivos:** `src/theme/colors.ts`, `typography.ts`, `spacing.ts`, `radius.ts`
- **Idiomas:** Español + Inglés, auto-detect idioma del dispositivo + override manual

---

## 3. Módulos Completados

### ✅ M1 — Estructura de carpetas
Árbol completo del proyecto: `app/`, `src/components/`, `src/store/`, `src/services/`,
`src/data/`, `src/lib/`, `src/hooks/`, `src/theme/`, `src/i18n/`, `src/types/`.

### ✅ M2 — Configuración Expo + TypeScript
SDK 54, React 19, RN 0.81, expo-router v6, Babel, `tsconfig.json` estricto,
`app.config.ts` con soporte multi-env (dev/prod).

### ✅ M3 — Tema global + i18n
`colors.ts`, `typography.ts`, `spacing.ts`, `radius.ts`.
Componentes UI base: `Text`, `Button`, `Card`, `Chip`, `ProgressBar`, `ScreenHeader`.
i18next v26 + expo-localization, locales `es`/`en`, auto-detect + override,
keys tipados con TypeScript (`en.ts` es la fuente de tipos, `es.ts` implementa `typeof en`).

### ✅ M4 — Supabase + Multi-env
14 tablas, 2 triggers, RLS activado en todas las tablas.
`app.config.ts` carga `.env.development` / `.env.production` con `dotenv`.
`src/lib/config.ts` expone credenciales vía `Constants.expoConfig.extra`.
`src/lib/supabase.ts` con `AsyncStorage` para persistencia de sesión.
Scripts `npm start` / `npm start:prod` con `cross-env`.

**Tablas Supabase:** `users`, `categories`, `videos`, `exercises`, `courses`,
`course_modules`, `module_items`, `purchases`, `user_progress`, `video_views`,
`routines`, `routine_exercises`, `routine_likes`, `routine_saves`.

### ✅ M5 — Autenticación robusta
`src/store/auth.store.ts` con Zustand. Características:
- `initialize()` con módulo-level `_initCalled` (evita doble-init de React StrictMode)
- Flag `settled` + `settle(session)` para evitar race conditions
- **Timeout de 5 segundos**: si `getSession()` cuelga, fuerza signOut y desbloquea UI
- **Validación de expiración**: si el token expiró, intenta `refreshSession()` silencioso; si falla → signOut
- **`try-catch` en `onAuthStateChange`**: cualquier error fuerza signOut (nunca queda en estado corrupto)
- **Dev AppState listener**: al volver la app al foreground en desarrollo, re-verifica sesión
- **Login con email O username**: `signIn(emailOrUsername, password)` → si no tiene `@`, llama RPC `find_email_by_username` en Supabase
- **Registro con username**: `signUp(email, password, fullName, username)` guarda username en tabla `users`
- `useProtectedRoute` hook para redirección automática login ↔ tabs
- Pantallas: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(auth)/forgot-password.tsx`
- **Google OAuth: deliberadamente postergado** — ver sección Pendientes

**SQL necesario en Supabase (ya corrido en dev y prod):**
```sql
-- Sección 9 del seed.sql:
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
CREATE OR REPLACE FUNCTION find_email_by_username(p_username TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM users WHERE username = p_username LIMIT 1;
  RETURN v_email;
END;
$$;
```

### ✅ M6 — Navegación base (Tab Bar)
5 tabs: Home / Videos / Cursos / Rutinas / Perfil.
`app/(tabs)/_layout.tsx` con Ionicons, colores del tema, `GestureHandlerRootView`.

### ✅ M7 — Módulo de Videos
`src/data/videos.mock.ts` — 9 videos mock con categorías, niveles, `video_key` y `thumbnail_key` para R2.
`src/services/videos.service.ts` — filtros por categoría, búsqueda por texto, sort.
`src/components/videos/VideoCard.tsx` — modo compact y full.
`app/(tabs)/videos/index.tsx` — biblioteca con search, filtros de categoría, sort.
`app/(tabs)/videos/[id].tsx` — reproductor completo con `expo-video`: play/pause con tap,
barra de progreso + tiempo, descripción, key points, videos relacionados.
Pausa automática al salir de la pantalla con `useFocusEffect`.

### ✅ M8 — Cursos y Programas
**Tipos:** `DayExercise`, `ProgramDay`, `ProgramWeek`, `TrainingProgramCourse`,
`VideoCollectionCourse`, `CourseItem` (union type), `DayStatus`.
`src/data/courses.mock.ts` — 3 cursos (2 programas de entrenamiento + 1 colección de videos).
`src/services/courses.service.ts` — `getAllCourses`, `getCourseById`, `getWorkoutDay`, `getCourseVideos`.
`src/components/courses/CourseCard.tsx` — badge tipo, chip nivel, progreso, precio.
`app/(tabs)/courses/index.tsx` — lista con búsqueda + filtros por tipo.
`app/(tabs)/courses/[id].tsx` — detalle completo:
- `WeekAccordion` expandible con estado de cada día (done/pending/rest)
- `useDayStatuses` hook que lee AsyncStorage para el progreso
- Paywall integrado (M11): CTA dinámico Iniciar/Comprar, días bloqueados sin acceso

**Fix infinite loop (ya aplicado):** constante `EMPTY_PROGRAM` módulo-nivel + `useMemo` para
estabilizar la referencia cuando el curso no es `training_program`.

### ✅ M9 — Ejecución de Workouts
`app/workout/[id].tsx` — máquina de estados completa con `useReducer`:
- Fases: `intro → exercise → rest → complete`
- `restAfterLastSet: boolean` determina si al acabar el descanso avanza ejercicio o serie
- `usePulseAnim()` hook: animación pulsante para el círculo del temporizador de descanso
- `VideoModal` sub-componente con `useVideoPlayer` — botón "Ver video" durante el ejercicio
- Persistencia en AsyncStorage: progreso en curso y día completado
- Pantalla de celebración con estadísticas: tiempo total, ejercicios, series
- `useFocusEffect` + `BackHandler` para interceptar botón físico atrás en Android

`app/routine/[id].tsx` — misma arquitectura adaptada para rutinas libres (sin programa).

### ✅ M10 — Creador de Rutinas + Comunidad

**`src/data/exercises.mock.ts`** — 30 ejercicios en 6 categorías con `muscle_group` asignado:
- Categorías: `saltabilidad`, `fuerza`, `pliometria`, `tecnica`, `movilidad`, `core`
- `muscle_group` valores: `Piernas`, `Glúteos`, `Isquiotibiales`, `Core`, `Hombros`, `Brazos`, `Espalda`, `Caderas`, `Cuerpo completo`

**`app/routine-builder.tsx`** — creador completo:
- `useReducer` con acciones: `SET_NAME`, `TOGGLE_PUBLIC`, `ADD_EXERCISE`, `REMOVE_EXERCISE`, `SET_SETS`, `SET_REPS`, `SET_DURATION`, `SET_REST`, `MOVE_UP`, `MOVE_DOWN`
- **Modal `AddExerciseModal`** (pageSheet): búsqueda + filtro por categoría
  - Toggle tap-para-agregar / tap-para-quitar: si el ejercicio ya está en la rutina, tocarlo lo elimina directamente desde el modal
  - **"Ver video"**: botón play por ejercicio (si tiene `video_id`), abre `VideoPreviewModal`
  - **Badge de grupo muscular**: chip coloreado con ícono y etiqueta
  - Safe area top aplicada (`insets.top`) para que el botón "Listo" no quede bajo la barra de estado en Android
- **`ExerciseRow`** (en la rutina armada): flechas arriba/abajo, botón eliminar + **3 steppers**:
  - **Series** (1–10)
  - **Reps** (1–100) para ejercicios por repetición, o **Tiempo** (5–300s, paso ±5s) para ejercicios cronometrados
  - **Descanso** (0–300s, paso ±5s) — inicializado desde el valor recomendado del ejercicio
- `getMuscleGroupMeta()`: mapea `muscle_group` → `{ icon, color, label }` (6 grupos con colores distintos)
- `MuscleGroupBadge`: pill con Ionicons + etiqueta corta
- `VideoPreviewModal`: modal expo-video para previsualizar ejercicio antes de agregarlo
- `estimateMinutes` y `handleSave` usan `row.duration` y `row.rest` editados por el usuario
- Guarda en `@volleytip/my_routines` (AsyncStorage)

**`src/data/routines.mock.ts`** — 5 rutinas de comunidad mock.
**`src/services/routines.service.ts`** — `getCommunityRoutines`, `getSavedRoutines`, `getRoutineById`.
**`src/components/routines/RoutineCard.tsx`** — nivel con color, duración, avatar autor, likes, bookmark.

**`app/(tabs)/routines/index.tsx`** — 3 tabs (Comunidad / Guardadas / Mis rutinas):
- Búsqueda de texto (solo en comunidad)
- Sort chips: más gustadas / más nuevas
- Like optimista con `Set<string>`
- `useFocusEffect` recarga rutinas propias desde AsyncStorage al volver al tab
- **Botón "Sorpréndeme"** (outline, siempre visible) en el header → navega a `routine-generator`

### ✅ M11 — RevenueCat (Pagos)
`src/lib/revenuecat.ts` — wrapper con **stub mode automático** (si SDK no disponible → stubs).
`src/services/purchases.service.ts` — `fetchOwnedCourseIds`, `recordPurchase`.
`src/store/purchases.store.ts` — `ownedCourseIds`, `hasAccess`, `buyCourse`, `restorePurchases`.
`src/components/paywall/CoursePaywall.tsx` — modal bottom-sheet con precio real/fallback.
**Convención de IDs:** `volleytip_course_{courseId}`, `volleytip_monthly`, `volleytip_annual`.

### ✅ M12 — Cloudflare R2 (Infraestructura de Videos)
`src/lib/r2.ts` — `resolveVideoUrl(video_url, video_key)` y `resolveThumbnailUrl`.
Lógica: si `R2_PUBLIC_URL` está configurado y existe `video_key` → URL de R2; si no → fallback.
Los tres reproductores (`videos/[id]`, `workout/[id]`, `routine/[id]`) usan `resolveVideoUrl`.
**Para activar R2:** solo agregar `R2_PUBLIC_URL=https://videos.volleytip.app` a `.env.production`.

### ✅ M13 — Home con datos reales de Supabase
`app/(tabs)/index.tsx` reescrito completamente:
- Saludo personalizado con franja horaria + nombre del usuario
- Logo + avatar con inicial del usuario
- Stats: sesiones, racha real, mis rutinas
- **Thumbnails visibles**: `FeaturedVideoCard`, `FeaturedCourseCard`, `PurchasedCourseCard` usan `expo-image` con `thumbnail_url`; el campo existía en los tipos pero nunca se renderizaba
- Cursos comprados, videos destacados, cursos destacados, rutinas de comunidad
- Skeleton loaders + pull-to-refresh
- `src/features/home/` — arquitectura feature-first con TanStack Query hooks

### ✅ M14 — Perfil de usuario
`app/(tabs)/profile.tsx`:
- Avatar con `expo-image`, subida de foto via `expo-image-picker`
- Stats reales, cursos comprados, selector de idioma
- **Sección "Seguinos"**: links a Instagram, TikTok, X y web via `expo-linking`
- Cerrar sesión con confirmación
- `src/features/profile/services/profile.service.ts`: `updateProfile`, `uploadAvatar`

### ✅ M15 — Generador de Rutinas Aleatorias

**`app/routine-generator.tsx`** — pantalla completa con dos fases:

**Fase Config:**
- 3 selectores de chip horizontal/wrap: **Grupo muscular** (Todos/Piernas/Core/Hombros/Brazos/Espalda), **Cantidad** (3/5/7), **Nivel** (Todos/Básico/Intermedio/Avanzado)
- Mapeo nivel → categorías: Básico → `[movilidad, tecnica, core]`, Avanzado → `[saltabilidad, fuerza, pliometria]`, Todos/Intermedio → sin filtro de categoría
- Validación en tiempo real: si el pool no tiene suficientes ejercicios con los filtros actuales, muestra aviso y deshabilita "Generar"
- Botón "Generar" con ícono shuffle

**Fase Preview:**
- Tarjetas de ejercicio con: índice numerado, nombre, `MuscleGroupBadge` coloreado, botón de video (si tiene `video_id`), botón "Reemplazar"
- **3 steppers editables por ejercicio**: Series (1–10), Reps (1–100) o Tiempo en segundos (5–300s, paso ±5s) según tipo, Descanso (0–300s, paso ±15s)
- **"Reemplazar"**: busca en el pool un ejercicio del mismo grupo muscular → si no hay, mismo `category` → si no hay, cualquier no seleccionado
- **"Nueva rutina"** (header): regenera toda la selección con los filtros originales
- `VideoModal` para previsualizar ejercicio (expo-video)
- Tiempo estimado en el header
- Barra inferior con:
  - **"Guardar rutina"** (outline): abre `SaveModal` → nombre + toggle comunidad → guarda en `@volleytip/my_routines` → `router.back()`
  - **"Empezar ahora"** (filled): igual pero al guardar navega directamente a `routine/{id}`

**Save Modal (pageSheet):**
- `TextInput` para nombre (default: `t('routines.generator.defaultName')`)
- Switch "Compartir con la comunidad"
- Usa la misma clave `routines.builder.saveRoutine` para reutilizar traducción

**Integración:**
- Guarda en el mismo formato `Routine` / `RoutineExercise` que `routine-builder.tsx` → compatible con `routine/[id].tsx` sin cambios
- ID generado: `routine-gen-${Date.now()}`
- Nivel en AsyncStorage: `basico` / `avanzado` / `intermedio` según filtro seleccionado
- Función `pickExercises` y `swapExercise` son puras (sin side effects) → fácil de migrar a Supabase

**i18n (11 nuevas claves bajo `routines.generator`):**
`title`, `surpriseMe`, `muscleGroup`, `count`, `level`, `generate`, `regenerate`, `replace`, `startNow`, `defaultName`, `noExercisesTitle`, `noExercisesMsg`

---

## 4. Extras y Bugfixes Post-M14

### ✅ Login con username
- `signIn(emailOrUsername)`: si no tiene `@` → llama RPC `find_email_by_username` en Supabase
- `signUp` guarda `username` en tabla `users` (campo ya existente en el schema)
- Login screen: campo "Email o usuario", sin `keyboardType="email-address"`
- Register screen: campo adicional de username con validación `/^[a-zA-Z0-9_]{3,20}$/`
- TypeScript: `(supabase as any).rpc(...)` y `(supabase.from('users') as any).update(...)` necesarios por limitación del tipo generado con supabase-js v2.105.4

### ✅ Auth store robustez (pantalla blanca corregida)
- Módulo-level `_initCalled` evita doble init de React StrictMode
- Timeout 5s: si `getSession()` cuelga → signOut + `settle(null)` → UI desbloqueada
- Validación expiración: si `session.expires_at < now` → `refreshSession()` silencioso
- `settled` flag previene race conditions entre timeout y resolución normal
- `try-catch` en `onAuthStateChange`: cualquier error → signOut automático
- En `__DEV__`: `AppState.addEventListener` re-verifica sesión al volver al foreground

### ✅ Social links en Perfil
Sección "Seguinos" con Instagram, TikTok, X (Twitter) y sitio web.
`expo-linking` para abrir URLs. Color cambia a cyan al presionar.

### ✅ Bugfixes generales
- `allowsFullscreen` eliminado de `VideoView` (prop deprecated en expo-video)
- Chips de categoría en modal de ejercicios: `flex: 1` + `flexShrink: 0` + `numberOfLines={1}`
- Stats (Mis rutinas) se actualizan al volver al tab con `useFocusEffect`
- "Contenido no encontrado" al ejecutar rutinas propias: `routine/[id].tsx` busca en AsyncStorage
- Safe area top en `AddExerciseModal`: `paddingTop: insets.top` para que el botón no quede bajo la status bar en Android

---

## 5. Decisiones Técnicas Importantes

### TypeScript con supabase-js v2.105.4
Las funciones `rpc()` y `.from().update()` de Supabase requieren casteo `as any` cuando
los tipos `Database['public']['Functions']` o las columnas no están correctamente inferidos.
Esto es una limitación conocida de la versión actual del SDK, no un error de código.

### Expo Go vs Dev Build
- El proyecto corre en **Expo Dev Client** durante desarrollo
- `react-native-purchases` (RevenueCat) requiere native code → stub mode automático
- En stub mode, la compra simula 1.2s y retorna éxito → flujo UI completo testeable sin dev build

### Máquina de estados para workout/rutinas
`useReducer` con fases `intro → exercise → rest → complete`.
`restAfterLastSet: boolean` determina si al terminar el descanso avanza ejercicio o serie.

### Arquitectura de estado
- **Zustand** para estado global (auth, language, purchases)
- **AsyncStorage** para persistencia local: progreso workouts, rutinas del usuario
- **Supabase** como fuente de verdad del servidor
- **TanStack Query** para server state con caché (staleTime 5min)

### Compras — Supabase como fuente de verdad
`fetchOwnedCourseIds` siempre lee de tabla `purchases` de Supabase (no de RC).

### R2 — activación sin cambios de código
Solo agregar `R2_PUBLIC_URL` en `.env.production` y subir archivos al bucket.

### Infinite render loop en courses/[id].tsx (ya corregido)
Constante módulo-nivel `EMPTY_PROGRAM = { weeks: [] }` + `useMemo` para estabilizar referencia.

---

## 6. Servicios Externos

### Supabase ✅ Configurado y funcionando
- **Auth activo:** Email/Password ✅, Username lookup ✅
- **Auth pendiente:** Google OAuth ⏳
- **RLS:** activado en todas las tablas
- **Triggers:** 2 (crear perfil en `users` al registrarse)
- **SQL corrido en dev y prod:** username column + `find_email_by_username` RPC (Sección 9 del seed.sql)

### RevenueCat ⏳ SDK integrado — cuenta y productos pendientes
- **Instalar paquete:** `npx expo install react-native-purchases`
- **Pasos pendientes:**
  1. Crear proyecto en app.revenuecat.com
  2. Configurar App Store Connect (iOS) y Google Play (Android)
  3. Crear productos: `volleytip_course_{courseId}` por cada curso
  4. Copiar API Keys a `.env.development` y `.env.production`
- **Bundle IDs:** dev `com.volleytip.app.dev`, prod `com.volleytip.app`

### Cloudflare R2 ❌ No creado — código listo
- **Variable:** `R2_PUBLIC_URL` en `.env.*` (vacío en dev → usa sample videos de Google)
- **Pasos:** crear bucket `volleytip-videos`, activar acceso público, subir videos con paths exactos de `video_key`, agregar `R2_PUBLIC_URL` a `.env.production`

---

## 7. Estructura de Archivos Clave

```
volleytip-app/
├── app/
│   ├── _layout.tsx              ← Root layout: fonts, i18n, auth, RC, purchases init
│   ├── (auth)/
│   │   ├── login.tsx            ← Login con email o username
│   │   ├── register.tsx         ← Registro con email + username
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← Tab navigator (5 tabs)
│   │   ├── index.tsx            ← Home: stats, thumbnails, Supabase data, TanStack Query
│   │   ├── videos/
│   │   │   ├── index.tsx        ← Biblioteca con search y filtros
│   │   │   └── [id].tsx         ← Reproductor con expo-video
│   │   ├── courses/
│   │   │   ├── index.tsx        ← Lista de cursos
│   │   │   └── [id].tsx         ← Detalle con WeekAccordion + paywall
│   │   ├── routines/
│   │   │   └── index.tsx        ← Comunidad / Guardadas / Mis rutinas
│   │   └── profile.tsx          ← Perfil, avatar, stats, social links
│   ├── workout/[id].tsx         ← Ejecución día de programa (máquina de estados)
│   ├── routine/[id].tsx         ← Ejecución rutina libre
│   ├── routine-builder.tsx      ← Creador de rutinas con steppers, badges, preview video
│   └── routine-generator.tsx    ← Generador aleatorio: config + preview + save/start
│
├── src/
│   ├── components/ui/           ← Text, Button, Card, Chip, ProgressBar, SkeletonLoader
│   ├── data/
│   │   ├── videos.mock.ts       ← 9 videos con video_key y thumbnail_key para R2
│   │   ├── courses.mock.ts      ← 3 cursos (2 programas + 1 colección)
│   │   ├── routines.mock.ts     ← 5 rutinas de comunidad
│   │   └── exercises.mock.ts    ← 30 ejercicios con muscle_group asignado
│   ├── features/
│   │   ├── home/                ← TanStack Query hooks, home.service.ts, types
│   │   └── profile/             ← profile.service.ts (updateProfile, uploadAvatar)
│   ├── lib/
│   │   ├── supabase.ts          ← Cliente con AsyncStorage
│   │   ├── config.ts            ← Lee expoConfig.extra
│   │   ├── revenuecat.ts        ← Wrapper SDK con stub mode
│   │   ├── r2.ts                ← resolveVideoUrl / resolveThumbnailUrl
│   │   ├── query-client.ts      ← QueryClient singleton (staleTime 5min)
│   │   └── activity.ts          ← recordActivityDate() + calculateStreak()
│   ├── store/
│   │   ├── auth.store.ts        ← Session, user, initialize con timeout + robustez
│   │   ├── language.store.ts    ← language, setLanguage
│   │   └── purchases.store.ts   ← ownedCourseIds, hasAccess, buyCourse
│   ├── services/
│   │   ├── auth.service.ts      ← signIn (email o username), signUp, signOut, fetchUserProfile
│   │   ├── videos.service.ts
│   │   ├── courses.service.ts
│   │   ├── routines.service.ts
│   │   └── purchases.service.ts
│   ├── theme/                   ← colors, typography, spacing, radius
│   ├── i18n/locales/
│   │   ├── en.ts                ← Fuente de tipos
│   │   └── es.ts                ← Implementa typeof en
│   └── types/database.types.ts  ← 14 tablas + helpers + Functions (find_email_by_username)
│
├── supabase/seed.sql            ← Schema completo + datos mock + SQL de username (Sección 9)
├── app.config.ts                ← Multi-env, plugins, extra credentials
├── .env.development             ← NO en git
├── .env.production              ← NO en git
└── PROGRESS.md
```

---

## 8. Al Retomar — Leer Esto Primero

### Comandos para correr el proyecto
```bash
npm start                # Expo Dev Client, ambiente development
npm run start:go         # Expo Go (fallback, sin native modules)
npm run build:android:dev  # Nuevo APK de desarrollo vía EAS
npx tsc --noEmit         # Verificar tipos TypeScript
```

### Variables de entorno (.env.development)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
REVENUECAT_IOS_KEY=          # Vacío → stub mode activo
REVENUECAT_ANDROID_KEY=      # Vacío → stub mode activo
R2_PUBLIC_URL=               # Vacío en dev → usa sample videos de Google
```

### Si la app aparece en pantalla blanca
1. Presionar `r` en Metro para reload
2. Si persiste: `npx expo start --clear`
3. Si sigue: verificar que `.env.development` existe con `SUPABASE_URL` y `SUPABASE_ANON_KEY`
4. El auth store tiene timeout de 5s y manejo de errores robusto — nunca debería quedar colgado

### Estado de cada pantalla
| Pantalla | Estado | Notas |
|---|---|---|
| Login | ✅ | Email o username, Google OAuth pendiente |
| Register | ✅ | Con campo username (3-20 chars, solo letras/números/_) |
| Forgot Password | ✅ | — |
| Home | ✅ | Thumbnails visibles, datos Supabase, TanStack Query |
| Videos — biblioteca | ✅ | Mock data, player funciona |
| Videos — reproductor | ✅ | expo-video, pausa al salir |
| Cursos — lista | ✅ | Mock data |
| Cursos — detalle + paywall | ✅ | Paywall en stub mode |
| Workout — ejecución | ✅ | Máquina de estados completa |
| Rutinas — lista | ✅ | 3 tabs, búsqueda, likes, botón "Sorpréndeme" |
| Rutina libre — ejecución | ✅ | Busca en AsyncStorage para rutinas propias |
| Creador de rutinas | ✅ | Steppers sets/reps/tiempo/descanso, badges músculo, preview video, toggle para quitar |
| **Generador de rutinas** | ✅ | Config + preview + steppers + replace + save/start |
| Perfil | ✅ | Avatar upload, stats, cursos comprados, idioma, social links |

### Qué usa datos reales de Supabase vs mock
| Dato | Fuente actual | Fuente final |
|---|---|---|
| Usuarios / sesiones | ✅ Supabase Auth | — |
| Compras de cursos | ✅ Supabase `purchases` | — |
| Videos | ⚠️ Mock | Supabase `videos` |
| Cursos | ⚠️ Mock | Supabase `courses` |
| Rutinas comunidad | ⚠️ Mock | Supabase `routines` |
| Ejercicios | ⚠️ Mock | Supabase `exercises` |
| Progreso workouts | ⚠️ AsyncStorage | Supabase `user_progress` (futuro) |

---

## 9. Próximas Tareas Disponibles

### 🔲 Conectar datos reales de Supabase (prioridad alta)
Estrategia: cada servicio hace query real y usa `data ?? MOCK_DATA` como fallback.
- `videos.service.ts` → tabla `videos` (filtros por categoría, búsqueda)
- `courses.service.ts` → tablas `courses`, `course_modules`, `module_items`
- `routines.service.ts` → tablas `routines`, `routine_exercises`, `routine_likes`
- `exercises` → tabla `exercises` (hoy solo se usan en builder y generator desde mock)
- El seed.sql ya tiene el schema completo + datos mock para poblar Supabase
- `routine-generator.tsx`: la función `pickExercises` ya está separada, fácil de migrar a query Supabase

**SQL pendiente (ejecutar en Supabase):**
```sql
-- Actualizar URLs de video en tabla videos (reemplazar URLs dummy por sample videos funcionales)
-- Ver script en conversación anterior (5 Google CDN URLs distribuidas aleatoriamente)
```

### 🔲 Google OAuth
Paquetes instalados: `expo-auth-session`, `expo-web-browser`. Código en `auth.service.ts` ya escrito.
1. Crear OAuth app en Google Cloud Console → obtener Client ID
2. Supabase Dashboard → Auth → Providers → Google → activar + pegar credenciales
3. Agregar redirect URI `volleytip://` en Google Cloud Console y en Supabase

### 🔲 RevenueCat real
1. `npx expo install react-native-purchases`
2. Crear proyecto y productos en app.revenuecat.com
3. Configurar App Store Connect + Google Play con IDs: `volleytip_course_{courseId}`
4. Copiar API Keys a `.env`
5. Nuevo EAS build para Android (stub mode funciona en Dev Client; RC real necesita native build)

### 🔲 Cloudflare R2 (videos en producción)
1. Crear bucket `volleytip-videos` en Cloudflare
2. Activar acceso público y copiar URL pública
3. Subir archivos MP4 con los paths exactos de `video_key` en `videos.mock.ts`
4. Agregar `R2_PUBLIC_URL=https://videos.volleytip.app` a `.env.production`
5. Sin cambios de código (ya preparado)

### 🔲 Supabase Storage bucket 'avatars'
Crear en Supabase Dashboard → Storage para que funcione el upload de avatar en Perfil.
Requiere nuevo APK dev para permisos de `expo-image-picker` en Android.

### 🔲 Logo y assets definitivos
- `assets/images/icon.png` (1024×1024)
- `assets/images/splash.png`
- `assets/images/adaptive-icon.png` (foreground sobre `#111116`)

### 🔲 Notificaciones push (futuro)
Recordatorio diario de entrenamiento, aviso de streak, "nueva rutina en comunidad".
Usar `expo-notifications` + Supabase Edge Function para enviar desde servidor.

### 🔲 Guardado de rutinas en Supabase (futuro)
`routines` y `routine_exercises` ya tienen tablas. Hoy se guarda solo en AsyncStorage.
Migrar `routine-builder.tsx` y `routine-generator.tsx` para escribir también a Supabase cuando hay sesión activa.

### 🔲 Progreso de workouts en Supabase (futuro)
Hoy el progreso queda en AsyncStorage (`@volleytip/activity_dates`, `@volleytip/my_routines`).
Migrar a tabla `user_progress` para tener historial cross-device.
