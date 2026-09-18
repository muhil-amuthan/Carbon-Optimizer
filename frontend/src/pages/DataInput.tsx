import React, { useState, useEffect } from 'react';
import { DataUpload } from '../components/DataUpload';
import { emissionsApi } from '../api/emissionsApi';
import { EmissionData } from '../types';
import { Database, RefreshCw, Calculator, CheckCircle2 } from 'lucide-react';
import { formatCO2, formatNumber, formatShortDate } from '../utils/formatters';

interface DataInputProps {
  factoryId: string;
}

export const DataInput: React.FC<DataInputProps> = ({ factoryId }) => {
  const [results, setResults] = useState<EmissionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcNotice, setCalcNotice] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await emissionsApi.getResults(factoryId, 15);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [factoryId]);

  const handleCalculateEmissions = async () => {
    setIsCalculating(true);
    setCalcNotice(null);
    try {
      await emissionsApi.calculate(factoryId);
      setCalcNotice('Emissions calculated successfully! Telemetry updated.');
      fetchRecords();
    } catch (err: any) {
      setCalcNotice(err.message || 'Calculation completed.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Operational Data & Emissions Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ingest industrial sensor logs and compute scope-specific GHG emissions
          </p>
        </div>

        <button
          onClick={handleCalculateEmissions}
          disabled={isCalculating}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          <Calculator className="h-4 w-4" />
          <span>{isCalculating ? 'Computing Carbon Coefficients...' : 'Trigger Calculation Engine'}</span>
        </button>
      </div>

      {calcNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{calcNotice}</span>
        </div>
      )}

      {/* Upload & Form */}
      <DataUpload factoryId={factoryId} onUploadSuccess={fetchRecords} />

      {/* Operational Records Log Table */}
      <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Recent Calculated Emissions Ledger</h3>
          </div>
          <button
            onClick={fetchRecords}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Total (kg CO₂)</th>
                <th className="py-2.5 px-3">Scope 1</th>
                <th className="py-2.5 px-3">Scope 2</th>
                <th className="py-2.5 px-3">Scope 3</th>
                <th className="py-2.5 px-3">Intensity (kg/unit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {results.length > 0 ? (
                results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-white">{formatShortDate(r.date)}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{formatNumber(r.total_emissions)}</td>
                    <td className="py-2.5 px-3 text-amber-400">{formatNumber(r.scope1_total)}</td>
                    <td className="py-2.5 px-3 text-blue-400">{formatNumber(r.scope2_total)}</td>
                    <td className="py-2.5 px-3 text-purple-400">{formatNumber(r.scope3_total)}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{r.emission_intensity?.toFixed(3) || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                    No emission records found. Click &quot;Trigger Calculation Engine&quot; or upload telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
