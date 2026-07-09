import { apiRequest } from '@/services/api/http';

export type ReminderItem = {
  treatment_id: number;
  title: string;
  medication_name: string;
  dosage: string;
  time_of_day: string;
  frequency: string;
};

export function fetchMyReminders(token: string): Promise<ReminderItem[]> {
  return apiRequest<ReminderItem[]>('/api/v1/treatments/my/reminders', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
