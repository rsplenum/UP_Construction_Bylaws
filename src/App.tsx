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
import { StatutoryRationaleGuide } from './components/StatutoryRationaleGuide';
import { DOCUMENT_METADATA } from './data/byelawsData';
import { ToastProvider } from './context/ToastContext';
import { Shield, Sparkles, ExternalLink, Globe, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('maps'); // Default to the newly revamped Spatial GIS & Bhuvan tab
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
    <ToastProvider>
      <div className="min-h-screen bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200">
        {/* Apple Sleek Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDark={isDark}
          onToggleTheme={toggleDarkMode}
        />

        {/* Apple Sub-Bar Notification / Gazette Banner */}
        <div className="bg-white/60 dark:bg-[#161617]/60 border-b border-black/[0.04] dark:border-white/[0.06] backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-800 dark:text-slate-200">Official Gazette Enacted:</span>
              <span>Uttar Pradesh Building Construction and Development Byelaws 2025</span>
            </div>

            <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>ISRO Bhuvan & 22 Authorities</span>
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Appendix-15 GIS Aligned
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Stage */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'maps' && <MapServerExplorer />}

          {activeTab === 'audit' && <ComplianceAuditEngine />}

          {activeTab === 'navigator' && (
            <ByelawsNavigator
              searchQuery={searchQuery}
              onSelectCalculator={(type) => setActiveTab('calculators')}
            />
          )}

          {activeTab === 'calculators' && <ComplianceCalculators />}

          {activeTab === 'visualizer' && (
            <SetbackVisualizer onOpenRationale={() => setActiveTab('rationale')} />
          )}

          {activeTab === 'rationale' && <StatutoryRationaleGuide />}

          {activeTab === 'zoning' && <ZoningMatrixExplorer />}

          {activeTab === 'forms' && <FormsAndAppendices />}

          {activeTab === 'ai-assistant' && <AiAssistant />}
        </main>

        {/* Apple-style Refined Minimalist Footer */}
        <footer className="bg-white/80 dark:bg-[#161617]/80 border-t border-black/[0.06] dark:border-white/[0.08] mt-auto py-8 text-xs text-slate-500 dark:text-slate-400 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-black/[0.04] dark:border-white/[0.06]">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    UP
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    UP Building Byelaws 2025
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Statutory spatial compliance verification, Master Plan 2031 geoportals, setback engine, and GIS analysis across 22 Development Authorities of Uttar Pradesh.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-2">
                  Spatial Portals
                </h4>
                <ul className="space-y-1.5 text-[11px]">
                  <li>
                    <a
                      href="https://bhuvan-app1.nrsc.gov.in"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
                    >
                      <span>ISRO Bhuvan Urban GIS</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://rsacup.org.in"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
                    >
                      <span>RSAC-UP Spatial Data</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://niveshmitra.up.nic.in"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
                    >
                      <span>UP OBPAS Single Window</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-2">
                  Statutory References
                </h4>
                <ul className="space-y-1.5 text-[11px]">
                  <li>UP Urban Planning & Dev Act, 1973</li>
                  <li>National Building Code of India (NBC 2016)</li>
                  <li>Supreme Court River Ganga 200m Orders</li>
                  <li>Taj Trapezium Zone (TTZ) Guidelines</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-2">
                  Enforcement & Gazette
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Notified by Housing & Urban Planning Department, Government of Uttar Pradesh under the UP Urban Planning and Development Act, 1973.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 dark:text-slate-500">
              <div>
                Copyright &copy; 2025 Government of Uttar Pradesh &bull; All Rights Reserved.
              </div>
              <div className="flex items-center space-x-4">
                <span>Apple-Grade Spatial Intelligence</span>
                <span>•</span>
                <span>v2.5.0 Production</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
