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
import { asCeiling, baseFarApplies, purchasableRowFor, type PurchasableBand, type PurchasableRow } from '../purchasable-far';
import { OCCUPANCIES, type OccupancyId } from '../occupancy';
import type { DerivedFact, Guard } from './schema';

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

/** Every assertion the query runs over. */
export const CLAUSE_NODES: readonly ClauseNode[] = [
  ...AUTHORED,
  ...chapter3Nodes(),
  ...printedChapterNodes(),
];

export const CLAUSE_NODE = Object.fromEntries(CLAUSE_NODES.map((n) => [n.id, n]));
