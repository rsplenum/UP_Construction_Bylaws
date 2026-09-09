import React, { useState } from 'react';
import { BookMarked, ChevronLeft, Monitor, Moon, Sun, X } from 'lucide-react';
import { REFERENCE_VIEWS, ViewId } from '../navigation';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/**
 * One line of chrome.
 *
 * The previous header carried a nine-item tab strip, a mobile menu duplicating it, a
 * search box and a command palette — navigation for an app that had nine destinations.
 * There is one destination now, so the header carries the identity, a way back to it,
 * and the reference shelf.
 */
export const Header: React.FC<HeaderProps> = ({ view, onNavigate, searchQuery, setSearchQuery }) => {
  const { preference, resolved, cycle } = useTheme();
  const [shelfOpen, setShelfOpen] = useState(false);

  const ThemeIcon = preference === 'system' ? Monitor : resolved === 'dark' ? Sun : Moon;
  const themeLabel =
    preference === 'system' ? 'Theme: match system' : preference === 'dark' ? 'Theme: dark' : 'Theme: light';
  const onWorkspace = view === 'workspace';
  const current = REFERENCE_VIEWS.find((v) => v.id === view);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/[0.07] bg-white/85 backdrop-blur-xl print:hidden dark:border-white/[0.08] dark:bg-[#161617]/85">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {!onWorkspace && (
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              className="flex items-center gap-1 rounded-full py-1 pl-1 pr-2.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('workspace')}
            className="flex min-w-0 items-center gap-2.5 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-[11px] font-bold text-white">
              UP
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold leading-tight text-slate-900 dark:text-white">
                {current ? current.label : 'Building Byelaws 2025'}
              </span>
              <span className="block truncate text-[10.5px] leading-tight text-slate-600 dark:text-slate-400">
                {current ? current.description : 'Uttar Pradesh compliance check'}
              </span>
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {view === 'navigator' && (
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search the byelaws text"
              placeholder="Search clauses…"
              className="hidden h-8 w-56 rounded-full border border-black/[0.07] bg-slate-100/80 px-3.5 text-[12.5px] text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:bg-white focus:outline-none sm:block dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
            />
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShelfOpen((o) => !o)}
              aria-expanded={shelfOpen}
              aria-controls="reference-shelf"
              className="flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-slate-100 px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-white/[0.08] dark:bg-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.14]"
            >
              {shelfOpen ? <X className="h-3.5 w-3.5" aria-hidden="true" /> : <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />}
              <span className="hidden sm:inline">Reference</span>
            </button>

            {shelfOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShelfOpen(false)} aria-hidden="true" />
                <div
                  id="reference-shelf"
                  className="absolute right-0 top-full z-20 mt-2 w-[19rem] overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-xl dark:border-white/[0.12] dark:bg-[#1d1d1f]"
                >
                  {REFERENCE_VIEWS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => { onNavigate(item.id); setShelfOpen(false); }}
                        aria-current={view === item.id ? 'page' : undefined}
                        className={`flex w-full items-start gap-3 p-3 text-left transition-colors ${
                          view === item.id ? 'bg-emerald-500/10' : 'hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block text-[12.5px] font-semibold text-slate-900 dark:text-white">{item.label}</span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={cycle}
            title={themeLabel}
            aria-label={themeLabel}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.07] bg-slate-100 text-slate-700 transition-all active:scale-95 hover:bg-slate-200 dark:border-white/[0.08] dark:bg-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.14]"
          >
            <ThemeIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};
