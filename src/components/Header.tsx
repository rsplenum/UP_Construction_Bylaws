import React from 'react';
import {
  BookOpen,
  Calculator,
  Compass,
  MapPin,
  FileCheck2,
  Bot,
  Search,
  ShieldCheck,
  Globe,
  CheckSquare,
  Sun,
  Moon
} from 'lucide-react';
import { DOCUMENT_METADATA } from '../data/byelawsData';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  isDark = false,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'audit', label: 'Cross-Rule Compliance Audit', icon: CheckSquare, badge: 'New' },
    { id: 'maps', label: 'UP GIS Map Servers & MP 2031', icon: Globe, badge: '22 DAs' },
    { id: 'navigator', label: 'Byelaws Navigator (18 Ch)', icon: BookOpen },
    { id: 'calculators', label: 'FAR & Fee Calculators', icon: Calculator },
    { id: 'visualizer', label: '2D Setback Visualizer', icon: Compass },
    { id: 'zoning', label: 'Zoning & Master Plans', icon: MapPin },
    { id: 'forms', label: 'Statutory Forms & SDBR', icon: FileCheck2 },
    { id: 'ai-assistant', label: 'AI Regulatory Assistant', icon: Bot },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xl shadow-lg border border-emerald-400/30">
              UP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  UP Building Byelaws 2025
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                  {DOCUMENT_METADATA.version} • Ingested
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {DOCUMENT_METADATA.department} • 224 Pages Ingested
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search byelaws, clauses, setbacks, FAR..."
                className="w-full bg-slate-800/90 text-sm text-white placeholder-slate-400 pl-9 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs bg-slate-700 hover:bg-slate-600 px-1.5 py-0.5 rounded text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="hidden sm:flex items-center space-x-1 text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-600/30 px-3 py-2 rounded-lg">
              <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" />
              <span>Full 224-Page Code</span>
            </div>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-300" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
