import { Link, Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../src/components/ui';
import { colors, spacing } from '../src/theme';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text variant="h3">{t('common.notFound')}</Text>
        <Link href="/" style={styles.link}>
          <Text variant="bodyMedium" color={colors.accent}>{t('common.goHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screen,
  },
  link: { marginTop: spacing.lg },
});
