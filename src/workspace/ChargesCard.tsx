import React, { useState } from 'react';
import { ChevronRight, IndianRupee } from 'lucide-react';
import type { ChargeLedger, ChargeLine } from '../domain/findings';

const inr = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * Compact Indian notation, because the sums get long. ₹6,30,00,000 is six lines of
 * ledger and one glance of "₹6.3 Cr", and a plot decision is made at the glance.
 */
function short(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (abs >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2).replace(/\.00$/, '')} L`;
  return inr(n);
}

const GROUP_HEADING: Record<ChargeLine['group'], string> = {
  entitlement: 'Yours by right',
  density: 'Density you are buying',
  charge: 'Statutory charges',
};

interface ChargesCardProps {
  ledger: ChargeLedger;
}

/**
 * What the government charges for this building, itemised.
 *
 * The engine could compute every one of these already, but they only surfaced one at a
 * time, attached to whichever finding raised them, with the sum reduced to half a
 * sentence: "About ₹9,00,000 in charges." Anyone deciding whether to buy a plot is
 * deciding on this number, so it belongs beside the drawing rather than scattered
 * through a list of findings.
 *
 * Every figure here is read from the assessment, which computed it once for the finding
 * that raised it. There is no second calculation to drift from the first.
 */
export const ChargesCard: React.FC<ChargesCardProps> = ({ ledger }) => {
  const [openLine, setOpenLine] = useState<string | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);

  if (ledger.lines.length === 0) return null;

  const payable = ledger.lines.filter((l) => !l.free && !l.perUnit && !l.supersededBy && l.amount > 0);
  const groups = (['entitlement', 'density', 'charge'] as const)
    .map((group) => ({ group, lines: ledger.lines.filter((l) => l.group === group) }))
    .filter((g) => g.lines.length > 0);

  return (
    <section
      className="mt-6 w-full max-w-[560px] overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#161617]"
      aria-label="Government charges"
    >
      <header className="flex items-baseline justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <h2 className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <IndianRupee className="h-3 w-3" aria-hidden="true" />
          What you pay the government
        </h2>
        <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
          {ledger.total > 0 ? short(ledger.total) : 'Nothing'}
        </p>
      </header>

      <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {groups.map(({ group, lines }) => (
          <div key={group}>
            <p className="bg-slate-50 px-4 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
              {GROUP_HEADING[group]}
            </p>
            {lines.map((line) => {
              const isOpen = openLine === line.label;
              return (
                <div key={line.label}>
                  <button
                    type="button"
                    onClick={() => setOpenLine(isOpen ? null : line.label)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start gap-3 px-4 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                  >
                    <ChevronRight
                      className={`mt-0.5 h-3 w-3 flex-shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[12px] font-medium ${
                          line.supersededBy
                            ? 'text-slate-500 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {line.label}
                      </span>
                      {line.basis && (
                        <span className="block text-[10.5px] leading-snug text-slate-600 dark:text-slate-400">
                          {line.basis}
                        </span>
                      )}
                      {line.supersededBy && (
                        <span className="mt-0.5 block text-[10.5px] font-medium leading-snug text-emerald-700 dark:text-emerald-400">
                          The other route for the same floor area — {line.supersededBy} is cheaper,
                          so this is not counted
                        </span>
                      )}
                    </span>
                    <span
                      className={`flex-shrink-0 text-[12px] font-semibold tabular-nums ${
                        line.free
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : line.supersededBy
                            ? 'text-slate-500 line-through decoration-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {line.free ? 'nil' : inr(line.amount)}
                      {line.perUnit && (
                        <span className="ml-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                          /unit
                        </span>
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="bg-slate-50 px-4 pb-3 pl-10 pt-0.5 dark:bg-white/[0.03]">
                      {line.working && (
                        <p className="rounded bg-white px-2.5 py-2 font-mono text-[10px] leading-relaxed text-slate-700 dark:bg-black/30 dark:text-slate-300">
                          {line.working}
                        </p>
                      )}
                      <p className="mt-1.5 text-[10px] text-slate-600 dark:text-slate-400">{line.clause}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <footer className="border-t border-slate-200 px-4 py-2.5 dark:border-white/10">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold text-slate-900 dark:text-white">
            {payable.length === 0
              ? 'Nothing is payable at these figures'
              : `Total of ${payable.length} charge${payable.length === 1 ? '' : 's'}`}
          </span>
          <span className="text-[13px] font-bold tabular-nums text-slate-900 dark:text-white">
            {inr(ledger.total)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowExcluded((v) => !v)}
          aria-expanded={showExcluded}
          className="mt-1 text-[10px] font-medium text-slate-600 underline decoration-dotted underline-offset-2 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          {showExcluded ? 'Hide what this leaves out' : 'This is not the whole cost of approval'}
        </button>
        {showExcluded && (
          <ul className="mt-1.5 space-y-0.5 text-[10px] leading-snug text-slate-600 dark:text-slate-400">
            {ledger.excludes.map((item) => (
              <li key={item} className="flex gap-1.5">
                <span aria-hidden="true">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </section>
  );
};
