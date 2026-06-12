import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL, fetchApiHealth } from '@/services/health';

export default function HomeScreen() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('Comprobando backend...');
  const [uptimeSeconds, setUptimeSeconds] = useState<number | null>(null);

  const loadHealth = useCallback(async () => {
    setStatus('loading');
    setMessage('Comprobando backend...');

    try {
      const health = await fetchApiHealth();
      setStatus('ok');
      setMessage(`Backend conectado: ${health.status}`);
      setUptimeSeconds(health.uptime_seconds ?? null);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Error desconocido');
      setUptimeSeconds(null);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadHealth();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadHealth]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>app-movil</Text>
        <Text style={styles.subtitle}>Conexión con app-api</Text>

        <View style={[styles.card, status === 'ok' && styles.cardOk, status === 'error' && styles.cardError]}>
          <Text style={styles.label}>Backend</Text>
          <Text style={styles.value}>{message}</Text>

          <Text style={styles.metaLabel}>API Base URL</Text>
          <Text style={styles.metaValue}>{API_BASE_URL}</Text>

          {uptimeSeconds !== null && (
            <>
              <Text style={styles.metaLabel}>Uptime</Text>
              <Text style={styles.metaValue}>{uptimeSeconds.toFixed(3)} s</Text>
            </>
          )}

          <Pressable style={styles.button} onPress={loadHealth}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 8,
  },
  card: {
    width: '100%',
    maxWidth: 420,
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
