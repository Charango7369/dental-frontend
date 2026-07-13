// src/features/odontogram/services/odontogram.service.ts
import { apiClient } from '../../../api/client';

export interface ToothCondition {
  condition: string;
  faces: string[];
}

export interface OdontogramCreate {
  patient_id: string;
  description?: string;
  teeth_data: Record<string, ToothCondition>;
}

export interface OdontogramUpdate {
  description: string;
}

export interface Odontogram {
  id: string;
  patient_id: string;
  tenant_id: string;
  doctor_id: string;
  description: string | null;
  teeth_data: Record<string, ToothCondition>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const odontogramService = {
  create: async (data: OdontogramCreate): Promise<Odontogram> => {
    const response = await apiClient.post<Odontogram>('/odontograms/', data);
    return response.data;
  },

  getByPatient: async (patientId: string): Promise<Odontogram[]> => {
    const response = await apiClient.get<Odontogram[]>(`/odontograms/patient/${patientId}`);
    return response.data;
  },

  // 🚨 NUEVO: edita las notas de una evolución ya guardada
  updateNotes: async (id: string, data: OdontogramUpdate): Promise<Odontogram> => {
    const response = await apiClient.patch<Odontogram>(`/odontograms/${id}`, data);
    return response.data;
  },
};