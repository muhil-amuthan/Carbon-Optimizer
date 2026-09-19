import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { DataInput } from './pages/DataInput';
import { BudgetOptimizer } from './pages/BudgetOptimizer';
import { Simulator } from './pages/Simulator';
import { Automation } from './pages/Automation';
import { DEFAULT_FACTORY_ID } from './utils/constants';

export const App: React.FC = () => {
  const [currentFactory, setCurrentFactory] = useState<string>(DEFAULT_FACTORY_ID);

  return (
    <Router>
      <div className="min-h-screen bg-[#F7FAF8] text-[#1A2E24] flex flex-col font-sans selection:bg-[#EBF5F0] selection:text-[#168A5B]">
        {/* Top Navigation */}
        <Navbar
          currentFactory={currentFactory}
          onFactoryChange={setCurrentFactory}
          gridIntensity={410}
          gridStatus="medium"
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard factoryId={currentFactory} />} />
            <Route path="/data" element={<DataInput factoryId={currentFactory} />} />
            <Route path="/optimize" element={<BudgetOptimizer factoryId={currentFactory} />} />
            <Route path="/simulator" element={<Simulator factoryId={currentFactory} />} />
            <Route path="/automation" element={<Automation factoryId={currentFactory} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Clean Environmental Footer */}
        <footer className="border-t border-[#E3E9E5] py-4 text-xs text-[#768E82] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-[#1A2E24]">CarbonWise</span>
              <span>•</span>
              <span>Industrial Carbon Intelligence & Decarbonization Platform</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#168A5B]" />
              <span className="text-[#486255]">Telemetry Feed Active</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
