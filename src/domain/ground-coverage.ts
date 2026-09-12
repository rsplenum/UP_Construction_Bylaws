/**
 * Clause 3.2.2 — how much of the plot the building may cover, and by what instrument.
 *
 * The app draws the setback envelope and labels it "you can build here", which is the right
 * answer and has never said why. That silence hides a question worth asking out loud,
 * because the obvious guess about it is wrong: most byelaws cap ground coverage with a
 * percentage, and a reader who assumes this one does will look for a 50% or 60% cap to clip
 * the envelope against.
 *
 * Clause 3.2.2 prints a "Ground Coverage (%)" column in all eight of its tables and puts no
 * percentage in it. Every row the engine's sixteen occupancies read says the same thing:
 *
 *     "Max. coverage after ensuring setbacks"
 *
 * and the chapters for group housing, commercial, healthcare, education, industry, bazaar
 * streets and auditoria each restate it in prose — "after ensuring minimum setback and
 * mandatory open space requirements, maximum ground coverage shall be permissible". The
 * setback envelope IS the cap. Nothing clips it.
 *
 * That is not a technicality about where to draw a rectangle. Clause 2.1.3.2's worked example
 * on paying for an increase in coverage takes a 500 m² plot at 20 m × 25 m and computes the
 * permissible coverage as **76 percent** — a figure no percentage-capped reading would
 * allow. An engine that clipped the envelope to 60% would under-report the buildable
 * footprint on that plot by a fifth and tell the applicant to build smaller than the
 * gazette permits. Over-restriction is the same class of defect as over-permission
 * (B-001, B-029) and harder to notice, because nobody complains that a compliance tool was
 * too strict.
 *
 * ## So what is this module for
 *
 * Three things the app could not do before.
 *
 * 1. **Say which instrument caps coverage**, with the clause. "The setbacks are the cap" is
 *    an answer; an unlabelled green rectangle is not.
 * 2. **Hold the envelope arithmetic once.** It was computed twice — in `SitePlan.tsx` at
 *    drawing scale and again in `findings.ts` for the viability check — and the two could
 *    drift. Both now read `resolveGroundCoverage`.
 * 3. **Carry the mechanism for a percentage cap that does bind**, dormant and tested. The
 *    gazette prints numeric coverage caps for four uses (`PRINTED_PERCENTAGE_CAPS`), none of
 *    which this engine has an occupancy for, and a master plan may impose its own tighter
 *    figure. When either arrives, `capPct` is where it goes and every consumer already
 *    honours it.
 *
 * ## The one cap that is real today, and is not ours to apply
 *
 * `src/data/upGisMasterPlanData.ts` carries zonal coverage figures — "65% Plotted / 40%
 * Group Housing", "35% Max" — against Development Authority zones. Those are master-plan
 * numbers, and a master plan can bind tighter than the byelaws. They are deliberately NOT
 * read here: that dataset is transcribed illustrative zoning, not a notified plan for the
 * user's plot, and wiring it into a statutory computation would present the engine's guess
 * about which polygon a plot sits in as law. `masterPlanCapNote` states the position
 * instead, which is the honest half of the answer and the only half available.
 */

import type { AreaType } from './far';
import type { OccupancyId } from './occupancy';
import type { RequiredSetbacks } from './setbacks';

/** What holds the footprint down. */
export type CoverageBasis =
  /** Clause 3.2.2 prints no percentage: whatever the setbacks leave is permissible. */
  | 'setback_limited'
  /** A printed percentage bites inside the setback envelope. */
  | 'percentage_cap';

/**
 * Clause 3.2.2's sub-clause per occupancy, so a finding can cite the row it read rather
 * than the chapter. Every one of these rows reads "Max. coverage after ensuring setbacks".
 */
const COVERAGE_CLAUSE: Readonly<Record<OccupancyId, string>> = {
  res_single: 'Clause 3.2.2.1',
  res_multi: 'Clause 3.2.2.1',
  res_group_housing: 'Clause 3.2.2.2',
  com_shop: 'Clause 3.2.2.3',
  com_complex: 'Clause 3.2.2.3',
  com_mall: 'Clause 3.2.2.3',
  com_hotel: 'Clause 3.2.2.3',
  com_bazaar: 'Clause 5.1.4, with Clause 3.2.2.3',
  office: 'Clause 3.2.2.3',
  inst_health: 'Clause 3.2.2.4',
  inst_education: 'Clause 3.2.2.5',
  inst_assembly: 'Clause 3.2.2.6',
  ind_light: 'Clause 3.2.2.7',
  ind_general: 'Clause 3.2.2.7',
  ind_warehouse: 'Clause 3.2.2.7',
  mixed_use: 'Clause 8.1.3, with Clause 3.2.2.3',
};

/** Gazette page for Clause 3.2.2's tables. */
export const COVERAGE_GAZETTE_PAGE = 46;

/**
 * The percentage coverage caps the gazette DOES print, and the uses they attach to.
 *
 * Not one of them maps onto an occupancy in `occupancy.ts`, so none can bind today. They
 * are held here for the same reason `setbacks.ts` holds `OTHER_COMMERCIAL_UNMAPPED`: a row
 * the gazette prints and the engine cannot reach is a gap, and a gap that is written down
 * is one somebody can close. Adding any of these occupancies means setting `capPct`.
 */
export const PRINTED_PERCENTAGE_CAPS: readonly {
  readonly use: string;
  readonly clause: string;
  readonly capPct: number;
  readonly appliesTo?: AreaType;
  readonly note: string;
}[] = [
  {
    use: 'Petrol pump / filling station (CNG/PNG/EV)',
    clause: 'Clause 5.5.5',
    capPct: 10,
    note: 'Built-up 10%, non-built-up 10%. FAR 0.1 and 0.15 respectively.',
  },
  {
    use: 'Filling station cum service station (CNG/PNG/EV)',
    clause: 'Clause 5.5.5',
    capPct: 20,
    appliesTo: 'built_up',
    note: 'Built-up 20% (FAR 0.2); non-built-up 10% (FAR 0.15).',
  },
  {
    use: 'Farmhouse — non-farm activities only',
    clause: 'Clause 3.2.2.7 with Clause 7.2',
    capPct: 20,
    note:
      'The farmhouse itself takes maximum coverage after setbacks. The 20% restricts the '
      + 'non-farm part of the plot, which is a different quantity from ground coverage.',
  },
  {
    use: 'Monastery, ashram or temple within 200 m of the Ganga at a major pilgrimage site',
    clause: 'Clause 2.11(i)(a)',
    capPct: 35,
    note:
      'The only place in the byelaws where a flat coverage percentage replaces the setback '
      + 'envelope outright. FAR 1.5. Every other activity in the 200 m belt is prohibited.',
  },
];

export interface GroundCoverageLimit {
  readonly basis: CoverageBasis;
  /** m² left inside the required setbacks. Exact — round at the point of display. */
  readonly envelopeSqm: number;
  readonly envelopeWidthM: number;
  readonly envelopeDepthM: number;
  /** The envelope as a share of the plot. */
  readonly envelopePct: number;
  /** The printed percentage cap, or null where the gazette prints none. */
  readonly capPct: number | null;
  /** That cap in m², or null. */
  readonly capSqm: number | null;
  /** The footprint that actually governs — the smaller of the envelope and any cap. */
  readonly governingSqm: number;
  readonly governingPct: number;
  /** True only when a printed percentage bites inside the setback envelope. */
  readonly restrictedByCap: boolean;
  readonly clauseRef: string;
  readonly gazettePage: number;
  /** One sentence naming the instrument that governs. */
  readonly basisNote: string;
  /** The standing caveat about master-plan coverage figures. */
  readonly masterPlanCapNote: string;
}

const positive = (n: unknown): number => Math.max(0, Number(n) || 0);
const round = (n: number, dp = 1): number => Number(n.toFixed(dp));

export const MASTER_PLAN_CAP_NOTE =
  'A master plan or zonal development plan may cap ground coverage below what the setbacks '
  + 'leave, and where it does, its figure governs. The engine does not hold the notified plan '
  + 'for any plot, so check the zonal regulations for your sector before relying on this.';

/**
 * The footprint the byelaws permit on this plot, and what limits it.
 *
 * `plotDepth` is the derived depth — pass `derivePlotDepth(project)` rather than the raw
 * field, so a project that states only area and frontage still resolves.
 */
export function resolveGroundCoverage(input: {
  readonly occupancy: OccupancyId;
  readonly plotAreaSqm: number;
  readonly plotFrontageM: number;
  readonly plotDepthM: number;
  readonly required: Pick<RequiredSetbacks, 'front' | 'rear' | 'side1' | 'side2'>;
  /**
   * A percentage cap from outside Clause 3.2.2 — a master plan figure the user has read off
   * their own zonal plan, or one of `PRINTED_PERCENTAGE_CAPS` once an occupancy reaches it.
   * Omitted means the gazette prints none, which is the case for all sixteen occupancies.
   */
  readonly capPct?: number | null;
}): GroundCoverageLimit {
  const plotArea = positive(input.plotAreaSqm);
  const frontage = positive(input.plotFrontageM);
  const depth = positive(input.plotDepthM);

  // Geometry is kept exact. Rounding it here would move the 2.4 m habitability boundary
  // `findings.ts` tests against by up to 5 mm, which is the class of numeric-edge defect
  // `bands.ts` exists to prevent. Callers round for display.
  const width = Math.max(0, frontage - positive(input.required.side1) - positive(input.required.side2));
  const usableDepth = Math.max(0, depth - positive(input.required.front) - positive(input.required.rear));
  const envelopeSqm = width * usableDepth;
  const envelopePct = plotArea > 0 ? round((envelopeSqm / plotArea) * 100) : 0;

  const capPct = input.capPct == null || !Number.isFinite(input.capPct) ? null : Math.max(0, input.capPct);
  const capSqm = capPct == null ? null : (plotArea * capPct) / 100;

  const restrictedByCap = capSqm != null && capSqm < envelopeSqm;
  const governingSqm = restrictedByCap ? capSqm! : envelopeSqm;
  const governingPct = plotArea > 0 ? round((governingSqm / plotArea) * 100) : 0;

  const clauseRef = COVERAGE_CLAUSE[input.occupancy] ?? 'Clause 3.2.2';

  return {
    basis: restrictedByCap ? 'percentage_cap' : 'setback_limited',
    envelopeSqm,
    envelopeWidthM: width,
    envelopeDepthM: usableDepth,
    envelopePct,
    capPct,
    capSqm,
    governingSqm,
    governingPct,
    restrictedByCap,
    clauseRef,
    gazettePage: COVERAGE_GAZETTE_PAGE,
    basisNote: restrictedByCap
      ? `Ground coverage is capped at ${capPct}% of the plot, which is ${round(governingSqm)} m² — `
        + `less than the ${round(envelopeSqm)} m² the setbacks leave. The cap governs.`
      : `${clauseRef} prints no coverage percentage: its Ground Coverage column reads "Max. `
        + `coverage after ensuring setbacks". The setbacks are the cap, so the whole `
        + `${round(envelopeSqm)} m² inside them may be covered — ${envelopePct}% of the plot.`,
    masterPlanCapNote: MASTER_PLAN_CAP_NOTE,
  };
}
