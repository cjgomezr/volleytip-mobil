import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VideoCard } from '../../../src/components/videos/VideoCard';
import { Chip, SkeletonLoader, Text } from '../../../src/components/ui';
import { VideoItem } from '../../../src/data/videos.mock';
import { useVideos } from '../../../src/features/videos/hooks/useVideosData';
import { getCategories } from '../../../src/services/videos.service';
import { queryClient } from '../../../src/lib/query-client';
import { colors, fontFamily, fontSize, radius, spacing } from '../../../src/theme';

const LEVELS = ['basico', 'intermedio', 'avanzado'] as const;
const CATEGORIES = getCategories();

export default function VideosScreen() {
  const { t }  = useTranslation();
  const router = useRouter();

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [level,    setLevel]    = useState('');

  const { data: videos, isLoading, refetch } = useVideos({
    categorySlug: category || undefined,
    level:        level    || undefined,
    search:       search   || undefined,
  });

  function renderItem({ item }: { item: VideoItem }) {
    return (
      <VideoCard
        video={item}
        onPress={() => router.push(`/(tabs)/videos/${item.id}`)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Title row */}
      <View style={styles.titleRow}>
        <Text variant="h3">{t('nav.videos')}</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('videos.search')}
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Category chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.slug}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        renderItem={({ item }) => (
          <Chip
            label={t(item.nameKey as any)}
            active={category === item.slug}
            onPress={() => setCategory(category === item.slug ? '' : item.slug)}
          />
        )}
        ListHeaderComponent={
          <Chip
            label={t('videos.categories.all')}
            active={category === ''}
            onPress={() => setCategory('')}
          />
        }
        style={styles.chipsScroll}
      />

      {/* Level chips */}
      <View style={styles.levelRow}>
        <Chip label={t('videos.levels.all')} active={level === ''} onPress={() => setLevel('')} />
        {LEVELS.map((lv) => (
          <Chip
            key={lv}
            label={t(`videos.levels.${lv}`)}
            active={level === lv}
            onPress={() => setLevel(level === lv ? '' : lv)}
          />
        ))}
      </View>

      {/* Video grid */}
      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLoader key={i} height={160} style={styles.skeletonCard} />
          ))}
        </View>
      ) : (
        <FlatList
          style={styles.videoList}
          data={videos ?? []}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                queryClient.invalidateQueries({ queryKey: ['videos'] });
                refetch();
              }}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
              <Text variant="bodySmall" color={colors.textSecondary} align="center">
                {t('videos.noResults')}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },

  titleRow: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screen,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    height: '100%',
  },

  chipsScroll: { flexGrow: 0 },
  chipsRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
  },

  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.screen,
  },
  skeletonCard: { width: '47%', borderRadius: 12 },

  videoList: { flex: 1 },
  columnWrapper: { gap: spacing.md, paddingHorizontal: spacing.screen },
  listContent:   { gap: spacing.md, paddingBottom: spacing['3xl'] },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.lg,
  },
});
