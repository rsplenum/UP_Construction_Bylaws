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
  it('holds group housing Base FAR flat and lets road width set the ceiling', () => {
    // Gazette: Base FAR is 1.5 for built-up group housing at every road width; the road
    // determines Max FAR (9-12m 2.0, >12-18m 3.0, >18-24m 3.0, >24-45m 5.25).
    const at = (roadWidth: number) => resolveBaseFar({ occupancy: 'res_group_housing', plotArea: 5000, roadWidth });
    for (const w of [12.005, 18.005, 24.005, 40]) expect(at(w).baseFar).toBe(1.5);
    // A 10 m road clears the 9 m minimum, so the base is available — but Chapter 9.2.1
    // bars buying the headroom up to the 2.0 ceiling.
    expect(at(10).baseFar).toBe(1.5);
    expect(at(10).purchasableFar).toBe(0);
    expect(at(10).maxPermissibleFar).toBe(1.5);
    expect(at(15).maxPermissibleFar).toBe(3.0);
    expect(at(30).maxPermissibleFar).toBe(5.25);
  });

  it('never permits plotted residential above the gazette ceiling of 2.0', () => {
    for (const area of [100, 150, 280, 400, 900, 2000]) {
      const r = resolveBaseFar({ occupancy: 'res_single', plotArea: area, roadWidth: 12 });
      expect(r.maxPermissibleFar, `${area} m²`).toBeLessThanOrEqual(2.0 + 1e-9);
    }
  });

  it('reports nil FAR on a road below the minimum right-of-way', () => {
    const r = resolveBaseFar({ occupancy: 'res_group_housing', plotArea: 5000, roadWidth: 6 });
    expect(r.baseFar).toBe(0);
    expect(r.caveats.join(' ')).toMatch(/no FAR is sanctionable/i);
  });
});

describe('resolveBaseFar — green incentive', () => {
  it('grants the green incentive above the ceiling, not inside it', () => {
    // Gazette 9.3: "additional FAR on availed FAR ... over and above the MFAR".
    const plain = resolveBaseFar({ occupancy: 'res_single', plotArea: 400, roadWidth: 12 });
    const platinum = resolveBaseFar({ occupancy: 'res_single', plotArea: 400, roadWidth: 12, greenRating: 'platinum' });

    // It must not alter the base, and must not consume purchasable headroom.
    expect(platinum.effectiveBaseFar).toBe(plain.effectiveBaseFar);
    expect(platinum.purchasableFar).toBe(plain.purchasableFar);
    // It lifts the absolute ceiling by 7% of what was availed.
    expect(platinum.maxPermissibleFar).toBeCloseTo(plain.maxPermissibleFar * 1.07, 2);
    expect(platinum.maxPermissibleFar).toBeGreaterThan(2.0);
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

/**
 * B-013. The gazette prints a separate FAR row for every occupancy in each of
 * "(Built up)" and "(Non-Built up)", and the ceilings differ. The engine applied the
 * built-up ceilings to both.
 */
describe('Max FAR is keyed on area type as well as road width', () => {
  const gh = (roadWidth: number, areaType: 'built_up' | 'non_built_up') =>
    resolveBaseFar({ occupancy: 'res_group_housing', plotArea: 5_000, roadWidth, areaType });

  // Gazette row 2(a): base 1.5, max 2.0 / 3.0 / 3.0 / 5.25 / unrestricted.
  it.each([[10, 2.0], [15, 3.0], [20, 3.0], [30, 5.25]])(
    'built-up group housing on a %s m road tops out at %s',
    (road, ceiling) => expect(gh(road, 'built_up').ceilingFar).toBe(ceiling),
  );

  // Gazette row 2(b): base 2.5, max 5.0 / 5.0 / 8.75 / unrestricted.
  it.each([[15, 5.0], [20, 5.0], [30, 8.75]])(
    'non-built-up group housing on a %s m road tops out at %s',
    (road, ceiling) => expect(gh(road, 'non_built_up').ceilingFar).toBe(ceiling),
  );

  it('carries the higher base FAR in a new layout', () => {
    expect(gh(30, 'built_up').baseFar).toBe(1.5);
    expect(gh(30, 'non_built_up').baseFar).toBe(2.5);
  });

  it('does not permit group housing below a 12 m road in a new layout', () => {
    // Row 2(b) starts at ">12 - 18m". Row 2(a) has a 9-12 m band; row 2(b) does not.
    expect(gh(10, 'built_up').baseFar).toBe(1.5);
    expect(gh(10, 'non_built_up').baseFar).toBe(0);
    expect(gh(10, 'non_built_up').caveats.join(' ')).toMatch(/non-built-up/);
  });

  // Gazette rows 3(a)/3(b): shops, built-up 2.1 / 3.0 / 5.0, non-built-up 2.45 / 3.5 / 6.0.
  it.each([[12, 2.1, 2.45], [20, 3.0, 3.5], [30, 5.0, 6.0]])(
    'shops on a %s m road top out at %s built-up and %s in a new layout',
    (road, builtUp, newLayout) => {
      const at = (areaType: 'built_up' | 'non_built_up') =>
        resolveBaseFar({ occupancy: 'com_shop', plotArea: 800, roadWidth: road, areaType }).ceilingFar;
      expect(at('built_up')).toBe(builtUp);
      expect(at('non_built_up')).toBe(newLayout);
    },
  );
});
