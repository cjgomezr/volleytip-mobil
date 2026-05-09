import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VideoCard } from '../../../src/components/videos/VideoCard';
import { Badge, Text } from '../../../src/components/ui';
import { getRelatedVideos, getVideoById } from '../../../src/services/videos.service';
import { resolveVideoUrl } from '../../../src/lib/r2';
import { colors, fontFamily, fontSize, radius, spacing } from '../../../src/theme';

const VIDEO_HEIGHT = Dimensions.get('window').width * (9 / 16);

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoDetailScreen() {
  const { t }  = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const video = getVideoById(id ?? '');

  const player = useVideoPlayer(
    video ? resolveVideoUrl(video.video_url, video.video_key) : null,
    (p) => {
      p.loop = false;
      p.timeUpdateEventInterval = 0.5;
      p.play();
    },
  );

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: false });
  const { status }    = useEvent(player, 'statusChange',  { status: player.status });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(video?.duration_seconds ?? 0);

  useEventListener(player, 'timeUpdate', (e) => setCurrentTime(e.currentTime));
  useEventListener(player, 'sourceLoad', (e) => { if (e.duration > 0) setDuration(e.duration); });
  useEventListener(player, 'playToEnd',  ()  => setCurrentTime(0));

  // Pause when navigating away (tab switch, back, etc.)
  useFocusEffect(
    useCallback(() => {
      return () => { player.pause(); };
    }, [player]),
  );

  if (!video) {
    return (
      <SafeAreaView style={styles.notFound}>
        <Text variant="body" color={colors.textSecondary}>{t('errors.notFound')}</Text>
      </SafeAreaView>
    );
  }

  const related  = getRelatedVideos(video);
  const progress = duration > 0 ? currentTime / duration : 0;
  const minutes  = Math.ceil(video.duration_seconds / 60);

  return (
    <View style={styles.flex}>
      {/* Header with safe-area top */}
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.navigate('/(tabs)/videos')} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text variant="h4" style={styles.headerTitle} numberOfLines={1}>{video.title}</Text>
        </View>
      </SafeAreaView>

      {/* Video player */}
      <View style={styles.videoWrap}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen
        />

        {/* Tap to toggle play/pause */}
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => (isPlaying ? player.pause() : player.play())}
        >
          {/* Center: spinner while loading, play icon while paused */}
          <View style={styles.centerControl} pointerEvents="none">
            {status === 'loading' ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : !isPlaying ? (
              <View style={styles.playBtn}>
                <Ionicons name="play" size={36} color="#fff" />
              </View>
            ) : null}
          </View>
        </Pressable>

        {/* Bottom progress bar */}
        <View style={styles.progressBar} pointerEvents="none">
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
          <View style={styles.trackOuter}>
            <View style={[styles.trackInner, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + badges */}
        <Text variant="h3">{video.title}</Text>
        <View style={styles.badgeRow}>
          <Badge label={video.category_name} />
          <Badge label={t(`videos.levels.${video.level}`)} variant="accent" />
          {video.is_free && <Badge label={t('common.free')} variant="free" />}
          <Text variant="caption" color={colors.textTertiary}>
            {t('videos.duration', { min: minutes })}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            DESCRIPCIÓN
          </Text>
          <Text variant="body" color={colors.textSecondary}>{video.description}</Text>
        </View>

        {/* Key points */}
        {video.key_points.length > 0 && (
          <View style={styles.section}>
            <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
              {t('videos.detail.keyPoints').toUpperCase()}
            </Text>
            {video.key_points.map((point, i) => (
              <View key={i} style={styles.keyPoint}>
                <View style={styles.bullet} />
                <Text variant="body" style={styles.keyPointText}>{point}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Related videos */}
        {related.length > 0 && (
          <View style={styles.section}>
            <Text variant="h4" style={styles.sectionTitle}>{t('videos.detail.relatedVideos')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedList}
            >
              {related.map((rv) => (
                <VideoCard
                  key={rv.id}
                  video={rv}
                  compact
                  onPress={() => router.replace(`/(tabs)/videos/${rv.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:     { flex: 1, backgroundColor: colors.bgPrimary },
  notFound: { flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center' },

  // Header
  headerSafe: { backgroundColor: colors.bgPrimary },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
  },
  backBtn:     { flexShrink: 0 },
  headerTitle: { flex: 1 },

  // Player
  videoWrap: {
    width: '100%',
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  video: { width: '100%', height: '100%' },

  centerControl: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  timeText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.75)',
  },
  trackOuter: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  trackInner: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },

  // Content
  scroll:        { flex: 1 },
  scrollContent: { padding: spacing.screen, gap: spacing.lg },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },

  section: { gap: spacing.sm },
  sectionTitle: { letterSpacing: 0.6, marginBottom: spacing.xs },

  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    marginTop: 9,
    flexShrink: 0,
  },
  keyPointText: { flex: 1 },

  relatedList: { gap: spacing.md, paddingRight: spacing.screen },
});
