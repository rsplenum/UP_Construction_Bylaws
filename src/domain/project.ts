/**
 * The project model every screen shares.
 *
 * Previously each tab kept its own plot area, road width and occupancy, so a user
 * describing one building had to re-enter it four times and could get four different
 * verdicts. This is the one description of the site; screens read it and patch it.
 */

export type Occupancy = 'single_unit' | 'multi_unit' | 'group_housing' | 'commercial';
export type GreenRating = 'none' | 'silver' | 'gold' | 'platinum';

export interface ProjectState {
  /** Free-text label used in reports and saved sessions. */
  projectName: string;
  applicantName: string;
  plotNumber: string;
  schemeName: string;
  cityName: string;
  architectName: string;
  engineerName: string;

  occupancy: Occupancy;
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

  /** ₹ per sqm — district circle rate, drives every fee figure in the app. */
  circleRate: number;

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

  occupancy: 'single_unit',
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
};

export const OCCUPANCY_LABELS: Readonly<Record<Occupancy, string>> = {
  single_unit: 'Single-Unit Plotted',
  multi_unit: 'Multi-Unit Plotted',
  group_housing: 'Group Housing',
  commercial: 'Commercial',
};

/** Plot depth is optional input; fall back to the area/frontage rectangle. */
export function derivePlotDepth(project: Pick<ProjectState, 'plotArea' | 'plotFrontage' | 'plotDepth'>): number {
  if (project.plotDepth > 0) return project.plotDepth;
  if (project.plotFrontage > 0) return project.plotArea / project.plotFrontage;
  return 0;
}
