import { apiClient } from './client';
import {
  OptimizationRequest,
  OptimizationResult,
  SimulationRequest,
  SimulationResult,
  ReductionAction,
} from '../types';
import {
  mockOptimizationResult,
  mockSimulationResult,
  mockReductionActions,
} from '../mock/mockData';

export const optimizeApi = {
  runOptimization: async (req: OptimizationRequest): Promise<OptimizationResult> => {
    try {
      const res = await apiClient.post<OptimizationResult>('/api/optimize/run', req);
      return res.data;
    } catch {
      return {
        ...mockOptimizationResult,
        budget_usd: req.budget_usd,
        factory_id: req.factory_id,
      };
    }
  },

  simulate: async (req: SimulationRequest): Promise<SimulationResult> => {
    try {
      const res = await apiClient.post<SimulationResult>('/api/optimize/simulate', req);
      return res.data;
    } catch {
      const electricityDelta = ((req.electricity_reduction_pct || 0) / 100) * 0.45;
      const fuelDelta = ((req.fuel_switching_pct || 0) / 100) * 0.25;
      const renewableDelta = ((req.renewable_share_pct || 0) / 100) * 0.30;
      const totalReduction = Math.min(85, Math.round((electricityDelta + fuelDelta + renewableDelta) * 100));
      const simulatedEmissions = Math.round(15200 * (1 - totalReduction / 100));
      return {
        factory_id: req.factory_id,
        baseline_emissions: 15200,
        simulated_emissions: simulatedEmissions,
        reduction_kg: 15200 - simulatedEmissions,
        reduction_pct: totalReduction,
        scope1_reduction: Math.round(fuelDelta * 4800),
        scope2_reduction: Math.round((electricityDelta + renewableDelta) * 8200),
        scope3_reduction: Math.round(totalReduction * 22),
        cost_impact_usd: Math.round(totalReduction * 420),
      };
    }
  },

  getActions: async (): Promise<ReductionAction[]> => {
    try {
      const res = await apiClient.get<ReductionAction[]>('/api/optimize/actions');
      if (res.data && res.data.length > 0) return res.data;
      return mockReductionActions;
    } catch {
      return mockReductionActions;
    }
  },

  getHistory: async (factoryId: string) => {
    try {
      const res = await apiClient.get(`/api/optimize/history/${factoryId}`);
      return res.data;
    } catch {
      return [];
    }
  },
};
