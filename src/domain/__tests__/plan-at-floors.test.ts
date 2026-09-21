import { describe, expect, it } from 'vitest';
import { resolvePlotRoads } from '../roads';
import { planAtFloors, studyEnvelope } from '../envelope';

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
