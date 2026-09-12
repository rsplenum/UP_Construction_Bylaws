import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveBaseFar } from '../far';
import { BASE_FAR, COMMERCIAL_MAX_FAR, GROUP_HOUSING_MAX_FAR, MIXED_USE_MAX_FAR } from '../far';
import {
  CHAPTER_3_GAPS,
  GAZETTE_ARITHMETIC_DEFECTS,
  baseFarApplies,
  CROSS_CHAPTER_MAX_FAR_CONFLICTS,
  PURCHASABLE_FAR_ROWS,
  asCeiling,
  bandForRoad,
  purchasableRowFor,
  strictCeiling,
  type PurchasableRow,
} from '../purchasable-far';

const n = (v: unknown): number | null => (typeof v === 'number' ? v : null);

describe('every printed BFAR/PFAR/PPFAR/MFAR table is loaded', () => {
  it('has every row from every printed table', () => {
    expect(PURCHASABLE_FAR_ROWS).toHaveLength(43);
    const pages = [...new Set(PURCHASABLE_FAR_ROWS.map((r) => r.gazettePage))].sort((a, b) => a - b);
    expect(pages).toEqual([78, 82, 84, 86, 87, 88, 90, 95, 97, 98, 99, 100, 101, 102, 105]);
  });

  it('splits a use that carries two base FARs into two rows with distinct ids', () => {
    const industrial = PURCHASABLE_FAR_ROWS.filter(
      (r) => r.gazettePage === 101 && r.useType === 'Industrial Buildings');
    expect(industrial).toHaveLength(2);
    expect(industrial.map((r) => r.baseFar).sort()).toEqual([1.5, 2.5]);
    expect(new Set(industrial.map((r) => r.id)).size).toBe(2);
  });

  it('carries a null area type where the gazette states none', () => {
    // Clause 7.1.5's industry tables have no built-up / new-layout split: industry sits
    // in a use zone instead. Rejecting rows without an area type dropped all of them.
    // Bounded at both ends — Chapter 8 is the next page along and does split by area
    // type, so an open-ended `>= 101` swept its two rows in here as well.
    const industry = PURCHASABLE_FAR_ROWS.filter(
      (r) => r.gazettePage >= 101 && r.gazettePage <= 102);
    expect(industry).toHaveLength(4);
    expect(industry.every((r) => r.areaType === null)).toBe(true);
  });

  it('gives every row three or four road bands', () => {
    // Clause 6.3.4's marriage-hall table starts at 18 m and so has three, not four.
    for (const r of PURCHASABLE_FAR_ROWS) {
      expect(r.bands.length, r.id).toBeGreaterThanOrEqual(3);
      expect(r.bands.length, r.id).toBeLessThanOrEqual(4);
    }
  });

  it('keeps the bands contiguous and ascending, and open-ended at the top', () => {
    for (const r of PURCHASABLE_FAR_ROWS) {
      let previous: number | null = null;
      for (const b of r.bands) {
        if (previous !== null) {
          expect(b.overMoreThan, `${r.id} ${b.label} follows a gap`).toBe(previous);
        }
        previous = b.upToAndIncluding ?? Infinity;
      }
      expect(r.bands.at(-1)!.upToAndIncluding, r.id).toBeNull();
    }
  });

  /**
   * Not every table starts at a zero-width road. Clause 6.1.4 begins at >12 m and
   * Clauses 6.3.4 and 6.4.3 at 18 m, because below that the use has no published FAR at
   * all — which is a floor on the road width, expressed as the absence of a row.
   */
  it('starts some tables above a zero-width road', () => {
    const floors = new Map<number, number>();
    for (const r of PURCHASABLE_FAR_ROWS) {
      const start = r.bands[0].overMoreThan;
      if (start > 0) floors.set(r.gazettePage, start);
    }
    expect(floors.get(95)).toBe(12);    // healthcare
    expect(floors.get(98)).toBe(18);    // marriage hall
    expect(floors.get(99)).toBe(18);    // auditorium, built-up
    expect(floors.get(100)).toBe(18);   // auditorium, new layout
    // Everything read before chapter 6 starts at zero.
    expect([...floors.keys()].every((p) => p >= 95)).toBe(true);
  });

  /**
   * MFAR = BFAR + PFAR + PPFAR. Checked at extraction time across all 72 bands; repeated
   * here so a hand edit to the generated data cannot slip past. Three cells round —
   * 1.75 + 0.9 + 0.9 = 3.55, printed 3.6 — so the tolerance is that rounding step plus
   * room for binary floating point.
   */
  it('satisfies MFAR = BFAR + PFAR + PPFAR on every band', () => {
    for (const r of PURCHASABLE_FAR_ROWS) {
      if (r.baseFar === null) continue;
      for (const b of r.bands) {
        const max = n(b.maxFar);
        // Clause 4.4's rows each cover only part of the road range; the other row's base
        // FAR governs the rest, so summing across the whole row is not what it states.
        if (max === null || !baseFarApplies(r, b)) continue;
        // Matched on the row, not the band: Clause 7.1.5's defect spans two bands.
        const known = GAZETTE_ARITHMETIC_DEFECTS.some(
          (d) => d.gazettePage === r.gazettePage && d.useType === r.useType
            && d.areaType === r.areaType);
        if (known) continue;
        const sum = r.baseFar + (n(b.purchasable) ?? 0) + (n(b.premiumPurchasable) ?? 0);
        expect(Math.abs(sum - max), `${r.id} ${b.label}: ${sum} vs ${max}`)
          .toBeLessThanOrEqual(0.05 + 1e-9);
      }
    }
  });
});

describe('the four places the gazette’s own arithmetic does not close', () => {
  it('resolves every one of them to the lowest reading available', () => {
    expect(GAZETTE_ARITHMETIC_DEFECTS).toHaveLength(4);
    for (const d of GAZETTE_ARITHMETIC_DEFECTS) {
      // Clause 7.1.5 is the exception: its row is discarded for Chapter 3's, so the
      // figure the engine applies comes from neither column here.
      if (d.gazettePage === 102) continue;
      expect(d.resolved, `p.${d.gazettePage} ${d.band}`)
        .toBe(Math.min(d.printed, d.componentsImply));
    }
  });

  /**
   * Until Chapter 8 the printed maximum was always the lower of the two, so "honour what
   * the gazette prints" and "apply the stricter reading" were the same instruction and
   * nothing distinguished them. Clause 8.1.3.1 prints 5.25 against components of 4.5 and
   * separates them: taking the gazette at its word there would over-permit.
   */
  it('finds the lower figure in both columns, so neither can be preferred by rule', () => {
    const printedIsLower = GAZETTE_ARITHMETIC_DEFECTS.filter((d) => d.printed < d.componentsImply);
    const componentsAreLower = GAZETTE_ARITHMETIC_DEFECTS.filter((d) => d.componentsImply < d.printed);
    expect(printedIsLower.length).toBeGreaterThan(0);
    expect(componentsAreLower.length).toBeGreaterThan(0);
    expect(componentsAreLower.map((d) => d.gazettePage)).toContain(105);
  });

  /**
   * The identity is not the only regularity the tables follow. Every row that behaves
   * generates its 24–45 m band from the base FAR alone — PFAR 1.0×, PPFAR 1.5×, MFAR
   * 3.5× — and it is the departure from THAT which makes a copied cell recognisable.
   * Asserted here so the claim in the GAZETTE_ARITHMETIC_DEFECTS comment stays true as
   * more chapters land.
   */
  it('holds a 1.0× / 1.5× / 3.5× band on every row that is not a known defect', () => {
    const deviations: string[] = [];
    for (const r of PURCHASABLE_FAR_ROWS) {
      if (r.baseFar === null) continue;
      const band = r.bands.find((b) => /24\s*-\s*45/.test(b.label));
      if (!band || !baseFarApplies(r, band)) continue;
      const got = [n(band.purchasable), n(band.premiumPurchasable), n(band.maxFar)];
      if (got.some((v) => v === null)) continue;
      const want = [1.0 * r.baseFar, 1.5 * r.baseFar, 3.5 * r.baseFar];
      if (got.some((v, i) => Math.abs(v! - want[i]) > 0.051)) deviations.push(r.id);
    }
    // Clause 6.2.4's two school rows run on 1.0× / 1.0× / 3.0× throughout — a different
    // multiplier family, internally consistent, and not a defect.
    const schools = deviations.filter((id) => id.includes('schools-primary'));
    expect(schools).toHaveLength(2);
    const defects = deviations.filter((id) => !id.includes('schools-primary'));
    expect(defects.sort()).toEqual([
      'ch07-p102-flatted-factories-data-centres-None',
      'ch08-p105-mu-built-up-area-built_up',
      'ch08-p105-mu-non-built-up-area-non_built_up',
    ]);
  });

  /**
   * Clause 7.1.5 is the worse of the two: it prints a maximum BELOW the base FAR, which
   * cannot be right whatever the intent.
   */
  it('includes a row whose maximum is below its own base FAR', () => {
    const row = PURCHASABLE_FAR_ROWS.find(
      (r) => r.gazettePage === 102 && r.useType.startsWith('Flatted'))!;
    expect(row.baseFar).toBe(3.0);
    expect(row.bands[1].maxFar).toBe(2.0);              // below the base
    expect(row.bands[2].maxFar).toBe(3.5);
    // Its purchasable columns are coherent only with a base of 1.00.
    expect(row.bands[1].purchasable).toBe(0.5);
    expect(row.bands[1].premiumPurchasable).toBe(0.5);
  });

  it('uses the printed figure, which is the lower one', () => {
    const row = PURCHASABLE_FAR_ROWS.find(
      (r) => r.gazettePage === 97 && r.areaType === 'non_built_up'
        && r.useType.startsWith('Schools'))!;
    expect(row.baseFar).toBe(1.2);
    expect(row.bands[0].maxFar).toBe(1.4);               // not the 1.6 the components imply
    // Every other band in the row scales by 1.2 from its built-up twin.
    expect(row.bands[1].maxFar).toBe(2.4);
    expect(row.bands[2].maxFar).toBe(3.6);
  });
});

describe('Clause 8.1.3.1 — mixed use, the one table with no Chapter 3 twin', () => {
  const mixed = (areaType: 'built_up' | 'non_built_up') =>
    purchasableRowFor({ occupancy: 'mixed_use', areaType, plotAreaSqm: 800 })!;

  it('reads its own row, not the commercial one written for shops', () => {
    expect(mixed('built_up').gazettePage).toBe(105);
    expect(mixed('built_up').baseFar).toBe(2.0);
    expect(mixed('non_built_up').baseFar).toBe(2.5);
    // The row the engine used to read, for contrast: base 1.5 and 1.75.
    expect(BASE_FAR.commercial).toEqual({ built_up: 1.5, non_built_up: 1.75 });
  });

  it('has no row in the Chapter 3 matrix to fall back on', () => {
    // Every other cross-chapter disagreement is resolved by preferring Chapter 3's lower
    // ceiling. Mixed use has no Chapter 3 row, so Clause 8.1.3.1 is the only source and
    // the contradiction inside it has to be resolved on its own terms.
    expect(CROSS_CHAPTER_MAX_FAR_CONFLICTS.some((c) => /mixed/i.test(c.useType))).toBe(false);
    expect(CHAPTER_3_GAPS.some((g) => /mixed/i.test(g.useType))).toBe(false);
  });

  it.each([
    ['built_up', 2.0, 4.0, 4.5],
    ['non_built_up', 2.5, 5.0, 6.25],
  ] as const)('resolves the %s ceilings to %s / %s / %s', (areaType, narrow, mid, wide) => {
    const row = mixed(areaType);
    expect(strictCeiling(row, row.bands[0])).toBe(narrow);
    expect(strictCeiling(row, row.bands[1])).toBe(mid);
    expect(strictCeiling(row, row.bands[2])).toBe(wide);
    expect(strictCeiling(row, row.bands[3])).toBe(Infinity);
  });

  it('takes 4.50 over the printed 5.25 on a built-up 24–45 m road', () => {
    const row = mixed('built_up');
    expect(row.bands[2].maxFar).toBe(5.25);            // what the gazette prints
    expect(strictCeiling(row, row.bands[2])).toBe(4.5); // what the components support
  });

  it('takes the printed 6.25 over the components’ 8.75 in a new layout', () => {
    const row = mixed('non_built_up');
    expect(row.bands[2].purchasable).toBe(2.5);
    expect(row.bands[2].premiumPurchasable).toBe(3.75);
    // 2.5 + 3.75 = 6.25 exactly: the printed total left the base out of the sum.
    expect(row.bands[2].maxFar).toBe(6.25);
    expect(strictCeiling(row, row.bands[2])).toBe(6.25);
  });

  /**
   * The ladder in far.ts is written out by hand so it reads like the others; this is what
   * stops it drifting from the table it was read off. A typo in either one fails here.
   */
  it('keeps far.ts’s ladder equal to the extracted row, band for band', () => {
    for (const areaType of ['built_up', 'non_built_up'] as const) {
      const row = mixed(areaType);
      const ladder = MIXED_USE_MAX_FAR[areaType].filter((b) => b.maxFar !== 0);
      expect(ladder, areaType).toHaveLength(row.bands.length);
      row.bands.forEach((band, i) => {
        expect(ladder[i].maxFar, `${areaType} ${band.label}`).toBe(strictCeiling(row, band));
        expect(ladder[i].upToAndIncluding, `${areaType} ${band.label}`)
          .toBe(band.upToAndIncluding ?? Infinity);
      });
    }
  });

  /**
   * Clause 8.1.3 puts the means of access at 9 m for the most permissive location, so
   * nothing below that is reachable. The same 9 m floor under the commercial ladder is
   * the engine's own inference (V-007); this one the gazette states.
   */
  it('bars mixed use below a 9 m road, on the gazette’s own figure', () => {
    for (const areaType of ['built_up', 'non_built_up'] as const) {
      expect(MIXED_USE_MAX_FAR[areaType][0].maxFar, areaType).toBe(0);
      expect(MIXED_USE_MAX_FAR[areaType][0].upToAndIncluding, areaType).toBe(9);
    }
  });
});

describe('the rows the gazette prints but a project cannot always reach', () => {
  // Clause 5.4.4: a cinema has NO maximum on the narrowest band — not permitted at all.
  it('gives cinemas no FAR below a 12 m road', () => {
    const cinemas = PURCHASABLE_FAR_ROWS.filter((r) => r.gazettePage === 90);
    expect(cinemas).toHaveLength(3);
    for (const r of cinemas) {
      expect(r.bands[0].maxFar, r.id).toBe('not available');
    }
  });

  // Everywhere else the narrowest band offers base FAR and nothing to buy.
  it('offers nothing purchasable on the narrowest band for larger uses', () => {
    const noBuy = PURCHASABLE_FAR_ROWS.filter(
      (r) => r.bands[0].purchasable === 'not available'
        // Where a use has two base FARs, only the one covering the narrowest band can be
        // compared against it — Clause 7.1.5 prints 1.50 for ≤12 m and 2.50 above.
        && baseFarApplies(r, r.bands[0]));
    expect(noBuy.length).toBeGreaterThanOrEqual(7);
    for (const r of noBuy) {
      if (r.bands[0].maxFar === 'not available') continue;
      expect(r.bands[0].maxFar, r.id).toBe(r.baseFar);
    }
  });
});

describe('Clause 4.4 — two base FARs for one use', () => {
  const affordable = PURCHASABLE_FAR_ROWS.filter((r) => r.gazettePage === 82);

  it('prints 2.00 below an 18 m road and 2.25 at or above it', () => {
    const builtUp = affordable.filter((r) => r.areaType === 'built_up');
    expect(builtUp).toHaveLength(2);
    expect(builtUp.map((r) => r.baseFar).sort()).toEqual([2.0, 2.25]);
    expect(builtUp.every((r) => r.baseFarAppliesWhen)).toBe(true);
  });

  it('picks the base FAR that matches the road', () => {
    const narrow = purchasableRowFor({
      occupancy: 'res_group_housing', areaType: 'built_up', plotAreaSqm: 5_000,
      isAffordableHousingScheme: true, roadWidthM: 12,
    });
    const wide = purchasableRowFor({
      occupancy: 'res_group_housing', areaType: 'built_up', plotAreaSqm: 5_000,
      isAffordableHousingScheme: true, roadWidthM: 24,
    });
    expect(narrow?.baseFar).toBe(2.0);
    expect(wide?.baseFar).toBe(2.25);
  });

  it('applies each base FAR only over its own part of the road range', () => {
    const [low, high] = affordable
      .filter((r) => r.areaType === 'built_up')
      .sort((a, b) => (a.baseFar ?? 0) - (b.baseFar ?? 0));
    expect(baseFarApplies(low, low.bands[0])).toBe(true);    // 2.00 governs below 18 m
    expect(baseFarApplies(low, low.bands[1])).toBe(false);
    expect(baseFarApplies(high, high.bands[0])).toBe(false); // 2.25 governs from 18 m up
    expect(baseFarApplies(high, high.bands[1])).toBe(true);
  });

  it('bands on 18 m, where every other table bands on 12 m', () => {
    expect(affordable[0].bands[0].upToAndIncluding).toBe(18);
    const ordinary = PURCHASABLE_FAR_ROWS.find((r) => r.gazettePage === 78)!;
    expect(ordinary.bands[0].upToAndIncluding).toBe(12);
  });
});

describe('routing an occupancy to its printed row', () => {
  const at = (occupancy: string, plotAreaSqm = 500, areaType: 'built_up' | 'non_built_up' = 'built_up') =>
    purchasableRowFor({ occupancy, areaType, plotAreaSqm });

  it.each([
    ['res_group_housing', 78, 'Group Housing'],
    ['com_bazaar', 84, 'Bazaar Street'],
    ['com_hotel', 87, 'Hotels'],
    ['com_mall', 86, 'Shopping malls'],
  ])('%s reads gazette page %s', (occupancy, page, useType) => {
    const r = at(occupancy);
    expect(r?.gazettePage).toBe(page);
    expect(r?.useType).toContain(useType);
  });

  it('splits commercial units at 100 m², which Chapter 3 does not', () => {
    expect(at('com_shop', 80)?.useType).toContain('up to100');
    expect(at('com_shop', 250)?.useType).toContain('>100');
    // The split only bites on the narrowest road: 2.1 against 1.5.
    expect(at('com_shop', 80)?.bands[0].maxFar).toBe(2.1);
    expect(at('com_shop', 250)?.bands[0].maxFar).toBe(1.5);
  });

  it('finds the non-built-up hotel row on its own page', () => {
    expect(at('com_hotel', 800, 'non_built_up')?.gazettePage).toBe(88);
    expect(at('com_hotel', 800, 'non_built_up')?.baseFar).toBe(2.5);
  });

  it('has no row for a use these chapters do not cover', () => {
    expect(at('inst_health')).toBeUndefined();
    expect(at('res_single')).toBeUndefined();
  });

  it.each([[10, 0], [12, 0], [12.1, 1], [45, 2], [60, 3]])(
    'a %s m road falls in band %s', (road, index) => {
      const r = at('com_shop', 80)!;
      expect(bandForRoad(r, road as number)).toBe(r.bands[index as number]);
    },
  );
});

describe('where the chapters disagree, the engine keeps the lower ceiling', () => {
  it('records all six conflicting cells', () => {
    expect(CROSS_CHAPTER_MAX_FAR_CONFLICTS).toHaveLength(6);
    for (const c of CROSS_CHAPTER_MAX_FAR_CONFLICTS) {
      expect(c.breakdown, `${c.useType} ${c.band}`).toBeGreaterThan(c.chapter3);
    }
  });

  it('keeps Chapter 3’s commercial ceilings, not Chapter 5’s', () => {
    const ceilings = (t: readonly { maxFar: number }[]) =>
      t.map((b) => b.maxFar).filter((f) => f !== 0);
    expect(ceilings(COMMERCIAL_MAX_FAR.built_up)).toContain(5.0);
    expect(ceilings(COMMERCIAL_MAX_FAR.built_up)).not.toContain(5.25);
    expect(ceilings(COMMERCIAL_MAX_FAR.non_built_up)).toEqual([2.45, 3.5, 6.0, Infinity]);
  });

  it('keeps Chapter 3’s group-housing ceiling of 2.0 on a 9–12 m road', () => {
    const band = GROUP_HOUSING_MAX_FAR.built_up.find((b) => b.upToAndIncluding === 12)!;
    expect(band.maxFar).toBe(2.0);
    const printed = PURCHASABLE_FAR_ROWS.find(
      (r) => r.gazettePage === 78 && r.areaType === 'built_up')!;
    expect(printed.bands[0].maxFar).toBe(2.1);   // Clause 4.2.8 says 2.1
  });

  it('names a clause for every gap Chapter 3 leaves', () => {
    expect(CHAPTER_3_GAPS.length).toBeGreaterThanOrEqual(5);
    for (const g of CHAPTER_3_GAPS) {
      expect(g.reachableBecause, `${g.useType} ${g.band}`).toMatch(/Clause \d/);
    }
  });
});

const DERIVED = resolve(process.cwd(), 'docs/source/derived/purchasable-far.json');

describe.skipIf(!existsSync(DERIVED))('the loaded rows match the full extraction', () => {
  const extracted = JSON.parse(readFileSync(DERIVED, 'utf-8'));

  it('extracted cleanly, with only the known gazette defect failing', () => {
    expect(extracted.warnings).toHaveLength(0);
    // One defect can span several bands, so failures are matched to defects rather than
    // counted against them.
    const failed = extracted.checks.filter((c: { holds: boolean }) => !c.holds);
    expect(failed.length).toBeGreaterThanOrEqual(GAZETTE_ARITHMETIC_DEFECTS.length);
    for (const f of failed) {
      expect(GAZETTE_ARITHMETIC_DEFECTS.some(
        (d) => d.gazettePage === f.gazettePage && d.useType === f.useType),
        `unexplained arithmetic failure: p.${f.gazettePage} ${f.useType} ${f.band}`).toBe(true);
    }
  });

  it('carries the same base FAR for every row', () => {
    for (const src of extracted.rows) {
      const mine = PURCHASABLE_FAR_ROWS.filter(
        (r: PurchasableRow) => r.gazettePage === src.gazettePage
          && r.areaType === src.areaType && r.useType === src.useType);
      expect(mine.length, `${src.gazettePage} ${src.useType}`).toBeGreaterThan(0);
      expect(mine.map((r) => r.baseFar)).toContain(src.values.BFAR);
    }
  });
});

describe('asCeiling', () => {
  it('maps the gazette’s three kinds of cell', () => {
    expect(asCeiling(5.25)).toBe(5.25);
    expect(asCeiling('unrestricted')).toBe(Infinity);
    expect(asCeiling('not available')).toBeNull();
    expect(asCeiling(null)).toBeNull();
  });
});

describe('resolveBaseFar reads the printed split, not a general ladder', () => {
  it('gives group housing the permissible columns the gazette example itself prints', () => {
    // Clause 9.2.5's worked example is a non-built-up group housing scheme on a 30 m road.
    // Its own table states Purchasable FAR *permissible* 2.5 and Premium permissible 3.75.
    // That is the capacity, independent of what the example then avails.
    const r = resolveBaseFar({
      occupancy: 'res_group_housing', plotArea: 2_000, roadWidth: 30, areaType: 'non_built_up',
    });
    expect(r.baseFar).toBe(2.5);
    expect(r.purchasableTranche?.source).toBe('chapter-table');
    expect(r.purchasableTranche?.purchasableCapacity).toBe(2.5);
    expect(r.purchasableTranche?.premiumPurchasableCapacity).toBe(3.75);
  });

  it('falls back to Clause 9.2.3 for the uses no chapter table covers, and says so', () => {
    for (const occupancy of ['office', 'inst_health', 'ind_general'] as const) {
      const r = resolveBaseFar({ occupancy, plotArea: 2_000, roadWidth: 30 });
      expect(r.purchasableTranche?.source, occupancy).toBe('clause-9.2.3');
      expect(r.purchasableTranche?.clause, occupancy).toMatch(/9\.2\.3/);
    }
  });

  it('never lets the split exceed the headroom the ceiling allows', () => {
    for (const occupancy of ['res_group_housing', 'com_mall', 'com_hotel', 'mixed_use'] as const) {
      for (const areaType of ['built_up', 'non_built_up'] as const) {
        for (const roadWidth of [9, 12, 18, 24, 30, 45, 60]) {
          const r = resolveBaseFar({ occupancy, plotArea: 2_000, roadWidth, areaType });
          const t = r.purchasableTranche;
          if (!t || !Number.isFinite(r.ceilingFar)) continue;
          const total = t.purchasableCapacity + t.premiumPurchasableCapacity;
          expect(total, `${occupancy}/${areaType}/${roadWidth}m`).toBeLessThanOrEqual(r.purchasableFar + 0.01);
        }
      }
    }
  });

  it('flags where the split and the ceiling come from different chapters (V-014)', () => {
    // Malls and hotels are the four cells where Chapter 5's base FAR exceeds Chapter 3's.
    const mall = resolveBaseFar({ occupancy: 'com_mall', plotArea: 2_000, roadWidth: 30 });
    expect(mall.purchasableTranche?.baseFarDivergence).toEqual({ chapterBaseFar: 2, applied: 1.5 });
    expect(mall.caveats.join(' ')).toMatch(/V-014/);

    // Group housing agrees between the two chapters, so nothing is flagged.
    const gh = resolveBaseFar({ occupancy: 'res_group_housing', plotArea: 2_000, roadWidth: 30 });
    expect(gh.purchasableTranche?.baseFarDivergence).toBeUndefined();
  });

  it('offers no tranche where no purchase is possible', () => {
    const narrow = resolveBaseFar({ occupancy: 'res_group_housing', plotArea: 2_000, roadWidth: 6 });
    expect(narrow.purchasableFar).toBe(0);
    expect(narrow.purchasableTranche).toBeNull();
  });
});
