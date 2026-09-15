import React, { useState } from 'react';
import { AlertTriangle, Check, ChevronRight, CircleDashed, Info, ShieldQuestion, Wand2, XCircle } from 'lucide-react';
import { Assessment, Finding, FindingStatus, FindingTopic, TOPIC_LABELS } from '../domain/findings';
import { InputId, describeAnswer, getInput } from '../domain/inputs';
import { Provenance, Sensitivity } from '../domain/sensitivity';
import {
  CHALLENGE_KIND_BLURB,
  CHALLENGE_KIND_LABEL,
  CONFIDENCE_LABEL,
  ChallengeKind,
} from '../domain/rules/schema';
import { useProject } from '../context/ProjectContext';

const STATUS: Record<FindingStatus, { icon: typeof Check; ring: string; text: string; order: number }> = {
  blocked:   { icon: XCircle,       ring: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',       text: 'text-rose-700 dark:text-rose-300',       order: 0 },
  attention: { icon: AlertTriangle, ring: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',   text: 'text-amber-800 dark:text-amber-300',    order: 1 },
  info:      { icon: Info,          ring: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',           text: 'text-sky-800 dark:text-sky-300',        order: 2 },
  ok:        { icon: Check,         ring: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300', text: 'text-emerald-800 dark:text-emerald-300', order: 3 },
};

/**
 * How a caveat looks. Every one of these used to be a violet "rule disputed" pill on the
 * collapsed row — twelve of them on a plain house — which read as twelve alarms and so
 * read as none. Twenty-seven of thirty-eight rules carry an open challenge, and that is
 * honest, but a warning that fires on almost every line carries no information.
 *
 * So the row now wears a quiet marker naming the kind of doubt, in the body text colour,
 * and the substance moves into the opened detail where a reader who wants it will look.
 */
const CAVEAT: Record<ChallengeKind, { chip: string; box: string; heading: string }> = {
  ambiguity: {
    chip: 'text-violet-700 dark:text-violet-300',
    box: 'border-violet-200 bg-violet-50/70 dark:border-violet-500/25 dark:bg-violet-950/25',
    heading: 'The gazette admits two readings',
  },
  needs_a_fact: {
    chip: 'text-sky-700 dark:text-sky-300',
    box: 'border-sky-200 bg-sky-50/70 dark:border-sky-500/25 dark:bg-sky-950/25',
    heading: 'This rests on a fact no drawing shows',
  },
  source_gap: {
    chip: 'text-amber-700 dark:text-amber-300',
    box: 'border-amber-200 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-950/25',
    heading: 'The gazette does not state this case',
  },
  not_modelled: {
    chip: 'text-slate-600 dark:text-slate-400',
    box: 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]',
    heading: 'This engine does not cover this case',
  },
};

const KIND_ORDER: readonly ChallengeKind[] = ['source_gap', 'needs_a_fact', 'ambiguity', 'not_modelled'];

interface VerdictPanelProps {
  assessment: Assessment;
  sensitivity: Sensitivity;
  provenance: Provenance;
  onHoverFinding?: (finding: Finding | null) => void;
  /** Send the cursor to a question in the left panel. */
  onAsk?: (id: InputId) => void;
}

/**
 * Everything the byelaws say about this project, ranked by whether it stops you.
 *
 * The nine tabs of the previous version each rendered one chapter of the rulebook and
 * left the reader to assemble an answer. This renders the answer, and reveals the rule
 * behind any line on demand.
 */
export const VerdictPanel: React.FC<VerdictPanelProps> = ({
  assessment, sensitivity, provenance, onHoverFinding, onAsk,
}) => {
  const { project, patch, affirm } = useProject();
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

  // Count the distinct doubts, not the lines they touch: one challenge attached to three
  // findings is one thing for the reader to know, not three.
  const caveats = (() => {
    const byKind = new Map<ChallengeKind, Set<string>>();
    for (const f of assessment.findings) {
      if (!f.dispute) continue;
      (byKind.get(f.dispute.kind) ?? byKind.set(f.dispute.kind, new Set()).get(f.dispute.kind)!)
        .add(f.dispute.id);
    }
    const PHRASE: Record<ChallengeKind, (n: number) => string> = {
      source_gap: (n) => `${n} where the gazette is silent`,
      needs_a_fact: (n) => `${n} resting on a fact only you can confirm`,
      ambiguity: (n) => `${n} where a clause reads two ways`,
      not_modelled: (n) => `${n} this engine does not cover`,
    };
    const parts: string[] = [];
    let total = 0;
    for (const kind of KIND_ORDER) {
      const n = byKind.get(kind)?.size ?? 0;
      if (n === 0) continue;
      total += n;
      parts.push(PHRASE[kind](n));
    }
    return { total, parts };
  })();

  /**
   * The answers a line is standing on that nobody gave it.
   *
   * Only the ones that can flip this finding's status count: a caveat that fires on every
   * line is the same as none, and an assumption that merely reworded a sentence is not
   * something to warn a reader about. Filtered to assumptions, because an answer the user
   * gave is theirs to trust and needs no flag.
   */
  const assumedSet = new Set<InputId>(provenance.assumed);
  const restsOn = (findingId: string): InputId[] =>
    (sensitivity.flippedBy[findingId] ?? []).filter((id) => assumedSet.has(id));

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

        {caveats.total > 0 && (
          <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] leading-snug text-slate-700 dark:bg-black/25 dark:text-slate-300">
            <ShieldQuestion className="mt-px h-3 w-3 flex-shrink-0" aria-hidden="true" />
            <span>
              {caveats.total === 1 ? 'One answer carries a caveat' : `${caveats.total} answers carry a caveat`}
              {': '}
              {caveats.parts.join(', ')}. Open a line to read it.
            </span>
          </p>
        )}

        {/*
          * Where this verdict came from.
          *
          * Simple mode asked six questions and computed from twenty-four, and said nothing
          * about the other eighteen. The bottom line looked exactly as firm either way, so
          * a reader had no way to tell a verdict built from their drawing from one built
          * from the app's furniture. This line says which it is, in the same box as the
          * answer, and goes to the questions that are still the app's.
          */}
        {provenance.assumed.length === 0 ? (
          <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] leading-snug text-slate-700 dark:bg-black/25 dark:text-slate-300">
            <Check className="mt-px h-3 w-3 flex-shrink-0" aria-hidden="true" />
            <span>Built from {provenance.answered.length} answers, all of them yours.</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => onAsk?.(provenance.decisive[0] ?? provenance.assumed[0])}
            className="mt-2.5 flex w-full items-start gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-left text-[11px] leading-snug text-slate-700 transition-colors hover:bg-white dark:bg-black/25 dark:text-slate-300 dark:hover:bg-black/40"
          >
            <CircleDashed className="mt-px h-3 w-3 flex-shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            <span>
              {provenance.answered.length === 0
                ? `Built entirely from values the app supplied — ${provenance.assumed.length} of them`
                : `Built from ${provenance.answered.length} ${provenance.answered.length === 1 ? 'answer' : 'answers'} you gave`
                  + ` and ${provenance.assumed.length} the app supplied`}
              {provenance.decisive.length > 0
                ? `, ${provenance.decisive.length} of which could change this verdict`
                : ''}
              . <span className="font-semibold underline decoration-dotted underline-offset-2">Go through them</span>
            </span>
          </button>
        )}

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
                const resting = restsOn(finding.id);
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
                        {finding.dispute && (
                          <span
                            className={`ml-1.5 mt-1 inline-flex items-center gap-1 text-[10.5px] font-medium ${CAVEAT[finding.dispute.kind].chip}`}
                          >
                            <ShieldQuestion className="h-2.5 w-2.5" aria-hidden="true" />
                            {CHALLENGE_KIND_LABEL[finding.dispute.kind]}
                          </span>
                        )}
                        {resting.length > 0 && (
                          <span className="ml-1.5 mt-1 inline-flex items-center gap-1 text-[10.5px] font-medium text-amber-800 dark:text-amber-400">
                            <CircleDashed className="h-2.5 w-2.5" aria-hidden="true" />
                            {resting.length === 1
                              ? 'rests on an assumption'
                              : `rests on ${resting.length} assumptions`}
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
                        {finding.dispute && (
                          <div className={`rounded-lg border p-2.5 ${CAVEAT[finding.dispute.kind].box}`}>
                            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-slate-100">
                              <ShieldQuestion className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                              {CAVEAT[finding.dispute.kind].heading}
                            </p>
                            <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                              {CHALLENGE_KIND_BLURB[finding.dispute.kind]}
                            </p>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                              {finding.dispute.summary}
                            </p>
                            {finding.dispute.divergence && (
                              // Some rules state the gap as a quantity ("0.5 FAR"), others as a
                              // worked case. A neutral lead-in carries both without reading as
                              // "differ by A 1,000 m² commercial plot:".
                              <p className="mt-1 text-[11px] font-semibold text-slate-900 dark:text-slate-100">
                                How far apart: {finding.dispute.divergence.replace(/\.+$/, '')}.
                              </p>
                            )}
                            <p className="mt-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {finding.dispute.id} · docs/VERIFICATION-LOG.md
                            </p>
                          </div>
                        )}

                        {resting.length > 0 && (
                          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-2.5 dark:border-amber-500/30 dark:bg-amber-500/[0.07]">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-slate-100">
                              <CircleDashed className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                              This rests on {resting.length === 1 ? 'an answer' : 'answers'} you have not given
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                              The app supplied {resting.length === 1 ? 'it' : 'them'}, and a different
                              {resting.length === 1 ? ' answer' : ' set of answers'} would change what this line says.
                            </p>
                            <ul className="mt-2 space-y-1.5">
                              {resting.map((inputId) => (
                                <li key={inputId} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                                  <span className="text-slate-700 dark:text-slate-300">
                                    {getInput(inputId).label}:{' '}
                                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                                      {describeAnswer(project, inputId)}
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onAsk?.(inputId)}
                                    className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-white dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
                                  >
                                    Change it
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => affirm([inputId])}
                                    className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-white dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
                                  >
                                    That's right
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {finding.confidence && (
                          <p className="text-[10.5px] text-slate-600 dark:text-slate-400">
                            Source: {CONFIDENCE_LABEL[finding.confidence]}
                            {finding.rule ? ` · ${finding.rule}` : ''}
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
