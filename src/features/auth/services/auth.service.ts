import axios, { type AxiosResponse } from 'axios';
import { apiClient, API_URL } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import type { User, LoginResponse, TokenRefreshResponse } from '../../../types';

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
  /**
   * Inicio de sesión con almacenamiento seguro:
   * Guarda el Access Token en memoria volátil (RAM) y el Refresh Token en Cookie HttpOnly.
   */
  login: async (email: string, password: string): Promise<User> => {
    const payload = new URLSearchParams();
    payload.append('username', email);
    payload.append('password', password);

    const response: AxiosResponse<LoginResponse> = await apiClient.post(
      '/auth/login',
      payload,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, user, csrf_token, mfa_required, mfa_token } = response.data;

    // Desafío MFA requerido
    if (mfa_required && mfa_token) {
      throw new Error(`MFA_REQUIRED:${mfa_token}`);
    }

    if (!access_token || !user) {
      throw new Error('Respuesta de autenticación incompleta.');
    }

    const normalized = normalizeUser(user);
    // Guarda el token únicamente en memoria RAM del store
    useAuthStore.getState().setAuth(access_token, normalized, csrf_token);
    return normalized;
  },

  /**
   * Rehidratación de Sesión Silenciosa:
   * Al recargar la página (F5), consulta al backend usando la Cookie HttpOnly existente
   * para obtener un nuevo Access Token en memoria sin interrupción para el usuario.
   */
  initAuth: async (): Promise<User | null> => {
    try {
      const response = await axios.post<TokenRefreshResponse>(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true, timeout: 8_000 }
      );

      const { access_token, user, csrf_token } = response.data;

      if (access_token && user) {
        const normalized = normalizeUser(user);
        useAuthStore.getState().setAuth(access_token, normalized, csrf_token);
        return normalized;
      }

      // Si no devolvió user en el refresh, consultamos /auth/me
      if (access_token) {
        useAuthStore.getState().setToken(access_token);
        if (csrf_token) useAuthStore.getState().setCsrfToken(csrf_token);

        const meResponse = await apiClient.get<LoginResponse['user']>('/auth/me');
        if (meResponse.data) {
          const normalized = normalizeUser(meResponse.data);
          useAuthStore.getState().setUser(normalized);
          useAuthStore.getState().setInitializing(false);
          return normalized;
        }
      }

      useAuthStore.getState().logout();
      return null;
    } catch {
      useAuthStore.getState().logout();
      return null;
    }
  },

  /**
   * Desafío de Segundo Factor (MFA TOTP).
   */
  mfaChallenge: async (mfaToken: string, code: string): Promise<User> => {
    const response: AxiosResponse<LoginResponse> = await apiClient.post('/auth/mfa/challenge', {
      mfa_token: mfaToken,
      code,
    });

    const { access_token, user, csrf_token } = response.data;
    if (!access_token || !user) {
      throw new Error('Respuesta de desafío MFA incompleta.');
    }

    const normalized = normalizeUser(user);
    useAuthStore.getState().setAuth(access_token, normalized, csrf_token);
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

  /**
   * Cierre de sesión seguro con limpieza de memoria y destrucción de cookies HttpOnly.
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignorar fallos de red al cerrar sesión
    } finally {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },
};
