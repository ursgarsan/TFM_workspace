import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Notifications from 'expo-notifications';

import {
  fetchCurrentUser,
  fetchMyReminders,
  login,
  registerPushDevice,
  type ReminderItem,
} from '@/services/api/index';
import { getExpoPushRegistrationResult } from '@/services/notifications';

export type HomeScreenState = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  authToken: string | null;
  patientName: string;
  loading: boolean;
  syncing: boolean;
  errorMessage: string | null;
  pushStatus: string | null;
  reminders: ReminderItem[];
  reminderCountLabel: string;
  onLogin: () => Promise<void>;
  onRefresh: () => Promise<void>;
};

export function useHomeScreenState(): HomeScreenState {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

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

      setPatientName(me.full_name);

      const remindersResult = await fetchMyReminders(token);
      setReminders(remindersResult);

      const pushRegistration = await getExpoPushRegistrationResult();
      setPushStatus(
        pushRegistration.expoPushToken
          ? `Push activo: ${pushRegistration.expoPushToken.slice(0, 24)}...`
          : `Push no registrado: ${pushRegistration.reason ?? 'motivo desconocido'}`,
      );

      const expoPushToken = pushRegistration.expoPushToken;
      if (expoPushToken) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        await registerPushDevice(token, expoPushToken, timezone);
        setPushStatus(`Push registrado en backend: ${expoPushToken.slice(0, 24)}...`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error inesperado');
      setReminders([]);
      setPatientName('');
    }
    setSyncing(false);
  }, []);

  const onLogin = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const auth = await login(email.trim(), password);
      setAuthToken(auth.access_token);
      await syncPatientData(auth.access_token);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion');
    }
    setLoading(false);
  }, [email, password, syncPatientData]);

  const onRefresh = useCallback(async () => {
    if (!authToken) {
      return;
    }
    await syncPatientData(authToken);
  }, [authToken, syncPatientData]);

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
    patientName,
    loading,
    syncing,
    errorMessage,
    pushStatus,
    reminders,
    reminderCountLabel,
    onLogin,
    onRefresh,
  };
}
