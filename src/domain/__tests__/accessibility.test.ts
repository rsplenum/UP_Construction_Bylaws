import { describe, expect, it } from 'vitest';
import {
  ACCESSIBILITY_NAMED_GROUPS, ACCESSIBILITY_REQUIREMENTS, WHEELCHAIR_SIZE_MM,
  assessAccessibility,
} from '../accessibility';
import { OCCUPANCIES, OCCUPANCY_IDS } from '../occupancy';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT, ProjectState } from '../project';

const project = (over: Partial<ProjectState> = {}): ProjectState => ({ ...DEFAULT_PROJECT, ...over });
const forId = (id: typeof OCCUPANCY_IDS[number]) => {
  const o = OCCUPANCIES[id];
  return assessAccessibility({
    nbcGroup: o.nbcGroup, occupancyGroup: o.group,
    multiUnitHousing: o.multiUnitHousing, occupancyLabel: o.label,
  });
};

describe('Clause 12.2 — scope', () => {
  it('names NBC groups B to F and no others', () => {
    expect([...ACCESSIBILITY_NAMED_GROUPS]).toEqual(['B', 'C', 'D', 'E', 'F']);
  });

  it('excludes a single dwelling, in the clause\'s own words', () => {
    const a = forId('res_single');
    expect(a.mandatory).toBe(false);
    expect(a.basis).toBe('single_dwelling_excluded');
  });

  it('catches multi-units and group housing, which the clause names expressly', () => {
    expect(forId('res_multi').basis).toBe('multi_unit_housing');
    expect(forId('res_group_housing').basis).toBe('multi_unit_housing');
    expect(forId('res_multi').mandatory).toBe(true);
  });

  it('catches a hotel, which the Code files under group A', () => {
    // NBC 2016 puts hotels in group A-4. Reading Clause 12.2(a)'s exclusion off the NBC
    // group rather than the use would excuse every hotel in the state — the exclusion is
    // for "single unit residential dwellings", and a hotel is not one.
    const hotel = forId('com_hotel');
    expect(OCCUPANCIES.com_hotel.nbcGroup).toBe('A');
    expect(hotel.mandatory).toBe(true);
    expect(hotel.basis).toBe('named_group');
  });

  it('leaves industrial and storage unresolved rather than deciding them', () => {
    for (const id of ['ind_light', 'ind_general', 'ind_warehouse'] as const) {
      const a = forId(id);
      expect(a.mandatory, id).toBe(false);
      expect(a.dependsOnPublicUse, id).toBe(true);
      expect(a.caveats.join(' '), id).toMatch(/used by the public/);
    }
  });

  it('resolves every occupancy in the taxonomy one way or the other', () => {
    for (const id of OCCUPANCY_IDS) {
      const a = forId(id);
      expect(a.because.length, id).toBeGreaterThan(10);
      // An unresolved verdict must say so; a resolved one must not hedge.
      expect(a.mandatory && a.dependsOnPublicUse, id).toBe(false);
    }
  });

  it('sets no height, floor or area threshold anywhere', () => {
    // This is what separates Chapter 12 from 10 and 11: use alone decides it, so a
    // single-storey shop is caught where the fire and seismic triggers are not.
    const low = assessProject(project({ occupancy: 'com_shop', buildingHeight: 4, proposedBuiltUpArea: 80 }));
    expect(low.findings.find((f) => f.id === 'accessibility')?.status).toBe('attention');
    expect(low.findings.find((f) => f.id === 'seismic')?.status).not.toBe('attention');
  });
});

describe('the requirement checklist', () => {
  it('carries the wheelchair standard Clause 12.1(e) sets', () => {
    expect(WHEELCHAIR_SIZE_MM).toEqual({ length: 1050, width: 750 });
  });

  it('covers every area Clause 12.4 enumerates', () => {
    const areas = new Set(ACCESSIBILITY_REQUIREMENTS.map((r) => r.area));
    for (const a of ['Access path', 'Parking', 'Ramped approach', 'Stepped approach',
      'Entrance door', 'Corridor', 'Stairway', 'Lift', 'Toilet', 'Drinking water',
      'Refuge', 'Signage']) {
      expect(areas.has(a), a).toBe(true);
    }
  });

  it('cites a clause on every requirement', () => {
    for (const r of ACCESSIBILITY_REQUIREMENTS) {
      expect(r.clause, r.area).toMatch(/^12\./);
      expect(r.requirement.length).toBeGreaterThan(20);
    }
  });

  it('holds the accessible WC at 1750 mm, not the 1750 m the gazette prints', () => {
    const wc = ACCESSIBILITY_REQUIREMENTS.find((r) => r.clause === '12.4.5');
    expect(wc?.requirement).toContain('1500 mm × 1750 mm');
  });
});

describe('the finding reaches the user', () => {
  it('states the compounding consequence', () => {
    const f = assessProject(project({ occupancy: 'inst_education' }))
      .findings.find((x) => x.id === 'accessibility');
    expect(f?.detail).toMatch(/16\.1\.3\(xii\)/);
    expect(f?.detail).toMatch(/V-039/);
  });

  it('says nothing on a single dwelling', () => {
    const f = assessProject(project({ occupancy: 'res_single' }))
      .findings.find((x) => x.id === 'accessibility');
    expect(f).toBeUndefined();
  });

  it('surfaces the unresolved question on a factory', () => {
    const f = assessProject(project({ occupancy: 'ind_general' }))
      .findings.find((x) => x.id === 'accessibility');
    expect(f?.status).toBe('info');
    expect(f?.detail).toMatch(/used by the public/);
  });
});
