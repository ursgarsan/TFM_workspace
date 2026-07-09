import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AssistantChatWidget from '@/components/AssistantChatWidget';
import { SurfaceCard } from '@/components/ui';
import { LoginForm, RemindersPanel } from '@/features/home/components';
import { useHomeScreenState } from '@/features/home/hooks';
import { colors, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    authToken,
    patientName,
    loading,
    syncing,
    errorMessage,
    pushStatus,
    reminders,
    reminderCountLabel,
    onLogin,
    onRefresh,
  } = useHomeScreenState();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Recordatorios</Text>
        <Text style={styles.subtitle}>Paciente</Text>

        <SurfaceCard>
          {!authToken ? (
            <LoginForm
              email={email}
              onEmailChange={setEmail}
              password={password}
              onPasswordChange={setPassword}
              loading={loading}
              onLogin={() => {
                void onLogin();
              }}
            />
          ) : (
            <RemindersPanel
              patientName={patientName}
              reminderCountLabel={reminderCountLabel}
              pushStatus={pushStatus}
              reminders={reminders}
              syncing={syncing}
              onRefresh={() => {
                void onRefresh();
              }}
            />
          )}

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </SurfaceCard>
      </SafeAreaView>

      <AssistantChatWidget authToken={authToken} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: spacing.lg,
    paddingTop: 20,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.subtitle,
    color: colors.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 6,
    color: colors.danger,
    fontSize: 13,
  },
});
