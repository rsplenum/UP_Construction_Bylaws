/**
 * Chapter 14 — Qualifications and Competence of Licensed Technical Persons.
 *
 * Four pages that answer a question the app has never asked: **who is allowed to sign
 * this drawing?** Clause 14.1 makes it a gate, not advice — "Every building/ development
 * work for which permission is sought under the Code shall be planned, designed, and
 * supervised by licensed persons" — and the competence limits that follow are plain
 * numbers, so a project can be told which professionals it needs before anyone is engaged.
 *
 * The chapter matters to this app specifically because two of its three user types are an
 * architect and an LTP. Until now nothing told either of them where their own competence
 * runs out.
 *
 * ## The 14.4 tables, and how their columns were recovered
 *
 * The three experience tables at 14.4 are 19 columns wide with horizontally merged cells.
 * The flattened text puts each value in the first column of its span and blanks the rest,
 * which reads as though five of the six seismic zones carry no requirement at all — the
 * same failure that lost Clause 15.3 entirely (V-008).
 *
 * The spans were recovered from the cell bounding boxes in `chapter-14.json`, by testing
 * which zone headers fall inside which value cell:
 *
 *     Zone-1 x[239-279] ┐
 *     Zone-2 x[290-317] ├─ inside value cell x[233.4-359.4]   → first figure
 *     Zone-3 x[328-354] ┘
 *     Zone-4 x[365-402] ┐
 *     Zone-5 x[413-476] ┘─ inside value cell x[359.4-481.5]   → second figure
 *     Zone-6 x[487-517]  ─ inside cell x[481.5-522.4], which is EMPTY
 *
 * Zone-6's blank is a real, distinct cell rather than a merge artifact, and the bottom row
 * of each table is a single cell spanning all six zones. See V-046 on what "Zone-6" can
 * mean at all, given IS 1893 defines four.
 */

/** Clause 14.1's eight licensed roles, in the order the clause lists them. */
export type LicensedRole =
  | 'architect' | 'engineer' | 'structural_engineer' | 'supervisor'
  | 'town_planner' | 'landscape_architect' | 'urban_designer' | 'utility_service_engineer';

export const LICENSED_ROLE_LABEL: Readonly<Record<LicensedRole, string>> = {
  architect: 'Architect',
  engineer: 'Engineer',
  structural_engineer: 'Structural Engineer',
  supervisor: 'Supervisor',
  town_planner: 'Town Planner',
  landscape_architect: 'Landscape Architect',
  urban_designer: 'Urban Designer',
  utility_service_engineer: 'Utility Service Engineer',
};

/**
 * Clause 14.2.4.2(a) — a supervisor's ceiling: "residential buildings on plot up to 100 m2
 * and up to two storeys or 7.5 m in height".
 */
export const SUPERVISOR_MAX_PLOT_SQM = 100;
export const SUPERVISOR_MAX_STOREYS = 2;
export const SUPERVISOR_MAX_HEIGHT_M = 7.5;

/**
 * Clause 14.2.2.2(b) — an engineer may do "structural details and calculations of
 * buildings on plot up to 500 sq.m and up to 5 storeys or 16.0 m in height". Beyond any of
 * those, the structural design belongs to a structural engineer, who Clause 14.2.3.2 makes
 * competent for all buildings without limit.
 */
export const ENGINEER_STRUCTURAL_MAX_PLOT_SQM = 500;
export const ENGINEER_STRUCTURAL_MAX_STOREYS = 5;
export const ENGINEER_STRUCTURAL_MAX_HEIGHT_M = 16;

/**
 * Clause 14.2.6.2 (landscape architect) and 14.2.7.2 (urban designer), in hectares.
 * "Metro cities" halves the landscape threshold and is never defined anywhere in the
 * byelaws — see V-047.
 */
export const LANDSCAPE_ARCHITECT_MIN_HA = 5;
export const LANDSCAPE_ARCHITECT_MIN_HA_METRO = 2;
export const URBAN_DESIGNER_MIN_SITE_HA = 5;
export const URBAN_DESIGNER_MIN_CAMPUS_HA = 2;
/** Clause 14.2.1.2(c)-(d): an architect's own layout competence. */
export const ARCHITECT_LAYOUT_MAX_HA = 2;
export const ARCHITECT_LAYOUT_MAX_HA_METRO = 1;
/** Clause 14.2.5.2 Note — above this a landscape architect must be associated. */
export const TOWN_PLANNER_LANDSCAPE_ASSOC_HA = 5;

export interface ExperienceBand {
  /** As the gazette words it. */
  readonly scope: string;
  readonly maxStoreys: number | null;
  readonly maxHeightM: number | null;
  readonly maxAreaSqm: number | null;
  /** Requirement for seismic zones 1–3, as the merged span covers them. */
  readonly zones1to3: string;
  /** Requirement for zones 4–5. Null where the row spans every zone with one figure. */
  readonly zones4to5: string | null;
  /** Always null: the Zone-6 cell is empty in every row that has one. */
  readonly zone6: null;
}

const BAND_SCOPES = [
  { scope: 'up to a maximum 4 storeys or 12-meter height or 2500 sqm floor area',
    maxStoreys: 4, maxHeightM: 12, maxAreaSqm: 2500 },
  { scope: 'up to a maximum 8 storeys or 24-meter height or 5000 sqm covered area',
    maxStoreys: 8, maxHeightM: 24, maxAreaSqm: 5000 },
  { scope: 'more than 8 storeys or height more than 24 meters or covered area more than 5000 sqm',
    maxStoreys: null, maxHeightM: null, maxAreaSqm: null },
] as const;

/** Clause 14.4, table 1 — Chartered Structural Engineer. */
export const STRUCTURAL_ENGINEER_EXPERIENCE: readonly ExperienceBand[] = [
  { ...BAND_SCOPES[0], zones1to3: 'Graduate SE: 3 years; Post-graduate SE: 1 year',
    zones4to5: 'Graduate SE: 5 years; Post-graduate SE: 3 years', zone6: null },
  { ...BAND_SCOPES[1], zones1to3: 'Graduate SE: 7 years; Post-graduate SE: 5 years',
    zones4to5: 'Graduate SE: 9 years; Post-graduate SE: 7 years', zone6: null },
  { ...BAND_SCOPES[2],
    zones1to3: 'Graduate SE: 10 years; Post-graduate SE: 8 years. The structural design shall be '
      + 'countersigned by a Professor of Structural Engineering of IIT Roorkee or another specified '
      + 'technical institute.',
    zones4to5: null, zone6: null },
];

/** Clause 14.4, table 2 — Authorised Site Civil Engineer. */
export const SITE_ENGINEER_EXPERIENCE: readonly ExperienceBand[] = [
  { ...BAND_SCOPES[0], zones1to3: 'Diploma Civil Engr: 6 years; Graduate Civil Engr: 3 years',
    zones4to5: 'Diploma Civil Engr: 10 years; Graduate Civil Engr: 5 years', zone6: null },
  { ...BAND_SCOPES[1], zones1to3: 'Diploma Civil Engr: not authorised; Graduate Civil Engr: 6 years',
    zones4to5: 'Diploma Civil Engr: not authorised; Graduate Civil Engr: 10 years', zone6: null },
  { ...BAND_SCOPES[2], zones1to3: 'Diploma Civil Engr: not authorised; Graduate Civil Engr: 15 years',
    zones4to5: null, zone6: null },
];

/** Clause 14.4, table 3 — Inspecting Civil Engineer. */
export const INSPECTING_ENGINEER_EXPERIENCE: readonly ExperienceBand[] = [
  { ...BAND_SCOPES[0], zones1to3: 'Graduate Civil Engr: 5 years',
    zones4to5: 'Graduate Civil Engr: 7 years', zone6: null },
  { ...BAND_SCOPES[1], zones1to3: 'Graduate Civil Engr: 8 years',
    zones4to5: 'Graduate Civil Engr: 10 years', zone6: null },
  { ...BAND_SCOPES[2],
    zones1to3: 'Graduate Civil Engr: 15 years, plus a joint panel of two serving or retired experts, '
      + 'one at least of Chief Engineer level in a State or Central Government engineering department '
      + 'and the other in a specified technical field, or both at Professor of Civil Engineering level.',
    zones4to5: null, zone6: null },
];

/**
 * Clause 14.4 note to table 2: "One site engineer of specified qualification shall be
 * deployed to supervise every 2500 sqm."
 */
export const SITE_ENGINEER_PER_SQM = 2500;

export interface LicensingRequirement {
  readonly role: LicensedRole;
  readonly clause: string;
  readonly why: string;
  /** True where the byelaws require the role; false where it is offered as good practice. */
  readonly mandatory: boolean;
}

export interface LicensingAssessment {
  readonly required: readonly LicensingRequirement[];
  /** True where a supervisor may prepare and sign the whole building permit. */
  readonly supervisorMaySign: boolean;
  /** True where an engineer may do the structural design without a structural engineer. */
  readonly engineerMaySignStructure: boolean;
  /** How many site engineers Clause 14.4 asks for at this floor area. */
  readonly siteEngineersRequired: number;
  readonly experienceBand: ExperienceBand | null;
  readonly caveats: readonly string[];
  readonly clauseRef: string;
}

const bandFor = (table: readonly ExperienceBand[], input: {
  storeys?: number; heightM: number; floorAreaSqm: number;
}): ExperienceBand =>
  table.find((b) =>
    (b.maxStoreys === null || (input.storeys ?? 0) <= b.maxStoreys)
    && (b.maxHeightM === null || input.heightM <= b.maxHeightM)
    && (b.maxAreaSqm === null || input.floorAreaSqm <= b.maxAreaSqm)) ?? table[table.length - 1];

export function assessLicensing(input: {
  plotAreaSqm: number;
  buildingHeightM: number;
  builtUpAreaSqm: number;
  /** Floors including ground, where known. Chapter 14 states every limit both ways. */
  storeys?: number;
  isResidentialSingleUnit: boolean;
  /** True for a multi-storied or special building — Clause 14.2.1.2(a) and 14.2.8. */
  isMultiStoreyedOrSpecial: boolean;
  /** Site area in hectares, for the layout and landscape thresholds. */
  siteAreaHa?: number;
  /** Clause 14.2.6.2 halves the landscape threshold in a "metro city" and defines neither. */
  isMetroCity?: boolean;
}): LicensingAssessment {
  const plot = Math.max(0, Number(input.plotAreaSqm) || 0);
  const height = Math.max(0, Number(input.buildingHeightM) || 0);
  const area = Math.max(0, Number(input.builtUpAreaSqm) || 0);
  const required: LicensingRequirement[] = [];
  const caveats: string[] = [];

  // Clause 14.2.4.2(a). The clause says "up to 100 m2 AND up to two storeys or 7.5 m", and
  // exceeding any one of those takes the work out of a supervisor's competence — the
  // stricter and the only sensible reading of a competence ceiling.
  const supervisorMaySign = input.isResidentialSingleUnit
    && plot <= SUPERVISOR_MAX_PLOT_SQM
    && height <= SUPERVISOR_MAX_HEIGHT_M
    && (input.storeys === undefined || input.storeys <= SUPERVISOR_MAX_STOREYS);

  const engineerMaySignStructure = plot <= ENGINEER_STRUCTURAL_MAX_PLOT_SQM
    && height <= ENGINEER_STRUCTURAL_MAX_HEIGHT_M
    && (input.storeys === undefined || input.storeys <= ENGINEER_STRUCTURAL_MAX_STOREYS);

  if (input.storeys === undefined
    && (height <= SUPERVISOR_MAX_HEIGHT_M || height <= ENGINEER_STRUCTURAL_MAX_HEIGHT_M)) {
    caveats.push(
      'Chapter 14 states every competence limit as storeys OR height, and the project model '
      + 'carries no storey count. These verdicts use height alone, so a building within the '
      + 'height limit but over the storey limit will read as inside a competence it is outside.',
    );
  }

  required.push({
    role: 'architect', clause: 'Clause 14.2.1.2(a)', mandatory: true,
    why: 'All plans and information connected with the building permit, except the engineering '
      + 'services of a multi-storied or special building.',
  });

  if (!engineerMaySignStructure) {
    required.push({
      role: 'structural_engineer', clause: 'Clause 14.2.2.2(b) / 14.2.3.2', mandatory: true,
      why: `An engineer's structural competence stops at ${ENGINEER_STRUCTURAL_MAX_PLOT_SQM} m² of plot, `
        + `${ENGINEER_STRUCTURAL_MAX_STOREYS} storeys and ${ENGINEER_STRUCTURAL_MAX_HEIGHT_M} m. This `
        + 'project is past that, so the structural design, calculations and details belong to a '
        + 'licensed structural engineer.',
    });
  } else {
    required.push({
      role: 'engineer', clause: 'Clause 14.2.2.2(b)', mandatory: true,
      why: `Within ${ENGINEER_STRUCTURAL_MAX_PLOT_SQM} m² of plot and ${ENGINEER_STRUCTURAL_MAX_HEIGHT_M} m, `
        + 'a licensed engineer may prepare the structural details and calculations.',
    });
  }

  if (input.isMultiStoreyedOrSpecial) {
    required.push({
      role: 'utility_service_engineer', clause: 'Clause 14.2.8', mandatory: true,
      why: 'For a multi-storied or special building the building and plumbing services must be '
        + 'planned, designed and supervised by licensed mechanical, electrical and plumbing '
        + 'engineers qualified under NBC 2016 Parts 8 and 9.',
    });
  }

  const ha = input.siteAreaHa ?? plot / 10_000;
  const landscapeMin = input.isMetroCity ? LANDSCAPE_ARCHITECT_MIN_HA_METRO : LANDSCAPE_ARCHITECT_MIN_HA;
  if (ha >= landscapeMin) {
    required.push({
      role: 'landscape_architect', clause: 'Clause 14.2.6.2', mandatory: true,
      why: `Landscape design for a site of ${landscapeMin} hectares and above`
        + `${input.isMetroCity ? ' in a metro city' : ''}.`,
    });
  }
  if (ha > URBAN_DESIGNER_MIN_SITE_HA) {
    required.push({
      role: 'urban_designer', clause: 'Clause 14.2.7.2', mandatory: true,
      why: `Urban design work for land areas of more than ${URBAN_DESIGNER_MIN_SITE_HA} hectares.`,
    });
  }
  if (ha > ARCHITECT_LAYOUT_MAX_HA || (input.isMetroCity && ha > ARCHITECT_LAYOUT_MAX_HA_METRO)) {
    required.push({
      role: 'town_planner', clause: 'Clause 14.2.1.2(c) / 14.2.5.2', mandatory: true,
      why: `An architect's layout competence stops at ${input.isMetroCity ? ARCHITECT_LAYOUT_MAX_HA_METRO : ARCHITECT_LAYOUT_MAX_HA} `
        + 'hectares; beyond it the sub-division or layout plan belongs to a licensed town planner, '
        + 'who is competent for all areas.',
    });
  }
  if (input.isMetroCity === undefined && ha >= LANDSCAPE_ARCHITECT_MIN_HA_METRO && ha < LANDSCAPE_ARCHITECT_MIN_HA) {
    caveats.push(
      `At ${ha.toFixed(2)} hectares the landscape architect requirement turns on whether this is a `
      + '"metro city", a term Chapter 14 uses three times and the byelaws never define (V-047).',
    );
  }

  return {
    required,
    supervisorMaySign,
    engineerMaySignStructure,
    siteEngineersRequired: Math.max(1, Math.ceil(area / SITE_ENGINEER_PER_SQM)),
    experienceBand: bandFor(STRUCTURAL_ENGINEER_EXPERIENCE, {
      storeys: input.storeys, heightM: height, floorAreaSqm: area,
    }),
    caveats,
    clauseRef: 'Clause 14.1 and 14.2 (competence), 14.4 (experience in earthquake zones)',
  };
}
