import { describe, expect, it } from 'vitest';
import { ADMIN_SURCHARGE_FRACTION, assessCompounding } from '../compounding';

const baseInput = {
  use: 'residential' as const,
  circleRate: 30_000,
  flags: {},
  setbackEncroachmentSqm: {},
  excessFarSqm: 0,
  heightDeviationM: 0,
};

describe('assessCompounding — statutory exclusions', () => {
  it('refuses to quote a fee for a non-compoundable deviation', () => {
    const r = assessCompounding({ ...baseInput, flags: { onPublicLandOrAmenity: true }, setbackEncroachmentSqm: { front: 20 } });
    expect(r.isCompoundable).toBe(false);
    expect(r.totalPayable).toBe(0);
    expect(r.lineItems).toHaveLength(0);
    expect(r.blockingReasons[0]).toMatch(/public land/i);
  });

  it('reports every applicable exclusion, not just the first', () => {
    const r = assessCompounding({ ...baseInput, flags: { inIllegalColony: true, breachesFireSafety: true, encroachesWaterBody: true } });
    expect(r.blockingReasons).toHaveLength(3);
  });

  it('blocks a high-rise fire setback deficit', () => {
    const r = assessCompounding({ ...baseInput, flags: { highRiseFireSetbackDeficit: true }, setbackEncroachmentSqm: { front: 5 } });
    expect(r.isCompoundable).toBe(false);
  });
});

describe('assessCompounding — fee assessment', () => {
  it('prices a front encroachment at the scheduled multiplier', () => {
    const r = assessCompounding({
      ...baseInput,
      setbackEncroachmentSqm: { front: 10 },
      setbackDeficitFraction: { front: 0.2 },
    });
    expect(r.lineItems).toHaveLength(1);
    expect(r.assessedFee).toBe(10 * 30_000 * 1.0);
    expect(r.adminSurcharge).toBe(r.assessedFee * ADMIN_SURCHARGE_FRACTION);
    expect(r.totalPayable).toBe(r.assessedFee + r.adminSurcharge);
  });

  it('charges commercial at twice the residential front rate', () => {
    const res = assessCompounding({ ...baseInput, setbackEncroachmentSqm: { front: 10 } });
    const com = assessCompounding({ ...baseInput, use: 'commercial', setbackEncroachmentSqm: { front: 10 } });
    expect(com.assessedFee).toBe(res.assessedFee * 2);
  });

  it('flags a deviation beyond the Chapter 16.3 ceiling as not regularisable', () => {
    // 40% front deficit exceeds the 25% compoundable ceiling.
    const r = assessCompounding({
      ...baseInput,
      setbackEncroachmentSqm: { front: 10 },
      setbackDeficitFraction: { front: 0.4 },
    });
    expect(r.isCompoundable).toBe(false);
    expect(r.overLimitItems).toHaveLength(1);
    expect(r.blockingReasons[0]).toMatch(/caps front setback compounding at 25%/i);
  });

  it('caps excess FAR compounding at 10% of permissible', () => {
    const within = assessCompounding({ ...baseInput, excessFarSqm: 40, excessFarFraction: 0.08 });
    expect(within.isCompoundable).toBe(true);
    const beyond = assessCompounding({ ...baseInput, excessFarSqm: 400, excessFarFraction: 0.35 });
    expect(beyond.isCompoundable).toBe(false);
  });

  it('returns a zero assessment when nothing deviates', () => {
    const r = assessCompounding(baseInput);
    expect(r.isCompoundable).toBe(true);
    expect(r.totalPayable).toBe(0);
    expect(r.lineItems).toHaveLength(0);
  });
});
