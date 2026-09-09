/**
 * What is being built.
 *
 * Every rule in the byelaws keys off this: which FAR ladder applies, which setback
 * table, which row of the Chapter 15 permissibility matrix, which parking ratio, which
 * compounding schedule. Before this, the app knew four occupancies and hard-coded the
 * consequences at each call site.
 *
 * Each entry carries two names: `label` for someone who reads byelaws, and `plain` for
 * someone who owns a plot and does not. The two modes of the app render the same
 * occupancy from these two fields.
 *
 * VERIFY AGAINST GAZETTE: the thresholds here are transcribed, not certified.
 */

import type { CompoundingUse } from './compounding';

export type OccupancyId =
  | 'res_single'
  | 'res_multi'
  | 'res_group_housing'
  | 'com_shop'
  | 'com_complex'
  | 'com_mall'
  | 'com_hotel'
  | 'com_bazaar'
  | 'office'
  | 'inst_health'
  | 'inst_education'
  | 'inst_assembly'
  | 'ind_light'
  | 'ind_general'
  | 'ind_warehouse'
  | 'mixed_use';

export type OccupancyGroup = 'Residential' | 'Commercial' | 'Workplace' | 'Institutional' | 'Industrial';

/** Which FAR derivation applies. */
export type FarBasis = 'telescopic_plotted' | 'road_width_group_housing' | 'road_width_commercial';

/** Which setback ladder applies below the high-rise threshold. */
export type SetbackTable = 'plotted_residential' | 'group_housing' | 'commercial' | 'healthcare' | 'educational' | 'industrial';

export interface OccupancyDefinition {
  id: OccupancyId;
  group: OccupancyGroup;
  /** Technical name, as an architect or reviewer would say it. */
  label: string;
  /** What it is, for someone who has never read a byelaw. */
  plain: string;
  /** One line on what makes this occupancy's rules distinctive. */
  note: string;

  farBasis: FarBasis;
  setbackTable: SetbackTable;

  /** Row in CHAPTER_15_ACTIVITY_PERMISSIBILITY, when one exists. */
  activityId?: string;
  /** Category in PURCHASABLE_FAR_FACTORS, for the Chapter 9 charge. */
  purchasableFarCategory: string;
  /** Schedule used when pricing a deviation under Chapter 16. */
  compoundingUse: CompoundingUse;

  /** Equivalent car spaces required per 100 sqm of built-up area (Chapter 10). */
  parkingEcsPer100Sqm: number;
  /** Minimum abutting right of way, in metres, below which the use is not sanctionable. */
  minRoadWidthM: number;
  /** Minimum plot area in sqm, where the byelaws set one. */
  minPlotAreaSqm: number;
  /** Height ceiling in metres; Infinity where only road width and fire clearance govern. */
  maxHeightM: number;

  /** Triggers the EWS/LIG reservation under Chapter 4. */
  triggersEwsLig: boolean;
  /** Requires a Chief Fire Officer NOC once the built-up area passes 500 sqm. */
  fireNocAbove500Sqm: boolean;
}

export const OCCUPANCIES: Readonly<Record<OccupancyId, OccupancyDefinition>> = {
  res_single: {
    id: 'res_single', group: 'Residential',
    label: 'Plotted residential — single dwelling',
    plain: 'A house for one family',
    note: 'Telescopic FAR: the larger the plot, the lower the ratio on each additional slab.',
    farBasis: 'telescopic_plotted', setbackTable: 'plotted_residential',
    activityId: 'act-single-unit', purchasableFarCategory: 'Residential (Plotted)',
    compoundingUse: 'residential',
    parkingEcsPer100Sqm: 0.5, minRoadWidthM: 4, minPlotAreaSqm: 30, maxHeightM: 15,
    triggersEwsLig: false, fireNocAbove500Sqm: false,
  },
  res_multi: {
    id: 'res_multi', group: 'Residential',
    label: 'Plotted residential — multiple dwellings',
    plain: 'A building with several separate flats on one plot',
    note: 'Needs a 9 m road and stilt parking; height ceiling rises to 17.5 m.',
    farBasis: 'telescopic_plotted', setbackTable: 'plotted_residential',
    activityId: 'act-multi-unit', purchasableFarCategory: 'Residential (Plotted)',
    compoundingUse: 'residential',
    parkingEcsPer100Sqm: 1.0, minRoadWidthM: 9, minPlotAreaSqm: 150, maxHeightM: 17.5,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },
  res_group_housing: {
    id: 'res_group_housing', group: 'Residential',
    label: 'Group housing',
    plain: 'An apartment scheme with shared land and facilities',
    note: 'FAR comes from the road width, not the plot size. 10% EWS and 10% LIG are mandatory.',
    farBasis: 'road_width_group_housing', setbackTable: 'group_housing',
    activityId: 'act-group-housing', purchasableFarCategory: 'Residential (Group Housing)',
    compoundingUse: 'residential',
    parkingEcsPer100Sqm: 1.25, minRoadWidthM: 9, minPlotAreaSqm: 1000, maxHeightM: Infinity,
    triggersEwsLig: true, fireNocAbove500Sqm: true,
  },

  com_shop: {
    id: 'com_shop', group: 'Commercial',
    label: 'Retail shop / convenience shopping',
    plain: 'A shop under 100 sqm',
    note: 'The one commercial use permitted inside residential zones as convenience shopping.',
    farBasis: 'road_width_commercial', setbackTable: 'commercial',
    activityId: 'act-retail-shops', purchasableFarCategory: 'Commercial',
    compoundingUse: 'commercial',
    parkingEcsPer100Sqm: 2.0, minRoadWidthM: 6, minPlotAreaSqm: 0, maxHeightM: 15,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },
  com_complex: {
    id: 'com_complex', group: 'Commercial',
    label: 'Commercial complex / showroom',
    plain: 'Shops, offices or a showroom over 100 sqm',
    note: 'Needs a 12 m road, and an impact fee where it sits in a residential zone.',
    farBasis: 'road_width_commercial', setbackTable: 'commercial',
    activityId: 'act-commercial-complex', purchasableFarCategory: 'Commercial',
    compoundingUse: 'commercial',
    parkingEcsPer100Sqm: 2.0, minRoadWidthM: 12, minPlotAreaSqm: 300, maxHeightM: Infinity,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },
  com_mall: {
    id: 'com_mall', group: 'Commercial',
    label: 'Shopping mall / multiplex',
    plain: 'A mall or cinema complex',
    note: 'Needs an 18 m road and a 6 m fire driveway all round.',
    farBasis: 'road_width_commercial', setbackTable: 'commercial',
    activityId: 'act-shopping-mall', purchasableFarCategory: 'Commercial',
    compoundingUse: 'commercial',
    parkingEcsPer100Sqm: 3.0, minRoadWidthM: 18, minPlotAreaSqm: 3000, maxHeightM: Infinity,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },
  com_hotel: {
    id: 'com_hotel', group: 'Commercial',
    label: 'Hotel / motel / resort',
    plain: 'A hotel or guest house',
    note: 'Up to 20 rooms needs a 9 m road; beyond that, 12 m.',
    farBasis: 'road_width_commercial', setbackTable: 'commercial',
    activityId: 'act-hotels-large', purchasableFarCategory: 'Hotels',
    compoundingUse: 'commercial',
    parkingEcsPer100Sqm: 2.0, minRoadWidthM: 12, minPlotAreaSqm: 500, maxHeightM: Infinity,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },
  com_bazaar: {
    id: 'com_bazaar', group: 'Commercial',
    label: 'Bazaar street frontage',
    plain: 'A shop on the ground floor with a home above',
    note: 'Commercial on ground and first floor only, on a road of at least 12 m.',
    farBasis: 'road_width_commercial', setbackTable: 'commercial',
    activityId: 'act-retail-shops', purchasableFarCategory: 'Mixed Use',
    compoundingUse: 'commercial',
    parkingEcsPer100Sqm: 1.5, minRoadWidthM: 12, minPlotAreaSqm: 0, maxHeightM: 15,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },

  office: {
    id: 'office', group: 'Workplace',
    label: 'Office building / IT-ITeS park',
    plain: 'An office building',
    note: 'Priced on the office schedule, which sits between residential and commercial.',
    farBasis: 'road_width_commercial', setbackTable: 'commercial',
    activityId: 'act-it-park', purchasableFarCategory: 'Office Buildings / Institutional',
    compoundingUse: 'office',
    parkingEcsPer100Sqm: 2.0, minRoadWidthM: 12, minPlotAreaSqm: 300, maxHeightM: Infinity,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },

  inst_health: {
    id: 'inst_health', group: 'Institutional',
    label: 'Hospital / nursing home',
    plain: 'A hospital or clinic',
    note: 'Ambulance bays and a wider road; over 50 beds needs 18 m.',
    farBasis: 'road_width_commercial', setbackTable: 'healthcare',
    activityId: 'act-hospital-large', purchasableFarCategory: 'Office Buildings / Institutional',
    compoundingUse: 'facilities',
    parkingEcsPer100Sqm: 1.2, minRoadWidthM: 12, minPlotAreaSqm: 500, maxHeightM: Infinity,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },
  inst_education: {
    id: 'inst_education', group: 'Institutional',
    label: 'School / college',
    plain: 'A school or college',
    note: 'Bus bays sized on roll, and a playground requirement.',
    farBasis: 'road_width_commercial', setbackTable: 'educational',
    activityId: 'act-school', purchasableFarCategory: 'Office Buildings / Institutional',
    compoundingUse: 'facilities',
    parkingEcsPer100Sqm: 0.8, minRoadWidthM: 12, minPlotAreaSqm: 1000, maxHeightM: Infinity,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },
  inst_assembly: {
    id: 'inst_assembly', group: 'Institutional',
    label: 'Assembly — marriage hall, cinema, place of worship',
    plain: 'A hall where people gather',
    note: 'Assembly occupancy: 2 m staircases and the widest road requirement in the code.',
    farBasis: 'road_width_commercial', setbackTable: 'commercial',
    activityId: 'act-marriage-hall', purchasableFarCategory: 'Community Facilities & Infrastructure',
    compoundingUse: 'facilities',
    parkingEcsPer100Sqm: 3.0, minRoadWidthM: 18, minPlotAreaSqm: 1000, maxHeightM: Infinity,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },

  ind_light: {
    id: 'ind_light', group: 'Industrial',
    label: 'Light / non-polluting industry, MSME',
    plain: 'A small workshop or light factory',
    note: 'The only industrial use permitted close to housing.',
    farBasis: 'road_width_commercial', setbackTable: 'industrial',
    activityId: 'act-cottage-industry', purchasableFarCategory: 'Community Facilities & Infrastructure',
    compoundingUse: 'industrial',
    parkingEcsPer100Sqm: 0.75, minRoadWidthM: 9, minPlotAreaSqm: 200, maxHeightM: Infinity,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },
  ind_general: {
    id: 'ind_general', group: 'Industrial',
    label: 'General industry',
    plain: 'A factory',
    note: 'Restricted to industrial zones, with pollution-board clearance.',
    farBasis: 'road_width_commercial', setbackTable: 'industrial',
    activityId: 'act-cottage-industry', purchasableFarCategory: 'Community Facilities & Infrastructure',
    compoundingUse: 'industrial',
    parkingEcsPer100Sqm: 0.75, minRoadWidthM: 18, minPlotAreaSqm: 1000, maxHeightM: Infinity,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },
  ind_warehouse: {
    id: 'ind_warehouse', group: 'Industrial',
    label: 'Warehouse / logistics',
    plain: 'A godown or warehouse',
    note: 'Sized for truck movement: wide roads and deep setbacks for turning.',
    farBasis: 'road_width_commercial', setbackTable: 'industrial',
    activityId: 'act-cottage-industry', purchasableFarCategory: 'Community Facilities & Infrastructure',
    compoundingUse: 'industrial',
    parkingEcsPer100Sqm: 0.5, minRoadWidthM: 18, minPlotAreaSqm: 1000, maxHeightM: Infinity,
    triggersEwsLig: false, fireNocAbove500Sqm: true,
  },

  mixed_use: {
    id: 'mixed_use', group: 'Commercial',
    label: 'Mixed use',
    plain: 'Shops or offices below, homes above',
    note: 'Both the residential and the commercial rules apply to their own floors.',
    farBasis: 'road_width_commercial', setbackTable: 'commercial',
    activityId: 'act-commercial-complex', purchasableFarCategory: 'Mixed Use',
    compoundingUse: 'commercial',
    parkingEcsPer100Sqm: 1.75, minRoadWidthM: 12, minPlotAreaSqm: 300, maxHeightM: Infinity,
    triggersEwsLig: true, fireNocAbove500Sqm: true,
  },
};

export const OCCUPANCY_IDS = Object.keys(OCCUPANCIES) as OccupancyId[];

export const OCCUPANCY_GROUPS: readonly OccupancyGroup[] = [
  'Residential', 'Commercial', 'Workplace', 'Institutional', 'Industrial',
];

export function occupanciesInGroup(group: OccupancyGroup): OccupancyDefinition[] {
  return OCCUPANCY_IDS.map((id) => OCCUPANCIES[id]).filter((o) => o.group === group);
}

export function getOccupancy(id: OccupancyId): OccupancyDefinition {
  return OCCUPANCIES[id] ?? OCCUPANCIES.res_single;
}

/** Height above which progressive fire setbacks and a CFO NOC apply, in metres. */
export const HIGH_RISE_M = 15;
