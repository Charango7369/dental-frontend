import { apiClient } from '../../../api/client'; // 🚨 CORRECCIÓN: Ruta exacta y named import
import type { Patient } from '../../../types';

// --- INTERFACES DE PAGINACIÓN Y BÚSQUEDA ---

export interface PaginatedPatients {
  total: number;
  items: Patient[];
}

export interface GetPatientsParams {
  skip?: number;
  limit?: number;
  search?: string;
  active_only?: boolean;
}

// --- TIPOS DE MUTACIÓN ---

export interface PatientCreate {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
}

export interface PatientUpdate {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  is_active?: boolean;
}

// --- EL SERVICIO CONECTADO ---

export const patientsService = {
  // GET Paginado, Filtrado y Multi-tenant
  getAll: async (params?: GetPatientsParams): Promise<PaginatedPatients> => {
    const response = await apiClient.get<PaginatedPatients>('/patients', { params });
    return response.data;
  },

  // GET Individual (Historial del Paciente)
  getById: async (id: string): Promise<Patient> => {
    const response = await apiClient.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  // POST (Inyección idempotente desde el formulario)
  create: async (data: PatientCreate): Promise<Patient> => {
    const response = await apiClient.post<Patient>('/patients', data);
    return response.data;
  },

  // PATCH (Actualización de datos clínicos)
  update: async (id: string, data: PatientUpdate): Promise<Patient> => {
    const response = await apiClient.patch<Patient>(`/patients/${id}`, data);
    return response.data;
  },

  // DELETE (Baja Médica Lógica / Soft Delete)
  archive: async (id: string): Promise<void> => {
    await apiClient.delete(`/patients/${id}`);
  }
};