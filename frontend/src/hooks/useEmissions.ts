import { useState, useEffect, useCallback } from 'react';
import { emissionsApi } from '../api/emissionsApi';
import {
  EmissionSummary,
  AnomalyResult,
  ForecastPoint,
  EmissionBreakdown,
} from '../types';

export function useEmissions(factoryId: string) {
  const [summary, setSummary] = useState<EmissionSummary | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [breakdown, setBreakdown] = useState<EmissionBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, anomRes, fcRes, bdRes] = await Promise.all([
        emissionsApi.getSummary(factoryId),
        emissionsApi.getAnomalies(factoryId),
        emissionsApi.getForecast(factoryId),
        emissionsApi.getBreakdown(factoryId),
      ]);
      setSummary(sumRes);
      setAnomalies(anomRes);
      setForecast(fcRes);
      setBreakdown(bdRes);
    } catch (err: any) {
      setError(err.message || 'Error fetching emission data');
    } finally {
      setLoading(false);
    }
  }, [factoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { summary, anomalies, forecast, breakdown, loading, error, refetch: fetchData };
}
