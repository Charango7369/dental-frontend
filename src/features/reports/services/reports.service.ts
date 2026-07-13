// src/features/reports/services/reports.service.ts
import { apiClient } from '../../../api/client';

export type Granularity = 'day' | 'week' | 'month';

export interface IncomePeriodPoint {
  period: string;
  total: number;
  count: number;
}

export interface MethodBreakdown {
  method: string;
  total: number;
  count: number;
}

export interface IncomeReport {
  granularity: Granularity;
  start_date: string;
  end_date: string;
  total_income: number;
  total_payments: number;
  average_per_period: number;
  series: IncomePeriodPoint[];
  by_method: MethodBreakdown[];
}

export const reportsService = {
  getIncomeReport: async (
    granularity: Granularity,
    startDate?: string,
    endDate?: string
  ): Promise<IncomeReport> => {
    const response = await apiClient.get<IncomeReport>('/reports/income', {
      params: {
        granularity,
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      },
    });
    return response.data;
  },
};