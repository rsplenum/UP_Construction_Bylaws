/**
 * Purchasable and premium purchasable FAR for commercial buildings — Clause 5.2.5,
 * gazette page 86.
 *
 * Chapter 3's matrix gives a base FAR and a maximum FAR, and the engine derives what a
 * project may buy as the gap between them: one lump. Clause 5.2.5 splits that gap the way
 * the byelaws actually price it —
 *
 *     MFAR  =  BFAR  +  PFAR  +  PPFAR
 *              base     purchasable   premium purchasable
 *
 * — and PFAR and PPFAR are bought on different terms under Chapter 9. Collapsing them
 * loses the distinction the charge turns on.
 *
 * The identity above holds on all 24 band-checks in the table, which is what establishes
 * the column mapping: the table's header row is the only thing that says which of its
 * fourteen columns is which, and the arithmetic closing on every row is the proof that it
 * was read correctly. Two cells round: 1.75 + 0.9 + 0.9 = 3.55, printed as 3.6.
 *
 * Extracted by tools/extract-commercial-far.py into docs/source/derived/commercial-far.json.
 */

import type { AreaType } from './far';

export type FarValue = number | 'unrestricted' | 'not available';

export interface PurchasableBand {
  readonly label: string;
  readonly overMoreThan: number;
  readonly upToAndIncluding: number;
  readonly purchasable: FarValue;
  readonly premiumPurchasable: FarValue;
  /** The maximum this chapter prints. Note V-014: Chapter 3 prints a lower figure. */
  readonly maxFarChapter5: FarValue;
}

export interface CommercialFarRow {
  readonly useType: string;
  readonly areaType: AreaType;
  readonly baseFar: number;
  readonly bands: readonly PurchasableBand[];
}

const BANDS = [
  { label: 'Up to 12m',  overMoreThan: 0,  upToAndIncluding: 12 },
  { label: '>12 – 24m',  overMoreThan: 12, upToAndIncluding: 24 },
  { label: '>24 – 45m',  overMoreThan: 24, upToAndIncluding: 45 },
  { label: '>45m',       overMoreThan: 45, upToAndIncluding: Infinity },
] as const;

const row = (
  useType: string,
  areaType: AreaType,
  baseFar: number,
  cells: readonly (readonly [FarValue, FarValue, FarValue])[],
): CommercialFarRow => ({
  useType,
  areaType,
  baseFar,
  bands: BANDS.map((b, i) => ({
    ...b,
    purchasable: cells[i][0],
    premiumPurchasable: cells[i][1],
    maxFarChapter5: cells[i][2],
  })),
});

const UR = 'unrestricted';
const NA = 'not available';

/** Clause 5.2.5, transcribed row by row. */
export const COMMERCIAL_FAR_BREAKDOWN: readonly CommercialFarRow[] = [
  row('Commercial units up to 100 m²', 'built_up', 1.5, [
    [0.3, 0.3, 2.1], [0.75, 0.75, 3.0], [1.5, 2.25, 5.25], [1.5, UR, UR],
  ]),
  row('Commercial units above 100 m²', 'built_up', 1.5, [
    [NA, NA, 1.5], [0.75, 0.75, 3.0], [1.5, 2.25, 5.25], [1.5, UR, UR],
  ]),
  row('Shopping malls', 'built_up', 2.0, [
    [NA, NA, 2.0], [1.0, 1.0, 4.0], [2.0, 3.0, 7.0], [2.0, UR, UR],
  ]),
  row('Commercial units up to 100 m²', 'non_built_up', 1.75, [
    [0.35, 0.35, 2.45], [0.9, 0.9, 3.6], [1.75, 2.6, 6.1], [1.75, UR, UR],
  ]),
  row('Commercial units above 100 m²', 'non_built_up', 1.75, [
    [NA, NA, 1.75], [0.9, 0.9, 3.6], [1.75, 2.6, 6.1], [1.75, UR, UR],
  ]),
  row('Shopping malls', 'non_built_up', 3.0, [
    [NA, NA, 3.0], [1.5, 1.5, 6.0], [3.0, 4.5, 10.5], [3.0, UR, UR],
  ]),
];

/**
 * Which row of Clause 5.2.5 an occupancy reads, where one applies. Only the commercial
 * uses this chapter covers are here; every other occupancy has no published split and
 * keeps a single purchasable figure until Chapter 9 is read.
 */
export function commercialFarRow(input: {
  occupancy: string;
  areaType: AreaType;
  plotAreaSqm: number;
}): CommercialFarRow | undefined {
  const mall = input.occupancy === 'com_mall';
  const useType = mall
    ? 'Shopping malls'
    : input.plotAreaSqm <= 100
      ? 'Commercial units up to 100 m²'
      : 'Commercial units above 100 m²';

  if (!mall && !['com_shop', 'com_complex'].includes(input.occupancy)) return undefined;

  return COMMERCIAL_FAR_BREAKDOWN.find(
    (r) => r.useType === useType && r.areaType === input.areaType,
  );
}

export function bandForRoad(row: CommercialFarRow, roadWidthM: number): PurchasableBand | undefined {
  return row.bands.find((b) => roadWidthM > b.overMoreThan && roadWidthM <= b.upToAndIncluding);
}

/**
 * V-014 — Chapters 3 and 5 print different maximums for the same commercial units.
 *
 *   built-up, >24–45 m       Chapter 3: 5.0    Chapter 5: 5.25
 *   non-built-up, >12–24 m   Chapter 3: 3.5    Chapter 5: 3.6
 *   non-built-up, >24–45 m   Chapter 3: 6.0    Chapter 5: 6.1
 *
 * Shopping malls agree in both chapters. The Chapter 5 figures are the internally
 * consistent ones — 1.5 + 1.5 + 2.25 = 5.25 and 1.75 + 1.75 + 2.6 = 6.1 exactly, while
 * Chapter 3's 5.0 and 6.0 do not decompose into any published components — which suggests
 * Chapter 3 is a rounded summary. That is an argument, not a resolution, and nothing in
 * either chapter subordinates the other.
 *
 * Standing rule 4 applies and the engine keeps the LOWER ceiling, which is Chapter 3's.
 * A project is never told it may build more than the most restrictive reading allows.
 */
export const CHAPTER_3_5_MAX_FAR_CONFLICTS: readonly {
  readonly areaType: AreaType;
  readonly band: string;
  readonly chapter3: number;
  readonly chapter5: number;
}[] = [
  { areaType: 'built_up',     band: '>24 – 45m', chapter3: 5.0, chapter5: 5.25 },
  { areaType: 'non_built_up', band: '>12 – 24m', chapter3: 3.5, chapter5: 3.6 },
  { areaType: 'non_built_up', band: '>24 – 45m', chapter3: 6.0, chapter5: 6.1 },
];
