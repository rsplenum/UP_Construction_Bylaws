/**
 * The project model every screen shares.
 *
 * Previously each tab kept its own plot area, road width and occupancy, so a user
 * describing one building had to re-enter it four times and could get four different
 * verdicts. This is the one description of the site; screens read it and patch it.
 */

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

  frontSetbackProvided: number;
  rearSetbackProvided: number;
  side1Provided: number;
  side2Provided: number;

  parkingBaysProvided: number;
  hasRWH: boolean;
  hasSolarHeating: boolean;
  greenRating: GreenRating;

  /**
   * ₹ per sqm, and the basis of every fee figure in the app. Clause 16.3.6.1: "The cost
   * of land shall be assessed at the prevailing residential rate of the Authority, or
   * the non-agriculture circle rate fixed by the District Collector, whichever is
   * higher. For calculation of Compounding fee for all kinds of constructions only the
   * residential rate of the land shall be taken into consideration." So this is the
   * RESIDENTIAL rate — the higher of the two sources — whatever the building's use.
   */
  circleRate: number;

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

  frontSetbackProvided: 3.5,
  rearSetbackProvided: 3.0,
  side1Provided: 1.5,
  side2Provided: 1.5,

  parkingBaysProvided: 4,
  hasRWH: true,
  hasSolarHeating: false,
  greenRating: 'none',

  circleRate: 35000,
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
