import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Button, Input, Text } from '../../src/components/ui';
import { useAuthStore } from '../../src/store';
import * as authService from '../../src/services/auth.service';
import { colors, fontFamily, fontSize, spacing } from '../../src/theme';

export default function RegisterScreen() {
  const { t }  = useTranslation();
  const router = useRouter();

  const [name,     setName]     = useState('');
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState<{ name?: string; username?: string; email?: string; password?: string }>({});
  const [confirmed, setConfirmed] = useState(false);

  const { signUp, signInWithGoogle, loading } = useAuthStore();

  function validate() {
    const e: typeof errors = {};
    if (!name.trim())     e.name     = t('errors.generic');
    if (!username.trim()) e.username = t('errors.generic');
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) e.username = t('auth.usernameHint');
    if (!email.trim())    e.email    = t('errors.generic');
    if (!password)        e.password = t('errors.generic');
    if (password && password.length < 8) e.password = t('auth.errorWeakPassword');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignUp() {
    if (!validate()) return;
    try {
      const { needsConfirmation } = await signUp(email.trim(), password, name.trim(), username.trim().toLowerCase());
      if (needsConfirmation) {
        setConfirmed(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      const key = authService.mapAuthError(msg);
      if (key === 'errorEmailInUse') {
        setErrors({ email: t('auth.errorEmailInUse') });
      } else if (key === 'errorWeakPassword') {
        setErrors({ password: t('auth.errorWeakPassword') });
      } else {
        Alert.alert(t('common.error'), t('errors.generic'));
      }
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle();
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'));
    }
  }

  // Email confirmation state
  if (confirmed) {
    return (
      <View style={styles.confirmContainer}>
        <Ionicons name="mail-outline" size={64} color={colors.accent} />
        <Text variant="h2" align="center" style={styles.confirmTitle}>
          {t('auth.confirmEmailTitle')}
        </Text>
        <Text variant="body" color={colors.textSecondary} align="center" style={styles.confirmMsg}>
          {t('auth.confirmEmailMessage')}
        </Text>
        <Button
          title={t('auth.login')}
          onPress={() => router.replace('/(auth)/login')}
          style={styles.confirmBtn}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>VolleyTip</Text>
          <Text variant="h2" style={styles.title}>{t('auth.registerTitle')}</Text>
          <Text variant="bodySmall" color={colors.textSecondary} align="center">
            {t('auth.registerSubtitle')}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label={t('auth.name')}
            placeholder="Juan Pérez"
            value={name}
            onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: undefined })); }}
            autoComplete="name"
            error={errors.name}
          />
          <Input
            label={t('auth.username')}
            placeholder="juanperez_vol"
            value={username}
            onChangeText={(v) => { setUsername(v); setErrors((e) => ({ ...e, username: undefined })); }}
            autoCapitalize="none"
            autoComplete="username"
            error={errors.username}
          />
          <Input
            label={t('auth.email')}
            placeholder="email@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email}
          />
          <Input
            label={t('auth.password')}
            placeholder="••••••••"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
            secureTextEntry
            autoComplete="new-password"
            error={errors.password}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={t('auth.register')}
            onPress={handleSignUp}
            loading={loading}
          />

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text variant="caption" color={colors.textTertiary} style={styles.orLabel}>
              {t('common.or')}
            </Text>
            <View style={styles.orLine} />
          </View>

          <Button
            title={t('auth.continueWithGoogle')}
            variant="secondary"
            onPress={handleGoogle}
            disabled={loading}
            leftIcon={<Ionicons name="logo-google" size={18} color={colors.accent} />}
          />
        </View>

        {/* Terms */}
        <Text variant="caption" color={colors.textTertiary} align="center">
          {t('auth.terms')}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" color={colors.textSecondary}>{t('auth.hasAccount')} </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable hitSlop={8}>
              <Text variant="bodySmall" color={colors.accent}>{t('auth.logInHere')}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bgPrimary },

  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing['2xl'],
  },

  backBtn: { alignSelf: 'flex-start' },

  header: { alignItems: 'center', gap: spacing.sm },

  logo: {
    fontFamily: fontFamily.black,
    fontSize: fontSize['3xl'],
    color: colors.accent,
    letterSpacing: -0.5,
  },

  title: { marginTop: spacing.xs },

  form: { gap: spacing.lg },

  actions: { gap: spacing.lg },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  orLine:  { flex: 1, height: 1, backgroundColor: colors.border },
  orLabel: { flexShrink: 0 },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },

  // Confirmation state
  confirmContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screen,
    gap: spacing.xl,
  },
  confirmTitle: { marginTop: spacing.md },
  confirmMsg:   { maxWidth: 300 },
  confirmBtn:   { marginTop: spacing.md },
});
