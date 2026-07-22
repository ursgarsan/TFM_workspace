import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppTextInput } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

type ProfilePanelProps = {
  fullName: string;
  email: string;
  saving: boolean;
  successMessage: string | null;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSave: () => void;
  onBack: () => void;
};

export default function ProfilePanel({
  fullName,
  email,
  saving,
  successMessage,
  onFullNameChange,
  onEmailChange,
  onSave,
  onBack,
}: ProfilePanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.helpText}>Revise sus datos y pulse “Guardar cambios”.</Text>

      <Text style={styles.label}>Nombre completo</Text>
      <AppTextInput
        value={fullName}
        onChangeText={onFullNameChange}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        accessibilityLabel="Nombre completo"
      />

      <Text style={styles.label}>Correo electrónico</Text>
      <AppTextInput
        value={email}
        onChangeText={onEmailChange}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        accessibilityLabel="Correo electrónico"
      />

      {successMessage ? (
        <Text style={styles.successText} accessibilityRole="alert">
          {successMessage}
        </Text>
      ) : null}

      <AppButton label="Guardar cambios" loading={saving} onPress={onSave} />
      <AppButton label="Volver a mis tomas" disabled={saving} onPress={onBack} />
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
