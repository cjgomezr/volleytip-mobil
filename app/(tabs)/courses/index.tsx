import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CourseCard } from '../../../src/components/courses/CourseCard';
import { Chip } from '../../../src/components/ui/Chip';
import { Text } from '../../../src/components/ui';
import { CourseItem } from '../../../src/data/courses.mock';
import { getAllCourses } from '../../../src/services/courses.service';
import { colors, fontFamily, fontSize, radius, spacing } from '../../../src/theme';
import { CourseType } from '../../../src/types/database.types';

const TYPE_FILTERS: Array<{ key: CourseType | 'all'; label: string }> = [
  { key: 'all',              label: 'Todos' },
  { key: 'training_program', label: 'Programas' },
  { key: 'video_collection', label: 'Colecciones' },
];

export default function CoursesScreen() {
  const { t }  = useTranslation();
  const router = useRouter();

  const [search,   setSearch]   = useState('');
  const [typeKey,  setTypeKey]  = useState<CourseType | 'all'>('all');

  const courses = useMemo(
    () =>
      getAllCourses({
        type:   typeKey !== 'all' ? typeKey : undefined,
        search: search || undefined,
      }),
    [typeKey, search],
  );

  function renderItem({ item }: { item: CourseItem }) {
    return (
      <CourseCard
        course={item}
        onPress={() => router.push(`/(tabs)/courses/${item.id}`)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Title */}
      <View style={styles.titleRow}>
        <Text variant="h3">{t('nav.courses')}</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('courses.search')}
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

      {/* Type filter chips */}
      <View style={styles.chipsRow}>
        {TYPE_FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            active={typeKey === f.key}
            onPress={() => setTypeKey(f.key)}
          />
        ))}
      </View>

      {/* Course list */}
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
            <Text variant="bodySmall" color={colors.textSecondary} align="center">
              {t('courses.noResults')}
            </Text>
          </View>
        }
      />
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

  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
  },

  listContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing['3xl'],
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.lg,
  },
});
