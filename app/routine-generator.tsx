import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../src/components/ui';
import {
  ExerciseCategory,
  ExerciseItem,
  MOCK_EXERCISES,
} from '../src/data/exercises.mock';
import { Routine, RoutineExercise } from '../src/data/routines.mock';
import { MOCK_VIDEOS } from '../src/data/videos.mock';
import { resolveVideoUrl } from '../src/lib/r2';
import { colors, fontFamily, fontSize, radius, spacing } from '../src/theme';

// ── Types ──────────────────────────────────────────────────────────────────

type GenPhase = 'config' | 'preview';

interface GenExercise {
  uid:      string;
  exercise: ExerciseItem;
  sets:     number;
  reps:     number;
  duration: number;
  rest:     number;
}

// ── Muscle group helpers ───────────────────────────────────────────────────

function getMuscleGroupMeta(group: string | null | undefined) {
  if (!group) return null;
  const g = group.toLowerCase();
  if (g.includes('pierna') || g.includes('isquio') || g.includes('glut') || g.includes('cadera') || g.includes('pantorr') || g.includes('tobillo')) {
    return { icon: 'walk-outline' as const,         color: '#2B8DB8', label: 'Piernas' };
  }
  if (g.includes('core') || g.includes('abdom') || g.includes('lumbar')) {
    return { icon: 'fitness-outline' as const,      color: '#C4973A', label: 'Core' };
  }
  if (g.includes('hombro')) {
    return { icon: 'barbell-outline' as const,      color: '#9B4EC4', label: 'Hombros' };
  }
  if (g.includes('brazo') || g.includes('muñeca') || g.includes('bicep') || g.includes('tricep')) {
    return { icon: 'hand-right-outline' as const,   color: '#38B88C', label: 'Brazos' };
  }
  if (g.includes('espalda') || g.includes('dorsal') || g.includes('torac')) {
    return { icon: 'body-outline' as const,         color: '#C44E38', label: 'Espalda' };
  }
  return { icon: 'accessibility-outline' as const,  color: '#00CFCF', label: 'Cuerpo' };
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
  text: { fontFamily: fontFamily.medium, fontSize: 9, letterSpacing: 0.3 },
});

// ── Config options ─────────────────────────────────────────────────────────

const MUSCLE_GROUP_OPTIONS = ['Todos', 'Piernas', 'Core', 'Hombros', 'Brazos', 'Espalda'];
const COUNT_OPTIONS = [3, 5, 7];
const LEVEL_OPTIONS = ['Todos', 'Básico', 'Intermedio', 'Avanzado'];

function getCategoriesForLevel(level: string): ExerciseCategory[] | null {
  if (level === 'Básico')   return ['movilidad', 'tecnica', 'core'];
  if (level === 'Avanzado') return ['saltabilidad', 'fuerza', 'pliometria'];
  return null;
}

let uidCounter = 0;

function pickExercises(muscleGroup: string, count: number, level: string): GenExercise[] | null {
  const cats = getCategoriesForLevel(level);
  const pool = MOCK_EXERCISES.filter((ex) => {
    if (cats && !cats.includes(ex.category)) return false;
    if (muscleGroup !== 'Todos') {
      const meta = getMuscleGroupMeta(ex.muscle_group);
      if (!meta || meta.label !== muscleGroup) return false;
    }
    return true;
  });
  if (pool.length < count) return null;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((ex) => ({
    uid:      `gen-${++uidCounter}`,
    exercise: ex,
    sets:     ex.default_sets,
    reps:     ex.default_reps,
    duration: ex.default_duration_seconds,
    rest:     ex.default_rest_seconds,
  }));
}

function swapExercise(list: GenExercise[], uid: string, level: string): GenExercise[] {
  const target = list.find((e) => e.uid === uid);
  if (!target) return list;
  const cats = getCategoriesForLevel(level);
  const inUse = new Set(list.map((e) => e.exercise.id));
  const targetLabel = getMuscleGroupMeta(target.exercise.muscle_group)?.label;

  let pool = MOCK_EXERCISES.filter((ex) => {
    if (inUse.has(ex.id)) return false;
    if (cats && !cats.includes(ex.category)) return false;
    const exLabel = getMuscleGroupMeta(ex.muscle_group)?.label;
    return targetLabel ? exLabel === targetLabel : true;
  });

  if (pool.length === 0) {
    pool = MOCK_EXERCISES.filter((ex) => {
      if (inUse.has(ex.id)) return false;
      if (cats && !cats.includes(ex.category)) return false;
      return ex.category === target.exercise.category;
    });
  }

  if (pool.length === 0) {
    pool = MOCK_EXERCISES.filter((ex) => !inUse.has(ex.id));
  }

  if (pool.length === 0) return list;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return list.map((e) =>
    e.uid === uid
      ? { uid: e.uid, exercise: pick, sets: pick.default_sets, reps: pick.default_reps, duration: pick.default_duration_seconds, rest: pick.default_rest_seconds }
      : e,
  );
}

function estimateMins(exercises: GenExercise[]): number {
  if (exercises.length === 0) return 0;
  const secs = exercises.reduce((s, e) => {
    const perSet = e.duration > 0 ? e.duration : e.reps * 3;
    return s + e.sets * (perSet + e.rest);
  }, 0);
  return Math.max(1, Math.ceil(secs / 60));
}

function updateField(
  list: GenExercise[],
  uid: string,
  field: 'sets' | 'reps' | 'duration' | 'rest',
  amount: number,
  min: number,
  max: number,
): GenExercise[] {
  return list.map((e) =>
    e.uid === uid ? { ...e, [field]: Math.max(min, Math.min(max, (e[field] as number) + amount)) } : e,
  );
}

// ── Stepper ────────────────────────────────────────────────────────────────

function Stepper({ label, value, unit = '', onDec, onInc }: {
  label: string; value: number; unit?: string;
  onDec: () => void; onInc: () => void;
}) {
  return (
    <View style={stepperStyles.wrap}>
      <Text style={stepperStyles.label}>{label}</Text>
      <View style={stepperStyles.row}>
        <Pressable onPress={onDec} style={stepperStyles.btn} hitSlop={8}>
          <Ionicons name="remove" size={16} color={colors.accent} />
        </Pressable>
        <Text style={stepperStyles.num}>{value}{unit}</Text>
        <Pressable onPress={onInc} style={stepperStyles.btn} hitSlop={8}>
          <Ionicons name="add" size={16} color={colors.accent} />
        </Pressable>
      </View>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  wrap:  { alignItems: 'center', minWidth: 68 },
  label: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: colors.textTertiary, marginBottom: 4 },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  num: {
    fontFamily: fontFamily.bold, fontSize: fontSize.sm,
    color: colors.textPrimary, minWidth: 32, textAlign: 'center',
  },
});

// ── Config section wrapper ─────────────────────────────────────────────────

function ConfigSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ── Video modal ────────────────────────────────────────────────────────────

function VideoModal({ visible, url, onClose }: {
  visible: boolean; url: string | null; onClose: () => void;
}) {
  const player = useVideoPlayer(url, (p) => { p.loop = true; });
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible && url) player.play();
    else player.pause();
  }, [visible, url]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[vidStyles.container, { paddingTop: insets.top || 44 }]}>
        <Pressable onPress={onClose} style={vidStyles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        {url ? (
          <VideoView player={player} style={vidStyles.video} contentFit="contain" nativeControls />
        ) : (
          <View style={vidStyles.noVideo}>
            <Ionicons name="videocam-off-outline" size={48} color={colors.textTertiary} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const vidStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  closeBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  video:   { width: '100%', height: 280 },
  noVideo: { alignItems: 'center', justifyContent: 'center', height: 280 },
});

// ── Save modal ─────────────────────────────────────────────────────────────

function SaveModal({ visible, onSave, onCancel }: {
  visible: boolean;
  onSave: (name: string, isPublic: boolean) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={[saveStyles.container, { paddingTop: (insets.top || 20) + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={saveStyles.header}>
          <Text variant="h4">{t('routines.builder.saveRoutine')}</Text>
          <Pressable onPress={onCancel} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={saveStyles.fieldLabel}>{t('routines.builder.routineName')}</Text>
        <TextInput
          style={saveStyles.input}
          placeholder={t('routines.builder.namePlaceholder')}
          placeholderTextColor={colors.textTertiary}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
        />

        <View style={saveStyles.switchRow}>
          <Text style={saveStyles.switchLabel}>{t('routines.builder.shareWithCommunity')}</Text>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: colors.border, true: colors.accent + '80' }}
            thumbColor={isPublic ? colors.accent : colors.textTertiary}
          />
        </View>

        <Pressable
          style={({ pressed }) => [saveStyles.saveBtn, pressed && { opacity: 0.85 }]}
          onPress={() => onSave(name.trim() || t('routines.generator.defaultName'), isPublic)}
        >
          <Text style={saveStyles.saveBtnText}>{t('common.save')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const saveStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: spacing.screen,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.xl,
  },
  fieldLabel: {
    fontFamily: fontFamily.medium, fontSize: fontSize.sm,
    color: colors.textSecondary, marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 48,
    fontFamily: fontFamily.regular, fontSize: fontSize.base, color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  switchLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.textPrimary },
  saveBtn: {
    backgroundColor: colors.accent, borderRadius: radius.lg, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.base, color: colors.bgPrimary },
});

// ── Main screen ────────────────────────────────────────────────────────────

export default function RoutineGeneratorScreen() {
  const { t }   = useTranslation();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [muscleGroup, setMuscleGroup] = useState('Todos');
  const [count,       setCount]       = useState(5);
  const [level,       setLevel]       = useState('Todos');
  const [phase,       setPhase]       = useState<GenPhase>('config');
  const [exercises,   setExercises]   = useState<GenExercise[]>([]);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [videoVisible,  setVideoVisible]  = useState(false);
  const [saveVisible,   setSaveVisible]   = useState(false);
  const [pendingStart,  setPendingStart]  = useState(false);

  const hasEnough = useMemo(() => {
    const cats = getCategoriesForLevel(level);
    const pool = MOCK_EXERCISES.filter((ex) => {
      if (cats && !cats.includes(ex.category)) return false;
      if (muscleGroup !== 'Todos') {
        const meta = getMuscleGroupMeta(ex.muscle_group);
        if (!meta || meta.label !== muscleGroup) return false;
      }
      return true;
    });
    return pool.length >= count;
  }, [muscleGroup, count, level]);

  function generate() {
    const result = pickExercises(muscleGroup, count, level);
    if (!result) {
      Alert.alert(t('routines.generator.noExercisesTitle'), t('routines.generator.noExercisesMsg'));
      return;
    }
    setExercises(result);
    setPhase('preview');
  }

  function openVideo(videoId: string | null) {
    if (!videoId) return;
    const v = MOCK_VIDEOS.find((v) => v.id === videoId);
    if (!v) return;
    setPreviewUrl(resolveVideoUrl(v.video_url, v.video_key));
    setVideoVisible(true);
  }

  async function doSave(name: string, isPublic: boolean): Promise<string> {
    const id = `routine-gen-${Date.now()}`;
    const lvl = level === 'Básico' ? 'basico' : level === 'Avanzado' ? 'avanzado' : 'intermedio';
    const routineExs: RoutineExercise[] = exercises.map((e, i) => ({
      id:               `${id}-${i}`,
      exercise_name:    e.exercise.name,
      sets:             e.sets,
      reps:             e.reps,
      duration_seconds: e.duration,
      rest_seconds:     e.rest,
      video_id:         e.exercise.video_id,
      note:             e.exercise.note,
    }));
    const routine: Routine = {
      id,
      title:             name,
      description:       '',
      author_id:         'me',
      author_name:       'Yo',
      author_avatar:     null,
      exercises:         routineExs,
      estimated_minutes: estimateMins(exercises),
      likes_count:       0,
      is_saved:          false,
      is_mine:           true,
      level:             lvl as any,
      tags:              [],
      created_at:        new Date().toISOString(),
    };
    const raw = await AsyncStorage.getItem('@volleytip/my_routines');
    const prev: Routine[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem('@volleytip/my_routines', JSON.stringify([routine, ...prev]));
    return id;
  }

  async function handleSaveConfirm(name: string, isPublic: boolean) {
    setSaveVisible(false);
    try {
      const id = await doSave(name, isPublic);
      if (pendingStart) {
        router.replace(`/routine/${id}` as any);
      } else {
        router.back();
      }
    } catch {
      Alert.alert(t('errors.generic'));
    }
  }

  // ── Config phase ───────────────────────────────────────────────────────

  if (phase === 'config') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text variant="h4" style={styles.headerTitle}>{t('routines.generator.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.configContent} showsVerticalScrollIndicator={false}>
          <ConfigSection label={t('routines.generator.muscleGroup')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {MUSCLE_GROUP_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.chip, muscleGroup === opt && styles.chipActive]}
                  onPress={() => setMuscleGroup(opt)}
                >
                  <Text style={[styles.chipText, muscleGroup === opt && styles.chipTextActive]}>{opt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </ConfigSection>

          <ConfigSection label={t('routines.generator.count')}>
            <View style={styles.chipsRow}>
              {COUNT_OPTIONS.map((n) => (
                <Pressable
                  key={n}
                  style={[styles.chip, count === n && styles.chipActive]}
                  onPress={() => setCount(n)}
                >
                  <Text style={[styles.chipText, count === n && styles.chipTextActive]}>{n}</Text>
                </Pressable>
              ))}
            </View>
          </ConfigSection>

          <ConfigSection label={t('routines.generator.level')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {LEVEL_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.chip, level === opt && styles.chipActive]}
                  onPress={() => setLevel(opt)}
                >
                  <Text style={[styles.chipText, level === opt && styles.chipTextActive]}>{opt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </ConfigSection>

          {!hasEnough && (
            <View style={styles.warning}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.warningText}>{t('routines.generator.noExercisesMsg')}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Pressable
            style={({ pressed }) => [
              styles.generateBtn,
              !hasEnough && styles.generateBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
            onPress={generate}
            disabled={!hasEnough}
          >
            <Ionicons name="shuffle" size={20} color={colors.bgPrimary} />
            <Text style={styles.generateBtnText}>{t('routines.generator.generate')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Preview phase ──────────────────────────────────────────────────────

  const mins = estimateMins(exercises);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => setPhase('config')} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h4" style={styles.headerTitle}>
          {t('routines.builder.estimatedTime', { min: mins })}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.regenBtn, pressed && { opacity: 0.8 }]}
          onPress={() => {
            const r = pickExercises(muscleGroup, count, level);
            if (r) setExercises(r);
          }}
        >
          <Ionicons name="shuffle" size={14} color={colors.accent} />
          <Text style={styles.regenText}>{t('routines.generator.regenerate')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.previewContent} showsVerticalScrollIndicator={false}>
        {exercises.map((item, index) => {
          const isTimed  = item.duration > 0;
          const hasVideo = !!item.exercise.video_id;
          return (
            <View key={item.uid} style={styles.exCard}>
              <View style={styles.exTopRow}>
                <View style={styles.exIndex}>
                  <Text style={styles.exIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.exInfo}>
                  <Text style={styles.exName} numberOfLines={2}>{item.exercise.name}</Text>
                  <MuscleGroupBadge muscleGroup={item.exercise.muscle_group} />
                </View>
                <View style={styles.exActions}>
                  {hasVideo && (
                    <Pressable
                      onPress={() => openVideo(item.exercise.video_id)}
                      style={styles.videoBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="play-circle-outline" size={22} color={colors.accent} />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => setExercises((prev) => swapExercise(prev, item.uid, level))}
                    style={styles.replaceBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="refresh-outline" size={13} color={colors.accent} />
                    <Text style={styles.replaceText}>{t('routines.generator.replace')}</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.steppersRow}>
                <Stepper
                  label={t('videos.detail.sets')}
                  value={item.sets}
                  onDec={() => setExercises((p) => updateField(p, item.uid, 'sets', -1, 1, 10))}
                  onInc={() => setExercises((p) => updateField(p, item.uid, 'sets', +1, 1, 10))}
                />
                {isTimed ? (
                  <Stepper
                    label={t('routines.builder.duration')}
                    value={item.duration}
                    unit="s"
                    onDec={() => setExercises((p) => updateField(p, item.uid, 'duration', -5, 5, 300))}
                    onInc={() => setExercises((p) => updateField(p, item.uid, 'duration', +5, 5, 300))}
                  />
                ) : (
                  <Stepper
                    label={t('videos.detail.reps')}
                    value={item.reps}
                    onDec={() => setExercises((p) => updateField(p, item.uid, 'reps', -1, 1, 100))}
                    onInc={() => setExercises((p) => updateField(p, item.uid, 'reps', +1, 1, 100))}
                  />
                )}
                <Stepper
                  label={t('routines.builder.rest')}
                  value={item.rest}
                  unit="s"
                  onDec={() => setExercises((p) => updateField(p, item.uid, 'rest', -15, 0, 300))}
                  onInc={() => setExercises((p) => updateField(p, item.uid, 'rest', +15, 0, 300))}
                />
              </View>
            </View>
          );
        })}
        <View style={{ height: 110 }} />
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          style={({ pressed }) => [styles.saveOutlineBtn, pressed && { opacity: 0.8 }]}
          onPress={() => { setPendingStart(false); setSaveVisible(true); }}
        >
          <Ionicons name="bookmark-outline" size={18} color={colors.accent} />
          <Text style={styles.saveOutlineText}>{t('routines.builder.saveRoutine')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}
          onPress={() => { setPendingStart(true); setSaveVisible(true); }}
        >
          <Ionicons name="play" size={18} color={colors.bgPrimary} />
          <Text style={styles.startText}>{t('routines.generator.startNow')}</Text>
        </Pressable>
      </View>

      <VideoModal
        visible={videoVisible}
        url={previewUrl}
        onClose={() => { setVideoVisible(false); setPreviewUrl(null); }}
      />
      <SaveModal
        visible={saveVisible}
        onSave={handleSaveConfirm}
        onCancel={() => setSaveVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn:       { padding: 4 },
  headerTitle:   { flex: 1 },
  headerSpacer:  { width: 34 },
  regenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.accent,
    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  regenText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.accent },

  // Config
  configContent: { paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: spacing['3xl'] },
  section:       { marginBottom: spacing.xl },
  sectionLabel: {
    fontFamily: fontFamily.bold, fontSize: fontSize.sm,
    color: colors.textSecondary, marginBottom: spacing.md,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  chipsRow:      { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  chipActive:     { borderColor: colors.accent, backgroundColor: colors.accent + '18' },
  chipText:       { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textSecondary },
  chipTextActive: { color: colors.accent },

  warning: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginTop: spacing.sm,
  },
  warningText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textTertiary },

  // Bottom generate bar
  bottomBar: {
    paddingHorizontal: spacing.screen, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bgPrimary,
  },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.accent,
    borderRadius: radius.lg, height: 52,
  },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.base, color: colors.bgPrimary },

  // Preview
  previewContent: { paddingHorizontal: spacing.screen, paddingTop: spacing.sm },
  exCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.md,
  },
  exTopRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  exIndex: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent + '20',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  exIndexText: { fontFamily: fontFamily.bold, fontSize: fontSize.sm, color: colors.accent },
  exInfo:      { flex: 1, gap: 4 },
  exName:      { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.textPrimary },
  exActions:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0 },
  videoBtn:    { padding: 2 },
  replaceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderColor: colors.accent + '60',
    borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4,
  },
  replaceText: { fontFamily: fontFamily.medium, fontSize: 11, color: colors.accent },
  steppersRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },

  // Action bar (preview)
  actionBar: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.screen, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bgPrimary,
  },
  saveOutlineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderWidth: 1.5, borderColor: colors.accent,
    borderRadius: radius.lg, height: 52,
  },
  saveOutlineText: { fontFamily: fontFamily.bold, fontSize: fontSize.base, color: colors.accent },
  startBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.accent,
    borderRadius: radius.lg, height: 52,
  },
  startText: { fontFamily: fontFamily.bold, fontSize: fontSize.base, color: colors.bgPrimary },
});
