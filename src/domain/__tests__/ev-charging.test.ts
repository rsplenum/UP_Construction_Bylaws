import { describe, expect, it } from 'vitest';
import {
  CHARGER_SPECS, EV_SHARE_OF_PARKING, EV_SPACE_NORMS, MIN_FAST_CHARGER_KW,
  MIN_SLOW_CHARGER_KW, PCS_CHARGER_RATIOS, POWER_LOAD_SAFETY_FACTOR, assessEvCharging,
} from '../ev-charging';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT, ProjectState } from '../project';

const project = (over: Partial<ProjectState> = {}): ProjectState => ({ ...DEFAULT_PROJECT, ...over });

describe('Clause 17.1 — the EV share and the charger ratios are different quantities', () => {
  it('holds 20% and the 1.25 safety factor', () => {
    expect(EV_SHARE_OF_PARKING).toBe(0.20);
    expect(POWER_LOAD_SAFETY_FACTOR).toBe(1.25);
  });

  it('does not put one charging point on every EV bay', () => {
    // B-042: the engine used to read 20% of bays as 20% of chargers. Clause 17.1.2.1
    // serves three EVs from one slow charger and ten from one fast.
    const a = assessEvCharging({ parkingBays: 30, isPlottedHouse: false });
    expect(a.chargingBays).toBe(6);
    expect(a.slowChargers).toBe(2);
    expect(a.fastChargers).toBe(1);
    expect(a.slowChargers + a.fastChargers).toBeLessThan(a.chargingBays);
  });

  it('carries the four vehicle classes Clause 17.1.2.1 prints', () => {
    expect(PCS_CHARGER_RATIOS['4W']).toMatchObject({ evsPerSlowCharger: 3, evsPerFastCharger: 10 });
    expect(PCS_CHARGER_RATIOS['3W'].evsPerSlowCharger).toBe(2);
    expect(PCS_CHARGER_RATIOS['2W'].evsPerSlowCharger).toBe(2);
    // A bus has no slow-charging row: Clause 17.5.1.1 marks slow charging "N" for buses.
    expect(PCS_CHARGER_RATIOS.bus.evsPerSlowCharger).toBeNull();
    expect(PCS_CHARGER_RATIOS.bus.evsPerFastCharger).toBe(10);
  });

  it('rounds each charger class up, never down', () => {
    // 10 bays → 2 EVs → 1 slow (2/3 rounds up) and 1 fast (2/10 rounds up).
    const a = assessEvCharging({ parkingBays: 10, isPlottedHouse: false });
    expect(a.chargingBays).toBe(2);
    expect(a.slowChargers).toBe(1);
    expect(a.fastChargers).toBe(1);
  });

  it('computes the additional sanctioned load at the safety factor', () => {
    const a = assessEvCharging({ parkingBays: 200, isPlottedHouse: false });
    expect(a.slowChargers).toBe(14);
    expect(a.fastChargers).toBe(4);
    expect(a.additionalLoadKw).toBe((14 * MIN_SLOW_CHARGER_KW + 4 * MIN_FAST_CHARGER_KW) * 1.25);
  });

  it('says the load is a floor, not a specification', () => {
    const a = assessEvCharging({ parkingBays: 30, isPlottedHouse: false });
    expect(a.caveats.join(' ')).toMatch(/floor on the sanctioned load/);
  });

  it('flags the two- and three-wheeler limbs it cannot compute', () => {
    expect(assessEvCharging({ parkingBays: 30, isPlottedHouse: false }).caveats.join(' '))
      .toMatch(/V-050/);
  });
});

describe('Clause 17.1.1 — a plotted house is a Private CI, not a PCS', () => {
  it('asks for one slow charger and no fast charger', () => {
    const a = assessEvCharging({ parkingBays: 2, isPlottedHouse: true });
    expect(a.isPrivateSelfUse).toBe(true);
    expect(a.slowChargers).toBe(1);
    expect(a.fastChargers).toBe(0);
  });

  it('says the minimum PCS requirements do not reach it', () => {
    const a = assessEvCharging({ parkingBays: 2, isPlottedHouse: true });
    expect(a.caveats.join(' ')).toMatch(/non-commercial basis/);
  });

  it('does not scale with the parking count', () => {
    const small = assessEvCharging({ parkingBays: 1, isPlottedHouse: true });
    const large = assessEvCharging({ parkingBays: 8, isPlottedHouse: true });
    expect(small.slowChargers).toBe(large.slowChargers);
  });
});

describe('the reference tables', () => {
  it('carries all five charger models of Clause 17.8', () => {
    expect(CHARGER_SPECS).toHaveLength(5);
    expect(CHARGER_SPECS.filter((c) => c.speed === 'Fast').map((c) => c.model)).toEqual(['CCS', 'CHAdeMO']);
    expect(CHARGER_SPECS.find((c) => c.model === 'Bharat AC-001')?.connectorGuns).toBe(3);
  });

  it('carries the three space norms with their dimensions', () => {
    expect(EV_SPACE_NORMS).toHaveLength(3);
    expect(EV_SPACE_NORMS[1].area).toMatch(/15 m × 7 m/);
    expect(EV_SPACE_NORMS[2].area).toMatch(/5\.5 m × 2\.75 m/);
    expect(EV_SPACE_NORMS[0].spacing).toMatch(/3 km × 3 km/);
  });
});

describe('the parking finding carries it', () => {
  it('states bays, chargers and load on a commercial project', () => {
    const f = assessProject(project({ occupancy: 'com_complex', proposedBuiltUpArea: 3_000, parkingBaysProvided: 60 }))
      .findings.find((x) => x.id === 'parking');
    expect(f?.detail).toMatch(/slow charger/);
    expect(f?.detail).toMatch(/fast/);
    expect(f?.detail).toMatch(/kW of additional/);
    expect(f?.required).toMatch(/SC \+ /);
  });

  it('treats a single house as the private case', () => {
    const f = assessProject(project({ occupancy: 'res_single' })).findings.find((x) => x.id === 'parking');
    expect(f?.working).toMatch(/17\.1\.1\.1/);
  });
});
