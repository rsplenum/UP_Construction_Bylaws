/**
 * Chapter 18 — In-Building Solutions for Common Telecom Infrastructure (CTI).
 *
 * The last chapter of the byelaws, and it introduces a clearance nothing in this engine
 * knew existed: an **IBS NOC from the state TERM cell**, needed twice — once on the plan
 * submitted for approval and again on the completed building before the
 * Occupancy-cum-Completion Certificate is granted.
 *
 * Two details make it worth surfacing rather than listing:
 *
 *   Clause 18.3 makes it an OCC gate in terms as plain as the fire certificate's:
 *   "Occupancy-cum-Completion certificate to a building to be granted only after ensuring
 *   that the CTI as per the prescribed standards is in place."
 *
 *   Clause 18.5.1.1(b) then puts the burden on the applicant: the Local Authority liaises
 *   with the TERM cell, "Separate communication from the applicant shall be needed to
 *   secure the IBS NOC." An applicant who assumes the Authority's liaison is the
 *   application has not applied.
 *
 * Most of the chapter's substance defers to NBC 2016 Part 8 Section 6, which this
 * repository does not hold — the same posture as V-033 on fire. What the chapter states in
 * its own right are the two telecom-room tables and a handful of dimensions, and those are
 * modelled here.
 */

/** Clause 18.5.1.2(b) — space reserved for each service provider beside the entrance facility. */
export const TSP_SPACE_PER_PROVIDER_M = { width: 1.2, depth: 1.83 } as const;

/** Clause 18.5.1.2(c) — underground conduits to the MDF room. */
export const MDF_CONDUIT_MIN_DIAMETER_MM = 100;

/**
 * Clause 18.5.1.2(d)(i) — the Main Distribution Frame room's proportions. Stated as a
 * ratio rather than a size, which is unusual in this document and is why it is held as a
 * pair rather than as an area.
 */
export const MDF_ROOM_LENGTH_WIDTH_RATIO = { min: 1, max: 2 } as const;

export interface TelecomRoomNorm {
  /** Upper bound of the IBS coverage band, in m². Null where open-ended. */
  readonly upToSqm: number | null;
  readonly provision: string;
}

/**
 * Clause 18.5.1.2(n), first table — "Telecom room space norm for buildings with Built-up
 * area >465 sqm". The rows are keyed on the area to be covered by the IBS, which is not
 * necessarily the built-up area — see V-051.
 */
export const TELECOM_ROOM_LARGE_BUILDING: readonly TelecomRoomNorm[] = [
  { upToSqm: 465, provision: 'Telecom Room 3.0 m × 2.4 m' },
  { upToSqm: 930, provision: 'Telecom Room 3.0 m × 3.4 m' },
  { upToSqm: null, provision: 'An additional Telecom Room, to the same space norms' },
];

/** Clause 18.5.1.2(n), second table — buildings with built-up area under 465 m². */
export const TELECOM_ROOM_SMALL_BUILDING: readonly TelecomRoomNorm[] = [
  { upToSqm: 93, provision: 'Wall cabinets or self-contained enclosed cabinets' },
  { upToSqm: 465, provision: 'Shallow Room 0.6 m × 2.6 m, or Walk-in Room 1.3 m × 1.3 m' },
];

/** Clause 18.5.1.2(n) Note — where the IBS installation space may not be put. */
export const IBS_SPACE_CONDITIONS: readonly string[] = [
  'Not susceptible to flooding',
  'Not exposed to water, moisture, fumes, gases or dust',
  'Able to withstand the designed equipment load, which must be stated in the design',
  'Located away from vibration, to avoid dislocation or dislodgement',
];

/** Clause 18.5.1.1(a) — what accompanies the building plan. */
export const IBS_SUBMISSION_ITEMS: readonly string[] = [
  'A complete Service Plan for the IBS infrastructure with its specifications, prepared in '
  + 'consultation with and certified by a credible telecom networking hardware consultant',
  'An undertaking that the IBS infrastructure, once constructed, will be available for sharing '
  + 'by the various TSPs and IP-1s',
];

/**
 * Clause 18.5.5 — "No fee will be charged for IBS/ FTTx Network." Power may be charged at
 * industry tariffs and fixtures at actuals; Clause 18.3(v) requires any rental or power
 * rate levied on a service provider to be on residential rates.
 */
export const IBS_NOC_FEE = 0;

/**
 * Clause 18.5.3 — the IBS and FTTx components themselves need no permission from the Urban
 * Local Body or Development Authority, only from the administrative authority of the
 * premises. The NOC obligation at 18.5.1.1 is on the *building plan*, not on the equipment.
 */
export const IBS_EQUIPMENT_EXEMPT_FROM_ULB_PERMISSION = true;

export interface TelecomAssessment {
  /** The telecom room or cabinet provision this building must make. */
  readonly roomProvision: string;
  /** Which of the two tables was read. */
  readonly table: 'large_building' | 'small_building';
  readonly submissionItems: readonly string[];
  /** True — the IBS NOC gates the Occupancy-cum-Completion Certificate (Clause 18.3). */
  readonly gatesOccupancyCertificate: boolean;
  readonly caveats: readonly string[];
  readonly clauseRef: string;
}

/** The built-up area at which the chapter switches between its two telecom-room tables. */
export const TELECOM_TABLE_SWITCH_SQM = 465;

export function assessTelecom(input: { builtUpAreaSqm: number }): TelecomAssessment {
  const area = Math.max(0, Number(input.builtUpAreaSqm) || 0);
  const large = area > TELECOM_TABLE_SWITCH_SQM;
  const table = large ? TELECOM_ROOM_LARGE_BUILDING : TELECOM_ROOM_SMALL_BUILDING;
  // Both tables are keyed on the area the IBS covers. Absent a separate coverage figure the
  // whole built-up area is taken as covered, which is the stricter reading — see V-051.
  const row = table.find((r) => r.upToSqm === null || area <= r.upToSqm) ?? table[table.length - 1];

  const caveats = [
    'Both tables are keyed on "the area to be covered by IBS", which the chapter nowhere '
    + 'equates to the built-up area. With no separate coverage figure the whole building is '
    + 'taken as covered, which gives the larger room (V-051).',
    'The detailed provisions — entrance facilities, distribution frames, risers, cabling, '
    + 'wireless systems — defer to NBC 2016 Part 8 Section 6, which this repository does not '
    + 'hold. The dimensions above are the ones Chapter 18 states in its own right.',
  ];

  return {
    roomProvision: row.provision,
    table: large ? 'large_building' : 'small_building',
    submissionItems: IBS_SUBMISSION_ITEMS,
    gatesOccupancyCertificate: true,
    caveats,
    clauseRef: 'Clause 18.5.1.1 (IBS NOC), 18.5.1.2 (components), 18.3 (OCC gate)',
  };
}

/** Clause 18.5.1.1 — the two points at which the TERM cell sees the project. */
export const TERM_CELL_STAGES: readonly { readonly stage: string; readonly what: string }[] = [
  { stage: 'Plan approval',
    what: 'The Local Authority forwards the Service Plan to the state Telecom Enforcement '
      + 'Resource and Monitoring (TERM) cell for its NOC. A separate communication from the '
      + 'applicant is needed as well — the Authority\'s liaison is not the application.' },
  { stage: 'Completion',
    what: 'The TERM cell inspects the constructed IBS infrastructure at the joint site '
      + 'inspection, and issues the NOC for the Occupancy-cum-Completion Certificate.' },
];
