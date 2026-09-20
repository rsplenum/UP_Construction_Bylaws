import { describe, expect, it } from 'vitest';
import {
  COST_RATES, QUALITY_FACTOR, SOURCE_NOTE, estimateBuildCost, getRate,
} from '../build-cost';

describe('what the building costs to put up', () => {
  it('prices a 1,000 sq ft house in Lucknow inside the reported range', () => {
    // The sources put a 1,000 sq ft standard build in Lucknow at ₹18–23 lakh.
    const cost = estimateBuildCost({
      floorAreaSqm: 1_000 / 10.763910416709722, rate: getRate('lucknow'), quality: 'standard',
    });
    expect(cost.totalRupees).toBeGreaterThanOrEqual(18_00_000);
    expect(cost.totalRupees).toBeLessThanOrEqual(23_00_000);
  });

  it('prices a 1,000 sq ft house in Noida inside its own, higher range', () => {
    // Reported at ₹20–26 lakh, above Lucknow for labour costs near Delhi.
    const cost = estimateBuildCost({
      floorAreaSqm: 1_000 / 10.763910416709722, rate: getRate('noida'), quality: 'standard',
    });
    expect(cost.totalRupees).toBeGreaterThanOrEqual(20_00_000);
    expect(cost.totalRupees).toBeLessThanOrEqual(26_00_000);
  });

  it('keeps standard quality inside the published per-sq-ft band', () => {
    // Standard residential work is reported at roughly ₹1,400–2,100 per sq ft.
    for (const rate of COST_RATES) {
      const { perSqft } = estimateBuildCost({
        floorAreaSqm: 100, rate, quality: 'standard',
      });
      expect(perSqft).toBeGreaterThanOrEqual(1_400);
      expect(perSqft).toBeLessThanOrEqual(2_400);
    }
  });

  it('never hands back money without its provenance', () => {
    // The whole risk with this number is that it reads like a gazette figure. It cannot
    // be obtained separately from the sentence saying it is not one.
    const cost = estimateBuildCost({
      floorAreaSqm: 300, rate: getRate('up'), quality: 'standard',
    });
    expect(cost.sourceNote).toBe(SOURCE_NOTE);
    expect(cost.sourceNote).toContain('not byelaws figures');
  });

  it('orders the quality factors and leaves standard exactly as published', () => {
    expect(QUALITY_FACTOR.basic).toBeLessThan(QUALITY_FACTOR.standard);
    expect(QUALITY_FACTOR.standard).toBe(1);
    expect(QUALITY_FACTOR.premium).toBeGreaterThan(QUALITY_FACTOR.standard);
  });

  it('scales with floor area and falls back to a real rate on an unknown id', () => {
    const one = estimateBuildCost({ floorAreaSqm: 100, rate: getRate('up'), quality: 'standard' });
    const two = estimateBuildCost({ floorAreaSqm: 200, rate: getRate('up'), quality: 'standard' });
    expect(two.totalRupees).toBeCloseTo(one.totalRupees * 2, -2);
    expect(getRate('nowhere').id).toBe('up');
  });

  it('treats a missing or negative area as nothing to build', () => {
    expect(estimateBuildCost({
      floorAreaSqm: -5, rate: getRate('up'), quality: 'standard',
    }).totalRupees).toBe(0);
  });
});
