// src/features/reports/hooks/useReports.ts
import { useQuery } from '@tanstack/react-query';
import { reportsService, type Granularity } from '../services/reports.service';

export const useIncomeReport = (
  granularity: Granularity,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ['reports', 'income', granularity, startDate, endDate],
    queryFn: () => reportsService.getIncomeReport(granularity, startDate, endDate),
    staleTime: 1000 * 60 * 2,
  });
};