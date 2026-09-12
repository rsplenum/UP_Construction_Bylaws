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

/**
 * An input a rule keys off. Retained as the name `derivedFrom` and `Challenge` use, and
 * now an alias of `GivenFact`: the graph needs one vocabulary of facts, not two.
 */
export type RuleInput = GivenFact;

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
  /**
   * Facts this rule reads, given and derived alike. A superset of `derivedFrom`, which
   * names only the given half: a rule can also read what another rule established, and
   * that is the edge.
   */
  consumes: readonly Fact[];
  /** Facts this rule establishes. Two rules naming one of these is what the query looks for. */
  produces: readonly DerivedFact[];
  /** When this rule speaks at all. Omitted means always. */
  appliesWhen?: Guard;
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

/* ------------------------------------------------------------------------------------
 * THE RULE GRAPH — facts, guards, and the two halves of a node's wiring.
 *
 * `docs/RULE-GRAPH-PLAN.md` argues the case: this document is a dataflow graph, not a
 * lookup matrix, because half the coordinates of the cell you want are computed by other
 * cells. Setbacks depend on height; the height ceiling depends on plot size. A matrix
 * presumes you can address a cell by coordinates known before you look, and here you
 * cannot.
 *
 * The declaration below is what turns that argument into data. Every node says which
 * facts it reads (`consumes`), which it establishes (`produces`), and when it applies at
 * all (`appliesWhen`). Edges are then derived, never authored, and two nodes producing
 * the same fact under guards that can hold at once are a conflict the byelaws contain.
 * ---------------------------------------------------------------------------------- */

/**
 * A fact the graph carries. Two kinds, and the split is the whole point.
 *
 * GIVEN facts come in with the project — someone types them or picks them off a map.
 * DERIVED facts are established by a rule, and a rule that consumes one cannot run until
 * the rule that produces it has.
 *
 * The plan's Step 1 sketch typed `consumes` as `RuleInput[]`, which would have made every
 * edge set empty: `produces` is drawn from the derived half, `consumes` from the given
 * half, and two disjoint unions never intersect. `consumes` has to span both, and does.
 */
export type Fact = GivenFact | DerivedFact;

/**
 * A fact about the site, supplied rather than computed.
 *
 * Some of these `ProjectState` cannot supply. They are named here anyway, and deliberately:
 * a rule that consumes `floorCount` is a rule the engine cannot fully evaluate, and the
 * verification log has been counting those by hand ("the fifth obligation blocked on the
 * same missing field", V-038). `UNSUPPLIED_FACTS` below makes the graph count them instead.
 */
export type GivenFact =
  | 'plotArea' | 'roadWidth' | 'buildingHeight' | 'occupancy'
  | 'plotFrontage' | 'greenRating' | 'zone'
  /**
   * Built-up area versus new layout. Added after B-013: the gazette prints a separate
   * FAR row for each, the ceilings differ by as much as 3.5 FAR, and the engine applied
   * the built-up figures to both. Nothing declared area type as a driving input, so the
   * omission was not visible anywhere except in the numbers.
   */
  | 'areaType'
  /**
   * The current rate of land, Rc in Clause 9.2.5. Added with the purchase-fee rule: it is
   * the first input in this engine that is not a fact about the building or its plot but a
   * figure published elsewhere — the District Magistrate's circle rate, or the Authority's
   * residential rate where there is none, whichever is higher. Naming it here says the fee
   * cannot be derived from the project alone.
   */
  | 'landRate'
  /** Total floor area on all floors — `ProjectState.proposedBuiltUpArea`. */
  | 'builtUpArea'
  /** Clause 4.4 Note-2 turns the EWS/LIG reservation off for a qualifying scheme. */
  | 'affordableScheme'
  /** Clause 1.2(m) reads the multi-storeyed threshold 2.5 m higher for a stilted building. */
  | 'hasStilt'
  /** Clause 3.2.4.6 relaxes the side setback on a corner plot. */
  | 'cornerPlot'
  /** Whether the green rating claimed at sanction was certified on completion (Clause 9.3). */
  | 'greenCertified'

  /* ---- Facts no field supplies. Every one of these is an obligation the engine can
   * only answer with a caveat, and naming them is what makes that countable. ---- */

  /**
   * Storeys. Clause 2.9.3.2 gates the completion fire NOC on ">4 floors", Clause 11.8.1
   * the seismic duty on ">3 including ground", Chapter 14 every competence limit on
   * "storeys or height". It cannot be derived from height: four floors at 2.75 m stands at
   * 11 m, under the seismic height limb and over its floor limb (V-037, V-038).
   */
  | 'floorCount'
  /**
   * The footprint. Clause 2.9.3.2 says "ground coverage", Clause 10.1.3(c) "covered area",
   * Clause 1.2(q) "total built up area" — three words for the same 500, and Chapter 1
   * defines two of them as different quantities (V-036).
   */
  | 'groundCoverage'
  /** Dwelling units. Para 3.3.4.3 states residential parking per unit, not per 100 m² (V-032). */
  | 'dwellingUnits'
  /** Carpet area of a dwelling unit — the other half of Para 3.3.4.3's ladder (V-032). */
  | 'unitCarpetArea'
  /** Clause 5.3.3 lets a hotel of up to 20 rooms sit on a 9 m road (V-011). */
  | 'hotelRooms'
  /** Where in a mixed-use zone the plot sits. A means of access split five ways (V-024). */
  | 'mixedUseLocation'
  /** Whether the plot is inside a Transit Oriented Development zone (V-026). */
  | 'todZone'
  /** The area an in-building solution actually covers, which need not be the whole building (V-051). */
  | 'ibsCoveredArea'
  /**
   * Whether the plot lies in a layout approved or developed by the Authority. Clause
   * 2.1.2(iii) makes the instant-approval route conditional on it, and nothing on a drawing
   * shows it (V-053).
   */
  | 'approvedLayout'
  /**
   * Whether the plot lies in a mela area under the UP Melas Act 1938, or in an unauthorised
   * layout or colony. Clause 2.1.2(ii) excludes both from the no-permission route (V-053).
   */
  | 'melaOrUnauthorisedArea';

/**
 * A fact a rule establishes. Closed, and that is the load-bearing decision: the value of
 * the whole exercise is that two rules answering the same question is *detectable*, and
 * that only works if the names are drawn from a fixed set. A new rule that needs a new
 * output must add it here, in front of a reviewer.
 *
 * An adjustment gets its own name rather than sharing the name of what it adjusts. The
 * green incentive does not answer "what is the FAR ceiling"; it answers "how much does a
 * rating add", and `ceilingFar` consumes the answer. Collapsing the two would report a
 * conflict between a rule and its own modifier on every green project.
 */
export type DerivedFact =
  /* bulk */
  | 'baseFar' | 'ceilingFar' | 'farIncentive'
  | 'purchasableSplit' | 'purchaseGateOpen' | 'purchaseFee'
  /* envelope and height */
  | 'requiredSetback' | 'maxHeight'
  /**
   * What the footprint may cover, and by which instrument. Clause 3.2.2 caps it with the
   * setbacks rather than a percentage, and until this fact existed nothing in the engine
   * said so — the envelope was drawn and left to speak for itself.
   */
  | 'groundCoverageLimit'
  /* permissibility */
  | 'useAllowed' | 'minRoadWidth' | 'minPlotArea' | 'masterPlanZoneName'
  /** Clause 15.4 — the charge for putting a higher use in a lower land-use zone. */
  | 'impactFee'
  /* fire */
  | 'specialBuilding' | 'fireClearanceRequired' | 'fireAccessRequirement'
  /* structure */
  | 'seismicMandatory' | 'peerReviewRequired' | 'structuralAuditSchedule'
  /* access */
  | 'accessibilityRequired'
  /* people */
  | 'licensedRole' | 'siteEngineerRequired'
  /* vehicles */
  | 'parkingRequirement' | 'evChargingProvision'
  /* services */
  | 'telecomRoomSpace' | 'ibsNocRequired'
  | 'rainwaterHarvestingRequired' | 'solarPvRequired' | 'solarWaterHeatingRequired'
  | 'solidWasteProvision' | 'treePlantingRequired' | 'environmentalCategory'
  /* social */
  | 'ewsLigReservation' | 'shelterFee'
  /* regularisation */
  | 'compoundableLimit' | 'compoundingFee' | 'nonCompoundable'
  /* procedure */
  | 'sanctionRoute'
  /* the last gate */
  | 'occupancyCertificateGate';

/** Every derived fact, for the exhaustiveness check the graph test runs. */
export const DERIVED_FACTS: readonly DerivedFact[] = [
  'baseFar', 'ceilingFar', 'farIncentive', 'purchasableSplit', 'purchaseGateOpen', 'purchaseFee',
  'requiredSetback', 'maxHeight', 'groundCoverageLimit',
  'useAllowed', 'minRoadWidth', 'minPlotArea', 'masterPlanZoneName', 'impactFee',
  'specialBuilding', 'fireClearanceRequired', 'fireAccessRequirement',
  'seismicMandatory', 'peerReviewRequired', 'structuralAuditSchedule',
  'accessibilityRequired',
  'licensedRole', 'siteEngineerRequired',
  'parkingRequirement', 'evChargingProvision',
  'telecomRoomSpace', 'ibsNocRequired',
  'rainwaterHarvestingRequired', 'solarPvRequired', 'solarWaterHeatingRequired',
  'solidWasteProvision', 'treePlantingRequired', 'environmentalCategory',
  'ewsLigReservation', 'shelterFee',
  'compoundableLimit', 'compoundingFee', 'nonCompoundable',
  'sanctionRoute', 'occupancyCertificateGate',
];

const DERIVED_SET: ReadonlySet<string> = new Set<string>(DERIVED_FACTS);

export function isDerived(fact: Fact): fact is DerivedFact {
  return DERIVED_SET.has(fact);
}

/**
 * What it means for two rules to establish the same fact.
 *
 * The conflict query rests on one premise: two rules answering the same question is a
 * disagreement. That is true of a height ceiling and false of a certificate gate. Fire,
 * telecom and environment each close the occupancy certificate, and none of them
 * contradicts the others — the building needs all three. Without the distinction the
 * query has only two things it can do with such a fact, and both are wrong: report three
 * independent clearances as a three-way conflict, or stay silent, in which case the
 * silence is indistinguishable from the silence over a fact nobody has looked at.
 *
 * Declaring it per fact is what makes `coverage.ts` able to say which silences are
 * answers. It is also the cheapest place to be honest: a reviewer deciding this for a new
 * fact has to say, in one word, whether a second rule answering it would be news.
 */
export type Combination =
  /**
   * Rivals. The producers answer one question, and different answers are a conflict —
   * which is the ordinary case, and the default for anything not obviously otherwise.
   */
  | 'rival'
  /**
   * Cumulative. Each producer adds an independent condition and they all hold at once, so
   * there is nothing for two producers to disagree about.
   */
  | 'cumulative';

/**
 * Every derived fact, and how its producers combine.
 *
 * Exhaustive by type, deliberately: a new fact cannot be added without answering this.
 */
export const FACT_COMBINATION: Readonly<Record<DerivedFact, Combination>> = {
  baseFar: 'rival', ceilingFar: 'rival', farIncentive: 'rival',
  purchasableSplit: 'rival', purchaseGateOpen: 'rival', purchaseFee: 'rival',
  requiredSetback: 'rival', maxHeight: 'rival', groundCoverageLimit: 'rival',
  useAllowed: 'rival', minRoadWidth: 'rival', minPlotArea: 'rival',
  masterPlanZoneName: 'rival', impactFee: 'rival',
  specialBuilding: 'rival', fireClearanceRequired: 'rival', fireAccessRequirement: 'rival',
  seismicMandatory: 'rival', peerReviewRequired: 'rival', structuralAuditSchedule: 'rival',
  accessibilityRequired: 'rival',
  licensedRole: 'rival', siteEngineerRequired: 'rival',
  parkingRequirement: 'rival', evChargingProvision: 'rival',
  telecomRoomSpace: 'rival', ibsNocRequired: 'rival',
  rainwaterHarvestingRequired: 'rival', solarPvRequired: 'rival',
  solarWaterHeatingRequired: 'rival', solidWasteProvision: 'rival',
  /**
   * Chapter 13's per-plot rate and Chapter 3's landscape rate are two obligations meeting
   * on one site, and the disposition for them says so — but they are still rivals here,
   * because a project plants ONE number of trees and the engine has to choose it. The
   * test is not whether the duties are independent; it is whether their answers can be in
   * tension. Here they can.
   */
  treePlantingRequired: 'rival',
  environmentalCategory: 'rival',
  ewsLigReservation: 'rival', shelterFee: 'rival',
  compoundableLimit: 'rival', compoundingFee: 'rival', nonCompoundable: 'rival',
  sanctionRoute: 'rival',
  /**
   * The one cumulative fact, and the reason the distinction exists. Clause 18.5.1.1 makes
   * the telecom installation a condition of the occupancy certificate, Clause 13.8 makes
   * the Environment Clearance one, and Clause 2.9.3.2 the fire NOC. Three clauses, three
   * duties, one certificate — and no disagreement anywhere in it.
   */
  occupancyCertificateGate: 'cumulative',
};

/**
 * Facts the graph names that `ProjectState` cannot supply. A rule consuming one of these
 * is a rule that answers with a caveat, and the graph counts them so the log does not
 * have to.
 */
export const UNSUPPLIED_FACTS: readonly GivenFact[] = [
  'floorCount', 'groundCoverage', 'dwellingUnits', 'unitCarpetArea',
  'hotelRooms', 'mixedUseLocation', 'todZone', 'ibsCoveredArea', 'zone',
  'approvedLayout', 'melaOrUnauthorisedArea',
];

/* ---- Guards ------------------------------------------------------------------------
 *
 * The RASE 'Applicability' limb: when a rule speaks at all. Deliberately the smallest
 * thing that expresses what we have actually met — a flat conjunction of interval
 * constraints, set memberships and flags. No disjunction: where the gazette states a
 * trigger with an "or" (Clause 2.9.3.2's "more than four floors OR 15 metres and more"),
 * each limb becomes its own node, which is how the gazette numbers them anyway.
 *
 * Flatness is what makes the conflict query decidable in a dozen lines rather than
 * needing a solver. Do not generalise this without a clause that demands it.
 * ---------------------------------------------------------------------------------- */

/** A half-open or closed interval on a numeric fact. Absent bound means unbounded. */
export interface RangeTerm {
  readonly fact: Fact;
  readonly min?: number;
  readonly max?: number;
  /** Default true: `min` is `>=`. False makes it `>`. */
  readonly minInclusive?: boolean;
  /** Default true: `max` is `<=`. False makes it `<`. */
  readonly maxInclusive?: boolean;
}

/** Set membership — occupancy, area type, green rating, use zone. */
export interface OneOfTerm {
  readonly fact: Fact;
  readonly values: readonly string[];
}

/** A boolean fact pinned either way. */
export interface FlagTerm {
  readonly fact: Fact;
  readonly is: boolean;
}

/** A conjunction. Every term must hold. An empty guard holds always. */
export interface Guard {
  readonly ranges?: readonly RangeTerm[];
  readonly oneOf?: readonly OneOfTerm[];
  readonly flags?: readonly FlagTerm[];
}

export const ALWAYS: Guard = {};

/** Every fact a guard mentions. */
export function guardFacts(guard: Guard): readonly Fact[] {
  return [
    ...(guard.ranges ?? []).map((t) => t.fact),
    ...(guard.oneOf ?? []).map((t) => t.fact),
    ...(guard.flags ?? []).map((t) => t.fact),
  ];
}

interface Interval { lo: number; loOpen: boolean; hi: number; hiOpen: boolean }

const FULL: Interval = { lo: -Infinity, loOpen: true, hi: Infinity, hiOpen: true };

function narrow(current: Interval, term: RangeTerm): Interval {
  const next = { ...current };
  if (term.min !== undefined) {
    const open = term.minInclusive === false;
    if (term.min > next.lo || (term.min === next.lo && open)) { next.lo = term.min; next.loOpen = open; }
  }
  if (term.max !== undefined) {
    const open = term.maxInclusive === false;
    if (term.max < next.hi || (term.max === next.hi && open)) { next.hi = term.max; next.hiOpen = open; }
  }
  return next;
}

function inhabited(i: Interval): boolean {
  if (i.lo > i.hi) return false;
  if (i.lo === i.hi) return !i.loOpen && !i.hiOpen;
  return true;
}

/**
 * Can both guards hold of one project at once?
 *
 * This is the whole conflict test. Two rules producing the same fact are only in conflict
 * if some real site satisfies both — a rule for shops and a rule for group housing produce
 * the same `ceilingFar` and never disagree, because no plot is both.
 *
 * Facts one guard constrains and the other does not are free, so silence is permission:
 * a rule that says nothing about occupancy speaks to every occupancy. That is what makes
 * the query find V-036, where three clauses gate the same certificate on three different
 * area words and no clause mentions the others' word at all.
 */
export function coSatisfiable(a: Guard, b: Guard): boolean {
  const intervals = new Map<Fact, Interval>();
  for (const term of [...(a.ranges ?? []), ...(b.ranges ?? [])]) {
    intervals.set(term.fact, narrow(intervals.get(term.fact) ?? FULL, term));
  }
  for (const i of intervals.values()) if (!inhabited(i)) return false;

  const sets = new Map<Fact, ReadonlySet<string>>();
  for (const term of [...(a.oneOf ?? []), ...(b.oneOf ?? [])]) {
    const existing = sets.get(term.fact);
    const incoming = new Set(term.values);
    if (!existing) { sets.set(term.fact, incoming); continue; }
    const both = new Set([...existing].filter((v) => incoming.has(v)));
    if (both.size === 0) return false;
    sets.set(term.fact, both);
  }

  const flags = new Map<Fact, boolean>();
  for (const term of [...(a.flags ?? []), ...(b.flags ?? [])]) {
    const seen = flags.get(term.fact);
    if (seen !== undefined && seen !== term.is) return false;
    flags.set(term.fact, term.is);
  }
  return true;
}
