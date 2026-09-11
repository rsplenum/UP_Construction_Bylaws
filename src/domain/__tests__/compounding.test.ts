import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ITEM1F_RATE_PER_EXTRA_UNIT,
  NON_COMPOUNDABLE_REASONS,
  assessCompounding,
  compoundableLimits,
  compoundingColumn,
  item1RatePerSqm,
  type CompoundingInput,
  type NonCompoundableFlags,
} from '../compounding';

/**
 * Every number asserted here is quoted from Chapter 16 of the gazette in the comment
 * above it. A test that only pins current behaviour is not a check on the byelaw.
 */

const LAND = 40_000; // ₹/m², the Clause 16.3.7(c) residential rate

const base: CompoundingInput = {
  use: 'residential',
  residentialLandRate: LAND,
  plotAreaSqm: 300,
  heightM: 12,
  flags: {},
  setbackEncroachmentSqm: {},
  excessFarSqm: 0,
  heightDeviationM: 0,
};

// -------------------------------------------------------------------------------------
// 16.3.2 — offences that shall not be compoundable
// -------------------------------------------------------------------------------------

describe('Clause 16.3.2 — non-compoundable offences', () => {
  const allFlags = Object.keys(NON_COMPOUNDABLE_REASONS) as (keyof NonCompoundableFlags)[];

  it('carries all thirteen offences the gazette lists', () => {
    expect(allFlags).toHaveLength(13);
  });

  it.each(allFlags)('blocks the whole assessment on %s', (flag) => {
    const r = assessCompounding({
      ...base,
      flags: { [flag]: true },
      setbackEncroachmentSqm: { front: 20 },
      excessFarSqm: 50,
    });
    expect(r.isCompoundable).toBe(false);
    expect(r.lineItems).toHaveLength(0);
    expect(r.totalPayable).toBe(0);
    expect(r.blockingReasons).toContain(NON_COMPOUNDABLE_REASONS[flag]);
  });
});

// -------------------------------------------------------------------------------------
// 16.3.3 — which column applies
// -------------------------------------------------------------------------------------

describe('Clause 16.3.3 — column A vs column B', () => {
  // A: "All Buildings <=15-meter and multi-units upto 17.5 meter height except Group Housing"
  // B: "Buildings >15-meter height and Group Housing except multi-units."
  it.each([
    [15.0, false, false, 'A'],
    [15.1, false, false, 'B'],
    [17.5, false, true, 'A'],
    [17.6, false, true, 'B'],
    [8.0, true, false, 'B'], // group housing is column B at any height
    [8.0, true, true, 'B'],
  ])('%s m, group housing %s, multi-unit %s → column %s', (heightM, gh, mu, expected) => {
    expect(compoundingColumn({ heightM, isGroupHousing: gh as boolean, isMultiUnit: mu as boolean }))
      .toBe(expected);
  });
});

describe('Clause 16.3.3 — compoundable limits', () => {
  const at = (o: Partial<Parameters<typeof compoundableLimits>[0]>) =>
    compoundableLimits({
      heightM: 12, isGroupHousing: false, isMultiUnit: false,
      plotAreaSqm: 300, use: 'residential', ...o,
    });

  it('column A front: 25% of the setback area, capped at 1.0 m', () => {
    expect(at({}).setback.front).toMatchObject({ fraction: 0.25, maxDepthM: 1.0, requiresFireNoc: false });
  });

  it('column A side: 25% of the width, with no absolute cap', () => {
    expect(at({}).setback.side1).toMatchObject({ fraction: 0.25, maxDepthM: Infinity });
    expect(at({}).setback.side2.fraction).toBe(0.25);
  });

  // "Residential: (a) Plot Size up to 500 sqm- 100% compoundable in cases where proper
  // provisions have been made for light and ventilation."
  it('column A rear, residential up to 500 m²: the whole setback, conditionally', () => {
    const rear = at({ plotAreaSqm: 500 }).setback.rear;
    expect(rear.fraction).toBe(1.0);
    expect(rear.condition).toMatch(/light and ventilation/i);
  });

  // "(b) Plot Size > 500 sqm - construction up to maximum 10% of the area in rear setback"
  it('column A rear, residential above 500 m²: 10%', () => {
    expect(at({ plotAreaSqm: 500.1 }).setback.rear.fraction).toBe(0.10);
  });

  // "Others: 10 percent of rear setback area"
  it('column A rear, non-residential: 10% whatever the plot size', () => {
    expect(at({ use: 'commercial', plotAreaSqm: 200 }).setback.rear.fraction).toBe(0.10);
    expect(at({ use: 'facilities', plotAreaSqm: 200 }).setback.rear.fraction).toBe(0.10);
  });

  // Column B's cell is printed once, spanning the front, rear and side rows:
  // "10 percent of setback area (maximum up to a width of 1-meter), subject to Fire NOC."
  it('column B: 10% and 1 m on every face, against a Fire NOC', () => {
    const b = at({ heightM: 30 }).setback;
    for (const face of ['front', 'rear', 'side1', 'side2'] as const) {
      expect(b[face]).toMatchObject({ fraction: 0.10, maxDepthM: 1.0, requiresFireNoc: true });
    }
  });

  // "Construction up to a maximum of 10% of total permissible FAR" — both columns.
  it('caps compoundable FAR at 10% in both columns', () => {
    expect(at({}).farFraction).toBe(0.10);
    expect(at({ heightM: 30 }).farFraction).toBe(0.10);
  });

  // Column A: "10% height ... without changing the number of floors". Column B: "-".
  it('allows 10% height in column A and none in column B', () => {
    expect(at({}).heightFraction).toBe(0.10);
    expect(at({ heightM: 30 }).heightFraction).toBe(0);
    expect(at({ isGroupHousing: true }).heightFraction).toBe(0);
  });

  it('allows one extra unit in plotted development, proportionate units in group housing', () => {
    expect(at({}).extraUnits).toBe(1);
    expect(at({ isGroupHousing: true }).extraUnits).toBe('proportionate');
  });
});

// -------------------------------------------------------------------------------------
// 16.3.8 Item 1 — unauthorised construction inside the permissible envelope
// -------------------------------------------------------------------------------------

describe('Clause 16.3.8 Item 1 — within the permissible envelope', () => {
  // Rs. 25 / 38 / 50 / 62 per sqm for ≤150 / >150–300 / >300–500 / >500 & group housing.
  it.each([
    [100, 25], [150, 25], [150.1, 38], [300, 38], [300.1, 50], [500, 50], [500.1, 62], [5000, 62],
  ])('a %s m² plot is charged ₹%s per m²', (plot, rate) => {
    expect(item1RatePerSqm(plot, false)).toBe(rate);
  });

  it('charges group housing at the top band whatever its plot size', () => {
    expect(item1RatePerSqm(120, true)).toBe(62);
  });

  it('scales the residential rate by 2.0 for commercial', () => {
    const res = assessCompounding({ ...base, unauthorisedWithinEnvelopeSqm: 100 });
    const com = assessCompounding({ ...base, use: 'commercial', unauthorisedWithinEnvelopeSqm: 100 });
    expect(res.totalPayable).toBe(100 * 38); // ₹38/m² for a 300 m² plot
    expect(com.totalPayable).toBe(2 * res.totalPayable);
  });

  // "On Compoundable units in addition to permissible units- Rs. 122640 per unit."
  it('charges ₹1,22,640 for one compoundable unit', () => {
    const r = assessCompounding({ ...base, extraUnits: 1 });
    expect(ITEM1F_RATE_PER_EXTRA_UNIT).toBe(122_640);
    expect(r.totalPayable).toBe(122_640);
    expect(r.isCompoundable).toBe(true);
  });

  it('refuses a second unit in plotted development', () => {
    const r = assessCompounding({ ...base, extraUnits: 2 });
    expect(r.isCompoundable).toBe(false);
  });
});

// -------------------------------------------------------------------------------------
// 16.3.8 Item 2 — ground-floor construction beyond permissible ground coverage
// -------------------------------------------------------------------------------------

describe('Clause 16.3.8 Item 2 — beyond ground coverage, as a % of the price of land', () => {
  const encroach = (o: Partial<CompoundingInput>) => assessCompounding({
    ...base, plotAreaSqm: 450,
    setbackDeficitFraction: { front: 0.2, rear: 0.2, side1: 0.2, side2: 0.2 },
    setbackDeficitM: { front: 0.6, rear: 0.6, side1: 0.6, side2: 0.6 },
    ...o,
  });

  // Column A, residential: front 100%, side 75%, rear 50% of the price of land.
  it('prices column A residential faces at 100 / 75 / 50 percent', () => {
    expect(encroach({ setbackEncroachmentSqm: { front: 10 } }).totalPayable).toBe(10 * LAND * 1.00);
    expect(encroach({ setbackEncroachmentSqm: { side1: 10 } }).totalPayable).toBe(10 * LAND * 0.75);
    expect(encroach({ setbackEncroachmentSqm: { rear: 10 } }).totalPayable).toBe(10 * LAND * 0.50);
  });

  // Column A commercial: front 200%, side 150%, rear 100%.
  it('prices column A commercial faces at 200 / 150 / 100 percent', () => {
    expect(encroach({ use: 'commercial', setbackEncroachmentSqm: { front: 10 } }).totalPayable)
      .toBe(10 * LAND * 2.00);
    expect(encroach({ use: 'commercial', setbackEncroachmentSqm: { side2: 10 } }).totalPayable)
      .toBe(10 * LAND * 1.50);
    expect(encroach({ use: 'commercial', setbackEncroachmentSqm: { rear: 10 } }).totalPayable)
      .toBe(10 * LAND * 1.00);
  });

  // The industrial column is 40% on the front AND the side — it does not follow the
  // 0.4x pattern off the residential 75% for the side. Transcribed, not derived.
  it('prices the industrial side setback at 40 percent, not 30', () => {
    expect(encroach({ use: 'industrial', setbackEncroachmentSqm: { side1: 10 } }).totalPayable)
      .toBe(10 * LAND * 0.40);
  });

  // Column B: "On all sides ... 100 percent of price of land" for residential.
  it('prices every column B face alike', () => {
    const b = (face: 'front' | 'rear' | 'side1') => assessCompounding({
      ...base, heightM: 30, plotAreaSqm: 450,
      setbackEncroachmentSqm: { [face]: 10 },
      setbackDeficitFraction: { [face]: 0.05 },
      setbackDeficitM: { [face]: 0.3 },
    }).totalPayable;
    expect(b('front')).toBe(10 * LAND);
    expect(b('rear')).toBe(10 * LAND);
    expect(b('side1')).toBe(10 * LAND);
  });

  it('flags a face past the percentage limit as beyond compounding', () => {
    const r = encroach({
      setbackEncroachmentSqm: { front: 10 },
      setbackDeficitFraction: { front: 0.30 }, // past the 25%
      setbackDeficitM: { front: 0.9 },
    });
    expect(r.isCompoundable).toBe(false);
    expect(r.overLimitItems[0].limitNote).toMatch(/30%/);
  });

  it('flags a face past the 1.0 m cap even when the percentage passes', () => {
    const r = encroach({
      setbackEncroachmentSqm: { front: 10 },
      setbackDeficitFraction: { front: 0.20 },
      setbackDeficitM: { front: 1.2 }, // past the 1.0 m
    });
    expect(r.isCompoundable).toBe(false);
    expect(r.overLimitItems[0].limitNote).toMatch(/1\.20 m deep/);
  });

  it('names the Fire NOC as a condition on a column B setback', () => {
    const r = assessCompounding({
      ...base, heightM: 30,
      setbackEncroachmentSqm: { front: 5 },
      setbackDeficitFraction: { front: 0.05 },
      setbackDeficitM: { front: 0.3 },
    });
    expect(r.isCompoundable).toBe(true);
    expect(r.caveats.join(' ')).toMatch(/Fire NOC/);
  });
});

// -------------------------------------------------------------------------------------
// 16.3.8 Item 3 — floor area beyond permissible FAR
// -------------------------------------------------------------------------------------

describe('Clause 16.3.8 Item 3 — beyond permissible FAR', () => {
  // "Rs. 491 per sqm. and 50% of required land price for additional floor area."
  it('charges both the per-m² rate and the land-price share', () => {
    const r = assessCompounding({ ...base, excessFarSqm: 20, excessFarFraction: 0.05 });
    expect(r.totalPayable).toBe(20 * (491 + LAND * 0.50));
    expect(r.isCompoundable).toBe(true);
  });

  // "Rs. 982 per sqm and 100 percent of required land price"
  it('charges commercial at ₹982 and the full land price', () => {
    const r = assessCompounding({ ...base, use: 'commercial', excessFarSqm: 20, excessFarFraction: 0.05 });
    expect(r.totalPayable).toBe(20 * (982 + LAND * 1.00));
  });

  it('refuses an excess past 10% of the permissible FAR', () => {
    const r = assessCompounding({ ...base, excessFarSqm: 400, excessFarFraction: 0.35 });
    expect(r.isCompoundable).toBe(false);
    expect(r.overLimitItems[0].limitNote).toMatch(/maximum permissible FAR/);
  });

  it('warns that setback encroachment eats the same 10%', () => {
    const r = assessCompounding({ ...base, excessFarSqm: 20, excessFarFraction: 0.05 });
    expect(r.caveats.join(' ')).toMatch(/counts towards this same 10%/);
  });
});

// -------------------------------------------------------------------------------------
// 16.3.8 Items 4–12 and the Notes
// -------------------------------------------------------------------------------------

describe('Clause 16.3.8 — the remaining heads', () => {
  // Item 4: basement beyond the permissible limit, 50% of the price of land.
  it('prices an excess basement at 50% of the land price', () => {
    expect(assessCompounding({ ...base, excessBasementSqm: 30 }).totalPayable).toBe(30 * LAND * 0.50);
  });

  // Item 5: Rs. 246 per sq meter on the area of the room.
  it('prices a room below the minimum height at ₹246/m²', () => {
    expect(assessCompounding({ ...base, roomsBelowMinHeightSqm: 12 }).totalPayable).toBe(12 * 246);
  });

  // Items 6, 7, 8 all sit at Rs. 123 residential.
  it('prices width, area and light-and-ventilation shortfalls at ₹123/m² each', () => {
    const r = assessCompounding({
      ...base, roomsBelowMinWidthSqm: 10, roomsBelowMinAreaSqm: 10, roomsBelowLightVentilationSqm: 10,
    });
    expect(r.lineItems).toHaveLength(3);
    expect(r.totalPayable).toBe(3 * 10 * 123);
  });

  // Item 9: Rs. 123 per running meter but a minimum of Rs. 5000.
  it('applies the compound-wall minimum of ₹5,000', () => {
    expect(assessCompounding({ ...base, compoundWallExcessRunningM: 10 }).totalPayable).toBe(5_000);
    expect(assessCompounding({ ...base, compoundWallExcessRunningM: 100 }).totalPayable).toBe(12_300);
  });

  // Item 11: 1.0 percent of price of land on saleable area.
  it('prices an unapproved but conforming layout at 1% of the land price', () => {
    expect(assessCompounding({ ...base, unapprovedConformingSaleableSqm: 1_000 }).totalPayable)
      .toBe(1_000 * LAND * 0.01);
  });

  // Item 12: two times the price of land on the amenity shortfall.
  it('prices an amenity shortfall at twice the land price', () => {
    expect(assessCompounding({ ...base, amenityAreaShortfallSqm: 100 }).totalPayable)
      .toBe(100 * LAND * 2);
  });

  // Note-1: Rs. 491 per square meter for porch, balcony/chhajja etc.
  it('prices projections at ₹491/m², doubled for commercial', () => {
    expect(assessCompounding({ ...base, projectionSqm: 8 }).totalPayable).toBe(8 * 491);
    expect(assessCompounding({ ...base, use: 'commercial', projectionSqm: 8 }).totalPayable).toBe(8 * 982);
  });

  // Note-2: 10 percent of the Impact fee, in addition to the Impact Fee.
  it('adds 10% of the impact fee for a Chapter 15 permitted activity', () => {
    expect(assessCompounding({ ...base, impactFee: 500_000 }).totalPayable).toBe(50_000);
  });

  // Note-3: 50 percent of the residential rate for 80(G) and public institutions.
  it('halves both the land rate and the per-m² rates for a charitable institution', () => {
    const r = assessCompounding({
      ...base, charitableOrPublicInstitution: true,
      excessFarSqm: 20, excessFarFraction: 0.05,
    });
    expect(r.landRateApplied).toBe(LAND * 0.5);
    expect(r.totalPayable).toBe(20 * (491 * 0.5 + LAND * 0.5 * 0.50));
  });

  // Note-4: per-square-metre rates are indexed; land-price percentages are not.
  it('indexes the per-m² heads only', () => {
    const r = assessCompounding({
      ...base, costIndexFactor: 1.2, excessFarSqm: 20, excessFarFraction: 0.05,
    });
    expect(r.totalPayable).toBe(20 * (491 * 1.2 + LAND * 0.50));
  });
});

// -------------------------------------------------------------------------------------
// 16.3.8 Item 10 — height
// -------------------------------------------------------------------------------------

describe('Clause 16.3.8 Item 10 — height beyond the permissible cap', () => {
  const tall = {
    ...base, heightDeviationM: 1.2, heightDeviationFraction: 0.08,
    buildingPerimeterM: 60, floors: 4,
  };

  it('compounds a 10%-or-less deviation in column A', () => {
    const r = assessCompounding(tall);
    expect(r.isCompoundable).toBe(true);
    // ₹6,132 per running metre, 60 m of periphery over 4 floors.
    expect(r.totalPayable).toBe(60 * 4 * 6_132);
  });

  it('records the ambiguity in the gazette’s quantity', () => {
    expect(assessCompounding(tall).lineItems[0].dispute).toMatch(/ambiguous/);
  });

  it('refuses a deviation past 10% in column A', () => {
    const r = assessCompounding({ ...tall, heightDeviationFraction: 0.15 });
    expect(r.isCompoundable).toBe(false);
  });

  it('refuses any height deviation in column B — the gazette prints a dash', () => {
    const r = assessCompounding({ ...tall, heightM: 30, heightDeviationFraction: 0.01 });
    expect(r.isCompoundable).toBe(false);
    expect(r.overLimitItems[0].limitNote).toMatch(/has to come down/);
  });

  it('refuses any height deviation in group housing', () => {
    const r = assessCompounding({ ...tall, isGroupHousing: true, heightDeviationFraction: 0.01 });
    expect(r.isCompoundable).toBe(false);
  });

  it('reminds the applicant that the floor count may not change', () => {
    expect(assessCompounding(tall).caveats.join(' ')).toMatch(/number of floors does not change/);
  });
});

// -------------------------------------------------------------------------------------
// Totals
// -------------------------------------------------------------------------------------

describe('the total', () => {
  it('is the sum of the line items — Chapter 16 levies no surcharge on top', () => {
    const r = assessCompounding({
      ...base, plotAreaSqm: 450,
      setbackEncroachmentSqm: { front: 4, rear: 6 },
      setbackDeficitFraction: { front: 0.2, rear: 0.5 },
      setbackDeficitM: { front: 0.6, rear: 1.5 },
      excessFarSqm: 15, excessFarFraction: 0.06,
      unauthorisedWithinEnvelopeSqm: 40,
    });
    const sum = r.lineItems.reduce((n, i) => n + i.amount, 0);
    expect(r.totalPayable).toBeCloseTo(sum, 2);
    expect(r.lineItems).toHaveLength(4);
  });

  it('charges nothing when there is nothing to charge', () => {
    const r = assessCompounding(base);
    expect(r.lineItems).toHaveLength(0);
    expect(r.totalPayable).toBe(0);
    expect(r.isCompoundable).toBe(true);
  });

  it('uses the residential land rate whatever the building’s use (Clause 16.3.7(c))', () => {
    expect(assessCompounding({ ...base, use: 'industrial' }).landRateApplied).toBe(LAND);
  });
});

describe('B-040 — the clause numbering, checked against the paginated chapter', () => {
  const sources = [
    'src/domain/compounding.ts',
    'src/domain/findings.ts',
    'src/domain/rules/registry.ts',
  ];
  const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');

  it('cites no clause number Chapter 16 does not contain', () => {
    // The gazette's Chapter 16 runs 16.1, 16.2, 16.3, then 16.3.1–16.3.8 and 16.3.8.1.
    // There is no 16.1.3, and 16.3.6/16.3.7 are not sub-numbered — they are lettered.
    const phantom = /Clause 16\.1\.3|Clause 16\.3\.[467]\.[0-9]/;
    for (const f of sources) {
      const hit = phantom.exec(read(f));
      expect(hit?.[0], `${f} cites ${hit?.[0]}`).toBeUndefined();
    }
  });

  it('cites the bars at 16.3.2 and the limits table at 16.3.3', () => {
    const src = read('src/domain/compounding.ts');
    expect(src).toMatch(/Clause 16\.3\.2 i\)/);
    expect(src).toMatch(/Clause 16\.3\.3/);
  });

  it('keeps the Schedule at 16.3.8, which was right all along', () => {
    expect(read('src/domain/compounding.ts')).toMatch(/Clause 16\.3\.8/);
  });

  it('agrees with the byelaws navigator, which had it right', () => {
    // byelawsData.ts has carried 16.3.2 / 16.3.3 / 16.3.8 since it was written, so the
    // app was showing a user two different numbers for one rule.
    const nav = read('src/data/byelawsData.ts');
    for (const clause of ['16.3.2', '16.3.3', '16.3.8']) {
      expect(nav, clause).toContain(clause);
    }
  });
});
