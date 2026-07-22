import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, typography } from '@/theme';

type AppButtonProps = {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children?: React.ReactNode;
  compact?: boolean;
  variant?: 'primary' | 'danger';
};

export default function AppButton({
  label,
  loading = false,
  disabled = false,
  onPress,
  children,
  compact = false,
  variant = 'primary',
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.compactButton : null,
        variant === 'danger' ? styles.dangerButton : null,
        pressed && !disabled && !loading ? styles.pressedButton : null,
        pressed && !disabled && !loading && variant === 'danger' ? styles.dangerPressedButton : null,
        disabled ? styles.disabledButton : null,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color={colors.surface} /> : children ?? <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 56,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedButton: {
    backgroundColor: colors.primaryStrong,
  },
  compactButton: {
    width: 48,
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 0,
  },
  disabledButton: {
    backgroundColor: '#A8B0B8',
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  dangerPressedButton: {
    backgroundColor: '#982338',
  },
  label: {
    color: colors.surface,
    fontSize: typography.button,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
