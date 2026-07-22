import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppTextInput } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

type LoginFormProps = {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  loading: boolean;
  onLogin: () => void;
};

export default function LoginForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  loading,
  onLogin,
}: LoginFormProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.metaLabel}>Email</Text>
      <AppTextInput
        value={email}
        onChangeText={onEmailChange}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="paciente@correo.com"
      />

      <Text style={styles.metaLabel}>Contraseña</Text>
      <AppTextInput
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
        placeholder="********"
      />

      <AppButton label="Entrar" loading={loading} onPress={onLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  metaLabel: {
    marginTop: 4,
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
