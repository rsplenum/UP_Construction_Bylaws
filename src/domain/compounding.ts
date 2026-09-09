/**
 * Compounding (शमन शुल्क) — the single source of truth.
 *
 * The app previously quoted three different fees for the same deviation: the visualizer
 * charged 50–100% of the circle rate plus a 10% surcharge, the calculator charged
 * 50–200% of land price plus flat per-sqm rates, and the data layer carried a fourth
 * per-sqm slab schedule that nothing read. It also quoted a fee for deviations that
 * Chapter 16.3.2 makes non-compoundable at any price. Both are fixed here.
 */

import type { Occupancy } from './project';
import { COMPOUNDABLE_SETBACK_LIMITS, SetbackFace } from './setbacks';

export type CompoundingUse = 'residential' | 'commercial' | 'office' | 'industrial' | 'facilities';

/** Chapter 16.3.2 — deviations that cannot be regularised at any fee. */
export interface NonCompoundableFlags {
  onPublicLandOrAmenity: boolean;
  inIllegalColony: boolean;
  onDisputedLand: boolean;
  breachesFireSafety: boolean;
  breachesHeritageOrAirportHeightCap: boolean;
  encroachesWaterBody: boolean;
  /** Set when the building is >15m: fire-tender setbacks are never compoundable. */
  highRiseFireSetbackDeficit: boolean;
}

export const NON_COMPOUNDABLE_REASONS: Readonly<Record<keyof NonCompoundableFlags, string>> = {
  onPublicLandOrAmenity: 'Construction on public land, road reserve, park or amenity plot (Clause 16.3.2 i, iv)',
  inIllegalColony: 'Plot lies in an unauthorised / illegal colony (Clause 16.3.2 iii)',
  onDisputedLand: 'Title of the land is under dispute (Clause 16.3.2 v)',
  breachesFireSafety: 'Deviation breaches mandatory fire-safety provisions (Clause 16.3.2 vii)',
  breachesHeritageOrAirportHeightCap: 'Height breaches a heritage precinct or airport funnel cap (Clause 16.3.2 vi)',
  encroachesWaterBody: 'Construction encroaches a water body or its statutory buffer (Clause 16.3.2 viii)',
  highRiseFireSetbackDeficit: 'Fire-tender setback deficit on a building above 15m (Clause 16.3.2 ii)',
};

/**
 * Chapter 16 fee schedule, as a multiplier on the district circle rate per sqm of the
 * deviation. Keeping every rate in one table means a gazette revision is one edit.
 *
 * VERIFY AGAINST GAZETTE SCHEDULE before relying on the figures for a real assessment.
 */
export const COMPOUNDING_RATE_MULTIPLIERS: Readonly<Record<SetbackFace | 'excessFar' | 'height', Readonly<Record<CompoundingUse, number>>>> = {
  front:     { residential: 1.00, commercial: 2.00, office: 1.50, industrial: 0.40, facilities: 0.50 },
  rear:      { residential: 0.50, commercial: 1.00, office: 0.75, industrial: 0.20, facilities: 0.25 },
  side1:     { residential: 0.75, commercial: 1.50, office: 1.00, industrial: 0.30, facilities: 0.38 },
  side2:     { residential: 0.75, commercial: 1.50, office: 1.00, industrial: 0.30, facilities: 0.38 },
  excessFar: { residential: 0.50, commercial: 1.00, office: 0.75, industrial: 0.20, facilities: 0.25 },
  height:    { residential: 0.25, commercial: 0.50, office: 0.38, industrial: 0.10, facilities: 0.13 },
};

/** Administrative surcharge levied on the assessed compounding fee. */
export const ADMIN_SURCHARGE_FRACTION = 0.10;

/** Chapter 16.3 ceiling on excess FAR that may be compounded, as a fraction of permissible FAR. */
export const COMPOUNDABLE_FAR_LIMIT = 0.10;
/** Chapter 16.3 ceiling on height deviation that may be compounded. */
export const COMPOUNDABLE_HEIGHT_LIMIT = 0.10;

export interface CompoundingLineItem {
  readonly id: string;
  readonly label: string;
  readonly quantity: number;
  readonly unit: string;
  readonly rateMultiplier: number;
  readonly ratePerUnit: number;
  readonly amount: number;
  readonly basis: string;
  readonly withinStatutoryLimit: boolean;
  readonly limitNote?: string;
}

export interface CompoundingAssessment {
  readonly isCompoundable: boolean;
  readonly blockingReasons: readonly string[];
  readonly lineItems: readonly CompoundingLineItem[];
  readonly assessedFee: number;
  readonly adminSurcharge: number;
  readonly totalPayable: number;
  /** Line items that exceed a Chapter 16.3 ceiling and therefore cannot be regularised. */
  readonly overLimitItems: readonly CompoundingLineItem[];
  readonly clauseRef: string;
}

export interface CompoundingInput {
  use: CompoundingUse;
  occupancy?: Occupancy;
  /** ₹ per sqm */
  circleRate: number;
  flags: Partial<NonCompoundableFlags>;
  /** Encroachment into each setback, in sqm of footprint. */
  setbackEncroachmentSqm: Partial<Record<SetbackFace, number>>;
  /** Deficit on each face as a fraction of the required setback, used for the Chapter 16.3 caps. */
  setbackDeficitFraction?: Partial<Record<SetbackFace, number>>;
  /** sqm of built-up area beyond the permissible FAR. */
  excessFarSqm: number;
  /** Excess FAR as a fraction of permissible, used for the 10% cap. */
  excessFarFraction?: number;
  /** m of height beyond the permissible cap. */
  heightDeviationM: number;
  heightDeviationFraction?: number;
  /** Footprint area used to price a height deviation, in sqm. */
  heightDeviationFootprintSqm?: number;
}

const money = (n: number): number => Math.round(n * 100) / 100;

export function assessCompounding(input: CompoundingInput): CompoundingAssessment {
  const circleRate = Math.max(0, Number(input.circleRate) || 0);

  const blockingReasons = (Object.keys(NON_COMPOUNDABLE_REASONS) as (keyof NonCompoundableFlags)[])
    .filter((key) => input.flags[key])
    .map((key) => NON_COMPOUNDABLE_REASONS[key]);

  if (blockingReasons.length > 0) {
    return {
      isCompoundable: false,
      blockingReasons,
      lineItems: [],
      assessedFee: 0,
      adminSurcharge: 0,
      totalPayable: 0,
      overLimitItems: [],
      clauseRef: 'Clause 16.3.2 (Non-Compoundable Deviations)',
    };
  }

  const lineItems: CompoundingLineItem[] = [];
  const faces: SetbackFace[] = ['front', 'rear', 'side1', 'side2'];
  const faceLabels: Record<SetbackFace, string> = {
    front: 'Front setback', rear: 'Rear setback', side1: 'Side-1 setback', side2: 'Side-2 setback',
  };

  for (const face of faces) {
    const qty = Math.max(0, Number(input.setbackEncroachmentSqm[face]) || 0);
    if (qty <= 0) continue;

    const multiplier = COMPOUNDING_RATE_MULTIPLIERS[face][input.use];
    const ratePerUnit = circleRate * multiplier;
    const deficitFraction = input.setbackDeficitFraction?.[face] ?? 0;
    const limit = COMPOUNDABLE_SETBACK_LIMITS[face];
    const within = deficitFraction <= limit + 1e-9;

    lineItems.push({
      id: `setback-${face}`,
      label: `${faceLabels[face]} encroachment`,
      quantity: qty,
      unit: 'sqm',
      rateMultiplier: multiplier,
      ratePerUnit: money(ratePerUnit),
      amount: money(qty * ratePerUnit),
      basis: `${(multiplier * 100).toFixed(0)}% of circle rate (₹${circleRate.toLocaleString('en-IN')}/sqm)`,
      withinStatutoryLimit: within,
      limitNote: within
        ? undefined
        : `Deficit is ${(deficitFraction * 100).toFixed(0)}% of the required setback; Chapter 16.3 caps ${faceLabels[face].toLowerCase()} compounding at ${(limit * 100).toFixed(0)}%.`,
    });
  }

  const excessFar = Math.max(0, Number(input.excessFarSqm) || 0);
  if (excessFar > 0) {
    const multiplier = COMPOUNDING_RATE_MULTIPLIERS.excessFar[input.use];
    const ratePerUnit = circleRate * multiplier;
    const fraction = input.excessFarFraction ?? 0;
    const within = fraction <= COMPOUNDABLE_FAR_LIMIT + 1e-9;
    lineItems.push({
      id: 'excess-far',
      label: 'Built-up area beyond permissible FAR',
      quantity: excessFar,
      unit: 'sqm',
      rateMultiplier: multiplier,
      ratePerUnit: money(ratePerUnit),
      amount: money(excessFar * ratePerUnit),
      basis: `${(multiplier * 100).toFixed(0)}% of circle rate (₹${circleRate.toLocaleString('en-IN')}/sqm)`,
      withinStatutoryLimit: within,
      limitNote: within
        ? undefined
        : `Excess is ${(fraction * 100).toFixed(1)}% of permissible FAR; Chapter 16.3 caps FAR compounding at ${(COMPOUNDABLE_FAR_LIMIT * 100).toFixed(0)}%.`,
    });
  }

  const heightDev = Math.max(0, Number(input.heightDeviationM) || 0);
  if (heightDev > 0) {
    const multiplier = COMPOUNDING_RATE_MULTIPLIERS.height[input.use];
    const footprint = Math.max(0, Number(input.heightDeviationFootprintSqm) || 0);
    const ratePerUnit = circleRate * multiplier * Math.max(1, footprint / 100);
    const fraction = input.heightDeviationFraction ?? 0;
    const within = fraction <= COMPOUNDABLE_HEIGHT_LIMIT + 1e-9;
    lineItems.push({
      id: 'height',
      label: 'Height beyond permissible cap',
      quantity: heightDev,
      unit: 'running m',
      rateMultiplier: multiplier,
      ratePerUnit: money(ratePerUnit),
      amount: money(heightDev * ratePerUnit),
      basis: `${(multiplier * 100).toFixed(0)}% of circle rate per 100 sqm of footprint, per running metre`,
      withinStatutoryLimit: within,
      limitNote: within
        ? undefined
        : `Deviation is ${(fraction * 100).toFixed(1)}% of the permissible height; Chapter 16.3 caps height compounding at ${(COMPOUNDABLE_HEIGHT_LIMIT * 100).toFixed(0)}%.`,
    });
  }

  const overLimitItems = lineItems.filter((i) => !i.withinStatutoryLimit);
  const assessedFee = money(lineItems.reduce((sum, i) => sum + i.amount, 0));
  const adminSurcharge = money(assessedFee * ADMIN_SURCHARGE_FRACTION);

  return {
    isCompoundable: overLimitItems.length === 0,
    blockingReasons: overLimitItems.map((i) => i.limitNote!).filter(Boolean),
    lineItems,
    assessedFee,
    adminSurcharge,
    totalPayable: money(assessedFee + adminSurcharge),
    overLimitItems,
    clauseRef: 'Chapter 16.3 (Compounding Schedule) & Clause 16.3.2 (Exclusions)',
  };
}
