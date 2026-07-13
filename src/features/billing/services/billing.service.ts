// src/features/billing/services/billing.service.ts
import { apiClient } from '../../../api/client';

export type AccountStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type PaymentMethod = 'CASH' | 'QR' | 'CARD' | 'TRANSFER';

export interface PatientMini {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

export interface Payment {
  id: string;
  account_id: string;
  amount_paid: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Account {
  id: string;
  patient_id: string;
  total_amount: number;
  balance_due: number;
  status: AccountStatus;
  description: string;
  created_at: string;
  payments: Payment[];
  patient: PatientMini | null;
}

export interface PaymentCreate {
  amount_paid: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
}

export const billingService = {
  getAccounts: async (statusFilter?: AccountStatus): Promise<Account[]> => {
    const response = await apiClient.get<Account[]>('/billing/accounts', {
      params: statusFilter ? { status_filter: statusFilter } : undefined,
    });
    return response.data;
  },

  getAccountById: async (id: string): Promise<Account> => {
    const response = await apiClient.get<Account>(`/billing/accounts/${id}`);
    return response.data;
  },

  getAccountsByPatient: async (patientId: string): Promise<Account[]> => {
    const response = await apiClient.get<Account[]>(`/billing/accounts/patient/${patientId}`);
    return response.data;
  },

  createPayment: async (accountId: string, data: PaymentCreate): Promise<Payment> => {
    const response = await apiClient.post<Payment>(`/billing/accounts/${accountId}/payments`, data);
    return response.data;
  },
};