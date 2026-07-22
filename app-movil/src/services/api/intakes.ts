import { apiRequest } from '@/services/api/http';

export type Intake = {
  id: number;
  treatment_id: number;
  patient_id: number;
  status: 'taken' | 'not_taken';
  taken_at: string;
  scheduled_for: string | null;
  reason: string | null;
  note: string | null;
};

export function fetchMyIntakes(token: string): Promise<Intake[]> {
  return apiRequest<Intake[]>('/api/v1/intakes/my', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function markIntakeAsTaken(
  token: string,
  treatmentId: number,
  scheduledFor: string,
): Promise<Intake> {
  return apiRequest<Intake>('/api/v1/intakes/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      treatment_id: treatmentId,
      status: 'taken',
      scheduled_for: scheduledFor,
    }),
  });
}
