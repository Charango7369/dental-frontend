import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  patientsService, 
  type PatientCreate, 
  type PatientUpdate, 
  type GetPatientsParams,
  type PaginatedPatients 
} from '../services/patients.service';
import type { ApiError, Patient } from '../../../types';

// 🚨 LLAVES DE CACHÉ EVOLUCIONADAS
export const patientKeys = {
  all: ['patients'] as const,
  // Ahora la llave de la lista incluye los parámetros para cachear páginas por separado
  list: (params: GetPatientsParams) => ['patients', 'list', params] as const,
  detail: (id: string) => ['patients', 'detail', id] as const,
};

// 1. Hook para Leer (GET Paginado y Filtrado)
export const usePatients = (params: GetPatientsParams = { skip: 0, limit: 10, active_only: true }) => {
  return useQuery<PaginatedPatients, ApiError>({
    queryKey: patientKeys.list(params),
    queryFn: () => patientsService.getAll(params),
    staleTime: 1000 * 60 * 2, // 2 minutos de frescura
  });
};

// 2. Hook para Crear (POST)
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation<Patient, ApiError, PatientCreate>({
    mutationFn: (newPatient) => patientsService.create(newPatient),
    onSuccess: () => {
      // Invalidamos TODAS las listas para que la paginación se recalcule
      return queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
};

// 3. Hook para Actualizar (PATCH)
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation<Patient, ApiError, { id: string; data: PatientUpdate }>({
    mutationFn: ({ id, data }) => patientsService.update(id, data),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: patientKeys.all }),
        queryClient.invalidateQueries({ queryKey: patientKeys.detail(variables.id) })
      ]);
    },
  });
};

// 4. Hook para Archivar / Baja Médica (DELETE Lógico)
export const useArchivePatient = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => patientsService.archive(id),
    onSuccess: () => {
      // 🚨 CACHÉ QUIRÚRGICA: Invalidamos la lista completa para que el paciente
      // desaparezca inmediatamente del Grid al volver al Dashboard
      return queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
};