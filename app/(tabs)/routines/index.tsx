import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoutineCard } from '../../../src/components/routines/RoutineCard';
import { Chip } from '../../../src/components/ui/Chip';
import { Text } from '../../../src/components/ui';
import { Routine } from '../../../src/data/routines.mock';
import {
  getCommunityRoutines,
  getSavedRoutines,
  RoutinesSortKey,
} from '../../../src/services/routines.service';
import { colors, fontFamily, fontSize, radius, spacing } from '../../../src/theme';

type Section = 'community' | 'saved' | 'mine';

const SECTIONS: Array<{ key: Section; labelKey: string }> = [
  { key: 'community', labelKey: 'routines.community' },
  { key: 'saved',     labelKey: 'routines.saved' },
  { key: 'mine',      labelKey: 'routines.myRoutines' },
];

const SORT_OPTIONS: Array<{ key: RoutinesSortKey; labelKey: string }> = [
  { key: 'mostLiked', labelKey: 'routines.sortBy.mostLiked' },
  { key: 'newest',    labelKey: 'routines.sortBy.newest' },
];

export default function RoutinesScreen() {
  const { t }  = useTranslation();
  const router = useRouter();

  const [section,    setSection]    = useState<Section>('community');
  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState<RoutinesSortKey>('mostLiked');
  const [myRoutines, setMyRoutines] = useState<Routine[]>([]);
  const [likedIds,   setLikedIds]   = useState<Set<string>>(new Set());

  // Reload user routines from AsyncStorage every time screen gains focus
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('@volleytip/my_routines').then((raw) => {
        if (raw) setMyRoutines(JSON.parse(raw));
      });
    }, []),
  );

  function toggleLike(id: string) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const communityRoutines = useMemo(
    () => getCommunityRoutines({ search: search || undefined }, sort),
    [search, sort],
  );

  const savedRoutines = useMemo(() => getSavedRoutines(), []);

  const routines: Routine[] = useMemo(() => {
    if (section === 'mine')  return myRoutines;
    if (section === 'saved') return savedRoutines;
    return communityRoutines;
  }, [section, myRoutines, savedRoutines, communityRoutines]);

  const emptyText = {
    community: t('routines.emptyCommunity'),
    saved:     t('routines.emptySaved'),
    mine:      t('routines.emptyMine'),
  }[section];

  function renderItem({ item }: { item: Routine }) {
    const liked = likedIds.has(item.id);
    const displayItem: Routine = liked
      ? { ...item, likes_count: item.likes_count + 1, is_saved: true }
      : item;
    return (
      <RoutineCard
        routine={displayItem}
        onPress={() => router.push(`/routine/${item.id}` as any)}
        onSave={section === 'community' ? () => toggleLike(item.id) : undefined}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header row */}
      <View style={styles.headerRow}>
        <Text variant="h3">{t('nav.routines')}</Text>
        {section === 'mine' && (
          <Pressable
            style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/routine-builder' as any)}
          >
            <Ionicons name="add" size={18} color={colors.bgPrimary} />
            <Text style={styles.createBtnText}>{t('routines.create')}</Text>
          </Pressable>
        )}
      </View>

      {/* Section tabs */}
      <View style={styles.tabsRow}>
        {SECTIONS.map((s) => (
          <Pressable
            key={s.key}
            style={[styles.tab, section === s.key && styles.tabActive]}
            onPress={() => { setSection(s.key); setSearch(''); }}
          >
            <Text style={[styles.tabText, section === s.key && styles.tabTextActive]}>
              {t(s.labelKey as any)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search bar (community only) */}
      {section === 'community' && (
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar rutinas..."
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
      )}

      {/* Sort chips (community only) */}
      {section === 'community' && (
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((o) => (
            <Chip
              key={o.key}
              label={t(o.labelKey as any)}
              active={sort === o.key}
              onPress={() => setSort(o.key)}
            />
          ))}
        </View>
      )}

      {/* List */}
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {section === 'mine' ? (
              <>
                <Ionicons name="barbell-outline" size={40} color={colors.textTertiary} />
                <Text variant="bodySmall" color={colors.textSecondary} align="center">{emptyText}</Text>
                <Pressable
                  style={({ pressed }) => [styles.createBtnLarge, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push('/routine-builder' as any)}
                >
                  <Text style={styles.createBtnLargeText}>{t('routines.create')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
                <Text variant="bodySmall" color={colors.textSecondary} align="center">{emptyText}</Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  createBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.bgPrimary,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.accent },
  tabText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  tabTextActive: { color: colors.accent },

  // Search
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

  // Sort
  sortRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing['3xl'],
  },

  // Empty
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.lg,
  },
  createBtnLarge: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  createBtnLargeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.bgPrimary,
  },
});
