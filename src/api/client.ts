import axios, { AxiosError, AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ApiError } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

/* ---------------------- REQUEST INTERCEPTOR ---------------------- */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------------- RESPONSE INTERCEPTOR ---------------------- */
const extractDetail = (data: unknown): string => {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d) => d?.msg ?? JSON.stringify(d)).join(' | ');
  }
  return 'Error desconocido del servidor.';
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    const status = error.response?.status ?? 0;

    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject({
        status: 401,
        message: 'Sesión expirada. Inicie sesión nuevamente.',
      } satisfies ApiError);
    }

    if (status === 403) {
      return Promise.reject({
        status: 403,
        message: extractDetail(error.response?.data) ?? 'No tiene permisos para realizar esta acción.',
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