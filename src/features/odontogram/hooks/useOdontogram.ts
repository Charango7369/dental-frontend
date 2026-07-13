// src/features/odontogram/hooks/useOdontogram.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  odontogramService,
  type OdontogramCreate,
  type OdontogramUpdate,
} from '../services/odontogram.service';

export const odontogramKeys = {
  all: ['odontograms'] as const,
  byPatient: (patientId: string) => ['odontograms', 'patient', patientId] as const,
};

export const usePatientOdontograms = (patientId: string) => {
  return useQuery({
    queryKey: odontogramKeys.byPatient(patientId),
    queryFn: () => odontogramService.getByPatient(patientId),
    enabled: !!patientId,
  });
};

export const useCreateOdontogram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OdontogramCreate) => odontogramService.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: odontogramKeys.byPatient(variables.patient_id) });
    },
  });
};

// 🚨 NUEVO: hook para editar las notas de una evolución ya guardada
export const useUpdateOdontogramNotes = (patientId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OdontogramUpdate }) =>
      odontogramService.updateNotes(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: odontogramKeys.byPatient(patientId) });
    },
  });
};