// src/features/users/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService, type StaffUserCreate, type StaffUserUpdate } from '../services/users.service';

export const staffKeys = {
  all: ['staff-users'] as const,
};

export const useStaffUsers = () => {
  return useQuery({
    queryKey: staffKeys.all,
    queryFn: usersService.getAll,
  });
};

export const useCreateStaffUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffUserCreate) => usersService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  });
};

export const useUpdateStaffUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffUserUpdate }) => usersService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  });
};