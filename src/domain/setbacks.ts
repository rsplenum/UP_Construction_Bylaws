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

/**
 * Clause 3.2.4.4 — "Other Commercial", the one setback table keyed on what the building
 * IS rather than on how big its plot is.
 *
 * The engine did not hold this table at all, and routed hotels and malls to the ordinary
 * commercial ladder at Clause 3.2.4.3 (B-050). The error is not a rounding: a mall on a
 * 2,000 m² plot was given 6/3/3/3 where this table requires 9/6/6/6, and one on a 400 m²
 * plot was given 4.5/3/1.5/1.5 against the same 9/6/6/6 — less than half the front and a
 * quarter of the sides. It runs the other way for a large hotel, which this table lets sit
 * 5 m back where the plot-area ladder demanded 12.
 *
 * Found by `rules/coverage.ts`, which asked which tables answer `requiredSetback` and got
 * a list two short of the gazette's.
 */
export interface OtherCommercialSetback extends SetbackSet {
  readonly row: string;
}

export const OTHER_COMMERCIAL_SETBACKS = {
  /** "Hotels/ Single screen cinema/ Miniplex". */
  hotel: { row: 'Hotels / Single screen cinema / Miniplex', front: 5, rear: 3, side1: 3, side2: 3 },
  /** "Multiplex/ Shopping Malls". */
  mall: { row: 'Multiplex / Shopping Malls', front: 9, rear: 6, side1: 6, side2: 6 },
} as const satisfies Readonly<Record<string, OtherCommercialSetback>>;

/**
 * Rows of Clause 3.2.4.4 that no occupancy in this engine maps onto.
 *
 * Recorded rather than dropped, on the same principle as every other unmapped row: a table
 * this engine holds three-fifths of is a table someone has to be told the rest of. A
 * petrol pump is not a use `OccupancyId` can express, and pretending the table has three
 * rows would make that invisible.
 */
export const OTHER_COMMERCIAL_UNMAPPED: readonly OtherCommercialSetback[] = [
  { row: 'Petrol filling station without service station', front: 3, rear: 0, side1: 0, side2: 0 },
  { row: 'Petrol filling station with service station', front: 6, rear: 0, side1: 0, side2: 0 },
  { row: 'LPG Gas Godown', front: 6, rear: 3, side1: 3, side2: 3 },
];

/**
 * Clause 3.2.4.7 — "Community Facilities – Public Amenity buildings height up to
 * 15-meters". The second table the coverage query found missing (B-051).
 *
 * The gazette prints four rows across two building types:
 *
 *   Marriage / Banquet / Multipurpose Hall    1000–3000 → 12/4.5/4.5/3   >3000 → 12/5/5/5
 *   Auditorium / Convention Centre            1500–3000 → 12/4.5/4.5/3   >3000 → 12/6/6/6
 *
 * `inst_assembly` covers both, so above 3,000 m² the two rows disagree by 1 m on the rear
 * and both sides and the stricter governs, with the alternative named on the finding. This
 * is the shape V-054 already records for the zoning matrix: one occupancy, two rows, and
 * the distinguishing fact not in the project model.
 *
 * Below 1,000 m² the table states nothing. That is the gazette's silence, not this
 * engine's, and it is reported as a caveat rather than filled in.
 */
export const PUBLIC_AMENITY_LADDER: readonly CommercialSetbackBand[] = [
  { label: '1000 to 3000 sqm', overMoreThan: 1000, upToAndIncluding: 3000,     front: 12, rear: 4.5, side1: 4.5, side2: 3 },
  { label: '>3000 sqm',        overMoreThan: 3000, upToAndIncluding: Infinity, front: 12, rear: 6,   side1: 6,   side2: 6 },
];

/**
 * The tallest a plotted house can be and still read Table 3.2.1.
 *
 * Clause 3.2.4.9 opens "For use occupancies with building height more than 15m (other than
 * single/multi units)" — it excludes plotted residential in terms. Clause 3.2.4.1's own
 * preamble says plots above 300 m² may build "four storeys with stilts up to 17.5-meter
 * height", so between 15 and 17.5 m a plotted house is inside Table 3.2.1 and outside the
 * progressive ladder. The engine applied the progressive ladder to it in both directions
 * at once (B-052): 5 m on every side where Table 3.2.1 asks 3/3/0/0 on a 400 m² plot, and
 * a 5 m front where it asks 6 on a plot over 1,200 m².
 */
export const PLOTTED_MAX_HEIGHT_M = 17.5;

assertContiguousLadder('PLOTTED_RESIDENTIAL_LADDER', PLOTTED_RESIDENTIAL_LADDER);
assertContiguousLadder('HEALTHCARE_LADDER', HEALTHCARE_LADDER);
assertContiguousLadder('EDUCATIONAL_LADDER', EDUCATIONAL_LADDER);
assertContiguousLadder('INDUSTRIAL_LADDER', INDUSTRIAL_LADDER);
assertContiguousLadder('HIGH_RISE_LADDER', HIGH_RISE_LADDER);
assertContiguousLadder('COMMERCIAL_LADDER', COMMERCIAL_LADDER);

/**
 * Table 3.2.1's own height ceiling, keyed on plot size.
 *
 * Clause 3.2.4.1: "for all single/multi-units less than 300 square meters plot size,
 * three floors with stilts up to 15 meter is allowed and on plots above 300 square
 * meters, four storeys with stilts up to 17.5-meter height is allowed."
 *
 * This is the Chapter 3 limb of V-010, and it is exported because `findings.ts` needs it:
 * the ceiling reported to the user was `OccupancyDefinition.maxHeightM` alone — Clause
 * 4.1.4's limb, keyed on unit count — so a multi-unit on a 200 m² plot was cleared to
 * 17.5 m where this table allows 15 (B-044). Returns null for a use Table 3.2.1 does not
 * cover, which is every use but plotted residential.
 */
export function plottedHeightCeiling(occupancy: OccupancyId, plotArea: number): number | null {
  if (getOccupancy(occupancy).setbackTable !== 'plotted_residential') return null;
  const resolved = resolveBand(PLOTTED_RESIDENTIAL_LADDER, Math.max(0, plotArea));
  return (resolved.ok ? resolved.band : PLOTTED_RESIDENTIAL_LADDER[0]).maxHeight;
}

/** Height, in metres, at or below which a building is not a high-rise. */
export const HIGH_RISE_THRESHOLD_M = 15;

export interface RequiredSetbacks extends SetbackSet {
  /**
   * The register entry these figures came from.
   *
   * Six different tables can answer this question and `findings.ts` used to stamp every
   * answer with `setback.plotted-residential`, so a 25 m warehouse assessed on the
   * progressive high-rise ladder was reported at that rule's confidence and carried none
   * of its own (B-045). Provenance has to travel with the number, not with the code
   * branch that asked for it.
   */
  readonly rule: string;
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
  /** Needed only by the bazaar-street ladder (Clause 5.1.5), which is keyed on it. */
  roadWidth?: number;
}): RequiredSetbacks {
  const definition = getOccupancy(input.occupancy);
  const plotArea = Math.max(0, Number(input.plotArea) || 0);
  const roadWidth = Math.max(0, Number(input.roadWidth) || 0);
  const buildingHeight = Math.max(0, Number(input.buildingHeight) || 0);
  const caveats: string[] = [];
  const isHighRise = buildingHeight > HIGH_RISE_THRESHOLD_M;

  let set: SetbackSet;
  let bandLabel: string;
  let clauseRef: string;
  let rule = 'setback.plotted-residential';
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

  /**
   * Clause 3.2.4.9 excludes single/multi units in terms, and Table 3.2.1 reaches 17.5 m.
   * A plotted house between the two therefore stays on its own table (B-052).
   */
  const plottedBelowItsOwnCeiling = definition.setbackTable === 'plotted_residential'
    && isHighRise && buildingHeight <= PLOTTED_MAX_HEIGHT_M;

  if (definition.setbackTable === 'bazaar_street' && !isHighRise) {
    // Clause 5.1.5 gives a front open space only, keyed on the road. The other three
    // faces fall back to the commercial ladder at Clause 3.2.4.
    const resolved = resolveBand(BAZAAR_STREET_FRONT_LADDER, roadWidth);
    const band = resolved.ok ? resolved.band : BAZAAR_STREET_FRONT_LADDER[0];
    const commercial = resolveBand(COMMERCIAL_LADDER, plotArea);
    const rest = commercial.ok ? commercial.band : COMMERCIAL_LADDER[0];
    set = { front: band.front, rear: rest.rear, side1: rest.side1, side2: rest.side2 };
    bandLabel = band.label;
    clauseRef = 'Clause 5.1.5 (bazaar street front open space), with Clause 3.2.4 for the other faces';
    rule = 'setback.bazaar-street';
    typology = 'Bazaar street';
    if (!resolved.ok) {
      caveats.push(`Road width ${roadWidth} m could not be matched to a bazaar-street band.`);
    }
    caveats.push(
      'Clause 5.1.5 lists discrete road widths rather than bands. A road between two listed '
      + 'widths is taken here at the next width up, which is the stricter reading (V-012).',
    );
  } else if (isHighRise && !plottedBelowItsOwnCeiling) {
    // Progressive fire-tender setbacks override every area-based ladder above 15 m —
    // every one but Table 3.2.1's, which Clause 3.2.4.9 excludes by name.
    const resolved = resolveBand(HIGH_RISE_LADDER, buildingHeight);
    const band = resolved.ok ? resolved.band : HIGH_RISE_LADDER[0];
    if (!resolved.ok) {
      caveats.push(`Height ${buildingHeight}m matched no high-rise band; the most permissive band was applied.`);
    }
    set = { front: band.front, rear: band.rear, side1: band.side1, side2: band.side2 };
    bandLabel = band.label;
    clauseRef = 'Clause 3.2.4.9 (Progressive High-Rise Setbacks)';
    rule = 'setback.high-rise';
    if (definition.setbackTable === 'bazaar_street') {
      /**
       * Clause 5.1 puts no height limit on a bazaar street — 5.1.3 says so in terms — and
       * Clause 5.1.5 carries no height limb, so above 15 m both tables speak and they
       * disagree about the front. Note-3's subordination is printed under a table captioned
       * "up to 15-meter height" and does not reach up here.
       *
       * Standing rule 4: both readings stand and the stricter governs. The engine used to
       * take Clause 3.2.4.9's front unconditionally, which is the LAXER figure on any
       * bazaar street wider than 30 m — 6 m against 7.5 on a 16-storey-band building
       * (B-053).
       */
      const bazaar = resolveBand(BAZAAR_STREET_FRONT_LADDER, roadWidth);
      const bazaarFront = (bazaar.ok ? bazaar.band : BAZAAR_STREET_FRONT_LADDER[0]).front;
      if (bazaarFront > set.front) {
        caveats.push(
          `Clause 5.1.5 requires ${bazaarFront} m at the front on a ${roadWidth} m bazaar street `
          + `and Clause 3.2.4.9 requires ${set.front} m at this height. Neither yields to the other `
          + 'above 15 m, so the larger governs (B-053).',
        );
        set = { ...set, front: bazaarFront };
        clauseRef = 'Clause 5.1.5 (bazaar street front open space), with Clause 3.2.4.9 for the other faces';
        rule = 'setback.bazaar-street';
      } else {
        caveats.push(
          `Clause 5.1.5 would require ${bazaarFront} m at the front on a ${roadWidth} m bazaar `
          + `street. Clause 3.2.4.9's ${set.front} m is the larger at this height and governs.`,
        );
      }
    }
    if (definition.setbackTable === 'plotted_residential') {
      caveats.push(
        `Clause 3.2.4.9 excludes single and multi units, and Table 3.2.1 reaches only `
        + `${PLOTTED_MAX_HEIGHT_M} m. At ${buildingHeight} m this building is above the height `
        + 'Clause 3.2.4.1 allows a plotted house at all, so the progressive ladder is applied '
        + 'for want of any other table.',
      );
    }
    maxHeight = band.upToAndIncluding;
    maxFloors = 'Governed by the fire NOC and structural clearance';
    note = 'Continuous fire-tender movement space is required on all four sides. These setbacks cannot be compounded at any fee.';
    typology = 'High rise';
  } else if (definition.setbackTable === 'other_commercial') {
    // Clause 3.2.4.4 is keyed on the building, not the plot, so there is no band to
    // resolve — and a hotel's figures do not move with plot size at all.
    const row = definition.id === 'com_mall'
      ? OTHER_COMMERCIAL_SETBACKS.mall
      : OTHER_COMMERCIAL_SETBACKS.hotel;
    set = { front: row.front, rear: row.rear, side1: row.side1, side2: row.side2 };
    bandLabel = row.row;
    clauseRef = 'Clause 3.2.4.4 (Other Commercial)';
    rule = 'setback.other-commercial';
    maxFloors = 'Governed by road width and FAR';
    if (definition.id === 'com_mall') {
      caveats.push(
        'Clause 3.2.4.4 gives one row to multiplexes and shopping malls together. A single '
        + 'screen cinema or miniplex is on the hotel row at 5/3/3/3, which this occupancy '
        + 'cannot distinguish.',
      );
    }
  } else if (definition.setbackTable === 'public_amenity') {
    const resolved = resolveBand(PUBLIC_AMENITY_LADDER, plotArea);
    const band = resolved.ok ? resolved.band : PUBLIC_AMENITY_LADDER[0];
    set = { front: band.front, rear: band.rear, side1: band.side1, side2: band.side2 };
    bandLabel = band.label;
    clauseRef = 'Clause 3.2.4.7 (Public Amenity)';
    rule = 'setback.public-amenity';
    maxFloors = 'Governed by road width and FAR';
    if (!resolved.ok) {
      caveats.push(
        `Clause 3.2.4.7 states no row below 1,000 sqm for a hall and none below 1,500 sqm for `
        + `an auditorium. At ${plotArea} sqm the smallest stated row is applied, which is the `
        + 'stricter reading; the gazette is simply silent here.',
      );
    }
    if (plotArea > 3000) {
      caveats.push(
        'Above 3,000 sqm Clause 3.2.4.7 gives a marriage or banquet hall 12/5/5/5 and an '
        + 'auditorium or convention centre 12/6/6/6. This occupancy covers both, so the '
        + 'stricter row governs and a hall may argue for 5 m on the rear and sides.',
      );
    }
    caveats.push(
      'Clause 3.2.4.4 puts a single screen cinema or miniplex on the "Other Commercial" table '
      + 'at 5/3/3/3. This occupancy covers cinemas as well as halls, and the Public Amenity '
      + 'figures are the stricter of the two.',
    );
  } else if (definition.setbackTable === 'group_housing') {
    set = { front: 5, rear: 5, side1: 5, side2: 5 };
    bandLabel = 'Group housing below 15 m';
    clauseRef = 'Clause 3.2.4.2';
    rule = 'setback.group-housing';
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
      if (plottedBelowItsOwnCeiling) {
        caveats.push(
          buildingHeight > plotted.maxHeight
            ? 'Clause 3.2.4.9 opens "For use occupancies with building height more than 15m '
              + '(other than single/multi units)", and Table 3.2.1 allows only '
              + `${plotted.maxHeight} m on a plot of this size. At ${buildingHeight} m no setback `
              + 'table in the byelaws speaks to this building; its own row is applied and the '
              + 'height is reported against the ceiling separately.'
            : 'Clause 3.2.4.9 opens "For use occupancies with building height more than 15m '
              + '(other than single/multi units)", so the progressive fire-tender ladder does not '
              + `reach a plotted house. Table 3.2.1 governs to ${plotted.maxHeight} m here (B-052).`,
        );
      }
    } else {
      clauseRef =
        definition.setbackTable === 'commercial' ? 'Clause 3.2.4.3 (Commercial — shops, commercial units, mixed use)'
        : definition.setbackTable === 'healthcare' ? 'Clause 3.2.4.5 (Community Facilities — healthcare)'
        : definition.setbackTable === 'educational' ? 'Clause 3.2.4.6 (Community Facilities — educational)'
        : 'Clause 3.2.4.8 (Industrial buildings)';
      rule = 'setback.non-residential';
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
    rule,
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

/**
 * Clause 5.1.5 — bazaar street front setback, keyed on **road width**, not plot area.
 *
 * Every other setback table in the byelaws is keyed on plot area or building height, and
 * routing bazaar street to the commercial (plot-area) ladder gave the wrong answer on
 * every bazaar-street plot (B-022).
 *
 * The gazette lists discrete road widths — 12, 18, 24, 30, 36, 45, 76 — rather than
 * bands, and says nothing about a road of, say, 15 m. Two readings are possible: take the
 * largest listed width at or below the actual road (3.0 m here), or round up to the next
 * listed width (4.5 m). Standing rule 4 applies and the bands below take the stricter,
 * rounding up. Logged as V-012.
 */
export const BAZAAR_STREET_FRONT_LADDER: readonly (Band & { label: string; front: number })[] = [
  { label: 'Up to 12 m road',  overMoreThan: 0,  upToAndIncluding: 12,       front: 3.0 },
  { label: '>12 to 18 m road', overMoreThan: 12, upToAndIncluding: 18,       front: 4.5 },
  { label: '>18 to 24 m road', overMoreThan: 18, upToAndIncluding: 24,       front: 6.0 },
  { label: '>24 to 30 m road', overMoreThan: 24, upToAndIncluding: 30,       front: 6.0 },
  { label: '>30 to 36 m road', overMoreThan: 30, upToAndIncluding: 36,       front: 7.5 },
  { label: '>36 to 45 m road', overMoreThan: 36, upToAndIncluding: 45,       front: 7.5 },
  { label: '>45 to 76 m road', overMoreThan: 45, upToAndIncluding: 76,       front: 9.0 },
  { label: '>76 m road',       overMoreThan: 76, upToAndIncluding: Infinity, front: 9.0 },
];

assertContiguousLadder('BAZAAR_STREET_FRONT_LADDER', BAZAAR_STREET_FRONT_LADDER);
// Clause 3.2.4.7 states no row below 1,000 sqm, so this ladder deliberately does not
// start at zero; `resolveBand` reports `below-first-band` and the caveat says so.
assertContiguousLadder('PUBLIC_AMENITY_LADDER', PUBLIC_AMENITY_LADDER);

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
