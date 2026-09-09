/**
 * Setbacks — the single source of truth.
 *
 * Replaces four divergent copies of the same ladders (ComplianceAuditEngine,
 * constraintEngine, SetbackVisualizer and byelawsData) and closes the numeric holes
 * that made a 15.005m building demand the >51m high-rise setback of 15m.
 */

import { Band, assertContiguousLadder, resolveBand } from './bands';
import type { Occupancy } from './project';

export interface SetbackSet {
  readonly front: number;
  readonly rear: number;
  readonly side1: number;
  readonly side2: number;
}

export interface PlottedSetbackBand extends Band, SetbackSet {
  readonly label: string;
  readonly typology: string;
  readonly maxHeight: number;
  readonly maxFloors: string;
  readonly note: string;
}

/** Table 3.2.1 — plotted residential, by plot area. */
export const PLOTTED_RESIDENTIAL_LADDER: readonly PlottedSetbackBand[] = [
  {
    label: 'Up to 150 sqm', overMoreThan: 0, upToAndIncluding: 150,
    front: 1.0, rear: 0, side1: 0, side2: 0,
    typology: 'Row Housing', maxHeight: 15, maxFloors: '3 floors + stilt',
    note: 'No rear or side setback required; maximum coverage behind the front setback.',
  },
  {
    label: '>150 to 300 sqm', overMoreThan: 150, upToAndIncluding: 300,
    front: 3.0, rear: 1.5, side1: 0, side2: 0,
    typology: 'Row Housing', maxHeight: 15, maxFloors: '3 floors + stilt',
    note: 'Zero side setback permitted; rear light court mandatory.',
  },
  {
    label: '>300 to 500 sqm', overMoreThan: 300, upToAndIncluding: 500,
    front: 3.0, rear: 3.0, side1: 0, side2: 0,
    typology: 'Row Housing', maxHeight: 17.5, maxFloors: '4 storeys + stilt',
    note: '4 storeys with stilt permitted up to 17.5m.',
  },
  {
    label: '>500 to 1200 sqm', overMoreThan: 500, upToAndIncluding: 1200,
    front: 4.5, rear: 4.5, side1: 1.5, side2: 0,
    typology: 'Semi-Detached', maxHeight: 17.5, maxFloors: '4 storeys + stilt',
    note: 'Construction permitted on 40% of the rear setback up to 7m height unless stilted.',
  },
  {
    label: '>1200 sqm', overMoreThan: 1200, upToAndIncluding: Infinity,
    front: 6.0, rear: 6.0, side1: 1.5, side2: 1.5,
    typology: 'Detached', maxHeight: 17.5, maxFloors: '4 storeys + stilt',
    note: 'Detached on all four sides.',
  },
];

export interface HighRiseSetbackBand extends Band, SetbackSet {
  readonly label: string;
}

/** Clause 3.2.4.9 — progressive fire-tender setbacks above the 15m high-rise threshold. */
export const HIGH_RISE_LADDER: readonly HighRiseSetbackBand[] = [
  { label: '>15 to 17.5m', overMoreThan: 15,   upToAndIncluding: 17.5,     front: 5,  rear: 5,  side1: 5,  side2: 5 },
  { label: '>17.5 to 21m', overMoreThan: 17.5, upToAndIncluding: 21,       front: 6,  rear: 6,  side1: 6,  side2: 6 },
  { label: '>21 to 27m',   overMoreThan: 21,   upToAndIncluding: 27,       front: 7,  rear: 7,  side1: 7,  side2: 7 },
  { label: '>27 to 33m',   overMoreThan: 27,   upToAndIncluding: 33,       front: 8,  rear: 8,  side1: 8,  side2: 8 },
  { label: '>33 to 39m',   overMoreThan: 33,   upToAndIncluding: 39,       front: 9,  rear: 9,  side1: 9,  side2: 9 },
  { label: '>39 to 45m',   overMoreThan: 39,   upToAndIncluding: 45,       front: 10, rear: 10, side1: 10, side2: 10 },
  { label: '>45 to 51m',   overMoreThan: 45,   upToAndIncluding: 51,       front: 11, rear: 11, side1: 11, side2: 11 },
  { label: '>51m',         overMoreThan: 51,   upToAndIncluding: Infinity, front: 15, rear: 12, side1: 12, side2: 12 },
];

export interface CommercialSetbackBand extends Band, SetbackSet {
  readonly label: string;
}

/** Chapter 5 — commercial plots below the high-rise threshold. */
export const COMMERCIAL_LADDER: readonly CommercialSetbackBand[] = [
  { label: 'Up to 100 sqm',    overMoreThan: 0,    upToAndIncluding: 100,      front: 1.5, rear: 0,   side1: 0,   side2: 0 },
  { label: '>100 to 300 sqm',  overMoreThan: 100,  upToAndIncluding: 300,      front: 3.0, rear: 0,   side1: 0,   side2: 0 },
  { label: '>300 to 1000 sqm', overMoreThan: 300,  upToAndIncluding: 1000,     front: 4.5, rear: 3.0, side1: 1.5, side2: 1.5 },
  { label: '>1000 sqm',        overMoreThan: 1000, upToAndIncluding: Infinity, front: 6.0, rear: 3.0, side1: 3.0, side2: 3.0 },
];

assertContiguousLadder('PLOTTED_RESIDENTIAL_LADDER', PLOTTED_RESIDENTIAL_LADDER);
assertContiguousLadder('HIGH_RISE_LADDER', HIGH_RISE_LADDER);
assertContiguousLadder('COMMERCIAL_LADDER', COMMERCIAL_LADDER);

/** Height, in metres, at or below which a building is not a high-rise. */
export const HIGH_RISE_THRESHOLD_M = 15;

export interface RequiredSetbacks extends SetbackSet {
  readonly isHighRise: boolean;
  readonly bandLabel: string;
  readonly clauseRef: string;
  readonly typology: string;
  readonly maxHeight: number;
  readonly maxFloors: string;
  readonly note: string;
  readonly cornerRuleApplied: boolean;
  readonly caveats: readonly string[];
}

export function resolveRequiredSetbacks(input: {
  occupancy: Occupancy;
  plotArea: number;
  buildingHeight: number;
  isCornerPlot: boolean;
}): RequiredSetbacks {
  const plotArea = Math.max(0, Number(input.plotArea) || 0);
  const buildingHeight = Math.max(0, Number(input.buildingHeight) || 0);
  const caveats: string[] = [];
  const isHighRise = buildingHeight > HIGH_RISE_THRESHOLD_M;

  let set: SetbackSet;
  let bandLabel: string;
  let clauseRef: string;
  let typology = '—';
  let maxHeight = HIGH_RISE_THRESHOLD_M;
  let maxFloors = '—';
  let note = '';

  if (isHighRise) {
    // Progressive fire-tender setbacks override every area-based ladder above 15m.
    const resolved = resolveBand(HIGH_RISE_LADDER, buildingHeight);
    const band = resolved.ok ? resolved.band : HIGH_RISE_LADDER[0];
    if (!resolved.ok) {
      caveats.push(`Height ${buildingHeight}m matched no high-rise band; the most permissive band was applied.`);
    }
    set = { front: band.front, rear: band.rear, side1: band.side1, side2: band.side2 };
    bandLabel = band.label;
    clauseRef = 'Clause 3.2.4.9 (Progressive High-Rise Setbacks)';
    maxHeight = band.upToAndIncluding;
    maxFloors = 'Per fire NOC and structural clearance';
    note = 'Continuous fire-tender movement space is required on all four sides; these setbacks are non-compoundable.';
    typology = 'High-Rise';
  } else if (input.occupancy === 'commercial') {
    const resolved = resolveBand(COMMERCIAL_LADDER, plotArea);
    const band = resolved.ok ? resolved.band : COMMERCIAL_LADDER[0];
    if (!resolved.ok) caveats.push(`Plot area ${plotArea} sqm matched no commercial band; the smallest band was applied.`);
    set = { front: band.front, rear: band.rear, side1: band.side1, side2: band.side2 };
    bandLabel = band.label;
    clauseRef = 'Chapter 5 (Commercial Setbacks)';
    typology = 'Commercial';
    maxFloors = 'Governed by road width and FAR';
    note = 'Front setback must remain clear of parking and service structures.';
  } else if (input.occupancy === 'group_housing') {
    set = { front: 5, rear: 5, side1: 5, side2: 5 };
    bandLabel = 'Group Housing (≤15m)';
    clauseRef = 'Clause 3.2.4.2';
    typology = 'Group Housing';
    maxFloors = 'Stilt + 4 storeys below the high-rise threshold';
    note = 'Group housing carries a uniform 5m all-round open space below 15m height.';
  } else {
    const resolved = resolveBand(PLOTTED_RESIDENTIAL_LADDER, plotArea);
    const band = resolved.ok ? resolved.band : PLOTTED_RESIDENTIAL_LADDER[0];
    if (!resolved.ok) caveats.push(`Plot area ${plotArea} sqm matched no plotted band; the smallest band was applied.`);
    set = { front: band.front, rear: band.rear, side1: band.side1, side2: band.side2 };
    bandLabel = band.label;
    clauseRef = 'Table 3.2.1 (Plotted Residential Setbacks)';
    typology = band.typology;
    maxHeight = input.occupancy === 'multi_unit' ? Math.max(band.maxHeight, 17.5) : Math.min(band.maxHeight, 15);
    maxFloors = band.maxFloors;
    note = band.note;
  }

  // Table 3.2.1 Note 2 — a corner plot's secondary frontage carries the full front setback.
  let cornerRuleApplied = false;
  if (input.isCornerPlot && set.side2 < set.front) {
    set = { ...set, side2: set.front };
    cornerRuleApplied = true;
  }

  return {
    ...set,
    isHighRise,
    bandLabel,
    clauseRef,
    typology,
    maxHeight,
    maxFloors,
    note,
    cornerRuleApplied,
    caveats,
  };
}

export type SetbackFace = 'front' | 'rear' | 'side1' | 'side2';

export interface FaceVerdict {
  readonly face: SetbackFace;
  readonly required: number;
  readonly provided: number;
  readonly deficitM: number;
  readonly deficitPct: number;
  readonly status: 'compliant' | 'compoundable' | 'violation';
}

/**
 * Chapter 16.3 compoundable deviation ceilings, as a fraction of the required setback.
 * Fire-tender setbacks on a high-rise are never compoundable (Clause 16.3.2 ii).
 */
export const COMPOUNDABLE_SETBACK_LIMITS: Readonly<Record<SetbackFace, number>> = {
  front: 0.25,
  rear: 1.0,
  side1: 0.25,
  side2: 0.25,
};

export function assessSetbackFaces(
  required: RequiredSetbacks,
  provided: SetbackSet,
): readonly FaceVerdict[] {
  const faces: SetbackFace[] = ['front', 'rear', 'side1', 'side2'];
  return faces.map((face) => {
    const req = required[face];
    const prov = Math.max(0, Number(provided[face]) || 0);
    const deficitM = Math.max(0, req - prov);
    const deficitPct = req > 0 ? (deficitM / req) * 100 : 0;

    let status: FaceVerdict['status'] = 'compliant';
    if (deficitM > 1e-9) {
      const limit = required.isHighRise ? 0 : COMPOUNDABLE_SETBACK_LIMITS[face];
      status = deficitPct <= limit * 100 + 1e-9 ? 'compoundable' : 'violation';
    }

    return {
      face,
      required: req,
      provided: prov,
      deficitM: Number(deficitM.toFixed(3)),
      deficitPct: Number(deficitPct.toFixed(1)),
      status,
    };
  });
}
