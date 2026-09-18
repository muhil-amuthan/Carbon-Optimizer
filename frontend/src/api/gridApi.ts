import { apiClient } from './client';
import { GridIntensity, HourlyIntensity, OptimalWindow, WeeklyForecast } from '../types';
import {
  mockGridIntensity,
  mockHourlyIntensity,
  mockOptimalWindows,
  mockWeeklyForecast,
} from '../mock/mockData';

export const gridApi = {
  getCurrent: async (region = 'REGION_A'): Promise<GridIntensity> => {
    try {
      const res = await apiClient.get<any>('/api/grid/current', { params: { region } });
      if (res.data && res.data.carbon_intensity) {
        const val = Math.round(res.data.carbon_intensity);
        const status = val <= 300 ? 'low' : val <= 500 ? 'medium' : 'high';
        return {
          value: val,
          status,
          timestamp: res.data.timestamp || new Date().toISOString(),
          source: res.data.status === 'live' ? 'Grid Telemetry' : 'Regional Energy Model',
          location: res.data.region || region,
          next_clean_window: '01:00 – 05:00',
        };
      }
      return mockGridIntensity;
    } catch {
      return mockGridIntensity;
    }
  },

  getOptimalWindow: async (region = 'REGION_A'): Promise<OptimalWindow[]> => {
    try {
      const res = await apiClient.get<any>('/api/grid/optimal-window', { params: { region } });
      if (res.data && res.data.start_time) {
        return [
          {
            start: res.data.start_time,
            end: res.data.end_time,
            avg_ci: Math.round(res.data.avg_carbon_intensity),
            min_ci: Math.round(res.data.avg_carbon_intensity * 0.9),
            max_ci: Math.round(res.data.avg_carbon_intensity * 1.1),
            co2_saving_kg: 5.4,
            recommended: true,
          },
          ...mockOptimalWindows.slice(1),
        ];
      }
      return mockOptimalWindows;
    } catch {
      return mockOptimalWindows;
    }
  },

  getHourlyForecast: async (_region = 'REGION_A'): Promise<HourlyIntensity[]> => {
    return mockHourlyIntensity;
  },

  getWeeklyForecast: async (_region = 'REGION_A'): Promise<WeeklyForecast[]> => {
    return mockWeeklyForecast;
  },

  triggerMqtt: async (deviceId: string, action: 'ON' | 'OFF' | 'SCHEDULE') => {
    try {
      const res = await apiClient.post('/api/grid/mqtt/trigger', null, {
        params: { device_id: deviceId, action },
      });
      return res.data;
    } catch {
      return {
        device_id: deviceId,
        action,
        status: 'simulated_success',
        message: `Command '${action}' simulated for device ${deviceId}`,
      };
    }
  },
};
