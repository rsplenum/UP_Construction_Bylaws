import { describe, expect, it } from 'vitest';
import { resolvePlotRoads } from '../roads';
import { planAtFloors, studyAtFloors, studyEnvelope } from '../envelope';
import { pricePlans } from '../plan-pricing';
import { resolveBaseFar } from '../far';

/**
 * The floor picker used to change the verdict sentence and leave both site plans drawing
 * the plot's best floor count. These pin the plan the drawings are handed.
 */
const study = (plotAreaSqm = 300) => studyEnvelope({
  occupancy: 'res_single', plotAreaSqm, frontageM: 12, depthM: 25,
  roads: resolvePlotRoads({ front: 12 }), areaType: 'built_up',
});

describe('planAtFloors', () => {
  it('draws the floor count that was asked for, not the best one', () => {
    const s = study();
    const best = s.standard.floors;
    expect(best).toBeGreaterThan(1);
    const plan = planAtFloors(s, best - 1, 'standard');
    expect(plan).not.toBeNull();
    expect(plan!.floors).toBe(best - 1);
  });

  it('hands back the study’s own plan when the choice is the best one', () => {
    const s = study();
    expect(planAtFloors(s, s.standard.floors, 'standard')).toBe(s.standard);
    expect(planAtFloors(s, s.maximum.floors, 'maximum')).toBe(s.maximum);
  });

  it('never credits an as-of-right plan with purchased density', () => {
    // The two ladders are different: every rung of `ladder` is clamped to the purchasable
    // ceiling. Crossing them would show a reader floor area they have not bought.
    const s = study();
    const floors = Math.max(1, s.standard.floors - 1);
    const asOfRight = planAtFloors(s, floors, 'standard');
    const bought = planAtFloors(s, floors, 'maximum');
    expect(asOfRight!.floorAreaSqm).toBeLessThanOrEqual(bought!.floorAreaSqm + 1e-9);
    expect(asOfRight!.farEntitlementSqm).toBeLessThanOrEqual(bought!.farEntitlementSqm + 1e-9);
  });

  it('blames the reader and not the gazette for a floor count they chose', () => {
    const s = study();
    const plan = planAtFloors(s, s.standard.floors - 1, 'standard')!;
    expect(plan.binding).toBe('choice');
    expect(plan.bindingNote).toContain('You asked for');
    expect(plan.bindingNote).toContain('Nothing in the byelaws stops you');
  });

  it('counts what the choice leaves unused', () => {
    const s = study();
    const plan = planAtFloors(s, s.standard.floors - 1, 'standard')!;
    expect(plan.strandedSqm).toBeGreaterThan(0);
    expect(plan.floorAreaSqm).toBeLessThan(s.standard.floorAreaSqm);
    expect(plan.floorAreaSqm + plan.strandedSqm)
      .toBeCloseTo(plan.farEntitlementSqm, 1);
  });

  it('keeps the setbacks and footprint of the rung it drew', () => {
    const s = study();
    const floors = s.standard.floors - 1;
    const rung = s.standardLadder.find((r) => r.floors === floors)!;
    const plan = planAtFloors(s, floors, 'standard')!;
    expect(plan.setbacks).toBe(rung.setbacks);
    expect(plan.footprintSqm).toBeCloseTo(rung.footprintSqm, 2);
    expect(plan.heightM).toBe(rung.heightM);
  });

  it('returns null for a floor count that was never evaluated or is refused', () => {
    const s = study();
    expect(planAtFloors(s, 99, 'standard')).toBeNull();
    const refused = s.ladder.find((r) => r.refusedBecause);
    if (refused) expect(planAtFloors(s, refused.floors, 'maximum')).toBeNull();
  });

  it('exposes an as-of-right ladder that is never above the purchased one', () => {
    const s = study();
    expect(s.standardLadder.length).toBeGreaterThan(0);
    for (const rung of s.standardLadder) {
      const bought = s.ladder.find((r) => r.floors === rung.floors);
      if (bought) expect(rung.usableSqm).toBeLessThanOrEqual(bought.usableSqm + 1e-9);
    }
  });
});

describe('studyAtFloors', () => {
  it('hands back the same object when the choice is the plot’s best', () => {
    const s = study();
    expect(studyAtFloors(s, s.standard.floors)).toBe(s);
  });

  it('returns null for a floor count that was never evaluated', () => {
    expect(studyAtFloors(study(), 99)).toBeNull();
  });

  it('recomputes the compoundable margin against the plan actually chosen', () => {
    const s = study();
    const fewer = studyAtFloors(s, s.standard.floors - 1)!;
    expect(fewer.compoundable).not.toBe(s.compoundable);
    expect(fewer.maximum.floors).toBe(s.standard.floors - 1);
  });

  it('finds FAR headroom for compounding that the best plan has none of', () => {
    // This is the whole point of recomputing rather than suppressing. Clause 16.3.8(v)
    // bars compounding above the maximum permissible FAR, so a plan that already reaches
    // that ceiling can regularise no floor area at any price. Drop a floor and the
    // headroom reappears — the same plot answers "None" at its best and a real figure
    // below it, and that is the byelaws' own arithmetic, not a rescaling.
    const s = study();
    expect(s.compoundable.farHeadroomExhausted).toBe(true);
    expect(s.compoundable.extraFarSqm).toBeCloseTo(0, 6);

    const fewer = studyAtFloors(s, s.standard.floors - 1)!;
    expect(fewer.compoundable.farHeadroomExhausted).toBe(false);
    expect(fewer.compoundable.extraFarSqm).toBeGreaterThan(0);
  });

  it('never lets compounding carry a plan above the maximum permissible FAR', () => {
    // 16.3.8(v), at every rung, not just the best one.
    const s = study();
    for (const rung of s.standardLadder.filter((r) => !r.refusedBecause)) {
      const at = studyAtFloors(s, rung.floors);
      if (!at) continue;
      expect(at.maximum.floorAreaSqm + at.compoundable.extraFarSqm)
        .toBeLessThanOrEqual(s.maxPermissibleBuiltUpAreaSqm + 1e-6);
    }
  });

  it('carries the ladders, the plot and the caveats through unchanged', () => {
    const s = study();
    const fewer = studyAtFloors(s, s.standard.floors - 1)!;
    expect(fewer.ladder).toBe(s.ladder);
    expect(fewer.standardLadder).toBe(s.standardLadder);
    expect(fewer.plotAreaSqm).toBe(s.plotAreaSqm);
    expect(fewer.caveats).toBe(s.caveats);
    expect(fewer.maxPermissibleBuiltUpAreaSqm).toBe(s.maxPermissibleBuiltUpAreaSqm);
  });
});

describe('the fees follow the plan that is drawn', () => {
  const price = (s: ReturnType<typeof study>) => pricePlans({
    study: s, occupancy: 'res_single', areaType: 'built_up', landRate: 35_000,
    baseFar: resolveBaseFar({
      occupancy: 'res_single', plotArea: s.plotAreaSqm,
      roadWidth: s.roads.governingRoadWidthM, areaType: 'built_up',
    }).effectiveBaseFar || 0,
  });

  it('charges nothing for density a smaller plan does not buy', () => {
    const s = study();
    const fewer = studyAtFloors(s, s.standard.floors - 1)!;
    // At the lower floor count the geometry binds before either entitlement does, so the
    // two plans build the same area and there is no density to buy.
    expect(fewer.maximum.floorAreaSqm - fewer.standard.floorAreaSqm).toBeLessThan(0.5);
    expect(price(fewer).maximum.total).toBe(0);
    expect(price(s).maximum.total).toBeGreaterThan(0);
  });

  it('prices the compounding of the chosen plan, not of the best one', () => {
    const s = study();
    const fewer = studyAtFloors(s, s.standard.floors - 1)!;
    const a = price(s).compounding?.total ?? 0;
    const b = price(fewer).compounding?.total ?? 0;
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(0);
    expect(b).not.toBeCloseTo(a, 0);
  });
});
