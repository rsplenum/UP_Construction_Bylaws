import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  keywords?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}

/**
 * The ⌘K affordance the header advertised but never implemented.
 *
 * Ranks by prefix match first, then substring, so typing "far" surfaces the FAR engine
 * ahead of anything that merely mentions it.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, items }) => {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items
      .map((item) => {
        const haystack = `${item.label} ${item.hint ?? ''} ${item.keywords ?? ''}`.toLowerCase();
        const label = item.label.toLowerCase();
        let score = -1;
        if (label.startsWith(q)) score = 0;
        else if (label.includes(q)) score = 1;
        else if (haystack.includes(q)) score = 2;
        else if (q.split(/\s+/).every((t) => haystack.includes(t))) score = 3;
        return { item, score };
      })
      .filter((r) => r.score >= 0)
      .sort((a, b) => a.score - b.score)
      .map((r) => r.item);
  }, [items, query]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  const runAt = (index: number) => {
    const item = results[index];
    if (!item) return;
    onClose();
    item.run();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/[0.12] dark:bg-[#1d1d1f]/95"
      >
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 dark:border-white/[0.08]">
          <Search className="h-4 w-4 flex-shrink-0 text-slate-600 dark:text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            aria-label="Search tools and rules"
              value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.preventDefault(); onClose(); }
              else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); runAt(cursor); }
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={results[cursor] ? `command-${results[cursor].id}` : undefined}
            placeholder="Jump to a tool, rule or calculation…"
            className="h-14 w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500"
          />
          <kbd className="hidden flex-shrink-0 rounded border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 sm:block dark:border-white/10 dark:text-slate-400">
            esc
          </kbd>
        </div>

        <div ref={listRef} id="command-results" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-slate-600 dark:text-slate-400">No matches for “{query}”.</p>
          ) : (
            results.map((item, index) => (
              <button
                key={item.id}
                id={`command-${item.id}`}
                role="option"
                aria-selected={index === cursor}
                data-active={index === cursor}
                onMouseEnter={() => setCursor(index)}
                onClick={() => runAt(index)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  index === cursor ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{item.label}</span>
                  {item.hint && <span className="block truncate text-[10.5px] text-slate-600 dark:text-slate-400">{item.hint}</span>}
                </span>
                <span className="flex flex-shrink-0 items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-400">
                    {item.group}
                  </span>
                  {index === cursor && <CornerDownLeft className="h-3 w-3 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
