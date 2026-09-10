import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_MAX_FAR, GROUP_HOUSING_MAX_FAR } from '../far';
import {
  CHAPTER_3_GAPS,
  GAZETTE_ARITHMETIC_DEFECTS,
  baseFarApplies,
  CROSS_CHAPTER_MAX_FAR_CONFLICTS,
  PURCHASABLE_FAR_ROWS,
  asCeiling,
  bandForRoad,
  purchasableRowFor,
  type PurchasableRow,
} from '../purchasable-far';

const n = (v: unknown): number | null => (typeof v === 'number' ? v : null);

describe('every printed BFAR/PFAR/PPFAR/MFAR table is loaded', () => {
  it('has every row from every printed table', () => {
    expect(PURCHASABLE_FAR_ROWS).toHaveLength(41);
    const pages = [...new Set(PURCHASABLE_FAR_ROWS.map((r) => r.gazettePage))].sort((a, b) => a - b);
    expect(pages).toEqual([78, 82, 84, 86, 87, 88, 90, 95, 97, 98, 99, 100, 101, 102]);
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
    const industry = PURCHASABLE_FAR_ROWS.filter((r) => r.gazettePage >= 101);
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

describe('the one place the gazette’s own arithmetic does not close', () => {
  it('is two rows, and the printed figure is the lower one in both', () => {
    expect(GAZETTE_ARITHMETIC_DEFECTS).toHaveLength(2);
    for (const d of GAZETTE_ARITHMETIC_DEFECTS) {
      expect(d.printed, `p.${d.gazettePage}`).toBeLessThan(d.componentsImply);
    }
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
