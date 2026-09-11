/**
 * The conflict query — every place the byelaws answer one question two ways.
 *
 * `docs/RULE-GRAPH-PLAN.md`, Step 3:
 *
 * > Two nodes that produce the same output, whose applicability guards can both be
 * > satisfied at once, are a conflict.
 *
 * That definition needed one repair on contact with the corpus, and the repair is the
 * interesting part. Taken literally it reports every pair of clauses that speak to the
 * same fact — including Clause 10.1.3(a), (b) and (c), which are three limbs of one
 * enumerated list requiring one certificate. They do not disagree; they are alternative
 * sufficient triggers, and the gazette joins them itself.
 *
 * So a conflict needs a third condition beyond "same fact" and "co-satisfiable": the two
 * assertions must actually be capable of DISAGREEING.
 *
 *   - Where both state an answer, they disagree if the answers differ. Chapter 3 says the
 *     ceiling is 5.0 and Chapter 5 says 5.25 over the same band: a conflict.
 *   - Where neither states an answer — a bare obligation, "a clearance is required" — the
 *     answer is carried entirely by the guard, and they disagree unless each guard implies
 *     the other. Clause 10.1.3(a) at "more than 15 m" and Clause 2.9.3.2 at "15 m and
 *     more" both say "required", and differ over a building of exactly 15 m.
 *
 * `limbOf` carries the exception: limbs of one enumerated list are never rivals.
 *
 * ---- What this is not ---------------------------------------------------------------
 *
 * Shape (b) — a table that contradicts its own printed components — is not this query's
 * business and never was. `tools/extract-purchasable-far.py` detects those mechanically
 * on every run via MFAR = BFAR + PFAR + PPFAR, across 157 band checks. This query is for
 * shape (a): two clauses answering the same question differently, which no arithmetic
 * identity can see because it spans two tables.
 *
 * Shape (c) — V-039, a reading defeated because it would render a neighbouring provision
 * inoperative — is not detected here either. Detecting it needs a notion of one rule
 * emptying another's domain. It has a disposition name below, which was the plan's
 * recommendation: record it before trying to detect it.
 */

import { coSatisfiable, type DerivedFact, type Guard, type RangeTerm } from './schema';
import { CLAUSE_NODES, type ClauseNode } from './clauses';

export interface Conflict {
  /** The two assertions, ordered by id so the pair is stable between runs. */
  readonly a: ClauseNode;
  readonly b: ClauseNode;
  /** The question they both answer. */
  readonly fact: DerivedFact;
  /** Why they are held to disagree. */
  readonly because: 'different-answers' | 'different-domains';
}

/**
 * Does `a` hold of every project `b` holds of?
 *
 * True when every term of `b` is already forced by `a`. Silence in `a` is not implication:
 * a guard that says nothing about occupancy admits every occupancy, so it cannot imply one
 * that admits only three.
 */
function implies(a: Guard, b: Guard): boolean {
  for (const term of b.ranges ?? []) {
    const mine = (a.ranges ?? []).filter((t) => t.fact === term.fact);
    if (mine.length === 0) return false;
    if (term.min !== undefined && !mine.some((t) => forcesMin(t, term))) return false;
    if (term.max !== undefined && !mine.some((t) => forcesMax(t, term))) return false;
  }
  for (const term of b.oneOf ?? []) {
    const mine = (a.oneOf ?? []).find((t) => t.fact === term.fact);
    if (!mine) return false;
    const allowed = new Set(term.values);
    if (!mine.values.every((v) => allowed.has(v))) return false;
  }
  for (const term of b.flags ?? []) {
    const mine = (a.flags ?? []).find((t) => t.fact === term.fact);
    if (!mine || mine.is !== term.is) return false;
  }
  return true;
}

const forcesMin = (mine: RangeTerm, theirs: RangeTerm): boolean => {
  if (mine.min === undefined) return false;
  if (mine.min > theirs.min!) return true;
  if (mine.min < theirs.min!) return false;
  // Equal bounds: an exclusive lower bound is the stronger claim.
  return theirs.minInclusive !== false || mine.minInclusive === false;
};

const forcesMax = (mine: RangeTerm, theirs: RangeTerm): boolean => {
  if (mine.max === undefined) return false;
  if (mine.max < theirs.max!) return true;
  if (mine.max > theirs.max!) return false;
  return theirs.maxInclusive !== false || mine.maxInclusive === false;
};

function disagree(a: ClauseNode, b: ClauseNode): Conflict['because'] | null {
  if (a.asserts !== undefined && b.asserts !== undefined) {
    return a.asserts === b.asserts ? null : 'different-answers';
  }
  // One states an answer and the other does not: not comparable as answers, so fall
  // through to the domains. Two bare obligations likewise.
  return implies(a.appliesWhen, b.appliesWhen) && implies(b.appliesWhen, a.appliesWhen)
    ? null
    : 'different-domains';
}

/** Every pair of assertions that can disagree about the same fact. */
export function findConflicts(nodes: readonly ClauseNode[] = CLAUSE_NODES): readonly Conflict[] {
  const sorted = [...nodes].sort((x, y) => x.id.localeCompare(y.id));
  const out: Conflict[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const a = sorted[i];
      const b = sorted[j];
      if (a.produces !== b.produces) continue;
      if (a.limbOf !== undefined && a.limbOf === b.limbOf) continue;
      if (a.clause === b.clause && a.asserts === b.asserts) continue;
      if (!coSatisfiable(a.appliesWhen, b.appliesWhen)) continue;
      const because = disagree(a, b);
      if (because) out.push({ a, b, fact: a.produces, because });
    }
  }
  return out;
}

/* ====================================================================================
 * THRESHOLD DIVERGENCE — a second query, for the shape the first one cannot see.
 * ================================================================================== */

export interface ThresholdUse {
  readonly value: number;
  readonly node: string;
  readonly clause: string;
  readonly produces: DerivedFact;
}

export interface ThresholdDivergence {
  readonly fact: string;
  readonly values: readonly number[];
  readonly uses: readonly ThresholdUse[];
}

/**
 * How many different numbers the byelaws gate on one quantity.
 *
 * V-038 is the case this exists for, and the same-fact query structurally cannot find it:
 * the seismic duty, the fire certificate, the completion NOC, the peer review and four
 * competence limits produce EIGHT DIFFERENT facts, so no two of them ever meet in a
 * same-fact comparison. What they share is the quantity they gate on. Eight obligations,
 * seven distinct heights, and two of those heights used by two clauses each with different
 * floor counts attached — so even the shared numbers do not mean the same thing.
 *
 * This is not a defect the byelaws could be argued out of; it is a map of how many
 * different answers exist to "which buildings are the serious ones". Reported separately
 * from `findConflicts` because it is a different claim, and folding the two together would
 * make the recall figure meaningless.
 */
export function thresholdDivergence(nodes: readonly ClauseNode[] = CLAUSE_NODES): readonly ThresholdDivergence[] {
  const byFact = new Map<string, ThresholdUse[]>();
  for (const node of nodes) {
    for (const term of node.appliesWhen.ranges ?? []) {
      for (const bound of [term.min, term.max]) {
        // A bound of zero is a sentinel for "no bound" — the first row of a road-width
        // ladder reads "up to 12 m" with nothing under it — and asserts no threshold.
        if (bound === undefined || !Number.isFinite(bound) || bound === 0) continue;
        const uses = byFact.get(String(term.fact)) ?? [];
        uses.push({ value: bound, node: node.id, clause: node.clause, produces: node.produces });
        byFact.set(String(term.fact), uses);
      }
    }
  }
  return [...byFact.entries()]
    .map(([fact, uses]) => ({
      fact,
      values: [...new Set(uses.map((u) => u.value))].sort((x, y) => x - y),
      uses: [...uses].sort((x, y) => x.value - y.value || x.node.localeCompare(y.node)),
    }))
    .filter((d) => d.values.length > 1)
    .sort((x, y) => y.values.length - x.values.length || x.fact.localeCompare(y.fact));
}

/* ====================================================================================
 * STEP 4 — resolution as data.
 * ================================================================================== */

export type Disposition =
  /** Standing rule 4, the default: both readings stand and the stricter is applied. */
  | 'stricter'
  /** One clause explicitly yields. Clause 9.2.3 Note-2 is the clean example. */
  | 'subordinated'
  /** V-039's shape: a reading rejected because it would empty a neighbouring provision. */
  | 'defeated-by-consequence'
  /** Both readings stand, the stricter is applied, the alternative is surfaced. */
  | 'unresolved'
  /** Not a disagreement on inspection — the query was right to ask and the answer is no. */
  | 'not-a-conflict';

export interface Resolution {
  readonly disposition: Disposition;
  /** The entry in docs/VERIFICATION-LOG.md, where there is one. */
  readonly logEntry?: string;
  readonly why: string;
}

/**
 * Dispositions, keyed on the pair.
 *
 * WRITTEN AFTER THE QUERY RAN, against what it returned. That order matters: a disposition
 * authored first would be an answer sheet the query could be tuned against, and the
 * benchmark would measure nothing. An unresolved pair here is not an oversight — it is a
 * conflict nobody has yet decided, which is the honest state for most of them.
 */
export const RESOLUTIONS: Readonly<Record<string, Resolution>> = {
  'c3.2.4.1.height.large-plot|c4.1.4.height.single-unit': {
    disposition: 'stricter',
    logEntry: 'V-010',
    why: 'A single dwelling on a 400 m² plot is 17.5 m by Clause 3.2.4.1 and 15 m by Clause 4.1.4. Nothing subordinates either chapter; the engine applies the lower.',
  },
  'c3.2.4.1.height.small-plot|c4.1.4.height.multi-unit': {
    disposition: 'stricter',
    logEntry: 'V-010',
    why: 'A multi-unit on a 200 m² plot is 15 m by Clause 3.2.4.1 and 17.5 m by Clause 4.1.4. This is the limb the engine was getting wrong (B-044): it reported 17.5 m.',
  },
  'c10.1.3a.fire-certificate|c10.1.3a.fire-certificate.read-with-c1.2m': {
    disposition: 'stricter',
    logEntry: 'V-035',
    why: 'Clause 10.1.3(a) governs "multi-storied buildings" and Clause 1.2(m) defines the term 2.5 m higher for a stilted building. The engine applies the flat 15 m and emits a caveat between 15 and 17.5. `ProjectState.hasStilt` exists and is deliberately not consulted.',
  },
  'c10.1.3a.fire-certificate|c2.9.3.2.fire-noc.height': {
    disposition: 'unresolved',
    logEntry: 'V-037',
    why: 'Chapter 10 is exclusive at 15 m and Clause 2.9.3.2 inclusive. A building of exactly 15 m needs a clearance at completion and is caught by nothing at sanction.',
  },
  'c10.1.3c.special-building|c2.9.3.2.special-building': {
    disposition: 'stricter',
    logEntry: 'V-036',
    why: 'Three words for the same 500 — "covered area", "total built up area", "ground coverage" — and Chapter 1 defines two of them as different quantities. The engine tests the all-floors total, which crosses 500 soonest.',
  },
  'c1.2q.special-building|c10.1.3b.special-building': {
    disposition: 'stricter',
    logEntry: 'V-034',
    why: 'Two lists and two area bases for one defined term. The engine takes the union — a building is caught if any limb catches it — and names which limb fired.',
  },
  'c13.7.trees.commercial|c3.landscape-plan.commercial': {
    disposition: 'stricter',
    logEntry: 'V-044',
    why: 'On a 1,000 m² commercial plot Chapter 13 asks for 10 trees and Chapter 3 for under one. Two obligations meeting on one site rather than one stated twice; the engine holds the per-plot rate.',
  },
  'c17.1.ev-share|c17.5.1.ev-share': {
    disposition: 'not-a-conflict',
    logEntry: 'V-049',
    why: 'Clause 17.5.1 sits in the explanatory annexure and reads as a projection about 2020, resolving to 20% for the cities the byelaws govern. The engine applies 20% without a caveat.',
  },
  'c18.5.1.2n.telecom-room.built-up|c18.5.1.2n.telecom-room.ibs-covered': {
    disposition: 'stricter',
    logEntry: 'V-051',
    why: 'Both tables are captioned by built-up area and keyed on "area to be covered by IBS", and nothing says those are the same quantity. The engine takes the whole building as covered, which gives the larger room.',
  },
};

export const resolutionKey = (c: Conflict): string =>
  [c.a.id, c.b.id].sort().join('|');

export function resolutionFor(c: Conflict): Resolution | undefined {
  return RESOLUTIONS[resolutionKey(c)];
}

/** Conflicts with nobody's decision recorded against them. */
export function undisposed(conflicts: readonly Conflict[] = findConflicts()): readonly Conflict[] {
  return conflicts.filter((c) => !resolutionFor(c));
}
