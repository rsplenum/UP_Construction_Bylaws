import React, { useState } from 'react';
import { Header } from './components/Header';
import { ByelawsNavigator } from './components/ByelawsNavigator';
import { ComplianceCalculators } from './components/ComplianceCalculators';
import { SetbackVisualizer } from './components/SetbackVisualizer';
import { ZoningMatrixExplorer } from './components/ZoningMatrixExplorer';
import { FormsAndAppendices } from './components/FormsAndAppendices';
import { AiAssistant } from './components/AiAssistant';
import { DOCUMENT_METADATA } from './data/byelawsData';
import { ShieldCheck, BookOpen, Calculator, Compass, Bot } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('navigator');
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header & Search */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'navigator' && (
          <ByelawsNavigator
            searchQuery={searchQuery}
            onSelectCalculator={(type) => setActiveTab('calculators')}
          />
        )}

        {activeTab === 'calculators' && <ComplianceCalculators />}

        {activeTab === 'visualizer' && <SetbackVisualizer />}

        {activeTab === 'zoning' && <ZoningMatrixExplorer />}

        {activeTab === 'forms' && <FormsAndAppendices />}

        {activeTab === 'ai-assistant' && <AiAssistant />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
              UP
            </div>
            <span>
              <strong>{DOCUMENT_METADATA.title}</strong> — {DOCUMENT_METADATA.version} ({DOCUMENT_METADATA.date})
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>{DOCUMENT_METADATA.department}</span>
            <span>•</span>
            <span>Uttar Pradesh Urban Planning and Development Act, 1973</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
