import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { Badge, Card, ProgressBar, SkeletonLoader, Text } from '../../src/components/ui';
import {
  useCommunityRoutines,
  useFeaturedCourses,
  useFeaturedVideos,
  usePurchasedCourses,
} from '../../src/features/home/hooks/useHomeData';
import { useHomeStats } from '../../src/features/home/hooks/useHomeStats';
import type {
  HomeCommunityRoutine,
  HomeCoursePurchased,
  HomeFeaturedCourse,
  HomeFeaturedVideo,
} from '../../src/features/home/types';
import { useAuthStore, usePurchasesStore } from '../../src/store';
import { colors, fontFamily, fontSize, radius, spacing } from '../../src/theme';
import { queryClient } from '../../src/lib/query-client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'greetingMorning';
  if (h >= 12 && h < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m}m`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionHeader}>
      <Text variant="h4">{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text variant="caption" color={colors.accent}>
            {t('common.seeAll')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function FeaturedVideoCard({
  item,
  onPress,
}: {
  item: HomeFeaturedVideo;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.videoCard} onPress={onPress}>
      <View style={styles.videoThumb}>
        {item.thumbnail_url && (
          <Image
            source={{ uri: item.thumbnail_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        )}
        <View style={styles.videoPlayIcon}>
          <Ionicons name="play" size={18} color={colors.textPrimary} />
        </View>
      </View>
      <Text variant="label" numberOfLines={2} style={styles.videoTitle}>
        {item.title}
      </Text>
      <Text variant="caption" color={colors.textTertiary}>
        {formatDuration(item.duration_seconds)} · {item.level}
      </Text>
    </Pressable>
  );
}

function PurchasedCourseCard({
  item,
  onPress,
}: {
  item: HomeCoursePurchased;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable style={styles.purchasedCard} onPress={onPress}>
      <Image
        source={item.thumbnail_url ? { uri: item.thumbnail_url } : undefined}
        style={styles.purchasedThumb}
        contentFit="cover"
      />
      <View style={styles.purchasedInfo}>
        <Badge
          label={
            item.type === 'training_program'
              ? t('courses.types.training_program')
              : t('courses.types.video_collection')
          }
          variant="accent"
        />
        <Text variant="bodyMedium" numberOfLines={2} style={styles.purchasedTitle}>
          {item.title}
        </Text>
        <ProgressBar progress={0} height={3} style={styles.purchasedProgress} />
        <Text variant="caption" color={colors.textTertiary}>
          {item.level}
        </Text>
      </View>
    </Pressable>
  );
}

function FeaturedCourseCard({
  item,
  onPress,
}: {
  item: HomeFeaturedCourse;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable style={styles.featuredCourseCard} onPress={onPress}>
      <Image
        source={item.thumbnail_url ? { uri: item.thumbnail_url } : undefined}
        style={styles.featuredCourseThumb}
        contentFit="cover"
      />
      <View style={styles.featuredCourseInfo}>
        <Badge
          label={
            item.type === 'training_program'
              ? t('courses.types.training_program')
              : t('courses.types.video_collection')
          }
        />
        <Text variant="bodyMedium" numberOfLines={2} style={styles.featuredCourseTitle}>
          {item.title}
        </Text>
        <Text variant="caption" color={colors.textTertiary}>
          {item.level}
        </Text>
        <Text variant="label" color={item.is_free ? colors.success : colors.accent}>
          {item.is_free
            ? t('common.free')
            : item.price_usd
              ? `$${item.price_usd.toFixed(2)}`
              : '—'}
        </Text>
      </View>
    </Pressable>
  );
}

function CommunityRoutineCard({
  item,
  onPress,
}: {
  item: HomeCommunityRoutine;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const initial = (item.author_name ?? item.title).charAt(0).toUpperCase();
  return (
    <Pressable style={styles.routineRow} onPress={onPress}>
      <View style={styles.routineAvatar}>
        <Text style={styles.routineAvatarLetter}>{initial}</Text>
      </View>
      <View style={styles.routineInfo}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {item.title}
        </Text>
        {item.author_name && (
          <Text variant="caption" color={colors.textSecondary}>
            {item.author_name}
          </Text>
        )}
      </View>
      <View style={styles.routineMeta}>
        <Ionicons name="heart" size={12} color={colors.textTertiary} />
        <Text variant="caption" color={colors.textTertiary}>
          {item.likes_count}
        </Text>
        {item.estimated_minutes > 0 && (
          <Text variant="caption" color={colors.textTertiary}>
            · {t('videos.duration', { min: item.estimated_minutes })}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function VideoSkeletonRow() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalList}
      scrollEnabled={false}
    >
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ gap: spacing.xs }}>
          <SkeletonLoader width={140} height={90} />
          <SkeletonLoader width={120} height={12} />
          <SkeletonLoader width={80} height={10} />
        </View>
      ))}
    </ScrollView>
  );
}

function CourseSkeletonList({ count = 2 }: { count?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.featuredCourseCard, { overflow: 'hidden' }]}>
          <SkeletonLoader width={100} height={90} borderRadius={0} />
          <View style={[styles.featuredCourseInfo, { gap: spacing.sm }]}>
            <SkeletonLoader width={80} height={18} />
            <SkeletonLoader width="90%" height={14} />
            <SkeletonLoader width={60} height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

function RoutineSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.routineRow, { alignItems: 'center' }]}>
          <SkeletonLoader width={36} height={36} borderRadius={radius.full} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonLoader width="70%" height={14} />
            <SkeletonLoader width="40%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const ownedCourseIds = usePurchasesStore((s) => s.ownedCourseIds);
  const stats = useHomeStats();

  const videosQuery = useFeaturedVideos();
  const coursesQuery = useFeaturedCourses();
  const purchasedQuery = usePurchasedCourses(ownedCourseIds);
  const routinesQuery = useCommunityRoutines();

  const isRefreshing =
    videosQuery.isRefetching ||
    coursesQuery.isRefetching ||
    routinesQuery.isRefetching;

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: ['home'] });
  }

  const firstName = user?.name?.split(' ')[0] ?? 'Atleta';
  const greetingKey = getGreetingKey();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <Image
            source={require('../../assets/images/LogoSimpleAzul.png')}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <Pressable onPress={() => router.push('/(tabs)/profile')} hitSlop={8}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ── Greeting ── */}
        <Text variant="h3" style={styles.greeting}>
          {t(`home.${greetingKey}`, { name: firstName })}
        </Text>

        {/* ── Quick stats ── */}
        <View style={styles.statsRow}>
          {(
            [
              [t('home.sessionsCompleted'), String(stats.sessions)],
              [t('home.streak'), stats.streak > 0 ? `${stats.streak} ${t('home.days')}` : `0 ${t('home.days')}`],
              [t('home.myRoutines'), String(stats.myRoutines)],
            ] as [string, string][]
          ).map(([label, value]) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue}>{value}</Text>
              <Text variant="caption" color={colors.textSecondary} align="center">
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Purchased courses (only if user has purchases) ── */}
        {ownedCourseIds.size > 0 && (
          <>
            <SectionHeader
              title={t('home.continueProgram')}
              onSeeAll={() => router.push('/(tabs)/courses')}
            />
            {purchasedQuery.isLoading ? (
              <CourseSkeletonList count={1} />
            ) : (
              purchasedQuery.data?.map((course) => (
                <PurchasedCourseCard
                  key={course.id}
                  item={course}
                  onPress={() =>
                    router.push(`/(tabs)/courses/${course.id}` as never)
                  }
                />
              ))
            )}
          </>
        )}

        {/* ── Featured videos ── */}
        <SectionHeader
          title={t('home.recentVideos')}
          onSeeAll={() => router.push('/(tabs)/videos')}
        />
        {videosQuery.isLoading ? (
          <VideoSkeletonRow />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {(videosQuery.data ?? []).map((video) => (
              <FeaturedVideoCard
                key={video.id}
                item={video}
                onPress={() =>
                  router.push(`/(tabs)/videos/${video.id}` as never)
                }
              />
            ))}
          </ScrollView>
        )}

        {/* ── Featured courses ── */}
        <SectionHeader
          title={t('home.featuredCourses')}
          onSeeAll={() => router.push('/(tabs)/courses')}
        />
        {coursesQuery.isLoading ? (
          <CourseSkeletonList count={2} />
        ) : (
          <View style={{ gap: spacing.md }}>
            {(coursesQuery.data ?? []).map((course) => (
              <FeaturedCourseCard
                key={course.id}
                item={course}
                onPress={() =>
                  router.push(`/(tabs)/courses/${course.id}` as never)
                }
              />
            ))}
          </View>
        )}

        {/* ── Community routines ── */}
        <SectionHeader
          title={t('home.communityRoutines')}
          onSeeAll={() => router.push('/(tabs)/routines')}
        />
        {routinesQuery.isLoading ? (
          <RoutineSkeletonList count={3} />
        ) : (
          <Card style={{ gap: 0, paddingHorizontal: 0, paddingVertical: 0 }}>
            {(routinesQuery.data ?? []).map((routine, idx, arr) => (
              <View key={routine.id}>
                <CommunityRoutineCard
                  item={routine}
                  onPress={() =>
                    router.push(`/routine/${routine.id}` as never)
                  }
                />
                {idx < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: spacing.screen, gap: spacing.lg },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
  },
  headerLogo: { width: 110, height: 28 },
  greeting: { marginTop: -spacing.xs },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  avatarLetter: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.accent,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },

  // Purchased course
  purchasedCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  purchasedThumb: {
    width: 100,
    height: 90,
    backgroundColor: colors.surface,
  },
  purchasedInfo: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  purchasedTitle: { marginTop: 2 },
  purchasedProgress: { marginTop: spacing.xs },

  // Featured video
  horizontalList: { gap: spacing.md, paddingRight: spacing.screen },
  videoCard: { width: 140, gap: spacing.xs },
  videoThumb: {
    width: 140,
    height: 90,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTitle: { marginTop: 2 },

  // Featured course
  featuredCourseCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  featuredCourseThumb: {
    width: 100,
    height: 90,
    backgroundColor: colors.surface,
  },
  featuredCourseInfo: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  featuredCourseTitle: { marginTop: 2 },

  // Community routines
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  routineAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineAvatarLetter: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.accent,
  },
  routineInfo: { flex: 1, gap: 2 },
  routineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  bottomPad: { height: spacing['2xl'] },
});
