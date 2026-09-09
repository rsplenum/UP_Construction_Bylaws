import React, { useState } from 'react';
import { Command, Download, Menu, Monitor, Moon, Search, Sun, X } from 'lucide-react';
import { TABS, TabId } from '../navigation';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import { OCCUPANCY_LABELS } from '../domain/project';

interface HeaderProps {
  activeTab: TabId;
  onNavigate: (tab: TabId) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigate, searchQuery, setSearchQuery, onOpenPalette }) => {
  const { preference, resolved, cycle } = useTheme();
  const { project } = useProject();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ThemeIcon = preference === 'system' ? Monitor : resolved === 'dark' ? Sun : Moon;
  const themeLabel =
    preference === 'system' ? 'Theme: match system' : preference === 'dark' ? 'Theme: dark' : 'Theme: light';

  const handleNavigate = (tab: TabId) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full print:hidden">
      <div className="apple-glass border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleNavigate('audit')}
              className="flex flex-shrink-0 items-center gap-3 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-sm font-bold text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)]">
                UP
              </span>
              <span className="hidden sm:block">
                <span className="flex items-center gap-2">
                  <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                    Building Byelaws
                  </span>
                  <span className="rounded-full border border-slate-200/60 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-tight text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                    2025
                  </span>
                </span>
                <span className="block text-[11px] tracking-tight text-slate-600 dark:text-slate-400">
                  Housing &amp; Urban Planning Dept, Uttar Pradesh
                </span>
              </span>
            </button>

            {/* One search box for both breakpoints; on small screens it opens the palette. */}
            <div className="mx-2 hidden max-w-md flex-1 md:block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                <label htmlFor="global-search" className="sr-only">
                  Search the byelaws text
                </label>
                <input
                  id="global-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clauses, tables and definitions…"
                  className="h-9 w-full rounded-full border border-black/[0.06] bg-slate-100/80 pl-10 pr-20 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-emerald-500/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15 dark:border-white/[0.08] dark:bg-white/[0.08] dark:text-white dark:placeholder-slate-500 dark:focus:bg-black/90"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-300 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenPalette}
                    title="Open the command palette"
                    className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-full px-1.5 py-1 font-mono text-[10px] text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-white/10"
                  >
                    <Command className="h-3 w-3" aria-hidden="true" />K
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/UP_Building_Byelaws_2025.pdf"
                download="UP_Building_Construction_and_Development_Byelaws_2025.pdf"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-500/20 active:scale-95 dark:bg-emerald-400/10 dark:text-emerald-300"
                title="Download Official Gazetted UP Building Byelaws 2025 PDF (TMPR8)"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Gazette PDF</span>
              </a>

              {/* Live project chip: the site being assessed, visible from every tab. */}
              <button
                type="button"
                onClick={() => handleNavigate('audit')}
                className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/15 lg:flex dark:bg-emerald-400/10 dark:text-emerald-300"
                title="The project every tab is working from"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="font-semibold tabular-nums">{project.plotArea} m²</span>
                <span className="text-emerald-700 dark:text-emerald-400/70">
                  {OCCUPANCY_LABELS[project.occupancy]}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenPalette}
                aria-label="Search and jump to a tool"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] bg-slate-100 text-slate-600 transition-all active:scale-95 hover:bg-slate-200 md:hidden dark:border-white/[0.08] dark:bg-white/[0.08] dark:text-slate-300"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={cycle}
                title={themeLabel}
                aria-label={themeLabel}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] bg-slate-100 text-slate-600 transition-all active:scale-95 hover:bg-slate-200 dark:border-white/[0.08] dark:bg-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.14]"
              >
                <ThemeIcon className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav"
                aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] bg-slate-100 text-slate-600 transition-all active:scale-95 lg:hidden dark:border-white/[0.08] dark:bg-white/[0.08] dark:text-slate-300"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop tabs */}
        <div className="relative hidden border-t border-black/[0.04] bg-white/60 backdrop-blur-md lg:block dark:border-white/[0.06] dark:bg-black/40">
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <nav role="tablist" aria-label="Portal sections" className="flex items-center gap-1.5 overflow-x-auto px-2 py-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleNavigate(tab.id)}
                    title={tab.description}
                    className={`relative flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                      isActive
                        ? 'bg-slate-900 font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:bg-white dark:text-slate-950'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? '' : 'text-slate-600 dark:text-slate-400'}`} aria-hidden="true" />
                    {tab.label}
                    {tab.badge && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-900'
                            : tab.highlight
                              ? 'bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile menu: a real list with descriptions, not a strip of pills to swipe. */}
        {mobileMenuOpen && (
          <div id="mobile-nav" className="border-t border-black/[0.04] bg-white/95 backdrop-blur-xl lg:hidden dark:border-white/[0.06] dark:bg-black/95">
            <nav aria-label="Portal sections" className="mx-auto grid max-w-7xl gap-1 px-4 py-3 sm:grid-cols-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavigate(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-start gap-3 rounded-xl p-3 text-left transition-colors ${
                      isActive ? 'bg-emerald-500/10' : 'hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className={`block text-xs font-semibold ${isActive ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                        {tab.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                        {tab.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="border-b border-black/[0.04] bg-white/60 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#161617]/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 px-4 py-2 text-[11px] sm:flex-row sm:px-6 lg:px-8">
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="font-medium text-slate-800 dark:text-slate-200">Gazette enacted:</span>
            UP Building Construction &amp; Development Byelaws 2025
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Decision-support tool — verify against the gazette before submission
          </p>
        </div>
      </div>
    </header>
  );
};
