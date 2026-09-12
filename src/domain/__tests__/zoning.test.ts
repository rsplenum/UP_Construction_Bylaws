import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_ROWS, ZONES, ZONE_LABEL, activityFor, activityRow, assessZoning,
} from '../zoning';
import { OCCUPANCY_IDS } from '../occupancy';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT, ProjectState } from '../project';

const project = (over: Partial<ProjectState> = {}): ProjectState => ({ ...DEFAULT_PROJECT, ...over });

describe('the Clause 15.3 matrix is loaded and reachable', () => {
  it('carries all 53 activities across all 16 zones', () => {
    expect(ACTIVITY_ROWS).toHaveLength(53);
    expect(ZONES).toHaveLength(16);
    expect(Object.keys(ZONE_LABEL)).toHaveLength(16);
    const verdicts = ACTIVITY_ROWS.flatMap((r) => Object.values(r.zones));
    expect(verdicts).toHaveLength(847);
  });

  it('maps every occupancy but mixed use to a row', () => {
    // B-048: the retired activityId scheme resolved none of them.
    const unmapped = OCCUPANCY_IDS.filter(
      (id) => !activityFor({ occupancy: id, areaType: 'built_up', plotAreaSqm: 500 }));
    expect(unmapped).toEqual(['mixed_use']);
  });

  it('leaves mixed use unmapped because it is a zone here, not an activity', () => {
    expect(activityFor({ occupancy: 'mixed_use', areaType: 'built_up', plotAreaSqm: 500 })).toBeUndefined();
    expect(ZONE_LABEL.MU).toBe('Mixed Use');
  });

  it('resolves every mapped occupancy against every zone', () => {
    for (const id of OCCUPANCY_IDS) {
      if (id === 'mixed_use') continue;
      for (const zone of ZONES) {
        const a = assessZoning({ occupancy: id, areaType: 'built_up', plotAreaSqm: 500, zone });
        expect(a, `${id} in ${zone}`).toBeDefined();
        expect(['permitted', 'prohibited', 'conditional']).toContain(a!.verdict);
      }
    }
  });

  it('reads a different row for a built-up area and a new layout', () => {
    expect(activityFor({ occupancy: 'res_single', areaType: 'built_up', plotAreaSqm: 200 })?.activity).toBe('1.1(a)');
    expect(activityFor({ occupancy: 'res_single', areaType: 'non_built_up', plotAreaSqm: 200 })?.activity).toBe('1.1(b)');
  });

  it('splits shops at the 100 m² the gazette prints', () => {
    expect(activityFor({ occupancy: 'com_shop', areaType: 'built_up', plotAreaSqm: 100 })?.activity).toBe('2.1');
    expect(activityFor({ occupancy: 'com_shop', areaType: 'built_up', plotAreaSqm: 101 })?.activity).toBe('2.2');
  });

  it('takes the stricter row where the split needs a fact we lack, and names the other', () => {
    // Hotels split at 20 rooms (V-011); no room count, so 2.6 is applied.
    const m = activityFor({ occupancy: 'com_hotel', areaType: 'built_up', plotAreaSqm: 500 });
    expect(m?.activity).toBe('2.6');
    expect(m?.alternative?.activity).toBe('2.5');
    expect(m?.alternative?.turnsOn).toMatch(/room count/);
  });

  it('points every mapped activity at a row that exists', () => {
    for (const id of OCCUPANCY_IDS) {
      const m = activityFor({ occupancy: id, areaType: 'built_up', plotAreaSqm: 500 });
      if (!m) continue;
      expect(activityRow(m.activity), `${id} → ${m.activity}`).toBeDefined();
      if (m.alternative) expect(activityRow(m.alternative.activity)).toBeDefined();
    }
  });

  it('reports a conditional cell with its condition number', () => {
    // 1.1(a) in BU is green carrying "9".
    const a = assessZoning({ occupancy: 'res_single', areaType: 'built_up', plotAreaSqm: 200, zone: 'BU' });
    expect(a?.verdict).toBe('conditional');
    expect(a?.condition).toBe('9');
    expect(a?.caveats.join(' ')).toMatch(/condition 9/);
  });
});

describe('the finding answers the first question', () => {
  it('blocks a use the zone prohibits, and says no fee cures it', () => {
    // Large-scale industry is permitted only in Light Industry.
    const f = assessProject(project({ occupancy: 'ind_general', masterPlanZone: 'R', plotArea: 2_000, roadWidth: 24 }))
      .findings.find((x) => x.id === 'use-zone')!;
    expect(f.status).toBe('blocked');
    expect(f.nonNegotiable).toBe(true);
    expect(f.detail).toMatch(/No fee, setback or design change/);
  });

  it('clears the same use in the zone that permits it', () => {
    const f = assessProject(project({ occupancy: 'ind_general', masterPlanZone: 'LI', plotArea: 2_000, roadWidth: 24 }))
      .findings.find((x) => x.id === 'use-zone')!;
    expect(f.status).toBe('ok');
  });

  it('says the question is unanswered rather than guessing when no zone is set', () => {
    const f = assessProject(project()).findings.find((x) => x.id === 'use-zone')!;
    expect(f.status).toBe('attention');
    expect(f.headline).toMatch(/unanswered/);
    expect(DEFAULT_PROJECT.masterPlanZone).toBe('unknown');
  });

  it('cites the gazette page the row is printed on', () => {
    const f = assessProject(project({ occupancy: 'res_single', masterPlanZone: 'R' }))
      .findings.find((x) => x.id === 'use-zone')!;
    expect(f.clause).toMatch(/Clause 15\.3 \(gazette p\.1[45][0-9]\)/);
  });
});
