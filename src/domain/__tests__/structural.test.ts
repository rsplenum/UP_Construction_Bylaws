import { describe, expect, it } from 'vitest';
import {
  EARTHQUAKE_HEIGHT_M, EARTHQUAKE_FLOORS_INCLUDING_GROUND, INFRASTRUCTURE_GROUND_COVER_SQM,
  PEER_REVIEW_HEIGHT_M, PERIODIC_AUDIT_FIRST_YEAR, PERIODIC_AUDIT_INTERVAL_YEARS,
  SEISMIC_RETROFIT_STANDARDS, SDBR_PARTS, assessStructuralSafety,
} from '../structural';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT, ProjectState } from '../project';

const project = (over: Partial<ProjectState> = {}): ProjectState => ({ ...DEFAULT_PROJECT, ...over });

describe('Clause 11.8.1 — when seismic design is mandatory', () => {
  it('holds the three figures the gazette prints, twice', () => {
    expect(EARTHQUAKE_HEIGHT_M).toBe(12);
    expect(EARTHQUAKE_FLOORS_INCLUDING_GROUND).toBe(3);
    expect(INFRASTRUCTURE_GROUND_COVER_SQM).toBe(500);
  });

  it('is exclusive at 12 m, not inclusive', () => {
    expect(assessStructuralSafety({ buildingHeight: 12 }).earthquakeMeasuresMandatory).toBe(false);
    expect(assessStructuralSafety({ buildingHeight: 12.01 }).earthquakeMeasuresMandatory).toBe(true);
  });

  it('catches the ordinary stilt-plus-three-floors house at 15 m', () => {
    const a = assessStructuralSafety({ buildingHeight: 15 });
    expect(a.earthquakeMeasuresMandatory).toBe(true);
    expect(a.triggers.map((t) => t.limb)).toEqual(['height']);
  });

  it('fires on the floor limb where height alone would not', () => {
    // Four floors at 2.75 m stands at 11 m — under the height limb, over the floor limb.
    const a = assessStructuralSafety({ buildingHeight: 11, floorsIncludingGround: 4 });
    expect(a.earthquakeMeasuresMandatory).toBe(true);
    expect(a.triggers.map((t) => t.limb)).toEqual(['floors']);
    expect(a.dependsOnFloorCount).toBe(false);
  });

  it('says unresolved rather than no when the floor count is unknown and height has not settled it', () => {
    const a = assessStructuralSafety({ buildingHeight: 11 });
    expect(a.earthquakeMeasuresMandatory).toBe(false);
    expect(a.dependsOnFloorCount).toBe(true);
    expect(a.caveats.join(' ')).toMatch(/cannot be derived from height/);
  });

  it('stops depending on the floor count once height settles it', () => {
    expect(assessStructuralSafety({ buildingHeight: 20 }).dependsOnFloorCount).toBe(false);
  });

  it('evaluates the infrastructure limb only on ground cover, never on built-up area', () => {
    const known = assessStructuralSafety({
      buildingHeight: 8, isImportantInfrastructure: true, groundCoverSqm: 600,
    });
    expect(known.triggers.map((t) => t.limb)).toEqual(['infrastructure_ground_cover']);

    const unknown = assessStructuralSafety({ buildingHeight: 8, isImportantInfrastructure: true });
    expect(unknown.earthquakeMeasuresMandatory).toBe(false);
    expect(unknown.caveats.join(' ')).toMatch(/V-036/);
  });
});

describe('the Clause 16.1.3(vi) reading', () => {
  it('does not treat every building over 12 m as non-compoundable', () => {
    // The literal reading would empty Chapter 16's own ">15-meter height" column. The
    // caveat states the narrower reading wherever the requirement binds.
    const a = assessStructuralSafety({ buildingHeight: 20 });
    expect(a.earthquakeMeasuresMandatory).toBe(true);
    expect(a.caveats.join(' ')).toMatch(/violates the mandatory/);
    expect(a.caveats.join(' ')).toMatch(/>15-meter height/);
  });

  it('leaves the compounding assessment itself unbarred', () => {
    const a = assessProject(project({ buildingHeight: 20, proposedBuiltUpArea: 900 }));
    const seismic = a.findings.find((f) => f.id === 'seismic');
    expect(seismic?.status).toBe('attention');
    expect(a.findings.some((f) => f.headline.includes('cannot be compounded'))).toBe(false);
  });
});

describe('Clauses 11.3 and 11.5 — review and re-review', () => {
  it('requires peer review only above 50 m', () => {
    expect(PEER_REVIEW_HEIGHT_M).toBe(50);
    expect(assessStructuralSafety({ buildingHeight: 50 }).peerReviewRequired).toBe(false);
    expect(assessStructuralSafety({ buildingHeight: 51 }).peerReviewRequired).toBe(true);
  });

  it('runs the audit cycle at year 10 and every 5 years after', () => {
    expect(PERIODIC_AUDIT_FIRST_YEAR).toBe(10);
    expect(PERIODIC_AUDIT_INTERVAL_YEARS).toBe(5);
    const a = assessStructuralSafety({ buildingHeight: 30, isHighRiseOrSpecial: true });
    expect(a.periodicAudit).toEqual({
      required: true, firstAuditYear: 10, thereafterEveryYears: 5, expertEngineerOnly: false,
    });
  });

  it('reserves the audit for an expert engineer above 50 m', () => {
    expect(assessStructuralSafety({ buildingHeight: 60, isHighRiseOrSpecial: true })
      .periodicAudit.expertEngineerOnly).toBe(true);
  });
});

describe('the reference tables', () => {
  it('carries all four rows of the Clause 11.6 retrofit table', () => {
    expect(SEISMIC_RETROFIT_STANDARDS).toHaveLength(4);
    expect(SEISMIC_RETROFIT_STANDARDS.map((r) => r.standard.split(' ')[1]))
      .toEqual(['13935', '15988', '13828', '13827']);
  });

  it('carries the four SDBR parts', () => {
    expect(SDBR_PARTS).toHaveLength(4);
    expect(SDBR_PARTS[0].applies).toBe('Always');
  });
});

describe('the seismic finding reaches the user', () => {
  it('appears on a 15 m building and names the certificates', () => {
    const f = assessProject(project({ buildingHeight: 15 })).findings.find((x) => x.id === 'seismic');
    expect(f?.headline).toMatch(/Earthquake-resistant design is mandatory/);
    expect(f?.detail).toMatch(/Appendix-9/);
    expect(f?.detail).toMatch(/Appendix-10/);
  });

  it('says "unless" rather than "no" on a low building of unknown floor count', () => {
    const f = assessProject(project({ buildingHeight: 10 })).findings.find((x) => x.id === 'seismic');
    expect(f?.status).toBe('info');
    expect(f?.headline).toMatch(/unless this runs to more than three floors/);
  });

  it('mentions peer review only where it applies', () => {
    const tall = assessProject(project({ buildingHeight: 60, proposedBuiltUpArea: 2_000 }))
      .findings.find((x) => x.id === 'seismic');
    expect(tall?.detail).toMatch(/peer reviewed/);
    const short = assessProject(project({ buildingHeight: 15 })).findings.find((x) => x.id === 'seismic');
    expect(short?.detail).not.toMatch(/peer reviewed/);
  });
});
