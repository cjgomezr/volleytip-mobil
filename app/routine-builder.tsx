import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVideoPlayer, VideoView } from 'expo-video';

import { Text } from '../src/components/ui';
import {
  EXERCISE_CATEGORIES,
  ExerciseCategory,
  ExerciseItem,
  MOCK_EXERCISES,
} from '../src/data/exercises.mock';
import { MOCK_VIDEOS } from '../src/data/videos.mock';
import { resolveVideoUrl } from '../src/lib/r2';
import { colors, fontFamily, fontSize, radius, spacing } from '../src/theme';

// ── Builder state ──────────────────────────────────────────────────────────

interface BuilderExercise {
  uid:      string; // unique per row (same exercise can be added twice)
  exercise: ExerciseItem;
  sets:     number;
  reps:     number;
  duration: number; // seconds/set — only used when exercise is timed
  rest:     number; // rest seconds after each set
}

interface BuilderState {
  name:      string;
  exercises: BuilderExercise[];
  isPublic:  boolean;
}

type BuilderAction =
  | { type: 'SET_NAME';    name: string }
  | { type: 'TOGGLE_PUBLIC' }
  | { type: 'ADD_EXERCISE';    exercise: ExerciseItem }
  | { type: 'REMOVE_EXERCISE'; uid: string }
  | { type: 'SET_SETS';        uid: string; sets:     number }
  | { type: 'SET_REPS';        uid: string; reps:     number }
  | { type: 'SET_DURATION';    uid: string; duration: number }
  | { type: 'SET_REST';        uid: string; rest:     number }
  | { type: 'MOVE_UP';         uid: string }
  | { type: 'MOVE_DOWN';       uid: string };

const INIT_STATE: BuilderState = { name: '', exercises: [], isPublic: false };

let uidCounter = 0;

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.name };

    case 'TOGGLE_PUBLIC':
      return { ...state, isPublic: !state.isPublic };

    case 'ADD_EXERCISE': {
      const row: BuilderExercise = {
        uid:      `uid-${++uidCounter}`,
        exercise: action.exercise,
        sets:     action.exercise.default_sets,
        reps:     action.exercise.default_reps,
        duration: action.exercise.default_duration_seconds,
        rest:     action.exercise.default_rest_seconds,
      };
      return { ...state, exercises: [...state.exercises, row] };
    }

    case 'REMOVE_EXERCISE':
      return { ...state, exercises: state.exercises.filter((e) => e.uid !== action.uid) };

    case 'SET_SETS': {
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.uid === action.uid ? { ...e, sets: Math.max(1, Math.min(10, action.sets)) } : e,
        ),
      };
    }

    case 'SET_REPS': {
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.uid === action.uid ? { ...e, reps: Math.max(1, Math.min(100, action.reps)) } : e,
        ),
      };
    }

    case 'SET_DURATION': {
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.uid === action.uid ? { ...e, duration: Math.max(5, Math.min(300, action.duration)) } : e,
        ),
      };
    }

    case 'SET_REST': {
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.uid === action.uid ? { ...e, rest: Math.max(0, Math.min(300, action.rest)) } : e,
        ),
      };
    }

    case 'MOVE_UP': {
      const idx = state.exercises.findIndex((e) => e.uid === action.uid);
      if (idx <= 0) return state;
      const exs = [...state.exercises];
      [exs[idx - 1], exs[idx]] = [exs[idx], exs[idx - 1]];
      return { ...state, exercises: exs };
    }

    case 'MOVE_DOWN': {
      const idx = state.exercises.findIndex((e) => e.uid === action.uid);
      if (idx < 0 || idx >= state.exercises.length - 1) return state;
      const exs = [...state.exercises];
      [exs[idx], exs[idx + 1]] = [exs[idx + 1], exs[idx]];
      return { ...state, exercises: exs };
    }

    default:
      return state;
  }
}

// ── Estimated time helper ──────────────────────────────────────────────────

function estimateMinutes(exercises: BuilderExercise[]): number {
  if (exercises.length === 0) return 0;
  const totalSecs = exercises.reduce((acc, row) => {
    const perSet = row.duration > 0 ? row.duration : row.reps * 3;
    return acc + row.sets * (perSet + row.rest);
  }, 0);
  return Math.max(1, Math.ceil(totalSecs / 60));
}

// ── Muscle group helpers ──────────────────────────────────────────────────

function getMuscleGroupMeta(group: string | null | undefined): {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
} | null {
  if (!group) return null;
  const g = group.toLowerCase();
  if (g.includes('pierna') || g.includes('isquio') || g.includes('glut') || g.includes('cadera') || g.includes('pantorr') || g.includes('tobillo')) {
    return { icon: 'walk-outline',         color: '#2B8DB8', label: 'Piernas' };
  }
  if (g.includes('core') || g.includes('abdom') || g.includes('lumbar')) {
    return { icon: 'fitness-outline',      color: '#C4973A', label: 'Core' };
  }
  if (g.includes('hombro')) {
    return { icon: 'barbell-outline',      color: '#9B4EC4', label: 'Hombros' };
  }
  if (g.includes('brazo') || g.includes('muñeca') || g.includes('bicep') || g.includes('tricep')) {
    return { icon: 'hand-right-outline',   color: '#38B88C', label: 'Brazos' };
  }
  if (g.includes('espalda') || g.includes('dorsal') || g.includes('torac')) {
    return { icon: 'body-outline',         color: '#C44E38', label: 'Espalda' };
  }
  return { icon: 'accessibility-outline', color: '#00CFCF', label: 'Cuerpo' };
}

function MuscleGroupBadge({ muscleGroup }: { muscleGroup?: string | null }) {
  const meta = getMuscleGroupMeta(muscleGroup);
  if (!meta) return null;
  return (
    <View style={[badgeStyles.pill, { backgroundColor: meta.color + '28' }]}>
      <Ionicons name={meta.icon} size={10} color={meta.color} />
      <Text style={[badgeStyles.text, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.3,
  },
});

// ── Video preview modal ───────────────────────────────────────────────────

function VideoPreviewModal({ visible, videoUrl, onClose }: {
  visible:  boolean;
  videoUrl: string | null;
  onClose:  () => void;
}) {
  const player = useVideoPlayer(videoUrl ?? null, (p) => { p.loop = true; });

  useEffect(() => {
    if (visible && videoUrl) player.play();
    else player.pause();
  }, [visible, videoUrl]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={previewStyles.container}>
        <Pressable style={previewStyles.closeBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <VideoView
          player={player}
          style={previewStyles.player}
          contentFit="contain"
          nativeControls
        />
      </View>
    </Modal>
  );
}

const previewStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: { width: '100%', height: 280 },
});

// ── Add exercise modal ─────────────────────────────────────────────────────

interface AddExerciseModalProps {
  visible:      boolean;
  onClose:      () => void;
  onAdd:        (exercise: ExerciseItem) => void;
  onRemove:     (exerciseId: string) => void;
  alreadyAdded: Set<string>;
}

function AddExerciseModal({ visible, onClose, onAdd, onRemove, alreadyAdded }: AddExerciseModalProps) {
  const { t }  = useTranslation();
  const [search,          setSearch]          = useState('');
  const [category,        setCategory]        = useState<ExerciseCategory | 'all'>('all');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    let list = MOCK_EXERCISES;
    if (category !== 'all') list = list.filter((e) => e.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return list;
  }, [search, category]);

  function handleClose() {
    setSearch('');
    setCategory('all');
    setPreviewVideoUrl(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[modalStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Handle bar */}
        <View style={modalStyles.handle} />

        {/* Header */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{t('routines.builder.addExercise')}</Text>
          <Pressable onPress={handleClose} hitSlop={8} style={modalStyles.doneBtn}>
            <Text style={modalStyles.doneBtnText}>{t('routines.builder.done')}</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={modalStyles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            style={modalStyles.searchInput}
            placeholder={t('routines.builder.searchExercises')}
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={14} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Category chips */}
        <FlatList
          horizontal
          data={[{ key: 'all', label: t('common.all'), icon: 'grid-outline' }, ...EXERCISE_CATEGORIES]}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={modalStyles.categoryRow}
          renderItem={({ item }) => (
            <Pressable
              style={[modalStyles.categoryChip, category === item.key && modalStyles.categoryChipActive]}
              onPress={() => setCategory(item.key as any)}
            >
              <Ionicons
                name={(item as any).icon as any}
                size={13}
                color={category === item.key ? colors.bgPrimary : colors.textSecondary}
              />
              <Text style={[modalStyles.categoryChipText, category === item.key && modalStyles.categoryChipTextActive]} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          )}
          style={modalStyles.categoryScroll}
        />

        {/* Exercise list */}
        <FlatList
          style={modalStyles.exerciseList}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={modalStyles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
          renderItem={({ item }) => {
            const added = alreadyAdded.has(item.id);
            const mockVideo = item.video_id ? MOCK_VIDEOS.find((v) => v.id === item.video_id) : null;
            const videoUrl  = mockVideo ? resolveVideoUrl(mockVideo.video_url, mockVideo.video_key) : null;
            return (
              <Pressable
                style={({ pressed }) => [modalStyles.exRow, pressed && { opacity: 0.75 }]}
                onPress={() => { added ? onRemove(item.id) : onAdd(item); }}
              >
                <View style={modalStyles.exInfo}>
                  <View style={modalStyles.exNameRow}>
                    <Text style={modalStyles.exName} numberOfLines={1}>{item.name}</Text>
                    <MuscleGroupBadge muscleGroup={item.muscle_group} />
                  </View>
                  <Text style={modalStyles.exMeta}>
                    {item.default_duration_seconds > 0
                      ? `${item.default_sets} × ${item.default_duration_seconds}s`
                      : `${item.default_sets} × ${item.default_reps} reps`}
                    {' · '}{item.default_rest_seconds}s desc.
                  </Text>
                </View>
                <View style={modalStyles.exActions}>
                  {videoUrl && (
                    <Pressable
                      onPress={() => setPreviewVideoUrl(videoUrl)}
                      hitSlop={8}
                      style={modalStyles.previewVideoBtn}
                    >
                      <Ionicons name="play-circle-outline" size={22} color={colors.accent} />
                    </Pressable>
                  )}
                  <View style={[modalStyles.addBtn, added && modalStyles.addBtnAdded]}>
                    <Ionicons
                      name={added ? 'checkmark' : 'add'}
                      size={18}
                      color={added ? colors.success : colors.accent}
                    />
                  </View>

                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={modalStyles.emptyWrap}>
              <Text style={modalStyles.emptyText}>{t('routines.builder.noExercisesFound')}</Text>
            </View>
          }
        />

        <VideoPreviewModal
          visible={previewVideoUrl !== null}
          videoUrl={previewVideoUrl}
          onClose={() => setPreviewVideoUrl(null)}
        />
      </View>
    </Modal>
  );
}

// ── Exercise row in the builder ────────────────────────────────────────────

interface ExRowProps {
  row:       BuilderExercise;
  isFirst:   boolean;
  isLast:    boolean;
  dispatch:  React.Dispatch<BuilderAction>;
}

function ExerciseRow({ row, isFirst, isLast, dispatch }: ExRowProps) {
  const { t } = useTranslation();
  const ex = row.exercise;
  const isDuration = ex.default_duration_seconds > 0;

  return (
    <View style={rowStyles.card}>
      {/* Row 1: arrows · name/meta · trash */}
      <View style={rowStyles.topRow}>
        <View style={rowStyles.arrows}>
          <Pressable
            onPress={() => dispatch({ type: 'MOVE_UP', uid: row.uid })}
            disabled={isFirst}
            hitSlop={4}
            style={[rowStyles.arrowBtn, isFirst && rowStyles.arrowDisabled]}
          >
            <Ionicons name="chevron-up" size={16} color={isFirst ? colors.textTertiary : colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => dispatch({ type: 'MOVE_DOWN', uid: row.uid })}
            disabled={isLast}
            hitSlop={4}
            style={[rowStyles.arrowBtn, isLast && rowStyles.arrowDisabled]}
          >
            <Ionicons name="chevron-down" size={16} color={isLast ? colors.textTertiary : colors.textSecondary} />
          </Pressable>
        </View>

        <View style={rowStyles.info}>
          <Text style={rowStyles.name} numberOfLines={1}>{ex.name}</Text>
          <View style={rowStyles.metaRow}>
            <Text style={rowStyles.meta}>
              {isDuration
                ? `${ex.default_duration_seconds}s/serie · `
                : ''}{ex.default_rest_seconds}s desc.
            </Text>
            <MuscleGroupBadge muscleGroup={ex.muscle_group} />
          </View>
        </View>

        <Pressable
          onPress={() => dispatch({ type: 'REMOVE_EXERCISE', uid: row.uid })}
          hitSlop={8}
          style={rowStyles.removeBtn}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </Pressable>
      </View>

      {/* Row 2: steppers */}
      <View style={rowStyles.steppersRow}>
        {/* Sets */}
        <View style={rowStyles.stepperGroup}>
          <Text style={rowStyles.stepperLabel}>{t('videos.detail.sets')}</Text>
          <View style={rowStyles.stepper}>
            <Pressable
              onPress={() => dispatch({ type: 'SET_SETS', uid: row.uid, sets: row.sets - 1 })}
              hitSlop={4}
              style={rowStyles.stepBtn}
            >
              <Ionicons name="remove" size={16} color={colors.textSecondary} />
            </Pressable>
            <Text style={rowStyles.stepNum}>{row.sets}</Text>
            <Pressable
              onPress={() => dispatch({ type: 'SET_SETS', uid: row.uid, sets: row.sets + 1 })}
              hitSlop={4}
              style={rowStyles.stepBtn}
            >
              <Ionicons name="add" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Reps OR Duration */}
        {isDuration ? (
          <View style={rowStyles.stepperGroup}>
            <Text style={rowStyles.stepperLabel}>{t('routines.builder.duration')}</Text>
            <View style={rowStyles.stepper}>
              <Pressable
                onPress={() => dispatch({ type: 'SET_DURATION', uid: row.uid, duration: row.duration - 5 })}
                hitSlop={4}
                style={rowStyles.stepBtn}
              >
                <Ionicons name="remove" size={16} color={colors.textSecondary} />
              </Pressable>
              <Text style={rowStyles.stepNumWide}>{row.duration}s</Text>
              <Pressable
                onPress={() => dispatch({ type: 'SET_DURATION', uid: row.uid, duration: row.duration + 5 })}
                hitSlop={4}
                style={rowStyles.stepBtn}
              >
                <Ionicons name="add" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={rowStyles.stepperGroup}>
            <Text style={rowStyles.stepperLabel}>{t('videos.detail.reps')}</Text>
            <View style={rowStyles.stepper}>
              <Pressable
                onPress={() => dispatch({ type: 'SET_REPS', uid: row.uid, reps: row.reps - 1 })}
                hitSlop={4}
                style={rowStyles.stepBtn}
              >
                <Ionicons name="remove" size={16} color={colors.textSecondary} />
              </Pressable>
              <Text style={rowStyles.stepNum}>{row.reps}</Text>
              <Pressable
                onPress={() => dispatch({ type: 'SET_REPS', uid: row.uid, reps: row.reps + 1 })}
                hitSlop={4}
                style={rowStyles.stepBtn}
              >
                <Ionicons name="add" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Rest — all exercises */}
        <View style={rowStyles.stepperGroup}>
          <Text style={rowStyles.stepperLabel}>{t('routines.builder.rest')}</Text>
          <View style={rowStyles.stepper}>
            <Pressable
              onPress={() => dispatch({ type: 'SET_REST', uid: row.uid, rest: row.rest - 5 })}
              hitSlop={4}
              style={rowStyles.stepBtn}
            >
              <Ionicons name="remove" size={16} color={colors.textSecondary} />
            </Pressable>
            <Text style={rowStyles.stepNumWide}>{row.rest}s</Text>
            <Pressable
              onPress={() => dispatch({ type: 'SET_REST', uid: row.uid, rest: row.rest + 5 })}
              hitSlop={4}
              style={rowStyles.stepBtn}
            >
              <Ionicons name="add" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function RoutineBuilderScreen() {
  const { t }    = useTranslation();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();

  const [state, dispatch] = useReducer(builderReducer, INIT_STATE);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const estimatedMin  = estimateMinutes(state.exercises);
  const alreadyAdded  = useMemo(
    () => new Set(state.exercises.map((e) => e.exercise.id)),
    [state.exercises],
  );

  function handleAddExercise(exercise: ExerciseItem) {
    dispatch({ type: 'ADD_EXERCISE', exercise });
  }

  function handleRemoveExercise(exerciseId: string) {
    const row = state.exercises.find((e) => e.exercise.id === exerciseId);
    if (row) dispatch({ type: 'REMOVE_EXERCISE', uid: row.uid });
  }

  async function handleSave() {
    if (!state.name.trim()) {
      Alert.alert(t('routines.builder.nameRequired'), t('routines.builder.nameRequiredMsg'));
      return;
    }
    if (state.exercises.length === 0) {
      Alert.alert(t('routines.builder.noExercises'), t('routines.builder.noExercisesMsg'));
      return;
    }

    setSaving(true);
    try {
      const routine = {
        id:                `routine-user-${Date.now()}`,
        title:             state.name.trim(),
        description:       '',
        author_id:         'user-me',
        author_name:       'Yo',
        author_avatar:     null,
        exercises:         state.exercises.map((row) => ({
          id:               `${row.uid}-${row.exercise.id}`,
          exercise_name:    row.exercise.name,
          sets:             row.sets,
          reps:             row.reps,
          duration_seconds: row.duration,
          rest_seconds:     row.rest,
          video_id:         row.exercise.video_id,
          note:             row.exercise.note,
        })),
        estimated_minutes: estimatedMin,
        likes_count:       0,
        is_saved:          false,
        is_mine:           true,
        level:             'basico' as const,
        tags:              [],
        created_at:        new Date().toISOString(),
        is_public:         state.isPublic,
      };

      const existingRaw = await AsyncStorage.getItem('@volleytip/my_routines');
      const existing    = existingRaw ? JSON.parse(existingRaw) : [];
      await AsyncStorage.setItem('@volleytip/my_routines', JSON.stringify([routine, ...existing]));

      router.back();
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    if (state.exercises.length === 0 && !state.name) {
      router.back();
      return;
    }
    Alert.alert(
      t('routines.builder.discard'),
      t('routines.builder.discardMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('routines.builder.discardConfirm'), style: 'destructive', onPress: () => router.back() },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={handleDiscard} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('routines.builder.title')}</Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.saveBtnText}>
              {saving ? t('common.loading') : t('routines.builder.saveRoutine')}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Routine name ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('routines.builder.routineName')}</Text>
            <View style={styles.nameInputWrap}>
              <TextInput
                style={styles.nameInput}
                placeholder={t('routines.builder.namePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={state.name}
                onChangeText={(name) => dispatch({ type: 'SET_NAME', name })}
                maxLength={60}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ── Exercises list ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>{t('routines.builder.myRoutine')}</Text>
              {state.exercises.length > 0 && (
                <Text style={styles.estimatedTime}>
                  {t('routines.builder.estimatedTime', { min: estimatedMin })}
                </Text>
              )}
            </View>

            {state.exercises.length === 0 ? (
              <View style={styles.emptyRoutine}>
                <Ionicons name="add-circle-outline" size={36} color={colors.textTertiary} />
                <Text style={styles.emptyRoutineText}>
                  {t('routines.builder.emptyExercises')}
                </Text>
              </View>
            ) : (
              <View style={styles.exercisesList}>
                {state.exercises.map((row, idx) => (
                  <ExerciseRow
                    key={row.uid}
                    row={row}
                    isFirst={idx === 0}
                    isLast={idx === state.exercises.length - 1}
                    dispatch={dispatch}
                  />
                ))}
              </View>
            )}

            {/* Add exercise button */}
            <Pressable
              style={({ pressed }) => [styles.addExBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setModalOpen(true)}
            >
              <Ionicons name="add" size={18} color={colors.accent} />
              <Text style={styles.addExBtnText}>{t('routines.builder.addExercise')}</Text>
            </Pressable>
          </View>

          {/* ── Settings ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('routines.builder.settings')}</Text>
            <View style={styles.settingsCard}>
              {/* Share with community */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingTitle}>{t('routines.builder.shareWithCommunity')}</Text>
                    <Text style={styles.settingSubtitle}>
                      {state.isPublic
                        ? t('routines.visibility.public')
                        : t('routines.visibility.private')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={state.isPublic}
                  onValueChange={() => dispatch({ type: 'TOGGLE_PUBLIC' })}
                  trackColor={{ false: colors.border, true: colors.accentMuted }}
                  thumbColor={state.isPublic ? colors.accent : colors.textTertiary}
                />
              </View>

              {/* Summary row */}
              {state.exercises.length > 0 && (
                <>
                  <View style={styles.settingDivider} />
                  <View style={styles.summaryRow}>
                    <SummaryPill icon="barbell-outline"  label={t('routines.exercises', { count: state.exercises.length })} />
                    <SummaryPill icon="layers-outline"   label={t('routines.builder.sets', { n: state.exercises.reduce((a, e) => a + e.sets, 0) })} />
                    <SummaryPill icon="time-outline"     label={t('routines.builder.estimatedTime', { min: estimatedMin })} />
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AddExerciseModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddExercise}
        onRemove={handleRemoveExercise}
        alreadyAdded={alreadyAdded}
      />
    </SafeAreaView>
  );
}

// ── Summary pill ──────────────────────────────────────────────────────────

function SummaryPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.summaryPill}>
      <Ionicons name={icon} size={13} color={colors.accent} />
      <Text style={styles.summaryPillText}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.bgPrimary },
  flex:  { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  saveBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.bgPrimary,
  },

  scroll: { paddingTop: spacing.xl },

  section: {
    paddingHorizontal: spacing.screen,
    marginBottom: spacing['2xl'],
    gap: spacing.md,
  },
  sectionLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  estimatedTime: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.accent,
  },

  // Name input
  nameInputWrap: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 50,
    justifyContent: 'center',
  },
  nameInput: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    height: '100%',
  },

  // Empty routine
  emptyRoutine: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  emptyRoutineText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },

  exercisesList: { gap: spacing.sm },

  // Add button
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
  },
  addExBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.accent,
  },

  // Settings card
  settingsCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  settingTitle: { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.textPrimary },
  settingSubtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textTertiary },
  settingDivider: { height: 1, backgroundColor: colors.border },

  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexWrap: 'wrap',
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  summaryPillText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.accent,
  },
});

// ── Exercise row styles ────────────────────────────────────────────────────

const rowStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  arrows: { gap: 2 },
  arrowBtn: { padding: 2 },
  arrowDisabled: { opacity: 0.3 },

  info: { flex: 1, gap: 2 },
  name: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  meta: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textTertiary },

  removeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  steppersRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingLeft: spacing.lg,
    paddingBottom: spacing.xs,
  },

  stepperGroup: {
    alignItems: 'center',
    gap: 4,
  },

  stepperLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    minWidth: 22,
    textAlign: 'center',
  },
  stepNumWide: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    minWidth: 36,
    textAlign: 'center',
  },
});

// ── Modal styles ───────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screen,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    height: '100%',
  },
  categoryScroll: { flexGrow: 0, flexShrink: 0 },
  exerciseList:   { flex: 1 },
  categoryRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  categoryChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryChipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  categoryChipTextActive: { color: colors.bgPrimary },
  listContent: { paddingBottom: spacing['3xl'] },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  exInfo: { flex: 1, gap: 4 },
  exNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  exName: { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.textPrimary },
  exMeta: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  exActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  previewVideoBtn: { padding: 2 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnAdded: { borderColor: colors.success },
  emptyWrap: { alignItems: 'center', paddingTop: spacing['4xl'] },
  emptyText: { fontFamily: fontFamily.regular, fontSize: fontSize.base, color: colors.textSecondary },
  doneBtn: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  doneBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.accent,
  },
});
