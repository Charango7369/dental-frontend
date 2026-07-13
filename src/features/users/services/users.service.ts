// src/features/users/services/users.service.ts
import { apiClient } from '../../../api/client';

export type StaffRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';

export interface StaffUser {
  id: string;
  full_name: string;
  email: string;
  roles: StaffRole[];
  tenant_id: string;
  is_active: boolean;
}

export interface StaffUserCreate {
  full_name: string;
  email: string;
  password: string;
  roles: StaffRole[];
}

export interface StaffUserUpdate {
  full_name?: string;
  roles?: StaffRole[];
  is_active?: boolean;
}

export const usersService = {
  getAll: async (): Promise<StaffUser[]> => {
    const response = await apiClient.get<StaffUser[]>('/users');
    return response.data;
  },

  create: async (data: StaffUserCreate): Promise<StaffUser> => {
    const response = await apiClient.post<StaffUser>('/users', data);
    return response.data;
  },

  update: async (id: string, data: StaffUserUpdate): Promise<StaffUser> => {
    const response = await apiClient.patch<StaffUser>(`/users/${id}`, data);
    return response.data;
  },
};