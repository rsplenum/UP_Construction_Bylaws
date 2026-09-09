import React, { useState } from 'react';
import { AlertTriangle, Check, ChevronRight, Info, Wand2, XCircle } from 'lucide-react';
import { Assessment, Finding, FindingStatus, FindingTopic, TOPIC_LABELS } from '../domain/findings';
import { useProject } from '../context/ProjectContext';

const STATUS: Record<FindingStatus, { icon: typeof Check; ring: string; text: string; order: number }> = {
  blocked:   { icon: XCircle,       ring: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',       text: 'text-rose-700 dark:text-rose-300',       order: 0 },
  attention: { icon: AlertTriangle, ring: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',   text: 'text-amber-800 dark:text-amber-300',    order: 1 },
  info:      { icon: Info,          ring: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',           text: 'text-sky-800 dark:text-sky-300',        order: 2 },
  ok:        { icon: Check,         ring: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300', text: 'text-emerald-800 dark:text-emerald-300', order: 3 },
};

interface VerdictPanelProps {
  assessment: Assessment;
  onHoverFinding?: (finding: Finding | null) => void;
}

/**
 * Everything the byelaws say about this project, ranked by whether it stops you.
 *
 * The nine tabs of the previous version each rendered one chapter of the rulebook and
 * left the reader to assemble an answer. This renders the answer, and reveals the rule
 * behind any line on demand.
 */
export const VerdictPanel: React.FC<VerdictPanelProps> = ({ assessment, onHoverFinding }) => {
  const { project, patch } = useProject();
  const simple = project.mode === 'simple';
  const [openId, setOpenId] = useState<string | null>(null);
  const [showSettled, setShowSettled] = useState(false);

  const sorted = [...assessment.findings].sort(
    (a, b) => STATUS[a.status].order - STATUS[b.status].order,
  );
  const needsWork = sorted.filter((f) => f.status === 'blocked' || f.status === 'attention');
  const settled = sorted.filter((f) => f.status === 'ok' || f.status === 'info');
  // With nothing outstanding there is no reason to hide the passing checks behind a
  // toggle — the empty column reads as though the app did nothing.
  const nothingOutstanding = needsWork.length === 0;
  const visible = showSettled || nothingOutstanding ? sorted : needsWork;

  const grouped = visible.reduce<Partial<Record<FindingTopic, Finding[]>>>((acc, f) => {
    (acc[f.topic] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* The answer */}
      <div
        className={`border-b p-5 ${
          assessment.blocked > 0
            ? 'border-rose-200 bg-rose-50 dark:border-rose-500/25 dark:bg-rose-950/30'
            : assessment.attention > 0
              ? 'border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-950/30'
              : 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-950/30'
        }`}
      >
        <p
          className={`text-[15px] font-semibold leading-snug ${
            assessment.blocked > 0
              ? 'text-rose-900 dark:text-rose-100'
              : assessment.attention > 0
                ? 'text-amber-900 dark:text-amber-100'
                : 'text-emerald-900 dark:text-emerald-100'
          }`}
        >
          {assessment.headline}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-700 dark:text-slate-300">{assessment.subhead}</p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium">
          {assessment.blocked > 0 && <span className="text-rose-700 dark:text-rose-300">{assessment.blocked} blocking</span>}
          {assessment.attention > 0 && <span className="text-amber-800 dark:text-amber-300">{assessment.attention} to settle</span>}
          <span className="text-emerald-800 dark:text-emerald-300">{assessment.ok} clear</span>
        </div>
      </div>

      {/* The findings */}
      <div className="flex-1 overflow-y-auto">
        {nothingOutstanding && (
          <p className="border-b border-slate-100 px-5 py-3 text-[12px] text-slate-700 dark:border-white/[0.06] dark:text-slate-300">
            Nothing is outstanding. Here is everything that was checked.
          </p>
        )}

        {(Object.keys(grouped) as FindingTopic[]).map((topic) => (
          <section key={topic}>
            <h2 className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 backdrop-blur dark:border-white/10 dark:bg-[#161617]/95 dark:text-slate-400">
              {TOPIC_LABELS[topic]}
            </h2>
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {grouped[topic]!.map((finding) => {
                const style = STATUS[finding.status];
                const Icon = style.icon;
                const isOpen = openId === finding.id;
                return (
                  <li
                    key={finding.id}
                    onMouseEnter={() => onHoverFinding?.(finding)}
                    onMouseLeave={() => onHoverFinding?.(null)}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : finding.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                    >
                      <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${style.ring}`}>
                        <Icon className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-medium leading-snug text-slate-900 dark:text-white">
                          {finding.headline}
                        </span>
                        {finding.money && (
                          <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${style.ring}`}>
                            {finding.money.label}: ₹{Math.round(finding.money.amount).toLocaleString('en-IN')}
                          </span>
                        )}
                        {finding.nonNegotiable && (
                          <span className="ml-1.5 mt-1 inline-block rounded bg-rose-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                            cannot be bought off
                          </span>
                        )}
                      </span>
                      <ChevronRight
                        className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        aria-hidden="true"
                      />
                    </button>

                    {isOpen && (
                      <div className="space-y-2.5 bg-slate-50 px-5 pb-4 pt-1 dark:bg-white/[0.03]">
                        {!simple && (
                          <p className="text-[12px] leading-relaxed text-slate-700 dark:text-slate-300">{finding.detail}</p>
                        )}
                        {(finding.required || finding.proposed) && (
                          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11.5px]">
                            {finding.required && (
                              <>
                                <dt className="font-semibold text-slate-600 dark:text-slate-400">Required</dt>
                                <dd className="tabular-nums text-slate-900 dark:text-white">{finding.required}</dd>
                              </>
                            )}
                            {finding.proposed && (
                              <>
                                <dt className="font-semibold text-slate-600 dark:text-slate-400">Yours</dt>
                                <dd className="tabular-nums text-slate-900 dark:text-white">{finding.proposed}</dd>
                              </>
                            )}
                          </dl>
                        )}
                        {finding.working && !simple && (
                          <p className="rounded bg-white px-2.5 py-2 font-mono text-[10.5px] leading-relaxed text-slate-700 dark:bg-black/30 dark:text-slate-300">
                            {finding.working}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {finding.fix && (
                            <button
                              type="button"
                              onClick={() => patch(finding.fix!.patch)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                            >
                              <Wand2 className="h-3 w-3" aria-hidden="true" />
                              {finding.fix.label}
                            </button>
                          )}
                          {finding.clause && (
                            <span className="font-mono text-[10.5px] text-slate-600 dark:text-slate-400">{finding.clause}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {settled.length > 0 && !nothingOutstanding && (
        <button
          type="button"
          onClick={() => setShowSettled((v) => !v)}
          className="border-t border-slate-200 px-5 py-2.5 text-left text-[11.5px] font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.04]"
        >
          {showSettled ? 'Hide' : 'Show'} the {settled.length} checks that already pass
        </button>
      )}
    </div>
  );
};
