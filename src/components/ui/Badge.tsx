import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';

type BadgeVariant = 'default' | 'accent' | 'free' | 'paid';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },

  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accent: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  free: {
    backgroundColor: colors.accent,
  },
  paid: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  text: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
  },
  text_default: { color: colors.textSecondary },
  text_accent: { color: colors.accent },
  text_free: { color: colors.bgPrimary },
  text_paid: { color: colors.textSecondary },
});
