import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../ui';
import { ProgressBar } from '../ui/ProgressBar';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';
import { CourseItem } from '../../data/courses.mock';

interface CourseCardProps {
  course:    CourseItem;
  onPress:   () => void;
  progress?: number; // 0–1, shown as progress bar when provided
}

const TYPE_ICONS: Record<CourseItem['type'], keyof typeof Ionicons.glyphMap> = {
  training_program: 'barbell-outline',
  video_collection: 'play-circle-outline',
};

const TYPE_LABELS: Record<CourseItem['type'], string> = {
  training_program: 'Programa',
  video_collection: 'Colección',
};

export function CourseCard({ course, onPress, progress }: CourseCardProps) {
  const icon = TYPE_ICONS[course.type];

  const meta =
    course.type === 'training_program'
      ? `${course.total_weeks} semanas · ${course.sessions_per_week}×/sem · ~${course.estimated_minutes_per_session}min`
      : `${course.video_ids.length} videos`;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailWrap}>
        {course.thumbnail_url ? (
          <Image source={{ uri: course.thumbnail_url }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name={icon} size={40} color={colors.accent} />
          </View>
        )}

        {/* Type badge */}
        <View style={styles.typeBadge}>
          <Ionicons name={icon} size={11} color={colors.accent} />
          <Text style={styles.typeBadgeText}>{TYPE_LABELS[course.type]}</Text>
        </View>

        {/* Free tag */}
        {course.is_free && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>Gratis</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Level chip */}
        <View style={styles.levelChip}>
          <Text style={styles.levelText}>{course.level}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
        <Text style={styles.meta}>{meta}</Text>

        {/* Progress bar (only when enrolled) */}
        {progress !== undefined && (
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} height={3} />
            <Text style={styles.progressLabel}>{Math.round(progress * 100)}% completado</Text>
          </View>
        )}

        {/* Price row */}
        {!course.is_free && (
          <Text style={styles.price}>
            ${course.price_usd?.toFixed(2)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.8 },

  // Thumbnail
  thumbnailWrap: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Badges
  typeBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.accent,
  },
  freeBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  freeBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.bgPrimary,
  },

  // Body
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  levelChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: 2,
  },
  levelText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.accent,
    textTransform: 'capitalize',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  progressWrap: { gap: 4, marginTop: 4 },
  progressLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  price: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.accent,
    marginTop: 2,
  },
});
