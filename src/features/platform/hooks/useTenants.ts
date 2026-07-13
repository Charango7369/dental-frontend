// src/features/platform/hooks/useTenants.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsService, type TenantCreate, type TenantUpdate } from '../services/tenants.service';

export const tenantKeys = {
  all: ['tenants'] as const,
};

export const useTenants = () => {
  return useQuery({
    queryKey: tenantKeys.all,
    queryFn: tenantsService.getAll,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TenantCreate) => tenantsService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantKeys.all }),
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TenantUpdate }) => tenantsService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantKeys.all }),
  });
};