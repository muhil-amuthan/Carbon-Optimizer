import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import { emissionsApi } from '../api/emissionsApi';

interface DataUploadProps {
  factoryId: string;
  onUploadSuccess: () => void;
}

export const DataUpload: React.FC<DataUploadProps> = ({ factoryId, onUploadSuccess }) => {
  const [activeTab, setActiveTab] = useState<'csv' | 'manual'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Manual Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    factory_id: factoryId,
    electricity_kwh: 4500,
    natural_gas_m3: 320,
    diesel_liters: 150,
    production_units: 1200,
    waste_kg: 85,
    water_m3: 40,
  });

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleCsvUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadMessage(null);
    try {
      const res = await emissionsApi.uploadCsv(file);
      setUploadMessage({
        text: `Successfully uploaded ${res.records_inserted} operational records!`,
        type: 'success',
      });
      setFile(null);
      onUploadSuccess();
    } catch (err: any) {
      setUploadMessage({
        text: err.message || 'CSV upload failed. Please verify column schema.',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadMessage(null);
    try {
      await emissionsApi.addManualEntry({ ...formData, factory_id: factoryId });
      setUploadMessage({
        text: 'Record saved! Recalculating emissions...',
        type: 'success',
      });
      onUploadSuccess();
    } catch (err: any) {
      setUploadMessage({
        text: err.message || 'Failed to submit manual record.',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#131b2e]/90 border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center space-x-2">
            <UploadCloud className="h-4 w-4 text-emerald-400" />
            <span>Industrial Telemetry & Operational Data Input</span>
          </h3>
          <p className="text-xs text-slate-400">Upload meter batch CSVs or insert daily manual logs</p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              activeTab === 'csv'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            CSV Batch Upload
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              activeTab === 'manual'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual Entry Form
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center space-x-2 text-xs ${
            uploadMessage.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}
        >
          {uploadMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{uploadMessage.text}</span>
        </div>
      )}

      {activeTab === 'csv' ? (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center transition-colors bg-slate-900/30 cursor-pointer"
            onClick={() => document.getElementById('csvInput')?.click()}
          >
            <UploadCloud className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">
              {file ? file.name : 'Click to browse or drag & drop CSV file here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Required headers: <code className="text-slate-400">date, factory_id, electricity_kwh</code>
            </p>
            <input
              id="csvInput"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Supported format: UTF-8 CSV up to 10MB</span>
            <button
              onClick={handleCsvUpload}
              disabled={!file || isUploading}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all disabled:opacity-40"
            >
              {isUploading ? 'Uploading...' : 'Process & Ingest Records'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Electricity (kWh)</label>
              <input
                type="number"
                value={formData.electricity_kwh}
                onChange={(e) => setFormData({ ...formData, electricity_kwh: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Natural Gas (m³)</label>
              <input
                type="number"
                value={formData.natural_gas_m3}
                onChange={(e) => setFormData({ ...formData, natural_gas_m3: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Diesel (Liters)</label>
              <input
                type="number"
                value={formData.diesel_liters}
                onChange={(e) => setFormData({ ...formData, diesel_liters: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Production (Units)</label>
              <input
                type="number"
                value={formData.production_units}
                onChange={(e) => setFormData({ ...formData, production_units: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Waste Generated (kg)</label>
              <input
                type="number"
                value={formData.waste_kg}
                onChange={(e) => setFormData({ ...formData, waste_kg: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all"
            >
              {isUploading ? 'Saving...' : 'Add Operational Record'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
