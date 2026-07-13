// src/features/billing/hooks/useBilling.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  billingService,
  type AccountStatus,
  type PaymentCreate,
} from '../services/billing.service';

export const billingKeys = {
  all: ['billing'] as const,
  accounts: (status?: AccountStatus) => ['billing', 'accounts', status ?? 'ALL'] as const,
  account: (id: string) => ['billing', 'account', id] as const,
  byPatient: (patientId: string) => ['billing', 'patient', patientId] as const,
};

export const useAccounts = (statusFilter?: AccountStatus) => {
  return useQuery({
    queryKey: billingKeys.accounts(statusFilter),
    queryFn: () => billingService.getAccounts(statusFilter),
  });
};

export const useAccount = (id: string) => {
  return useQuery({
    queryKey: billingKeys.account(id),
    queryFn: () => billingService.getAccountById(id),
    enabled: !!id,
  });
};

export const usePatientAccounts = (patientId: string) => {
  return useQuery({
    queryKey: billingKeys.byPatient(patientId),
    queryFn: () => billingService.getAccountsByPatient(patientId),
    enabled: !!patientId,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data: PaymentCreate }) =>
      billingService.createPayment(accountId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: billingKeys.account(variables.accountId) });
      // También refresca el dashboard (ingresos del mes cambia)
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
};