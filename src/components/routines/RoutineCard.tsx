import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../ui';
import { Routine } from '../../data/routines.mock';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';

interface RoutineCardProps {
  routine: Routine;
  onPress: () => void;
  onSave?: () => void;
}

const LEVEL_COLOR: Record<string, string> = {
  basico:      colors.success,
  intermedio:  colors.warning,
  avanzado:    colors.error,
};

export function RoutineCard({ routine, onPress, onSave }: RoutineCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="barbell-outline" size={22} color={colors.accent} />
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{routine.title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.levelDot, { backgroundColor: LEVEL_COLOR[routine.level] ?? colors.textTertiary }]} />
            <Text style={styles.meta}>{routine.level}</Text>
            <Text style={styles.metaSep}>·</Text>
            <Text style={styles.meta}>{routine.exercises.length} ejercicios</Text>
            <Text style={styles.metaSep}>·</Text>
            <Text style={styles.meta}>~{routine.estimated_minutes}min</Text>
          </View>
        </View>

        {onSave && (
          <Pressable onPress={onSave} hitSlop={8} style={styles.saveBtn}>
            <Ionicons
              name={routine.is_saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={routine.is_saved ? colors.accent : colors.textTertiary}
            />
          </Pressable>
        )}
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>{routine.description}</Text>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorInitial}>
              {routine.author_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.authorName} numberOfLines={1}>{routine.author_name}</Text>
        </View>

        <View style={styles.likesRow}>
          <Ionicons name="heart-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.likesText}>{routine.likes_count}</Text>
        </View>
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
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.8 },

  // Top row
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, gap: 3 },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelDot: { width: 6, height: 6, borderRadius: 3 },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  metaSep: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  saveBtn: { paddingLeft: spacing.xs },

  // Description
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Bottom row
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: colors.accent,
  },
  authorName: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    maxWidth: 140,
  },
  likesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likesText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
});
