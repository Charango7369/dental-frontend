// src/features/dashboard/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardService.getSummary,
    staleTime: 1000 * 60 * 2,      // 2 min de frescura
    refetchInterval: 1000 * 60 * 5, // refresca automáticamente cada 5 min
  });
};