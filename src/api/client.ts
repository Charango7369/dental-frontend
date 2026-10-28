// src/api/client.ts
import axios, { AxiosError, AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { getCookie } from '../utils/cookies';
import type { ApiError, TokenRefreshResponse } from '../types';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
  // 🍪 Envío automático de Cookies HttpOnly y SameSite=None
  withCredentials: true,
});

/* ---------------------- REQUEST INTERCEPTOR ---------------------- */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Inyección de Access Token efímero desde memoria (RAM)
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Inyección de Cabecera Anti-CSRF (Double Submit Cookie) para métodos mutantes
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && config.headers) {
      const csrfToken = getCookie('csrf_token') || useAuthStore.getState().csrfToken;
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------------- SILENT REFRESH STATE ---------------------- */
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/* ---------------------- RESPONSE INTERCEPTOR ---------------------- */
const extractDetail = (data: unknown): string => {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === 'string') return obj.detail;
    if (Array.isArray(obj.detail)) {
      return obj.detail
        .map((d) => (typeof d === 'string' ? d : (d as { msg?: string })?.msg ?? JSON.stringify(d)))
        .join(' | ');
    }
    if (typeof obj.message === 'string') return obj.message;
  }
  return 'Error del servidor.';
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ detail?: unknown; message?: string }>) => {
    const originalRequest = error.config as RetryConfig;
    const status = error.response?.status ?? 0;
    const url = originalRequest?.url ?? '';

    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/mfa/challenge');

    // 🛑 Manejo de 401 Unauthorized con Silent Refresh (Cookie HttpOnly)
    if (status === 401) {
      if (isAuthEndpoint) {
        return Promise.reject({
          status: 401,
          message: extractDetail(error.response?.data) || 'Correo electrónico o contraseña incorrectos.',
        } satisfies ApiError);
      }

      // Si la petición ya fue reintentada y volvió a fallar, la sesión expiró de forma definitiva
      if (originalRequest._retry) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject({
          status: 401,
          message: 'Sesión expirada o revocada. Inicie sesión nuevamente.',
        } satisfies ApiError);
      }

      // Si ya hay un refresco en progreso por otra llamada concurrente, encolar esta petición
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Ejecutar rotación de tokens usando la Cookie HttpOnly administrada por el navegador
        const refreshResponse = await axios.post<TokenRefreshResponse>(
          `${API_URL}/auth/refresh`,
          {},
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
            timeout: 10_000,
          }
        );

        const { access_token, csrf_token } = refreshResponse.data;

        // Actualizar el token en la memoria volátil del frontend
        useAuthStore.getState().setToken(access_token);
        if (csrf_token) {
          useAuthStore.getState().setCsrfToken(csrf_token);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          if (csrf_token) {
            originalRequest.headers['X-CSRF-Token'] = csrf_token;
          }
        }

        processQueue(null, access_token);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject({
          status: 401,
          message: 'Su sesión ha expirado. Por favor ingrese sus credenciales.',
        } satisfies ApiError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403) {
      return Promise.reject({
        status: 403,
        message: extractDetail(error.response?.data) ?? 'No tiene permisos para realizar esta acción.',
      } satisfies ApiError);
    }

    if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      const detail = extractDetail(error.response?.data);
      return Promise.reject({
        status: 429,
        message: detail || `Demasiadas solicitudes. Espere ${retryAfter || 'unos'} segundos.`,
      } satisfies ApiError);
    }

    if (status === 500) {
      return Promise.reject({
        status: 500,
        message: extractDetail(error.response?.data) ?? 'Error interno del servidor.',
      } satisfies ApiError);
    }

    return Promise.reject({
      status,
      message: extractDetail(error.response?.data) || error.message,
    } satisfies ApiError);
  }
);
