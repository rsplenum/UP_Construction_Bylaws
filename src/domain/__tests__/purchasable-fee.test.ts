import { describe, expect, it } from 'vitest';
import { canPurchaseFarAt, resolveBaseFar } from '../far';
import { OCCUPANCIES } from '../occupancy';
import {
  FACTOR_COEFFICIENTS,
  GREEN_RATING_SHORTFALL_PENALTY_MULTIPLE,
  assessPurchaseFee,
  greenRatingShortfallPenalty,
  splitPurchasedFar, PURCHASABLE_SHARE_BY_ROAD,
} from '../purchasable-fee';

/**
 * Clause 9.2.5 prints a worked example beside its formula. Reproducing it is the
 * strongest check available on this module: it tests the drafter's own arithmetic rather
 * than a reading of it.
 */
describe('Clause 9.2.5 — the gazette’s own worked example', () => {
  // "In a group housing scheme of plot area of 2000 sq.m. in non-built-up area with
  // approach road of width 30m." Base FAR 2.5; purchasable availed 2.5; premium
  // purchasable availed 3.0 (of 3.75 permissible); land rate ₹35,000/m².
  const result = assessPurchaseFee({
    category: 'Residential (Group Housing)',
    baseFar: 2.5,
    plotAreaSqm: 2_000,
    landRate: 35_000,
    purchasableFarAvailed: 2.5,
    premiumPurchasableFarAvailed: 3.0,
  });

  it('reaches the printed purchasable charge of ₹2,80,00,000', () => {
    const line = result.lines.find((l) => l.kind === 'purchasable')!;
    expect(line.additionalFloorAreaSqm).toBe(5_000);   // FP
    expect(line.proportionalLandSqm).toBe(2_000);      // Le = FP ÷ base FAR
    expect(line.factorCoefficient).toBe(0.40);         // P
    expect(line.charge).toBe(2_80_00_000);
  });

  it('reaches the printed premium charge of ₹6,72,00,000', () => {
    const line = result.lines.find((l) => l.kind === 'premiumPurchasable')!;
    expect(line.additionalFloorAreaSqm).toBe(6_000);
    expect(line.proportionalLandSqm).toBe(2_400);
    expect(line.factorCoefficient).toBe(0.80);
    expect(line.charge).toBe(6_72_00_000);
  });

  it('reaches the printed total of ₹9,52,00,000', () => {
    expect(result.totalCharge).toBe(9_52_00_000);
  });

  it('charges what is availed, not what is permissible', () => {
    // The example permits 3.75 of premium and takes 3.0. The charge follows the 3.0.
    const line = result.lines.find((l) => l.kind === 'premiumPurchasable')!;
    expect(line.farAvailed).toBe(3.0);
  });
});

describe('Clause 9.2.5 — the factor coefficients', () => {
  it.each([
    ['Commercial', 0.50, 1.0],
    ['Mixed Use', 0.45, 0.9],
    ['Office Buildings / Institutional', 0.45, 0.9],
    ['Hotels', 0.40, 0.8],
    ['Residential (Group Housing)', 0.40, 0.8],
    ['Community Facilities & Infrastructure', 0.20, 0.4],
  ] as const)('%s is %s and %s', (category, p, pp) => {
    expect(FACTOR_COEFFICIENTS[category].purchasable).toBe(p);
    expect(FACTOR_COEFFICIENTS[category].premiumPurchasable).toBe(pp);
  });

  /** The premium column holds a dash for plotted residential, not a zero. */
  it('gives plotted residential no premium purchasable FAR at all', () => {
    expect(FACTOR_COEFFICIENTS['Residential (Plotted)'].premiumPurchasable).toBeNull();

    const r = assessPurchaseFee({
      category: 'Residential (Plotted)', baseFar: 1.8, plotAreaSqm: 300,
      landRate: 40_000, purchasableFarAvailed: 0.2, premiumPurchasableFarAvailed: 0.5,
    });
    expect(r.lines.map((l) => l.kind)).toEqual(['purchasable']);
    expect(r.caveats.join(' ')).toMatch(/not available to this use at any price/);
  });

  it('covers every category an occupancy can name', () => {
    for (const o of Object.values(OCCUPANCIES)) {
      expect(FACTOR_COEFFICIENTS[o.purchasableFarCategory], o.id).toBeDefined();
    }
  });
});

describe('B-027 — the two exceptions to the 12 m purchase bar', () => {
  /**
   * Clause 9.2.3 Note-1: for residential plotted development the purchase does not depend
   * on the road width at all. The engine barred it below 12 m, which left a house on a
   * 6 m road at its telescopic base with headroom it was entitled to buy.
   */
  it('lets plotted residential purchase on any road', () => {
    for (const roadWidth of [4, 6, 7.5, 9]) {
      expect(canPurchaseFarAt({ occupancy: 'res_single', roadWidth, areaType: 'built_up' }).allowed,
        `${roadWidth} m`).toBe(true);
    }
    // A 400 m² plot has a telescopic base of 1.775 against a flat 2.0 ceiling.
    const far = resolveBaseFar({ occupancy: 'res_single', plotArea: 400, roadWidth: 6 });
    expect(far.purchasableFar).toBeGreaterThan(0);
    expect(far.maxPermissibleFar).toBe(2.0);
  });

  /** Clause 9.2.1(ii): group housing in a built-up area may purchase from a 9 m road. */
  it('lets built-up group housing purchase from 9 m, but not a new layout', () => {
    const at = (roadWidth: number, areaType: 'built_up' | 'non_built_up') =>
      canPurchaseFarAt({ occupancy: 'res_group_housing', roadWidth, areaType }).allowed;
    expect(at(9, 'built_up')).toBe(true);
    expect(at(8.9, 'built_up')).toBe(false);
    expect(at(9, 'non_built_up')).toBe(false);
    expect(at(12, 'non_built_up')).toBe(true);

    // Built-up group housing on a 10 m road: base 1.5, ceiling 2.0, so 0.5 to buy.
    const far = resolveBaseFar({
      occupancy: 'res_group_housing', plotArea: 5_000, roadWidth: 10, areaType: 'built_up',
    });
    expect(far.purchasableFar).toBe(0.5);
  });

  it('still bars everything else below 12 m', () => {
    for (const occupancy of ['com_shop', 'com_mall', 'inst_health', 'office'] as const) {
      expect(canPurchaseFarAt({ occupancy, roadWidth: 11, areaType: 'built_up' }).allowed,
        occupancy).toBe(false);
      expect(canPurchaseFarAt({ occupancy, roadWidth: 12, areaType: 'built_up' }).allowed,
        occupancy).toBe(true);
    }
  });

  it('names the clause it applied when it bars a purchase', () => {
    const far = resolveBaseFar({ occupancy: 'com_shop', plotArea: 300, roadWidth: 10 });
    expect(far.purchasableFar).toBe(0);
    expect(far.caveats.join(' ')).toMatch(/9\.2\.1\(ii\)/);
  });
});

describe('Clause 9.3 Note II — the green rating penalty', () => {
  it('is twice the land cost of the FAR that was not earned', () => {
    expect(GREEN_RATING_SHORTFALL_PENALTY_MULTIPLE).toBe(2);
    // 5% of a 2.0 availed FAR on a 1000 m² plot is 0.1 FAR = 100 m² of floor area.
    expect(greenRatingShortfallPenalty({
      unearnedFarPoints: 0.1, plotAreaSqm: 1_000, circleRate: 40_000,
    })).toBe(100 * 40_000 * 2);
  });

  it('is nothing when the rating was achieved', () => {
    expect(greenRatingShortfallPenalty({
      unearnedFarPoints: 0, plotAreaSqm: 1_000, circleRate: 40_000,
    })).toBe(0);
  });
});

describe('Clause 9.2.3 columns (3) and (4) — the tranche split', () => {
  it('matches the gazette worked example: purchasable is exhausted before premium begins', () => {
    // Group housing, non-built-up, base FAR 2.5, road 30 m. The example avails 2.5 of
    // purchasable and 3.0 of premium — so purchasable capacity is 100% of base at 24–45 m.
    const split = splitPurchasedFar({ farAboveBase: 5.5, baseFar: 2.5, roadWidth: 30 });
    expect(split.purchasableCapacity).toBe(2.5);
    expect(split.purchasable).toBe(2.5);
    expect(split.premiumPurchasable).toBe(3.0);
    expect(split.band).toBe('24 – 45m');
  });

  it('prices that split exactly as the gazette does', () => {
    const split = splitPurchasedFar({ farAboveBase: 5.5, baseFar: 2.5, roadWidth: 30 });
    const fee = assessPurchaseFee({
      category: 'Residential (Group Housing)',
      baseFar: 2.5,
      plotAreaSqm: 2_000,
      landRate: 35_000,
      purchasableFarAvailed: split.purchasable,
      premiumPurchasableFarAvailed: split.premiumPurchasable,
    });
    expect(fee.lines.map((l) => l.charge)).toEqual([2_80_00_000, 6_72_00_000]);
    expect(fee.totalCharge).toBe(9_52_00_000);
  });

  it('takes nothing as premium while the purchasable tranche has room', () => {
    const split = splitPurchasedFar({ farAboveBase: 1.0, baseFar: 2.5, roadWidth: 30 });
    expect(split.purchasable).toBe(1.0);
    expect(split.premiumPurchasable).toBe(0);
  });

  it('gives each road band the percentage Clause 9.2.3 prints for it', () => {
    const capacity = (roadWidth: number) =>
      splitPurchasedFar({ farAboveBase: 99, baseFar: 2.0, roadWidth }).purchasableCapacity;
    expect(capacity(9)).toBe(0.4);    // 20% of B1
    expect(capacity(12)).toBe(0.4);   // inclusive upper edge
    expect(capacity(18)).toBe(1.0);   // 50% of B2
    expect(capacity(24)).toBe(1.0);
    expect(capacity(30)).toBe(2.0);   // 100% of B3
    expect(capacity(60)).toBe(2.0);   // 100% of B4
  });

  it('uses only the two columns that are not defective', () => {
    // V-029: column (5) mislabels its base. Columns (3) and (4) are self-consistent, and
    // nothing here reads column (5).
    expect(PURCHASABLE_SHARE_BY_ROAD.map((b) => b.purchasable)).toEqual([0.2, 0.5, 1.0, 1.0]);
  });
});

describe('B-031 — the charge is Le, not FP', () => {
  it('does not multiply the floor area by the rate directly', () => {
    const fee = assessPurchaseFee({
      category: 'Residential (Group Housing)',
      baseFar: 2.5, plotAreaSqm: 2_000, landRate: 35_000,
      purchasableFarAvailed: 2.5,
    });
    const floorArea = 2.5 * 2_000;
    expect(fee.lines[0].additionalFloorAreaSqm).toBe(floorArea);
    expect(fee.lines[0].proportionalLandSqm).toBe(floorArea / 2.5);
    // The old inline formula charged FP × Rc × 0.4 — 2.5× the gazette figure.
    expect(fee.totalCharge).toBe(2_80_00_000);
    expect(fee.totalCharge).not.toBe(floorArea * 35_000 * 0.4);
  });
});
