import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  Compass,
  MapPin,
  FileCheck2,
  Bot,
  Search,
  Globe,
  CheckSquare,
  Sun,
  Moon,
  Sparkles,
  Command,
  ChevronRight
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navItems = [
    {
      id: 'maps',
      label: 'Spatial GIS & Bhuvan',
      icon: Globe,
      badge: '22 Authorities',
      highlight: true
    },
    {
      id: 'audit',
      label: 'Compliance Audit',
      icon: CheckSquare,
      badge: 'Live'
    },
    {
      id: 'navigator',
      label: 'Statutory Byelaws Code',
      icon: BookOpen
    },
    {
      id: 'calculators',
      label: 'FAR & Fee Engine',
      icon: Calculator
    },
    {
      id: 'visualizer',
      label: '2D Setbacks',
      icon: Compass,
      badge: 'Sec 32'
    },
    {
      id: 'rationale',
      label: 'Planning Rationale',
      icon: Sparkles,
      badge: 'NBC / IS'
    },
    {
      id: 'zoning',
      label: 'Zoning Matrix',
      icon: MapPin
    },
    {
      id: 'forms',
      label: 'Statutory Forms',
      icon: FileCheck2
    },
    {
      id: 'ai-assistant',
      label: 'AI Regulatory Copilot',
      icon: Bot
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* Top Apple Frosted Glass Header */}
      <div className="apple-glass border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo & Statutory Title */}
            <div className="flex items-center space-x-3.5 flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('maps')}>
              <div className="relative group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 dark:from-emerald-400 dark:to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_4px_16px_rgba(16,185,129,0.25)] transition-transform duration-200 group-hover:scale-105">
                  UP
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-black animate-pulse" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                    Uttar Pradesh Byelaws
                  </h1>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 font-mono tracking-tight">
                    2025 Code
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 tracking-tight flex items-center gap-1.5 hidden sm:flex">
                  <span>Housing & Urban Planning Dept</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Bhuvan & RSAC-UP Integrated</span>
                </p>
              </div>
            </div>

            {/* Apple Search Bar */}
            <div className="flex-1 max-w-md mx-2 hidden md:block">
              <div className={`relative transition-all duration-200 ${isSearchFocused ? 'scale-[1.01]' : ''}`}>
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  isSearchFocused ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search statutory rules, FAR slabs, setbacks, Section 3.2.2, GIS..."
                  className="w-full h-9 bg-slate-100/80 dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.12] focus:bg-white dark:focus:bg-black/90 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pl-10 pr-12 rounded-full border border-black/[0.06] dark:border-white/[0.08] focus:border-emerald-500/50 dark:focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-xs"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    Clear
                  </button>
                ) : (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono pointer-events-none">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Apple Theme Switcher */}
            <div className="flex items-center space-x-2">
              <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-semibold">22 Authorities Active</span>
              </div>

              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  title={isDark ? "Switch to Apple Light Theme" : "Switch to Apple Dark Theme"}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-600 dark:text-slate-300 border border-black/[0.06] dark:border-white/[0.08] transition-all active:scale-95"
                  aria-label="Toggle theme"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-90 duration-300" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-600 transition-transform rotate-0 hover:-rotate-12 duration-300" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Apple Segmented Navigation Pills Bar */}
        <div className="border-t border-black/[0.04] dark:border-white/[0.06] bg-white/60 dark:bg-black/40 backdrop-blur-md relative">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <nav className="flex space-x-1.5 py-2 overflow-x-auto scrollbar-none items-center px-2 scroll-smooth">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white dark:text-slate-950' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-900'
                            : item.highlight
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
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
        </div>
      </div>
    </header>
  );
};
