import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, CircleDashed, Sparkles } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Assessment, TOPIC_IN_SENTENCE } from '../domain/findings';
import {
  FRAMING_INPUTS, GROUP_LABEL, InputGroup, InputId, getInput,
} from '../domain/inputs';
import { Influence, Provenance, Sensitivity } from '../domain/sensitivity';
import { InputControl, domIdFor } from './InputControl';

export interface FocusRequest {
  readonly id: InputId;
  /** Changes on every request, so asking twice for the same field works. */
  readonly nonce: number;
}

interface SitePanelProps {
  assessment: Assessment;
  sensitivity: Sensitivity;
  provenance: Provenance;
  focusRequest: FocusRequest | null;
}

const inr = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * What an unanswered question is holding up, in the reader's terms.
 *
 * Not "impact: status" but "could change what the byelaws say about parking" — the point
 * of ranking the questions is to tell someone which one to go and find out, and a rank is
 * only useful if it says what turns on it.
 */
function whatItMoves(influence: Influence, assessment: Assessment): string {
  if (influence.impact === 'verdict' || influence.impact === 'status') {
    const topics = [...new Set(
      influence.flips
        .map((id) => assessment.findings.find((f) => f.id === id)?.topic)
        .filter((t): t is NonNullable<typeof t> => Boolean(t)),
    )];
    const named = topics.slice(0, 2).map((t) => TOPIC_IN_SENTENCE[t]);
    const rest = topics.length > 2 ? ` and ${topics.length - 2} more` : '';
    // Naming what each answer governs, and not how severe it is. Six of the eight
    // assumptions on a plain house can produce a blocking finding at some value, so "can
    // block the build outright" written against six of them says nothing — which is the
    // lesson the caveat chips in the verdict panel already learned. The severity is carried
    // once, by the heading this group sits under, and by the order within it.
    return named.length > 0 ? `decides ${named.join(', ')}${rest}` : 'decides how this is checked';
  }

  if (influence.impact === 'money') {
    const parts: string[] = [];
    if (influence.moneySwing > 1) parts.push(`the bill by up to ${inr(influence.moneySwing)}`);
    if (influence.areaSwing > 0.05) parts.push(`the buildable floor area by up to ${influence.areaSwing.toFixed(0)} m²`);
    return `moves ${parts.join(' and ') || 'what the government charges'}`;
  }

  return 'changes only how an answer is worded';
}

/** The honest form of "this makes no difference", which depends on how it was tested. */
function inertBecause(influence: Influence): string {
  return influence.exhaustive
    ? `Every value this can take was tried; none of them changed anything.`
    : `${influence.tried} other values were tried and none of them changed anything.`;
}

const Assumed: React.FC<{ id: InputId; influence: Influence; assessment: Assessment }> = ({
  id, influence, assessment,
}) => {
  const { affirm, project } = useProject();
  const def = getInput(id);
  return (
    // A dashed box round each of eight assumptions reads as eight alarms, and so reads as
    // none — the same lesson the caveat chips already learned. A rule in the margin marks
    // the value as the app's without shouting about it.
    <div className="border-l-2 border-amber-400/70 pl-3 dark:border-amber-500/50">
      <InputControl id={id} />
      <p className="mt-1.5 text-[10.5px] leading-snug text-slate-600 dark:text-slate-400">
        <span className="font-semibold text-amber-800 dark:text-amber-400">Assumed</span>{' '}
        {def.because} — {whatItMoves(influence, assessment)}.{' '}
        <button
          type="button"
          onClick={() => affirm([id])}
          className="font-semibold text-slate-700 underline decoration-dotted underline-offset-2 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          {def.kind === 'number' || def.kind === 'text'
            ? `${String(project[id as keyof typeof project])}${def.unit ? ` ${def.unit}` : ''} is right`
            : "That's right"}
        </button>
      </p>
    </div>
  );
};

const Section: React.FC<{
  id: string;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ id, title, subtitle, open, onToggle, children }) => (
  <div className="border-t border-slate-200 pt-3 dark:border-white/10">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={`section-${id}`}
      className="flex w-full items-center gap-1.5 text-left"
    >
      <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true" />
      <span className="flex-1">
        <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">{title}</span>
        {subtitle && <span className="block text-[10.5px] text-slate-600 dark:text-slate-400">{subtitle}</span>}
      </span>
    </button>
    {open && <div id={`section-${id}`} className="mt-3 space-y-3">{children}</div>}
  </div>
);

/**
 * The questions, in the order this project needs them answered.
 *
 * The previous version of this panel asked a fixed six in Simple mode and a fixed twenty
 * in Advanced, both hand-picked, and neither matched what the engine reads: it asked a
 * house about stilt parking, which nothing consults, while never once asking anybody for
 * the master-plan zone that decides whether the use is permitted at all. Worse, the ten
 * inputs Simple mode did not ask still went into the verdict — as defaults, presented with
 * the same confidence as the six the applicant had actually given.
 *
 * So the panel no longer holds a list of questions. It asks the three without which there
 * is no question, and then reads `sensitivity.ts` — which re-runs the engine against every
 * other answer this project could give — to sort the rest into what would change the
 * verdict, what only moves the bill, what changes a sentence, and what the engine does not
 * read at all. Every value the app supplied is on screen, marked as the app's and not the
 * user's, with what it is holding up written next to it.
 */
export const SitePanel: React.FC<SitePanelProps> = ({
  assessment, sensitivity, provenance, focusRequest,
}) => {
  const { project } = useProject();
  const [open, setOpen] = useState<Record<string, boolean>>({ answered: true });
  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const told = useMemo(() => new Set(project.answered), [project.answered]);
  const framing = FRAMING_INPUTS;
  const answered = provenance.answered.filter((id) => !framing.includes(id));
  const decisive = provenance.decisive.filter((id) => !framing.includes(id));
  const material = provenance.material.filter((id) => !framing.includes(id));
  const cosmetic = provenance.cosmetic.filter((id) => !framing.includes(id));
  // A framing question is asked at the top whatever its influence, so it must not appear a
  // second time lower down — `buildingStage` is inert for a proposal and decisive the
  // moment the building is standing, and would otherwise render twice in the first case.
  const inert = provenance.inert.filter((id) => !framing.includes(id));

  // Which collapsed section a question lives in, so a request to focus it can open that
  // section first. Answered and decisive questions are always on screen.
  const sectionOf = (id: InputId): string | null =>
    (material.includes(id) && 'material')
    || (cosmetic.includes(id) && 'cosmetic')
    || (inert.includes(id) && 'inert')
    || null;

  useEffect(() => {
    if (!focusRequest) return;
    const section = sectionOf(focusRequest.id);
    if (section) setOpen((prev) => ({ ...prev, [section]: true }));
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(domIdFor(focusRequest.id));
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  const assumedCount = provenance.assumed.length;
  const answeredCount = provenance.answered.length;
  const decisiveTotal = provenance.decisive.length;
  const framingDecisive = provenance.decisive.filter((id) => framing.includes(id)).length;
  const framingAnswered = provenance.answered.filter((id) => framing.includes(id)).length;

  const grouped = answered.reduce<Partial<Record<InputGroup, InputId[]>>>((acc, id) => {
    (acc[getInput(id).group] ??= []).push(id);
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5" id="your-site">
      <div>
        <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Your site</h2>
        <p className="mt-0.5 text-[11.5px] leading-snug text-slate-600 dark:text-slate-400">
          {answeredCount === 0
            ? 'Nothing here is yours yet — every value below was supplied by the app, '
              + `${decisiveTotal} of them able to change the verdict.`
            : assumedCount === 0
              ? 'Every answer that reaches the verdict is one you gave. Nothing below was supplied for you.'
              : `${answeredCount} ${answeredCount === 1 ? 'answer is' : 'answers are'} yours. `
                + `${assumedCount} more came from the app`
                + (decisiveTotal > 0
                  ? `, ${decisiveTotal} of ${decisiveTotal === 1 ? 'which can' : 'them able to'} change the verdict.`
                  : ', none of which can change the verdict.')}
        </p>
      </div>

      {/* The three without which there is no question. */}
      <div className="space-y-3">
        {framing.map((id) => (
          <div key={id}>
            <InputControl id={id} />
            {!told.has(id) && sensitivity.byInput[id].impact !== 'none' && (
              <p className="mt-1 flex items-start gap-1.5 text-[10.5px] leading-snug text-slate-600 dark:text-slate-400">
                <CircleDashed className="mt-px h-3 w-3 flex-shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                <span>Assumed {getInput(id).because}.</span>
              </p>
            )}
          </div>
        ))}
      </div>

      {decisive.length > 0 && (
        <div className="border-t border-slate-200 pt-3 dark:border-white/10">
          <h3 className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            {/* "more" where one of the three framing questions above is also still the
                app's, so this count and the one in the summary line agree. */}
            {framingDecisive > 0 ? `${decisive.length} more ` : `${decisive.length} `}
            {decisive.length === 1 ? 'answer would' : 'answers would'} change your verdict
          </h3>
          <p className="mt-0.5 text-[10.5px] leading-snug text-slate-600 dark:text-slate-400">
            The app has supplied these. They are the ones worth going and finding out.
          </p>
          <div className="mt-3 space-y-3">
            {decisive.map((id) => (
              <Assumed key={id} id={id} influence={sensitivity.byInput[id]} assessment={assessment} />
            ))}
          </div>
        </div>
      )}

      {material.length > 0 && (
        <Section
          id="material"
          title={`${material.length} more ${material.length === 1 ? 'moves' : 'move'} the bill, not the verdict`}
          subtitle="Supplied by the app. Wrong here costs money, not permission."
          open={Boolean(open.material)}
          onToggle={() => toggle('material')}
        >
          {material.map((id) => (
            <Assumed key={id} id={id} influence={sensitivity.byInput[id]} assessment={assessment} />
          ))}
        </Section>
      )}

      {cosmetic.length > 0 && (
        <Section
          id="cosmetic"
          title={`${cosmetic.length} more ${cosmetic.length === 1 ? 'changes' : 'change'} only the wording`}
          subtitle="Supplied by the app. They alter how an answer reads, not what it is."
          open={Boolean(open.cosmetic)}
          onToggle={() => toggle('cosmetic')}
        >
          {cosmetic.map((id) => (
            <Assumed key={id} id={id} influence={sensitivity.byInput[id]} assessment={assessment} />
          ))}
        </Section>
      )}

      {answered.length > 0 && (
        <Section
          id="answered"
          // "more" for the same reason the decisive heading says it: a framing question
          // answered at the top is counted in the summary line but rendered there, not here.
          title={`${answered.length}${framingAnswered > 0 ? ' more' : ''} `
            + `${answered.length === 1 ? 'answer' : 'answers'} you gave`}
          open={Boolean(open.answered)}
          onToggle={() => toggle('answered')}
        >
          {(Object.keys(grouped) as InputGroup[]).map((group) => (
            <div key={group}>
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {GROUP_LABEL[group]}
              </h4>
              <div className="space-y-3">
                {grouped[group]!.map((id) => <InputControl key={id} id={id} asQuestion={false} />)}
              </div>
            </div>
          ))}
        </Section>
      )}

      {inert.length > 0 && (
        <Section
          id="inert"
          title={`${inert.length} ${inert.length === 1 ? 'question' : 'questions'} cannot change this answer`}
          subtitle="Asked by the engine of some projects, but not of this one."
          open={Boolean(open.inert)}
          onToggle={() => toggle('inert')}
        >
          {inert.map((id) => {
            const def = getInput(id);
            return (
              <div key={id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 opacity-90 dark:border-white/10 dark:bg-white/[0.03]">
                <InputControl id={id} asQuestion={false} />
                <p className="mt-2 text-[10.5px] leading-snug text-slate-600 dark:text-slate-400">
                  {def.notConsulted ?? inertBecause(sensitivity.byInput[id])}
                </p>
              </div>
            );
          })}
        </Section>
      )}

      <p className="mt-auto flex items-start gap-1.5 border-t border-slate-200 pt-3 text-[10px] leading-snug text-slate-600 dark:border-white/10 dark:text-slate-400">
        <Sparkles className="mt-px h-3 w-3 flex-shrink-0" aria-hidden="true" />
        <span>
          Which questions appear here was worked out by running the byelaws engine {sensitivity.runs} times
          over this project — once for every other answer you could have given — and keeping the ones that
          moved something.
        </span>
      </p>
    </div>
  );
};
