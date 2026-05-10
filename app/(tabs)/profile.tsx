import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, SkeletonLoader, Text } from '../../src/components/ui';
import { usePurchasedCourses } from '../../src/features/home/hooks/useHomeData';
import { useHomeStats } from '../../src/features/home/hooks/useHomeStats';
import { uploadAvatar, updateProfile } from '../../src/features/profile/services/profile.service';
import { SupportedLanguage } from '../../src/i18n';
import { useAuthStore, usePurchasesStore } from '../../src/store';
import { useLanguageStore } from '../../src/store/language.store';
import { colors, fontFamily, fontSize, radius, spacing } from '../../src/theme';

// ─── Social links ─────────────────────────────────────────────────────────────

const SOCIAL_LINKS = [
  { key: 'instagram', icon: 'logo-instagram' as const, label: 'Instagram', url: 'https://www.instagram.com/volleytip/' },
  { key: 'tiktok',    icon: 'logo-tiktok'    as const, label: 'TikTok',    url: 'https://www.tiktok.com/@volleytip' },
  { key: 'twitter',   icon: 'logo-twitter'   as const, label: 'X',         url: 'https://x.com/volleytip' },
  { key: 'web',       icon: 'globe-outline'  as const, label: 'Web',       url: 'https://www.volleytip.com/' },
];

function SocialButton({ icon, label, url }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; url: string }) {
  return (
    <Pressable style={styles.socialBtn} onPress={() => Linking.openURL(url)}>
      {({ pressed }) => (
        <>
          <Ionicons name={icon} size={26} color={pressed ? colors.accent : colors.textPrimary} />
          <Text variant="caption" color={pressed ? colors.accent : colors.textSecondary} align="center">
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
        {title.toUpperCase()}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  onPress,
  destructive = false,
  last = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      style={[styles.settingRow, last && styles.settingRowLast]}
      onPress={onPress}
      android_ripple={{ color: colors.border }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={destructive ? colors.error : colors.textSecondary}
      />
      <Text
        variant="body"
        style={[styles.settingLabel, destructive && { color: colors.error }]}
      >
        {label}
      </Text>
      {!destructive && (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const user       = useAuthStore((s) => s.user);
  const session    = useAuthStore((s) => s.session);
  const signOut    = useAuthStore((s) => s.signOut);
  const updateUser = useAuthStore((s) => s.updateUser);
  const loading    = useAuthStore((s) => s.loading);

  const ownedCourseIds = usePurchasesStore((s) => s.ownedCourseIds);
  const resetPurchases = usePurchasesStore((s) => s.reset);

  const { language, setLanguage } = useLanguageStore();
  const stats = useHomeStats();

  const purchasedQuery = usePurchasedCourses(ownedCourseIds);

  const [avatarLoading, setAvatarLoading] = useState(false);

  const displayName = user?.name ?? session?.user?.email?.split('@')[0] ?? 'Atleta';
  const email       = session?.user?.email ?? '';
  const initial     = displayName.charAt(0).toUpperCase();
  const avatarUri   = user?.avatar_url ?? null;

  // ── Avatar picker ──────────────────────────────────────────────────────────

  async function handleAvatarPress() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('', 'Se necesita permiso para acceder a las fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    const userId = session?.user.id;
    if (!userId) return;

    setAvatarLoading(true);
    try {
      const publicUrl = await uploadAvatar(userId, uri);
      await updateProfile(userId, { avatar_url: publicUrl });
      updateUser({ avatar_url: publicUrl });
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'));
    } finally {
      setAvatarLoading(false);
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  function handleLogout() {
    Alert.alert(
      t('auth.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            resetPurchases();
            await signOut();
          },
        },
      ],
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text variant="h3" style={styles.screenTitle}>{t('profile.title')}</Text>

        {/* ── Avatar + info ── */}
        <View style={styles.userCard}>
          <Pressable onPress={handleAvatarPress} style={styles.avatarWrap} disabled={avatarLoading}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImg}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{initial}</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons
                name={avatarLoading ? 'hourglass-outline' : 'camera'}
                size={12}
                color={colors.bgPrimary}
              />
            </View>
          </Pressable>

          <View style={styles.userInfo}>
            <Text variant="bodyMedium">{displayName}</Text>
            <Text variant="caption" color={colors.textSecondary}>{email}</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {(
            [
              [t('profile.stats.sessions'), String(stats.sessions)],
              [t('home.streak'),            stats.streak > 0 ? `${stats.streak}d` : '0d'],
              [t('home.myRoutines'),        String(stats.myRoutines)],
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

        {/* ── Mis cursos comprados ── */}
        {ownedCourseIds.size > 0 && (
          <SectionBlock title={t('profile.myCourses')}>
            {purchasedQuery.isLoading ? (
              <View style={{ gap: spacing.sm, padding: spacing.md }}>
                <SkeletonLoader height={18} width="80%" />
                <SkeletonLoader height={18} width="60%" />
              </View>
            ) : (
              (purchasedQuery.data ?? []).map((course, idx, arr) => (
                <Pressable
                  key={course.id}
                  style={[
                    styles.courseRow,
                    idx < arr.length - 1 && styles.courseRowBorder,
                  ]}
                  onPress={() => router.push(`/(tabs)/courses/${course.id}` as never)}
                  android_ripple={{ color: colors.border }}
                >
                  <View style={styles.courseThumb} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodySmall" numberOfLines={1}>{course.title}</Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {t(`courses.levels.${course.level}`)} · {t(`courses.types.${course.type}`)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </Pressable>
              ))
            )}
          </SectionBlock>
        )}

        {/* ── Idioma ── */}
        <SectionBlock title={t('profile.language')}>
          <View style={styles.chipRow}>
            {(['es', 'en'] as SupportedLanguage[]).map((lang) => (
              <Chip
                key={lang}
                label={t(`profile.languages.${lang}`)}
                active={language === lang}
                onPress={() => setLanguage(lang)}
              />
            ))}
          </View>
        </SectionBlock>

        {/* ── Configuración ── */}
        <SectionBlock title={t('profile.settings')}>
          <SettingRow icon="document-text-outline" label={t('profile.terms')} />
          <SettingRow icon="shield-checkmark-outline" label={t('profile.privacy')} />
          <SettingRow icon="help-circle-outline" label={t('profile.support')} last />
        </SectionBlock>

        {/* ── Seguinos ── */}
        <SectionBlock title={t('profile.followUs')}>
          <View style={styles.socialRow}>
            {SOCIAL_LINKS.map(({ key, icon, label, url }) => (
              <SocialButton key={key} icon={icon} label={label} url={url} />
            ))}
          </View>
        </SectionBlock>

        {/* ── Cerrar sesión ── */}
        <Button
          title={t('auth.logout')}
          variant="ghost"
          onPress={handleLogout}
          loading={loading}
          style={styles.logoutBtn}
        />

        {/* ── Versión ── */}
        <Text variant="caption" color={colors.textTertiary} align="center">
          {t('profile.version', { version: '1.0.0' })}
        </Text>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: spacing.screen, gap: spacing['2xl'] },

  screenTitle: { paddingTop: spacing.xl },

  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  avatarWrap: { position: 'relative' },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarLetter: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.accent,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgSecondary,
  },
  userInfo: { flex: 1, gap: 2 },

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

  // Courses
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  courseRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  courseThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },

  // Section
  section: { gap: spacing.sm },
  sectionTitle: { letterSpacing: 0.8 },
  sectionBody: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingRowLast: { borderBottomWidth: 0 },
  settingLabel: { flex: 1 },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  socialBtn: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },

  logoutBtn: { borderColor: colors.error },
  bottomPad: { height: spacing.lg },
});
