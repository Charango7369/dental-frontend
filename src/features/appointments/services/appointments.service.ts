// src/features/appointments/services/appointments.service.ts
import { apiClient } from '../../../api/client';
import type { Patient } from '../../../types';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

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
}

export const appointmentsService = {
  getDaily: async (startDate: string, endDate: string): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>('/appointments', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  // Historial completo de un paciente (sin límite de fechas)
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

  complete: async (id: string, data: AppointmentCompletePayload): Promise<void> => {
    await apiClient.post(`/appointments/${id}/complete`, data);
  },
};
