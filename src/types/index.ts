// src/types/index.ts

export type Role = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'SUPER_ADMIN';

export interface UserRaw {
  id: string;
  full_name: string;
  email: string;
  roles: string; // JSON stringified: '["ADMIN","DOCTOR"]'
  tenant_id: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  tenant_id: string;
}

export interface Patient {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  token_type: string;
  user?: UserRaw;
  mfa_required?: boolean;
  mfa_token?: string;
  message?: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/** Error tipado que devuelven los interceptores de Axios. */
export interface ApiError {
  status: number;
  message: string;
}
