const FALLBACK_BASE_URL = 'http://10.0.2.2:8000';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || FALLBACK_BASE_URL;

export type ApiHealthResponse = {
  status: string;
  timestamp?: string;
  uptime_seconds?: number;
};

export async function fetchApiHealth(): Promise<ApiHealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<ApiHealthResponse>;
}
