import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth = true,
  leftIcon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        size === 'sm' && styles.sizeSm,
        size === 'md' && styles.sizeMd,
        size === 'lg' && styles.sizeLg,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.bgPrimary : colors.accent}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <Text style={[
            styles.label,
            size === 'sm' && styles.labelSm,
            size === 'lg' && styles.labelLg,
            variant === 'primary' && styles.labelPrimary,
            variant !== 'primary' && styles.labelAccent,
          ]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: { width: '100%' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.4 },

  primary: { backgroundColor: colors.accent },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  ghost: { backgroundColor: 'transparent' },

  sizeSm: { height: 40, paddingHorizontal: spacing.lg },
  sizeMd: { height: 52, paddingHorizontal: spacing.xl },
  sizeLg: { height: 60, paddingHorizontal: spacing['2xl'] },

  label: { fontFamily: fontFamily.bold, fontSize: fontSize.base, letterSpacing: 0.3 },
  labelSm: { fontSize: fontSize.sm },
  labelLg: { fontSize: fontSize.lg },
  labelPrimary: { color: colors.bgPrimary },
  labelAccent: { color: colors.accent },
});
