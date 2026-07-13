// src/features/platform/services/tenants.service.ts
import { apiClient } from '../../../api/client';

export interface Tenant {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TenantCreate {
  name: string;
  address?: string;
  phone?: string;
  admin_full_name: string;
  admin_email: string;
  admin_password: string;
}

export interface TenantUpdate {
  name?: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

export interface TenantWithAdmin {
  tenant: Tenant;
  admin_email: string;
  admin_id: string;
}

export const tenantsService = {
  getAll: async (): Promise<Tenant[]> => {
    const response = await apiClient.get<Tenant[]>('/tenants');
    return response.data;
  },

  create: async (data: TenantCreate): Promise<TenantWithAdmin> => {
    const response = await apiClient.post<TenantWithAdmin>('/tenants', data);
    return response.data;
  },

  update: async (id: string, data: TenantUpdate): Promise<Tenant> => {
    const response = await apiClient.patch<Tenant>(`/tenants/${id}`, data);
    return response.data;
  },
};