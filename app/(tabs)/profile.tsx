import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, Text } from '../../src/components/ui';
import { changeLanguage, SupportedLanguage } from '../../src/i18n';
import { useAuthStore } from '../../src/store';
import { useLanguageStore } from '../../src/store/language.store';
import { colors, fontFamily, fontSize, radius, spacing } from '../../src/theme';

export default function ProfileScreen() {
  const { t } = useTranslation();

  const user    = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const loading = useAuthStore((s) => s.loading);

  const { language, setLanguage } = useLanguageStore();

  const displayName = user?.name ?? session?.user?.email?.split('@')[0] ?? 'Atleta';
  const email       = session?.user?.email ?? '';
  const initial     = displayName.charAt(0).toUpperCase();

  async function handleLanguageChange(lang: SupportedLanguage) {
    await changeLanguage(lang);
    setLanguage(lang);
  }

  function handleLogout() {
    Alert.alert(
      t('auth.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: signOut,
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text variant="h3" style={styles.screenTitle}>{t('profile.title')}</Text>

        {/* Avatar + user info */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text variant="bodyMedium">{displayName}</Text>
            <Text variant="caption" color={colors.textSecondary}>{email}</Text>
          </View>
          <Pressable hitSlop={8}>
            <Ionicons name="create-outline" size={20} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {([
            [t('profile.stats.sessions'), '0'],
            [t('profile.stats.time'),     '0h'],
            [t('profile.stats.streak'),   '0'],
          ] as [string, string][]).map(([label, value]) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue}>{value}</Text>
              <Text variant="caption" color={colors.textSecondary} align="center">{label}</Text>
            </View>
          ))}
        </View>

        {/* Language */}
        <SectionBlock title={t('profile.language')}>
          <View style={styles.chipRow}>
            {(['es', 'en'] as SupportedLanguage[]).map((lang) => (
              <Chip
                key={lang}
                label={t(`profile.languages.${lang}`)}
                active={language === lang}
                onPress={() => handleLanguageChange(lang)}
              />
            ))}
          </View>
        </SectionBlock>

        {/* Settings */}
        <SectionBlock title={t('profile.settings')}>
          <SettingRow icon="document-text-outline" label={t('profile.terms')} />
          <SettingRow icon="shield-checkmark-outline" label={t('profile.privacy')} />
          <SettingRow icon="help-circle-outline" label={t('profile.support')} />
        </SectionBlock>

        {/* Logout */}
        <Button
          title={t('auth.logout')}
          variant="ghost"
          onPress={handleLogout}
          loading={loading}
          style={styles.logoutBtn}
        />

        {/* Version */}
        <Text variant="caption" color={colors.textTertiary} align="center">
          {t('profile.version', { version: '1.0.0' })}
        </Text>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

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

function SettingRow({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <Pressable style={styles.settingRow} android_ripple={{ color: colors.border }}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text variant="body" style={styles.settingLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  avatarLetter: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.accent,
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
  settingLabel: { flex: 1 },

  logoutBtn: { borderColor: colors.error },

  bottomPad: { height: spacing.lg },
});
