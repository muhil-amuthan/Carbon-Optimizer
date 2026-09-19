import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <div className="bg-white border border-[#E3E9E5] rounded-xl p-5 shadow-card space-y-5">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F4F1] pb-4">
        <div>
          <h3 className="text-base font-semibold text-[#1A2E24] flex items-center space-x-2">
            <UploadCloud className="h-4 w-4 text-[#168A5B]" />
            <span>Industrial Activity Data Ingestion</span>
          </h3>
          <p className="text-xs text-[#768E82] mt-0.5">Upload meter batch CSVs or insert daily operational records</p>
        </div>

        <div className="flex items-center space-x-1 bg-[#F0F4F1] p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1 rounded-md transition-colors font-medium ${
              activeTab === 'csv'
                ? 'bg-white text-[#168A5B] font-semibold shadow-xs'
                : 'text-[#486255] hover:text-[#1A2E24]'
            }`}
          >
            CSV Batch Upload
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1 rounded-md transition-colors font-medium ${
              activeTab === 'manual'
                ? 'bg-white text-[#168A5B] font-semibold shadow-xs'
                : 'text-[#486255] hover:text-[#1A2E24]'
            }`}
          >
            Manual Entry Form
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div
          className={`p-3 rounded-lg border flex items-center space-x-2 text-xs ${
            uploadMessage.type === 'success'
              ? 'bg-[#EBF5F0] border-[#D5E6DC] text-[#168A5B]'
              : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]'
          }`}
        >
          {uploadMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-[#168A5B]" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[#DC2626]" />
          )}
          <span>{uploadMessage.text}</span>
        </div>
      )}

      {activeTab === 'csv' ? (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-[#D5DDD8] hover:border-[#168A5B] rounded-xl p-8 text-center transition-colors bg-[#F7FAF8] cursor-pointer"
            onClick={() => document.getElementById('csvInput')?.click()}
          >
            <UploadCloud className="h-8 w-8 text-[#168A5B] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1A2E24]">
              {file ? file.name : 'Click to select CSV file or drag and drop here'}
            </p>
            <p className="text-xs text-[#768E82] mt-1">
              Required columns: <code className="text-[#486255] bg-white px-1 py-0.5 rounded border border-[#E3E9E5]">date, factory_id, electricity_kwh</code>
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
            <span className="text-[#768E82]">Standard UTF-8 CSV up to 10MB</span>
            <button
              onClick={handleCsvUpload}
              disabled={!file || isUploading}
              className="px-4 py-2 rounded-lg bg-[#168A5B] hover:bg-[#13784F] text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-40"
            >
              {isUploading ? 'Uploading...' : 'Process & Ingest File'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#486255] font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-white border border-[#D5DDD8] rounded-lg p-2 text-[#1A2E24] focus:outline-none focus:border-[#168A5B]"
              />
            </div>
            <div>
              <label className="block text-[#486255] font-medium mb-1">Electricity (kWh)</label>
              <input
                type="number"
                value={formData.electricity_kwh}
                onChange={(e) => setFormData({ ...formData, electricity_kwh: Number(e.target.value) })}
                className="w-full bg-white border border-[#D5DDD8] rounded-lg p-2 text-[#1A2E24] focus:outline-none focus:border-[#168A5B]"
              />
            </div>
            <div>
              <label className="block text-[#486255] font-medium mb-1">Natural Gas (m³)</label>
              <input
                type="number"
                value={formData.natural_gas_m3}
                onChange={(e) => setFormData({ ...formData, natural_gas_m3: Number(e.target.value) })}
                className="w-full bg-white border border-[#D5DDD8] rounded-lg p-2 text-[#1A2E24] focus:outline-none focus:border-[#168A5B]"
              />
            </div>
            <div>
              <label className="block text-[#486255] font-medium mb-1">Diesel (Liters)</label>
              <input
                type="number"
                value={formData.diesel_liters}
                onChange={(e) => setFormData({ ...formData, diesel_liters: Number(e.target.value) })}
                className="w-full bg-white border border-[#D5DDD8] rounded-lg p-2 text-[#1A2E24] focus:outline-none focus:border-[#168A5B]"
              />
            </div>
            <div>
              <label className="block text-[#486255] font-medium mb-1">Production (Units)</label>
              <input
                type="number"
                value={formData.production_units}
                onChange={(e) => setFormData({ ...formData, production_units: Number(e.target.value) })}
                className="w-full bg-white border border-[#D5DDD8] rounded-lg p-2 text-[#1A2E24] focus:outline-none focus:border-[#168A5B]"
              />
            </div>
            <div>
              <label className="block text-[#486255] font-medium mb-1">Waste Generated (kg)</label>
              <input
                type="number"
                value={formData.waste_kg}
                onChange={(e) => setFormData({ ...formData, waste_kg: Number(e.target.value) })}
                className="w-full bg-white border border-[#D5DDD8] rounded-lg p-2 text-[#1A2E24] focus:outline-none focus:border-[#168A5B]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 rounded-lg bg-[#168A5B] hover:bg-[#13784F] text-white font-medium text-xs shadow-xs transition-colors"
            >
              {isUploading ? 'Saving...' : 'Add Operational Entry'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
