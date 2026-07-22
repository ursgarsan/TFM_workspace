import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { colors, radius, typography } from '@/theme';

export default function AppTextInput(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textMuted}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: typography.body,
  },
});
