/**
 * What purchasable and premium purchasable FAR cost — Clause 9.2.5.
 *
 *     C = Le × Rc × P
 *
 *     C   the charge
 *     Le  proportional land requirement, FP ÷ Base FAR, in m²
 *     FP  the additional floor area actually taken, in m²
 *     Rc  the current rate of land
 *     P   a factor coefficient that depends on the land use
 *
 * Until now the engine computed purchasable FAR as a bare number of FAR points and never
 * priced it, even though `purchasableFarCategory` on every occupancy has always held
 * exactly the seven land-use categories this clause names. The field was built for this
 * table and had nothing behind it.
 *
 * The gazette prints a worked example alongside the formula, which is reproduced verbatim
 * as a test — the strongest check available, because it is the drafter's own arithmetic
 * rather than a reading of it.
 */

import type { PurchasableFarCategory } from './occupancy';

/**
 * Clause 9.2.5, "Factor coefficients as per land use". Residential (Plotted) has a dash
 * in the premium column, not a zero: plotted residential cannot buy premium purchasable
 * FAR at all, which is different from buying it for nothing.
 */
export const FACTOR_COEFFICIENTS: Readonly<Record<PurchasableFarCategory, {
  readonly purchasable: number;
  readonly premiumPurchasable: number | null;
}>> = {
  'Commercial': { purchasable: 0.50, premiumPurchasable: 1.0 },
  'Mixed Use': { purchasable: 0.45, premiumPurchasable: 0.9 },
  'Office Buildings / Institutional': { purchasable: 0.45, premiumPurchasable: 0.9 },
  'Hotels': { purchasable: 0.40, premiumPurchasable: 0.8 },
  'Residential (Plotted)': { purchasable: 0.40, premiumPurchasable: null },
  'Residential (Group Housing)': { purchasable: 0.40, premiumPurchasable: 0.8 },
  'Community Facilities & Infrastructure': { purchasable: 0.20, premiumPurchasable: 0.4 },
};

/**
 * Clause 9.3 Note II: "In case that the developer fails to achieve committed rating as per
 * pre-certification at the time of final occupancy, a penalty shall be imposed at the rate
 * 2 times of the land cost as per the circle rates for the additional FAR for the rating
 * not achieved."
 */
export const GREEN_RATING_SHORTFALL_PENALTY_MULTIPLE = 2;

const round2 = (n: number) => Math.round(n * 100) / 100;
const positive = (n: unknown) => Math.max(0, Number(n) || 0);

/**
 * Clause 9.2.3, columns (3) and (4) — how much of the headroom is ordinary purchasable FAR
 * before premium purchasable FAR begins, as a multiple of base FAR.
 *
 * The two coefficients in FACTOR_COEFFICIENTS differ by as much as 2.5× (commercial: 0.50
 * against 1.0), so a fee quoted without this split is not approximately right, it is the
 * wrong tranche at the wrong price. The gazette's worked example settles the order:
 * purchasable is availed to its permissible limit (2.5 of 2.5) before any premium is taken.
 *
 * Only columns (3) and (4) are used. Column (5) is the one V-029 records as mislabelled —
 * these two state their percentages against their own band's base and are self-consistent.
 *
 * Clause 9.2.3 Note-2 makes a per-chapter table prevail over this one where they differ.
 * `purchasable-far.json` holds those tables and `far.ts` does not yet read them, so this is
 * the general ladder standing in until it does — see V-030.
 */
export const PURCHASABLE_SHARE_BY_ROAD: readonly {
  readonly overMoreThan: number;
  readonly upToAndIncluding: number | null;
  readonly label: string;
  /** Column (3), as a multiple of base FAR. */
  readonly purchasable: number;
}[] = [
  { overMoreThan: 0, upToAndIncluding: 12, label: 'Up to 12m', purchasable: 0.20 },
  { overMoreThan: 12, upToAndIncluding: 24, label: '12 – 24m', purchasable: 0.50 },
  { overMoreThan: 24, upToAndIncluding: 45, label: '24 – 45m', purchasable: 1.00 },
  { overMoreThan: 45, upToAndIncluding: null, label: 'More than 45m', purchasable: 1.00 },
];

export interface TrancheSplit {
  readonly purchasable: number;
  readonly premiumPurchasable: number;
  readonly band: string;
  readonly purchasableCapacity: number;
}

/**
 * Split FAR points taken above base into the two priced tranches, cheaper one first.
 */
export function splitPurchasedFar(input: {
  farAboveBase: number;
  baseFar: number;
  roadWidth: number;
}): TrancheSplit {
  const taken = positive(input.farAboveBase);
  const baseFar = positive(input.baseFar);
  const road = positive(input.roadWidth);
  const band =
    PURCHASABLE_SHARE_BY_ROAD.find(
      (b) => road > b.overMoreThan && (b.upToAndIncluding === null || road <= b.upToAndIncluding),
    ) ?? PURCHASABLE_SHARE_BY_ROAD[0];
  const capacity = round2(baseFar * band.purchasable);
  const purchasable = Math.min(taken, capacity);
  return {
    purchasable: round2(purchasable),
    premiumPurchasable: round2(Math.max(0, taken - purchasable)),
    band: band.label,
    purchasableCapacity: capacity,
  };
}

export interface PurchaseLine {
  readonly kind: 'purchasable' | 'premiumPurchasable';
  /** FAR points taken, above what the band below already gives. */
  readonly farAvailed: number;
  /** FP — additional floor area, in m². */
  readonly additionalFloorAreaSqm: number;
  /** Le — proportional land requirement, in m². */
  readonly proportionalLandSqm: number;
  readonly factorCoefficient: number;
  readonly landRate: number;
  readonly charge: number;
  readonly working: string;
}

export interface PurchaseAssessment {
  readonly lines: readonly PurchaseLine[];
  readonly totalCharge: number;
  readonly caveats: readonly string[];
  readonly clauseRef: string;
}

export interface PurchaseInput {
  category: PurchasableFarCategory;
  /** Base FAR for the occupancy, area type and road. The divisor in Le = FP ÷ Base FAR. */
  baseFar: number;
  plotAreaSqm: number;
  /**
   * Rc. Clause 9.2.5 Note: "the circle rate determined by the District Magistrate, where
   * such rate is not available, the current residential rate determined by the Authority
   * / Awas Vikas Parishad whichever is higher."
   */
  landRate: number;
  /** FAR points of ordinary purchasable FAR actually taken. */
  purchasableFarAvailed: number;
  /** FAR points of premium purchasable FAR actually taken. */
  premiumPurchasableFarAvailed?: number;
}

export function assessPurchaseFee(input: PurchaseInput): PurchaseAssessment {
  const baseFar = positive(input.baseFar);
  const plotArea = positive(input.plotAreaSqm);
  const landRate = positive(input.landRate);
  const coefficients = FACTOR_COEFFICIENTS[input.category];
  const lines: PurchaseLine[] = [];
  const caveats: string[] = [];

  const line = (
    kind: PurchaseLine['kind'],
    farAvailed: number,
    factor: number | null,
  ): void => {
    if (farAvailed <= 0) return;
    if (factor === null) {
      caveats.push(
        `Clause 9.2.5 gives ${input.category} no premium purchasable coefficient — the `
        + 'column holds a dash, so premium purchasable FAR is not available to this use '
        + 'at any price.');
      return;
    }
    if (baseFar <= 0) {
      caveats.push('Le is FP ÷ Base FAR, so the charge cannot be computed with a zero base FAR.');
      return;
    }
    // FP is the floor area taken; Le converts it back to the land it would have needed.
    const fp = farAvailed * plotArea;
    const le = fp / baseFar;
    lines.push({
      kind,
      farAvailed: round2(farAvailed),
      additionalFloorAreaSqm: round2(fp),
      proportionalLandSqm: round2(le),
      factorCoefficient: factor,
      landRate,
      charge: round2(le * landRate * factor),
      working: `FP ${round2(fp)} m² ÷ base FAR ${baseFar} = Le ${round2(le)} m² `
        + `× ₹${landRate.toLocaleString('en-IN')}/m² × ${factor}`,
    });
  };

  line('purchasable', positive(input.purchasableFarAvailed), coefficients.purchasable);
  line('premiumPurchasable', positive(input.premiumPurchasableFarAvailed),
       coefficients.premiumPurchasable);

  return {
    lines,
    totalCharge: round2(lines.reduce((sum, l) => sum + l.charge, 0)),
    caveats,
    clauseRef: 'Clause 9.2.5 (C = Le × Rc × P)',
  };
}

/** Clause 9.3 Note II — the penalty for not reaching a pre-certified green rating. */
export function greenRatingShortfallPenalty(input: {
  /** FAR points of green incentive awarded for the rating that was not achieved. */
  unearnedFarPoints: number;
  plotAreaSqm: number;
  circleRate: number;
}): number {
  const area = positive(input.unearnedFarPoints) * positive(input.plotAreaSqm);
  return round2(area * positive(input.circleRate) * GREEN_RATING_SHORTFALL_PENALTY_MULTIPLE);
}
