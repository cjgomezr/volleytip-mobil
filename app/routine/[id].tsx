import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../../src/components/ui';
import { RoutineExercise } from '../../src/data/routines.mock';
import { getRoutineById } from '../../src/services/routines.service';
import { MOCK_VIDEOS } from '../../src/data/videos.mock';
import { resolveVideoUrl } from '../../src/lib/r2';
import { colors, fontFamily, fontSize, radius, spacing } from '../../src/theme';

// ── State machine ──────────────────────────────────────────────────────────

type Phase = 'intro' | 'exercise' | 'rest' | 'complete';

interface State {
  phase:            Phase;
  exerciseIdx:      number;
  currentSet:       number;
  restSecsLeft:     number;
  restAfterLastSet: boolean;
  startedAt:        number | null;
  setsCompleted:    number;
  videoModalOpen:   boolean;
}

type Action =
  | { type: 'START' }
  | { type: 'COMPLETE_SET'; totalExercises: number; exercise: RoutineExercise }
  | { type: 'TICK_REST' }
  | { type: 'SKIP_REST' }
  | { type: 'OPEN_VIDEO' }
  | { type: 'CLOSE_VIDEO' };

const INIT: State = {
  phase:            'intro',
  exerciseIdx:      0,
  currentSet:       1,
  restSecsLeft:     0,
  restAfterLastSet: false,
  startedAt:        null,
  setsCompleted:    0,
  videoModalOpen:   false,
};

function afterRest(s: State): State {
  return s.restAfterLastSet
    ? { ...s, phase: 'exercise', exerciseIdx: s.exerciseIdx + 1, currentSet: 1 }
    : { ...s, phase: 'exercise', currentSet: s.currentSet + 1 };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return { ...state, phase: 'exercise', startedAt: Date.now() };

    case 'COMPLETE_SET': {
      const lastSet = state.currentSet >= action.exercise.sets;
      const lastEx  = state.exerciseIdx >= action.totalExercises - 1;
      if (lastSet && lastEx) {
        return { ...state, phase: 'complete', setsCompleted: state.setsCompleted + 1 };
      }
      return {
        ...state,
        phase:            'rest',
        restSecsLeft:     action.exercise.rest_seconds,
        restAfterLastSet: lastSet,
        setsCompleted:    state.setsCompleted + 1,
      };
    }

    case 'TICK_REST':
      return state.restSecsLeft <= 1 ? afterRest(state) : { ...state, restSecsLeft: state.restSecsLeft - 1 };

    case 'SKIP_REST':
      return afterRest(state);

    case 'OPEN_VIDEO':
      return { ...state, videoModalOpen: true };

    case 'CLOSE_VIDEO':
      return { ...state, videoModalOpen: false };

    default:
      return state;
  }
}

// ── AsyncStorage keys ──────────────────────────────────────────────────────

const progressKey  = (id: string) => `@volleytip/routine_progress_${id}`;
const completedKey = (id: string) => `@volleytip/routine_done_count_${id}`;

// ── Pulse animation ────────────────────────────────────────────────────────

function usePulse() {
  const scale = useRef(new Animated.Value(1)).current;
  const loop  = useRef<Animated.CompositeAnimation | null>(null);

  function start() {
    loop.current?.stop();
    loop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.07, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.00, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.current.start();
  }

  function stop() {
    loop.current?.stop();
    scale.setValue(1);
  }

  return { scale, start, stop };
}

// ── Set circles ────────────────────────────────────────────────────────────

function SetCircles({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.circlesRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.circle,
            i < current - 1 && styles.circleDone,
            i === current - 1 && styles.circleActive,
          ]}
        />
      ))}
    </View>
  );
}

// ── Video modal ────────────────────────────────────────────────────────────

function VideoModal({ visible, url, onClose }: { visible: boolean; url: string | null; onClose: () => void }) {
  const player = useVideoPlayer(url ?? null, (p) => { p.loop = true; });

  useEffect(() => {
    if (visible && url) player.play();
    else player.pause();
  }, [visible, url]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.videoModalWrap}>
        <Pressable style={styles.videoModalClose} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <VideoView
          player={player}
          style={styles.videoModalPlayer}
          contentFit="contain"
          nativeControls
          allowsFullscreen
        />
      </View>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function RoutineExecutionScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { t }   = useTranslation();
  const insets  = useSafeAreaInsets();

  const routine = useMemo(() => getRoutineById(id ?? ''), [id]);
  const [state, dispatch] = useReducer(reducer, INIT);
  const pulse = usePulse();

  const exercises   = routine?.exercises ?? [];
  const currentEx   = exercises[state.exerciseIdx] as RoutineExercise | undefined;
  const currentVideo = currentEx?.video_id
    ? MOCK_VIDEOS.find((v) => v.id === currentEx.video_id)
    : undefined;

  // Pulse on rest
  useEffect(() => {
    if (state.phase === 'rest') pulse.start();
    else pulse.stop();
  }, [state.phase]);

  // Rest countdown
  useEffect(() => {
    if (state.phase !== 'rest') return;
    const interval = setInterval(() => dispatch({ type: 'TICK_REST' }), 1000);
    return () => clearInterval(interval);
  }, [state.phase]);

  // Progress save
  useEffect(() => {
    if (!id || state.phase === 'intro') return;
    if (state.phase === 'complete') {
      AsyncStorage.getItem(completedKey(id)).then((val) => {
        const count = parseInt(val ?? '0', 10) + 1;
        AsyncStorage.setItem(completedKey(id), String(count));
      });
      AsyncStorage.removeItem(progressKey(id));
    } else {
      AsyncStorage.setItem(progressKey(id), JSON.stringify(state));
    }
  }, [state, id]);

  // Android back intercept
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleQuit();
        return true;
      });
      return () => sub.remove();
    }, [state.phase]),
  );

  function handleQuit() {
    if (state.phase === 'complete') { router.back(); return; }
    Alert.alert(
      t('workout.quitConfirmTitle'),
      t('workout.quitConfirmMessage'),
      [
        { text: t('workout.quitConfirmNo'),  style: 'cancel' },
        { text: t('workout.quitConfirmYes'), style: 'destructive', onPress: () => router.back() },
      ],
    );
  }

  // ── Not found ────────────────────────────────────────────────────────
  if (!routine || exercises.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text variant="body" color={colors.textSecondary}>{t('errors.notFound')}</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{t('common.back')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Intro ────────────────────────────────────────────────────────────
  if (state.phase === 'intro') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={[styles.introScroll, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable onPress={handleQuit} style={[styles.introClose, { top: insets.top + 8 }]}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.introHeader}>
            <View style={styles.introIconWrap}>
              <Ionicons name="barbell-outline" size={48} color={colors.accent} />
            </View>
            <Text style={styles.introTitle}>{routine.title}</Text>
            <Text style={styles.introMeta}>
              {exercises.length} ejercicios · ~{routine.estimated_minutes} min
            </Text>
            <View style={styles.introAuthorRow}>
              <View style={styles.introAvatarSmall}>
                <Text style={styles.introAvatarInitial}>
                  {routine.author_name.charAt(0)}
                </Text>
              </View>
              <Text style={styles.introAuthor}>{routine.author_name}</Text>
            </View>
          </View>

          <View style={styles.introExList}>
            {exercises.map((ex, i) => (
              <View key={ex.id} style={styles.introExRow}>
                <View style={styles.introExNum}>
                  <Text style={styles.introExNumText}>{i + 1}</Text>
                </View>
                <View style={styles.introExInfo}>
                  <Text style={styles.introExName}>{ex.exercise_name}</Text>
                  <Text style={styles.introExDetail}>
                    {ex.duration_seconds > 0
                      ? `${ex.sets} series × ${ex.duration_seconds}s · ${ex.rest_seconds}s desc.`
                      : `${ex.sets} series × ${ex.reps} reps · ${ex.rest_seconds}s desc.`}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}
            onPress={() => dispatch({ type: 'START' })}
          >
            <Text style={styles.startBtnText}>{t('routines.start')}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Complete ─────────────────────────────────────────────────────────
  if (state.phase === 'complete') {
    const totalSecs = state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : 0;
    const mins      = Math.floor(totalSecs / 60);
    const secs      = totalSecs % 60;

    return (
      <View style={styles.celebBg}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.celebSafe}>
          <View style={styles.celebContent}>
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.celebTitle}>{t('workout.completedTitle')}</Text>
            <Text style={styles.celebSubtitle}>{routine.title}</Text>
            <View style={styles.celebStats}>
              <CelebStat label={t('workout.summary.time')}      value={`${mins}:${String(secs).padStart(2, '0')}`} />
              <CelebStat label={t('workout.summary.exercises')} value={String(exercises.length)} />
              <CelebStat label={t('workout.summary.sets')}      value={String(state.setsCompleted)} />
            </View>
            <Pressable
              style={({ pressed }) => [styles.celebBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.back()}
            >
              <Text style={styles.celebBtnText}>Volver a rutinas</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Exercise ─────────────────────────────────────────────────────────
  if (state.phase === 'exercise' && currentEx) {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

          <View style={styles.topBar}>
            <Pressable onPress={handleQuit} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.topBarCount}>{state.exerciseIdx + 1}/{exercises.length}</Text>
            <Pressable
              onPress={() => dispatch({ type: 'OPEN_VIDEO' })}
              hitSlop={8}
              style={currentVideo ? undefined : styles.disabledBtn}
              disabled={!currentVideo}
            >
              <Ionicons name="videocam-outline" size={22} color={colors.accent} />
            </Pressable>
          </View>

          <View style={styles.exMain}>
            <Text style={styles.exName}>{currentEx.exercise_name}</Text>

            <View style={styles.repsWrap}>
              <Text style={styles.repsNumber}>
                {currentEx.duration_seconds > 0 ? `${currentEx.duration_seconds}s` : currentEx.reps}
              </Text>
              {currentEx.duration_seconds === 0 && <Text style={styles.repsLabel}>reps</Text>}
            </View>

            <Text style={styles.setLabel}>
              {t('workout.setProgress', { current: state.currentSet, total: currentEx.sets })}
            </Text>
            <SetCircles total={currentEx.sets} current={state.currentSet} />

            {currentEx.note && (
              <View style={styles.noteWrap}>
                <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
                <Text style={styles.noteText}>{currentEx.note}</Text>
              </View>
            )}
          </View>

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={() =>
                dispatch({ type: 'COMPLETE_SET', totalExercises: exercises.length, exercise: currentEx })
              }
            >
              <Text style={styles.primaryBtnText}>
                {state.currentSet === currentEx.sets && state.exerciseIdx === exercises.length - 1
                  ? t('workout.finish')
                  : t('workout.setComplete')}
              </Text>
            </Pressable>
          </View>

          <VideoModal
            visible={state.videoModalOpen}
            url={resolveVideoUrl(currentVideo?.video_url, currentVideo?.video_key)}
            onClose={() => dispatch({ type: 'CLOSE_VIDEO' })}
          />
        </SafeAreaView>
      </View>
    );
  }

  // ── Rest ─────────────────────────────────────────────────────────────
  if (state.phase === 'rest') {
    const nextEx = state.restAfterLastSet
      ? exercises[state.exerciseIdx + 1]
      : exercises[state.exerciseIdx];

    return (
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

          <View style={styles.topBar}>
            <Pressable onPress={handleQuit} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.topBarCount}>{state.exerciseIdx + 1}/{exercises.length}</Text>
            <View style={{ width: 22 }} />
          </View>

          <View style={styles.restMain}>
            <Text style={styles.restTitle}>{t('workout.rest')}</Text>

            <Animated.View style={[styles.restTimerWrap, { transform: [{ scale: pulse.scale }] }]}>
              <Text style={styles.restTimer}>{state.restSecsLeft}</Text>
              <Text style={styles.restTimerUnit}>seg</Text>
            </Animated.View>

            {nextEx && (
              <View style={styles.nextExWrap}>
                <Text style={styles.nextExLabel}>{t('workout.nextExercise')}</Text>
                <Text style={styles.nextExName}>{nextEx.exercise_name}</Text>
                <Text style={styles.nextExDetail}>
                  {nextEx.duration_seconds > 0
                    ? `${nextEx.sets} × ${nextEx.duration_seconds}s`
                    : `${nextEx.sets} × ${nextEx.reps} reps`}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
              onPress={() => dispatch({ type: 'SKIP_REST' })}
            >
              <Text style={styles.skipBtnText}>{t('workout.skipRest')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return null;
}

function CelebStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.celebStat}>
      <Text style={styles.celebStatValue}>{value}</Text>
      <Text style={styles.celebStatLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  backBtn:  {
    backgroundColor: colors.accentDim,
    borderRadius: radius.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
  },
  backBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.base, color: colors.accent },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    height: 52,
  },
  topBarCount: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  disabledBtn: { opacity: 0.3 },

  // ── Intro ─────────────────────────────────────────────────────────────
  introScroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing['4xl'],
  },
  introClose: {
    position: 'absolute',
    right: spacing.screen,
  },
  introHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  introIconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  introTitle: {
    fontFamily: fontFamily.black,
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
  },
  introMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  introAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  introAvatarSmall: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introAvatarInitial: { fontFamily: fontFamily.bold, fontSize: 11, color: colors.accent },
  introAuthor: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textTertiary },

  introExList: { gap: spacing.sm, marginBottom: spacing['3xl'] },
  introExRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  introExNum: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introExNumText: { fontFamily: fontFamily.bold, fontSize: fontSize.sm, color: colors.accent },
  introExInfo:    { flex: 1, gap: 2 },
  introExName:    { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.textPrimary },
  introExDetail:  { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textSecondary },

  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.bgPrimary },

  // ── Exercise ──────────────────────────────────────────────────────────
  exMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    gap: spacing.xl,
  },
  exName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  repsWrap:   { alignItems: 'center', gap: 4 },
  repsNumber: { fontFamily: fontFamily.black, fontSize: 96, color: colors.accent, lineHeight: 108 },
  repsLabel:  { fontFamily: fontFamily.medium, fontSize: fontSize['2xl'], color: colors.textSecondary },
  setLabel:   { fontFamily: fontFamily.regular, fontSize: fontSize.base, color: colors.textSecondary },

  circlesRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  circle:     { width: 18, height: 18, borderRadius: radius.full, borderWidth: 2, borderColor: colors.border },
  circleDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  circleActive: { borderColor: colors.accent },

  noteWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.accentDim,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 320,
  },
  noteText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.accent,
    lineHeight: 18,
  },

  // ── Rest ──────────────────────────────────────────────────────────────
  restMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
  },
  restTitle:    { fontFamily: fontFamily.bold, fontSize: fontSize['2xl'], color: colors.textPrimary },
  restTimerWrap: {
    width: 160, height: 160,
    borderRadius: radius.full,
    borderWidth: 3, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accentDim,
  },
  restTimer:     { fontFamily: fontFamily.black, fontSize: 72, color: colors.accent, lineHeight: 80 },
  restTimerUnit: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.accent },

  nextExWrap:    { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.screen },
  nextExLabel:   { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
  nextExName:    { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textPrimary, textAlign: 'center' },
  nextExDetail:  { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textSecondary },

  // ── Bottom bar ────────────────────────────────────────────────────────
  bottomBar: { paddingHorizontal: spacing.screen, paddingTop: spacing.md },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.bgPrimary },
  skipBtn: {
    borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: radius.lg, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  skipBtnText: { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.textSecondary },

  // ── Celebration ───────────────────────────────────────────────────────
  celebBg:      { flex: 1, backgroundColor: '#0a1a1a' },
  celebSafe:    { flex: 1 },
  celebContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.screen, gap: spacing.lg },
  trophy:       { fontSize: 80, lineHeight: 96 },
  celebTitle:   { fontFamily: fontFamily.black, fontSize: fontSize['3xl'], color: colors.accent, textAlign: 'center' },
  celebSubtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.lg, color: colors.textSecondary, textAlign: 'center' },
  celebStats:   { flexDirection: 'row', gap: spacing['2xl'], marginTop: spacing.xl, marginBottom: spacing.xl },
  celebStat:    { alignItems: 'center', gap: spacing.xs },
  celebStatValue: { fontFamily: fontFamily.black, fontSize: fontSize['2xl'], color: colors.textPrimary },
  celebStatLabel: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  celebBtn:     {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingHorizontal: spacing['4xl'],
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.bgPrimary },

  // ── Video modal ───────────────────────────────────────────────────────
  videoModalWrap: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  videoModalClose: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36, height: 36,
    borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  videoModalPlayer: { width: '100%', height: 280 },
});
