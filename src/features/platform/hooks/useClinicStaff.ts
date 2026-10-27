// src/features/platform/hooks/useClinicStaff.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  clinicStaffService,
  type ClinicStaffCreatePayload,
  type ClinicStaffUpdatePayload,
  type PasswordResetPayload,
} from '../services/clinicStaff.service';

export const clinicStaffKeys = {
  all: ['clinic-staff'] as const,
  byClinic: (clinicId: string) => [...clinicStaffKeys.all, clinicId] as const,
};

export const useClinicStaff = (clinicId?: string) => {
  return useQuery({
    queryKey: clinicStaffKeys.byClinic(clinicId || ''),
    queryFn: () => (clinicId ? clinicStaffService.getStaff(clinicId) : Promise.resolve([])),
    enabled: Boolean(clinicId),
  });
};

export const useCreateClinicStaff = (clinicId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClinicStaffCreatePayload) => clinicStaffService.createStaff(clinicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicStaffKeys.byClinic(clinicId) });
    },
  });
};

export const useUpdateClinicStaff = (clinicId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ClinicStaffUpdatePayload }) =>
      clinicStaffService.updateStaff(clinicId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicStaffKeys.byClinic(clinicId) });
    },
  });
};

export const useResetStaffPassword = (clinicId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data?: PasswordResetPayload }) =>
      clinicStaffService.resetPassword(clinicId, userId, data || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicStaffKeys.byClinic(clinicId) });
    },
  });
};
