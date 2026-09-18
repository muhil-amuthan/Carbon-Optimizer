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
      <div className="min-h-screen bg-[#0a0e1a] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
        {/* Top Navigation */}
        <Navbar
          currentFactory={currentFactory}
          onFactoryChange={setCurrentFactory}
          gridIntensity={410}
          gridStatus="medium"
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Routes>
            <Route path="/" element={<Dashboard factoryId={currentFactory} />} />
            <Route path="/data" element={<DataInput factoryId={currentFactory} />} />
            <Route path="/optimize" element={<BudgetOptimizer factoryId={currentFactory} />} />
            <Route path="/simulator" element={<Simulator factoryId={currentFactory} />} />
            <Route path="/automation" element={<Automation factoryId={currentFactory} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 bg-[#0d1321]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>CarbonWise Industrial ESG Intelligence • Powered by FastAPI & React</span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 font-mono">Telemetry Link: Connected (Port 8000)</span>
            </span>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
