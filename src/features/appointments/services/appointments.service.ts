// src/features/appointments/services/appointments.service.ts
import { apiClient } from '../../../api/client';
import type { Patient } from '../../../types';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface DoctorSummary {
  id: string;
  full_name: string;
  email: string;
}

export interface AppointmentCreate {
  patient_id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

export interface AppointmentUpdate {
  status?: AppointmentStatus;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export interface AppointmentReschedulePayload {
  start_time: string;
  end_time: string;
}

export interface AppointmentCompletePayload {
  final_cost: number;
  treatment_description: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
  status: AppointmentStatus;
  patient?: Patient;
  doctor?: DoctorSummary;
}

export interface AppointmentFilterParams {
  start_date?: string;
  end_date?: string;
  patient_id?: string;
  doctor_id?: string;
  status?: string;
  search?: string;
}

export interface AppointmentMetricsToday {
  total_today: number;
  attended_today: number;
  pending_today: number;
  confirmed_today: number;
  cancelled_today: number;
  estimated_income_today: number;
}

export const appointmentsService = {
  getAll: async (params?: AppointmentFilterParams): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>('/appointments', { params });
    return response.data;
  },

  getDaily: async (startDate: string, endDate: string, extra?: { doctor_id?: string; search?: string; status?: string }): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>('/appointments', {
      params: {
        start_date: startDate,
        end_date: endDate,
        ...extra,
      },
    });
    return response.data;
  },

  getMetricsToday: async (): Promise<AppointmentMetricsToday> => {
    const response = await apiClient.get<AppointmentMetricsToday>('/appointments/metrics/today');
    return response.data;
  },

  // Historial completo de un paciente
  getByPatient: async (patientId: string): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>('/appointments', {
      params: { patient_id: patientId },
    });
    return response.data;
  },

  create: async (data: AppointmentCreate): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>('/appointments', data);
    return response.data;
  },

  update: async (id: string, data: AppointmentUpdate): Promise<Appointment> => {
    const response = await apiClient.patch<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },

  reschedule: async (id: string, payload: AppointmentReschedulePayload): Promise<Appointment> => {
    const response = await apiClient.patch<Appointment>(`/appointments/${id}/reschedule`, payload);
    return response.data;
  },

  sendReminder: async (id: string): Promise<{ message: string; recipient: string }> => {
    const response = await apiClient.post<{ message: string; recipient: string }>(`/appointments/${id}/send-reminder`);
    return response.data;
  },

  complete: async (id: string, data: AppointmentCompletePayload): Promise<void> => {
    await apiClient.post(`/appointments/${id}/complete`, data);
  },
};
