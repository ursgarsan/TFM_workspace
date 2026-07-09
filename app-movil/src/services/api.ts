const FALLBACK_BASE_URL = 'http://10.0.2.2:8000';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || FALLBACK_BASE_URL;

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type CurrentUser = {
  id: number;
  email: string;
  full_name: string;
  role: 'patient' | 'professional';
};

export type ReminderItem = {
  treatment_id: number;
  title: string;
  medication_name: string;
  dosage: string;
  time_of_day: string;
  frequency: string;
};

export type AssistantReply = {
  answer: string;
  source: string;
  created_at: string;
};

type JsonRecord = Record<string, unknown>;

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = `Error ${response.status}`;
    try {
      const json = (await response.json()) as JsonRecord;
      if (typeof json.detail === 'string' && json.detail.trim()) {
        detail = json.detail;
      }
    } catch {
      // Keep status-based fallback detail.
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCurrentUser(token: string): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/api/v1/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchMyReminders(token: string): Promise<ReminderItem[]> {
  return apiRequest<ReminderItem[]>('/api/v1/treatments/my/reminders', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function registerPushDevice(
  token: string,
  expoPushToken: string,
  timezone: string,
): Promise<void> {
  return apiRequest<void>('/api/v1/notifications/devices/register', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      expo_push_token: expoPushToken,
      platform: 'android',
      timezone,
    }),
  });
}

export function askAssistant(token: string, question: string): Promise<AssistantReply> {
  return apiRequest<AssistantReply>('/api/v1/assistant/query', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  });
}
