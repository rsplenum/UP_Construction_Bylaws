/**
 * Base, purchasable and premium purchasable FAR — every BFAR/PFAR/PPFAR/MFAR table the
 * byelaws print, read from the chapter PDFs.
 *
 *     MFAR  =  BFAR  +  PFAR  +  PPFAR
 *              base     purchasable   premium purchasable
 *
 * Chapter 3's matrix gives only a base and a maximum, and the engine derives what a
 * project may buy as the gap between them — one lump. Chapter 9 prices purchasable and
 * premium purchasable on different terms, so that lump hides the distinction the charge
 * turns on. These tables give the split.
 *
 * The rows are IMPORTED, not transcribed. tools/extract-purchasable-far.py reads them
 * from the chapter extractions and writes ./data/purchasable-far.json, so there is one
 * source and no opportunity for a typo to disagree with the gazette quietly. The identity
 * above is checked on every band of every row at extraction time — 72 checks across
 * 7 tables, all passing — which is what establishes that the fourteen columns were mapped
 * correctly in the first place.
 */

import raw from './data/purchasable-far.json';
import type { AreaType } from './far';

export type FarValue = number | 'unrestricted' | 'not available';

export interface PurchasableBand {
  readonly label: string;
  readonly overMoreThan: number;
  /** null where the band is open-ended. */
  readonly upToAndIncluding: number | null;
  readonly purchasable: FarValue | null;
  readonly premiumPurchasable: FarValue | null;
  readonly maxFar: FarValue | null;
}

export interface PurchasableRow {
  readonly id: string;
  readonly chapter: string;
  readonly gazettePage: number;
  readonly useType: string;
  readonly areaType: AreaType;
  readonly baseFar: number | null;
  /**
   * Clause 4.4 prints TWO base FARs for one use — 2.00 below an 18 m road and 2.25 at or
   * above it — against one shared set of band columns. Where this is set, the row's base
   * FAR applies only over that part of the road range.
   */
  readonly baseFarAppliesWhen: string | null;
  readonly bands: readonly PurchasableBand[];
}

export const PURCHASABLE_FAR_ROWS = raw.rows as readonly PurchasableRow[];

export const isFinite = (v: FarValue | null): v is number => typeof v === 'number';

/** Infinity for "unrestricted", null for "not available" or absent. */
export function asCeiling(v: FarValue | null): number | null {
  if (v === 'unrestricted') return Infinity;
  return typeof v === 'number' ? v : null;
}

/**
 * Does this row's base FAR apply over this band?
 *
 * Only Clause 4.4 makes this a real question: it prints two base FARs for one use, 2.00
 * below an 18 m road and 2.25 at or above it, against one shared set of band columns. So
 * each row covers only part of the road range, and pairing a base FAR with a band outside
 * its range gives a number the gazette never states — which is exactly how the split was
 * noticed, the identity failing by 2.0 until the pairing was corrected.
 */
export function baseFarApplies(row: PurchasableRow, band: PurchasableBand): boolean {
  const q = row.baseFarAppliesWhen;
  if (!q) return true;
  const threshold = Number(/\d+(?:\.\d+)?/.exec(q)?.[0]);
  if (!Number.isFinite(threshold)) return true;
  return q.trimStart().startsWith('<')
    ? band.overMoreThan < threshold
    : band.overMoreThan >= threshold;
}

export function bandForRoad(row: PurchasableRow, roadWidthM: number): PurchasableBand | undefined {
  return row.bands.find(
    (b) => roadWidthM > b.overMoreThan
      && (b.upToAndIncluding === null || roadWidthM <= b.upToAndIncluding),
  );
}

/**
 * Which printed row an occupancy reads.
 *
 * Several of these are finer-grained than the occupancy list: Clause 5.2.5 splits
 * commercial units at 100 m² where Chapter 3 has one row, and Clause 5.4.4 separates a
 * multiplex from a single-screen cinema. Where the gazette makes a distinction the
 * occupancy list does not, the plot area decides.
 */
export function purchasableRowFor(input: {
  occupancy: string;
  areaType: AreaType;
  plotAreaSqm: number;
  /** Clause 4.4 schemes read a different table from ordinary group housing. */
  isAffordableHousingScheme?: boolean;
  roadWidthM?: number;
}): PurchasableRow | undefined {
  const { occupancy, areaType, plotAreaSqm } = input;

  const find = (page: number, match: (useType: string) => boolean) =>
    PURCHASABLE_FAR_ROWS.find(
      (r) => r.gazettePage === page && r.areaType === areaType && match(r.useType));

  if (occupancy === 'res_group_housing') {
    if (!input.isAffordableHousingScheme) return find(78, (u) => u.includes('Group Housing'));
    // Clause 4.4 prints two base FARs split at an 18 m road; pick the one that applies.
    const candidates = PURCHASABLE_FAR_ROWS.filter(
      (r) => r.gazettePage === 82 && r.areaType === areaType);
    if (candidates.length <= 1) return candidates[0];
    const wide = (input.roadWidthM ?? 0) >= 18;
    return candidates.find((r) => (r.baseFarAppliesWhen ?? '').includes(wide ? '≥' : '<'))
      ?? candidates[0];
  }

  if (occupancy === 'com_bazaar') return find(84, (u) => u.includes('Bazaar'));
  if (occupancy === 'com_hotel') return find(87, (u) => u.includes('Hotels'))
    ?? find(88, (u) => u.includes('Hotels'));

  if (occupancy === 'com_mall') {
    // Clause 5.4.4 splits the cinema table into multiplex and the smaller formats; a mall
    // reads Clause 5.2.5's own mall row.
    return find(86, (u) => u.includes('Shopping malls'));
  }

  if (occupancy === 'com_shop' || occupancy === 'com_complex') {
    const small = plotAreaSqm <= 100;
    return find(86, (u) => u.includes('Units') && (small ? !u.includes('>100') : u.includes('>100')));
  }

  return undefined;
}

/**
 * Where two chapters print a different maximum for the same use, area type and road.
 *
 * Every one of these was found by comparing the Chapter 3 matrix against the Chapter 4
 * and 5 breakdowns band by band, and in every case the breakdown's figure is the one that
 * decomposes exactly into its own published components while Chapter 3's does not — which
 * suggests Chapter 3 is a rounded summary. That is an argument, not a resolution: nothing
 * in either chapter subordinates the other.
 *
 * Standing rule 4 applies. The engine keeps the LOWER ceiling, so no project is told it
 * may build more than the most restrictive reading allows.
 */
export const CROSS_CHAPTER_MAX_FAR_CONFLICTS: readonly {
  readonly useType: string;
  readonly areaType: AreaType;
  readonly band: string;
  readonly chapter3: number;
  readonly breakdown: number;
  readonly breakdownClause: string;
}[] = [
  { useType: 'Group housing', areaType: 'built_up', band: '9–12 m',
    chapter3: 2.0, breakdown: 2.1, breakdownClause: '4.2.8' },
  { useType: 'Commercial units up to 100 m²', areaType: 'built_up', band: '>24–45 m',
    chapter3: 5.0, breakdown: 5.25, breakdownClause: '5.2.5' },
  { useType: 'Commercial units up to 100 m²', areaType: 'non_built_up', band: '>12–24 m',
    chapter3: 3.5, breakdown: 3.6, breakdownClause: '5.2.5' },
  { useType: 'Commercial units up to 100 m²', areaType: 'non_built_up', band: '>24–45 m',
    chapter3: 6.0, breakdown: 6.1, breakdownClause: '5.2.5' },
  { useType: 'Shopping malls', areaType: 'non_built_up', band: '>24–45 m',
    chapter3: 9.0, breakdown: 10.5, breakdownClause: '5.2.5' },
  { useType: 'Multiplex', areaType: 'non_built_up', band: '>24–45 m',
    chapter3: 9.0, breakdown: 10.5, breakdownClause: '5.4.4' },
];

/**
 * Bands the breakdowns state and Chapter 3 leaves out entirely.
 *
 * Silence is not prohibition where another clause makes the band reachable: Clause 4.2.3
 * permits group housing on a 12 m road in a new layout and Clause 5.3.3 permits a hotel of
 * up to 20 rooms on a 9 m road, so refusing those would reject a lawful project. Where the
 * breakdown itself prints "not available" — a cinema below 12 m — that IS a prohibition
 * and is honoured.
 */
export const CHAPTER_3_GAPS: readonly {
  readonly useType: string;
  readonly areaType: AreaType;
  readonly band: string;
  readonly maxFar: FarValue;
  readonly reachableBecause: string;
}[] = [
  { useType: 'Group housing', areaType: 'non_built_up', band: 'up to 12 m', maxFar: 3.5,
    reachableBecause: 'Clause 4.2.3 sets the minimum road for group housing in a new layout at 12 m, which this band includes.' },
  { useType: 'Hotels', areaType: 'built_up', band: 'up to 12 m', maxFar: 2.0,
    reachableBecause: 'Clause 5.3.3 allows a hotel of up to 20 rooms on a 9 m road.' },
  { useType: 'Hotels', areaType: 'non_built_up', band: 'up to 12 m', maxFar: 2.5,
    reachableBecause: 'Clause 5.3.3 allows a hotel of up to 20 rooms on a 9 m road.' },
  { useType: 'Shopping malls', areaType: 'built_up', band: 'up to 12 m', maxFar: 2.0,
    reachableBecause: 'Unreachable in practice — Clause 5.2.3 sets the minimum road for a mall at 18 m — but the gazette prints the row.' },
  { useType: 'Shopping malls', areaType: 'non_built_up', band: 'up to 12 m', maxFar: 3.0,
    reachableBecause: 'Unreachable in practice — Clause 5.2.3 sets the minimum road for a mall at 18 m — but the gazette prints the row.' },
];
