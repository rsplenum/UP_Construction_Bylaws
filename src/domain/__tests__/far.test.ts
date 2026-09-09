import { describe, expect, it } from 'vitest';
import { PURCHASABLE_FAR_MIN_ROAD_WIDTH, resolveBaseFar } from '../far';

describe('resolveBaseFar — telescopic residential', () => {
  const far = (plotArea: number, roadWidth = 12) =>
    resolveBaseFar({ occupancy: 'res_single', plotArea, roadWidth });

  it('applies a flat FAR inside the first slab', () => {
    expect(far(100).baseFar).toBe(2.0);
    expect(far(150).baseFar).toBe(2.0);
  });

  it('blends slabs telescopically', () => {
    // 150×2.0 + 150×1.8 = 570 over 300 sqm
    expect(far(300).baseFar).toBe(1.9);
    expect(far(300).baseBuiltUpArea).toBe(570);
  });

  it('is continuous across every slab boundary', () => {
    for (const boundary of [150, 300, 500, 1200]) {
      const below = far(boundary).baseBuiltUpArea;
      const above = far(boundary + 0.01).baseBuiltUpArea;
      expect(above).toBeGreaterThanOrEqual(below);
      expect(above - below).toBeLessThan(0.05);
    }
  });

  it('never increases effective FAR as the plot grows', () => {
    let previous = Infinity;
    for (const area of [100, 200, 400, 800, 1500, 5000, 20000]) {
      const current = far(area).baseFar;
      expect(current).toBeLessThanOrEqual(previous);
      previous = current;
    }
  });

  it('shows its working', () => {
    expect(far(400).workings).toContain('÷ 400 sqm');
    expect(far(400).slabs).toHaveLength(3);
  });

  it('returns a defined result for a zero plot instead of NaN', () => {
    const r = far(0);
    expect(r.baseFar).toBe(0);
    expect(Number.isFinite(r.maxPermissibleBuiltUpArea)).toBe(true);
    expect(r.caveats.length).toBeGreaterThan(0);
  });
});

describe('resolveBaseFar — purchasable FAR gate', () => {
  it('bars purchasable FAR below the road-width threshold', () => {
    const narrow = resolveBaseFar({ occupancy: 'res_single', plotArea: 400, roadWidth: PURCHASABLE_FAR_MIN_ROAD_WIDTH - 0.01 });
    expect(narrow.purchasableFar).toBe(0);
    expect(narrow.caveats.join(' ')).toMatch(/barred/i);
    expect(narrow.maxPermissibleFar).toBe(narrow.effectiveBaseFar);
  });

  it('permits purchasable FAR at exactly the threshold', () => {
    const ok = resolveBaseFar({ occupancy: 'res_single', plotArea: 400, roadWidth: PURCHASABLE_FAR_MIN_ROAD_WIDTH });
    expect(ok.purchasableFar).toBeGreaterThan(0);
  });
});

describe('resolveBaseFar — road-width matrices', () => {
  it('resolves group housing without falling through at a band edge', () => {
    // The old matrix had a hole between 12.0 and 12.01 that dropped to the widest band.
    expect(resolveBaseFar({ occupancy: 'res_group_housing', plotArea: 5000, roadWidth: 12.005 }).baseFar).toBe(2.0);
    expect(resolveBaseFar({ occupancy: 'res_group_housing', plotArea: 5000, roadWidth: 18.005 }).baseFar).toBe(2.25);
    expect(resolveBaseFar({ occupancy: 'res_group_housing', plotArea: 5000, roadWidth: 24.005 }).baseFar).toBe(2.5);
  });

  it('reports nil FAR on a road below the minimum right-of-way', () => {
    const r = resolveBaseFar({ occupancy: 'res_group_housing', plotArea: 5000, roadWidth: 6 });
    expect(r.baseFar).toBe(0);
    expect(r.caveats.join(' ')).toMatch(/no FAR is sanctionable/i);
  });
});

describe('resolveBaseFar — green incentive', () => {
  it('uplifts base FAR by the rated fraction and nothing else', () => {
    const plain = resolveBaseFar({ occupancy: 'res_single', plotArea: 400, roadWidth: 12 });
    const platinum = resolveBaseFar({ occupancy: 'res_single', plotArea: 400, roadWidth: 12, greenRating: 'platinum' });
    expect(platinum.effectiveBaseFar).toBeCloseTo(plain.baseFar * 1.07, 3);
    expect(platinum.purchasableFar).toBe(plain.purchasableFar);
  });
});

describe('the presentation adapter agrees with the resolver', () => {
  it('reports the same slabs and base FAR as resolveBaseFar', async () => {
    const { calculateTelescopicResidentialFAR } = await import('../../data/byelawsData');
    for (const area of [80, 150, 151, 320, 500, 900, 1200, 4000]) {
      const adapter = calculateTelescopicResidentialFAR(area);
      const engine = resolveBaseFar({ occupancy: 'res_single', plotArea: area, roadWidth: 12 });
      expect(adapter.effectiveBaseFAR).toBe(engine.baseFar);
      expect(adapter.totalBaseBuiltUpArea).toBe(engine.baseBuiltUpArea);
      expect(adapter.slabs).toHaveLength(engine.slabs.length);
    }
  });
});
