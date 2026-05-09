import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active = false, onPress, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.active : styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  active: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  inactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  pressed: { opacity: 0.75 },

  label: { fontFamily: fontFamily.medium, fontSize: fontSize.sm },
  labelActive: { color: colors.accent },
  labelInactive: { color: colors.textSecondary },
});
