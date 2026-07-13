// src/features/appointments/hooks/useAppointments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  appointmentsService,
  type AppointmentCreate,
  type AppointmentUpdate,
  type AppointmentCompletePayload,
} from '../services/appointments.service';

export const appointmentKeys = {
  all: ['appointments'] as const,
  daily: (date: string) => ['appointments', 'daily', date] as const,
  monthly: (month: string) => ['appointments', 'monthly', month] as const,
  byPatient: (patientId: string) => ['appointments', 'patient', patientId] as const,
};

// 1. Leer agenda del día
export const useDailyAppointments = (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return useQuery({
    queryKey: appointmentKeys.daily(startOfDay.toISOString()),
    queryFn: () =>
      appointmentsService.getDaily(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      ),
    refetchInterval: 1000 * 60,
  });
};

// 2. Leer citas de un mes completo (para el mini calendario)
export const useMonthlyAppointments = (startOfMonth: Date, endOfMonth: Date) => {
  return useQuery({
    queryKey: appointmentKeys.monthly(startOfMonth.toISOString()),
    queryFn: () =>
      appointmentsService.getDaily(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      ),
    staleTime: 1000 * 60 * 5,
  });
};

// 3. Historial completo de citas de un paciente
export const usePatientAppointments = (patientId: string) => {
  return useQuery({
    queryKey: appointmentKeys.byPatient(patientId),
    queryFn: () => appointmentsService.getByPatient(patientId),
    enabled: !!patientId,
  });
};

// 4. Crear cita
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentCreate) => appointmentsService.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
};

// 5. Actualizar estado / reagendar
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentUpdate }) =>
      appointmentsService.update(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
};

// 6. Completar cita + generar cobro
export const useCompleteAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentCompletePayload }) =>
      appointmentsService.complete(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
};