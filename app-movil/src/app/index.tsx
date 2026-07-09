import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  API_BASE_URL,
  fetchCurrentUser,
  fetchMyReminders,
  login,
  registerPushDevice,
  type ReminderItem,
} from '@/services/api';
import AssistantChatWidget from '@/components/AssistantChatWidget';
import { getExpoPushRegistrationResult } from '@/services/notifications';

export default function HomeScreen() {
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Recordatorios</Text>
        <Text style={styles.subtitle}>Paciente</Text>

        <View style={styles.card}>
          {!authToken ? (
            <>
              <Text style={styles.metaLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="paciente@correo.com"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.metaLabel}>Contrasena</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
                placeholder="********"
                placeholderTextColor="#94A3B8"
              />

              <Pressable style={styles.button} onPress={onLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Entrar</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>Paciente</Text>
              <Text style={styles.value}>{patientName}</Text>
              <Text style={styles.metaValue}>API: {API_BASE_URL}</Text>
              <Text style={styles.metaValue}>{reminderCountLabel}</Text>
              {pushStatus && <Text style={styles.metaValue}>{pushStatus}</Text>}

              <Pressable style={styles.button} onPress={onRefresh} disabled={syncing}>
                {syncing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Actualizar recordatorios</Text>
                )}
              </Pressable>

              <ScrollView style={styles.remindersContainer} contentContainerStyle={styles.remindersContent}>
                {reminders.length === 0 && <Text style={styles.emptyText}>No hay tomas para hoy.</Text>}
                {reminders.map((reminder, index) => (
                  <View key={`${reminder.treatment_id}-${index}`} style={styles.reminderCard}>
                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderText}>{reminder.medication_name}</Text>
                    <Text style={styles.reminderText}>Dosis: {reminder.dosage}</Text>
                    <Text style={styles.reminderText}>Hora: {reminder.time_of_day.slice(0, 5)}</Text>
                    <Text style={styles.reminderTag}>{reminder.frequency}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>
      </SafeAreaView>

      <AssistantChatWidget authToken={authToken} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 2,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D7DDE8',
    gap: 10,
  },
  cardOk: {
    borderColor: '#22C55E',
  },
  cardError: {
    borderColor: '#EF4444',
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748B',
    fontWeight: '700',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  input: {
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 16,
  },
  metaLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 15,
    color: '#0F172A',
  },
  remindersContainer: {
    marginTop: 8,
    flex: 1,
  },
  remindersContent: {
    paddingBottom: 16,
    gap: 10,
  },
  reminderCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  reminderText: {
    fontSize: 14,
    color: '#334155',
  },
  reminderTag: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 6,
  },
  errorText: {
    marginTop: 6,
    color: '#B91C1C',
    fontSize: 13,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
