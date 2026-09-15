/**
 * Which of the questions could change *this* answer.
 *
 * The engine is deterministic and costs about four-tenths of a millisecond a run, so the
 * app does not have to guess which inputs matter for a mall as against a house: it can ask
 * the engine, by running it again with the answer changed and seeing what moved. A hundred
 * runs is forty milliseconds, which buys an interface that never asks a question whose
 * answer cannot reach the verdict, and never quietly computes with a number nobody gave it.
 *
 * Two things fall out of the same sweep:
 *
 *  - per input, how far it can move the answer — from flipping whether you may build at
 *    all, down to changing nothing whatsoever;
 *  - per finding, which inputs it rests on, which is what lets a line on the verdict say
 *    "this rests on something you have not told me" instead of asserting it flatly.
 *
 * On honesty of the claim. For a boolean or a fixed set of choices the probe set is every
 * value the field can take, so "cannot change your answer" is exact. For a number it is a
 * ladder laid across the thresholds the byelaws use, so the honest claim is the weaker one
 * — "nothing I tried moved it" — and `exhaustive` on each result says which kind it is.
 * The interface must not upgrade the weaker claim.
 */

import { Assessment, Finding, assessProject } from './findings';
import { INPUTS, InputDefinition, InputId } from './inputs';
import { ProjectState } from './project';

/**
 * How far an answer can move the verdict. Ordered: each level contains the ones below it,
 * and the interface asks for answers in this order.
 */
export type Impact = 'none' | 'wording' | 'money' | 'status' | 'verdict';

export const IMPACT_RANK: Readonly<Record<Impact, number>> = {
  none: 0, wording: 1, money: 2, status: 3, verdict: 4,
};

export interface Influence {
  readonly id: InputId;
  readonly impact: Impact;
  /** Findings whose status this answer can flip, or make appear or disappear. */
  readonly flips: readonly string[];
  /** Findings this answer changes in any way at all, wording included. */
  readonly touches: readonly string[];
  /** The widest the bill moved across the probes, in ₹. */
  readonly moneySwing: number;
  /** The widest the buildable floor area moved across the probes, in m². */
  readonly areaSwing: number;
  /** True where every value the field can hold was tried, so `none` means none. */
  readonly exhaustive: boolean;
  /** How many alternative answers were tried. */
  readonly tried: number;
}

export interface Sensitivity {
  readonly byInput: Readonly<Record<InputId, Influence>>;
  /** Finding id → the inputs that can change it, worst first. */
  readonly byFinding: Readonly<Record<string, readonly InputId[]>>;
  /** Finding id → the inputs that can flip its status. */
  readonly flippedBy: Readonly<Record<string, readonly InputId[]>>;
  /** How many times the engine was run. Kept so the cost stays visible in tests. */
  readonly runs: number;
}

/** Everything about a finding that a reader could notice changing. */
function fingerprint(f: Finding): string {
  return [
    f.status, f.headline, f.detail, f.required ?? '', f.proposed ?? '', f.working ?? '',
    f.clause ?? '', f.money ? `${f.money.label}:${Math.round(f.money.amount)}` : '',
    f.nonNegotiable ? '!' : '', f.dispute?.id ?? '',
  ].join('␟');
}

interface Diff {
  readonly impact: Impact;
  readonly flips: readonly string[];
  readonly touches: readonly string[];
  readonly money: number;
  readonly area: number;
}

function compare(base: Assessment, probe: Assessment): Diff {
  const flips: string[] = [];
  const touches: string[] = [];

  const before = new Map(base.findings.map((f) => [f.id, f]));
  const after = new Map(probe.findings.map((f) => [f.id, f]));
  for (const id of new Set([...before.keys(), ...after.keys()])) {
    const a = before.get(id);
    const b = after.get(id);
    // A finding that appears or disappears is a status change: the reader sees a new line
    // or loses one, which is the same event as amber turning green.
    if (!a || !b || a.status !== b.status) {
      flips.push(id);
      touches.push(id);
    } else if (fingerprint(a) !== fingerprint(b)) {
      touches.push(id);
    }
  }

  const money = Math.abs(base.ledger.total - probe.ledger.total);
  const area = Math.abs(base.permissibleArea - probe.permissibleArea);
  const billChanged = money > 1
    || base.ledger.lines.length !== probe.ledger.lines.length
    || base.ledger.excludes.length !== probe.ledger.excludes.length;

  const impact: Impact = base.canBuild !== probe.canBuild
    ? 'verdict'
    : flips.length > 0
      ? 'status'
      : billChanged || area > 0.05
        ? 'money'
        : touches.length > 0 || base.headline !== probe.headline || base.subhead !== probe.subhead
          ? 'wording'
          : 'none';

  return { impact, flips, touches, money, area };
}

function probeValues(def: InputDefinition, project: ProjectState): unknown[] {
  const current = project[def.id as keyof ProjectState];
  const seen = new Set<string>([JSON.stringify(current ?? null)]);
  const out: unknown[] = [];
  for (const value of def.probes(project)) {
    const key = JSON.stringify(value ?? null);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/**
 * Run the engine once for the project and once more for every alternative answer, and
 * report what moved.
 *
 * `baseline` is accepted so the caller — which has almost always just computed the
 * assessment it is rendering — does not pay for a second identical run.
 */
export function analyse(project: ProjectState, baseline?: Assessment): Sensitivity {
  const base = baseline ?? assessProject(project);
  const byInput = {} as Record<InputId, Influence>;
  const byFinding: Record<string, InputId[]> = {};
  const flippedBy: Record<string, InputId[]> = {};
  let runs = baseline ? 0 : 1;

  for (const def of INPUTS) {
    const values = probeValues(def, project);
    let impact: Impact = 'none';
    let money = 0;
    let area = 0;
    const flips = new Set<string>();
    const touches = new Set<string>();

    for (const value of values) {
      const probe = assessProject({ ...project, [def.id]: value } as ProjectState);
      runs += 1;
      const diff = compare(base, probe);
      if (IMPACT_RANK[diff.impact] > IMPACT_RANK[impact]) impact = diff.impact;
      money = Math.max(money, diff.money);
      area = Math.max(area, diff.area);
      for (const id of diff.flips) flips.add(id);
      for (const id of diff.touches) touches.add(id);
    }

    byInput[def.id] = {
      id: def.id,
      impact,
      flips: [...flips],
      touches: [...touches],
      moneySwing: money,
      areaSwing: area,
      exhaustive: def.exhaustive,
      tried: values.length,
    };

    // Only findings actually on screen are worth attributing; a finding that exists solely
    // in a hypothetical is not a line anyone is reading.
    for (const id of touches) {
      if (!base.findings.some((f) => f.id === id)) continue;
      (byFinding[id] ??= []).push(def.id);
    }
    for (const id of flips) {
      if (!base.findings.some((f) => f.id === id)) continue;
      (flippedBy[id] ??= []).push(def.id);
    }
  }

  const worstFirst = (a: InputId, b: InputId) =>
    IMPACT_RANK[byInput[b].impact] - IMPACT_RANK[byInput[a].impact];
  for (const list of Object.values(byFinding)) list.sort(worstFirst);
  for (const list of Object.values(flippedBy)) list.sort(worstFirst);

  return { byInput, byFinding, flippedBy, runs };
}

/**
 * What the project rests on: what the user said, and what the app supplied for them.
 *
 * `answered` is carried on the project itself, so it survives a save, an export and a
 * colleague opening the file — the provenance of a number travels with the number.
 */
export interface Provenance {
  /** Answered by the user, in registry order. */
  readonly answered: readonly InputId[];
  /** Not answered, and able to change something — these are the app's live assumptions. */
  readonly assumed: readonly InputId[];
  /** Assumed, and able to flip a finding or the verdict. Ask these first. */
  readonly decisive: readonly InputId[];
  /** Assumed, and able to move the bill or the buildable area but not a verdict. */
  readonly material: readonly InputId[];
  /** Assumed, and able to change only how something is worded. */
  readonly cosmetic: readonly InputId[];
  /** Cannot change this answer at all, answered or not. */
  readonly inert: readonly InputId[];
}

export function provenanceOf(project: ProjectState, sensitivity: Sensitivity): Provenance {
  const told = new Set(project.answered);
  const answered: InputId[] = [];
  const assumed: InputId[] = [];
  const decisive: InputId[] = [];
  const material: InputId[] = [];
  const cosmetic: InputId[] = [];
  const inert: InputId[] = [];

  for (const def of INPUTS) {
    const influence = sensitivity.byInput[def.id];
    if (influence.impact === 'none') {
      inert.push(def.id);
      continue;
    }
    if (told.has(def.id)) {
      answered.push(def.id);
      continue;
    }
    assumed.push(def.id);
    if (IMPACT_RANK[influence.impact] >= IMPACT_RANK.status) decisive.push(def.id);
    else if (influence.impact === 'money') material.push(def.id);
    else cosmetic.push(def.id);
  }

  const byImpact = (a: InputId, b: InputId) => {
    const ia = sensitivity.byInput[a];
    const ib = sensitivity.byInput[b];
    return IMPACT_RANK[ib.impact] - IMPACT_RANK[ia.impact]
      || ib.flips.length - ia.flips.length
      || ib.moneySwing - ia.moneySwing;
  };
  decisive.sort(byImpact);
  material.sort(byImpact);
  cosmetic.sort(byImpact);

  return { answered, assumed, decisive, material, cosmetic, inert };
}
