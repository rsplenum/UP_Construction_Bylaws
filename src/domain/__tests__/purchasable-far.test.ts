import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_MAX_FAR } from '../far';
import {
  CHAPTER_3_5_MAX_FAR_CONFLICTS,
  COMMERCIAL_FAR_BREAKDOWN,
  bandForRoad,
  commercialFarRow,
  type FarValue,
} from '../purchasable-far';

const num = (v: FarValue): number | null => (typeof v === 'number' ? v : null);

describe('Clause 5.2.5 — MFAR = BFAR + PFAR + PPFAR', () => {
  /**
   * The table has fourteen columns and only its header row says which is which, so this
   * identity is what proves the columns were read correctly rather than merely plausibly.
   * It holds on every band of every row. Two cells round: 1.75 + 0.9 + 0.9 = 3.55,
   * printed as 3.6.
   */
  it.each(COMMERCIAL_FAR_BREAKDOWN.map((r) => [`${r.areaType} · ${r.useType}`, r] as const))(
    '%s', (_label, r) => {
      for (const band of r.bands) {
        const max = num(band.maxFarChapter5);
        if (max === null) {
          // An unrestricted maximum needs an unrestricted component to get there.
          expect(band.premiumPurchasable).toBe('unrestricted');
          continue;
        }
        const p = num(band.purchasable) ?? 0;
        const pp = num(band.premiumPurchasable) ?? 0;
        const sum = r.baseFar + p + pp;
        // The gazette rounds in exactly two cells: 1.75 + 0.9 + 0.9 = 3.55, printed 3.6.
        // The tolerance is that rounding step, plus room for binary floating point —
        // 3.6 - 3.55 evaluates to 0.050000000000000266. Naming it keeps the gazette's
        // rounding visible rather than hiding it behind a loose precision argument.
        expect(Math.abs(sum - max), `${r.useType} ${r.areaType} ${band.label}: ${sum} vs ${max}`)
          .toBeLessThanOrEqual(0.05 + 1e-9);
      }
    },
  );

  it('rounds in exactly two cells, both of them 3.55 printed as 3.6', () => {
    const rounded = COMMERCIAL_FAR_BREAKDOWN.flatMap((r) =>
      r.bands
        .filter((b) => {
          const max = num(b.maxFarChapter5);
          if (max === null) return false;
          const sum = r.baseFar + (num(b.purchasable) ?? 0) + (num(b.premiumPurchasable) ?? 0);
          return Math.abs(sum - max) > 1e-9;
        })
        .map((b) => `${r.areaType} ${r.useType} ${b.label}`));
    expect(rounded).toHaveLength(2);
    expect(rounded.every((s) => s.includes('>12 – 24m'))).toBe(true);
  });

  it('offers nothing to buy on the narrowest band except for the smallest units', () => {
    // "NA" on the Up to 12m band for everything above 100 m² and for malls.
    const big = COMMERCIAL_FAR_BREAKDOWN.filter((r) => r.useType !== 'Commercial units up to 100 m²');
    for (const r of big) {
      expect(r.bands[0].purchasable).toBe('not available');
      expect(r.bands[0].maxFarChapter5).toBe(r.baseFar);
    }
  });
});

describe('picking the right row and band', () => {
  it('routes by plot size across the 100 m² line', () => {
    const small = commercialFarRow({ occupancy: 'com_shop', areaType: 'built_up', plotAreaSqm: 80 });
    const large = commercialFarRow({ occupancy: 'com_shop', areaType: 'built_up', plotAreaSqm: 250 });
    expect(small?.useType).toBe('Commercial units up to 100 m²');
    expect(large?.useType).toBe('Commercial units above 100 m²');
    // The difference bites only on the narrowest road: 2.1 against 1.5.
    expect(small?.bands[0].maxFarChapter5).toBe(2.1);
    expect(large?.bands[0].maxFarChapter5).toBe(1.5);
  });

  it('routes malls to their own row whatever the plot size', () => {
    const r = commercialFarRow({ occupancy: 'com_mall', areaType: 'non_built_up', plotAreaSqm: 5_000 });
    expect(r?.useType).toBe('Shopping malls');
    expect(r?.baseFar).toBe(3.0);
  });

  it('has no row for a use this chapter does not cover', () => {
    expect(commercialFarRow({ occupancy: 'inst_health', areaType: 'built_up', plotAreaSqm: 900 }))
      .toBeUndefined();
  });

  it.each([[10, 'Up to 12m'], [12, 'Up to 12m'], [12.1, '>12 – 24m'], [45, '>24 – 45m'], [60, '>45m']])(
    'a %s m road falls in %s', (road, label) => {
      const r = commercialFarRow({ occupancy: 'com_shop', areaType: 'built_up', plotAreaSqm: 80 })!;
      expect(bandForRoad(r, road as number)?.label).toBe(label);
    },
  );
});

describe('V-014 — chapters 3 and 5 disagree, and the engine keeps the lower ceiling', () => {
  it('records all three conflicting cells', () => {
    expect(CHAPTER_3_5_MAX_FAR_CONFLICTS).toHaveLength(3);
    for (const c of CHAPTER_3_5_MAX_FAR_CONFLICTS) {
      expect(c.chapter5).toBeGreaterThan(c.chapter3);
    }
  });

  it('keeps Chapter 3’s figure, which is the stricter of the two', () => {
    const ceilings = (t: readonly { maxFar: number }[]) => t.map((b) => b.maxFar).filter((f) => f !== 0);
    // built-up >24–45 m: 5.0, not 5.25
    expect(ceilings(COMMERCIAL_MAX_FAR.built_up)).toContain(5.0);
    expect(ceilings(COMMERCIAL_MAX_FAR.built_up)).not.toContain(5.25);
    // non-built-up: 3.5 and 6.0, not 3.6 and 6.1
    expect(ceilings(COMMERCIAL_MAX_FAR.non_built_up)).toEqual([2.45, 3.5, 6.0, Infinity]);
  });

  it('shopping malls agree between the two chapters', () => {
    const mall = COMMERCIAL_FAR_BREAKDOWN.find(
      (r) => r.useType === 'Shopping malls' && r.areaType === 'built_up')!;
    expect(mall.bands[2].maxFarChapter5).toBe(7.0);   // Chapter 3 row 5(a) also says 7.0
  });
});

const DERIVED = resolve(process.cwd(), 'docs/source/derived/purchasable-far.json');

describe.skipIf(!existsSync(DERIVED))('the transcription matches the extraction', () => {
  const extracted = JSON.parse(readFileSync(DERIVED, 'utf-8'));

  /**
   * Bands are compared by POSITION, not by label. The extractor takes each label from the
   * gazette's own heading, which wraps in places, so the text varies cosmetically between
   * tables (">12 – 24m" against ">12 -24m"). What the extraction guarantees is the order
   * and the count, because each band is anchored to the x of its own PFAR column.
   */
  const bandKeysOf = (values: Record<string, unknown>) =>
    Object.keys(values).filter((k) => k.endsWith('|MFAR')).map((k) => k.replace('|MFAR', ''));

  it('passed every arithmetic check across all seven tables', () => {
    expect(extracted.checks.filter((c: { holds: boolean }) => !c.holds)).toHaveLength(0);
    expect(extracted.warnings).toHaveLength(0);
    expect(extracted.tableCount).toBeGreaterThanOrEqual(7);
    // Four bands for every row, so nothing was dropped on the way through.
    expect(extracted.checks).toHaveLength(extracted.rows.length * 4);
  });

  const page86 = () => extracted.rows.filter(
    (r: { gazettePage: number }) => r.gazettePage === 86);

  it('has the same six commercial rows', () => {
    expect(page86()).toHaveLength(COMMERCIAL_FAR_BREAKDOWN.length);
  });

  it('agrees cell for cell with what is hand-typed above', () => {
    for (const src of page86()) {
      const useType = src.useType.includes('malls')
        ? 'Shopping malls'
        : src.useType.includes('>100')
          ? 'Commercial units above 100 m²'
          : 'Commercial units up to 100 m²';
      const mine = COMMERCIAL_FAR_BREAKDOWN.find(
        (r) => r.useType === useType && r.areaType === src.areaType)!;
      expect(mine, `${src.areaType} ${useType}`).toBeDefined();
      expect(mine.baseFar).toBe(src.values.BFAR);

      const bandKeys = bandKeysOf(src.values);
      expect(bandKeys, `${useType}: band count`).toHaveLength(mine.bands.length);

      mine.bands.forEach((band, i) => {
        const prefix = bandKeys[i];
        expect(src.values[`${prefix}|MFAR`], `${useType} ${band.label} MFAR`)
          .toEqual(band.maxFarChapter5);
        expect(src.values[`${prefix}|PFAR`], `${useType} ${band.label} PFAR`)
          .toEqual(band.purchasable);
        expect(src.values[`${prefix}|PPFAR`], `${useType} ${band.label} PPFAR`)
          .toEqual(band.premiumPurchasable);
      });
    }
  });

  it('found the same table in chapter 4 for group housing and affordable housing', () => {
    const ch4 = extracted.rows.filter((r: { chapter: string }) => r.chapter === '04');
    expect(ch4.length).toBeGreaterThan(0);
    // Clause 4.4 prints two base FARs for one use, split at an 18 m road.
    const qualified = ch4.filter((r: { baseFarQualifier?: string }) => r.baseFarQualifier);
    expect(qualified.length).toBeGreaterThan(0);
  });
});
