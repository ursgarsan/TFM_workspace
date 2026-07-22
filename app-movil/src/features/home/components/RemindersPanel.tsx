import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowsClockwise } from 'phosphor-react-native';

import { AppButton } from '@/components/ui';
import type { ReminderItem } from '@/services/api/treatments';
import { colors, radius, spacing, typography } from '@/theme';

type RemindersPanelProps = {
  reminderCountLabel: string;
  reminders: ReminderItem[];
  syncing: boolean;
  onRefresh: () => void;
  takenReminderKeys: ReadonlySet<string>;
  savingReminderKey: string | null;
  onMarkAsTaken: (reminder: ReminderItem) => void;
};

function getReminderKey(reminder: ReminderItem): string {
  return `${reminder.treatment_id}-${reminder.time_of_day.slice(0, 5)}`;
}

function translateFrequency(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'daily') {
    return 'Diaria';
  }
  if (normalized === 'weekly') {
    return 'Semanal';
  }
  if (normalized === 'weekdays') {
    return 'Personalizada';
  }
  return value;
}

const WEEKDAY_LABELS: Record<string, string> = {
  '1': 'Lun',
  '2': 'Mar',
  '3': 'Mié',
  '4': 'Jue',
  '5': 'Vie',
  '6': 'Sáb',
  '7': 'Dom',
};

function formatWeekdaysCsv(weekdaysCsv: string | null | undefined): string {
  if (!weekdaysCsv) {
    return '';
  }

  return weekdaysCsv
    .split(',')
    .map((value) => value.trim())
    .filter((value) => WEEKDAY_LABELS[value])
    .map((value) => WEEKDAY_LABELS[value])
    .join(', ');
}

function buildFrequencyLabel(reminder: ReminderItem): string {
  const frequencyLabel = translateFrequency(reminder.frequency);
  const normalized = reminder.frequency.trim().toLowerCase();
  if (normalized !== 'weekdays') {
    return frequencyLabel;
  }

  const weekdaysLabel = formatWeekdaysCsv(reminder.weekdays_csv);
  if (!weekdaysLabel) {
    return frequencyLabel;
  }

  return `${frequencyLabel} (${weekdaysLabel})`;
}

export default function RemindersPanel({
  reminderCountLabel,
  reminders,
  syncing,
  onRefresh,
  takenReminderKeys,
  savingReminderKey,
  onMarkAsTaken,
}: RemindersPanelProps) {
  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.metaValueStrong}>{reminderCountLabel}</Text>
        <AppButton loading={syncing} onPress={onRefresh} compact>
          <ArrowsClockwise size={20} color="#FFFFFF" weight="bold" />
        </AppButton>
      </View>

      <ScrollView style={styles.remindersContainer} contentContainerStyle={styles.remindersContent}>
        {reminders.length === 0 && <Text style={styles.emptyText}>No hay tomas para hoy.</Text>}
        {reminders.map((reminder, index) => {
          const reminderKey = getReminderKey(reminder);
          const isTaken = takenReminderKeys.has(reminderKey);

          return (
            <View key={`${reminderKey}-${index}`} style={styles.reminderCard}>
              <Text style={styles.reminderTitle}>{reminder.title}</Text>
              <Text style={styles.reminderText}>{reminder.medication_name}</Text>
              <Text style={styles.reminderText}>Dosis: {reminder.dosage}</Text>
              <Text style={styles.reminderText}>Hora: {reminder.time_of_day.slice(0, 5)}</Text>
              {reminder.notes?.trim() ? (
                <Text style={styles.reminderText}>Comentarios: {reminder.notes.trim()}</Text>
              ) : null}
              <Text style={styles.reminderTag}>{buildFrequencyLabel(reminder)}</Text>
              <AppButton
                label={isTaken ? 'Tomada hoy' : 'Marcar como tomada'}
                loading={savingReminderKey === reminderKey}
                disabled={isTaken || savingReminderKey !== null}
                onPress={() => onMarkAsTaken(reminder)}
              />
            </View>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaValueStrong: {
    fontSize: typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  remindersContainer: {
    marginTop: spacing.md,
    flex: 1,
  },
  remindersContent: {
    paddingBottom: 24,
    gap: spacing.md,
  },
  reminderCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 6,
  },
  reminderTitle: {
    fontSize: typography.section,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reminderText: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  reminderTag: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    color: colors.primaryStrong,
    fontSize: typography.caption,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: 8,
  },
});
