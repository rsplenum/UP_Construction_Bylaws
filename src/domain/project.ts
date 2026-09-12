/**
 * The project model every screen shares.
 *
 * Previously each tab kept its own plot area, road width and occupancy, so a user
 * describing one building had to re-enter it four times and could get four different
 * verdicts. This is the one description of the site; screens read it and patch it.
 */

import type { AreaType } from './far';
import type { ZoneCode } from './zoning';
import { OccupancyId, OCCUPANCIES } from './occupancy';

export type GreenRating = 'none' | 'silver' | 'gold' | 'platinum';

/** How much of the app to show. Same engine, same verdict; different depth. */
export type Mode = 'simple' | 'advanced';

/**
 * The four occupancy names the first version of the app used, mapped onto the full
 * taxonomy so a project saved before the rebuild still opens.
 */
export const LEGACY_OCCUPANCY: Readonly<Record<string, OccupancyId>> = {
  single_unit: 'res_single',
  multi_unit: 'res_multi',
  group_housing: 'res_group_housing',
  commercial: 'com_complex',
};

export interface ProjectState {
  /** Free-text label used in reports and saved sessions. */
  projectName: string;
  applicantName: string;
  plotNumber: string;
  schemeName: string;
  cityName: string;
  architectName: string;
  engineerName: string;

  occupancy: OccupancyId;
  /** sqm */
  plotArea: number;
  /** m — road-facing edge */
  plotFrontage: number;
  /** m — derived when not set explicitly */
  plotDepth: number;
  /** m — right of way of the abutting primary road */
  roadWidth: number;
  /** m — to terrace level, excluding mumty and water tank */
  buildingHeight: number;
  /** sqm */
  proposedBuiltUpArea: number;

  isCornerPlot: boolean;
  hasStilt: boolean;

  /**
   * Whether the site sits inside an already built-up area or a new layout. It changes
   * the FAR ceiling (B-013), the minimum road width and the minimum plot size — a single
   * dwelling needs 4 m of road in a built-up area and 9 m in a new layout (Clause 4.1.3).
   *
   * Built-up is the default because it is the commoner case, but note that it is NOT
   * uniformly the conservative one: it gives the lower FAR ceiling but the laxer access
   * and plot-size thresholds.
   */
  areaType: AreaType;

  /**
   * The land-use zone the master plan or zonal development plan puts this plot in.
   *
   * Clause 15.3 answers the app's first question — may this use go here at all — from a
   * table of 53 activities against these 16 zones, and until this field existed the engine
   * could not read a single cell of it. `'unknown'` is the honest default: an applicant who
   * has not looked the zone up gets the road-width and plot-size checks and is told plainly
   * that the land-use question is unanswered, rather than being given a verdict derived from
   * a guess.
   */
  masterPlanZone: ZoneCode | 'unknown';

  /** Clause 4.4 Note-2 exempts a qualifying affordable-housing scheme from EWS/LIG. */
  isAffordableHousingScheme: boolean;

  frontSetbackProvided: number;
  rearSetbackProvided: number;
  side1Provided: number;
  side2Provided: number;

  parkingBaysProvided: number;
  hasRWH: boolean;
  /**
   * Solar water heating — Clause 13.2.3.2, which binds six named categories of building
   * that have a hot water installation, and sets no plot-size threshold.
   */
  hasSolarHeating: boolean;
  /**
   * Solar photovoltaics — Clause 13.2.3.1, "All plots having size 500 sqm and above shall
   * install solar photovoltaic power generation system."
   *
   * A separate field because they are separate obligations on separate triggers, and the
   * engine used to hold one boolean for both: it required water heating on the plot-size
   * trigger that belongs to photovoltaics, so a 600 m² house was told to install the wrong
   * system and a 400 m² hotel was told nothing (B-035).
   */
  hasSolarPv: boolean;
  greenRating: GreenRating;

  /**
   * ₹ per sqm, and the basis of every fee figure in the app. Clause 16.3.7(c): "The cost
   * of land shall be assessed at the prevailing residential rate of the Authority, or
   * the non-agriculture circle rate fixed by the District Collector, whichever is
   * higher. For calculation of Compounding fee for all kinds of constructions only the
   * residential rate of the land shall be taken into consideration." So this is the
   * RESIDENTIAL rate — the higher of the two sources — whatever the building's use.
   */
  circleRate: number;

  /**
   * A ground coverage cap read off the applicant's own notified master plan or zonal
   * development plan, as a percentage of plot area. `0` means none stated.
   *
   * Clause 3.2.2 prints no coverage percentage for any occupancy this engine models — its
   * Ground Coverage column reads "Max. coverage after ensuring setbacks", and Clause
   * 2.1.3.2's worked example puts a 20 m x 25 m plot at 76% (B-056). A zonal plan CAN cap
   * it lower, and where it does its figure governs.
   *
   * The engine will not supply that figure itself. `upGisMasterPlanData.ts` carries zonal
   * coverage percentages, but they are illustrative zoning against hand-drawn polygons
   * rather than a notified plan for any particular plot, and applying one would present a
   * guess about which polygon a plot sits in as law — in the restrictive direction, where
   * nobody would question it (V-064). The applicant can read their own plan; the engine
   * cannot. So this is an input.
   *
   * `0` rather than `null` as the empty value, because `sanitize()` in `ProjectContext`
   * types persisted fields against the default and a numeric default keeps a saved project
   * loading. A zonal plan that permits construction at all does not print 0% coverage; a
   * zone where nothing may be built is a Clause 15.3 prohibition, not a coverage cap.
   */
  zonalCoverageCapPct: number;

  /** Which depth of the app the person is working in. */
  mode: Mode;

  /** WGS84, set by picking a point on the GIS map. */
  latitude?: number;
  longitude?: number;

  lastSavedAt?: string;
}

export const DEFAULT_PROJECT: ProjectState = {
  projectName: '',
  applicantName: '',
  plotNumber: '',
  schemeName: '',
  cityName: 'Lucknow',
  architectName: '',
  engineerName: '',

  occupancy: 'res_single',
  plotArea: 320,
  plotFrontage: 14,
  plotDepth: 22.86,
  roadWidth: 12,
  buildingHeight: 12,
  proposedBuiltUpArea: 450,

  isCornerPlot: false,
  hasStilt: true,
  areaType: 'built_up',
  masterPlanZone: 'unknown',
  isAffordableHousingScheme: false,

  frontSetbackProvided: 3.5,
  rearSetbackProvided: 3.0,
  side1Provided: 1.5,
  side2Provided: 1.5,

  parkingBaysProvided: 4,
  hasRWH: true,
  hasSolarHeating: false,
  hasSolarPv: false,
  greenRating: 'none',

  circleRate: 35000,
  zonalCoverageCapPct: 0,
  mode: 'simple',
};

/** Kept for call sites that want a short name without importing the whole definition. */
export function occupancyLabel(id: OccupancyId): string {
  return OCCUPANCIES[id]?.label ?? id;
}

export function occupancyPlain(id: OccupancyId): string {
  return OCCUPANCIES[id]?.plain ?? id;
}

/** Plot depth is optional input; fall back to the area/frontage rectangle. */
export function derivePlotDepth(project: Pick<ProjectState, 'plotArea' | 'plotFrontage' | 'plotDepth'>): number {
  if (project.plotDepth > 0) return project.plotDepth;
  if (project.plotFrontage > 0) return project.plotArea / project.plotFrontage;
  return 0;
}
