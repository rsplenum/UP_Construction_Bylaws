import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ComplianceAuditEngine } from './components/ComplianceAuditEngine';
import { MapServerExplorer } from './components/MapServerExplorer';
import { ByelawsNavigator } from './components/ByelawsNavigator';
import { ComplianceCalculators } from './components/ComplianceCalculators';
import { SetbackVisualizer } from './components/SetbackVisualizer';
import { ZoningMatrixExplorer } from './components/ZoningMatrixExplorer';
import { FormsAndAppendices } from './components/FormsAndAppendices';
import { AiAssistant } from './components/AiAssistant';
import { DOCUMENT_METADATA } from './data/byelawsData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('audit');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('up_byelaws_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('up_byelaws_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('up_byelaws_theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark((prev) => !prev);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-150">
      {/* Top Header & Search */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isDark={isDark}
        onToggleTheme={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'audit' && <ComplianceAuditEngine />}

        {activeTab === 'maps' && <MapServerExplorer />}

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
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto py-6 text-xs text-slate-500 dark:text-slate-400">
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
