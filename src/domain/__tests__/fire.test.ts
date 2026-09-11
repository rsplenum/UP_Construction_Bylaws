import { describe, expect, it } from 'vitest';
import {
  FIRE_CERTIFICATE_HEIGHT_M,
  FIRE_MINIMUM_STANDARDS,
  MIXED_OCCUPANCY_AREA_SQM,
  MULTI_STOREY_STILT_HEIGHT_M,
  NBC_GROUP_LABEL,
  SPECIAL_BUILDING_GROUPS,
  assessFireSafety,
  isSpecialBuildingGroup,
} from '../fire';
import { OCCUPANCIES, OccupancyId } from '../occupancy';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT, ProjectState } from '../project';

const fire = (id: OccupancyId, buildingHeight: number, builtUpArea: number) =>
  assessFireSafety({ occupancy: OCCUPANCIES[id], buildingHeight, builtUpArea });

const project = (over: Partial<ProjectState> = {}): ProjectState => ({ ...DEFAULT_PROJECT, ...over });

/**
 * Clause 10.1.3 — "following buildings shall obtain 'Fire Safety Certificate' from Fire
 * and Emergency Services".
 */
describe('Clause 10.1.3 — who must hold a Fire Safety Certificate', () => {
  // (a) "Multi-storied buildings having more than 15 meters height."
  describe('(a) the height limb', () => {
    it('is exclusive at 15 m, as the gazette words it', () => {
      expect(fire('res_single', 15, 400).certificateRequired).toBe(false);
      expect(fire('res_single', 15.01, 400).triggers.map((t) => t.limb)).toContain('height');
    });

    it('catches a residential building above 15 m, which no other limb reaches', () => {
      const a = fire('res_group_housing', 24, 9000);
      expect(a.certificateRequired).toBe(true);
      expect(a.triggers.map((t) => t.limb)).toEqual(['height']);
    });

    it('records the stilted reading of Clause 1.2(m) between 15 m and 17.5 m', () => {
      expect(fire('res_group_housing', 16, 9000).caveats.join(' ')).toMatch(/17\.5 m including one/);
      // Above the stilted threshold both readings agree, so there is nothing to record.
      expect(fire('res_group_housing', 21, 9000).caveats.join(' ')).not.toMatch(/1\.2\(m\)/);
      expect(MULTI_STOREY_STILT_HEIGHT_M).toBe(17.5);
      expect(FIRE_CERTIFICATE_HEIGHT_M).toBe(15);
    });
  });

  // (b) "Special buildings like educational, institutional, assembly, business,
  // mercantile, industrial, storage and hazardous buildings as defined in National
  // Building Code as amended from time to time."
  describe('(b) the special-building limb, which carries no area threshold', () => {
    it('names exactly the eight NBC groups B to J, and not residential', () => {
      expect([...SPECIAL_BUILDING_GROUPS]).toEqual(['B', 'C', 'D', 'E', 'F', 'G', 'H', 'J']);
      expect(isSpecialBuildingGroup('A')).toBe(false);
      expect(NBC_GROUP_LABEL.A).toBe('Residential');
    });

    // B-028. The engine used to gate every non-residential use at 500 sqm, so a small
    // school, shop, office or workshop was told it needed no fire clearance at all.
    it.each<[OccupancyId, string]>([
      ['inst_education', 'B'],
      ['inst_health', 'C'],
      ['inst_assembly', 'D'],
      ['office', 'E'],
      ['com_shop', 'F'],
      ['ind_light', 'G'],
      ['ind_warehouse', 'H'],
    ])('catches %s at 300 m² and 10 m — far below the old 500 m² gate', (id, group) => {
      const a = fire(id, 10, 300);
      expect(a.certificateRequired).toBe(true);
      expect(a.triggers.map((t) => t.limb)).toContain('special_occupancy');
      expect(OCCUPANCIES[id].nbcGroup).toBe(group);
    });

    it('does not reach residential, which Clause 10.1.3(b) does not name', () => {
      for (const id of ['res_single', 'res_multi', 'res_group_housing'] as const) {
        expect(fire(id, 12, 2000).triggers.map((t) => t.limb)).not.toContain('special_occupancy');
      }
    });
  });

  // (c) "Mixed occupancies with any of the aforesaid occupancies having more than 500
  // square meter covered area."
  describe('(c) the mixed-occupancy limb, which is the only one with an area', () => {
    it('is exclusive at 500 m²', () => {
      expect(fire('mixed_use', 12, 500).certificateRequired).toBe(false);
      expect(fire('mixed_use', 12, 500.01).triggers.map((t) => t.limb)).toEqual(['mixed_occupancy']);
      expect(MIXED_OCCUPANCY_AREA_SQM).toBe(500);
    });

    it('does not also fire the special-building limb, which would double-count', () => {
      expect(fire('mixed_use', 12, 900).triggers.map((t) => t.limb)).toEqual(['mixed_occupancy']);
    });
  });

  // Clause 1.2(q) names hotels expressly; NBC puts them in group A, so Clause 10.1.3(b)
  // never reaches them.
  describe('the Clause 1.2(q) limb, for uses Clause 10.1.3(b) does not list', () => {
    it('catches a hotel above 500 m² and leaves one below it alone', () => {
      expect(fire('com_hotel', 12, 400).certificateRequired).toBe(false);
      const big = fire('com_hotel', 12, 600);
      expect(big.triggers.map((t) => t.limb)).toEqual(['special_definition']);
      expect(big.triggers[0].clause).toBe('Clause 1.2(q)');
    });
  });
});

/**
 * V-034 — the two definitions disagree, and the engine must say so rather than pick
 * silently.
 */
describe('V-034 — Clause 10.1.3(b) against the Clause 1.2(q) definition', () => {
  it('requires a certificate for a 400 m² school and flags that 1.2(q) would not', () => {
    const a = fire('inst_education', 10, 400);
    expect(a.certificateRequired).toBe(true);
    expect(a.narrowReadingRequires).toBe(false);
    expect(a.readingsDisagree).toBe(true);
    expect(a.caveats.join(' ')).toMatch(/Clause 1\.2\(q\)/);
  });

  it('says nothing where the two readings agree', () => {
    const a = fire('ind_general', 10, 900);
    expect(a.certificateRequired).toBe(true);
    expect(a.narrowReadingRequires).toBe(true);
    expect(a.readingsDisagree).toBe(false);
  });
});

/**
 * V-037 — the completion-stage NOC has its own trigger, and half of it is a fact the
 * project description does not carry.
 */
describe('V-037 — the completion-stage fire NOC', () => {
  it('is settled by height at 15 m and above, where Clause 10.1.3 is exclusive', () => {
    expect(fire('res_single', 15, 400).completionStage).toMatchObject({
      required: true, dependsOnFloorCount: false,
    });
    expect(fire('res_single', 15, 400).certificateRequired).toBe(false);
  });

  it('says the floor count is unknown rather than assuming four floors or fewer', () => {
    const a = fire('res_group_housing', 14, 3000);
    expect(a.completionStage.dependsOnFloorCount).toBe(true);
    expect(a.caveats.join(' ')).toMatch(/more than four floors/);
  });
});

describe('Clause 10.2.1 — the twenty-one minimum standards', () => {
  it('carries all twenty-one, in the gazette order', () => {
    expect(FIRE_MINIMUM_STANDARDS).toHaveLength(21);
    expect(FIRE_MINIMUM_STANDARDS[0]).toBe('Access to building');
    expect(FIRE_MINIMUM_STANDARDS[16]).toMatch(/MOEFA/);
    expect(FIRE_MINIMUM_STANDARDS[20]).toMatch(/Safety certificate of lift/);
  });
});

describe('every occupancy carries an NBC group', () => {
  it.each(Object.values(OCCUPANCIES))('$id', (occ) => {
    expect(NBC_GROUP_LABEL[occ.nbcGroup]).toBeDefined();
  });
});

/**
 * What the assessment actually shows a user. B-028 is only worth anything if it reaches
 * the findings list.
 */
describe('the fire findings', () => {
  it('raises the certificate on a 300 m² school, where the engine used to say nothing', () => {
    const a = assessProject(project({
      occupancy: 'inst_education', plotArea: 1200, roadWidth: 12,
      buildingHeight: 10, proposedBuiltUpArea: 300,
    }));
    const f = a.findings.find((x) => x.id === 'fire-noc')!;
    expect(f.status).toBe('attention');
    expect(f.clause).toContain('10.1.3(b)');
    expect(f.detail).toMatch(/occupancy certificate shall not be issued/i);
  });

  it('tells a small house what is not triggered, instead of staying silent', () => {
    const a = assessProject(project({ occupancy: 'res_single', buildingHeight: 12 }));
    const f = a.findings.find((x) => x.id === 'fire-noc')!;
    expect(f.status).toBe('info');
    expect(f.headline).toMatch(/more than four floors/);
  });

  // V-033. The 12 m figure is not in the gazette; Chapter 10, which is where a fire
  // access width would be stated, states none.
  it('no longer blocks a high-rise on an unsourced 12 m road rule', () => {
    const a = assessProject(project({
      occupancy: 'res_group_housing', plotArea: 4000, plotFrontage: 60, roadWidth: 9,
      buildingHeight: 24, proposedBuiltUpArea: 8000,
    }));
    const f = a.findings.find((x) => x.id === 'high-rise-road')!;
    expect(f.status).toBe('attention');
    expect(f.nonNegotiable).toBeUndefined();
    expect(f.detail).toMatch(/6\.0 m around the building/);
  });
});
