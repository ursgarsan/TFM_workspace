import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, typography } from '@/theme';

type AppButtonProps = {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children?: React.ReactNode;
  compact?: boolean;
};

export default function AppButton({
  label,
  loading = false,
  disabled = false,
  onPress,
  children,
  compact = false,
}: AppButtonProps) {
  return (
    <Pressable
      style={[styles.button, compact ? styles.compactButton : null, disabled ? styles.disabledButton : null]}
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
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    paddingVertical: 0,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  label: {
    color: colors.surface,
    fontSize: typography.button,
    fontWeight: '700',
  },
});
