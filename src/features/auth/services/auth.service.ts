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

const normalizeUser = (raw: LoginResponse['user']): User => {
  if (!raw) throw new Error('Datos de usuario no disponibles.');
  return {
    id: raw.id,
    full_name: raw.full_name,
    email: raw.email,
    roles: parseRoles(raw.roles),
    tenant_id: raw.tenant_id,
  };
};

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

    const { access_token, refresh_token, user, mfa_required, mfa_token } = response.data;

    // Si la cuenta tiene MFA activo, notificamos al consumidor de la API
    if (mfa_required && mfa_token) {
      throw new Error(`MFA_REQUIRED:${mfa_token}`);
    }

    if (!access_token || !user) {
      throw new Error('Respuesta de autenticación incompleta.');
    }

    const normalized = normalizeUser(user);
    useAuthStore.getState().setAuth(access_token, normalized, refresh_token);
    return normalized;
  },

  mfaChallenge: async (mfaToken: string, code: string): Promise<User> => {
    const response: AxiosResponse<LoginResponse> = await apiClient.post('/auth/mfa/challenge', {
      mfa_token: mfaToken,
      code,
    });

    const { access_token, refresh_token, user } = response.data;
    if (!access_token || !user) {
      throw new Error('Respuesta de desafío MFA incompleta.');
    }

    const normalized = normalizeUser(user);
    useAuthStore.getState().setAuth(access_token, normalized, refresh_token);
    return normalized;
  },

  setupMFA: async () => {
    const res = await apiClient.post<{ secret: string; otpauth_url: string; instructions: string }>('/auth/mfa/setup');
    return res.data;
  },

  verifyMFA: async (code: string) => {
    const res = await apiClient.post<{ success: boolean; message: string }>('/auth/mfa/verify', { code });
    return res.data;
  },

  disableMFA: async (password: string, code: string) => {
    const res = await apiClient.post<{ success: boolean; message: string }>('/auth/mfa/disable', { password, code });
    return res.data;
  },

  logout: async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      await apiClient.post('/auth/logout', { refresh_token: refreshToken });
    } catch {
      // Ignorar fallos de red durante el logout
    } finally {
      useAuthStore.getState().logout();
    }
  },
};
