/**
 * What the gazette asserts, clause by clause.
 *
 * `registry.ts` holds one node per rule the ENGINE APPLIES. This holds one node per
 * assertion the GAZETTE MAKES, which is a different and finer thing: Clause 10.1.3 alone
 * makes three, and one of them is read two ways. The engine collapses those into a single
 * `fire.safety-certificate` entry because that is what it has to execute; the conflict
 * query cannot, because a conflict is a relationship between two assertions and collapsing
 * them is exactly what hides it.
 *
 * So the two files answer the two halves of `docs/RULE-GRAPH-PLAN.md`:
 *
 *   Step 2, edges and evaluation order  →  `graph.ts` over `registry.ts`
 *   Step 3, the conflict query          →  `conflicts.ts` over this file
 *
 * ---- On authoring bias --------------------------------------------------------------
 *
 * The benchmark is eleven conflicts a person found by reading two clauses side by side,
 * and the query is supposed to re-find them. That is only an honest test if the nodes are
 * authored from the clauses rather than from the answer sheet. Two disciplines enforce it:
 *
 *   1. Nodes are written per clause, stating what that clause says on its own. No node
 *      names another node, and nothing here records that any pair disagrees. The
 *      disposition table in `conflicts.ts` is written AFTER the query runs, against what
 *      it returns.
 *
 *   2. Every FAR ceiling node is GENERATED from the ladders the engine already holds —
 *      `GROUP_HOUSING_MAX_FAR` and `COMMERCIAL_MAX_FAR` for Chapter 3's rows 2(a)/2(b)
 *      and 3(a)/3(b), and `PURCHASABLE_FAR_ROWS` for the per-chapter printed tables. Not
 *      one cell is hand-picked. `CROSS_CHAPTER_MAX_FAR_CONFLICTS` — which already holds
 *      V-016's six answers as data — is deliberately NOT read here, because generating
 *      from it would be feeding the query its own answer.
 */

import {
  COMMERCIAL_MAX_FAR, GROUP_HOUSING_MAX_FAR, type AreaType, type RoadFarBand,
} from '../far';
import {
  BAZAAR_STREET_FRONT_LADDER, COMMERCIAL_LADDER, EDUCATIONAL_LADDER, HEALTHCARE_LADDER,
  HIGH_RISE_LADDER, INDUSTRIAL_LADDER, OTHER_COMMERCIAL_SETBACKS, PLOTTED_MAX_HEIGHT_M,
  PLOTTED_RESIDENTIAL_LADDER, PUBLIC_AMENITY_LADDER, type SetbackSet,
} from '../setbacks';
import { asCeiling, baseFarApplies, purchasableRowFor, type PurchasableBand, type PurchasableRow } from '../purchasable-far';
import { OCCUPANCIES, type OccupancyId, type SetbackTable } from '../occupancy';
import type { DerivedFact, Guard, RangeTerm } from './schema';

export interface ClauseNode {
  readonly id: string;
  /** The clause as the gazette numbers it. Where a reading needs two, both are named. */
  readonly clause: string;
  /** The question this assertion answers, in the words someone would ask it. */
  readonly asks: string;
  /** The one fact it establishes. A clause that answers two questions gets two nodes. */
  readonly produces: DerivedFact;
  /**
   * The answer, in the clause's own terms. A number where the clause gives one, a phrase
   * where it gives a rule instead. Two nodes asserting different answers to one question
   * over overlapping guards is the conflict; two asserting the same answer is not.
   *
   * Left undefined for a bare obligation — "a certificate is required" — where the answer
   * is carried entirely by the guard, and the query compares guards instead.
   */
  readonly asserts?: string | number;
  /** When the assertion speaks. */
  readonly appliesWhen: Guard;
  /** Does the engine apply this reading? A rejected reading is still a node. */
  readonly applied: boolean;
  /** The register entry that holds it, where one does. */
  readonly implements?: string;
  /**
   * The enumerated list this is one limb of.
   *
   * Clause 10.1.3 lists (a) a height, (b) a class of building and (c) an area. All three
   * require the same certificate and the gazette joins them itself, so they are
   * alternative sufficient triggers, not rival answers. Limbs of one list are never in
   * conflict with each other; everything else is fair game.
   */
  readonly limbOf?: string;
  readonly quote?: string;
  readonly note?: string;
}

const PLOTTED = ['res_single', 'res_multi'] as const;

/** Every occupancy that reads Chapter 3's rows 3(a)/3(b) — V-003's breadth, stated. */
const READS_ROW_3 = (Object.keys(OCCUPANCIES) as OccupancyId[]).filter(
  (id) => OCCUPANCIES[id].farBasis === 'road_width_commercial');

/* ====================================================================================
 * HAND-AUTHORED NODES
 * ================================================================================== */

const AUTHORED: readonly ClauseNode[] = [

  /* ---- How tall may a plotted house be? Two chapters, two keys. ------------------ */

  {
    id: 'c3.2.4.1.height.small-plot',
    clause: 'Clause 3.2.4.1 (Table 3.2.1)',
    asks: 'How tall may a plotted house be?',
    produces: 'maxHeight',
    asserts: 15,
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: PLOTTED }], ranges: [{ fact: 'plotArea', max: 300 }] },
    applied: true,
    implements: 'setback.plotted-residential',
    quote:
      'for all single/multi-units less than 300 square meters plot size, three floors with '
      + 'stilts up to 15 meter is allowed',
  },
  {
    id: 'c3.2.4.1.height.large-plot',
    clause: 'Clause 3.2.4.1 (Table 3.2.1)',
    asks: 'How tall may a plotted house be?',
    produces: 'maxHeight',
    asserts: 17.5,
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: PLOTTED }], ranges: [{ fact: 'plotArea', min: 300, minInclusive: false }] },
    applied: true,
    implements: 'setback.plotted-residential',
    quote:
      'on plots above 300 square meters, four storeys with stilts up to 17.5-meter height is allowed',
  },
  {
    id: 'c4.1.4.height.single-unit',
    clause: 'Clause 4.1.4',
    asks: 'How tall may a plotted house be?',
    produces: 'maxHeight',
    asserts: 15,
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: ['res_single'] }] },
    applied: true,
    implements: 'occupancy.thresholds',
    quote: 'The maximum height of the building shall be 15-m including stilt for single unit',
  },
  {
    id: 'c4.1.4.height.multi-unit',
    clause: 'Clause 4.1.4',
    asks: 'How tall may a plotted house be?',
    produces: 'maxHeight',
    asserts: 17.5,
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: ['res_multi'] }] },
    applied: true,
    implements: 'occupancy.thresholds',
    quote: '17.5 meters including mandatory stilt floor for multi-unit',
  },

  /* ---- Which buildings are "special"? Four lists, three area bases. -------------- */

  {
    id: 'c1.2q.special-building',
    clause: 'Clause 1.2(q)',
    asks: 'Which buildings are special buildings?',
    produces: 'specialBuilding',
    asserts: 'assembly, industrial, wholesale storage and mercantile, hazardous, hotels and hostels, centrally air-conditioned — above 500 m² total built-up area',
    appliesWhen: {
      oneOf: [{ fact: 'occupancy', values: ['inst_assembly', 'ind_light', 'ind_general', 'ind_warehouse', 'com_hotel'] }],
      ranges: [{ fact: 'builtUpArea', min: 500, minInclusive: false }],
    },
    applied: true,
    implements: 'fire.safety-certificate',
    note: 'Names hotels and centrally air-conditioned buildings, which Clause 10.1.3(b) does not.',
  },
  {
    id: 'c10.1.3b.special-building',
    clause: 'Clause 10.1.3(b)',
    asks: 'Which buildings are special buildings?',
    produces: 'specialBuilding',
    asserts: 'educational, institutional, assembly, business, mercantile, industrial, storage and hazardous — no area threshold on this limb',
    appliesWhen: {
      oneOf: [{
        fact: 'occupancy',
        values: ['inst_education', 'inst_health', 'inst_assembly', 'office', 'com_shop', 'com_complex', 'com_mall', 'com_bazaar', 'ind_light', 'ind_general', 'ind_warehouse'],
      }],
    },
    applied: true,
    implements: 'fire.safety-certificate',
    limbOf: 'c10.1.3',
    note: 'Reaches a 400 m² school, which Clause 1.2(q) does not. Never reaches a hotel, which Clause 1.2(q) names expressly.',
  },
  {
    id: 'c2.9.3.2.special-building',
    clause: 'Clause 2.9.3.2 (records with the notice of completion)',
    asks: 'Which buildings are special buildings?',
    produces: 'specialBuilding',
    asserts: 'educational, assembly, institutional, industrial, storage and hazardous — above 500 m² ground coverage',
    appliesWhen: {
      oneOf: [{ fact: 'occupancy', values: ['inst_education', 'inst_assembly', 'inst_health', 'ind_light', 'ind_general', 'ind_warehouse'] }],
      ranges: [{ fact: 'groundCoverage', min: 500, minInclusive: false }],
    },
    applied: true,
    implements: 'fire.safety-certificate',
    limbOf: 'c2.9.3.2',
    quote:
      'special buildings like educational, assembly, institutional, industrial, storage and '
      + 'buildings with hazardous use and buildings with mixed occupancies of the above '
      + 'mentioned uses whose ground coverage is more than 500 square meters',
  },

  /* ---- Does it need a fire clearance? -------------------------------------------- */

  {
    id: 'c10.1.3a.fire-certificate',
    clause: 'Clause 10.1.3(a)',
    asks: 'Does this building need a fire clearance?',
    produces: 'fireClearanceRequired',
    appliesWhen: { ranges: [{ fact: 'buildingHeight', min: 15, minInclusive: false }] },
    applied: true,
    implements: 'fire.safety-certificate',
    limbOf: 'c10.1.3',
    quote: 'Multi-storied buildings having more than 15 meters height',
  },
  {
    id: 'c10.1.3a.fire-certificate.read-with-c1.2m',
    clause: 'Clause 10.1.3(a) read with Clause 1.2(m)',
    asks: 'Does this building need a fire clearance?',
    produces: 'fireClearanceRequired',
    appliesWhen: {
      ranges: [{ fact: 'buildingHeight', min: 17.5, minInclusive: false }],
      flags: [{ fact: 'hasStilt', is: true }],
    },
    applied: false,
    quote:
      '"Multi-Storeyed Building or High-rise Building" means building above four storeys, '
      + 'and/or a building exceeding 15 meters or more in height (without stilt) and 17.5 '
      + 'meters (including stilt).',
    note:
      'Clause 10.1.3(a) governs "multi-storied buildings", and Clause 1.2(m) is where that '
      + 'term is defined. Read together a stilted building is not one until 17.5 m — on '
      + 'exactly the buildings that most often have a stilt, stilt parking being mandatory '
      + 'for multi-units under Para 3.3.4.8.',
  },
  {
    id: 'c10.1.3c.special-building',
    clause: 'Clause 10.1.3(c)',
    asks: 'Which buildings are special buildings?',
    produces: 'specialBuilding',
    asserts: 'mixed occupancies of the above uses — above 500 m² covered area',
    appliesWhen: { ranges: [{ fact: 'builtUpArea', min: 500, minInclusive: false }] },
    applied: true,
    implements: 'fire.safety-certificate',
    limbOf: 'c10.1.3',
    note:
      'Near-identical in wording to Clause 2.9.3.2\'s own mixed-occupancy limb and keyed on '
      + 'a different word: "covered area" here, "ground coverage" there, "total built up '
      + 'area" at Clause 1.2(q). Chapter 1 defines two of the three and they are not the '
      + 'same quantity — covered area reads as a footprint, its exclusion list being a '
      + 'footprint list. The engine tests all three against the all-floors total, which '
      + 'crosses 500 soonest and is therefore the stricter direction, but is wrong by a '
      + 'factor of the floor count.',
  },
  {
    id: 'c2.9.3.2.fire-noc.height',
    clause: 'Clause 2.9.3.2',
    asks: 'Does this building need a fire clearance?',
    produces: 'fireClearanceRequired',
    appliesWhen: { ranges: [{ fact: 'buildingHeight', min: 15 }] },
    applied: true,
    implements: 'fire.safety-certificate',
    limbOf: 'c2.9.3.2',
    quote: 'No-objection certificate … for buildings more than four floors or 15-meters and more high',
    note: 'Inclusive at 15 m where Clause 10.1.3(a) is exclusive.',
  },
  {
    id: 'c2.9.3.2.fire-noc.floors',
    clause: 'Clause 2.9.3.2',
    asks: 'Does this building need a fire clearance?',
    produces: 'fireClearanceRequired',
    appliesWhen: { ranges: [{ fact: 'floorCount', min: 4, minInclusive: false }] },
    applied: false,
    limbOf: 'c2.9.3.2',
    quote: 'for buildings more than four floors',
    note:
      'A five-storey block standing at 14 m is caught here and by nothing in Chapter 10. '
      + '`ProjectState` has no floor count and one cannot be derived from height, so the '
      + 'engine reports this limb as undecided rather than answering it.',
  },

  /* ---- Must it be designed for earthquakes? ------------------------------------- */

  {
    id: 'c11.8.1.seismic.height',
    clause: 'Clause 11.8.1',
    asks: 'Must this building be designed to resist earthquakes?',
    produces: 'seismicMandatory',
    appliesWhen: { ranges: [{ fact: 'buildingHeight', min: 12, minInclusive: false }] },
    applied: true,
    implements: 'structural.seismic-applicability',
    limbOf: 'c11.8.1',
    note: 'The lowest of the safety thresholds, and so the binding one on ordinary buildings.',
  },
  {
    id: 'c11.8.1.seismic.floors',
    clause: 'Clause 11.8.1',
    asks: 'Must this building be designed to resist earthquakes?',
    produces: 'seismicMandatory',
    appliesWhen: { ranges: [{ fact: 'floorCount', min: 3, minInclusive: false }] },
    applied: false,
    limbOf: 'c11.8.1',
    note: 'Four floors at 2.75 m stands at 11 m — under the height limb and over this one.',
  },
  {
    id: 'c11.3.peer-review',
    clause: 'Clause 11.3',
    asks: 'Must the structural design be peer reviewed?',
    produces: 'peerReviewRequired',
    appliesWhen: { ranges: [{ fact: 'buildingHeight', min: 50, minInclusive: false }] },
    applied: true,
    implements: 'structural.seismic-applicability',
  },

  /* ---- Who may sign the drawings? ------------------------------------------------ */

  {
    id: 'c14.2.4.2a.supervisor',
    clause: 'Clause 14.2.4.2(a)',
    asks: 'May a supervisor sign for this building?',
    produces: 'licensedRole',
    asserts: 'supervisor',
    appliesWhen: { ranges: [{ fact: 'buildingHeight', max: 7.5 }, { fact: 'plotArea', max: 100 }] },
    applied: true,
    implements: 'licensing.competence',
    note: 'Stated as "storeys or height" — two storeys or 7.5 m — and the storey limb cannot be evaluated.',
  },
  {
    id: 'c14.2.2.2b.structural-engineer',
    clause: 'Clause 14.2.2.2(b)',
    asks: 'May an engineer take the structural design?',
    produces: 'licensedRole',
    asserts: 'engineer',
    appliesWhen: { ranges: [{ fact: 'buildingHeight', max: 16 }, { fact: 'plotArea', max: 500 }] },
    applied: true,
    implements: 'licensing.competence',
    note: 'Five storeys or 16 m. A four-storey building at 15 m is inside on height and outside on storeys.',
  },
  {
    id: 'c14.4.experience.band-1',
    clause: 'Clause 14.4 (experience band 1)',
    asks: 'What experience must the structural engineer have?',
    produces: 'siteEngineerRequired',
    asserts: 'band 1',
    appliesWhen: { ranges: [{ fact: 'buildingHeight', max: 12 }, { fact: 'builtUpArea', max: 2500 }] },
    applied: true,
    implements: 'licensing.competence',
  },
  {
    id: 'c14.4.experience.band-2',
    clause: 'Clause 14.4 (experience band 2)',
    asks: 'What experience must the structural engineer have?',
    produces: 'siteEngineerRequired',
    asserts: 'band 2',
    appliesWhen: { ranges: [{ fact: 'buildingHeight', max: 24 }, { fact: 'builtUpArea', max: 5000 }] },
    applied: true,
    implements: 'licensing.competence',
  },

  /*
   * The storey limbs of the same four competence limits. Chapter 14 states every one of
   * them as "storeys or height", and `ProjectState` has no floor count, so the engine
   * evaluates the height limb and caveats the other. They are nodes anyway: an assertion
   * the gazette makes is an assertion whether or not this engine can reach it, and leaving
   * them out would understate how many different floor counts the byelaws gate on.
   */
  {
    id: 'c14.2.4.2a.supervisor.storeys',
    clause: 'Clause 14.2.4.2(a)',
    asks: 'May a supervisor sign for this building?',
    produces: 'licensedRole',
    asserts: 'supervisor',
    appliesWhen: { ranges: [{ fact: 'floorCount', max: 2 }, { fact: 'plotArea', max: 100 }] },
    applied: false,
    note: 'The storey limb of the same limit. Not evaluated — no floor count exists to evaluate it against.',
  },
  {
    id: 'c14.2.2.2b.structural-engineer.storeys',
    clause: 'Clause 14.2.2.2(b)',
    asks: 'May an engineer take the structural design?',
    produces: 'licensedRole',
    asserts: 'engineer',
    appliesWhen: { ranges: [{ fact: 'floorCount', max: 5 }, { fact: 'plotArea', max: 500 }] },
    applied: false,
    note: 'A four-storey building at 15 m is inside this limb and outside the height limb.',
  },
  {
    id: 'c14.4.experience.band-1.storeys',
    clause: 'Clause 14.4 (experience band 1)',
    asks: 'What experience must the structural engineer have?',
    produces: 'siteEngineerRequired',
    asserts: 'band 1',
    appliesWhen: { ranges: [{ fact: 'floorCount', max: 4 }, { fact: 'builtUpArea', max: 2500 }] },
    applied: false,
  },
  {
    id: 'c14.4.experience.band-2.storeys',
    clause: 'Clause 14.4 (experience band 2)',
    asks: 'What experience must the structural engineer have?',
    produces: 'siteEngineerRequired',
    asserts: 'band 2',
    appliesWhen: { ranges: [{ fact: 'floorCount', max: 8 }, { fact: 'builtUpArea', max: 5000 }] },
    applied: false,
  },

  /* ---- How many trees? Two chapters on two bases, and a third rate above both. --- */

  {
    id: 'c13.7.trees.commercial',
    clause: 'Clause 13.7',
    asks: 'How many trees must the landscape plan show?',
    produces: 'treePlantingRequired',
    asserts: '1 tree per 100 m² of plot',
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: ['com_shop', 'com_complex', 'com_mall', 'com_bazaar', 'com_hotel', 'office'] }] },
    applied: true,
    implements: 'services.tree-plantation',
  },
  {
    id: 'c13.7.trees.industrial',
    clause: 'Clause 13.7',
    asks: 'How many trees must the landscape plan show?',
    produces: 'treePlantingRequired',
    asserts: '1 tree per 80 m² of plot',
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: ['ind_light', 'ind_general', 'ind_warehouse'] }] },
    applied: true,
    implements: 'services.tree-plantation',
  },
  {
    id: 'c3.landscape-plan.commercial',
    clause: 'Chapter 3 (Landscape Plan)',
    asks: 'How many trees must the landscape plan show?',
    produces: 'treePlantingRequired',
    asserts: '50 per hectare of 20% of the open space',
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: ['com_shop', 'com_complex', 'com_mall', 'com_bazaar', 'com_hotel', 'office'] }] },
    applied: false,
    note:
      'On a 1,000 m² commercial plot Clause 13.7 asks for 10 trees and this rate asks for '
      + 'under one. They are not one obligation stated twice; they are two obligations that '
      + 'meet on the same site, and the engine holds the per-plot rate.',
  },
  {
    id: 'c3.landscape-plan.industrial',
    clause: 'Chapter 3 (Landscape Plan)',
    asks: 'How many trees must the landscape plan show?',
    produces: 'treePlantingRequired',
    asserts: '125 per hectare of the total open space',
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: ['ind_light', 'ind_general', 'ind_warehouse'] }] },
    applied: false,
  },
  {
    id: 'c13.2.4.category-a.trees',
    clause: 'Clause 13.2.4 (Category-A environmental condition)',
    asks: 'How many trees must the landscape plan show?',
    produces: 'treePlantingRequired',
    asserts: '1 tree per 80 m² of land',
    appliesWhen: { ranges: [{ fact: 'builtUpArea', min: 5000 }] },
    applied: true,
    implements: 'services.environmental-conditions',
    note: 'On a group housing scheme this is 2.5 times the rate Clause 13.7(a)(v) gives the same scheme. The larger governs.',
  },

  /* ---- How much EV charging? Stated twice one way and once another. -------------- */

  {
    id: 'c17.1.ev-share',
    clause: 'Clause 17.1, with Clause 17.1.2.1 Note (i)',
    asks: 'What share of parking capacity must be laid out for EVs?',
    produces: 'evChargingProvision',
    asserts: 0.20,
    appliesWhen: {},
    applied: true,
    implements: 'ev.charging-infrastructure',
    quote: '20% of all vehicle holding capacity',
  },
  {
    id: 'c17.5.1.ev-share',
    clause: 'Clause 17.5.1 (explanatory annexure)',
    asks: 'What share of parking capacity must be laid out for EVs?',
    produces: 'evChargingProvision',
    asserts: 0.15,
    appliesWhen: {},
    applied: false,
    quote:
      'It has been broadly projected that by the current rate of adoption of EVs, about 15% '
      + 'of all vehicles in the country would be EVs by the year 2020.',
    note:
      'Read in context a projection about 2020 rather than a requirement, and it resolves to '
      + '20% for the cities the byelaws govern. Recorded because the same passage introduces '
      + "\"Metropolitan and 'Tier I' cities\", a third undefined city classification.",
  },

  /* ---- How big a telecom room? The caption and the key are different quantities. - */

  {
    id: 'c18.5.1.2n.telecom-room.built-up',
    clause: 'Clause 18.5.1.2(n) — table caption',
    asks: 'How much space must the telecom room have?',
    produces: 'telecomRoomSpace',
    asserts: 'keyed on the whole built-up area',
    appliesWhen: { ranges: [{ fact: 'builtUpArea', min: 465 }] },
    applied: true,
    implements: 'telecom.cti',
    quote: 'Telecom room space norm for buildings with Built-up area >465 sqm',
  },
  {
    id: 'c18.5.1.2n.telecom-room.ibs-covered',
    clause: 'Clause 18.5.1.2(n) — table row key',
    asks: 'How much space must the telecom room have?',
    produces: 'telecomRoomSpace',
    asserts: 'keyed on the area to be covered by the IBS',
    appliesWhen: { ranges: [{ fact: 'ibsCoveredArea', min: 465 }] },
    applied: false,
    quote: 'Area to be covered by IBS',
    note:
      'A 2,000 m² office may run its in-building solution over the three floors with poor '
      + 'signal and not the basement, in which case the covered area is a fraction of the '
      + 'built-up area and the table gives a smaller room — above 930 m², one room rather '
      + 'than two. Nothing in the chapter says the two quantities are the same.',
  },
];

/* ====================================================================================
 * GENERATED NODES — every FAR ceiling the two sources print.
 * ================================================================================== */

const bandGuard = (over: number, upTo: number | null, extra: Guard = {}): Guard => ({
  ...extra,
  ranges: [
    { fact: 'roadWidth' as const, min: over, minInclusive: false,
      ...(upTo !== null && Number.isFinite(upTo) ? { max: upTo } : {}) },
    ...(extra.ranges ?? []),
  ],
});

/**
 * Chapter 3's matrix — rows 2(a)/2(b) for group housing and 3(a)/3(b) for everything
 * non-residential.
 *
 * `MIXED_USE_MAX_FAR` is deliberately not a source here. It is Chapter 8's own table, not
 * Chapter 3's, so pairing it against the printed Chapter 8 row would compare a source with
 * itself and report the table's internal arithmetic defects (V-025, shape (b)) as if they
 * were cross-clause conflicts. The extractor already checks those on every run.
 */
function chapter3Nodes(): ClauseNode[] {
  const out: ClauseNode[] = [];
  const sources: readonly {
    ladder: Readonly<Record<AreaType, readonly RoadFarBand[]>>;
    clause: string;
    occupancies: readonly OccupancyId[];
    rule: string;
  }[] = [
    { ladder: GROUP_HOUSING_MAX_FAR, clause: 'Para 3.2.5 Table rows 2(a) and 2(b)', occupancies: ['res_group_housing'], rule: 'far.road-width-group-housing' },
    { ladder: COMMERCIAL_MAX_FAR, clause: 'Para 3.2.5 Table rows 3(a) and 3(b)', occupancies: READS_ROW_3, rule: 'far.road-width-commercial' },
  ];

  for (const source of sources) {
    for (const areaType of ['built_up', 'non_built_up'] as const) {
      for (const band of source.ladder[areaType]) {
        // A zero band is the engine's own floor under the table (V-007), not a figure the
        // gazette prints; an infinite one is "unrestricted", which asserts no number.
        if (band.maxFar === 0 || !Number.isFinite(band.maxFar)) continue;
        out.push({
          id: `ch3.${source.rule}.${areaType}.${band.label.replace(/\s+/g, '')}`,
          clause: source.clause,
          asks: 'What is the maximum FAR at this road width?',
          produces: 'ceilingFar',
          asserts: band.maxFar,
          appliesWhen: bandGuard(band.overMoreThan, band.upToAndIncluding, {
            oneOf: [{ fact: 'occupancy', values: source.occupancies }, { fact: 'areaType', values: [areaType] }],
          }),
          applied: true,
          implements: source.rule,
          note: `Chapter 3, ${band.label}.`,
        });
      }
    }
  }
  return out;
}

/**
 * Which occupancies read each printed BFAR/PFAR/PPFAR row, discovered by asking
 * `purchasableRowFor` rather than by restating its rules here. Clause 5.2.5 splits
 * commercial units at 100 m², so the plot area is part of the answer.
 */
const PRINTED_ROW_READERS: readonly {
  readonly row: PurchasableRow;
  readonly occupancies: readonly OccupancyId[];
  readonly areaType: AreaType;
  readonly plotAreaGuard?: { readonly min?: number; readonly max?: number };
}[] = (() => {
  const OCCUPANCY_IDS = Object.keys(OCCUPANCIES) as OccupancyId[];
  const AREA_TYPES = ['built_up', 'non_built_up'] as const;
  // Clause 5.2.5 is the only table split on plot area, at 100 m². Two probes either side
  // of it are enough to discover the split without restating where it is.
  const BUCKETS: readonly { plotArea: number; guard: { min?: number; max?: number } }[] = [
    { plotArea: 50, guard: { max: 100 } },
    { plotArea: 1000, guard: { min: 100 } },
  ];

  const rowAt = (occupancy: OccupancyId, areaType: AreaType, plotArea: number) =>
    purchasableRowFor({ occupancy, areaType, plotAreaSqm: plotArea, roadWidthM: 30 });

  // A row is plot-split when some occupancy reaches a different row either side of 100 m².
  const split = new Set<string>();
  for (const occupancy of OCCUPANCY_IDS) {
    for (const areaType of AREA_TYPES) {
      const [lo, hi] = BUCKETS.map((b) => rowAt(occupancy, areaType, b.plotArea));
      if (lo && hi && lo.id !== hi.id) { split.add(lo.id); split.add(hi.id); }
    }
  }

  const entries = new Map<string, { row: PurchasableRow; occupancies: OccupancyId[]; areaType: AreaType; plotAreaGuard?: { min?: number; max?: number } }>();
  for (const occupancy of OCCUPANCY_IDS) {
    for (const areaType of AREA_TYPES) {
      for (const bucket of BUCKETS) {
        const row = rowAt(occupancy, areaType, bucket.plotArea);
        if (!row) continue;
        const guard = split.has(row.id) ? bucket.guard : undefined;
        const key = guard ? `${row.id}|${guard.min ?? ''}-${guard.max ?? ''}` : row.id;
        const entry = entries.get(key) ?? { row, occupancies: [], areaType, plotAreaGuard: guard };
        if (!entry.occupancies.includes(occupancy)) entry.occupancies.push(occupancy);
        entries.set(key, entry);
      }
    }
  }
  return [...entries.values()];
})();

/** The per-chapter printed tables — Clauses 4.2.8, 4.4, 5.1.4, 5.2.5, 5.3.5, 5.4.4, 8.1.3.1. */
function printedChapterNodes(): ClauseNode[] {
  const out: ClauseNode[] = [];
  for (const reader of PRINTED_ROW_READERS) {
    for (const band of reader.row.bands as readonly PurchasableBand[]) {
      const printed = asCeiling(band.maxFar);
      if (printed === null || !Number.isFinite(printed)) continue;
      if (!baseFarApplies(reader.row, band)) continue;
      const plotRanges = reader.plotAreaGuard
        ? [{ fact: 'plotArea' as const, ...reader.plotAreaGuard, minInclusive: false }]
        : [];
      out.push({
        id: `printed.${reader.row.id}.${band.label.replace(/\s+/g, '')}`,
        clause: `Chapter ${reader.row.chapter} (gazette p.${reader.row.gazettePage}), ${reader.row.useType}`,
        asks: 'What is the maximum FAR at this road width?',
        produces: 'ceilingFar',
        asserts: printed,
        appliesWhen: bandGuard(band.overMoreThan, band.upToAndIncluding, {
          oneOf: [
            { fact: 'occupancy', values: reader.occupancies },
            { fact: 'areaType', values: [reader.areaType] },
          ],
          ranges: plotRanges,
        }),
        applied: true,
        implements: 'far.purchasable-commercial',
        note: `Printed maximum, ${band.label}.`,
      });
    }
  }
  return out;
}


/* ====================================================================================
 * GENERATED NODES — the setback tables, one node per TABLE.
 *
 * `requiredSetback` was the one fact `coverage.ts` reported as unswept: five rules
 * establishing it and not a single assertion for the query to compare. Authoring these
 * found two tables the gazette prints and the engine did not hold (B-050, B-051) and one
 * clause whose scope the engine had been ignoring (B-052).
 *
 * ---- Why one node per table and not one per row -------------------------------------
 *
 * The FAR nodes above are one per CELL, and they have to be: Chapter 3's ladder and the
 * per-occupancy printed tables are keyed the same way, on the same road bands, so the two
 * sources meet cell by cell and enumerating where they diverge is the information.
 *
 * The setback tables are not like that. Clause 3.2.4.3 is keyed on plot area, Clause 5.1.5
 * on road width, Clause 3.2.4.9 on height, Clause 3.2.4.4 on what the building is. Two
 * tables keyed on different quantities have no cells in common, so a per-row generation
 * would emit the CARTESIAN PRODUCT of their rows — forty pairs for the bazaar street
 * against the commercial ladder alone — and every one of those pairs would be restating
 * the same single fact, that the two tables both fix a front setback and disagree.
 *
 * So: rows where the rival tables share a key, one node per table where they do not. The
 * exception is Clause 3.2.4.7, whose two building types are keyed the same way and
 * disagree above 3,000 m², which is exactly the case per-row nodes exist for.
 * ================================================================================== */

const faces = (set: SetbackSet): string =>
  `${set.front} / ${set.rear} / ${set.side1} / ${set.side2}`;

const ladderPhrase = (bands: readonly (SetbackSet & { label: string })[]): string =>
  bands.map((b) => `${b.label}: ${faces(b)}`).join('; ');

const readingTable = (table: SetbackTable): OccupancyId[] =>
  (Object.keys(OCCUPANCIES) as OccupancyId[]).filter((id) => OCCUPANCIES[id].setbackTable === table);

/** Clause 3.2.4.9's scope in its own words — every use but a single or multi unit. */
const NOT_PLOTTED = (Object.keys(OCCUPANCIES) as OccupancyId[])
  .filter((id) => !(PLOTTED as readonly string[]).includes(id));

const upTo15: readonly RangeTerm[] = [{ fact: 'buildingHeight', max: 15 }];

function setbackNodes(): ClauseNode[] {
  return [
    {
      id: 'c3.2.4.1.setback.plotted',
      clause: 'Clause 3.2.4.1 (Table 3.2.1)',
      asks: 'How far back must a plotted house sit from each boundary?',
      produces: 'requiredSetback',
      asserts: ladderPhrase(PLOTTED_RESIDENTIAL_LADDER),
      // To 17.5 m, not to 15: the table's own preamble allows "four storeys with stilts up
      // to 17.5-meter height" above 300 m², and Clause 3.2.4.9 excludes this use by name.
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: PLOTTED }],
        ranges: [{ fact: 'buildingHeight', max: PLOTTED_MAX_HEIGHT_M }],
      },
      applied: true,
      implements: 'setback.plotted-residential',
      quote:
        'Under plotted development, for all single/multi-units less than 300 square meters plot '
        + 'size, three floors with stilts up to 15 meter is allowed and on plots above 300 square '
        + 'meters, four storeys with stilts up to 17.5-meter height is allowed. The set-back shall '
        + 'be as follows:',
    },
    {
      id: 'c3.2.4.2.setback.group-housing',
      clause: 'Clause 3.2.4.2',
      asks: 'How far back must a group housing block below 15 m sit?',
      produces: 'requiredSetback',
      asserts: '5 / 5 / 5 / 5',
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: readingTable('group_housing') }],
        ranges: upTo15,
      },
      applied: true,
      implements: 'setback.group-housing',
      quote: 'Residential – Group Housing up to 15-meter height. Group Housing up to 15-meters: 5 / 5 / 5 / 5.',
    },
    {
      id: 'c3.2.4.3.setback.commercial',
      clause: 'Clause 3.2.4.3',
      asks: 'How far back must a shop, commercial unit or mixed-use building below 15 m sit?',
      produces: 'requiredSetback',
      asserts: ladderPhrase(COMMERCIAL_LADDER),
      // `com_bazaar` is inside this guard although the engine routes it to Clause 5.1.5:
      // Note-3 to THIS table is where the bazaar-street ladder is printed, which is the
      // table saying in its own voice that it speaks to bazaar-street plots and yields only
      // the front. The other three faces are still its own.
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: [...readingTable('commercial'), 'com_bazaar'] }],
        ranges: upTo15,
      },
      applied: true,
      implements: 'setback.non-residential',
      quote:
        'Commercial – Shops/commercial units, Mixed use buildings up to 15-meter height. '
        + 'Up to 100: 1.5 / - / - / -. >100 - 300: 3 / - / - / -. >300 - 1000: 4.5 / 3 / 1.5 / 1.5. '
        + '>1000 - 3000: 6 / 3 / 3 / 3. >3000: 12 / 6 / 6 / 6.',
    },
    {
      id: 'c3.2.4.4.setback.other-commercial.hotel',
      clause: 'Clause 3.2.4.4',
      asks: 'How far back must a hotel, single-screen cinema or miniplex below 15 m sit?',
      produces: 'requiredSetback',
      asserts: faces(OTHER_COMMERCIAL_SETBACKS.hotel),
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: ['com_hotel'] }],
        ranges: upTo15,
      },
      applied: true,
      implements: 'setback.other-commercial',
      quote: 'Other Commercial. Hotels/ Single screen cinema/ Miniplex: 5 / 3 / 3 / 3.',
      note:
        'One of two rows in this table that map onto an occupancy this engine has. The table is '
        + 'keyed on what the building is, and its key column is headed "Building Height (m)" — a '
        + 'header carried over from the group housing table above it.',
    },
    {
      id: 'c3.2.4.4.setback.other-commercial.mall',
      clause: 'Clause 3.2.4.4',
      asks: 'How far back must a shopping mall or multiplex below 15 m sit?',
      produces: 'requiredSetback',
      asserts: faces(OTHER_COMMERCIAL_SETBACKS.mall),
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: ['com_mall'] }],
        ranges: upTo15,
      },
      applied: true,
      implements: 'setback.other-commercial',
      quote: 'Other Commercial. Multiplex/ Shopping Malls: 9 / 6 / 6 / 6.',
    },
    {
      id: 'c3.2.4.5.setback.healthcare',
      clause: 'Clause 3.2.4.5',
      asks: 'How far back must a hospital or nursing home below 15 m sit?',
      produces: 'requiredSetback',
      asserts: ladderPhrase(HEALTHCARE_LADDER),
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: readingTable('healthcare') }],
        ranges: upTo15,
      },
      applied: true,
      implements: 'setback.non-residential',
    },
    {
      id: 'c3.2.4.6.setback.educational',
      clause: 'Clause 3.2.4.6',
      asks: 'How far back must a school or college below 15 m sit?',
      produces: 'requiredSetback',
      asserts: ladderPhrase(EDUCATIONAL_LADDER),
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: readingTable('educational') }],
        ranges: upTo15,
      },
      applied: true,
      implements: 'setback.non-residential',
    },
    {
      id: 'c3.2.4.7.setback.public-amenity.hall.1000-3000',
      clause: 'Clause 3.2.4.7',
      asks: 'How far back must a marriage or banquet hall of 1,000 to 3,000 m² sit?',
      produces: 'requiredSetback',
      asserts: '12 / 4.5 / 4.5 / 3',
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: ['inst_assembly'] }],
        ranges: [{ fact: 'plotArea', min: 1000, minInclusive: false }, { fact: 'plotArea', max: 3000 }, ...upTo15],
      },
      applied: true,
      implements: 'setback.public-amenity',
      quote: 'Marriage/ Banquet/ Multipurpose Hall. 1000 – 3000: 12 / 4.5 / 4.5 / 3.',
    },
    {
      id: 'c3.2.4.7.setback.public-amenity.hall.over-3000',
      clause: 'Clause 3.2.4.7',
      asks: 'How far back must a marriage or banquet hall above 3,000 m² sit?',
      produces: 'requiredSetback',
      asserts: '12 / 5 / 5 / 5',
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: ['inst_assembly'] }],
        ranges: [{ fact: 'plotArea', min: 3000, minInclusive: false }, ...upTo15],
      },
      applied: false,
      quote: 'Marriage/ Banquet/ Multipurpose Hall. More than 3000: 12 / 5 / 5 / 5.',
      note: 'Not applied: one occupancy covers both building types and the engine takes the stricter row.',
    },
    {
      id: 'c3.2.4.7.setback.public-amenity.auditorium.1500-3000',
      clause: 'Clause 3.2.4.7',
      asks: 'How far back must an auditorium or convention centre of 1,500 to 3,000 m² sit?',
      produces: 'requiredSetback',
      asserts: '12 / 4.5 / 4.5 / 3',
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: ['inst_assembly'] }],
        ranges: [{ fact: 'plotArea', min: 1500, minInclusive: false }, { fact: 'plotArea', max: 3000 }, ...upTo15],
      },
      applied: true,
      implements: 'setback.public-amenity',
      quote: 'Auditorium / Convention Centre. 1500 – 3000: 12 / 4.5 / 4.5 / 3.',
    },
    {
      id: 'c3.2.4.7.setback.public-amenity.auditorium.over-3000',
      clause: 'Clause 3.2.4.7',
      asks: 'How far back must an auditorium or convention centre above 3,000 m² sit?',
      produces: 'requiredSetback',
      asserts: '12 / 6 / 6 / 6',
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: ['inst_assembly'] }],
        ranges: [{ fact: 'plotArea', min: 3000, minInclusive: false }, ...upTo15],
      },
      applied: true,
      implements: 'setback.public-amenity',
      quote: 'Auditorium / Convention Centre. More than 3000: 12 / 6 / 6 / 6.',
    },
    {
      id: 'c3.2.4.8.setback.industrial',
      clause: 'Clause 3.2.4.8',
      asks: 'How far back must a factory or warehouse below 15 m sit?',
      produces: 'requiredSetback',
      asserts: ladderPhrase(INDUSTRIAL_LADDER),
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: readingTable('industrial') }],
        ranges: upTo15,
      },
      applied: true,
      implements: 'setback.non-residential',
    },
    {
      id: 'c3.2.4.9.setback.high-rise',
      clause: 'Clause 3.2.4.9',
      asks: 'How much clear space must a building over 15 m keep on every side?',
      produces: 'requiredSetback',
      asserts: ladderPhrase(HIGH_RISE_LADDER),
      appliesWhen: {
        oneOf: [{ fact: 'occupancy', values: NOT_PLOTTED }],
        ranges: [{ fact: 'buildingHeight', min: 15, minInclusive: false }],
      },
      applied: true,
      implements: 'setback.high-rise',
      quote:
        'For use occupancies with building height more than 15m (other than single/multi units), '
        + 'the minimum setback requirement shall be as follows.',
    },
    {
      id: 'c5.1.5.setback.bazaar-front',
      clause: 'Clause 5.1.5, printed again at Clause 3.2.4.3 Note-3',
      asks: 'How far back from the road must a shop on a bazaar street sit?',
      produces: 'requiredSetback',
      asserts: `front only, by road width — ${BAZAAR_STREET_FRONT_LADDER.map((b) => `${b.label}: ${b.front}`).join('; ')}`,
      // No height limb anywhere in Clause 5.1. Clause 5.1.3 says in terms that there is no
      // height restriction on a bazaar street, so this table speaks above 15 m as well —
      // where Clause 3.2.4.9 also speaks, and says something else.
      appliesWhen: { oneOf: [{ fact: 'occupancy', values: ['com_bazaar'] }] },
      applied: true,
      implements: 'setback.bazaar-street',
      quote:
        'Based on the proposed road width, the minimum front setback for plots on the bazaar street '
        + 'shall be as follows: 12 → 3.0, 18 → 4.5, 24 → 6.0, 30 → 6.0, 36 → 7.5, 45 → 7.5, 76 → 9.0.',
      note:
        'The engine applies this below 15 m only; above it the progressive ladder takes over, which '
        + 'is a choice this clause does not obviously authorise.',
    },
  ];
}

/** Every assertion the query runs over. */
export const CLAUSE_NODES: readonly ClauseNode[] = [
  ...AUTHORED,
  ...chapter3Nodes(),
  ...printedChapterNodes(),
  ...setbackNodes(),
];

export const CLAUSE_NODE = Object.fromEntries(CLAUSE_NODES.map((n) => [n.id, n]));
