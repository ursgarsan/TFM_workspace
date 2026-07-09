import { apiRequest } from '@/services/api/http';

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
