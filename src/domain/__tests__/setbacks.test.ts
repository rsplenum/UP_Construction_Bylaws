import { describe, expect, it } from 'vitest';
import {
  HIGH_RISE_THRESHOLD_M,
  assessSetbackFaces,
  resolveRequiredSetbacks,
} from '../setbacks';

const base = { occupancy: 'single_unit' as const, plotArea: 320, buildingHeight: 12, isCornerPlot: false };

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
    const corner = resolveRequiredSetbacks({ occupancy: 'single_unit', plotArea: 2000, buildingHeight: 12, isCornerPlot: true });
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
    const tiny = resolveRequiredSetbacks({ occupancy: 'commercial', plotArea: 80, buildingHeight: 30, isCornerPlot: false });
    expect(tiny.front).toBe(8);
    expect(tiny.isHighRise).toBe(true);
  });
});

describe('assessSetbackFaces', () => {
  const required = resolveRequiredSetbacks({ ...base, plotArea: 450 }); // front 3, rear 3

  it('passes a compliant face', () => {
    const [front] = assessSetbackFaces(required, { front: 3.0, rear: 3.0, side1: 0, side2: 0 });
    expect(front.status).toBe('compliant');
    expect(front.deficitM).toBe(0);
  });

  it('marks a small front deficit compoundable and a large one a violation', () => {
    const small = assessSetbackFaces(required, { front: 2.4, rear: 3, side1: 0, side2: 0 })[0]; // 20% short
    expect(small.status).toBe('compoundable');
    const large = assessSetbackFaces(required, { front: 1.5, rear: 3, side1: 0, side2: 0 })[0]; // 50% short
    expect(large.status).toBe('violation');
  });

  it('never treats a high-rise fire setback deficit as compoundable', () => {
    const hr = resolveRequiredSetbacks({ ...base, buildingHeight: 20 }); // 6m all round
    const verdicts = assessSetbackFaces(hr, { front: 5.99, rear: 6, side1: 6, side2: 6 });
    expect(verdicts[0].status).toBe('violation');
  });
});
