import type { AxiosResponse } from 'axios';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import type { User, LoginResponse } from '../../../types';

const parseRoles = (raw: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((r): r is string => typeof r === 'string');
    if (typeof parsed === 'string') return [parsed];
    return [];
  } catch {
    return [];
  }
};

const normalizeUser = (raw: LoginResponse['user']): User => ({
  id: raw.id,
  full_name: raw.full_name,
  email: raw.email,
  roles: parseRoles(raw.roles),
  tenant_id: raw.tenant_id,
});

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const payload = new URLSearchParams();
    payload.append('username', email);
    payload.append('password', password);

    const response: AxiosResponse<LoginResponse> = await apiClient.post(
      '/auth/login',
      payload,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, user } = response.data;
    const normalized = normalizeUser(user);
    useAuthStore.getState().setAuth(access_token, normalized);
    return normalized;
  },
};