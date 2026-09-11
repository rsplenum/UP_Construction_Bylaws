import { describe, expect, it } from 'vitest';
import {
  ENGINEER_STRUCTURAL_MAX_HEIGHT_M, ENGINEER_STRUCTURAL_MAX_PLOT_SQM,
  INSPECTING_ENGINEER_EXPERIENCE, SITE_ENGINEER_EXPERIENCE, SITE_ENGINEER_PER_SQM,
  STRUCTURAL_ENGINEER_EXPERIENCE, SUPERVISOR_MAX_HEIGHT_M, SUPERVISOR_MAX_PLOT_SQM,
  assessLicensing,
} from '../licensing';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT, ProjectState } from '../project';

const project = (over: Partial<ProjectState> = {}): ProjectState => ({ ...DEFAULT_PROJECT, ...over });
const base = {
  plotAreaSqm: 90, buildingHeightM: 7, builtUpAreaSqm: 120,
  isResidentialSingleUnit: true, isMultiStoreyedOrSpecial: false,
};

describe('Clause 14.2.4.2 — the supervisor ceiling', () => {
  it('lets a supervisor sign the smallest residential job', () => {
    expect(assessLicensing(base).supervisorMaySign).toBe(true);
  });

  it('stops at any one of the three limits, not all three together', () => {
    expect(assessLicensing({ ...base, plotAreaSqm: 101 }).supervisorMaySign).toBe(false);
    expect(assessLicensing({ ...base, buildingHeightM: 7.6 }).supervisorMaySign).toBe(false);
    expect(assessLicensing({ ...base, storeys: 3 }).supervisorMaySign).toBe(false);
    expect(assessLicensing({ ...base, isResidentialSingleUnit: false }).supervisorMaySign).toBe(false);
  });

  it('holds the gazette figures', () => {
    expect(SUPERVISOR_MAX_PLOT_SQM).toBe(100);
    expect(SUPERVISOR_MAX_HEIGHT_M).toBe(7.5);
  });
});

describe('Clause 14.2.2.2(b) — where an engineer stops and a structural engineer starts', () => {
  it('holds 500 m² and 16 m', () => {
    expect(ENGINEER_STRUCTURAL_MAX_PLOT_SQM).toBe(500);
    expect(ENGINEER_STRUCTURAL_MAX_HEIGHT_M).toBe(16);
  });

  it('calls for a structural engineer past either limit', () => {
    const big = assessLicensing({ ...base, plotAreaSqm: 600, buildingHeightM: 10 });
    expect(big.engineerMaySignStructure).toBe(false);
    expect(big.required.map((r) => r.role)).toContain('structural_engineer');

    const tall = assessLicensing({ ...base, plotAreaSqm: 300, buildingHeightM: 17 });
    expect(tall.engineerMaySignStructure).toBe(false);
  });

  it('leaves the structure with the engineer inside both limits', () => {
    const small = assessLicensing({ ...base, plotAreaSqm: 400, buildingHeightM: 15 });
    expect(small.engineerMaySignStructure).toBe(true);
    expect(small.required.map((r) => r.role)).toContain('engineer');
    expect(small.required.map((r) => r.role)).not.toContain('structural_engineer');
  });

  it('says so when a storey count could change the answer and is missing', () => {
    const a = assessLicensing({ ...base, plotAreaSqm: 400, buildingHeightM: 15 });
    expect(a.caveats.join(' ')).toMatch(/no storey count/);
  });
});

describe('Clause 14.4 — the experience tables, with their merged columns recovered', () => {
  it('gives every table three size bands', () => {
    for (const t of [STRUCTURAL_ENGINEER_EXPERIENCE, SITE_ENGINEER_EXPERIENCE, INSPECTING_ENGINEER_EXPERIENCE]) {
      expect(t).toHaveLength(3);
    }
  });

  it('carries a separate figure for zones 4–5 on the first two bands only', () => {
    // The bottom row of each table is one cell spanning all six zone columns.
    for (const t of [STRUCTURAL_ENGINEER_EXPERIENCE, SITE_ENGINEER_EXPERIENCE, INSPECTING_ENGINEER_EXPERIENCE]) {
      expect(t[0].zones4to5).not.toBeNull();
      expect(t[1].zones4to5).not.toBeNull();
      expect(t[2].zones4to5).toBeNull();
    }
  });

  it('leaves zone 6 empty everywhere, because the gazette does', () => {
    for (const t of [STRUCTURAL_ENGINEER_EXPERIENCE, SITE_ENGINEER_EXPERIENCE, INSPECTING_ENGINEER_EXPERIENCE]) {
      for (const band of t) expect(band.zone6).toBeNull();
    }
  });

  it('escalates experience with size, in both zone groups', () => {
    const years = (s: string) => Number(/(\d+)\s*year/.exec(s)?.[1] ?? 0);
    expect(years(STRUCTURAL_ENGINEER_EXPERIENCE[0].zones1to3)).toBe(3);
    expect(years(STRUCTURAL_ENGINEER_EXPERIENCE[1].zones1to3)).toBe(7);
    expect(years(STRUCTURAL_ENGINEER_EXPERIENCE[0].zones4to5!)).toBe(5);
    expect(years(STRUCTURAL_ENGINEER_EXPERIENCE[1].zones4to5!)).toBe(9);
  });

  it('bars a diploma site engineer above the first band', () => {
    expect(SITE_ENGINEER_EXPERIENCE[0].zones1to3).toMatch(/Diploma Civil Engr: 6 years/);
    expect(SITE_ENGINEER_EXPERIENCE[1].zones1to3).toMatch(/not authorised/);
    expect(SITE_ENGINEER_EXPERIENCE[2].zones1to3).toMatch(/not authorised/);
  });

  it('picks the band a project falls in', () => {
    expect(assessLicensing({ ...base, buildingHeightM: 10, builtUpAreaSqm: 2_000 })
      .experienceBand?.maxStoreys).toBe(4);
    expect(assessLicensing({ ...base, buildingHeightM: 20, builtUpAreaSqm: 4_000 })
      .experienceBand?.maxStoreys).toBe(8);
    expect(assessLicensing({ ...base, buildingHeightM: 30, builtUpAreaSqm: 9_000 })
      .experienceBand?.maxStoreys).toBeNull();
  });

  it('asks for one site engineer per 2500 m² supervised', () => {
    expect(SITE_ENGINEER_PER_SQM).toBe(2500);
    expect(assessLicensing({ ...base, builtUpAreaSqm: 100 }).siteEngineersRequired).toBe(1);
    expect(assessLicensing({ ...base, builtUpAreaSqm: 2_500 }).siteEngineersRequired).toBe(1);
    expect(assessLicensing({ ...base, builtUpAreaSqm: 2_501 }).siteEngineersRequired).toBe(2);
    expect(assessLicensing({ ...base, builtUpAreaSqm: 10_000 }).siteEngineersRequired).toBe(4);
  });
});

describe('the site-area roles', () => {
  it('calls for a landscape architect at 5 hectares, and at 2 in a metro city', () => {
    const roles = (o: Parameters<typeof assessLicensing>[0]) =>
      assessLicensing(o).required.map((r) => r.role);
    expect(roles({ ...base, siteAreaHa: 4 })).not.toContain('landscape_architect');
    expect(roles({ ...base, siteAreaHa: 5 })).toContain('landscape_architect');
    expect(roles({ ...base, siteAreaHa: 2, isMetroCity: true })).toContain('landscape_architect');
  });

  it('calls for a town planner past an architect\'s layout competence', () => {
    const roles = (ha: number) => assessLicensing({ ...base, siteAreaHa: ha }).required.map((r) => r.role);
    expect(roles(1.5)).not.toContain('town_planner');
    expect(roles(3)).toContain('town_planner');
  });

  it('flags the undefined "metro city" only where it would change the answer', () => {
    expect(assessLicensing({ ...base, siteAreaHa: 3 }).caveats.join(' ')).toMatch(/metro city/);
    expect(assessLicensing({ ...base, siteAreaHa: 8 }).caveats.join(' ')).not.toMatch(/metro city/);
  });
});

describe('the finding reaches the user', () => {
  it('offers the supervisor route on a small house', () => {
    const f = assessProject(project({ occupancy: 'res_single', plotArea: 90, buildingHeight: 7, proposedBuiltUpArea: 120 }))
      .findings.find((x) => x.id === 'licensed-persons');
    expect(f?.headline).toMatch(/supervisor can prepare and sign/);
  });

  it('names the professionals on a larger job', () => {
    const f = assessProject(project({ occupancy: 'res_group_housing', plotArea: 3_000, buildingHeight: 30, proposedBuiltUpArea: 9_000 }))
      .findings.find((x) => x.id === 'licensed-persons');
    expect(f?.headline).toMatch(/licensed professionals/);
    expect(f?.required).toMatch(/Structural Engineer/);
    // Band 3 is a single cell spanning every zone, so it carries no zone split to report.
    expect(f?.detail).toMatch(/in every seismic zone/);
  });

  it('reports the zone split on a project that falls in a banded row', () => {
    const f = assessProject(project({ occupancy: 'res_group_housing', plotArea: 1_200, buildingHeight: 20, proposedBuiltUpArea: 4_000 }))
      .findings.find((x) => x.id === 'licensed-persons');
    expect(f?.detail).toMatch(/seismic zones 1–3, rising to/);
    expect(f?.detail).toMatch(/zones 4 and 5/);
  });
});
