import React, { useMemo, useState } from 'react';
import { ChevronRight, RotateCcw, Undo2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { assessProject, type Finding } from '../domain/findings';
import { resolveRequiredSetbacks } from '../domain/setbacks';
import { getOccupancy } from '../domain/occupancy';
import { FRAMING_INPUTS, describeAnswer, getInput, type InputId } from '../domain/inputs';
import { analyse, provenanceOf } from '../domain/sensitivity';
import { InputControl } from './InputControl';
import { SitePlan } from './SitePlan';

/** True where the current value says the question is open rather than answering it. */
const isOpenQuestion = (answer: string): boolean =>
  /not looked|unknown|^—$|^$/i.test(answer.trim());

const inr = (n: number): string => {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2).replace(/\.00$/, '')} crore`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2).replace(/\.00$/, '')} lakh`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};
const m2 = (n: number): string => `${Math.round(n).toLocaleString('en-IN')} m²`;

/** A section that does not exist when it has nothing in it. */
const Drawer: React.FC<{
  title: string; count: string; tone?: 'plain' | 'money' | 'stop'; children: React.ReactNode;
}> = ({ title, count, tone = 'plain', children }) => {
  const [open, setOpen] = useState(false);
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#161617]">
      <button
        type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]"
      >
        <span className="flex-1 text-[13.5px] font-medium text-slate-900 dark:text-white">{title}</span>
        <span className={`text-[13px] tabular-nums ${
          tone === 'money' ? 'font-semibold text-slate-900 dark:text-white'
            : tone === 'stop' ? 'font-semibold text-rose-700 dark:text-rose-400'
              : 'text-slate-600 dark:text-slate-400'}`}
        >
          {count}
        </span>
        <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="border-t border-slate-200 px-4 pb-4 pt-3 dark:border-white/10">{children}</div>
      )}
    </section>
  );
};

/**
 * One answer, and what it rests on.
 *
 * The three-column version put the verdict in the smallest text on a screen carrying
 * eighteen findings, five semantic colours and a warning icon on almost every row, so
 * nothing read as more important than anything else. This asks the question, gives the
 * answer, and keeps everything else folded until it is asked for. A section with nothing
 * in it does not render at all — the commonest reason the old screen felt full was that
 * it had room set aside for problems this project did not have.
 */
export const Workspace: React.FC = () => {
  const { project, patch, affirm, reset, undo, canUndo, lastSavedLabel } = useProject();
  const [editing, setEditing] = useState(false);

  const assessment = useMemo(() => assessProject(project), [project]);
  const sensitivity = useMemo(() => analyse(project, assessment), [project, assessment]);
  const provenance = useMemo(() => provenanceOf(project, sensitivity), [project, sensitivity]);
  const required = useMemo(
    () => resolveRequiredSetbacks({
      occupancy: project.occupancy,
      plotArea: project.plotArea,
      buildingHeight: project.buildingHeight,
      isCornerPlot: project.isCornerPlot,
      roadWidth: project.roadWidth,
    }),
    [project],
  );

  const occupancy = getOccupancy(project.occupancy);
  const stops = assessment.findings.filter((f) => f.status === 'blocked');
  const todo = assessment.findings.filter((f) => f.status === 'attention');
  const over = assessment.proposedArea > assessment.permissibleArea;

  const verdict = stops.length > 0 ? 'stop' : over ? 'trim' : 'yes';
  const word = { yes: 'Yes.', trim: 'Yes, smaller.', stop: 'Not as drawn.' }[verdict];
  const tone = {
    yes: 'text-emerald-700 dark:text-emerald-400',
    trim: 'text-amber-700 dark:text-amber-400',
    stop: 'text-rose-700 dark:text-rose-400',
  }[verdict];
  const line = {
    yes: `You can build ${m2(assessment.permissibleArea)} here. You asked for ${m2(assessment.proposedArea)}.`,
    trim: `This plot allows ${m2(assessment.permissibleArea)}. You asked for ${m2(assessment.proposedArea)} — ${m2(assessment.proposedArea - assessment.permissibleArea)} too much.`,
    stop: stops[0]?.headline ?? '',
  }[verdict];

  // The five questions the summary sentence already shows, and lets you edit in place.
  const ON_SCREEN: readonly InputId[] = [
    ...FRAMING_INPUTS, 'roadWidth', 'proposedBuiltUpArea', 'buildingHeight',
  ];

  // The questions worth asking next are the ones the app is answering for you, out of
  // sight, that could still change the verdict. Anything already in the sentence above is
  // excluded: asking "What are you building?" directly beneath a line reading "A house for
  // one family" reads as the app not having heard you. Three at a time — a list of
  // fourteen is the wall this screen exists to remove.
  const ask = provenance.decisive.filter((id) => !ON_SCREEN.includes(id)).slice(0, 3);

  const findingList = (items: Finding[]) => (
    <ul className="flex flex-col gap-3">
      {items.map((f) => (
        <li key={f.id} className="border-l-2 border-slate-200 pl-3 dark:border-white/10">
          <p className="text-[13px] text-slate-900 dark:text-white">{f.headline}</p>
          {f.required && (
            <p className="mt-0.5 text-[11.5px] text-slate-600 dark:text-slate-400">
              Needs {f.required}{f.proposed ? ` · you have ${f.proposed}` : ''}
            </p>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mx-auto flex w-full max-w-[42rem] flex-1 flex-col gap-7 px-4 py-7 sm:px-6">
      {/* The project, read back as a sentence you recognise. */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <button
            type="button" onClick={() => setEditing((v) => !v)} aria-expanded={editing}
            className="flex flex-1 items-baseline justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[12.5px] text-slate-700 transition-colors hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
          >
            <span>
              {occupancy.plain} · {m2(project.plotArea)} plot · {project.roadWidth} m road ·{' '}
              {m2(project.proposedBuiltUpArea)} · {project.buildingHeight} m tall
            </span>
            <span className="flex-shrink-0 font-medium text-emerald-700 dark:text-emerald-400">
              {editing ? 'done' : 'change'}
            </span>
          </button>
          <button
            type="button" onClick={undo} disabled={!canUndo}
            title="Undo the last change" aria-label="Undo the last change"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-35 dark:text-slate-400 dark:hover:bg-white/10"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button" onClick={reset}
            title="Start again" aria-label="Start again"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {editing && (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 dark:border-white/10 dark:bg-[#161617]">
            {[...FRAMING_INPUTS, 'roadWidth', 'proposedBuiltUpArea', 'buildingHeight'].map((id) => (
              <InputControl key={id} id={id as InputId} />
            ))}
            <div className="sm:col-span-2 flex items-center justify-end gap-1.5 border-t border-slate-200 pt-3 dark:border-white/10">
              <span className="mr-auto text-[11px] text-slate-500 dark:text-slate-400">
                How much detail the answers carry
              </span>
              {([['simple', 'Plain'], ['advanced', 'Precise']] as const).map(([m, label]) => (
                <button
                  key={m} type="button" onClick={() => patch({ mode: m })}
                  aria-pressed={project.mode === m}
                  className={`rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors ${
                    project.mode === m
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* The answer. */}
      <section>
        <h2 className={`font-serif text-[clamp(2.75rem,10vw,4.25rem)] font-semibold leading-[1.03] tracking-[-0.022em] ${tone}`}>
          {word}
        </h2>
        <p className="mt-3 max-w-[32ch] font-serif text-[clamp(1.05rem,3.2vw,1.25rem)] leading-snug text-slate-700 dark:text-slate-300">
          {line}
        </p>
      </section>

      {/* A 14 x 23 m plot drawn to scale is taller than the viewport, which buries the
          answer above it. Bound the height and let the width follow. */}
      <div className="[&_svg]:mx-auto [&_svg]:max-h-[22rem] [&_svg]:w-auto">
        <SitePlan
          project={project}
          required={required}
          coveragePct={project.zonalCoverageCapPct > 0 ? project.zonalCoverageCapPct : null}
        />
      </div>

      {/* What the app is still answering for you, and could be wrong about. */}
      {ask.length > 0 && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/[0.07]">
          <h3 className="text-[12.5px] font-semibold text-emerald-900 dark:text-emerald-200">
            {ask.length === 1
              ? 'One answer could change this verdict'
              : `${ask.length} answers could change this verdict`}
          </h3>
          <p className="mt-0.5 text-[11.5px] leading-snug text-emerald-900/75 dark:text-emerald-200/75">
            The app has assumed these. Confirm or correct them and the verdict above is yours,
            not its guess.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {ask.map((id) => {
              const answer = describeAnswer(project, id);
              return (
                <div key={id} className="flex flex-col gap-1.5">
                  <InputControl id={id} />
                  {/* "I have not looked it up is right" is not an answer, so a value that
                      says the question is open gets no shortcut to confirming it. */}
                  {!isOpenQuestion(answer) && (
                    <button
                      type="button" onClick={() => affirm([id])}
                      className="self-start text-[11px] font-medium text-emerald-800 underline decoration-dotted underline-offset-2 dark:text-emerald-300"
                    >
                      {answer} is right — {getInput(id).label.toLowerCase()} confirmed
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-2">
        {assessment.ledger.total > 0 ? (
          <Drawer title="What you pay the government" count={inr(assessment.ledger.total)} tone="money">
            <ul className="flex flex-col gap-2">
              {assessment.ledger.lines.filter((l) => !l.supersededBy).map((l) => (
                <li key={l.label} className="flex justify-between gap-4 text-[13px] text-slate-800 dark:text-slate-200">
                  <span>{l.label}</span>
                  <span className="tabular-nums">
                    {l.free ? 'nothing' : inr(l.amount)}{l.perUnit ? ' each' : ''}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11.5px] text-slate-500 dark:text-slate-400">
              Not counting the sanction fee, connection charges or stamp duty.
            </p>
          </Drawer>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            Nothing to pay the government at these figures.
          </p>
        )}

        {stops.length > 0 && (
          <Drawer title="What stops you" count={String(stops.length)} tone="stop">
            {findingList(stops)}
          </Drawer>
        )}

        {todo.length > 0 && (
          <Drawer title="To settle before you apply" count={String(todo.length)}>
            {findingList(todo)}
          </Drawer>
        )}
      </div>

      <p className="border-t border-slate-200 pt-4 text-[11.5px] leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
        {provenance.assumed.length > 0 && (
          <>
            {provenance.assumed.length} of the figures behind this are the app&apos;s own, not
            yours.{' '}
          </>
        )}
        {assessment.disputedCount > 0
          ? `${assessment.disputedCount} answers rest on a clause that reads more than one way; the stricter reading is used.`
          : 'Every answer here is read straight from the gazette.'}
        {lastSavedLabel ? ` Saved ${lastSavedLabel} on this device.` : ''}
      </p>
    </div>
  );
};
