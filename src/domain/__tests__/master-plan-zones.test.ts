import { describe, expect, it } from 'vitest';
import {
  MASTER_PLAN_AUTHORITIES, MASTER_PLAN_ZONE_ROWS, authorityNamed, localZoneNames,
  zoneForLocalName, zonesOfAuthority,
} from '../master-plan-zones';
import { ZONES } from '../zoning';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT, ProjectState } from '../project';

const project = (over: Partial<ProjectState> = {}): ProjectState => ({ ...DEFAULT_PROJECT, ...over });

describe('Appendix-15 translates the byelaws\' codes into a master plan\'s own words', () => {
  it('covers 22 development authorities', () => {
    expect(MASTER_PLAN_AUTHORITIES).toHaveLength(22);
  });

  it('maps its rows 1–16 onto the Clause 15.3 columns, in order', () => {
    const mapped = MASTER_PLAN_ZONE_ROWS.filter((r) => r.zone).map((r) => r.zone);
    expect(mapped).toEqual([...ZONES]);
    // Row 17 is "Additional Land use", printed empty throughout.
    expect(MASTER_PLAN_ZONE_ROWS.find((r) => r.serial === 17)?.zone).toBeNull();
  });

  it('reads a name off a real master plan back to a column', () => {
    expect(zoneForLocalName('Muzaffarnagar', 'Ganna Shodh Kendra')).toBe('PSP');
    expect(zoneForLocalName('Agra', 'Bazaar Street')).toBe('C-1');
    expect(zoneForLocalName('Bareilly', 'C2- Wholesale / Storage')).toBe('C-2');
  });

  it('re-joins a zone name the page broke across two lines', () => {
    // Gorakhpur's C-2 cell wraps at "…Storage/godown" + "/Warehousing". Four cells in the
    // whole appendix wrap; every other line is a separate zone name.
    expect(zoneForLocalName('Gorakhpur', 'C3- Wholesale / Storage/godown/Warehousing')).toBe('C-2');
    expect(zoneForLocalName('Gorakhpur', 'Transport centre/Bus terminal/ Truck terminal')).toBe('TT');
  });

  it('does not fuse names a plan keeps apart', () => {
    // Agra lists four distinct commercial zones under C-1; joining them would be wrong.
    const agra = localZoneNames('Agra', 'C-1');
    expect(agra.state).toBe('named');
    expect(agra.state === 'named' && agra.names).toHaveLength(4);
    expect(agra.state === 'named' && agra.names).toContain('Bazaar Street');
  });

  it('distinguishes NIL from a blank cell, because the gazette does', () => {
    // Ayodhya prints NIL for Commercial-2; Hapur's Small Industries cell is simply empty.
    expect(localZoneNames('Ayodhya', 'C-2')).toEqual({ state: 'nil' });
    expect(localZoneNames('Hapur', 'SI')).toEqual({ state: 'blank' });
  });

  it('says when an authority is outside the appendix rather than guessing', () => {
    // Lucknow, Noida and Ghaziabad are absent — the capital and the two largest NCR
    // authorities (V-056).
    for (const city of ['Lucknow', 'Noida', 'Ghaziabad']) {
      expect(localZoneNames(city, 'R'), city).toEqual({ state: 'authority-not-listed' });
      expect(zonesOfAuthority(city), city).toEqual([]);
    }
    expect(authorityNamed('Lucknow')).toBeUndefined();
  });

  it('matches a city onto a hyphenated authority name', () => {
    expect(authorityNamed('Varanasi')).toBe('Varanasi-1');
    expect(authorityNamed('mathura')).toBe('Mathura-Vrindavan');
  });

  it('gives every listed authority a workable vocabulary', () => {
    for (const a of MASTER_PLAN_AUTHORITIES) {
      expect(zonesOfAuthority(a).length, a).toBeGreaterThan(8);
    }
  });
});

describe('the finding puts the plan\'s own words in front of the user', () => {
  it('names the local zone when the authority is listed', () => {
    const f = assessProject(project({
      cityName: 'Agra', masterPlanZone: 'C-1', occupancy: 'com_shop', plotArea: 200, roadWidth: 18,
    })).findings.find((x) => x.id === 'zone-local-name');
    expect(f?.status).toBe('info');
    expect(f?.headline).toMatch(/Bazaar Street/);
  });

  it('warns when the authority has no such zone at all', () => {
    const f = assessProject(project({
      cityName: 'Ayodhya', masterPlanZone: 'C-2', occupancy: 'com_shop', plotArea: 200, roadWidth: 18,
    })).findings.find((x) => x.id === 'zone-local-name');
    expect(f?.status).toBe('attention');
    expect(f?.headline).toMatch(/no Commercial/);
  });

  it('offers the authority\'s own vocabulary when no zone is set', () => {
    const f = assessProject(project({ cityName: 'Kanpur' })).findings.find((x) => x.id === 'use-zone');
    expect(f?.detail).toMatch(/Kanpur master plan the zones are named/);
    expect(f?.detail).toMatch(/Appendix-15/);
  });

  it('falls back to the codes for an authority the appendix omits', () => {
    const f = assessProject(project({ cityName: 'Lucknow' })).findings.find((x) => x.id === 'use-zone');
    expect(f?.detail).not.toMatch(/master plan the zones are named/);
    expect(f?.detail).toMatch(/BU Built-up/);
  });
});
