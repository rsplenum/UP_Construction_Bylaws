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
