import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VideoCard } from '../../../src/components/videos/VideoCard';
import { Text } from '../../../src/components/ui';
import { ProgressBar } from '../../../src/components/ui/ProgressBar';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { CoursePaywall } from '../../../src/components/paywall/CoursePaywall';
import { usePurchasesStore } from '../../../src/store/purchases.store';
import {
  CourseItem,
  DayStatus,
  ProgramDay,
  ProgramWeek,
  TrainingProgramCourse,
} from '../../../src/data/courses.mock';
import { getCourseVideos } from '../../../src/services/courses.service';
import { useCourseById } from '../../../src/features/courses/hooks/useCoursesData';
import { colors, fontFamily, fontSize, radius, spacing } from '../../../src/theme';

// ── Day status helpers ─────────────────────────────────────────────────────

function useDayStatuses(course: TrainingProgramCourse) {
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const allDayIds = course.weeks.flatMap((w) => w.days.map((d) => d.id));
      const entries = await Promise.all(
        allDayIds.map(async (id) => {
          const val = await AsyncStorage.getItem(`@volleytip/day_done_${id}`);
          return [id, val] as const;
        }),
      );
      const done = new Set(entries.filter(([, v]) => v === 'true').map(([id]) => id));
      setDoneSet(done);
    }
    load();
  }, [course]);

  const getDayStatus = useCallback(
    (day: ProgramDay): DayStatus => {
      if (day.is_rest) return 'rest';
      if (doneSet.has(day.id)) return 'done';
      return 'pending';
    },
    [doneSet],
  );

  return getDayStatus;
}

// ── Day status badge ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DayStatus, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  done:    { color: colors.success,       icon: 'checkmark-circle' },
  today:   { color: colors.accent,        icon: 'radio-button-on' },
  pending: { color: colors.textTertiary,  icon: 'radio-button-off' },
  rest:    { color: colors.textSecondary, icon: 'leaf-outline' },
  locked:  { color: colors.textTertiary,  icon: 'lock-closed-outline' },
  missed:  { color: colors.error,         icon: 'close-circle-outline' },
};

function DayStatusIcon({ status }: { status: DayStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <Ionicons name={cfg.icon} size={18} color={cfg.color} />;
}

// ── Week accordion ────────────────────────────────────────────────────────

interface WeekRowProps {
  week:         ProgramWeek;
  getDayStatus: (day: ProgramDay) => DayStatus;
  onStartDay:   (day: ProgramDay) => void;
  canAccess:    boolean;
}

function WeekAccordion({ week, getDayStatus, onStartDay, canAccess }: WeekRowProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(week.week_number === 1);

  return (
    <View style={styles.weekBlock}>
      <Pressable style={styles.weekHeader} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.weekTitle}>
          {t('courses.detail.week', { n: week.week_number })}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>

      {open && (
        <View style={styles.daysContainer}>
          {week.days.map((day) => {
            const status   = getDayStatus(day);
            const canStart = canAccess && !day.is_rest && status !== 'done' && status !== 'locked';
            const canRedo  = canAccess && status === 'done';
            return (
              <View key={day.id} style={styles.dayRow}>
                <DayStatusIcon status={status} />
                <View style={styles.dayInfo}>
                  <Text style={styles.dayTitle} numberOfLines={1}>
                    {t('courses.detail.day', { n: day.day_number })} · {day.title}
                  </Text>
                  {!day.is_rest && (
                    <Text style={styles.dayMeta}>
                      {t('courses.detail.exercises', { n: day.exercises.length })} ·{' '}
                      {t('courses.detail.duration', { n: day.estimated_minutes })}
                    </Text>
                  )}
                </View>
                {canStart && (
                  <Pressable
                    style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => onStartDay(day)}
                  >
                    <Text style={styles.startBtnText}>{t('common.start')}</Text>
                  </Pressable>
                )}
                {canRedo && (
                  <Pressable
                    style={({ pressed }) => [styles.redoBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => onStartDay(day)}
                  >
                    <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const EMPTY_PROGRAM = { weeks: [] } as unknown as TrainingProgramCourse;

// ── Main screen ────────────────────────────────────────────────────────────

export default function CourseDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { t }   = useTranslation();

  const { data: course, isLoading } = useCourseById(id ?? '');
  const videos  = course?.type === 'video_collection' ? getCourseVideos(id ?? '') : [];

  const stableCourse = useMemo(
    () => (course?.type === 'training_program' ? course : EMPTY_PROGRAM),
    [course],
  );
  const getDayStatus = useDayStatuses(stableCourse);

  const hasAccess      = usePurchasesStore((s) => s.hasAccess);
  const canAccess      = course ? hasAccess(course.id, course.is_free) : false;
  const [paywallOpen, setPaywallOpen] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="" onBack={() => router.back()} />
        <View style={styles.notFound}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="" onBack={() => router.back()} />
        <View style={styles.notFound}>
          <Text variant="body" color={colors.textSecondary}>{t('errors.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedDays =
    course.type === 'training_program'
      ? course.weeks.flatMap((w) => w.days).filter((d) => !d.is_rest && getDayStatus(d) === 'done').length
      : 0;
  const totalWorkoutDays =
    course.type === 'training_program'
      ? course.weeks.flatMap((w) => w.days).filter((d) => !d.is_rest).length
      : 0;
  const progressRatio = totalWorkoutDays > 0 ? completedDays / totalWorkoutDays : 0;

  function handleStartDay(day: ProgramDay) {
    router.push(`/workout/${day.id}` as any);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero area */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={course.type === 'training_program' ? 'barbell-outline' : 'play-circle-outline'}
              size={56}
              color={colors.accent}
            />
          </View>
          <View style={styles.heroMeta}>
            <View style={styles.heroTypeBadge}>
              <Text style={styles.heroTypeText}>
                {course.type === 'training_program' ? 'Programa' : 'Colección'}
              </Text>
            </View>
            <Text style={styles.heroLevel}>{course.level}</Text>
          </View>
        </View>

        {/* Title + description */}
        <View style={styles.section}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          {course.type === 'training_program' && (
            <View style={styles.statsRow}>
              <StatPill icon="calendar-outline" label={`${course.total_weeks} semanas`} />
              <StatPill icon="repeat-outline"   label={`${course.sessions_per_week}×/semana`} />
              <StatPill icon="time-outline"     label={`~${course.estimated_minutes_per_session}min`} />
            </View>
          )}
          {course.type === 'video_collection' && (
            <StatPill icon="play-outline" label={`${course.video_ids.length} videos`} />
          )}
        </View>

        {/* Progress (training program) */}
        {course.type === 'training_program' && totalWorkoutDays > 0 && (
          <View style={[styles.section, styles.progressSection]}>
            <View style={styles.progressHeader}>
              <Text style={styles.sectionTitle}>Tu progreso</Text>
              <Text style={styles.progressCount}>{completedDays}/{totalWorkoutDays} sesiones</Text>
            </View>
            <ProgressBar progress={progressRatio} height={6} />
          </View>
        )}

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('courses.detail.about')}</Text>
          <Text style={styles.description}>{course.description}</Text>
        </View>

        {/* Content: weeks (training_program) */}
        {course.type === 'training_program' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('courses.detail.content')}</Text>
            <View style={styles.weeksContainer}>
              {course.weeks.map((week) => (
                <WeekAccordion
                  key={week.week_number}
                  week={week}
                  getDayStatus={getDayStatus}
                  onStartDay={handleStartDay}
                  canAccess={canAccess}
                />
              ))}
            </View>
          </View>
        )}

        {/* Content: videos (video_collection) */}
        {course.type === 'video_collection' && videos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('courses.detail.content')}</Text>
            <View style={styles.videoList}>
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  compact
                  onPress={() => router.push(`/(tabs)/videos/${video.id}`)}
                />
              ))}
            </View>
          </View>
        )}

        {/* CTA */}
        <View style={styles.ctaWrap}>
          {course.type === 'training_program' ? (
            canAccess ? (
              <Pressable
                style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.85 }]}
                onPress={() => {
                  const firstWorkoutDay = course.weeks[0]?.days.find((d) => !d.is_rest);
                  if (firstWorkoutDay) handleStartDay(firstWorkoutDay);
                }}
              >
                <Text style={styles.ctaText}>
                  {progressRatio > 0 ? t('common.continue') : t('common.start')}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.ctaButton, styles.ctaButtonLocked, pressed && { opacity: 0.85 }]}
                onPress={() => setPaywallOpen(true)}
              >
                <Ionicons name="lock-closed-outline" size={18} color={colors.bgPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.ctaText}>
                  Comprar — ${course.price_usd?.toFixed(2) ?? '?'}
                </Text>
              </Pressable>
            )
          ) : course.type === 'video_collection' && !course.is_free && !canAccess ? (
            <Pressable
              style={({ pressed }) => [styles.ctaButton, styles.ctaButtonLocked, pressed && { opacity: 0.85 }]}
              onPress={() => setPaywallOpen(true)}
            >
              <Ionicons name="lock-closed-outline" size={18} color={colors.bgPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.ctaText}>
                Comprar — ${course.price_usd?.toFixed(2) ?? '?'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {/* Paywall modal */}
      {course && !course.is_free && (
        <CoursePaywall
          visible={paywallOpen}
          courseId={course.id}
          courseTitle={course.title}
          priceUsd={course.price_usd ?? 0}
          onClose={() => setPaywallOpen(false)}
          onSuccess={() => setPaywallOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

function StatPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={13} color={colors.accent} />
      <Text style={styles.statPillText}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bgPrimary },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingBottom: spacing['4xl'] },

  // Hero
  hero: {
    height: 160,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroIcon: {},
  heroMeta: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.screen,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  heroTypeBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  heroTypeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.accent,
  },
  heroLevel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },

  // Sections
  section: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing['2xl'],
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  courseTitle: {
    fontFamily: fontFamily.black,
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    lineHeight: 32,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statPillText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.accent,
  },

  // Progress
  progressSection: {
    backgroundColor: colors.bgSecondary,
    marginHorizontal: spacing.screen,
    borderRadius: radius.lg,
    padding: spacing.md,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  progressCount: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textSecondary },

  // Weeks / days
  weeksContainer: { gap: spacing.sm },
  weekBlock: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  weekTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  daysContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayInfo: { flex: 1, gap: 2 },
  dayTitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  dayMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  startBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.bgPrimary,
  },
  redoBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Video list
  videoList: { gap: spacing.sm },

  // CTA
  ctaWrap: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing['2xl'],
  },
  ctaButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ctaButtonLocked: {
    backgroundColor: colors.textSecondary,
  },
  ctaText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.bgPrimary,
  },
});
