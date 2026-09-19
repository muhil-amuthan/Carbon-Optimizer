import React, { useState, useEffect } from 'react';
import { DataUpload } from '../components/DataUpload';
import { emissionsApi } from '../api/emissionsApi';
import { EmissionData } from '../types';
import { Database, RefreshCw, Calculator, CheckCircle2 } from 'lucide-react';
import { formatNumber, formatShortDate } from '../utils/formatters';

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E3E9E5] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A2E24]">
            Data Ingestion & Emissions Accounting
          </h1>
          <p className="text-xs text-[#768E82] mt-0.5">
            Ingest industrial sensor logs and compute scope-specific GHG emissions per ISO 14064
          </p>
        </div>

        <button
          onClick={handleCalculateEmissions}
          disabled={isCalculating}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#168A5B] hover:bg-[#13784F] text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
        >
          <Calculator className="h-4 w-4" />
          <span>{isCalculating ? 'Computing Carbon Coefficients...' : 'Run Emission Calculations'}</span>
        </button>
      </div>

      {calcNotice && (
        <div className="p-3 rounded-lg bg-[#EBF5F0] border border-[#D5E6DC] text-[#168A5B] text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-[#168A5B]" />
          <span>{calcNotice}</span>
        </div>
      )}

      {/* Upload & Manual Entry Form */}
      <DataUpload factoryId={factoryId} onUploadSuccess={fetchRecords} />

      {/* Operational Records Log Table */}
      <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-[#168A5B]" />
            <h3 className="text-base font-semibold text-[#1A2E24]">Recent Calculated Emissions Ledger</h3>
          </div>
          <button
            onClick={fetchRecords}
            className="text-xs text-[#486255] hover:text-[#1A2E24] flex items-center space-x-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#168A5B]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-[#1A2E24]">
            <thead className="bg-[#F7FAF8] text-[#768E82] uppercase tracking-wider text-[11px] border-b border-[#E3E9E5]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Total (kg CO₂)</th>
                <th className="py-2.5 px-3">Scope 1 (Fuel)</th>
                <th className="py-2.5 px-3">Scope 2 (Power)</th>
                <th className="py-2.5 px-3">Scope 3 (Supply)</th>
                <th className="py-2.5 px-3">Intensity (kg/unit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F1] font-mono">
              {results.length > 0 ? (
                results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-[#F7FAF8] transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-[#1A2E24]">{formatShortDate(r.date)}</td>
                    <td className="py-2.5 px-3 text-[#168A5B] font-bold">{formatNumber(r.total_emissions)}</td>
                    <td className="py-2.5 px-3 text-[#D97706]">{formatNumber(r.scope1_total)}</td>
                    <td className="py-2.5 px-3 text-[#2563EB]">{formatNumber(r.scope2_total)}</td>
                    <td className="py-2.5 px-3 text-[#7C3AED]">{formatNumber(r.scope3_total)}</td>
                    <td className="py-2.5 px-3 text-[#0D9488] font-semibold">{r.emission_intensity?.toFixed(3) || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#768E82] font-sans">
                    No emission records found. Click &quot;Run Emission Calculations&quot; or upload telemetry CSV.
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
