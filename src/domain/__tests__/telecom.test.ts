import { describe, expect, it } from 'vitest';
import {
  IBS_NOC_FEE, IBS_SPACE_CONDITIONS, IBS_SUBMISSION_ITEMS, MDF_CONDUIT_MIN_DIAMETER_MM,
  MDF_ROOM_LENGTH_WIDTH_RATIO, TELECOM_ROOM_LARGE_BUILDING, TELECOM_ROOM_SMALL_BUILDING,
  TELECOM_TABLE_SWITCH_SQM, TERM_CELL_STAGES, TSP_SPACE_PER_PROVIDER_M, assessTelecom,
} from '../telecom';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT, ProjectState } from '../project';

const project = (over: Partial<ProjectState> = {}): ProjectState => ({ ...DEFAULT_PROJECT, ...over });

describe('Clause 18.5.1.2(n) — the two telecom-room tables', () => {
  it('switches tables at 465 m² of built-up area', () => {
    expect(TELECOM_TABLE_SWITCH_SQM).toBe(465);
    expect(assessTelecom({ builtUpAreaSqm: 465 }).table).toBe('small_building');
    expect(assessTelecom({ builtUpAreaSqm: 466 }).table).toBe('large_building');
  });

  it('gives a small building a cabinet or a shallow room', () => {
    expect(assessTelecom({ builtUpAreaSqm: 80 }).roomProvision).toMatch(/cabinets/);
    expect(assessTelecom({ builtUpAreaSqm: 300 }).roomProvision).toMatch(/Shallow Room/);
  });

  it('scales the room with coverage in a large building', () => {
    expect(assessTelecom({ builtUpAreaSqm: 600 }).roomProvision).toBe('Telecom Room 3.0 m × 3.4 m');
    expect(assessTelecom({ builtUpAreaSqm: 5_000 }).roomProvision).toMatch(/additional Telecom Room/);
  });

  it('carries both tables as printed, with the open-ended row last', () => {
    expect(TELECOM_ROOM_LARGE_BUILDING).toHaveLength(3);
    expect(TELECOM_ROOM_LARGE_BUILDING[2].upToSqm).toBeNull();
    expect(TELECOM_ROOM_SMALL_BUILDING).toHaveLength(2);
    expect(TELECOM_ROOM_SMALL_BUILDING.map((r) => r.upToSqm)).toEqual([93, 465]);
  });

  it('says the tables are keyed on coverage, not on built-up area', () => {
    expect(assessTelecom({ builtUpAreaSqm: 600 }).caveats.join(' ')).toMatch(/V-051/);
  });
});

describe('Clause 18.5.1.1 — the IBS NOC', () => {
  it('gates the Occupancy-cum-Completion Certificate', () => {
    expect(assessTelecom({ builtUpAreaSqm: 600 }).gatesOccupancyCertificate).toBe(true);
  });

  it('is needed at both plan approval and completion', () => {
    expect(TERM_CELL_STAGES.map((s) => s.stage)).toEqual(['Plan approval', 'Completion']);
  });

  it('warns that the applicant must apply separately', () => {
    // Clause 18.5.1.1(b): the Local Authority liaises, but "Separate communication from the
    // applicant shall be needed to secure the IBS NOC."
    expect(TERM_CELL_STAGES[0].what).toMatch(/separate communication/i);
  });

  it('requires a consultant-certified service plan and a sharing undertaking', () => {
    expect(IBS_SUBMISSION_ITEMS).toHaveLength(2);
    expect(IBS_SUBMISSION_ITEMS[0]).toMatch(/certified by a credible telecom networking hardware consultant/);
    expect(IBS_SUBMISSION_ITEMS[1]).toMatch(/available for sharing/);
  });

  it('carries no fee', () => {
    expect(IBS_NOC_FEE).toBe(0);
  });
});

describe('the dimensions Chapter 18 states in its own right', () => {
  it('reserves 1.2 m × 1.83 m per service provider beside the entrance facility', () => {
    expect(TSP_SPACE_PER_PROVIDER_M).toEqual({ width: 1.2, depth: 1.83 });
  });

  it('holds the 100 mm conduit and the MDF room ratio', () => {
    expect(MDF_CONDUIT_MIN_DIAMETER_MM).toBe(100);
    expect(MDF_ROOM_LENGTH_WIDTH_RATIO).toEqual({ min: 1, max: 2 });
  });

  it('carries the four siting conditions on the IBS space', () => {
    expect(IBS_SPACE_CONDITIONS).toHaveLength(4);
    expect(IBS_SPACE_CONDITIONS[0]).toMatch(/flooding/);
  });

  it('says the rest defers to NBC 2016 Part 8 Section 6', () => {
    expect(assessTelecom({ builtUpAreaSqm: 600 }).caveats.join(' ')).toMatch(/NBC 2016 Part 8 Section 6/);
  });
});

describe('the finding reaches the user', () => {
  it('appears on every project and names the TERM cell', () => {
    const f = assessProject(project()).findings.find((x) => x.id === 'telecom-cti');
    expect(f?.headline).toMatch(/TERM cell/);
    expect(f?.detail).toMatch(/Occupancy-cum-Completion/);
    expect(f?.detail).toMatch(/no fee is charged/);
  });

  it('states the room provision for the project in hand', () => {
    const f = assessProject(project({ proposedBuiltUpArea: 600 })).findings.find((x) => x.id === 'telecom-cti');
    expect(f?.required).toMatch(/3\.0 m × 3\.4 m/);
  });
});
