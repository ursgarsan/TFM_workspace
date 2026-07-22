import { Pressable, StyleSheet, Text, View } from 'react-native';
import { List, X } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AssistantChatWidget from '@/components/AssistantChatWidget';
import { SurfaceCard } from '@/components/ui';
import {
  AccountMenu,
  LoginForm,
  PasswordPanel,
  ProfilePanel,
  RemindersPanel,
} from '@/features/home/components';
import { useHomeScreenState } from '@/features/home/hooks';
import { colors, radius, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const state = useHomeScreenState();
  const isLoginView = !state.authToken;
  const pageTitle = isLoginView
    ? 'Inicio de sesión'
    : state.profileOpen
      ? 'Mis datos'
      : state.passwordOpen
        ? 'Cambiar contraseña'
        : 'Recordatorios';

  return (
    <View style={styles.container}>
      <SafeAreaView style={[styles.safeArea, isLoginView ? styles.safeAreaLogin : null]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isLoginView ? styles.titleLogin : null]}>{pageTitle}</Text>
          {!isLoginView && !state.profileOpen && !state.passwordOpen ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={state.menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              accessibilityState={{ expanded: state.menuOpen }}
              hitSlop={8}
              onPress={state.onToggleMenu}
              style={({ pressed }) => [styles.menuButton, pressed ? styles.menuButtonPressed : null]}
            >
              {state.menuOpen ? (
                <X size={30} color={colors.primaryStrong} weight="bold" />
              ) : (
                <List size={32} color={colors.primaryStrong} weight="bold" />
              )}
            </Pressable>
          ) : null}
        </View>

        {state.menuOpen ? (
          <AccountMenu
            onOpenProfile={state.onOpenProfile}
            onOpenPassword={state.onOpenPassword}
            onLogout={state.onLogout}
            onDeleteAccount={state.onDeleteAccount}
          />
        ) : null}

        <SurfaceCard style={isLoginView ? styles.loginCard : null}>
          {isLoginView ? (
            <LoginForm
              email={state.email}
              onEmailChange={state.setEmail}
              password={state.password}
              onPasswordChange={state.setPassword}
              loading={state.loading}
              onLogin={() => {
                void state.onLogin();
              }}
            />
          ) : state.profileOpen ? (
            <ProfilePanel
              fullName={state.profileFullName}
              email={state.profileEmail}
              saving={state.savingProfile}
              successMessage={state.successMessage}
              onFullNameChange={state.setProfileFullName}
              onEmailChange={state.setProfileEmail}
              onSave={() => {
                void state.onSaveProfile();
              }}
              onBack={state.onCloseProfile}
            />
          ) : state.passwordOpen ? (
            <PasswordPanel
              currentPassword={state.currentPassword}
              newPassword={state.newPassword}
              repeatedPassword={state.repeatedPassword}
              saving={state.savingPassword}
              successMessage={state.successMessage}
              allowBack={!state.forcedPasswordChange}
              onCurrentPasswordChange={state.setCurrentPassword}
              onNewPasswordChange={state.setNewPassword}
              onRepeatedPasswordChange={state.setRepeatedPassword}
              onSave={() => {
                void state.onSavePassword();
              }}
              onBack={state.onClosePassword}
            />
          ) : (
            <>
              <Text style={styles.welcomeText}>
                Hola{state.currentUser?.full_name ? `, ${state.currentUser.full_name}` : ''}
              </Text>
              <RemindersPanel
                reminderCountLabel={state.reminderCountLabel}
                reminders={state.reminders}
                takenReminderKeys={state.takenReminderKeys}
                savingReminderKey={state.savingReminderKey}
                syncing={state.syncing}
                onRefresh={() => {
                  void state.onRefresh();
                }}
                onMarkAsTaken={(reminder) => {
                  void state.onMarkAsTaken(reminder);
                }}
              />
            </>
          )}

          {state.errorMessage ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {state.errorMessage}
            </Text>
          ) : null}
        </SurfaceCard>
      </SafeAreaView>

      {state.authToken && !state.profileOpen && !state.passwordOpen ? (
        <AssistantChatWidget authToken={state.authToken} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: spacing.lg,
    paddingTop: 14,
  },
  safeAreaLogin: { justifyContent: 'center', paddingTop: 0, paddingBottom: 72 },
  headerRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'left',
    letterSpacing: -0.3,
  },
  titleLogin: { textAlign: 'center' },
  menuButton: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: { backgroundColor: colors.primarySoft },
  loginCard: { flex: 0, alignSelf: 'center', width: '100%', maxWidth: 520 },
  welcomeText: { color: colors.textPrimary, fontSize: typography.bodyMd, fontWeight: '700' },
  errorText: {
    marginTop: 8,
    backgroundColor: '#FDE8EC',
    borderColor: '#F5C7D1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
