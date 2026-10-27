// src/features/platform/services/clinicStaff.service.ts
import { apiClient } from '../../../api/client';

export type ClinicRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';

export interface ClinicStaffMember {
  id: string;
  full_name: string;
  email: string;
  roles: ClinicRole[];
  tenant_id: string;
  is_active: boolean;
  hashed_password: string;
  created_at?: string;
}

export interface ClinicStaffCreatePayload {
  full_name: string;
  email: string;
  password: string;
  roles: ClinicRole[];
  is_active?: boolean;
}

export interface ClinicStaffUpdatePayload {
  full_name?: string;
  email?: string;
  roles?: ClinicRole[];
  is_active?: boolean;
}

export interface PasswordResetPayload {
  new_password?: string;
}

export interface PasswordResetResponse {
  message: string;
  user_id: string;
  temporary_password?: string | null;
  hashed_password: string;
}

export const clinicStaffService = {
  getStaff: async (clinicId: string): Promise<ClinicStaffMember[]> => {
    const response = await apiClient.get<ClinicStaffMember[]>(`/clinics/${clinicId}/staff`);
    return response.data;
  },

  createStaff: async (clinicId: string, data: ClinicStaffCreatePayload): Promise<ClinicStaffMember> => {
    const response = await apiClient.post<ClinicStaffMember>(`/clinics/${clinicId}/staff`, data);
    return response.data;
  },

  updateStaff: async (
    clinicId: string,
    userId: string,
    data: ClinicStaffUpdatePayload
  ): Promise<ClinicStaffMember> => {
    const response = await apiClient.put<ClinicStaffMember>(`/clinics/${clinicId}/staff/${userId}`, data);
    return response.data;
  },

  resetPassword: async (
    clinicId: string,
    userId: string,
    data: PasswordResetPayload = {}
  ): Promise<PasswordResetResponse> => {
    const response = await apiClient.post<PasswordResetResponse>(
      `/clinics/${clinicId}/staff/${userId}/reset-password`,
      data
    );
    return response.data;
  },
};
