import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIXED_USE_MAX_FAR, resolveBaseFar } from '../far';
import { OCCUPANCIES, OCCUPANCY_IDS, forArea, getOccupancy } from '../occupancy';
import {
  DANGLING_REFERENCES,
  EXCLUDED_FROM_MIXING,
  MIXED_USE_LOCATIONS,
  MIXED_USE_MIN_ROAD_M,
  MIXED_USE_STANDARDS,
  MIXING_RULE,
  TOD_FAR_BANDS,
  TOD_MIXING,
  TOD_PREMIUM_CHARGED_AS_PURCHASABLE,
  checkMixing,
  isExcludedFromMixing,
  mixedUseStandard,
  todMaxFar,
} from '../mixed-use';

const LOCATION_KEYS = [
  'mixed_use_zone', 'approved_layout_plot', 'bazaar_street', 'wide_road', 'tod_zone',
] as const;

describe('Clause 8.1.3 — one standard stated five times, once per location', () => {
  it('carries all eight parameters across all five locations', () => {
    expect(MIXED_USE_LOCATIONS.map((l) => l.key)).toEqual([...LOCATION_KEYS]);
    expect(MIXED_USE_LOCATIONS.map((l) => l.clause)).toEqual(
      ['8.1.2(a)', '8.1.2(b)', '8.1.2(c)', '8.1.2(d)', '8.1.2(e)']);
    expect(MIXED_USE_STANDARDS).toHaveLength(8);
    for (const s of MIXED_USE_STANDARDS) {
      for (const key of LOCATION_KEYS) {
        expect(s.byLocation[key], `${s.key}/${key}`).toBeTruthy();
      }
    }
  });

  /**
   * The gazette says "No restriction" in all five columns. The engine required 300 m²,
   * which is a figure no column of this table contains.
   */
  it('puts no minimum on the plot size, and the occupancy now agrees', () => {
    const plot = mixedUseStandard('minPlotSize')!;
    expect(Object.values(plot.byLocation)).toEqual(Array(5).fill('No restriction'));
    expect(getOccupancy('mixed_use').minPlotAreaSqm).toBe(0);
  });

  it('puts no restriction on height, and the occupancy now agrees', () => {
    const height = mixedUseStandard('buildingHeight')!;
    expect(Object.values(height.byLocation)).toEqual(Array(5).fill('Not restricted'));
    expect(getOccupancy('mixed_use').maxHeightM).toBe(Infinity);
  });

  /**
   * Clause 8.1.3 states parking as "As per proposed higher use" — a pointer to another
   * occupancy's ratio, not a ratio. The engine has one number per occupancy, so the only
   * reading of "higher use" it can express is the highest ratio it carries.
   */
  it('takes the highest parking ratio the engine holds, not an invented one', () => {
    const parking = mixedUseStandard('parking')!;
    expect(parking.byLocation.mixed_use_zone).toBe('As per proposed higher use');
    expect(parking.byLocation.tod_zone).toMatch(/1\s*ECS per 100 sqm/i);

    const highest = Math.max(
      ...OCCUPANCY_IDS.map((id) => OCCUPANCIES[id].parkingEcsPer100Sqm));
    expect(getOccupancy('mixed_use').parkingEcsPer100Sqm).toBe(highest);
    // The figure it replaced was below several uses that can sit in a mixed-use building.
    expect(highest).toBeGreaterThan(1.75);
  });

  /**
   * V-024. The means of access is the one standard that genuinely differs across the five
   * locations, and the occupancy has a single field for it.
   */
  it('splits the means of access five ways, and the occupancy can hold only one', () => {
    const access = mixedUseStandard('meansOfAccess')!;
    expect(access.byLocation.mixed_use_zone).toBe('9m (plots upto 100 sqm); 12m (other plots)');
    expect(access.byLocation.approved_layout_plot).toBe('24m');
    expect(access.byLocation.bazaar_street).toBe('12m');
    expect(access.byLocation.wide_road).toBe('24m');
    expect(access.byLocation.tod_zone).toBe('=>12m');

    // Flat, not split by area type — Clause 8.1.3 splits it by location instead, which
    // is the dimension the occupancy has no field for at all.
    const held = forArea(getOccupancy('mixed_use').minRoadWidthM, 'built_up');
    expect(held).toBe(12);
    // Right for two locations, too strict for one and too lenient for two.
    const distinct = new Set(Object.values(MIXED_USE_MIN_ROAD_M));
    expect(distinct.size).toBeGreaterThan(1);
    expect(Math.min(...distinct)).toBeLessThan(held);
    expect(Math.max(...distinct)).toBeGreaterThan(held);
  });

  it('sends a bazaar street to Clause 5.1, which the engine already implements', () => {
    expect(mixedUseStandard('minSetbacks')!.byLocation.bazaar_street).toBe('As per para 5.1.5');
    expect(mixedUseStandard('floorAreaRatio')!.byLocation.bazaar_street).toBe('As per para 5.1.4');
    expect(getOccupancy('com_bazaar').setbackTable).toBe('bazaar_street');
  });
});

describe('Clause 8.1.3.1 — the FAR the engine now applies to mixed use', () => {
  it('uses the mixed-use base, not the commercial one it used to read', () => {
    const built = resolveBaseFar({
      occupancy: 'mixed_use', plotArea: 1000, roadWidth: 18, areaType: 'built_up',
    });
    expect(built.baseFar).toBe(2.0);
    expect(built.ceilingFar).toBe(4.0);
    expect(built.clauseRef).toContain('8.1.3.1');

    const layout = resolveBaseFar({
      occupancy: 'mixed_use', plotArea: 1000, roadWidth: 18, areaType: 'non_built_up',
    });
    expect(layout.baseFar).toBe(2.5);
    expect(layout.ceilingFar).toBe(5.0);
  });

  it.each([
    [8, 0], [9, 0], [10, 2.0], [12, 2.0], [12.5, 4.0], [24, 4.0], [30, 4.5], [45, 4.5],
  ])('gives a %s m road a built-up ceiling of %s', (road, ceiling) => {
    const got = resolveBaseFar({
      occupancy: 'mixed_use', plotArea: 1000, roadWidth: road, areaType: 'built_up',
    });
    expect(got.ceilingFar).toBe(ceiling);
  });

  /**
   * The ceiling and the purchasable headroom both read unrestricted above 45 m, which is
   * what Clause 8.1.3.1 prints. `maxPermissibleFar` does NOT: it falls back to the base
   * FAR whenever the ceiling is infinite, so the engine reports an unlimited amount of
   * purchasable FAR and a maximum equal to the base in the same breath.
   *
   * That is not a Chapter 8 defect — the same fallback governs group housing and
   * commercial, both of which have had an unrestricted top band since long before this
   * chapter was read — so it is asserted here as it stands rather than changed under a
   * chapter's commit. Logged as V-028.
   */
  it('reads unrestricted at the ceiling, and base FAR at the maximum (V-028)', () => {
    const got = resolveBaseFar({
      occupancy: 'mixed_use', plotArea: 1000, roadWidth: 60, areaType: 'built_up',
    });
    expect(got.ceilingFar).toBe(Infinity);
    expect(got.purchasableFar).toBe(Infinity);
    expect(got.maxPermissibleFar).toBe(got.baseFar);

    // The same shape, on a ladder that predates Chapter 8.
    const groupHousing = resolveBaseFar({
      occupancy: 'res_group_housing', plotArea: 1000, roadWidth: 60, areaType: 'built_up',
    });
    expect(groupHousing.purchasableFar).toBe(Infinity);
    expect(groupHousing.maxPermissibleFar).toBe(groupHousing.baseFar);
  });

  /**
   * The whole point of giving mixed use its own table: on the commercial ladder the same
   * plot resolved to a base of 1.5, a quarter less floor area than Chapter 8 allows.
   */
  it('gives more base floor area than the commercial ladder did', () => {
    const plot = { plotArea: 1000, roadWidth: 18, areaType: 'built_up' } as const;
    const mixed = resolveBaseFar({ occupancy: 'mixed_use', ...plot });
    const commercial = resolveBaseFar({ occupancy: 'com_complex', ...plot });
    expect(mixed.baseFar).toBeGreaterThan(commercial.baseFar);
    expect(mixed.baseBuiltUpArea - commercial.baseBuiltUpArea).toBe(500);
  });

  it('keeps both ladders contiguous and non-decreasing', () => {
    for (const areaType of ['built_up', 'non_built_up'] as const) {
      const ladder = MIXED_USE_MAX_FAR[areaType];
      let previous = -1;
      for (const band of ladder) {
        expect(band.maxFar, `${areaType} ${band.label}`).toBeGreaterThanOrEqual(previous);
        previous = band.maxFar;
      }
    }
  });
});

describe('Clause 8.2.2.2 — TOD FAR as a multiple of base FAR', () => {
  it('prints 150%, 250%, 350% and then unrestricted', () => {
    expect(TOD_FAR_BANDS.map((b) => b.todFarPercentOfBase)).toEqual([150, 250, 350, null]);
    expect(TOD_FAR_BANDS.map((b) => b.multiplier)).toEqual([1.5, 2.5, 3.5, null]);
    expect(TOD_FAR_BANDS.at(-1)!.unrestricted).toBe(true);
    // Every row defers the base to the rest of the byelaws.
    expect(TOD_FAR_BANDS.every((b) => b.baseFar === 'As per byelaws')).toBe(true);
  });

  it('keeps the bands contiguous and open-ended at the top', () => {
    let previous = 0;
    for (const band of TOD_FAR_BANDS) {
      expect(band.overMoreThan, band.label).toBe(previous);
      previous = band.upToAndIncluding ?? Infinity;
    }
    expect(TOD_FAR_BANDS.at(-1)!.upToAndIncluding).toBeNull();
  });

  it.each([
    [12, 2.0, 3.0], [12, 2.5, 3.75], [20, 2.0, 5.0], [30, 2.0, 7.0], [30, 1.5, 5.25],
  ])('at %s m a base of %s becomes %s', (road, base, expected) => {
    expect(todMaxFar(base, road)).toBe(expected);
  });

  it('is unrestricted above 45 m whatever the base', () => {
    expect(todMaxFar(1.5, 60)).toBe(Infinity);
    expect(todMaxFar(3.0, 46)).toBe(Infinity);
  });

  /**
   * Note (2): in a TOD zone premium purchasable FAR is charged at the purchasable rate.
   * Everywhere else the two are priced apart, which is why `purchasable-far.ts` keeps the
   * split at all.
   */
  it('charges premium purchasable FAR at the purchasable rate', () => {
    expect(TOD_PREMIUM_CHARGED_AS_PURCHASABLE).toBe(true);
  });
});

describe('Clause 8.2.2.1 — TOD land-use mixing', () => {
  it('lets six land uses convert, keeping at least a third in the existing use', () => {
    expect(TOD_MIXING).toHaveLength(6);
    const shares = TOD_MIXING.filter((r) => r.minimumSharePercent !== null);
    expect(shares).toHaveLength(5);
    for (const row of shares) {
      expect(row.minimumSharePercent, row.landUse).toBe(33);
      expect(row.otherSharePercent, row.landUse).toBe(67);
      expect(row.changedLandUse, row.landUse).toContain('Mixed-Use TOD');
    }
  });

  it('excepts transportation, which keeps what its operation requires', () => {
    const transport = TOD_MIXING.find((r) => r.landUse === 'Transportation')!;
    expect(transport.minimumFarInExistingUse).toBe('Operation as required');
    expect(transport.farInOtherUse).toBe('Remaining FAR');
    expect(transport.minimumSharePercent).toBeNull();
  });
});

describe('Clause 8.1.3 Mixing and Clause 8.3.1 — what may be mixed, and in what share', () => {
  it('constrains the share only along wide roads and in TOD zones', () => {
    expect(MIXING_RULE.mixed_use_zone).toBeNull();       // "0-100%"
    expect(MIXING_RULE.approved_layout_plot).toBeNull(); // "0-100%"
    expect(MIXING_RULE.bazaar_street).toBeNull();        // Clause 5.1 governs
    expect(MIXING_RULE.wide_road).toEqual({
      principalUseMinShare: 0.33, otherUsesMaxShare: 0.67, noSingleOtherUseAbovePrincipal: true,
    });
    expect(MIXING_RULE.tod_zone).toEqual(MIXING_RULE.wide_road);
  });

  it('passes a mix that keeps the principal use predominant', () => {
    expect(checkMixing('wide_road', 'residential', { residential: 60, retail: 40 })).toEqual([]);
    expect(checkMixing('wide_road', 'residential', { residential: 34, retail: 33, office: 33 }))
      .toEqual([]);
  });

  it('fails a principal use below a third', () => {
    const breaches = checkMixing(
      'wide_road', 'residential', { residential: 30, retail: 25, office: 25, hotel: 20 });
    expect(breaches.map((b) => b.limb)).toContain('principal-share');
  });

  /**
   * The third limb is printed as a sentence below the table rather than as a figure in
   * it: "share of single other use shall not be more than principal use". A 40/45 split
   * satisfies both percentages and still breaches the clause.
   *
   * It only bites because the principal use is the one the master plan assigns, not the
   * largest one proposed — taking the largest would make this limb unfalsifiable.
   */
  it('fails a single other use that exceeds the principal one', () => {
    const breaches = checkMixing(
      'tod_zone', 'residential', { residential: 40, retail: 45, office: 15 });
    expect(breaches.map((b) => b.limb)).toEqual(['single-other-use']);
    expect(breaches[0].detail).toContain('retail');
  });

  it('reads the principal use as given, not as the largest share', () => {
    const shares = { residential: 40, retail: 45, office: 15 };
    // The same mix passes when the plot's assigned land use is the retail one.
    expect(checkMixing('tod_zone', 'retail', shares)).toEqual([]);
    expect(checkMixing('tod_zone', 'residential', shares)).not.toEqual([]);
  });

  it('constrains nothing where the gazette prints 0-100%', () => {
    expect(checkMixing('mixed_use_zone', 'residential', { residential: 5, retail: 95 }))
      .toEqual([]);
  });

  it('bars twenty-four named activities across five categories', () => {
    expect(EXCLUDED_FROM_MIXING).toHaveLength(5);
    expect(EXCLUDED_FROM_MIXING.flatMap((c) => c.activities)).toHaveLength(24);
    expect(EXCLUDED_FROM_MIXING.map((c) => c.category)).toEqual([
      'Industrial', 'Public-Semi Public', 'Traffic & Transportation',
      'Recreational', 'Agricultural',
    ]);
  });

  it('keeps the activity that wraps to the next cell attached to its own category', () => {
    // "Slaughterhouses" ends the Public-Semi Public list and sits immediately before
    // "Traffic & Transportation:"; flowing the text first read it as part of that name.
    const publicSemi = EXCLUDED_FROM_MIXING.find((c) => c.category === 'Public-Semi Public')!;
    expect(publicSemi.activities).toContain('Slaughterhouses');
    expect(EXCLUDED_FROM_MIXING.find((c) => c.category === 'Recreational')!.activities)
      .toEqual(['Shooting Range']);
    // And the entry broken across three physical rows is rejoined.
    const industrial = EXCLUDED_FROM_MIXING.find((c) => c.category === 'Industrial')!;
    expect(industrial.activities).toContain('Pasteurizing plant/ Milk storage centre');
    expect(industrial.activities).toContain('Bio Diesel Plant');
  });

  it.each(['Slaughterhouses', 'Shooting Range', 'Farmhouse', 'sugar mill'])(
    'recognises %s as barred from mixing', (activity) => {
      expect(isExcludedFromMixing(activity)).toBe(true);
    });

  it('does not bar a use the clause does not name', () => {
    expect(isExcludedFromMixing('Retail shop')).toBe(false);
    expect(isExcludedFromMixing('Group housing')).toBe(false);
  });
});

describe('the chapter’s own cross-references', () => {
  /**
   * Two paragraph numbers the chapter cites do not exist, in it or anywhere else in the
   * byelaws. Recorded rather than silently repaired, because one of them cannot be
   * resolved by reading at all.
   */
  it('records both dangling references', () => {
    expect(DANGLING_REFERENCES.map((d) => d.reference)).toEqual(['8.1.3.6', '8.1.4']);
  });

  it('points the FAR reference at the clause that plainly means it', () => {
    const far = DANGLING_REFERENCES.find((d) => d.reference === '8.1.3.6')!;
    expect(far.context).toContain('As per para 8.1.3.6');
    // 8.1.3.1 is introduced as applying to "paragraph 8.1.2 (a) and (b)" — the two
    // columns that point at 8.1.3.6 — so the engine reads it as that table.
    expect(resolveBaseFar({
      occupancy: 'mixed_use', plotArea: 500, roadWidth: 18, areaType: 'built_up',
    }).clauseRef).toContain('8.1.3.1');
  });

  it('leaves the occupancy reference unresolved, because nothing answers it', () => {
    const occupancies = DANGLING_REFERENCES.find((d) => d.reference === '8.1.4')!;
    expect(occupancies.context).toContain('Permissible occupancies');
  });
});

/**
 * The rows above are imported from the chapter PDF, and an import is only worth anything
 * if you can tell it still matches the bytes it came from. `sources.test.ts` makes that
 * check for the chapter extractions; this makes it for the domain copy, which is a second
 * file that could otherwise drift out of date on its own.
 */
describe('the loaded data still matches the PDF it came from', () => {
  const PDF = resolve(process.cwd(), 'docs/source/gazette/pdf/chapter-08.pdf');

  it.skipIf(!existsSync(PDF))('records the md5 of the chapter 8 PDF', () => {
    const raw = JSON.parse(
      readFileSync(resolve(process.cwd(), 'src/domain/data/mixed-use.json'), 'utf-8'));
    const actual = createHash('md5').update(readFileSync(PDF)).digest('hex');
    expect(raw.sourceMd5, 'src/domain/data/mixed-use.json is stale — run ./tools/extract-all.sh')
      .toBe(actual);
    expect(raw.generatedBy).toBe('tools/extract-mixed-use.py');
  });
});
