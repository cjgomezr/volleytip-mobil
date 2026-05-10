import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
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

import { Image } from 'expo-image';
import { Button, Input, Text } from '../../src/components/ui';
import { useAuthStore } from '../../src/store';
import * as authService from '../../src/services/auth.service';
import { colors, spacing } from '../../src/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [credential, setCredential] = useState('');
  const [password,   setPassword]   = useState('');
  const [errors,     setErrors]     = useState<{ credential?: string; password?: string }>({});

  const { signIn, signInWithGoogle, loading } = useAuthStore();

  function validate() {
    const e: typeof errors = {};
    if (!credential.trim()) e.credential = t('errors.generic');
    if (!password)          e.password   = t('errors.generic');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignIn() {
    if (!validate()) return;
    try {
      await signIn(credential.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      const key = authService.mapAuthError(msg);
      if (key) {
        setErrors({ password: t(`auth.${key}`) });
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

  async function handleForgotPassword() {
    const isEmail = credential.trim().includes('@');
    if (!isEmail) {
      Alert.alert('', t('auth.emailRequired'));
      return;
    }
    try {
      await authService.resetPassword(credential.trim());
      Alert.alert(t('auth.forgotPassword'), t('auth.resetPasswordSent'));
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'));
    }
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
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/LogoVertical.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text variant="h2" style={styles.title}>{t('auth.loginTitle')}</Text>
          <Text variant="bodySmall" color={colors.textSecondary} align="center">
            {t('auth.loginSubtitle')}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label={t('auth.usernameOrEmail')}
            placeholder="email@example.com"
            value={credential}
            onChangeText={(v) => { setCredential(v); setErrors((e) => ({ ...e, credential: undefined })); }}
            autoCapitalize="none"
            autoComplete="username"
            error={errors.credential}
          />
          <Input
            label={t('auth.password')}
            placeholder="••••••••"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
            secureTextEntry
            autoComplete="current-password"
            error={errors.password}
          />
          <Pressable onPress={handleForgotPassword} style={styles.forgotBtn} hitSlop={8}>
            <Text variant="caption" color={colors.accent}>{t('auth.forgotPassword')}</Text>
          </Pressable>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={t('auth.login')}
            onPress={handleSignIn}
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" color={colors.textSecondary}>{t('auth.noAccount')} </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable hitSlop={8}>
              <Text variant="bodySmall" color={colors.accent}>{t('auth.signUpHere')}</Text>
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
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing['3xl'],
    gap: spacing['2xl'],
  },

  header: { alignItems: 'center', gap: spacing.sm },

  logo: {
    width: 160,
    height: 120,
  },

  title: { marginTop: spacing.xs },

  form: { gap: spacing.lg },

  forgotBtn: { alignSelf: 'flex-end' },

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
});
