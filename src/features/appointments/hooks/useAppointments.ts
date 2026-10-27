// src/features/appointments/hooks/useAppointments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  appointmentsService,
  type AppointmentCreate,
  type AppointmentUpdate,
  type AppointmentReschedulePayload,
  type AppointmentCompletePayload,
  type AppointmentFilterParams,
} from '../services/appointments.service';

export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (params?: AppointmentFilterParams) => ['appointments', 'list', params] as const,
  daily: (date: string, filters?: Record<string, any>) => ['appointments', 'daily', date, filters] as const,
  monthly: (month: string, filters?: Record<string, any>) => ['appointments', 'monthly', month, filters] as const,
  metricsToday: ['appointments', 'metrics', 'today'] as const,
  byPatient: (patientId: string) => ['appointments', 'patient', patientId] as const,
};

// 1. Leer citas con filtros dinámicos (Doctor, Paciente, Estado, Búsqueda, Fechas)
export const useAppointments = (params?: AppointmentFilterParams) => {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => appointmentsService.getAll(params),
    refetchInterval: 1000 * 60, // Refrescar cada 60 seg
  });
};

// 2. Leer agenda del día con soporte para filtros
export const useDailyAppointments = (
  date: Date,
  filters?: { doctor_id?: string; search?: string; status?: string }
) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return useQuery({
    queryKey: appointmentKeys.daily(startOfDay.toISOString(), filters),
    queryFn: () =>
      appointmentsService.getDaily(
        startOfDay.toISOString(),
        endOfDay.toISOString(),
        filters
      ),
    refetchInterval: 1000 * 60,
  });
};

// 3. Leer citas de un rango o mes completo
export const useMonthlyAppointments = (
  startOfMonth: Date,
  endOfMonth: Date,
  filters?: { doctor_id?: string; search?: string; status?: string }
) => {
  return useQuery({
    queryKey: appointmentKeys.monthly(startOfMonth.toISOString(), filters),
    queryFn: () =>
      appointmentsService.getDaily(
        startOfMonth.toISOString(),
        endOfMonth.toISOString(),
        filters
      ),
    staleTime: 1000 * 60 * 3,
  });
};

// 4. Métricas rápidas del día para el dashboard lateral
export const useTodayMetrics = () => {
  return useQuery({
    queryKey: appointmentKeys.metricsToday,
    queryFn: () => appointmentsService.getMetricsToday(),
    refetchInterval: 1000 * 30, // Cada 30 seg
  });
};

// 5. Historial completo de citas de un paciente
export const usePatientAppointments = (patientId: string) => {
  return useQuery({
    queryKey: appointmentKeys.byPatient(patientId),
    queryFn: () => appointmentsService.getByPatient(patientId),
    enabled: !!patientId,
  });
};

// 6. Crear cita
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentCreate) => appointmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
};

// 7. Actualizar estado / datos de la cita
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentUpdate }) =>
      appointmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
};

// 8. Reagendar cita (Drag and drop interactivo)
export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AppointmentReschedulePayload }) =>
      appointmentsService.reschedule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
};

// 9. Enviar recordatorio por WhatsApp Cloud API
export const useSendReminder = () => {
  return useMutation({
    mutationFn: (id: string) => appointmentsService.sendReminder(id),
  });
};

// 10. Completar cita + generar cobro
export const useCompleteAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentCompletePayload }) =>
      appointmentsService.complete(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
};
