import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

import {
  changePassword,
  deleteCurrentUser,
  fetchCurrentUser,
  fetchMyIntakes,
  fetchMyReminders,
  login,
  markIntakeAsTaken,
  registerPushDevice,
  updateCurrentUser,
  type CurrentUser,
  type ReminderItem,
} from '@/services/api/index';
import { getExpoPushRegistrationResult } from '@/services/notifications';

export type HomeScreenState = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  authToken: string | null;
  loading: boolean;
  syncing: boolean;
  errorMessage: string | null;
  reminders: ReminderItem[];
  currentUser: CurrentUser | null;
  profileFullName: string;
  profileEmail: string;
  profileOpen: boolean;
  passwordOpen: boolean;
  forcedPasswordChange: boolean;
  menuOpen: boolean;
  savingProfile: boolean;
  savingPassword: boolean;
  deletingAccount: boolean;
  currentPassword: string;
  newPassword: string;
  repeatedPassword: string;
  successMessage: string | null;
  takenReminderKeys: ReadonlySet<string>;
  savingReminderKey: string | null;
  reminderCountLabel: string;
  onLogin: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onMarkAsTaken: (reminder: ReminderItem) => Promise<void>;
  setProfileFullName: (value: string) => void;
  setProfileEmail: (value: string) => void;
  onOpenProfile: () => void;
  onCloseProfile: () => void;
  onSaveProfile: () => Promise<void>;
  onLogout: () => void;
  onDeleteAccount: () => void;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setRepeatedPassword: (value: string) => void;
  onToggleMenu: () => void;
  onOpenPassword: () => void;
  onClosePassword: () => void;
  onSavePassword: () => Promise<void>;
};

export function getReminderKey(reminder: ReminderItem): string {
  return `${reminder.treatment_id}-${reminder.time_of_day.slice(0, 5)}`;
}

function getScheduledForToday(reminder: ReminderItem): Date {
  const [hours = 0, minutes = 0, seconds = 0] = reminder.time_of_day.split(':').map(Number);
  const scheduledFor = new Date();
  scheduledFor.setHours(hours, minutes, seconds, 0);
  return scheduledFor;
}

export function useHomeScreenState(): HomeScreenState {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profileFullName, setProfileFullName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [forcedPasswordChange, setForcedPasswordChange] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatedPassword, setRepeatedPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [takenReminderKeys, setTakenReminderKeys] = useState<Set<string>>(new Set());
  const [savingReminderKey, setSavingReminderKey] = useState<string | null>(null);

  const reminderCountLabel = useMemo(() => {
    if (reminders.length === 1) {
      return '1 recordatorio';
    }
    return `${reminders.length} recordatorios`;
  }, [reminders.length]);

  const syncPatientData = useCallback(async (token: string) => {
    setSyncing(true);
    setErrorMessage(null);

    try {
      const me = await fetchCurrentUser(token);
      if (me.role !== 'patient') {
        throw new Error('Solo los usuarios con rol patient pueden usar esta app.');
      }
      setCurrentUser(me);
      setProfileFullName(me.full_name);
      setProfileEmail(me.email);

      const [remindersResult, intakesResult] = await Promise.all([
        fetchMyReminders(token),
        fetchMyIntakes(token),
      ]);
      setReminders(remindersResult);
      const takenKeys = new Set(
        intakesResult
          .filter((intake) => intake.status === 'taken' && intake.scheduled_for)
          .filter((intake) => {
            const scheduledFor = new Date(intake.scheduled_for as string);
            const today = new Date();
            return scheduledFor.toDateString() === today.toDateString();
          })
          .map((intake) => {
            const scheduledFor = new Date(intake.scheduled_for as string);
            const time = `${String(scheduledFor.getHours()).padStart(2, '0')}:${String(
              scheduledFor.getMinutes(),
            ).padStart(2, '0')}`;
            return `${intake.treatment_id}-${time}`;
          }),
      );
      setTakenReminderKeys(takenKeys);

      const pushRegistration = await getExpoPushRegistrationResult();

      const expoPushToken = pushRegistration.expoPushToken;
      if (expoPushToken) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        await registerPushDevice(token, expoPushToken, timezone);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error inesperado');
      setReminders([]);
      setTakenReminderKeys(new Set());
    }
    setSyncing(false);
  }, []);

  const onLogin = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const auth = await login(email.trim(), password);
      setAuthToken(auth.access_token);
      setPassword('');
      if (auth.must_change_password) {
        setForcedPasswordChange(true);
        setPasswordOpen(true);
      } else {
        await syncPatientData(auth.access_token);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión');
    }
    setLoading(false);
  }, [email, password, syncPatientData]);

  const onRefresh = useCallback(async () => {
    if (!authToken) {
      return;
    }
    await syncPatientData(authToken);
  }, [authToken, syncPatientData]);

  const onMarkAsTaken = useCallback(
    async (reminder: ReminderItem) => {
      if (!authToken) {
        return;
      }

      const reminderKey = getReminderKey(reminder);
      setSavingReminderKey(reminderKey);
      setErrorMessage(null);
      try {
        await markIntakeAsTaken(
          authToken,
          reminder.treatment_id,
          getScheduledForToday(reminder).toISOString(),
        );
        setTakenReminderKeys((current) => new Set(current).add(reminderKey));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'No se pudo registrar la toma');
      } finally {
        setSavingReminderKey(null);
      }
    },
    [authToken],
  );

  const onOpenProfile = useCallback(() => {
    if (currentUser) {
      setProfileFullName(currentUser.full_name);
      setProfileEmail(currentUser.email);
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setMenuOpen(false);
    setProfileOpen(true);
  }, [currentUser]);

  const onCloseProfile = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setProfileOpen(false);
  }, []);

  const onToggleMenu = useCallback(() => {
    setMenuOpen((current) => !current);
  }, []);

  const onOpenPassword = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setRepeatedPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setMenuOpen(false);
    setPasswordOpen(true);
  }, []);

  const onClosePassword = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setRepeatedPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setPasswordOpen(false);
  }, []);

  const onSavePassword = useCallback(async () => {
    if (!authToken) {
      return;
    }
    if (!currentPassword) {
      setErrorMessage('Escriba su contraseña actual.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== repeatedPassword) {
      setErrorMessage('Las dos contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage('La nueva contraseña debe ser diferente de la actual.');
      return;
    }

    setSavingPassword(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await changePassword(authToken, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setRepeatedPassword('');
      if (forcedPasswordChange) {
        setForcedPasswordChange(false);
        setPasswordOpen(false);
        await syncPatientData(authToken);
        Alert.alert('Contraseña actualizada', 'Ya puede utilizar la aplicación.');
      } else {
        setSuccessMessage('Su contraseña se ha cambiado correctamente.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  }, [authToken, currentPassword, forcedPasswordChange, newPassword, repeatedPassword, syncPatientData]);

  const onSaveProfile = useCallback(async () => {
    if (!authToken) {
      return;
    }

    const fullName = profileFullName.trim();
    const normalizedEmail = profileEmail.trim().toLowerCase();
    if (!fullName) {
      setErrorMessage('Escriba su nombre completo.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setErrorMessage('Escriba un correo electrónico válido.');
      return;
    }

    setSavingProfile(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const updatedUser = await updateCurrentUser(authToken, {
        full_name: fullName,
        email: normalizedEmail,
      });
      setCurrentUser(updatedUser);
      setProfileFullName(updatedUser.full_name);
      setProfileEmail(updatedUser.email);
      setSuccessMessage('Sus datos se han guardado correctamente.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron guardar sus datos');
    } finally {
      setSavingProfile(false);
    }
  }, [authToken, profileEmail, profileFullName]);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setPassword('');
    setCurrentUser(null);
    setReminders([]);
    setTakenReminderKeys(new Set());
    setProfileOpen(false);
    setPasswordOpen(false);
    setForcedPasswordChange(false);
    setMenuOpen(false);
    setProfileFullName('');
    setProfileEmail('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setCurrentPassword('');
    setNewPassword('');
    setRepeatedPassword('');
  }, []);

  const onLogout = useCallback(() => {
    setMenuOpen(false);
    Alert.alert(
      'Cerrar sesión',
      '¿Quiere salir de la aplicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, cerrar sesión', style: 'destructive', onPress: clearSession },
      ],
      { cancelable: true },
    );
  }, [clearSession]);

  const onDeleteAccount = useCallback(() => {
    setMenuOpen(false);
    Alert.alert(
      'Eliminar mi cuenta',
      'Se eliminarán permanentemente su cuenta, tratamientos y registros de tomas. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar mi cuenta',
          style: 'destructive',
          onPress: () => {
            if (!authToken) {
              return;
            }
            setDeletingAccount(true);
            setErrorMessage(null);
            void deleteCurrentUser(authToken)
              .then(() => {
                clearSession();
                Alert.alert('Cuenta eliminada', 'Su cuenta se ha eliminado correctamente.');
              })
              .catch((error: unknown) => {
                setErrorMessage(error instanceof Error ? error.message : 'No se pudo eliminar la cuenta');
              })
              .finally(() => setDeletingAccount(false));
          },
        },
      ],
      { cancelable: true },
    );
  }, [authToken, clearSession]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      void onRefresh();
    });
    return () => subscription.remove();
  }, [onRefresh]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    authToken,
    loading,
    syncing,
    errorMessage,
    reminders,
    currentUser,
    profileFullName,
    profileEmail,
    profileOpen,
    passwordOpen,
    forcedPasswordChange,
    menuOpen,
    savingProfile,
    savingPassword,
    deletingAccount,
    currentPassword,
    newPassword,
    repeatedPassword,
    successMessage,
    takenReminderKeys,
    savingReminderKey,
    reminderCountLabel,
    onLogin,
    onRefresh,
    onMarkAsTaken,
    setProfileFullName,
    setProfileEmail,
    onOpenProfile,
    onCloseProfile,
    onSaveProfile,
    onLogout,
    onDeleteAccount,
    setCurrentPassword,
    setNewPassword,
    setRepeatedPassword,
    onToggleMenu,
    onOpenPassword,
    onClosePassword,
    onSavePassword,
  };
}
