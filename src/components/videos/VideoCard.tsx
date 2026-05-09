import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { VideoItem } from '../../data/videos.mock';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';
import { Text } from '../ui';

interface VideoCardProps {
  video:    VideoItem;
  onPress:  () => void;
  compact?: boolean;
}

export function VideoCard({ video, onPress, compact = false }: VideoCardProps) {
  const { t } = useTranslation();
  const minutes = Math.ceil(video.duration_seconds / 60);

  if (compact) {
    return (
      <Pressable onPress={onPress} style={styles.compact}>
        <View style={styles.compactThumb}>
          {video.thumbnail_url ? (
            <Image source={{ uri: video.thumbnail_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons name="play-circle-outline" size={28} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.durationTag}>
            <Text style={styles.durationText}>{t('videos.duration', { min: minutes })}</Text>
          </View>
        </View>
        <Text variant="label" numberOfLines={2} style={styles.compactTitle}>{video.title}</Text>
        <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>
          {t(`videos.levels.${video.level}`)}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Thumbnail */}
      <View style={styles.thumb}>
        {video.thumbnail_url ? (
          <Image source={{ uri: video.thumbnail_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="play-circle-outline" size={36} color={colors.textTertiary} />
          </View>
        )}
        {/* Duration bottom-right */}
        <View style={styles.durationTag}>
          <Text style={styles.durationText}>{t('videos.duration', { min: minutes })}</Text>
        </View>
        {/* Free badge top-left */}
        {video.is_free && (
          <View style={styles.freeTag}>
            <Text style={styles.freeText}>{t('common.free')}</Text>
          </View>
        )}
      </View>
      {/* Info */}
      <View style={styles.info}>
        <Text variant="label" numberOfLines={2}>{video.title}</Text>
        <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>
          {video.category_name} · {t(`videos.levels.${video.level}`)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // ── Grid card ─────────────────────────────────────────────────
  card: { flex: 1 },
  cardPressed: { opacity: 0.75 },

  thumb: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  thumbPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationTag: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: '#fff',
  },
  freeTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.accentDim,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  freeText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: colors.accent,
  },
  info: { paddingTop: spacing.xs, gap: 2 },

  // ── Compact card (horizontal scroll) ─────────────────────────
  compact: { width: 148, gap: spacing.xs },
  compactThumb: {
    width: 148,
    height: 83,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  compactTitle: { fontSize: fontSize.xs },
});
