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
import type { AreaType } from './far';

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
export type SetbackTable =
  | 'plotted_residential' | 'group_housing' | 'commercial'
  | 'healthcare' | 'educational' | 'industrial'
  /** Clause 5.1.5 — the one setback table keyed on road width rather than plot area. */
  | 'bazaar_street';

/** A threshold that is either flat, or different in a built-up area and a new layout. */
export type AreaTypeValue = number | Readonly<Record<AreaType, number>>;

export function forArea(value: AreaTypeValue, areaType: AreaType): number {
  return typeof value === 'number' ? value : value[areaType];
}

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
  /**
   * Several Chapter 4 thresholds differ between a built-up area and a new layout, and the
   * built-up figure is the laxer one — 4 m of road against 9 m for a single dwelling.
   * Holding only the built-up value understates what a new layout requires, which is the
   * same shape of error as B-013.
   */
  minRoadWidthM: AreaTypeValue;
  /** Minimum plot area in sqm, where the byelaws set one. */
  minPlotAreaSqm: AreaTypeValue;
  /** Height ceiling in metres; Infinity where only road width and fire clearance govern. */
  maxHeightM: number;

  /** Triggers the EWS/LIG reservation under Chapter 4. */
  /**
   * True for a housing project with more than one dwelling unit, which is the trigger
   * Clause 4.3.1 uses: "For all housing projects (except affordable housing schemes)
   * having more than one unit, a 10% each of the total units shall be mandatorily
   * reserved for Economically Weaker Section (EWS) and Lower Income Group (LIG)".
   *
   * It was previously `triggersEwsLig` and was false for multi-unit plotted development,
   * which exempted it from an obligation the gazette places on any project above one
   * unit (B-014).
   */
  multiUnitHousing: boolean;
  /** Requires a Chief Fire Officer NOC once the built-up area passes 500 sqm. */
  fireNocAbove500Sqm: boolean;
}

export const OCCUPANCIES: Readonly<Record<OccupancyId, OccupancyDefinition>> = {
  res_single: {
    id: 'res_single', group: 'Residential',
    label: 'Plotted residential — single dwelling',
    plain: 'A house for one family',
    note: 'Telescopic FAR: the larger the plot, the lower the ratio on each additional slab. Three floors plus stilt to 15 m up to a 300 m² plot; four plus stilt to 17.5 m above it.',
    farBasis: 'telescopic_plotted', setbackTable: 'plotted_residential',
    activityId: 'act-single-unit', purchasableFarCategory: 'Residential (Plotted)',
    compoundingUse: 'residential',
    parkingEcsPer100Sqm: 0.5,
    // Clause 4.1.3(i): 4 m in built-up areas, 9 m in non-built-up. (A 7.5 m access is
    // allowed in a non-built-up area where plots sit on one side of the road only —
    // a layout fact the app cannot see, so the stricter 9 m stands.)
    minRoadWidthM: { built_up: 4, non_built_up: 9 },
    // Clause 4.1.2(i): 40 sqm in a non-built-up area, no restriction in a built-up one.
    minPlotAreaSqm: { built_up: 0, non_built_up: 40 },
    // Clause 4.1.4: "15-m including stilt for single unit". Chapter 3.2.4.1 instead keys
    // the 15/17.5 split on plot size. The two disagree; see V-010. The stricter of the
    // two applies, so a single unit is capped at 15 m whatever its plot.
    maxHeightM: 15,
    multiUnitHousing: false, fireNocAbove500Sqm: false,
  },
  res_multi: {
    id: 'res_multi', group: 'Residential',
    label: 'Plotted residential — multiple dwellings',
    plain: 'A building with several separate flats on one plot',
    note: 'Needs a 9 m road and stilt parking; height ceiling rises to 17.5 m.',
    farBasis: 'telescopic_plotted', setbackTable: 'plotted_residential',
    activityId: 'act-multi-unit', purchasableFarCategory: 'Residential (Plotted)',
    compoundingUse: 'residential',
    parkingEcsPer100Sqm: 1.0,
    minRoadWidthM: 9,                    // Clause 4.1.3(ii)
    minPlotAreaSqm: 150,                 // Clause 4.1.2(ii); each unit ≥60 sqm carpet
    maxHeightM: 17.5,                    // Clause 4.1.4, with mandatory stilt
    multiUnitHousing: true, fireNocAbove500Sqm: true,
  },
  res_group_housing: {
    id: 'res_group_housing', group: 'Residential',
    label: 'Group housing',
    plain: 'An apartment scheme with shared land and facilities',
    note: 'FAR comes from the road width, not the plot size. 10% EWS and 10% LIG are mandatory.',
    farBasis: 'road_width_group_housing', setbackTable: 'group_housing',
    activityId: 'act-group-housing', purchasableFarCategory: 'Residential (Group Housing)',
    compoundingUse: 'residential',
    parkingEcsPer100Sqm: 1.25,
    minRoadWidthM: { built_up: 9, non_built_up: 12 },        // Clause 4.2.3
    minPlotAreaSqm: { built_up: 1000, non_built_up: 1500 },  // Clause 4.2.2
    maxHeightM: Infinity,                                    // Clause 4.2.4: no ceiling
    multiUnitHousing: true, fireNocAbove500Sqm: true,
  },

  com_shop: {
    id: 'com_shop', group: 'Commercial',
    label: 'Retail shop / convenience shopping',
    plain: 'A shop under 100 sqm',
    note: 'The one commercial use permitted inside residential zones as convenience shopping.',
    farBasis: 'road_width_commercial', setbackTable: 'commercial',
    activityId: 'act-retail-shops', purchasableFarCategory: 'Commercial',
    compoundingUse: 'commercial',
    parkingEcsPer100Sqm: 2.0,
    // Clause 5.2.3: retail shops need 6 m in a built-up area and 9 m in a new layout.
    // (Convenience shopping and commercial units need 12 m — see V-013, they share this
    // occupancy but not this threshold.)
    minRoadWidthM: { built_up: 6, non_built_up: 9 },
    minPlotAreaSqm: 10,                  // Clause 5.2.2: retail shops ">10 to 100" sqm
    // Clause 5.2.4: "There shall be no restriction on building height for commercial
    // buildings i.e. shops, commercial complex, shopping malls."
    maxHeightM: Infinity,
    multiUnitHousing: false, fireNocAbove500Sqm: true,
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
    multiUnitHousing: false, fireNocAbove500Sqm: true,
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
    multiUnitHousing: false, fireNocAbove500Sqm: true,
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
    multiUnitHousing: false, fireNocAbove500Sqm: true,
  },
  com_bazaar: {
    id: 'com_bazaar', group: 'Commercial',
    label: 'Bazaar street frontage',
    plain: 'A shop on the ground floor with a home above',
    note: 'Commercial on ground and first floor only, on a road of at least 12 m.',
    farBasis: 'road_width_commercial', setbackTable: 'bazaar_street',
    activityId: 'act-retail-shops', purchasableFarCategory: 'Mixed Use',
    compoundingUse: 'commercial',
    parkingEcsPer100Sqm: 1.5,
    minRoadWidthM: 12,
    minPlotAreaSqm: 0,
    // Clause 5.1.3(i): "There shall be no restriction on building height for bazaar
    // streets", subject to monument, airport funnel and other statutory limits.
    maxHeightM: Infinity,
    multiUnitHousing: false, fireNocAbove500Sqm: true,
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
    multiUnitHousing: false, fireNocAbove500Sqm: true,
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
    multiUnitHousing: false, fireNocAbove500Sqm: true,
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
    multiUnitHousing: false, fireNocAbove500Sqm: true,
  },
  inst_assembly: {
    id: 'inst_assembly', group: 'Institutional',
    label: 'Assembly — marriage hall, cinema, place of worship',
    plain: 'A hall where people gather',
    note: 'Assembly occupancy: 2 m staircases and the widest road requirement in the code.',
    farBasis: 'road_width_commercial', setbackTable: 'commercial',
    activityId: 'act-marriage-hall', purchasableFarCategory: 'Community Facilities & Infrastructure',
    compoundingUse: 'facilities',
    parkingEcsPer100Sqm: 3.0,
    // Clause 6.3.3: 18 m up to a 3000 m² plot, 24 m above it. The engine has no way to
    // express a road minimum that depends on plot size, so it holds the lower figure and
    // the finding names the larger — see V-019.
    minRoadWidthM: 18,
    minPlotAreaSqm: { built_up: 750, non_built_up: 1000 },   // Clause 6.3.2
    maxHeightM: Infinity,                                     // Clause 6.3.5: no ceiling
    multiUnitHousing: false, fireNocAbove500Sqm: true,
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
    multiUnitHousing: false, fireNocAbove500Sqm: true,
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
    multiUnitHousing: false, fireNocAbove500Sqm: true,
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
    multiUnitHousing: false, fireNocAbove500Sqm: true,
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
    multiUnitHousing: true, fireNocAbove500Sqm: true,
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
