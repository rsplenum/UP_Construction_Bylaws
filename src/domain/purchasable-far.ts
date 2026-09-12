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
  /** Null where the gazette states none — Clause 7.1.5's industry tables. */
  readonly areaType: AreaType | null;
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
  // The gazette uses both "<18m" and "≤12m" for an upper-bounded qualifier.
  const upperBounded = /^[<≤]/.test(q.trimStart());
  return upperBounded
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
 * How far the printed maximum may sit above its own components before the difference is
 * a contradiction rather than a rounding step. The gazette rounds to one decimal place,
 * and the widest rounding it actually takes is 3.55 → 3.6.
 */
export const PURCHASABLE_ROUNDING_TOLERANCE = 0.05;

/**
 * The ceiling to apply for a band — the lowest reading the gazette supports.
 *
 * On 153 of the 157 band checks the printed MFAR and the sum of the printed components
 * are the same number and this returns it. On the other four the gazette contradicts
 * itself, and standing rule 4 says to model both readings and apply the stricter one, so
 * this returns the lesser.
 *
 * Which of the two is lower is not a constant. Until Chapter 8 the printed figure was
 * always the lower one, and the engine could simply take the gazette at its word — which
 * is what the Clause 6.2.4 note in GAZETTE_ARITHMETIC_DEFECTS describes. Clause 8.1.3.1
 * is the first table to print a maximum ABOVE its own components (5.25 against 4.5), so
 * honouring the printed figure there would over-permit by 0.75 FAR against the strictest
 * reading. Choosing per band rather than per table is what covers both directions.
 */
export function strictCeiling(row: PurchasableRow, band: PurchasableBand): number | null {
  const printed = asCeiling(band.maxFar);
  if (printed === null) return null;
  if (row.baseFar === null || !baseFarApplies(row, band)) return printed;
  // "Unrestricted" in either purchasable column puts no number on the components, so the
  // printed maximum is the only reading there is.
  if (band.purchasable === 'unrestricted' || band.premiumPurchasable === 'unrestricted') {
    return printed;
  }
  const purchasable = typeof band.purchasable === 'number' ? band.purchasable : 0;
  const premium = typeof band.premiumPurchasable === 'number' ? band.premiumPurchasable : 0;
  const components = Number((row.baseFar + purchasable + premium).toFixed(4));
  // Three cells round rather than contradict: 1.75 + 0.9 + 0.9 = 3.55 is printed as 3.6.
  // Preferring the components there would shave a ceiling by a rounding step and call it
  // a stricter reading, so only a gap wider than that rounding counts as a disagreement.
  return components + PURCHASABLE_ROUNDING_TOLERANCE < printed ? components : printed;
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

  // Clause 8.1.3.1. Its two rows carry the area type inside their own names — "MU
  // Built-up Area" and "MU non-built-up Area" — where other tables put it in a heading
  // above the row, so the prefix is all there is to match on; `find` pairs the right one
  // by area type.
  if (occupancy === 'mixed_use') return find(105, (u) => u.startsWith('MU'));
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
 * Places where the gazette's own arithmetic does not close.
 *
 * The identity MFAR = BFAR + PFAR + PPFAR holds on 153 of the 157 band checks across the
 * sixteen printed tables. The four exceptions are drafting slips, and `resolved` records
 * what the engine applies instead — always the lowest reading the clause supports, per
 * standing rule 4.
 *
 * There is a second, stronger regularity underneath the identity, and it is what makes
 * these four legible as slips rather than as unusual rules. Across the thirty-six rows
 * that follow it, every table generates its 24–45 m band from the base FAR alone:
 *
 *     PFAR = 1.0 × BFAR      PPFAR = 1.5 × BFAR      MFAR = 3.5 × BFAR
 *
 * so a base of 2.0 gives 2.0 / 3.0 / 7.0 and a base of 2.5 gives 2.5 / 3.75 / 8.75. Every
 * row below departs from that as well as from the identity, and in three of the four the
 * departing figures are character for character a row printed elsewhere for a different
 * base — which is what a copied cell looks like.
 */
export const GAZETTE_ARITHMETIC_DEFECTS: readonly {
  readonly gazettePage: number;
  readonly useType: string;
  readonly areaType: AreaType | null;
  readonly band: string;
  readonly componentsImply: number;
  readonly printed: number;
  /** What the engine applies: the lowest reading, or a figure from another chapter. */
  readonly resolved: number;
  readonly note: string;
}[] = [
  {
    gazettePage: 102,
    useType: 'Flatted Factories, Data Centres',
    areaType: null,
    band: '>12 -24m and >24 - 45m',
    componentsImply: 4.0,
    printed: 2.0,
    resolved: 6.0,
    note: 'Clause 7.1.5. The printed maximum is BELOW the printed base FAR, which cannot '
      + 'be right: base 3.00 against maxima of 2.00 and 3.50. The purchasable columns '
      + '(0.50 / 0.50, 1.00 / 1.50) are coherent only with a base of 1.00, and are '
      + 'character for character the same as the secondary-school row in Clause 6.2.4, '
      + 'which does carry 1.00. Chapter 3 Sl. 2 and 3 give flatted factories and data '
      + 'centres base 3.0 with maxima of 3.0 / 6.0 / 9.0, which is internally coherent. '
      + 'The engine uses Chapter 3 and ignores this row.',
  },
  {
    gazettePage: 97,
    useType: 'Schools (primary / nursery)',
    areaType: 'non_built_up',
    band: 'Upto 12m',
    componentsImply: 1.6,
    printed: 1.4,
    resolved: 1.4,
    note: 'Clause 6.2.4. The narrowest band repeats the built-up figures unscaled where '
      + 'every other band in the row scales by 1.2. The printed 1.40 is the lower figure '
      + 'and is what the engine uses.',
  },
  {
    gazettePage: 105,
    useType: 'MU Built-up Area',
    areaType: 'built_up',
    band: '24 - 45m',
    componentsImply: 4.5,
    printed: 5.25,
    resolved: 4.5,
    note: 'Clause 8.1.3.1, and the first table in the byelaws to print a maximum ABOVE '
      + 'its own components rather than below. Three different base FARs appear in this '
      + 'one cell: the row carries base 2.00, its PFAR and PPFAR of 1.00 / 1.50 are the '
      + 'figures for a base of 1.00, and the printed maximum of 5.25 is 3.5 × 1.50, the '
      + 'figure for a base of 1.50. Nothing in the cell is coherent with 2.00, which the '
      + 'pattern would give as 2.00 / 3.00 / 7.00. The 1.00 / 1.50 pair is the same one '
      + 'Clause 7.1.5 imported from the secondary-school row (V-023), so the same '
      + 'base-1.00 line appears to have been copied into two chapters. The engine takes '
      + 'the components at 4.50 — the lowest of the three readings, and 0.75 below the '
      + 'figure printed.',
  },
  {
    gazettePage: 105,
    useType: 'MU non-built-up Area',
    areaType: 'non_built_up',
    band: '24 - 45m',
    componentsImply: 8.75,
    printed: 6.25,
    resolved: 6.25,
    note: 'Clause 8.1.3.1. Unlike the built-up row above it, this one\'s components are '
      + 'exactly right: base 2.50 with PFAR 2.50 and PPFAR 3.75 is what the pattern gives '
      + 'for a base of 2.50, and matches group housing and hotels at the same base cell '
      + 'for cell. Only the total is wrong, and by an identifiable step — 2.50 + 3.75 = '
      + '6.25 is the printed figure exactly, so the base was left out of the sum. The '
      + 'engine honours the printed 6.25, which is 2.50 below what the components imply.',
  },
];

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
