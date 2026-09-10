import { describe, expect, it } from 'vitest';
import {
  HIGH_RISE_THRESHOLD_M,
  assessSetbackFaces,
  resolveRequiredSetbacks,
} from '../setbacks';
import { compoundableLimits } from '../compounding';

const base = { occupancy: 'res_single' as const, plotArea: 320, buildingHeight: 12, isCornerPlot: false };

describe('resolveRequiredSetbacks — plotted residential', () => {
  it('reads Table 3.2.1 at each band', () => {
    expect(resolveRequiredSetbacks({ ...base, plotArea: 120 })).toMatchObject({ front: 1.0, rear: 0, side1: 0, side2: 0 });
    expect(resolveRequiredSetbacks({ ...base, plotArea: 250 })).toMatchObject({ front: 3.0, rear: 1.5 });
    expect(resolveRequiredSetbacks({ ...base, plotArea: 450 })).toMatchObject({ front: 3.0, rear: 3.0 });
    expect(resolveRequiredSetbacks({ ...base, plotArea: 900 })).toMatchObject({ front: 4.5, rear: 4.5, side1: 1.5 });
    expect(resolveRequiredSetbacks({ ...base, plotArea: 2000 })).toMatchObject({ front: 6.0, rear: 6.0, side1: 1.5, side2: 1.5 });
  });

  it('has no hole at a band boundary', () => {
    // Previously 150.005 sqm matched no row in PLOTTED_RESIDENTIAL_SETBACKS.
    expect(resolveRequiredSetbacks({ ...base, plotArea: 150.005 }).front).toBe(3.0);
    expect(resolveRequiredSetbacks({ ...base, plotArea: 300.005 }).rear).toBe(3.0);
  });

  it('does not cap out on very large plots', () => {
    // The old table stopped at maxPlotArea 99999.
    const r = resolveRequiredSetbacks({ ...base, plotArea: 250_000 });
    expect(r.front).toBe(6.0);
    expect(r.caveats).toHaveLength(0);
  });

  it('applies the corner-plot secondary frontage rule', () => {
    const corner = resolveRequiredSetbacks({ ...base, plotArea: 250, isCornerPlot: true });
    expect(corner.side2).toBe(corner.front);
    expect(corner.cornerRuleApplied).toBe(true);
  });

  it('does not reduce an already-larger side-2 setback on a corner plot', () => {
    const corner = resolveRequiredSetbacks({ occupancy: 'res_single', plotArea: 2000, buildingHeight: 12, isCornerPlot: true });
    expect(corner.side2).toBe(6.0); // raised from 1.5 to the 6.0 front setback
  });
});

describe('resolveRequiredSetbacks — high rise', () => {
  it('does not treat exactly 15m as a high rise', () => {
    expect(resolveRequiredSetbacks({ ...base, buildingHeight: HIGH_RISE_THRESHOLD_M }).isHighRise).toBe(false);
  });

  it('resolves the correct progressive band just above each boundary', () => {
    // The bug this replaces: 15.005m fell through to the >51m band and demanded 15m.
    expect(resolveRequiredSetbacks({ ...base, buildingHeight: 15.005 }).front).toBe(5);
    expect(resolveRequiredSetbacks({ ...base, buildingHeight: 17.505 }).front).toBe(6);
    expect(resolveRequiredSetbacks({ ...base, buildingHeight: 21.005 }).front).toBe(7);
    expect(resolveRequiredSetbacks({ ...base, buildingHeight: 45.005 }).front).toBe(11);
    expect(resolveRequiredSetbacks({ ...base, buildingHeight: 80 })).toMatchObject({ front: 15, rear: 12 });
  });

  it('overrides the plot-area ladder regardless of occupancy', () => {
    const tiny = resolveRequiredSetbacks({ occupancy: 'com_complex', plotArea: 80, buildingHeight: 30, isCornerPlot: false });
    expect(tiny.front).toBe(8);
    expect(tiny.isHighRise).toBe(true);
  });
});

describe('assessSetbackFaces', () => {
  const required = resolveRequiredSetbacks({ ...base, plotArea: 450 }); // front 3, rear 3

  // Chapter 16.2, column A, residential plot up to 500 sqm.
  const colA = compoundableLimits({
    heightM: 12, isGroupHousing: false, isMultiUnit: false, plotAreaSqm: 450, use: 'residential',
  }).setback;

  it('passes a compliant face', () => {
    const [front] = assessSetbackFaces(required, { front: 3.0, rear: 3.0, side1: 0, side2: 0 }, colA);
    expect(front.status).toBe('compliant');
    expect(front.deficitM).toBe(0);
  });

  it('marks a small front deficit compoundable and a large one a violation', () => {
    const small = assessSetbackFaces(required, { front: 2.4, rear: 3, side1: 0, side2: 0 }, colA)[0]; // 0.6 m, 20%
    expect(small.status).toBe('compoundable');
    const large = assessSetbackFaces(required, { front: 1.5, rear: 3, side1: 0, side2: 0 }, colA)[0]; // 1.5 m, 50%
    expect(large.status).toBe('violation');
  });

  it('applies the absolute 1.0 m front cap even when the percentage passes', () => {
    // Clause 16.2: "25% of front setback area up to a maximum of 1.0 meter". On a deep
    // front setback, 25% is more than a metre, and the metre is what binds.
    const deep = resolveRequiredSetbacks({ ...base, plotArea: 2000 }); // front 6 m
    const face = assessSetbackFaces(deep, { front: 4.8, rear: 6, side1: 6, side2: 6 }, compoundableLimits({
      heightM: 12, isGroupHousing: false, isMultiUnit: false, plotAreaSqm: 2000, use: 'residential',
    }).setback)[0];
    expect(face.deficitM).toBe(1.2);
    expect(face.deficitPct).toBe(20); // inside the 25%
    expect(face.status).toBe('violation'); // but outside the 1.0 m
  });

  it('still compounds a setback shortfall above 15 m, at the tighter column-B limit', () => {
    // The engine used to make every high-rise setback deficit a flat violation. Clause
    // 16.2 column B allows 10% of the setback area, up to a width of 1 m, against a
    // Fire NOC. 0.01 m off a 6 m setback is 0.17% — inside it.
    const hr = resolveRequiredSetbacks({ ...base, buildingHeight: 20 }); // 6 m all round
    const colB = compoundableLimits({
      heightM: 20, isGroupHousing: false, isMultiUnit: false, plotAreaSqm: 450, use: 'residential',
    }).setback;
    expect(colB.front.requiresFireNoc).toBe(true);
    const verdicts = assessSetbackFaces(hr, { front: 5.99, rear: 6, side1: 6, side2: 6 }, colB);
    expect(verdicts[0].status).toBe('compoundable');

    // 1.0 m off the same 6 m setback is 16.7% — past the 10%.
    const past = assessSetbackFaces(hr, { front: 5.0, rear: 6, side1: 6, side2: 6 }, colB);
    expect(past[0].status).toBe('violation');
  });

  it('treats any shortfall as a violation when no compounding limits are supplied', () => {
    const face = assessSetbackFaces(required, { front: 2.99, rear: 3, side1: 0, side2: 0 })[0];
    expect(face.status).toBe('violation');
  });
});

/**
 * V-010. Two chapters give the plotted-residential height ceiling and they disagree.
 * Clause 3.2.4.1 keys it on plot size — under 300 m², three floors to 15 m; above it,
 * four to 17.5 m. Clause 4.1.4 keys it on unit count: "15-m including stilt for single
 * unit and 17.5 meters including mandatory stilt floor for multi-unit". A single dwelling
 * on a 400 m² plot is 17.5 m by the first and 15 m by the second.
 */
describe('the plotted height ceiling, where chapters 3 and 4 disagree', () => {
  const ceiling = (occupancy: 'res_single' | 'res_multi', plotArea: number) =>
    resolveRequiredSetbacks({ ...base, occupancy, plotArea }).maxHeight;

  it('caps a single dwelling at 15 m even on a large plot', () => {
    expect(ceiling('res_single', 250)).toBe(15);    // both chapters agree
    expect(ceiling('res_single', 400)).toBe(15);    // Ch 3 says 17.5, Ch 4 says 15
    expect(ceiling('res_single', 2_000)).toBe(15);
  });

  it('caps a multi-unit at 15 m below 300 m² and 17.5 m above it', () => {
    expect(ceiling('res_multi', 250)).toBe(15);     // Ch 3 binds
    expect(ceiling('res_multi', 400)).toBe(17.5);   // both agree
  });
});

/**
 * Clause 5.1.5 — the one setback table in the byelaws keyed on road width rather than
 * plot area. The engine routed bazaar street to the commercial (plot-area) ladder, which
 * gave an unrelated answer on every bazaar-street plot (B-022).
 *
 * Proposed road width → minimum open space in front:
 *   12 → 3.0 · 18 → 4.5 · 24 → 6.0 · 30 → 6.0 · 36 → 7.5 · 45 → 7.5 · 76 → 9.0
 */
describe('bazaar street front setback', () => {
  const front = (roadWidth: number, plotArea = 200) =>
    resolveRequiredSetbacks({ ...base, occupancy: 'com_bazaar', plotArea, roadWidth }).front;

  it.each([[12, 3.0], [18, 4.5], [24, 6.0], [30, 6.0], [36, 7.5], [45, 7.5], [76, 9.0]])(
    'a %s m road requires %s m of front open space',
    (road, expected) => expect(front(road)).toBe(expected),
  );

  it('rounds a width between two listed roads up to the stricter one (V-012)', () => {
    expect(front(15)).toBe(4.5);   // between 12 and 18: the 18 m figure, not the 12 m one
    expect(front(100)).toBe(9.0);  // past the last listed width
  });

  it('does not vary with plot area, unlike every other setback table', () => {
    expect(front(18, 100)).toBe(front(18, 5_000));
  });

  it('says which clause it came from', () => {
    const r = resolveRequiredSetbacks({ ...base, occupancy: 'com_bazaar', plotArea: 200, roadWidth: 18 });
    expect(r.clauseRef).toMatch(/5\.1\.5/);
    expect(r.caveats.join(' ')).toMatch(/V-012/);
  });

  it('still hands a building over 15 m to the fire-tender ladder', () => {
    const r = resolveRequiredSetbacks({
      ...base, occupancy: 'com_bazaar', plotArea: 200, roadWidth: 18, buildingHeight: 20,
    });
    expect(r.isHighRise).toBe(true);
    expect(r.front).toBe(6); // Clause 3.2.4.9, >17.5–21 m band
  });
});
