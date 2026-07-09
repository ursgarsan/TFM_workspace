import { API_BASE_URL } from '@/services/api/config';

type JsonRecord = Record<string, unknown>;

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
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
