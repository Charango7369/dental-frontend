// src/features/dashboard/services/dashboard.service.ts
import { apiClient } from '../../../api/client';



export interface DashboardSummary {
  total_patients: number;
  appointments_today: number;
  pending_today: number;
  pending_accounts: number;
  total_balance_due: number;
  monthly_income: number;
  new_patients_month: number;
  upcoming_appointments: {
    id: string;
    patient_id: string;
    start_time: string;
    status: string;
    reason?: string;
  }[];
  generated_at: string;
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return response.data;
  },
};