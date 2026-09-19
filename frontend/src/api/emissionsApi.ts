import { apiClient } from './client';
import {
  EmissionSummary,
  EmissionData,
  AnomalyResult,
  ForecastPoint,
  EmissionBreakdown,
} from '../types';
import {
  mockEmissionSummary,
  mockAnomalies,
  mockForecast,
  mockEmissionBreakdown,
} from '../mock/mockData';

export const emissionsApi = {
  getSummary: async (factoryId: string): Promise<EmissionSummary> => {
    try {
      const res = await apiClient.get<EmissionSummary>(`/api/emissions/summary/${factoryId}`);
      if (res.data && res.data.total_emissions_kg) return res.data;
      return mockEmissionSummary;
    } catch {
      return mockEmissionSummary;
    }
  },

  getResults: async (factoryId?: string, limit = 30): Promise<EmissionData[]> => {
    try {
      const res = await apiClient.get<EmissionData[]>('/api/emissions/results', {
        params: { factory_id: factoryId, limit },
      });
      return res.data;
    } catch {
      return [];
    }
  },

  calculate: async (factoryId: string, startDate?: string, endDate?: string) => {
    try {
      const res = await apiClient.post('/api/emissions/calculate', null, {
        params: { factory_id: factoryId, start_date: startDate, end_date: endDate },
      });
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Calculation failed');
    }
  },

  getAnomalies: async (factoryId: string, sensitivity = 2.0): Promise<AnomalyResult[]> => {
    try {
      const res = await apiClient.get<any>(
        `/api/ai/anomalies/${factoryId}`,
        { params: { sensitivity } }
      );
      if (Array.isArray(res.data)) return res.data;
      if (res.data && Array.isArray(res.data.anomalies)) return res.data.anomalies;
      return mockAnomalies;
    } catch {
      return mockAnomalies;
    }
  },

  getForecast: async (factoryId: string, periods = 30): Promise<ForecastPoint[]> => {
    try {
      const res = await apiClient.get<any>(
        `/api/ai/forecast/${factoryId}`,
        { params: { periods } }
      );
      if (Array.isArray(res.data)) return res.data;
      if (res.data && Array.isArray(res.data.forecast)) return res.data.forecast;
      return mockForecast;
    } catch {
      return mockForecast;
    }
  },

  getBreakdown: async (_factoryId: string): Promise<EmissionBreakdown[]> => {
    return mockEmissionBreakdown;
  },

  uploadCsv: async (file: File): Promise<{ message: string; records_inserted: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/api/data/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  addManualEntry: async (data: any): Promise<any> => {
    const res = await apiClient.post('/api/data/manual', data);
    return res.data;
  },
};
