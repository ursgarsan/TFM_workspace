import { apiRequest } from '@/services/api/http';

export type LoginResponse = {
  access_token: string;
  token_type: string;
  must_change_password: boolean;
};

export type CurrentUser = {
  id: number;
  email: string;
  full_name: string;
  role: 'patient' | 'professional';
  must_change_password: boolean;
};

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

export function updateCurrentUser(
  token: string,
  payload: Pick<CurrentUser, 'full_name' | 'email'>,
): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/api/v1/auth/me', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return apiRequest<void>('/api/v1/auth/me/password', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export function deleteCurrentUser(token: string): Promise<void> {
  return apiRequest<void>('/api/v1/auth/me', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
