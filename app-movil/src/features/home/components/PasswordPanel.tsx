import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppTextInput } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

type PasswordPanelProps = {
  currentPassword: string;
  newPassword: string;
  repeatedPassword: string;
  saving: boolean;
  successMessage: string | null;
  allowBack: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onRepeatedPasswordChange: (value: string) => void;
  onSave: () => void;
  onBack: () => void;
};

export default function PasswordPanel({
  currentPassword,
  newPassword,
  repeatedPassword,
  saving,
  successMessage,
  allowBack,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onRepeatedPasswordChange,
  onSave,
  onBack,
}: PasswordPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.helpText}>
        {allowBack
          ? 'La nueva contraseña debe tener al menos 8 caracteres.'
          : 'Por seguridad, debe cambiar la contraseña temporal antes de continuar. La nueva contraseña debe tener al menos 8 caracteres.'}
      </Text>

      <Text style={styles.label}>Contraseña actual</Text>
      <AppTextInput
        value={currentPassword}
        onChangeText={onCurrentPasswordChange}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        accessibilityLabel="Contraseña actual"
      />

      <Text style={styles.label}>Nueva contraseña</Text>
      <AppTextInput
        value={newPassword}
        onChangeText={onNewPasswordChange}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        accessibilityLabel="Nueva contraseña"
      />

      <Text style={styles.label}>Repita la nueva contraseña</Text>
      <AppTextInput
        value={repeatedPassword}
        onChangeText={onRepeatedPasswordChange}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        accessibilityLabel="Repita la nueva contraseña"
      />

      {successMessage ? (
        <Text style={styles.successText} accessibilityRole="alert">
          {successMessage}
        </Text>
      ) : null}

      <AppButton label="Cambiar contraseña" loading={saving} onPress={onSave} />
      {allowBack ? <AppButton label="Volver a mis tomas" disabled={saving} onPress={onBack} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  helpText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 25,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '700',
  },
  successText: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.primaryStrong,
    fontSize: typography.body,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
