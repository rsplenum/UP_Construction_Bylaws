export interface ByelawChapter {
  id: number;
  chapterNumber: string;
  title: string;
  pageRange: string;
  summary: string;
  sections: ByelawSection[];
}

export interface ByelawSection {
  id: string;
  clauseNumber: string;
  title: string;
  content: string;
  subsections?: {
    clauseNumber: string;
    title: string;
    content: string;
    bullets?: string[];
  }[];
  table?: {
    headers: string[];
    rows: string[][];
    caption?: string;
  };
  notes?: string[];
}

export interface DefinitionItem {
  id: number;
  term: string;
  definition: string;
  category: 'General' | 'FAR & Area' | 'Building Features' | 'Zoning' | 'Infrastructure' | 'Occupancy';
}

export interface DeemedNocDept {
  id: number;
  department: string;
  applicability: string;
  timeDays: string;
  notes?: string;
}

export interface PlottedSetbackRule {
  plotRange: string;
  minPlotArea: number;
  maxPlotArea: number;
  front: number;
  rear: number;
  side1: number;
  side2: number;
  type: string;
  notes: string;
}

export interface HighRiseSetbackRule {
  heightRange: string;
  minHeight: number;
  maxHeight: number;
  front: number;
  rear: number;
  side1: number;
  side2: number;
}

export interface FarExemptionItem {
  id: number;
  structure: string;
  singleMultiRes: boolean;
  groupHousing: boolean;
  commercialMixed: boolean;
  office: boolean;
  institutional: boolean;
  industrial: boolean;
  notes?: string;
}

export interface DevelopmentAuthorityUseZone {
  code: number;
  name: string;
  zones: {
    standardZone: string;
    localZoneName: string;
  }[];
}

export interface CompoundingRate {
  id: string;
  category: string;
  description: string;
  residential: string;
  commercial: string;
  office: string;
  industrial: string;
  facilities: string;
}

export interface NonResidentialSetbackRule {
  id: string;
  category: 'commercial' | 'healthcare' | 'educational' | 'industrial';
  plotRange: string;
  minPlotArea: number;
  maxPlotArea: number;
  front: number;
  rear: number;
  side1: number;
  side2: number;
  maxGroundCoveragePct?: number;
  maxHeightMeters?: number;
  minRoadWidthMeters?: number;
  clauseRef: string;
  notes?: string;
}

export interface BazaarStreetSetbackRule {
  roadWidthMeters: number;
  frontSetbackMeters: number;
  clauseRef: string;
  notes?: string;
}

export interface TelescopicSlab {
  slabIndex: number;
  slabRange: string;
  slabPlotArea: number;
  slabBaseFAR: number;
  slabBuiltUpArea: number;
}

export interface TelescopicFarResult {
  plotArea: number;
  slabs: TelescopicSlab[];
  totalBaseBuiltUpArea: number;
  effectiveBaseFAR: number;
  maxPermissibleFAR: number;
  maxPermissibleBuiltUpArea: number;
  purchasableFARCap: number;
  purchasableAreaAvailable: number;
}

export interface GroupHousingRoadFarRule {
  roadWidthRange: string;
  minRoadWidth: number;
  maxRoadWidth: number;
  builtUpBaseFar: number;
  builtUpPurchasableFar: number;
  builtUpMaxFar: number;
  nonBuiltUpBaseFar: number;
  nonBuiltUpPurchasableFar: number;
  nonBuiltUpMaxFar: number;
  minPlotAreaBuiltUp: number;
  minPlotAreaNonBuiltUp: number;
  clauseRef: string;
}

export interface CommercialRoadFarRule {
  category: string;
  roadWidthRange: string;
  minRoadWidth: number;
  maxRoadWidth: number;
  minPlotArea: number;
  baseFar: number;
  purchasableFar: number;
  maxFar: number;
  maxGroundCoveragePct: number;
  clauseRef: string;
  notes?: string;
}

export type StandardZoneCode = 'BU' | 'R' | 'MU' | 'C-1' | 'C-2' | 'SI' | 'LI' | 'PSP' | 'RC' | 'A';

export type PermissibilityStatus = 'Permitted' | 'Conditional' | 'Prohibited';

export interface ActivityPermissibilityRule {
  activityId: string;
  activityName: string;
  category: string;
  zonePermissibility: Record<StandardZoneCode, {
    status: PermissibilityStatus;
    conditions?: string;
  }>;
  statutoryNotes?: string;
  clauseRef: string;
}

export type RoadFrontagePreset = '1_side' | '2_side_corner' | '2_side_through' | '3_side' | '4_side';

export interface SiteRoadsConfig {
  preset: RoadFrontagePreset;
  frontWidth: number;   // Front (South) Road in meters (mandatory primary road)
  hasRearRoad: boolean; // Rear (North) Road
  rearWidth: number;    // Rear Road in meters
  hasSide1Road: boolean;// Side-1 (West) Road
  side1Width: number;   // Side-1 Road in meters
  hasSide2Road: boolean;// Side-2 (East / Corner) Road
  side2Width: number;   // Side-2 Road in meters
}
