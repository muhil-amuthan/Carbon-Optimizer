import { useState, useEffect } from 'react';
import { optimizeApi } from '../api/optimizeApi';
import { OptimizationResult, ReductionAction } from '../types';

export function useOptimize() {
  const [actions, setActions] = useState<ReductionAction[]>([]);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    optimizeApi.getActions().then(setActions).catch(() => {});
  }, []);

  const run = async (factoryId: string, budgetUsd: number, targetReductionPct = 25, excludeActions: string[] = []) => {
    setLoading(true);
    try {
      const res = await optimizeApi.runOptimization({
        factory_id: factoryId,
        budget_usd: budgetUsd,
        target_reduction_pct: targetReductionPct,
        exclude_actions: excludeActions,
      });
      setResult(res);
      return res;
    } finally {
      setLoading(false);
    }
  };

  return { actions, result, loading, run };
}
