import { apiRequest } from '@/services/api/http';

export type ReminderItem = {
  treatment_id: number;
  title: string;
  medication_name: string;
  dosage: string;
  notes?: string | null;
  time_of_day: string;
  frequency: string;
  weekdays_csv?: string | null;
};

export function fetchMyReminders(token: string): Promise<ReminderItem[]> {
  return apiRequest<ReminderItem[]>('/api/v1/treatments/my/reminders', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
