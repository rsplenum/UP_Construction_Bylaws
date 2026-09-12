import { describe, expect, it } from 'vitest';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT } from '../project';
import type { ProjectState } from '../project';

const HOUSE: Partial<ProjectState> = {
  occupancy: 'res_single', plotArea: 320, roadWidth: 12, buildingHeight: 12, circleRate: 35_000,
};
const at = (over: Partial<ProjectState>) => assessProject({ ...DEFAULT_PROJECT, ...HOUSE, ...over });
const amount = (a: ReturnType<typeof at>, label: string) =>
  a.ledger.lines.find((l) => l.label === label)?.amount ?? 0;

describe('the ledger states the whole bill', () => {
  it('opens with the entitlement that costs nothing', () => {
    const line = at({ proposedBuiltUpArea: 400 }).ledger.lines[0];
    expect(line.group).toBe('entitlement');
    expect(line.free).toBe(true);
    expect(line.amount).toBe(0);
  });

  it('orders it the way a bill is read — entitlement, then purchases, then charges', () => {
    const rank = { entitlement: 0, density: 1, charge: 2 } as const;
    const lines = at({ proposedBuiltUpArea: 630, masterPlanZone: 'R' }).ledger.lines;
    for (let i = 1; i < lines.length; i += 1) {
      expect(rank[lines[i].group]).toBeGreaterThanOrEqual(rank[lines[i - 1].group]);
    }
  });

  it('is the one number, so the headline and the bill cannot disagree', () => {
    // totalFees used to sum every finding's money. The moment two findings offered
    // alternative routes to the same excess that double counted, and the headline read
    // "About ₹6,31,815 in charges" beside a bill totalling ₹1,84,199.
    for (const over of [
      { proposedBuiltUpArea: 630 },
      { proposedBuiltUpArea: 630, buildingStage: 'built' as const },
      { proposedBuiltUpArea: 700, buildingStage: 'built' as const },
    ]) {
      const a = at(over);
      expect(Math.round(a.ledger.total), JSON.stringify(over)).toBe(Math.round(a.totalFees));
      const billed = a.ledger.lines
        .filter((l) => !l.perUnit && !l.supersededBy)
        .reduce((n, l) => n + l.amount, 0);
      expect(Math.round(a.totalFees), JSON.stringify(over)).toBe(Math.round(billed));
    }
  });

  it('lists a per-unit rate without summing it, because nothing counts the units', () => {
    const a = assessProject({
      ...DEFAULT_PROJECT, occupancy: 'res_group_housing', plotArea: 5_000,
      roadWidth: 24, proposedBuiltUpArea: 9_000, buildingHeight: 30, circleRate: 45_000,
    });
    const shelter = a.ledger.lines.find((l) => l.perUnit);
    expect(shelter).toBeDefined();
    expect(shelter!.amount).toBeGreaterThan(0);
    const summed = a.ledger.lines.reduce((n, l) => n + (l.perUnit ? 0 : l.amount), 0);
    expect(Math.round(a.ledger.total)).toBe(Math.round(summed));
  });

  it('never presents itself as the whole cost of approval', () => {
    const { excludes } = at({ proposedBuiltUpArea: 630 }).ledger;
    expect(excludes.length).toBeGreaterThan(0);
    expect(excludes.join(' ')).toMatch(/sanction fee/i);
  });
});

/**
 * Chapter 16, gazette page 163: "v. The authority shall not permit or compound any
 * construction beyond the limit of maximum permissible FAR" and "vi. Purchasable and
 * Premium Purchasable FAR shall be applicable in already constructed buildings submitted
 * for compounding." Floor area within the purchasable ceiling is bought, not compounded.
 *
 * Before B-057 the engine measured Item 3 from the BASE entitlement, so a house drawn
 * 24.9 m² over base was charged ₹1,84,199 to buy that floor area and ₹4,47,616 again to
 * regularise the very same square metres — 3.4 times the true bill.
 */
describe('the same floor area is never charged twice (B-057)', () => {
  it('charges only the purchase between the base and the ceiling', () => {
    for (const proposedBuiltUpArea of [610, 630, 640]) {
      const a = at({ proposedBuiltUpArea });
      expect(amount(a, 'Purchasable FAR'), `${proposedBuiltUpArea} m²`).toBeGreaterThan(0);
      expect(amount(a, 'Compounding fee'), `${proposedBuiltUpArea} m²`).toBe(0);
    }
  });

  it('charges nothing at all within the base entitlement', () => {
    const a = at({ proposedBuiltUpArea: 600 });
    expect(a.ledger.total).toBe(0);
  });

  it('still blocks a proposal beyond the ceiling', () => {
    const a = at({ proposedBuiltUpArea: 700 });
    expect(a.canBuild).toBe(false);
    expect(a.findings.some((f) => f.status === 'blocked' && f.nonNegotiable)).toBe(true);
  });
});
