import { describe, expect, it } from 'vitest';
import { assessProject } from '../findings';
import { BUILDING_STAGE_LABEL, DEFAULT_PROJECT, isExistingConstruction } from '../project';
import type { BuildingStage, ProjectState } from '../project';

const HOUSE: Partial<ProjectState> = {
  occupancy: 'res_single', plotArea: 320, roadWidth: 12, buildingHeight: 12, circleRate: 35_000,
};
// Base entitlement 605.1 m²; purchasable ceiling 640 m².
const at = (over: Partial<ProjectState>) => assessProject({ ...DEFAULT_PROJECT, ...HOUSE, ...over });
const line = (a: ReturnType<typeof at>, label: string) =>
  a.ledger.lines.find((l) => l.label === label);

const EXISTING: BuildingStage[] = ['under_construction', 'built'];

describe('the stage a building has reached', () => {
  it('defaults to a proposal, which is what someone opening the app is holding', () => {
    expect(DEFAULT_PROJECT.buildingStage).toBe('proposed');
  });

  it('names all three stages', () => {
    expect(Object.keys(BUILDING_STAGE_LABEL).sort())
      .toEqual(['built', 'proposed', 'under_construction']);
    expect(isExistingConstruction('proposed')).toBe(false);
    for (const stage of EXISTING) expect(isExistingConstruction(stage)).toBe(true);
  });
});

/**
 * Chapter 16 regularises construction already carried out. Before this field the engine
 * ran the schedule over every project and quoted a price to regularise deviations nobody
 * had committed (V-066).
 */
describe('a proposal has nothing to regularise', () => {
  it('quotes no compounding fee, however far over the entitlement it is drawn', () => {
    for (const proposedBuiltUpArea of [630, 700, 900]) {
      const a = at({ proposedBuiltUpArea, buildingStage: 'proposed' });
      expect(line(a, 'Compounding fee'), `${proposedBuiltUpArea} m²`).toBeUndefined();
      expect(a.findings.some((f) => f.id === 'compounding')).toBe(false);
    }
  });

  it('still sells the density that is lawfully purchasable', () => {
    const a = at({ proposedBuiltUpArea: 630, buildingStage: 'proposed' });
    expect(line(a, 'Purchasable FAR')!.amount).toBeGreaterThan(0);
    expect(a.canBuild).toBe(true);
  });

  it('still blocks a drawing beyond the ceiling, without offering a price', () => {
    const a = at({ proposedBuiltUpArea: 700, buildingStage: 'proposed' });
    expect(a.canBuild).toBe(false);
    expect(a.ledger.total).toBe(0);
  });
});

describe('a building that exists has two routes out of an excess', () => {
  it('prices both and counts only the cheaper (Clause 16.3.8(vi))', () => {
    for (const buildingStage of EXISTING) {
      const a = at({ proposedBuiltUpArea: 630, buildingStage });
      const buy = line(a, 'Purchasable FAR')!;
      const compound = line(a, 'Compounding fee')!;
      expect(buy, buildingStage).toBeDefined();
      expect(compound, buildingStage).toBeDefined();

      const [cheaper, dearer] = buy.amount <= compound.amount ? [buy, compound] : [compound, buy];
      expect(cheaper.supersededBy, buildingStage).toBeUndefined();
      expect(dearer.supersededBy, buildingStage).toBe(cheaper.label);
      // The dearer route is shown but not billed: the same m² is never charged twice.
      expect(Math.round(a.ledger.total), buildingStage).toBe(Math.round(cheaper.amount));
    }
  });
});

/**
 * "v. The authority shall not permit or compound any construction beyond the limit of
 * maximum permissible FAR. They shall ensure demolition and removal of extra construction
 * beyond maximum permissible FAR, if any, before considering the permission of purchasable
 * FAR." — Chapter 16, gazette page 163.
 */
describe('nothing above the maximum permissible FAR can be bought or compounded', () => {
  it('blocks it as non-negotiable rather than pricing it', () => {
    for (const buildingStage of EXISTING) {
      const a = at({ proposedBuiltUpArea: 700, buildingStage });
      const ceiling = a.findings.find((f) => f.id === 'compounding-ceiling');
      expect(ceiling, buildingStage).toBeDefined();
      expect(ceiling!.status).toBe('blocked');
      expect(ceiling!.nonNegotiable).toBe(true);
      expect(ceiling!.clause).toContain('16.3.8(v)');
    }
  });

  it('raises it only once the building is over the ceiling', () => {
    for (const buildingStage of EXISTING) {
      const a = at({ proposedBuiltUpArea: 640, buildingStage });
      expect(a.findings.some((f) => f.id === 'compounding-ceiling'), buildingStage).toBe(false);
    }
  });

  it('clips the compoundable excess at the ceiling, however far above it the building goes', () => {
    // Base 605.1, ceiling 640. At 640 the whole 34.9 m² excess is compoundable. At 700 and
    // at 900 it is still 34.9 m² — the rest is above the ceiling and has to come down, so
    // the fee is identical. Before the clip it grew with the overshoot, pricing floor area
    // that Clause 16.3.8(v) says cannot be compounded at any figure.
    const fees = [640, 700, 900].map((proposedBuiltUpArea) => {
      const a = at({ proposedBuiltUpArea, buildingStage: 'built' });
      const working = a.findings.find((f) => f.id === 'compounding')!.working!;
      expect(working, `${proposedBuiltUpArea} m²`).toContain('16.3.8 Item 3: 34.9 m²');
      return line(a, 'Compounding fee')!.amount;
    });
    expect(fees[1]).toBe(fees[0]);
    expect(fees[2]).toBe(fees[0]);
  });
});
