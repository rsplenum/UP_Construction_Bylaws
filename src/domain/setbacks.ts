/**
 * Setbacks — the single source of truth.
 *
 * Replaces four divergent copies of the same ladders (ComplianceAuditEngine,
 * constraintEngine, SetbackVisualizer and byelawsData) and closes the numeric holes
 * that made a 15.005m building demand the >51m high-rise setback of 15m.
 */

import { Band, assertContiguousLadder, resolveBand } from './bands';
import { OccupancyId, getOccupancy } from './occupancy';

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
/**
 * Gazette, "Commercial – Shops/commercial units, Mixed use buildings up to 15-meter
 * height". VERIFIED 2026-09-10. The >3000 sqm band was previously missing, so a large
 * commercial plot was given 6/3/3/3 where the gazette requires 12/6/6/6 — half the
 * required front setback.
 */
export const COMMERCIAL_LADDER: readonly CommercialSetbackBand[] = [
  { label: 'Up to 100 sqm',     overMoreThan: 0,    upToAndIncluding: 100,      front: 1.5,  rear: 0,   side1: 0,   side2: 0 },
  { label: '>100 to 300 sqm',   overMoreThan: 100,  upToAndIncluding: 300,      front: 3.0,  rear: 0,   side1: 0,   side2: 0 },
  { label: '>300 to 1000 sqm',  overMoreThan: 300,  upToAndIncluding: 1000,     front: 4.5,  rear: 3.0, side1: 1.5, side2: 1.5 },
  { label: '>1000 to 3000 sqm', overMoreThan: 1000, upToAndIncluding: 3000,     front: 6.0,  rear: 3.0, side1: 3.0, side2: 3.0 },
  { label: '>3000 sqm',         overMoreThan: 3000, upToAndIncluding: Infinity, front: 12.0, rear: 6.0, side1: 6.0, side2: 6.0 },
];

/**
 * Gazette, "Community Facilities – Healthcare buildings height up to 15-meters".
 * VERIFIED 2026-09-10.
 */
export const HEALTHCARE_LADDER: readonly CommercialSetbackBand[] = [
  { label: '100 to 300 sqm',    overMoreThan: 0,    upToAndIncluding: 300,      front: 3.0, rear: 1.5, side1: 0,   side2: 0 },
  { label: '>300 to 1000 sqm',  overMoreThan: 300,  upToAndIncluding: 1000,     front: 4.5, rear: 3.0, side1: 3.0, side2: 0 },
  { label: '>1000 to 2000 sqm', overMoreThan: 1000, upToAndIncluding: 2000,     front: 6.0, rear: 3.0, side1: 3.0, side2: 3.0 },
  { label: '>2000 sqm',         overMoreThan: 2000, upToAndIncluding: Infinity, front: 9.0, rear: 6.0, side1: 6.0, side2: 6.0 },
];

/** Chapter 6 — schools and colleges. */
export const EDUCATIONAL_LADDER: readonly CommercialSetbackBand[] = [
  { label: 'Up to 1000 sqm',    overMoreThan: 0,    upToAndIncluding: 1000,     front: 6.0, rear: 3.0, side1: 3.0, side2: 3.0 },
  { label: '>1000 to 4000 sqm', overMoreThan: 1000, upToAndIncluding: 4000,     front: 7.5, rear: 4.5, side1: 4.5, side2: 4.5 },
  { label: '>4000 sqm',         overMoreThan: 4000, upToAndIncluding: Infinity, front: 9.0, rear: 6.0, side1: 6.0, side2: 6.0 },
];

/** Chapter 7 — industrial plots, sized for vehicle movement. */
export const INDUSTRIAL_LADDER: readonly CommercialSetbackBand[] = [
  { label: 'Up to 500 sqm',      overMoreThan: 0,     upToAndIncluding: 500,      front: 4.5, rear: 3.0, side1: 3.0,  side2: 3.0 },
  { label: '>500 to 2000 sqm',   overMoreThan: 500,   upToAndIncluding: 2000,     front: 6.0, rear: 4.5, side1: 4.5,  side2: 4.5 },
  { label: '>2000 to 10000 sqm', overMoreThan: 2000,  upToAndIncluding: 10000,    front: 9.0, rear: 6.0, side1: 6.0,  side2: 6.0 },
  { label: '>10000 sqm',         overMoreThan: 10000, upToAndIncluding: Infinity, front: 12.0, rear: 9.0, side1: 9.0, side2: 9.0 },
];

assertContiguousLadder('PLOTTED_RESIDENTIAL_LADDER', PLOTTED_RESIDENTIAL_LADDER);
assertContiguousLadder('HEALTHCARE_LADDER', HEALTHCARE_LADDER);
assertContiguousLadder('EDUCATIONAL_LADDER', EDUCATIONAL_LADDER);
assertContiguousLadder('INDUSTRIAL_LADDER', INDUSTRIAL_LADDER);
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
  occupancy: OccupancyId;
  plotArea: number;
  buildingHeight: number;
  isCornerPlot: boolean;
}): RequiredSetbacks {
  const definition = getOccupancy(input.occupancy);
  const plotArea = Math.max(0, Number(input.plotArea) || 0);
  const buildingHeight = Math.max(0, Number(input.buildingHeight) || 0);
  const caveats: string[] = [];
  const isHighRise = buildingHeight > HIGH_RISE_THRESHOLD_M;

  let set: SetbackSet;
  let bandLabel: string;
  let clauseRef: string;
  let typology = definition.label;
  let maxHeight = definition.maxHeightM;
  let maxFloors = '—';
  let note = definition.note;

  const AREA_LADDERS: Record<string, readonly (Band & SetbackSet & { label: string })[]> = {
    plotted_residential: PLOTTED_RESIDENTIAL_LADDER,
    commercial: COMMERCIAL_LADDER,
    healthcare: HEALTHCARE_LADDER,
    educational: EDUCATIONAL_LADDER,
    industrial: INDUSTRIAL_LADDER,
  };

  if (isHighRise) {
    // Progressive fire-tender setbacks override every area-based ladder above 15 m.
    const resolved = resolveBand(HIGH_RISE_LADDER, buildingHeight);
    const band = resolved.ok ? resolved.band : HIGH_RISE_LADDER[0];
    if (!resolved.ok) {
      caveats.push(`Height ${buildingHeight}m matched no high-rise band; the most permissive band was applied.`);
    }
    set = { front: band.front, rear: band.rear, side1: band.side1, side2: band.side2 };
    bandLabel = band.label;
    clauseRef = 'Clause 3.2.4.9 (Progressive High-Rise Setbacks)';
    maxHeight = band.upToAndIncluding;
    maxFloors = 'Governed by the fire NOC and structural clearance';
    note = 'Continuous fire-tender movement space is required on all four sides. These setbacks cannot be compounded at any fee.';
    typology = 'High rise';
  } else if (definition.setbackTable === 'group_housing') {
    set = { front: 5, rear: 5, side1: 5, side2: 5 };
    bandLabel = 'Group housing below 15 m';
    clauseRef = 'Clause 3.2.4.2';
    maxFloors = 'Stilt plus four storeys below the high-rise threshold';
  } else {
    const ladder = AREA_LADDERS[definition.setbackTable] ?? PLOTTED_RESIDENTIAL_LADDER;
    const resolved = resolveBand(ladder, plotArea);
    const band = resolved.ok ? resolved.band : ladder[0];
    if (!resolved.ok) caveats.push(`Plot area ${plotArea} sqm matched no band; the smallest band was applied.`);
    set = { front: band.front, rear: band.rear, side1: band.side1, side2: band.side2 };
    bandLabel = band.label;

    if (definition.setbackTable === 'plotted_residential') {
      const plotted = band as PlottedSetbackBand;
      clauseRef = 'Table 3.2.1 (Plotted Residential Setbacks)';
      typology = plotted.typology;
      // Gazette 3.2.4.1: "for all single/multi-units less than 300 square meters plot
      // size, three floors with stilts up to 15 meter is allowed and on plots above 300
      // square meters, four storeys with stilts up to 17.5-meter height is allowed."
      // The height ceiling follows the plot, not the single/multi distinction.
      // Two chapters give this ceiling and they disagree (V-010). Clause 3.2.4.1 keys it
      // on plot size — under 300 m² three floors to 15 m, above it four to 17.5 m —
      // while Clause 4.1.4 keys it on unit count: "15-m including stilt for single unit
      // and 17.5 meters including mandatory stilt floor for multi-unit". A single
      // dwelling on a 400 m² plot is 17.5 m by one and 15 m by the other. Neither
      // reading is obviously the drafter's intent, so the stricter one governs.
      maxHeight = Math.min(definition.maxHeightM, plotted.maxHeight);
      maxFloors = plotted.maxFloors;
      note = plotted.note;
    } else {
      clauseRef =
        definition.setbackTable === 'commercial' ? 'Chapter 5 (Commercial Setbacks)'
        : definition.setbackTable === 'healthcare' ? 'Chapter 6 (Healthcare Setbacks)'
        : definition.setbackTable === 'educational' ? 'Chapter 6 (Educational Setbacks)'
        : 'Chapter 7 (Industrial Setbacks)';
      maxFloors = 'Governed by road width and FAR';
    }
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
 * Chapter 16 decides whether a shortfall can be compounded, not Chapter 3. The limits
 * are computed by `compoundableLimits()` in ./compounding and passed in, so that this
 * module stays a pure transcription of the setback tables and the two chapters cannot
 * drift apart. Passing nothing means "tell me the shortfall, don't judge it".
 */
export function assessSetbackFaces(
  required: RequiredSetbacks,
  provided: SetbackSet,
  compoundable?: Readonly<Record<SetbackFace, { fraction: number; maxDepthM: number }>>,
): readonly FaceVerdict[] {
  const faces: SetbackFace[] = ['front', 'rear', 'side1', 'side2'];
  return faces.map((face) => {
    const req = required[face];
    const prov = Math.max(0, Number(provided[face]) || 0);
    const deficitM = Math.max(0, req - prov);
    const deficitPct = req > 0 ? (deficitM / req) * 100 : 0;

    let status: FaceVerdict['status'] = 'compliant';
    if (deficitM > 1e-9) {
      const limit = compoundable?.[face];
      status = limit
        && deficitPct <= limit.fraction * 100 + 1e-9
        && deficitM <= limit.maxDepthM + 1e-9
        ? 'compoundable'
        : 'violation';
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
