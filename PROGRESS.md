# VolleyTip — Estado del Proyecto

Última actualización: 2026-05-10 — Módulos completados: M1–M13

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
| expo-localization | 17.0.8 | Detección idioma dispositivo |
| react-native-gesture-handler | 2.28.0 | Gestos |
| react-native-reanimated | 4.1.1 | Animaciones |
| react-native-safe-area-context | 5.6.0 | Safe areas |
| @expo-google-fonts/roboto | 0.4.3 | Tipografía Roboto |
| @react-native-async-storage/async-storage | 2.2.0 | Persistencia local |
| react-native-purchases | pendiente instalar | RevenueCat — pagos |
| cross-env | 10.1.0 | Scripts multi-env |
| dotenv | 17.4.2 | Variables de entorno |

**Directorio:** `C:\Users\user\Documents\volleytip-mobilapp\volleytip-app`

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
- **Idiomas:** Español + Inglés, auto-detect idioma del dispositivo + override manual, keys tipados con TypeScript

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

### ✅ M5 — Autenticación (email)
`src/store/auth.store.ts` con Zustand: `session`, `user`, `initialized`.
`initialize()` con `.catch(() => set({ initialized: true }))` failsafe — la app nunca
queda bloqueada si Supabase falla o la red no está disponible.
`useProtectedRoute` hook para redirección automática login ↔ tabs.
Pantallas: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(auth)/forgot-password.tsx`.
`supabase.auth.onAuthStateChange` mantiene sesión sincronizada en tiempo real.
**Google OAuth: deliberadamente postergado** — ver sección de Módulos Pendientes.

### ✅ M6 — Navegación base (Tab Bar)
5 tabs: Home / Videos / Cursos / Rutinas / Perfil.
`app/(tabs)/_layout.tsx` con Ionicons, colores del tema, `GestureHandlerRootView`.

### ✅ M7 — Módulo de Videos
`src/data/videos.mock.ts` — 9 videos mock con categorías, niveles, `video_key` y `thumbnail_key`
para R2 (ver M12). En dev usa sample videos públicos como fallback.
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
- **Fix infinite loop:** `EMPTY_PROGRAM` constante módulo-nivel + `useMemo` para estabilizar
  la referencia cuando el curso no es `training_program`
- Paywall integrado (M11): CTA dinámico Iniciar/Comprar, días bloqueados sin acceso

### ✅ M9 — Ejecución de Workouts
`app/workout/[id].tsx` — máquina de estados completa con `useReducer`:
- Fases: `intro → exercise → rest → complete`
- `restAfterLastSet: boolean` determina si al acabar el descanso avanza ejercicio o serie
- `usePulseAnim()` hook: `Animated.loop` + `Animated.sequence` para el círculo del temporizador
- `VideoModal` sub-componente con `useVideoPlayer(url ?? null)` — null es `VideoSource` válido
- Persistencia en AsyncStorage: `@volleytip/workout_progress_${id}` (en progreso) y
  `@volleytip/day_done_${id}` (completado)
- Pantalla de celebración con estadísticas: tiempo total, ejercicios, series
- `useFocusEffect` + `BackHandler` para interceptar botón físico atrás en Android

`app/routine/[id].tsx` — misma arquitectura adaptada para rutinas libres (sin programa).
Persiste contador: `@volleytip/routine_done_count_${id}`.

### ✅ M10 — Creador de Rutinas + Comunidad
`src/data/exercises.mock.ts` — 30 ejercicios en 6 categorías:
`saltabilidad`, `fuerza`, `pliometria`, `tecnica`, `movilidad`, `core`.
Cada ejercicio tiene: sets/reps/duration/rest por defecto, video_id opcional, nota opcional.

`src/data/routines.mock.ts` — 5 rutinas de comunidad mock con autor, nivel, tags, likes.
`src/services/routines.service.ts` — `getCommunityRoutines` (con filtro y sort), `getSavedRoutines`, `getRoutineById`.
`src/components/routines/RoutineCard.tsx` — nivel con color (success/warning/error), duración,
avatar inicial del autor, likes count, botón bookmark.

`app/(tabs)/routines/index.tsx` — 3 tabs (Comunidad / Guardadas / Mis rutinas):
- Búsqueda de texto (solo en comunidad)
- Sort chips: más gustadas / más nuevas
- Like optimista con `Set<string>` (incrementa contador localmente)
- `useFocusEffect` recarga rutinas propias desde AsyncStorage al volver al tab

`app/routine-builder.tsx` — creador completo:
- `useReducer` con acciones: `SET_NAME`, `TOGGLE_PUBLIC`, `ADD_EXERCISE`, `REMOVE_EXERCISE`,
  `SET_SETS`, `MOVE_UP`, `MOVE_DOWN`
- Modal `AddExerciseModal` (pageSheet): búsqueda + filtro por categoría, checkbox para ya agregados
- `ExerciseRow`: flechas arriba/abajo para reordenar, stepper +/- de series (1–10), botón eliminar
- `Switch` para público/privado
- Estimación de minutos basada en series × (tiempo por set + descanso)
- Guarda en `@volleytip/my_routines` (AsyncStorage)

### ✅ M11 — RevenueCat (Pagos)
**Flujo:** usuario ve curso de pago → toca Comprar → paga una vez → acceso permanente.
El registro se guarda en la tabla `purchases` de Supabase (fuente de verdad).

`src/lib/revenuecat.ts` — wrapper del SDK con **stub mode automático**:
- `require('react-native-purchases')` en try/catch: si falla (Expo Go) → `_sdk = null`
- Cuando `_sdk === null`: todas las funciones son no-ops o retornan datos mock
- Stub de compra simula 1.2s de delay y retorna éxito → flujo de UI completo testeable en Expo Go
- Para pagos reales: dev build con EAS (`npm run build:ios`)

`src/services/purchases.service.ts`:
- `fetchOwnedCourseIds(userId)` — lee tabla `purchases` en Supabase
- `recordPurchase(userId, courseId, revenuecatId)` — inserta en `purchases`, ignora duplicados (error 23505)

`src/store/purchases.store.ts` (Zustand):
- `ownedCourseIds: Set<string>` — cargado desde Supabase al iniciar sesión
- `hasActiveSubscription: boolean` — siempre `false` hasta activar suscripciones
- `initialize(userId)` — carga desde Supabase + chequea suscripción activa en RC
- `buyCourse(courseId)` — llama RC → guarda en Supabase → actualiza store
- `restorePurchases(userId)` — llama RC restore → recarga desde Supabase
- `hasAccess(courseId, isFree)` — `isFree || ownedCourseIds.has(id) || hasActiveSubscription`
- `reset()` — limpia estado al cerrar sesión

`src/components/paywall/CoursePaywall.tsx` — modal bottom-sheet:
- Precio real desde App Store (RC) con fallback a `price_usd` del mock
- 4 beneficios con checkmarks
- Botón "Comprar — $X.XX" con `ActivityIndicator` durante el proceso
- "Restaurar compras" (requerido por App Store guidelines)
- Texto legal "Pago único · Sin suscripción · Acceso permanente"

`app/(tabs)/courses/[id].tsx` — integrado:
- `canAccess = hasAccess(course.id, course.is_free)` decide qué CTA mostrar
- CTA: botón Iniciar/Continuar (cyan) si tiene acceso, botón Comprar (gris + 🔒) si no
- `WeekAccordion` recibe `canAccess` — oculta botones de día si no hay acceso

`app/_layout.tsx` — inicialización:
- `configureRevenueCat()` al montar
- `loginRevenueCat(userId)` + `initializePurchases(userId)` cuando cambia la sesión
- `resetPurchases()` al cerrar sesión

**Convención de product IDs RevenueCat:**
- Curso: `volleytip_course_{courseId_sanitizado}` (ej: `volleytip_course_6weeks_jump`)
- Suscripción mensual: `volleytip_monthly` (definido, NO expuesto en UI — activar en versión futura)
- Suscripción anual: `volleytip_annual` (definido, NO expuesto en UI)

### ✅ M12 — Cloudflare R2 (Infraestructura de Videos)
`src/lib/r2.ts` — resolver de URLs, dos funciones públicas:
- `resolveVideoUrl(video_url, video_key)` → si `R2_PUBLIC_URL` configurado y `video_key` existe,
  devuelve `${R2_PUBLIC_URL}/${video_key}`; si no, devuelve `video_url` (fallback dev)
- `resolveThumbnailUrl(thumbnail_url, thumbnail_key)` — misma lógica para thumbnails
- `r2Url(key)` — helper interno para construir la URL completa

`VideoItem` (en `videos.mock.ts`) tiene dos campos nuevos en cada entrada:
- `video_key: string` — ruta canónica en el bucket (ej: `saltabilidad/v1-salto-vertical-fundamentos.mp4`)
- `thumbnail_key: string` — ruta del thumbnail (ej: `thumbnails/v1-salto-vertical-fundamentos.jpg`)

Los tres reproductores usan `resolveVideoUrl` en lugar de `video_url` directo:
- `app/(tabs)/videos/[id].tsx` → `resolveVideoUrl(video.video_url, video.video_key)`
- `app/workout/[id].tsx` → `resolveVideoUrl(currentVideo?.video_url, currentVideo?.video_key)`
- `app/routine/[id].tsx` → `resolveVideoUrl(currentVideo?.video_url, currentVideo?.video_key)`

`src/lib/config.ts` y `app.config.ts` exponen `r2PublicUrl` desde `R2_PUBLIC_URL` env var.

**Para activar R2 en producción (sin cambios de código):**
1. Crear bucket `volleytip-videos` en Cloudflare R2
2. Activar acceso público o configurar custom domain (`videos.volleytip.app`)
3. Subir videos con los paths exactos de `video_key` de cada `VideoItem`
4. Agregar `R2_PUBLIC_URL=https://videos.volleytip.app` a `.env.production`
5. Listo

**Rutas de video en el bucket (para subir):**
```
saltabilidad/v1-salto-vertical-fundamentos.mp4
saltabilidad/v2-salto-potencia-cajon.mp4
saltabilidad/v3-drop-jumps-reactividad.mp4
fuerza/v4-sentadillas-voley.mp4
fuerza/v5-press-militar-mancuernas.mp4
potencia/v6-pliometria-brazos-remate.mp4
elasticidad/v7-estiramiento-cadera-cadena-posterior.mp4
tecnica/v8-voleo-posicion-manos-contacto.mp4
tecnica/v9-remate-aproximacion-salto.mp4

thumbnails/v1-salto-vertical-fundamentos.jpg
thumbnails/v2-salto-potencia-cajon.jpg
... (mismo patrón para el resto)
```

**Para signed URLs (futuro):** reemplazar el cuerpo de `resolveVideoUrl` en `r2.ts`
con una llamada async a Supabase Edge Function. El código que llama no necesita cambios.

---

## 4. Módulos Pendientes

### ✅ M13 — Home con datos reales de Supabase
`app/(tabs)/index.tsx` actualmente es un placeholder. Reemplazarlo con:
- Saludo personalizado con nombre del usuario (de `auth.store`)
- Videos destacados — query a tabla `videos` de Supabase, ordenados por `created_at`
- Mis cursos en progreso — join `purchases` + `user_progress` para mostrar % completado
- Rutinas recientes de la comunidad — query a `routines` con `is_public = true`
- Skeleton loaders mientras carga (componente `SkeletonCard`)
Crear `src/services/home.service.ts` con las queries correspondientes.

### M14 — Perfil de usuario ← PRÓXIMO
`app/(tabs)/profile.tsx` actualmente es un placeholder. Implementar:
- Avatar con `expo-image`, upload a Supabase Storage con `expo-image-picker`
- Nombre y email del usuario
- Stats: cursos completados, rutinas creadas, tiempo total entrenado (de AsyncStorage)
- Mis compras — lista de cursos adquiridos (de `purchases` store)
- Selector de idioma (es/en) usando `changeLanguage` del language store
- Botón cerrar sesión → `signOut()` + `resetPurchases()`
Crear `src/services/profile.service.ts`.

### Extra — Login con Google OAuth
Postergado del M5. Paquetes ya instalados: `expo-auth-session`, `expo-web-browser`.
Pasos pendientes:
1. Crear OAuth app en Google Cloud Console, obtener `CLIENT_ID`
2. En Supabase Dashboard → Auth → Providers → Google → activar + pegar Client ID y Secret
3. Agregar redirect URI: `volleytip://` en Google Cloud Console y en Supabase
4. Implementar el flujo en `src/services/auth.service.ts` → `signInWithGoogle()`
   (el método ya existe en `auth.store.ts`, solo falta conectarlo)

### Extra — Logo real de VolleyTip
Reemplazar assets placeholder con los definitivos:
- `assets/images/icon.png` — ícono de app (1024×1024 px)
- `assets/images/splash.png` — pantalla de splash
- `assets/images/adaptive-icon.png` — ícono adaptativo Android (foreground sobre fondo `#111116`)
El fondo del splash ya está configurado en `#111116` en `app.config.ts`.

### Extra — Reemplazar datos mock con contenido real
Cuando el contenido real esté cargado en Supabase:
- `src/data/videos.mock.ts` → `src/services/videos.service.ts` hace query real a `videos`
- `src/data/courses.mock.ts` → query a `courses` + `course_modules` + `module_items`
- `src/data/routines.mock.ts` → query a `routines` + `routine_exercises`
- `src/data/exercises.mock.ts` → query a `exercises`
Estrategia sugerida: mantener los mocks como fallback si Supabase no tiene datos,
usando `data ?? MOCK_DATA` en cada servicio.

---

## 5. Decisiones Técnicas Importantes

### Pantalla blanca al iniciar (bug conocido — ya corregido)
**Causa:** `supabase.auth.getSession().then(...)` sin `.catch()`. Si la promesa rechaza
(sin red, URL vacía, storage corrupto), `initialized` nunca se pone en `true` y
`_layout.tsx` retorna `null` permanentemente → pantalla blanca.
**Fix aplicado:** `.catch(() => set({ initialized: true }))` en `auth.store.ts`.
**Fix adicional:** `return null` → `return <View style={{ backgroundColor: '#111116' }} />`
para eliminar el flash blanco durante la carga normal.
**Si vuelve a pasar:** presionar `r` en Metro, o `npx expo start --clear`.

### Expo Go vs Dev Build
- El proyecto corre en **Expo Go** durante desarrollo
- `react-native-purchases` (RevenueCat) requiere native code → usa **stub mode automático**:
  `require('react-native-purchases')` en try/catch; si falla → `_sdk = null` → stubs activos
- En stub mode, la compra simula 1.2s y retorna éxito → flujo de UI completo testeable sin dev build
- Para pagos reales se necesita build con EAS: `npm run build:ios`

### Máquina de estados para workout/rutinas
`useReducer` con fases `intro → exercise → rest → complete`.
`restAfterLastSet: boolean` en el estado determina si al terminar el descanso
avanza al siguiente ejercicio (true) o a la siguiente serie del mismo ejercicio (false).
Esto evita la complejidad de manejar dos timers simultáneos.

### Infinite render loop en courses/[id].tsx (ya corregido)
`useDayStatuses(course)` recibía `{ weeks: [] }` como nuevo objeto en cada render
cuando el curso no era `training_program` → `useEffect([course])` se re-ejecutaba infinitamente.
**Fix:** constante módulo-nivel `const EMPTY_PROGRAM = { weeks: [] }` + `useMemo` para
que la referencia solo cambie cuando `course` cambie.

### Arquitectura de estado
- **Zustand** para estado global (auth, language, purchases) — stores en `src/store/`
- **AsyncStorage** para persistencia local: progreso de workouts, rutinas creadas por el usuario
- **Supabase** como fuente de verdad del servidor: usuarios, compras, contenido

### Compras — Supabase como fuente de verdad
RevenueCat procesa la transacción con el App Store; Supabase guarda el registro permanente.
`fetchOwnedCourseIds` siempre lee de la tabla `purchases` de Supabase (no de RC).
Esto permite que usuarios accedan a sus compras aunque RC esté caído o la cuenta cambie.

### R2 — activación sin cambios de código
`resolveVideoUrl` en `r2.ts` es transparente: si `R2_PUBLIC_URL` está vacío devuelve
el fallback, si está configurado devuelve la URL de R2. Para activar en producción
solo se agrega la variable de entorno y se suben los archivos. Cero cambios de código.

### Suscripciones — estructura lista, no activada
`SUBSCRIPTION_PRODUCT_IDS`, `checkActiveSubscription()` y `hasActiveSubscription` en el store
están definidos y conectados. `hasActiveSubscription` siempre es `false` por ahora.
Para activar suscripciones: solo cambiar `checkActiveSubscription()` para que verifique
entitlements reales en RC. El resto del código (paywall, acceso) ya lo soporta.

### Internacionalización
Keys tipados: `t('nav.home')` da error de TypeScript si el key no existe en `en.ts`.
`en.ts` es la fuente de tipos; `es.ts` implementa `typeof en` → TypeScript garantiza
que ambos archivos estén sincronizados.

---

## 6. Servicios Externos

### Supabase ✅ Configurado y funcionando
- **Variables:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` en `.env.*`
- **Auth activo:** Email/Password ✅
- **Auth pendiente:** Google OAuth ⏳
- **RLS:** activado en todas las tablas
- **Triggers:** 2 (ej: crear perfil en `users` al registrarse)
- **Dashboard:** https://supabase.com/dashboard

### RevenueCat ⏳ SDK integrado — cuenta y productos pendientes
- **Variables:** `REVENUECAT_IOS_KEY`, `REVENUECAT_ANDROID_KEY` en `.env.*`
- **Instalar paquete:** `npx expo install react-native-purchases`
- **Pasos pendientes en RC Dashboard:**
  1. Crear proyecto en app.revenuecat.com
  2. Configurar App Store Connect (iOS) y Google Play (Android)
  3. Crear productos: un producto por curso con ID `volleytip_course_{courseId}`
  4. (Futuro) Crear suscripciones: `volleytip_monthly` y `volleytip_annual`
  5. Copiar API Keys a `.env.development` y `.env.production`
- **Bundle IDs:** dev `com.volleytip.app.dev`, prod `com.volleytip.app`

### Cloudflare R2 ❌ No creado aún — código listo
- **Variable:** `R2_PUBLIC_URL` en `.env.*` (vacío en dev → usa sample videos)
- **Pasos pendientes:**
  1. Crear cuenta Cloudflare si no existe
  2. Activar R2 Storage → crear bucket `volleytip-videos`
  3. Configurar CORS: `AllowedOrigins: ["*"]`, `AllowedMethods: ["GET"]`
  4. Activar acceso público o crear custom domain `videos.volleytip.app`
  5. Subir videos con los paths exactos de `video_key` (listados en M12 arriba)
  6. Agregar `R2_PUBLIC_URL=https://videos.volleytip.app` a `.env.production`
- **El código ya está listo** — solo falta el bucket y los archivos

---

## 7. Estructura de Archivos Clave

```
volleytip-app/
├── app/
│   ├── _layout.tsx              ← Root layout: fonts, i18n, auth, RC, purchases init
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← Tab navigator (5 tabs)
│   │   ├── index.tsx            ← Home (placeholder — M13 lo completa)
│   │   ├── videos/
│   │   │   ├── index.tsx        ← Biblioteca de videos con search y filtros
│   │   │   └── [id].tsx         ← Reproductor con expo-video
│   │   ├── courses/
│   │   │   ├── index.tsx        ← Lista de cursos con search y filtros
│   │   │   └── [id].tsx         ← Detalle con WeekAccordion + paywall integrado
│   │   ├── routines/
│   │   │   └── index.tsx        ← Comunidad / Guardadas / Mis rutinas (3 tabs)
│   │   └── profile.tsx          ← Perfil (placeholder — M14 lo completa)
│   ├── workout/[id].tsx         ← Ejecución de día de programa (máquina de estados)
│   ├── routine/[id].tsx         ← Ejecución de rutina libre (misma máquina)
│   └── routine-builder.tsx      ← Creador de rutinas con modal de ejercicios
│
├── src/
│   ├── components/
│   │   ├── ui/                  ← Text, Button, Card, Chip, ProgressBar, ScreenHeader, Badge
│   │   ├── videos/VideoCard.tsx
│   │   ├── courses/CourseCard.tsx
│   │   ├── routines/RoutineCard.tsx
│   │   └── paywall/CoursePaywall.tsx
│   ├── data/
│   │   ├── videos.mock.ts       ← 9 videos con video_key y thumbnail_key para R2
│   │   ├── courses.mock.ts      ← 3 cursos (2 programas + 1 colección)
│   │   ├── routines.mock.ts     ← 5 rutinas de comunidad
│   │   └── exercises.mock.ts    ← 30 ejercicios en 6 categorías
│   ├── hooks/
│   │   └── useProtectedRoute.ts ← Redirección automática login ↔ tabs
│   ├── i18n/
│   │   ├── index.ts             ← Init i18next, loadSavedLanguage, changeLanguage
│   │   └── locales/
│   │       ├── en.ts            ← Fuente de tipos para keys tipados
│   │       └── es.ts            ← Implementa typeof en
│   ├── lib/
│   │   ├── supabase.ts          ← Cliente Supabase con AsyncStorage
│   │   ├── config.ts            ← Lee Constants.expoConfig.extra (supabase, RC, R2)
│   │   ├── revenuecat.ts        ← SDK wrapper con stub mode automático para Expo Go
│   │   └── r2.ts                ← resolveVideoUrl / resolveThumbnailUrl para Cloudflare R2
│   ├── services/
│   │   ├── auth.service.ts      ← signIn, signUp, signOut, fetchUserProfile
│   │   ├── videos.service.ts    ← getVideoById, getAllVideos, getRelatedVideos
│   │   ├── courses.service.ts   ← getAllCourses, getCourseById, getWorkoutDay
│   │   ├── routines.service.ts  ← getCommunityRoutines, getSavedRoutines, getRoutineById
│   │   └── purchases.service.ts ← fetchOwnedCourseIds, recordPurchase (Supabase)
│   ├── store/
│   │   ├── index.ts             ← Re-exports: useAuthStore, useLanguageStore, usePurchasesStore
│   │   ├── auth.store.ts        ← session, user, initialized, initialize (con .catch failsafe)
│   │   ├── language.store.ts    ← language, setLanguage, syncFromI18n
│   │   └── purchases.store.ts   ← ownedCourseIds, hasAccess, buyCourse, restorePurchases
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── radius.ts
│   └── types/
│       └── database.types.ts    ← Tipado completo de Supabase (14 tablas + helpers)
│
├── app.config.ts                ← Multi-env (dev/prod), plugins, extra credentials
├── .env.development             ← NO en git — SUPABASE_*, REVENUECAT_*, R2_*
├── .env.production              ← NO en git — mismas variables, valores de producción
├── package.json
├── tsconfig.json
└── PROGRESS.md                  ← Este archivo
```

---

## 8. Al Retomar — Leer Esto Primero

### Próximo módulo: M13 — Home con datos reales
`app/(tabs)/index.tsx` es placeholder. Construir home real con:
- Videos destacados desde Supabase
- Cursos en progreso del usuario
- Rutinas recientes de la comunidad
- Bienvenida personalizada

### Comandos para correr el proyecto
```bash
npm start          # Expo Go, ambiente development
npm start:prod     # Expo Go, ambiente production
npm run build:ios  # EAS build para iOS (requiere cuenta Expo)
npx tsc --noEmit   # Verificar tipos TypeScript
```

### Variables de entorno (.env.development)
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
REVENUECAT_IOS_KEY=          # Vacío hasta crear cuenta RC → stub mode activo
REVENUECAT_ANDROID_KEY=      # Vacío hasta crear cuenta RC → stub mode activo
R2_PUBLIC_URL=               # Vacío en dev → usa sample videos de Google como fallback
```

### Si la app aparece en pantalla blanca
1. Presionar `r` en la terminal de Metro para forzar reload del bundle en el dispositivo
2. Si persiste: `npx expo start --clear` y volver a escanear el QR
3. Si sigue: verificar que `.env.development` existe y tiene `SUPABASE_URL` y `SUPABASE_ANON_KEY`

### Estado actual de cada pantalla
| Pantalla | Estado | Notas |
|---|---|---|
| Login / Register / Forgot password | ✅ Funcional | Auth real con Supabase |
| Videos — biblioteca | ✅ Funcional | Datos mock, player funciona |
| Videos — reproductor | ✅ Funcional | expo-video, pausa al salir |
| Cursos — lista | ✅ Funcional | Datos mock |
| Cursos — detalle + paywall | ✅ Funcional | Paywall en stub mode (simula compra) |
| Workout — ejecución | ✅ Funcional | Máquina de estados completa |
| Rutinas — lista | ✅ Funcional | 3 tabs, búsqueda, likes |
| Rutina libre — ejecución | ✅ Funcional | Misma máquina que workout |
| Creador de rutinas | ✅ Funcional | Guarda en AsyncStorage |
| Home | ⚠️ Placeholder | M13 lo completa con datos reales |
| Perfil | ⚠️ Placeholder | M14 lo completa |

### Qué usa datos reales de Supabase vs mock
| Dato | Fuente actual | Fuente final |
|---|---|---|
| Usuarios / sesiones | ✅ Supabase Auth | — |
| Compras de cursos | ✅ Supabase `purchases` | — |
| Videos | ⚠️ Mock | Supabase `videos` (Extra) |
| Cursos | ⚠️ Mock | Supabase `courses` (Extra) |
| Rutinas comunidad | ⚠️ Mock | Supabase `routines` (Extra) |
| Ejercicios | ⚠️ Mock | Supabase `exercises` (Extra) |
| Progreso workouts | ⚠️ AsyncStorage | Supabase `user_progress` (futuro) |
