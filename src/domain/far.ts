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

/** Section 3.2.2.2 / 4.2.8 / 5.2.5 — road-width driven Base FAR for non-plotted occupancies. */
export interface RoadFarBand extends Band {
  readonly label: string;
  readonly baseFar: number;
  /** Additional FAR purchasable on top of Base FAR at this road width. */
  readonly purchasableFar: number;
}

export const GROUP_HOUSING_ROAD_FAR: readonly RoadFarBand[] = [
  { label: 'Below 9m',   overMoreThan: 0,  upToAndIncluding: 9,        baseFar: 0,    purchasableFar: 0 },
  { label: '9m to 12m',  overMoreThan: 9,  upToAndIncluding: 12,       baseFar: 1.75, purchasableFar: 0.3 },
  { label: '>12m to 18m', overMoreThan: 12, upToAndIncluding: 18,      baseFar: 2.0,  purchasableFar: 0.5 },
  { label: '>18m to 24m', overMoreThan: 18, upToAndIncluding: 24,      baseFar: 2.25, purchasableFar: 0.75 },
  { label: '>24m',        overMoreThan: 24, upToAndIncluding: Infinity, baseFar: 2.5, purchasableFar: 1.0 },
];

export const COMMERCIAL_ROAD_FAR: readonly RoadFarBand[] = [
  { label: 'Below 9m',    overMoreThan: 0,  upToAndIncluding: 9,        baseFar: 0,   purchasableFar: 0 },
  { label: '9m to 12m',   overMoreThan: 9,  upToAndIncluding: 12,       baseFar: 1.5, purchasableFar: 0.3 },
  { label: '>12m to 18m', overMoreThan: 12, upToAndIncluding: 18,       baseFar: 1.75, purchasableFar: 0.5 },
  { label: '>18m to 24m', overMoreThan: 18, upToAndIncluding: 24,       baseFar: 2.0, purchasableFar: 0.75 },
  { label: '>24m',        overMoreThan: 24, upToAndIncluding: Infinity, baseFar: 2.5, purchasableFar: 1.0 },
];

assertContiguousLadder('GROUP_HOUSING_ROAD_FAR', GROUP_HOUSING_ROAD_FAR);
assertContiguousLadder('COMMERCIAL_ROAD_FAR', COMMERCIAL_ROAD_FAR);

/** Chapter 9.3 — green-building FAR incentive, expressed as a fraction of Base FAR. */
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
}): BaseFarResult {
  const definition = getOccupancy(input.occupancy);
  const plotArea = Math.max(0, Number(input.plotArea) || 0);
  const roadWidth = Math.max(0, Number(input.roadWidth) || 0);
  const greenBonusFraction = GREEN_FAR_BONUS[input.greenRating ?? 'none'] ?? 0;
  const caveats: string[] = [];

  let baseFar = 0;
  let purchasableFar = 0;
  let workings = '';
  let clauseRef = '';
  const slabs: SlabContribution[] = [];

  if (plotArea === 0) {
    return {
      plotArea: 0, baseFar: 0, baseBuiltUpArea: 0, effectiveBaseFar: 0, effectiveBuiltUpArea: 0,
      greenBonusFraction, purchasableFar: 0, maxPermissibleFar: 0, maxPermissibleBuiltUpArea: 0,
      slabs: [], workings: 'Plot area is zero — no FAR can be derived.',
      clauseRef: 'Chapter 3.2.2', caveats: ['Enter a plot area to compute FAR.'],
    };
  }

  if (definition.farBasis === 'telescopic_plotted') {
    clauseRef = 'Chapter 3.2.2 & 3.2.2.1 (Telescopic Ladder)';
    let remaining = plotArea;
    let totalBuiltUp = 0;

    for (const slab of RESIDENTIAL_TELESCOPIC_SLABS) {
      if (remaining <= 0) break;
      const areaInSlab = Math.min(remaining, slab.capacity);
      const builtUp = areaInSlab * slab.far;
      slabs.push({
        index: slab.index,
        label: slab.label,
        plotAreaInSlab: round(areaInSlab, 2),
        far: slab.far,
        builtUpArea: round(builtUp, 2),
      });
      totalBuiltUp += builtUp;
      remaining -= areaInSlab;
    }

    baseFar = round(totalBuiltUp / plotArea);
    workings = slabs
      .map((s) => `${s.plotAreaInSlab} × ${s.far}`)
      .join(' + ') + ` = ${round(totalBuiltUp, 2)} sqm ÷ ${plotArea} sqm = FAR ${baseFar}`;

    // Chapter 9.2.1 — purchasable FAR is barred on sub-12m roads.
    purchasableFar = roadWidth >= PURCHASABLE_FAR_MIN_ROAD_WIDTH ? 0.4 : 0;
    if (purchasableFar === 0) {
      caveats.push(
        `Purchasable FAR is barred: abutting road is ${roadWidth}m, below the ${PURCHASABLE_FAR_MIN_ROAD_WIDTH}m threshold (Chapter 9.2.1).`,
      );
    }
  } else {
    const isGroupHousing = definition.farBasis === 'road_width_group_housing';
    const table = isGroupHousing ? GROUP_HOUSING_ROAD_FAR : COMMERCIAL_ROAD_FAR;
    clauseRef = isGroupHousing
      ? 'Chapter 3.2.2.2 & 4.2.8 (Road-Width FAR Matrix)'
      : 'Chapter 5.2.5 (Commercial Road-Width FAR Matrix)';

    const resolved = resolveBand(table, roadWidth);
    if (!resolved.ok) {
      caveats.push(`Road width ${roadWidth}m could not be matched to a FAR band; treating Base FAR as nil.`);
      workings = `No FAR band matches a ${roadWidth}m road.`;
    } else {
      baseFar = resolved.band.baseFar;
      purchasableFar = roadWidth >= PURCHASABLE_FAR_MIN_ROAD_WIDTH ? resolved.band.purchasableFar : 0;
      workings = `Road width ${roadWidth}m falls in band "${resolved.band.label}" → Base FAR ${baseFar}`;
      if (baseFar === 0) {
        caveats.push(
          `A ${roadWidth}m road is below the minimum right-of-way for ${definition.label.toLowerCase()}; no FAR is sanctionable.`,
        );
      }
      if (purchasableFar === 0 && resolved.band.purchasableFar > 0) {
        caveats.push(
          `Purchasable FAR is barred: abutting road is ${roadWidth}m, below the ${PURCHASABLE_FAR_MIN_ROAD_WIDTH}m threshold (Chapter 9.2.1).`,
        );
      }
    }
  }

  const effectiveBaseFar = round(baseFar * (1 + greenBonusFraction));
  const maxPermissibleFar = round(effectiveBaseFar + purchasableFar);

  if (greenBonusFraction > 0) {
    workings += ` · Green incentive +${(greenBonusFraction * 100).toFixed(0)}% → ${effectiveBaseFar}`;
  }

  return {
    plotArea,
    baseFar,
    baseBuiltUpArea: round(plotArea * baseFar, 2),
    effectiveBaseFar,
    effectiveBuiltUpArea: round(plotArea * effectiveBaseFar, 2),
    greenBonusFraction,
    purchasableFar,
    maxPermissibleFar,
    maxPermissibleBuiltUpArea: round(plotArea * maxPermissibleFar, 2),
    slabs,
    workings,
    clauseRef,
    caveats,
  };
}
