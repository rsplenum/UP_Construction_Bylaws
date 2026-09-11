/**
 * Floor Area Ratio — the single source of truth.
 *
 * Before this module, the same plot produced three different Base FAR values depending on
 * which tab the user was standing on (a 2000 sqm plot resolved to 1.485 / 1.363 / 1.262).
 * Every screen now calls `resolveBaseFar`, so a correction to the gazette figures is a
 * one-line change here rather than a hunt through four components.
 */

import { Band, assertContiguousLadder, resolveBand } from './bands';
import type { GreenRating } from './project';
import { OccupancyId, getOccupancy } from './occupancy';

export interface FarSlab extends Band {
  readonly index: number;
  readonly label: string;
  /** Plot area, in sqm, that this slab can absorb. */
  readonly capacity: number;
  readonly far: number;
}

/**
 * Section 3.2.2 / 3.2.2.1 — telescopic ladder for plotted residential land.
 *
 * VERIFY AGAINST GAZETTE before relying on the figures for a statutory submission.
 * These are the only FAR numbers in the codebase; changing them changes every screen.
 */
export const RESIDENTIAL_TELESCOPIC_SLABS: readonly FarSlab[] = [
  { index: 1, label: 'Up to 150 sqm',     overMoreThan: 0,    upToAndIncluding: 150,      capacity: 150,      far: 2.0 },
  { index: 2, label: '>150 to 300 sqm',   overMoreThan: 150,  upToAndIncluding: 300,      capacity: 150,      far: 1.8 },
  { index: 3, label: '>300 to 500 sqm',   overMoreThan: 300,  upToAndIncluding: 500,      capacity: 200,      far: 1.75 },
  { index: 4, label: '>500 to 1200 sqm',  overMoreThan: 500,  upToAndIncluding: 1200,     capacity: 700,      far: 1.5 },
  { index: 5, label: '>1200 sqm',         overMoreThan: 1200, upToAndIncluding: Infinity, capacity: Infinity, far: 1.25 },
];

assertContiguousLadder('RESIDENTIAL_TELESCOPIC_SLABS', RESIDENTIAL_TELESCOPIC_SLABS);

/**
 * Section 3.2.2.2 / 4.2.8 / 5.2.5 — road width sets the CEILING, not the base.
 *
 * VERIFIED against the gazette, 2026-09-10. The engine previously had this backwards:
 * it escalated Base FAR with road width (1.75 → 2.5 for group housing) and derived a
 * ceiling by adding a purchasable increment. The gazette holds Base FAR flat per
 * occupancy and area type, and uses road width to set Max FAR — the amount of purchasable
 * FAR available is the difference between them.
 *
 * Gazette, Residential – Group Housing:
 *   Built-up      base 1.50   max: 9–12m 2.0 | >12–18m 3.0 | >18–24m 3.0 | >24–45m 5.25 | >45m unrestricted
 *   Non-built-up  base 2.50   max: … >24–45m 8.75 | >45m unrestricted
 * Gazette, Commercial – Shops / Convenience / Commercial Units:
 *   Built-up      base 1.50   max: ≤12m 2.1 | >12–24m 3.0 | >24–45m 5.0 | >45m unrestricted
 *   Non-built-up  base 1.75   max: ≤12m 2.45 | >12–24m 3.5 | …
 */
/** Whether the site sits inside an already built-up area or a new layout. */
export type AreaType = 'built_up' | 'non_built_up';

export interface RoadFarBand extends Band {
  readonly label: string;
  /** Ceiling on total FAR at this road width. Infinity where the gazette says unrestricted. */
  readonly maxFar: number;
}

/**
 * Max FAR is keyed on road width AND area type. The gazette prints a separate row for
 * every occupancy in each of "(Built up)" and "(Non-Built up)", and they do not carry
 * the same ceilings — non-built-up group housing on a 30 m road tops out at 8.75, not
 * 5.25. The engine held one ladder per occupancy and applied the built-up ceilings to
 * both, understating a new layout's entitlement by up to 3.5 FAR (B-013).
 *
 * Non-built-up group housing has no band below 12 m: the gazette's first row is
 * ">12 - 18m". A 9 m road carries group housing in a built-up area and not in a new
 * layout, so the zero band here is the gazette's silence, not a rounding.
 */
export const GROUP_HOUSING_MAX_FAR: Readonly<Record<AreaType, readonly RoadFarBand[]>> = {
  built_up: [
    { label: 'Below 9m',    overMoreThan: 0,  upToAndIncluding: 9,        maxFar: 0 },
    { label: '9 to 12m',    overMoreThan: 9,  upToAndIncluding: 12,       maxFar: 2.0 },
    { label: '>12 to 18m',  overMoreThan: 12, upToAndIncluding: 18,       maxFar: 3.0 },
    { label: '>18 to 24m',  overMoreThan: 18, upToAndIncluding: 24,       maxFar: 3.0 },
    { label: '>24 to 45m',  overMoreThan: 24, upToAndIncluding: 45,       maxFar: 5.25 },
    { label: '>45m',        overMoreThan: 45, upToAndIncluding: Infinity, maxFar: Infinity },
  ],
  non_built_up: [
    { label: 'Up to 12m',   overMoreThan: 0,  upToAndIncluding: 12,       maxFar: 0 },
    { label: '>12 to 18m',  overMoreThan: 12, upToAndIncluding: 18,       maxFar: 5.0 },
    { label: '>18 to 24m',  overMoreThan: 18, upToAndIncluding: 24,       maxFar: 5.0 },
    { label: '>24 to 45m',  overMoreThan: 24, upToAndIncluding: 45,       maxFar: 8.75 },
    { label: '>45m',        overMoreThan: 45, upToAndIncluding: Infinity, maxFar: Infinity },
  ],
};

/**
 * Gazette row 3(a)/3(b), "Shops / Convenience Shopping / Commercial Units".
 *
 * The gazette's first band is "Up to 12m" with no floor under it. The 9 m floor below is
 * the engine's, not the byelaw's — a road narrower than 9 m is unlikely to carry a
 * commercial frontage, but the gazette does not say so here. Logged as V-007.
 */
export const COMMERCIAL_MAX_FAR: Readonly<Record<AreaType, readonly RoadFarBand[]>> = {
  built_up: [
    { label: 'Below 9m',    overMoreThan: 0,  upToAndIncluding: 9,        maxFar: 0 },
    { label: 'Up to 12m',   overMoreThan: 9,  upToAndIncluding: 12,       maxFar: 2.1 },
    { label: '>12 to 24m',  overMoreThan: 12, upToAndIncluding: 24,       maxFar: 3.0 },
    { label: '>24 to 45m',  overMoreThan: 24, upToAndIncluding: 45,       maxFar: 5.0 },
    { label: '>45m',        overMoreThan: 45, upToAndIncluding: Infinity, maxFar: Infinity },
  ],
  non_built_up: [
    { label: 'Below 9m',    overMoreThan: 0,  upToAndIncluding: 9,        maxFar: 0 },
    { label: 'Up to 12m',   overMoreThan: 9,  upToAndIncluding: 12,       maxFar: 2.45 },
    { label: '>12 to 24m',  overMoreThan: 12, upToAndIncluding: 24,       maxFar: 3.5 },
    { label: '>24 to 45m',  overMoreThan: 24, upToAndIncluding: 45,       maxFar: 6.0 },
    { label: '>45m',        overMoreThan: 45, upToAndIncluding: Infinity, maxFar: Infinity },
  ],
};

/**
 * Clause 8.1.3.1 — mixed-use development has its own table, and it is not the commercial
 * one the engine had been reading.
 *
 * Mixed use was assessed on rows 3(a)/3(b), written for shops: base 1.5 built-up and
 * 1.75 in a new layout. Chapter 8 gives it base 2.0 and 2.5, so every mixed-use project
 * was told it had between a quarter and a third less base floor area than the byelaws
 * allow. Chapter 3's matrix has no mixed-use row at all, so unlike every other
 * cross-chapter conflict so far there is no second figure to fall back on: this table is
 * the only one the byelaws print for the use.
 *
 * Two of its eight cells contradict themselves and both are resolved to the lowest
 * reading the clause supports — 4.5 rather than the printed 5.25 at >24–45 m built-up,
 * and the printed 6.25 rather than the components' 8.75 in a new layout. The reasoning
 * is in GAZETTE_ARITHMETIC_DEFECTS, and `purchasable-far.test.ts` asserts that the two
 * ladders below still agree with `strictCeiling` on the extracted rows, so neither can
 * be edited into disagreeing with the gazette quietly.
 *
 * The floor is the gazette's own, not the engine's: Clause 8.1.3 puts the means of
 * access for the most permissive location — a plot of up to 100 m² in a mixed-use zone —
 * at 9 m, and every other location at 12 m or 24 m, so below 9 m no mixed use is
 * permissible anywhere. That is the distinction V-007 records for the commercial ladder,
 * where the same 9 m floor is an inference the gazette does not state.
 */
export const MIXED_USE_MAX_FAR: Readonly<Record<AreaType, readonly RoadFarBand[]>> = {
  built_up: [
    { label: 'Below 9m',    overMoreThan: 0,  upToAndIncluding: 9,        maxFar: 0 },
    { label: 'Up to 12m',   overMoreThan: 9,  upToAndIncluding: 12,       maxFar: 2.0 },
    { label: '>12 to 24m',  overMoreThan: 12, upToAndIncluding: 24,       maxFar: 4.0 },
    { label: '>24 to 45m',  overMoreThan: 24, upToAndIncluding: 45,       maxFar: 4.5 },
    { label: '>45m',        overMoreThan: 45, upToAndIncluding: Infinity, maxFar: Infinity },
  ],
  non_built_up: [
    { label: 'Below 9m',    overMoreThan: 0,  upToAndIncluding: 9,        maxFar: 0 },
    { label: 'Up to 12m',   overMoreThan: 9,  upToAndIncluding: 12,       maxFar: 2.5 },
    { label: '>12 to 24m',  overMoreThan: 12, upToAndIncluding: 24,       maxFar: 5.0 },
    { label: '>24 to 45m',  overMoreThan: 24, upToAndIncluding: 45,       maxFar: 6.25 },
    { label: '>45m',        overMoreThan: 45, upToAndIncluding: Infinity, maxFar: Infinity },
  ],
};

for (const areaType of ['built_up', 'non_built_up'] as const) {
  assertContiguousLadder(`GROUP_HOUSING_MAX_FAR.${areaType}`, GROUP_HOUSING_MAX_FAR[areaType]);
  assertContiguousLadder(`COMMERCIAL_MAX_FAR.${areaType}`, COMMERCIAL_MAX_FAR[areaType]);
  assertContiguousLadder(`MIXED_USE_MAX_FAR.${areaType}`, MIXED_USE_MAX_FAR[areaType]);
}

/** Base FAR is a property of the occupancy and the area type, not of the road. */
export const BASE_FAR: Readonly<
  Record<'group_housing' | 'commercial' | 'mixed_use', Record<AreaType, number>>
> = {
  group_housing: { built_up: 1.5, non_built_up: 2.5 },
  commercial:    { built_up: 1.5, non_built_up: 1.75 },
  mixed_use:     { built_up: 2.0, non_built_up: 2.5 },
};

/**
 * Ceiling on total FAR for plotted residential, from the gazette's own table: Max FAR is
 * 2.0 in every band, whatever the base works out to. The engine previously added a
 * purchasable increment on top of the telescopic base and so permitted up to 2.4.
 */
export const PLOTTED_RESIDENTIAL_MAX_FAR = 2.0;

/**
 * Chapter 9.3 — green-building incentive, as a fraction of the FAR availed.
 *
 * VERIFIED against the gazette, 2026-09-10: "3% / 5% / 7% additional FAR on availed FAR",
 * and "This incentive FAR on Green Buildings shall be over and above the MFAR". The
 * engine previously folded this into the Base FAR and then capped the result, which both
 * understated the entitlement and consumed purchasable headroom that the gazette does not
 * touch. It is granted above the ceiling, not inside it.
 */
export const GREEN_FAR_BONUS: Readonly<Record<GreenRating, number>> = {
  none: 0,
  silver: 0.03,
  gold: 0.05,
  platinum: 0.07,
};

export interface SlabContribution {
  readonly index: number;
  readonly label: string;
  readonly plotAreaInSlab: number;
  readonly far: number;
  readonly builtUpArea: number;
}

export interface BaseFarResult {
  readonly plotArea: number;
  readonly baseFar: number;
  readonly baseBuiltUpArea: number;
  /** Base FAR uplifted by the green-building incentive. */
  readonly effectiveBaseFar: number;
  readonly effectiveBuiltUpArea: number;
  readonly greenBonusFraction: number;
  /**
   * The Max FAR the gazette prints for this occupancy, area type and road width, before
   * Chapter 9.2.1's bar on purchasing below a 12 m road. Exposed so the ladder can be
   * checked against the table it came from: `maxPermissibleFar` folds in that bar and so
   * reads lower than the gazette's own figure on a narrow road.
   */
  readonly ceilingFar: number;
  /** Extra FAR the project may purchase at this road width (0 when barred). */
  readonly purchasableFar: number;
  /** Absolute ceiling: effective base + purchasable. Nothing may be sanctioned beyond this. */
  readonly maxPermissibleFar: number;
  readonly maxPermissibleBuiltUpArea: number;
  /** Populated only for the telescopic residential ladder. */
  readonly slabs: readonly SlabContribution[];
  /** Human-readable derivation, shown verbatim in the UI and the PDF. */
  readonly workings: string;
  readonly clauseRef: string;
  /** Non-fatal notes: assumptions applied, thresholds not met. */
  readonly caveats: readonly string[];
}

const round = (n: number, dp = 3): number => Number(n.toFixed(dp));

/** Minimum abutting road width, in metres, below which no FAR may be purchased (Chapter 9.2.1). */
export const PURCHASABLE_FAR_MIN_ROAD_WIDTH = 12;

export function resolveBaseFar(input: {
  occupancy: OccupancyId;
  plotArea: number;
  roadWidth: number;
  greenRating?: GreenRating;
  /** Defaults to built-up, the more restrictive of the two. */
  areaType?: AreaType;
}): BaseFarResult {
  const definition = getOccupancy(input.occupancy);
  const plotArea = Math.max(0, Number(input.plotArea) || 0);
  const roadWidth = Math.max(0, Number(input.roadWidth) || 0);
  const areaType: AreaType = input.areaType ?? 'built_up';
  const greenBonusFraction = GREEN_FAR_BONUS[input.greenRating ?? 'none'] ?? 0;
  const caveats: string[] = [];

  let baseFar = 0;
  let ceilingFar = 0;
  let workings = '';
  let clauseRef = '';
  const slabs: SlabContribution[] = [];

  if (plotArea === 0) {
    return {
      plotArea: 0, baseFar: 0, baseBuiltUpArea: 0, effectiveBaseFar: 0, effectiveBuiltUpArea: 0,
      greenBonusFraction, ceilingFar: 0, purchasableFar: 0, maxPermissibleFar: 0, maxPermissibleBuiltUpArea: 0,
      slabs: [], workings: 'Plot area is zero — no FAR can be derived.',
      clauseRef: 'Chapter 3.2.2', caveats: ['Enter a plot area to compute FAR.'],
    };
  }

  if (definition.farBasis === 'telescopic_plotted') {
    clauseRef = 'Section 3.2.2 & 3.2.2.1 (Telescopic ladder), verified against the gazette';
    let remaining = plotArea;
    let totalBuiltUp = 0;

    for (const slab of RESIDENTIAL_TELESCOPIC_SLABS) {
      if (remaining <= 0) break;
      const areaInSlab = Math.min(remaining, slab.capacity);
      const builtUp = areaInSlab * slab.far;
      slabs.push({
        index: slab.index, label: slab.label,
        plotAreaInSlab: round(areaInSlab, 2), far: slab.far, builtUpArea: round(builtUp, 2),
      });
      totalBuiltUp += builtUp;
      remaining -= areaInSlab;
    }

    baseFar = round(totalBuiltUp / plotArea);
    ceilingFar = PLOTTED_RESIDENTIAL_MAX_FAR;
    workings = slabs.map((s) => `${s.plotAreaInSlab} × ${s.far}`).join(' + ')
      + ` = ${round(totalBuiltUp, 2)} sqm ÷ ${plotArea} sqm = FAR ${baseFar}`;
  } else {
    const key = ({
      road_width_group_housing: 'group_housing',
      road_width_commercial: 'commercial',
      road_width_mixed_use: 'mixed_use',
    } as const)[definition.farBasis];
    const table = {
      group_housing: GROUP_HOUSING_MAX_FAR,
      commercial: COMMERCIAL_MAX_FAR,
      mixed_use: MIXED_USE_MAX_FAR,
    }[key][areaType];
    clauseRef = {
      group_housing: 'Section 3.2.2.2 & 4.2.8 (Group Housing), verified against the gazette',
      commercial: 'Section 5.2.5 (Commercial), verified against the gazette',
      mixed_use: 'Clause 8.1.3.1 (Mixed use), verified against the gazette',
    }[key];

    baseFar = BASE_FAR[key][areaType];

    const resolved = resolveBand(table, roadWidth);
    if (!resolved.ok) {
      caveats.push(`Road width ${roadWidth}m could not be matched to a FAR band; no ceiling applied.`);
      ceilingFar = baseFar;
      workings = `No FAR band matches a ${roadWidth}m road.`;
    } else {
      ceilingFar = resolved.band.maxFar;
      const ceilingText = Number.isFinite(ceilingFar) ? String(ceilingFar) : 'unrestricted';
      workings = `Base FAR ${baseFar} (${areaType.replace(/_/g, '-')}), ceiling for a ${roadWidth}m road (${resolved.band.label}) is ${ceilingText}`;
      if (ceilingFar === 0) {
        caveats.push(
          `A ${roadWidth}m road is below the minimum right-of-way for ${definition.label.toLowerCase()} in a ${areaType.replace(/_/g, '-')} area; no FAR is sanctionable.`,
        );
        baseFar = 0;
      }
    }
  }

  // Base FAR is what the ladder gives; the green incentive does not alter it.
  const effectiveBaseFar = baseFar;

  // Purchasable FAR is the gap between base and the ceiling, and Chapter 9.2.1 bars
  // buying any of it below a 12 m road.
  const canPurchase = roadWidth >= PURCHASABLE_FAR_MIN_ROAD_WIDTH;
  const headroom = Number.isFinite(ceilingFar) ? Math.max(0, round(ceilingFar - baseFar)) : Infinity;
  const purchasableFar = canPurchase ? headroom : 0;
  if (!canPurchase && headroom > 0) {
    caveats.push(
      `Purchasable FAR is barred: the abutting road is ${roadWidth}m, below the ${PURCHASABLE_FAR_MIN_ROAD_WIDTH}m threshold (Chapter 9.2.1).`,
    );
  }

  // The ceiling actually available to this project, before the green incentive.
  const availableFar = canPurchase && Number.isFinite(ceilingFar) ? ceilingFar : baseFar;

  // Chapter 9.3 grants the incentive above that ceiling, as a percentage of FAR availed.
  const greenBonusFar = round(availableFar * greenBonusFraction);
  const maxPermissibleFar = Number.isFinite(availableFar)
    ? round(availableFar + greenBonusFar)
    : Infinity;

  if (greenBonusFraction > 0) {
    workings += ` · Chapter 9.3 green incentive +${(greenBonusFraction * 100).toFixed(0)}% above the ceiling → ${maxPermissibleFar}`;
  }

  return {
    plotArea,
    baseFar,
    baseBuiltUpArea: round(plotArea * baseFar, 2),
    effectiveBaseFar,
    effectiveBuiltUpArea: round(plotArea * effectiveBaseFar, 2),
    greenBonusFraction,
    ceilingFar,
    purchasableFar,
    maxPermissibleFar,
    maxPermissibleBuiltUpArea: round(plotArea * maxPermissibleFar, 2),
    slabs,
    workings,
    clauseRef,
    caveats,
  };
}
