/**
 * ANGLE C — rules as reviewable data.
 *
 * V-001 was invisible because the structural assumption lived in the *shape* of the
 * code: `PLOTTED_RESIDENTIAL_LADDER` is an array keyed by plot area, and nothing
 * anywhere stated "the front setback is derived from plot area" as a claim that could be
 * disagreed with. A reviewer would have had to read TypeScript to find it.
 *
 * This makes the claim explicit. `derivedFrom` says which input drives the answer;
 * `confidence` says how much to trust it; `challenge` records an open dispute. A planner
 * can review this without reading a line of code, which is the only way 876 numbers ever
 * get checked.
 */

/** How much weight the figure can bear. */
export type Confidence =
  /** Read from the gazette text and quoted here. */
  | 'gazette'
  /** From a development authority circular, or a published table citing the clause. */
  | 'secondary'
  /** Transcribed into the codebase before verification began. Believed, not checked. */
  | 'transcribed'
  /** Not stated in any source seen; derived by analogy from a related rule. */
  | 'inferred';

export const CONFIDENCE_RANK: Readonly<Record<Confidence, number>> = {
  gazette: 3, secondary: 2, transcribed: 1, inferred: 0,
};

export const CONFIDENCE_LABEL: Readonly<Record<Confidence, string>> = {
  gazette: 'Quoted from the gazette',
  secondary: 'From a development authority source',
  transcribed: 'Transcribed, not yet verified',
  inferred: 'Inferred from a related rule — weakest',
};

/** An input a rule can key off. Naming these makes the derivation reviewable. */
export type RuleInput =
  | 'plotArea' | 'roadWidth' | 'buildingHeight' | 'occupancy'
  | 'plotFrontage' | 'greenRating' | 'zone'
  /**
   * Built-up area versus new layout. Added after B-013: the gazette prints a separate
   * FAR row for each, the ceilings differ by as much as 3.5 FAR, and the engine applied
   * the built-up figures to both. Nothing declared area type as a driving input, so the
   * omission was not visible anywhere except in the numbers.
   */
  | 'areaType';

export interface Challenge {
  /** Entry in docs/VERIFICATION-LOG.md. */
  id: string;
  /** What the challenge says the rule should be. */
  summary: string;
  /** The inputs the challenger says it is really derived from. */
  derivedFromInstead?: RuleInput[];
  /** How far apart the two readings can be, in the rule's own unit. */
  maxDivergence?: string;
}

export interface RuleMeta {
  id: string;
  /** The question a person would ask that this rule answers. */
  question: string;
  clause: string;
  confidence: Confidence;
  /**
   * Which inputs produce the answer. This is the claim V-001 disputes, and stating it
   * here is what makes the dispute expressible at all.
   */
  derivedFrom: RuleInput[];
  /** Verbatim source text, where we have it. Empty until someone reads the gazette. */
  quote?: string;
  /** ISO date the figure was last checked against a source. */
  checked?: string;
  /** An open dispute. A rule with a challenge must not be presented as settled. */
  challenge?: Challenge;
  /** What goes wrong if this rule is wrong. Drives how loudly the UI hedges. */
  ifWrong: string;
}

export interface RuleSet {
  [ruleId: string]: RuleMeta;
}

/** True when the rule is not safe to present as fact. */
export function isContested(meta: RuleMeta): boolean {
  return Boolean(meta.challenge) || CONFIDENCE_RANK[meta.confidence] <= CONFIDENCE_RANK.transcribed;
}
