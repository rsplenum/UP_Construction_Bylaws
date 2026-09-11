/**
 * Chapter 10 — Fire Prevention and Life Safety.
 *
 * The chapter is three pages long and carries no tables, which makes it look like the
 * cheapest chapter in the byelaws to read. It is not. It states the trigger for the one
 * clearance that can stop a project outright, and the gazette states that trigger **four
 * times, in four different forms**, in four different places. Nothing in the document
 * reconciles them.
 *
 *   Clause 10.1.3          multi-storied >15 m; special buildings (NBC groups B–J), no
 *                          area threshold; mixed occupancies >500 m² covered area.
 *   Chapter 2 NOC table    identical wording, as the Fire Department's row.
 *   Clause 1.2(q)          a *defined term* — "Special Building" — over a different list
 *                          (assembly, industrial, wholesale, hotels, hostels, hazardous,
 *                          mixed, centrally air-conditioned) and gated at 500 m².
 *   Chapter 2 completion   >4 floors OR ≥15 m, a third list again, gated on *ground
 *                          coverage* >500 m².
 *
 * So "is a Fire Safety Certificate required?" has no single answer in the source. This
 * module takes the union — a building is caught if any of the gazette's own statements
 * catches it — and reports which limb fired, because the requirement is a *requirement*
 * and the failure mode of getting it wrong is asymmetric: a project told it needs a
 * clearance it does not need loses a fortnight, and a project told it does not need one
 * it does need is non-compoundable for ever under Clause 16.3.2(vii).
 *
 * The narrower Clause 1.2(q) reading is computed alongside and surfaced wherever the two
 * disagree, per the standing rule that an ambiguity is resolved to the stricter reading
 * and the alternative is put in front of the user rather than discarded (V-034).
 */

import type { OccupancyDefinition } from './occupancy';

/**
 * NBC 2016 occupancy groups. Clause 10.1.3(b) names eight of them — "educational,
 * institutional, assembly, business, mercantile, industrial, storage and hazardous
 * buildings as defined in National Building Code" — which is groups B to J in the Code's
 * own order. Group A, residential, is the one it does not name.
 */
export type NbcGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J';

export const NBC_GROUP_LABEL: Readonly<Record<NbcGroup, string>> = {
  A: 'Residential',
  B: 'Educational',
  C: 'Institutional',
  D: 'Assembly',
  E: 'Business',
  F: 'Mercantile',
  G: 'Industrial',
  H: 'Storage',
  J: 'Hazardous',
};

/** The eight groups Clause 10.1.3(b) lists. Group A is deliberately absent. */
export const SPECIAL_BUILDING_GROUPS: readonly NbcGroup[] = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'];

export function isSpecialBuildingGroup(group: NbcGroup): boolean {
  return SPECIAL_BUILDING_GROUPS.includes(group);
}

/**
 * Clause 10.1.3(a) reads "Multi-storied buildings having more than 15 meters height",
 * and Clause 1.2(m) defines a multi-storeyed building as one "above four storeys, and/or
 * a building exceeding 15 meters or more in height (without stilt) and 17.5 meters
 * (including stilt)".
 *
 * Read together, a stilted building would not reach the definition until 17.5 m, which
 * would lift the certificate threshold by 2.5 m on exactly the buildings that most often
 * have a stilt. Clause 10.1.3(a) states its own figure, so the flat 15 m governs here —
 * the stricter of the two — and the divergence is recorded as V-035.
 */
export const FIRE_CERTIFICATE_HEIGHT_M = 15;

/** Clause 1.2(m)'s stilted threshold, held so the alternative reading can be shown. */
export const MULTI_STOREY_STILT_HEIGHT_M = 17.5;

/** Clause 10.1.3(c) — the only place Chapter 10 attaches an area to the trigger. */
export const MIXED_OCCUPANCY_AREA_SQM = 500;

/** Which limb of Clause 10.1.3 caught the building. */
export type FireCertificateLimb =
  /** 10.1.3(a) — more than 15 m. */
  | 'height'
  /** 10.1.3(b) — an NBC group B–J occupancy, at any covered area. */
  | 'special_occupancy'
  /** 10.1.3(c) — mixed occupancy above 500 m² covered area. */
  | 'mixed_occupancy'
  /**
   * 1.2(q) — a use the gazette's own *definition* of "Special Building" names but
   * Clause 10.1.3(b) does not: wholesale establishments, hotels, hostels, and centrally
   * air-conditioned buildings. A hotel is NBC group A-4, so 10.1.3(b) never reaches it,
   * yet 1.2(q) names hotels expressly and the rest of the byelaws impose special-building
   * duties on it — two staircases at Clause 3.3.1.16, for one. Gated at 500 m².
   */
  | 'special_definition';

export interface FireCertificateTrigger {
  readonly limb: FireCertificateLimb;
  readonly clause: string;
  /** Why this building is caught, in the gazette's own terms. */
  readonly because: string;
}

/**
 * The completion-stage fire NOC, listed among the records to be deposited with the notice
 * of completion. Its trigger is NOT Clause 10.1.3's: it reads "buildings more than four
 * floors or 15-meters and more high", which is a floor count Chapter 10 does not use and
 * an inclusive 15 m where Chapter 10 is exclusive.
 *
 * The floor count is not in the project model and cannot be derived from height — a
 * four-storey block and a five-storey block can both stand at 14 m. So this reports
 * `unknown` rather than guessing, per the rule against asserting a fact the app cannot
 * know.
 */
export interface CompletionStageNoc {
  /** True where height alone settles it. */
  readonly required: boolean;
  /** True where only the floor count could settle it, and the app cannot see one. */
  readonly dependsOnFloorCount: boolean;
  readonly clause: string;
}

export interface FireSafetyInput {
  readonly occupancy: OccupancyDefinition;
  /** Metres, to terrace level. */
  readonly buildingHeight: number;
  /**
   * Square metres. Clause 10.1.3(c) says "covered area"; Clause 1.2 defines that as the
   * area "above the plinth level over which a building is constructed" — a footprint —
   * while "built-up area" is "the total covered area on all floors". The project model
   * carries only the all-floors figure, which is the larger of the two and so triggers
   * the certificate earlier. Stricter, and recorded as V-036.
   */
  readonly builtUpArea: number;
}

export interface FireSafetyAssessment {
  readonly certificateRequired: boolean;
  /** Every limb that fired, in clause order. */
  readonly triggers: readonly FireCertificateTrigger[];
  /** What the narrower Clause 1.2(q) definition alone would have concluded. */
  readonly narrowReadingRequires: boolean;
  /** True where the two readings disagree, so the finding must show both. */
  readonly readingsDisagree: boolean;
  readonly completionStage: CompletionStageNoc;
  readonly caveats: readonly string[];
}

/**
 * Clause 1.2(q)'s list, which is not Clause 10.1.3(b)'s list. It names uses rather than
 * NBC groups — "wholesale establishments", "hotels", "hostels", "centrally
 * air-conditioned buildings" — so it cannot be derived from the group and is held
 * explicitly.
 *
 * Note what it leaves out that 10.1.3(b) includes: educational, institutional, business
 * and retail mercantile. A 400 m² school is a special building under Chapter 10 and not
 * one under Chapter 1.
 */
const SPECIAL_UNDER_1_2Q: ReadonlySet<string> = new Set([
  'inst_assembly',
  'ind_light',
  'ind_general',
  'ind_warehouse',
  'com_hotel',
  'mixed_use',
]);

/** Clause 1.2(q) gates its whole list on "total built up area exceeding 500 sq m". */
const SPECIAL_1_2Q_AREA_SQM = 500;

export function assessFireSafety(input: FireSafetyInput): FireSafetyAssessment {
  const { occupancy, buildingHeight, builtUpArea } = input;
  const triggers: FireCertificateTrigger[] = [];
  const caveats: string[] = [];

  if (buildingHeight > FIRE_CERTIFICATE_HEIGHT_M) {
    triggers.push({
      limb: 'height',
      clause: 'Clause 10.1.3(a)',
      because: `${buildingHeight} m is above the 15 m multi-storeyed threshold.`,
    });
  }

  const group = occupancy.nbcGroup;
  if (occupancy.id !== 'mixed_use' && isSpecialBuildingGroup(group)) {
    triggers.push({
      limb: 'special_occupancy',
      clause: 'Clause 10.1.3(b)',
      because:
        `${occupancy.label} is an NBC group ${group} (${NBC_GROUP_LABEL[group]}) occupancy, ` +
        'which Clause 10.1.3(b) names with no area threshold.',
    });
  }

  if (occupancy.id === 'mixed_use' && builtUpArea > MIXED_OCCUPANCY_AREA_SQM) {
    triggers.push({
      limb: 'mixed_occupancy',
      clause: 'Clause 10.1.3(c)',
      because: `A mixed occupancy above ${MIXED_OCCUPANCY_AREA_SQM} m² covered area.`,
    });
  }

  const caughtBy1_2q = SPECIAL_UNDER_1_2Q.has(occupancy.id) && builtUpArea > SPECIAL_1_2Q_AREA_SQM;
  if (caughtBy1_2q && !triggers.some((t) => t.limb === 'special_occupancy' || t.limb === 'mixed_occupancy')) {
    triggers.push({
      limb: 'special_definition',
      clause: 'Clause 1.2(q)',
      because:
        `${occupancy.label} is a "Special Building" as Clause 1.2(q) defines the term, at ` +
        `${builtUpArea} m² built-up area. Clause 10.1.3(b) does not reach it — a hotel is NBC ` +
        'group A — but the gazette\'s own definition does.',
    });
  }

  const narrowReadingRequires = buildingHeight > FIRE_CERTIFICATE_HEIGHT_M || caughtBy1_2q;

  const certificateRequired = triggers.length > 0;
  const readingsDisagree = certificateRequired !== narrowReadingRequires;

  if (readingsDisagree && certificateRequired) {
    caveats.push(
      'Clause 1.2(q) defines "Special Building" over a shorter list — assembly, industrial, ' +
      'wholesale, hotels, hostels, hazardous and centrally air-conditioned buildings — and gates ' +
      'it at 500 m². On that reading alone this building would not need a certificate. ' +
      'Clause 10.1.3, which is the clause that imposes the requirement, is applied here.',
    );
  }

  // Clause 1.2(m) — the stilted reading of "multi-storeyed", where it would change
  // the answer.
  if (
    buildingHeight > FIRE_CERTIFICATE_HEIGHT_M &&
    buildingHeight <= MULTI_STOREY_STILT_HEIGHT_M
  ) {
    caveats.push(
      `Clause 1.2(m) defines a multi-storeyed building as exceeding 15 m without a stilt and ` +
      `17.5 m including one. At ${buildingHeight} m a stilted building would fall outside that ` +
      `definition, though Clause 10.1.3(a) states a flat 15 m. The stricter 15 m is applied.`,
    );
  }

  const heightSettlesCompletion = buildingHeight >= FIRE_CERTIFICATE_HEIGHT_M;
  const completionStage: CompletionStageNoc = {
    required: heightSettlesCompletion,
    dependsOnFloorCount: !heightSettlesCompletion,
    clause: 'Clause 2.9.3.2 (records deposited with the notice of completion)',
  };

  if (completionStage.dependsOnFloorCount) {
    caveats.push(
      'The completion-stage fire NOC is required for "buildings more than four floors or ' +
      '15-meters and more high". The floor count is not part of the project description, so a ' +
      'building of more than four floors below 15 m would need one and is not detected here.',
    );
  }

  return {
    certificateRequired,
    triggers,
    narrowReadingRequires,
    readingsDisagree,
    completionStage,
    caveats,
  };
}

/**
 * Clause 10.2.1 — the twenty-one minimum standards, verbatim and in the gazette's order.
 *
 * The Note that closes the list is the operative part and is held with it: these are
 * *not* a checklist every building must satisfy. "Provided that these norms shall not be
 * applicable to all type of buildings requiring fire safety certificate, rather the
 * requirement shall be assessed purely based on covered area, building height and type of
 * occupancy". Which of the twenty-one apply is determined by the NBC and the UP Fire and
 * Emergency Services Rules 2024 — neither of which is in this repository — so the engine
 * lists them and does not pretend to select among them.
 */
export const FIRE_MINIMUM_STANDARDS: readonly string[] = [
  'Access to building',
  'Number, width, type and arrangement of exits.',
  'Smoke management system in controlled environment building.',
  'Fire extinguishers.',
  'First-aid hose reels',
  'Automatic fire detection and alarming system',
  'Public address system',
  'Automatic sprinkler system',
  'Internal hydrants and yard hydrants',
  'Pumping arrangements,',
  'Captive water storage for fire fighting',
  'Exit signage,',
  'Fire Lifts',
  'Standby power supply',
  'Refuge area.',
  'Special fire protection systems for protection of special risks, if applicable.',
  'Manually Operated Electronic Fire Alarm system (MOEFA).',
  'Electrical safety audit report issued by electrical safety department or contractor authorized by state government.',
  'Certificate for installation of fire protection system by Qualified Agency as applicable.',
  'Appointment letter of fire safety officer, if required.',
  'Safety certificate of lift issued by the competent authority, if required.',
];

export const FIRE_MINIMUM_STANDARDS_NOTE =
  'These norms are not applicable to every building requiring a fire safety certificate. ' +
  'Which of them apply is assessed on covered area, building height and occupancy, as ' +
  'detailed in the byelaws, the National Building Code and the applicable Act and Rules ' +
  '(Clause 10.2.1 Note).';

/**
 * Clause 10.2.1's closing paragraph, which is the only width-free statement of fire
 * access in the byelaws and the reason the engine no longer blocks a project on a 12 m
 * road it cannot source (V-033).
 */
export const FIRE_ACCESS_DEFINITION =
  'Access to the building shall mean the availability of means of approach to each floor ' +
  'of the building or to nearest point of the building in case of emergency-situation for ' +
  'firefighting and/or rescue operations at least from one side like-road or permanent ' +
  'open space etc. (Clause 10.2.1)';

/**
 * Clause 10.3.1 — how an existing building is assessed, which is not how a new one is.
 *
 * This matters to Chapter 16 rather than to a new sanction: a compounding application is
 * by definition about a building that already stands, and Clause 16.3.2(vii) makes a
 * missing fire NOC non-compoundable. Clause 10.3.1 says which fire requirements an
 * existing building must actually meet, and for two of the three classes the answer is
 * markedly less than for a new building.
 */
export type ExistingBuildingClass = 'prior_noc' | 'approved_without_certificate' | 'unapproved';

export interface ExistingBuildingTreatment {
  readonly id: ExistingBuildingClass;
  readonly label: string;
  /** What the gazette relaxes for this class. */
  readonly relaxation: string;
  readonly clause: string;
}

export const EXISTING_BUILDING_TREATMENTS: Readonly<Record<ExistingBuildingClass, ExistingBuildingTreatment>> = {
  prior_noc: {
    id: 'prior_noc',
    label: 'Approved, and a fire NOC was taken at the time',
    relaxation:
      'The installed system is evaluated against the standards and Government Orders in force ' +
      'when that NOC was issued — not today\'s. Access and exit are assessed as per the ' +
      'arrangements in the approved map.',
    clause: 'Clause 10.3.1(1)',
  },
  approved_without_certificate: {
    id: 'approved_without_certificate',
    label: 'Approved when a fire safety certificate was not mandatory',
    relaxation:
      'Structural changes are not mandatory, especially for access and exit. Other fire ' +
      'prevention and life safety requirements are ensured case to case.',
    clause: 'Clause 10.3.1(2)',
  },
  unapproved: {
    id: 'unapproved',
    label: 'Old construction whose map was never approved',
    relaxation:
      'Access road, setback and fire escape are not mandatory. All other requirements of the ' +
      'UP Fire and Emergency Services Rules 2024 are ensured case to case.',
    clause: 'Clause 10.3.1(3)',
  },
};

/**
 * Clause 10.1.2 — the consequence that makes all of this bite.
 *
 * The certificate is not a form filed alongside the others: without it the occupancy
 * certificate cannot issue, and a building without an occupancy certificate cannot
 * lawfully be occupied or, in practice, sold or mortgaged.
 */
export const OCCUPANCY_CERTIFICATE_GATE =
  'An occupancy certificate shall not be issued unless the development authority is ' +
  'satisfied that the owner or occupier has complied with the fire prevention and life ' +
  'safety provisions (Clause 10.1.2).';
