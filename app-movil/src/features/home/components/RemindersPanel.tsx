import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui';
import { API_BASE_URL } from '@/services/api/config';
import type { ReminderItem } from '@/services/api/treatments';
import { colors, radius, spacing, typography } from '@/theme';

type RemindersPanelProps = {
  patientName: string;
  reminderCountLabel: string;
  pushStatus: string | null;
  reminders: ReminderItem[];
  syncing: boolean;
  onRefresh: () => void;
};

export default function RemindersPanel({
  patientName,
  reminderCountLabel,
  pushStatus,
  reminders,
  syncing,
  onRefresh,
}: RemindersPanelProps) {
  return (
    <>
      <Text style={styles.label}>Paciente</Text>
      <Text style={styles.value}>{patientName}</Text>
      <Text style={styles.metaValue}>API: {API_BASE_URL}</Text>
      <Text style={styles.metaValue}>{reminderCountLabel}</Text>
      {pushStatus && <Text style={styles.metaValue}>{pushStatus}</Text>}

      <AppButton
        label="Actualizar recordatorios"
        loading={syncing}
        onPress={onRefresh}
      />

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
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMuted,
    fontWeight: '700',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaValue: {
    fontSize: typography.bodyMd,
    color: colors.textPrimary,
  },
  remindersContainer: {
    marginTop: spacing.sm,
    flex: 1,
  },
  remindersContent: {
    paddingBottom: 16,
    gap: spacing.sm,
  },
  reminderCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: 4,
  },
  reminderTitle: {
    fontSize: typography.section,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reminderText: {
    fontSize: typography.body,
    color: '#334155',
  },
  reminderTag: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    color: '#1E40AF',
    fontSize: typography.caption,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: 6,
  },
});
