// src/features/users/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { usersService, type StaffUserCreate, type StaffUserUpdate } from '../services/users.service';

export const staffKeys = {
  all: ['staff-users'] as const,
  byTenant: (tenantId: string) => ['staff-users', tenantId] as const,
};

export const useStaffUsers = () => {
  const tenantId = useAuthStore((s) => s.user?.tenant_id) || '';
  return useQuery({
    queryKey: staffKeys.byTenant(tenantId),
    queryFn: usersService.getAll,
    enabled: Boolean(tenantId),
    refetchOnMount: 'always',
  });
};

export const useCreateStaffUser = () => {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((s) => s.user?.tenant_id) || '';
  return useMutation({
    mutationFn: (data: StaffUserCreate) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.byTenant(tenantId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
};

export const useUpdateStaffUser = () => {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((s) => s.user?.tenant_id) || '';
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffUserUpdate }) => usersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.byTenant(tenantId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
};
