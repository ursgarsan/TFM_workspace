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

      <Text style={styles.metaLabel}>Contrasena</Text>
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
    gap: spacing.sm,
  },
  metaLabel: {
    marginTop: 6,
    fontSize: typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
