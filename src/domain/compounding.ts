/**
 * Compounding (शमन) — Chapter 16, verified line by line against the gazette.
 *
 * Every figure in this file is quoted in the block comment above it. The source is
 * docs/source/gazette-tmpr8.txt, the flattened text of the notified byelaws. A rule
 * without a quote has not been checked and does not belong here.
 *
 * What the previous version of this file got wrong, and why it mattered:
 *
 *   1. It priced every deviation as a multiple of the circle rate. The gazette has
 *      *two* different fee bases — a per-square-metre rupee rate (Items 1, 3, 5–10)
 *      and a percentage of the price of land (Items 2, 4, 11, 12) — and several items
 *      charge both at once. Collapsing them into one multiplier made every quote wrong.
 *   2. It added a 10% "administrative surcharge". No such surcharge exists in Chapter 16.
 *      It inflated every quote the app has ever shown.
 *   3. It allowed 100% of the rear setback to be compounded for everyone. The gazette
 *      allows that only for residential plots up to 500 sqm with light and ventilation
 *      otherwise provided; everyone else gets 10%.
 *   4. It made *all* setback deviations non-compoundable above 15 m. The gazette
 *      compounds them at 10% (max 1 m width) subject to Fire NOC.
 *   5. It allowed a 10% height deviation above 15 m and for group housing. The gazette
 *      prints "-" in that cell: height is not compoundable there at all.
 *   6. It did not model the per-unit charge, the plot-size fee bands, the basement head,
 *      the room-dimension heads, the compound-wall head, or the land-division heads.
 */

/** Face of the plot a setback is measured on. Type-only dependency on Chapter 3. */
export type { SetbackFace } from './setbacks';
import type { SetbackFace } from './setbacks';

/**
 * The five fee columns the schedule uses. Every table in 16.3.8 is keyed by these.
 * A building's column is its *predominant* use — 16.3.6.2: "Compounding fee for
 * compoundable construction in mixed land use shall be payable on the highest
 * category use basis."
 */
export type CompoundingUse = 'residential' | 'commercial' | 'office' | 'industrial' | 'facilities';

export const COMPOUNDING_USE_LABEL: Readonly<Record<CompoundingUse, string>> = {
  residential: 'Residential',
  commercial: 'Commercial',
  office: 'Office',
  industrial: 'Industrial',
  facilities: 'Facilities / Others',
};

// ---------------------------------------------------------------------------------
// 16.1.3 — offences that cannot be compounded at any price
// ---------------------------------------------------------------------------------

/**
 * Gazette, 16.1.3: "Following offences shall not be compoundable." Thirteen items,
 * transcribed in the order the gazette lists them. Any one of these ends the
 * assessment — there is no fee that makes the construction lawful.
 */
export interface NonCompoundableFlags {
  /** i. Land reserved for public/semi-public amenities, services, utilities. */
  onPublicAmenityLand: boolean;
  /** ii. Contravention of Master Plan / Zonal Development Plan / layout plan / lease. */
  contravenesLandUse: boolean;
  /** iii. Plots in illegal colonies. */
  inIllegalColony: boolean;
  /** iv. Government or public land without the department's permission. */
  onGovernmentLandWithoutPermission: boolean;
  /** v. Disputed land. */
  onDisputedLand: boolean;
  /** vi. Buildings where earthquake-resistance measures are mandatory (ch. 11.8). */
  earthquakeMeasuresMandatory: boolean;
  /** vii. Firefighting mandatory, or Fire NOC not obtained where mandatory (ch. 10.1.3). */
  fireNocMissing: boolean;
  /** viii. Height violation in heritage / monument / civil aviation / restricted-height area. */
  breachesRestrictedHeightArea: boolean;
  /** ix. Required parking arrangement is not feasible. */
  parkingNotFeasible: boolean;
  /** x. Areas reserved for common areas and facilities in group housing / multi-storey. */
  onReservedCommonArea: boolean;
  /** xi. Land covered by pond, reservoir, river or drain in the plans or revenue records. */
  onWaterBody: boolean;
  /** xii. Buildings where differently-abled access is mandatory (ch. 12). */
  accessibilityMandatory: boolean;
  /** xiii. Mixed use violating the predominant land use criteria. */
  violatesPredominantUse: boolean;
}

export const NON_COMPOUNDABLE_REASONS: Readonly<Record<keyof NonCompoundableFlags, string>> = {
  onPublicAmenityLand:
    'Built on land reserved for public or semi-public amenities, services or utilities — road, railway line, park, green verge or belt (Clause 16.1.3 i)',
  contravenesLandUse:
    'Contravenes the land use prescribed in the Master Plan, Zonal Development Plan, layout plan or lease (Clause 16.1.3 ii)',
  inIllegalColony: 'The plot lies in an illegal colony (Clause 16.1.3 iii)',
  onGovernmentLandWithoutPermission:
    'Built on government or public land without the concerned department’s permission (Clause 16.1.3 iv)',
  onDisputedLand: 'The land is disputed (Clause 16.1.3 v)',
  earthquakeMeasuresMandatory:
    'Earthquake-resistance measures are mandatory for this building under Chapter 11.8 (Clause 16.1.3 vi)',
  fireNocMissing:
    'Firefighting requirements are mandatory, or the Fire NOC has not been obtained where it is mandatory under Chapter 10.1.3 (Clause 16.1.3 vii)',
  breachesRestrictedHeightArea:
    'Breaches the height limit of a heritage zone, protected monument, civil aviation area or other restricted-height area (Clause 16.1.3 viii)',
  parkingNotFeasible:
    'The required parking arrangement is not feasible on the plot (Clause 16.1.3 ix)',
  onReservedCommonArea:
    'Built on area reserved for common areas and facilities in group housing or a multi-storey building (Clause 16.1.3 x)',
  onWaterBody:
    'Built on land covered by a pond, reservoir, river or drain shown in the Master Plan, Zonal Plan or Layout Plan, or recorded in the revenue records (Clause 16.1.3 xi)',
  accessibilityMandatory:
    'Access for differently-abled persons is mandatory for this building under Chapter 12 (Clause 16.1.3 xii)',
  violatesPredominantUse:
    'Mixed-use development violating the predominant land use criteria (Clause 16.1.3 xiii)',
};

// ---------------------------------------------------------------------------------
// 16.2 — the compoundable-limits table
// ---------------------------------------------------------------------------------

/**
 * The table at 16.2 has two columns:
 *
 *   A — "All Buildings <=15-meter and multi-units upto 17.5 meter height except Group Housing"
 *   B — "Buildings >15-meter height and Group Housing except multi-units."
 *
 * So a multi-unit building is in column A up to 17.5 m and column B above it; every
 * other building crosses at 15 m; and group housing is in column B at any height.
 */
export type CompoundingColumn = 'A' | 'B';

export const COMPOUNDING_COLUMN_LABEL: Readonly<Record<CompoundingColumn, string>> = {
  A: 'Buildings up to 15 m, and multi-unit buildings up to 17.5 m (Clause 16.2, column 1)',
  B: 'Buildings above 15 m, and group housing (Clause 16.2, column 2)',
};

export interface BuildingContext {
  /** Height in metres, measured as Chapter 3 measures it. */
  heightM: number;
  /** True for group housing, which is in column B whatever its height. */
  isGroupHousing: boolean;
  /** True for a multi-unit building, which stays in column A up to 17.5 m. */
  isMultiUnit: boolean;
}

export function compoundingColumn(ctx: BuildingContext): CompoundingColumn {
  if (ctx.isGroupHousing) return 'B';
  const ceiling = ctx.isMultiUnit ? 17.5 : 15;
  return ctx.heightM <= ceiling + 1e-9 ? 'A' : 'B';
}

/** One face's compoundable ceiling: a fraction of the setback, and an absolute depth cap. */
export interface SetbackCompoundingLimit {
  /** Fraction of the setback area (or width, where the gazette says width) that may be built on. */
  readonly fraction: number;
  /** Absolute cap on the depth of the encroachment, in metres. Infinity where none is stated. */
  readonly maxDepthM: number;
  /** The gazette's own words for this cell. */
  readonly basis: string;
  /** True where the gazette conditions the allowance on a Fire NOC. */
  readonly requiresFireNoc: boolean;
  /** True where the gazette conditions the allowance on something the app cannot check. */
  readonly condition?: string;
}

export interface CompoundableLimits {
  readonly column: CompoundingColumn;
  readonly setback: Readonly<Record<SetbackFace, SetbackCompoundingLimit>>;
  /** 16.2: "Construction up to a maximum of 10% of total permissible FAR". Both columns. */
  readonly farFraction: number;
  /** 16.2: 10% in column A "without changing the number of floors"; "-" in column B. */
  readonly heightFraction: number;
  readonly heightBasis: string;
  /** 16.2: one extra unit in plotted development (A); proportionate in group housing (B). */
  readonly extraUnits: number | 'proportionate';
  readonly extraUnitsBasis: string;
}

/**
 * Gazette, 16.2, verbatim by cell.
 *
 * Front setback, column A: "25% of front setback area up to a maximum of 1.0 meter"
 * Rear setback, column A:  "Residential: (a) Plot Size up to 500 sqm- 100% compoundable
 *                           in cases where proper provisions have been made for light and
 *                           ventilation. (b) Plot Size > 500 sqm - construction up to
 *                           maximum 10% of the area in rear setback (in addition to
 *                           permissible 40%) / Others: 10 percent of rear setback area"
 * Side setback, column A:  "Construction up to a maximum of 25% of width of side setback"
 * All setbacks, column B:  "10 percent of setback area (maximum up to a width of 1-meter),
 *                           subject to Fire NOC."
 *
 * The column-B cell is printed once, spanning the front, rear and side rows: in the
 * source XML the cells for those rows carry no top or bottom border, which is how the
 * gazette draws a vertically merged cell. It therefore governs all three faces, not
 * only the front. (Contrast the Building Height row, where column B carries an explicit
 * "-": the drafter distinguishes "same rule" from "not allowed".)
 */
export function compoundableLimits(ctx: BuildingContext & {
  plotAreaSqm: number;
  use: CompoundingUse;
}): CompoundableLimits {
  const column = compoundingColumn(ctx);

  if (column === 'B') {
    const cell: SetbackCompoundingLimit = {
      fraction: 0.10,
      maxDepthM: 1.0,
      basis: '10% of the setback area, up to a width of 1 m (Clause 16.2)',
      requiresFireNoc: true,
    };
    return {
      column,
      setback: { front: cell, rear: cell, side1: cell, side2: cell },
      farFraction: 0.10,
      heightFraction: 0,
      heightBasis: 'Not compoundable above 15 m or in group housing — the gazette prints "-" (Clause 16.2)',
      extraUnits: ctx.isGroupHousing ? 'proportionate' : 0,
      extraUnitsBasis: ctx.isGroupHousing
        ? 'Group housing: units proportionate to the percentage of compoundable additional or purchasable FAR (Clause 16.2)'
        : 'No extra unit is compoundable above 15 m outside group housing (Clause 16.2)',
    };
  }

  const front: SetbackCompoundingLimit = {
    fraction: 0.25,
    maxDepthM: 1.0,
    basis: '25% of the front setback area, up to a maximum of 1.0 m (Clause 16.2)',
    requiresFireNoc: false,
  };

  const side: SetbackCompoundingLimit = {
    fraction: 0.25,
    maxDepthM: Infinity,
    basis: '25% of the width of the side setback (Clause 16.2)',
    requiresFireNoc: false,
  };

  const rear: SetbackCompoundingLimit =
    ctx.use === 'residential' && ctx.plotAreaSqm <= 500
      ? {
          fraction: 1.0,
          maxDepthM: Infinity,
          basis: 'Residential plot up to 500 m²: the whole rear setback is compoundable (Clause 16.2)',
          requiresFireNoc: false,
          condition: 'Only where proper provision has been made for light and ventilation.',
        }
      : ctx.use === 'residential'
        ? {
            fraction: 0.10,
            maxDepthM: Infinity,
            basis: 'Residential plot above 500 m²: 10% of the rear setback area, in addition to the 40% already permitted (Clause 16.2)',
            requiresFireNoc: false,
            condition:
              'The "permissible 40%" is the semi-detached rear-setback allowance of Clause 3.2.4.1 Note-1, which does not apply to a corner plot until the side setback is left, nor to a stilt floor.',
          }
        : {
            fraction: 0.10,
            maxDepthM: Infinity,
            basis: 'Non-residential: 10% of the rear setback area (Clause 16.2)',
            requiresFireNoc: false,
          };

  return {
    column,
    setback: { front, rear, side1: side, side2: side },
    farFraction: 0.10,
    heightFraction: 0.10,
    heightBasis:
      '10% above the permissible height, without changing the number of floors (Clause 16.2)',
    extraUnits: 1,
    extraUnitsBasis: 'One unit in plotted development beyond the permissible limit (Clause 16.2)',
  };
}

/**
 * 16.2, both columns: "Construction up to a maximum of 10% of total permissible FAR,
 * in addition to permissible ground coverage." With the note printed under it:
 * "Construction in front, rear and side setbacks shall be counted while calculating
 * the maximum permissible compoundable area."
 */
export const COMPOUNDABLE_FAR_LIMIT = 0.10;

// ---------------------------------------------------------------------------------
// 16.3.8 — Schedule of Compounding Fee (Rule No 4)
// ---------------------------------------------------------------------------------

type UseTable = Readonly<Record<CompoundingUse, number>>;

/**
 * Item 1 — "On construction without permission under permissible ground-coverage and
 * Floor Area Ratio". Residential rupees per square metre, by plot size:
 *   A  Rs. 25 per sqm ... on plots up to 150 sq meter
 *   B  Rs. 38 per sqm ... >150 – 300 sqm
 *   C  Rs. 50 per sqm ... >300 – 500 sqm
 *   E  Rs. 62 per sqm ... >500 sqm/ Group Housing plots
 * (The gazette skips "D".) Other uses are printed as multiples of the residential
 * rate in every row: 2.0 x, 1.5 x, 0.4 x, 0.5 x.
 */
export const ITEM1_UNAUTHORISED_WITHIN_ENVELOPE: readonly {
  readonly label: string;
  readonly overMoreThan: number;
  readonly upToAndIncluding: number;
  readonly residentialRatePerSqm: number;
}[] = [
  { label: 'Up to 150 m²',   overMoreThan: 0,   upToAndIncluding: 150,      residentialRatePerSqm: 25 },
  { label: '>150 to 300 m²', overMoreThan: 150, upToAndIncluding: 300,      residentialRatePerSqm: 38 },
  { label: '>300 to 500 m²', overMoreThan: 300, upToAndIncluding: 500,      residentialRatePerSqm: 50 },
  { label: '>500 m²',        overMoreThan: 500, upToAndIncluding: Infinity, residentialRatePerSqm: 62 },
];

/**
 * The multiplier the schedule applies to the residential rate in every row that is
 * printed as "N x Residential rate": Items 1 and 10, and the Note-1 catch-all.
 */
export const USE_MULTIPLIER: UseTable = {
  residential: 1.0, commercial: 2.0, office: 1.5, industrial: 0.4, facilities: 0.5,
};

/** Item 1 F — "On Compoundable units in addition to permissible units- Rs. 122640 per unit." */
export const ITEM1F_RATE_PER_EXTRA_UNIT = 122_640;

/**
 * Item 2 — "On construction without permission beyond permissible ground-coverage
 * (only on Ground Floor)", as a percentage of the price of land.
 *
 * A — "All Buildings <=15-meter and multi-units upto 17.5 meter height except Group Housing"
 *      a. In Front Setback  100 / 200 / 150 / 40 / 50
 *      b. In Side Setback    75 / 150 / 100 / 40 / 50
 *      c. In Rear Setback    50 / 100 /  75 / 20 / 25
 * B — "On all sides of buildings >15-meter height and Group Housing except multi-units."
 *                           100 / 200 / 150 / 40 / 50
 *
 * Note that the industrial and facilities columns do not follow USE_MULTIPLIER here:
 * front and side are both 40% and 50%, not 40/50 scaled off the residential 100 and 75.
 * The table is transcribed literally for that reason.
 */
export const ITEM2_BEYOND_GROUND_COVERAGE: Readonly<
  Record<CompoundingColumn, Readonly<Record<SetbackFace, UseTable>>>
> = {
  A: {
    front: { residential: 1.00, commercial: 2.00, office: 1.50, industrial: 0.40, facilities: 0.50 },
    side1: { residential: 0.75, commercial: 1.50, office: 1.00, industrial: 0.40, facilities: 0.50 },
    side2: { residential: 0.75, commercial: 1.50, office: 1.00, industrial: 0.40, facilities: 0.50 },
    rear:  { residential: 0.50, commercial: 1.00, office: 0.75, industrial: 0.20, facilities: 0.25 },
  },
  B: {
    front: { residential: 1.00, commercial: 2.00, office: 1.50, industrial: 0.40, facilities: 0.50 },
    side1: { residential: 1.00, commercial: 2.00, office: 1.50, industrial: 0.40, facilities: 0.50 },
    side2: { residential: 1.00, commercial: 2.00, office: 1.50, industrial: 0.40, facilities: 0.50 },
    rear:  { residential: 1.00, commercial: 2.00, office: 1.50, industrial: 0.40, facilities: 0.50 },
  },
};

/**
 * Item 3 — "On construction within permissible ground coverage beyond permissible FAR".
 * Charged twice over: a rupee rate per square metre AND a percentage of the price of
 * the land for the additional floor area.
 *   Residential  Rs. 491 per sqm  and 50%   of required land price for additional floor area
 *   Commercial   Rs. 982 per sqm  and 100%
 *   Office       Rs. 736 per sqm  and 75%
 *   Industrial   Rs. 196 per sqm  and 40%
 *   Facilities   Rs. 246 per sqm  and 50%
 */
export const ITEM3_BEYOND_FAR: Readonly<Record<CompoundingUse, { perSqm: number; landPriceFraction: number }>> = {
  residential: { perSqm: 491, landPriceFraction: 0.50 },
  commercial:  { perSqm: 982, landPriceFraction: 1.00 },
  office:      { perSqm: 736, landPriceFraction: 0.75 },
  industrial:  { perSqm: 196, landPriceFraction: 0.40 },
  facilities:  { perSqm: 246, landPriceFraction: 0.50 },
};

/** Item 4 — "On construction of basement beyond permissible limit", % of price of land. */
export const ITEM4_EXCESS_BASEMENT: UseTable = {
  residential: 0.50, commercial: 1.00, office: 0.75, industrial: 0.20, facilities: 0.25,
};

/** Item 5 — "Internal height of room being less than the minimum prescribed height", ₹/m² of room. */
export const ITEM5_ROOM_HEIGHT: UseTable = {
  residential: 246, commercial: 491, office: 368, industrial: 123, facilities: 185,
};

/** Item 6 — "On width of room being less than minimum prescribed width", ₹/m² of room. */
export const ITEM6_ROOM_WIDTH: UseTable = {
  residential: 123, commercial: 246, office: 185, industrial: 50, facilities: 62,
};

/** Item 7 — "On area of the room being less than the prescribed area", ₹/m² of room. */
export const ITEM7_ROOM_AREA: UseTable = {
  residential: 123, commercial: 246, office: 185, industrial: 50, facilities: 62,
};

/** Item 8 — "On arrangement of light and ventilation ... less than prescribed area", ₹/m² of room. */
export const ITEM8_LIGHT_AND_VENTILATION: UseTable = {
  residential: 123, commercial: 246, office: 185, industrial: 50, facilities: 62,
};

/**
 * Item 9 — "On the height of Compound wall being more than the prescribed height",
 * per running metre, subject to a floor. The office rate of Rs. 383 breaks the
 * 1.5x pattern of the rest of the schedule; it is transcribed as printed.
 */
export const ITEM9_COMPOUND_WALL: Readonly<Record<CompoundingUse, { perRunningM: number; minimum: number }>> = {
  residential: { perRunningM: 123, minimum: 5_000 },
  commercial:  { perRunningM: 246, minimum: 10_000 },
  office:      { perRunningM: 383, minimum: 5_000 },
  industrial:  { perRunningM: 50,  minimum: 1_000 },
  facilities:  { perRunningM: 62,  minimum: 5_000 },
};

/**
 * Item 10 — "On construction beyond permissible building height":
 * "@Rs. 6132/- per running meter of height (measured as per periphery of existing
 * building) per floor", then 2x / 1.5x / 0.4x / 0.5x.
 *
 * The quantity this rate multiplies is ambiguous in the gazette — see the `dispute`
 * this raises in the assessment. The parenthetical "measured as per periphery of
 * existing building" says the running metres are the building's perimeter, which
 * makes the charge perimeter x floors; read literally, "per running meter of height"
 * would make it the metres of excess height instead. The two readings differ by
 * orders of magnitude, so the assessment reports the larger and says so.
 */
export const ITEM10_EXCESS_HEIGHT_RESIDENTIAL_RATE = 6_132;

/**
 * Item 11 — "Land-division/ Development work without approval, which is in conformity
 * with Building byelaws", as a percentage of the price of land on the saleable area.
 */
export const ITEM11_UNAPPROVED_CONFORMING_LAYOUT: UseTable = {
  residential: 0.010, commercial: 0.020, office: 0.015, industrial: 0.0040, facilities: 0.0050,
};

/**
 * Item 12 — layouts up to 1 acre whose approval is not permissible: "Compounding fee at
 * the rate of two times of price of land equivalent to decrease in the area required,
 * as per byelaws, for roads, parks and open spaces and other community amenities."
 */
export const ITEM12_AMENITY_SHORTFALL_MULTIPLE = 2.0;

/**
 * Note-1 — "For any construction in contravention of the byelaws (other than those
 * listed in the above schedule) such as - porch, balcony/chhajja etc., but are
 * compoundable; a compounding fee @Rs. 491/- per square meter shall be charged."
 * Scaled by USE_MULTIPLIER.
 */
export const NOTE1_OTHER_CONTRAVENTION_RATE = 491;

/**
 * Note-2 — "For compounding of 'permitted' activities/uses in accordance with
 * chapter-15 of these byelaws, a fee of @10 percent of the Impact fee shall also be
 * payable, in addition to the Impact Fee payable as per rules."
 */
export const NOTE2_IMPACT_FEE_COMPOUNDING_FRACTION = 0.10;

/**
 * Note-3 — "The rate of compounding fee for charitable institutions, which are exempted
 * under Section-80(G) of Income Tax Act, 1961 and facilities and service provided by
 * public Sector and educational institutions shall be 50 percent of the residential rate."
 */
export const NOTE3_CHARITABLE_FRACTION_OF_RESIDENTIAL = 0.50;

/**
 * Note-4 — "The rates, which are not based on the price of the land, i.e. which are
 * prescribed on the basis of per square meter, shall be updated by the authority every
 * year on the basis of cost index."
 *
 * The schedule as notified is the 2025 base. An authority that has issued a cost-index
 * revision applies it to the per-square-metre heads only, never to the percentage-of-
 * land-price heads. The caller supplies the factor; the default is the notified base.
 */
export const SCHEDULE_BASE_YEAR = 2025;

// ---------------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------------

export interface CompoundingLineItem {
  readonly id: string;
  /** Serial number in the 16.3.8 schedule, or the Note it comes from. */
  readonly scheduleItem: string;
  readonly label: string;
  readonly quantity: number;
  readonly unit: string;
  readonly ratePerUnit: number;
  readonly amount: number;
  /** The gazette's own basis for the rate, in words. */
  readonly basis: string;
  readonly withinStatutoryLimit: boolean;
  readonly limitNote?: string;
  /** Set where the gazette's wording admits more than one reading. */
  readonly dispute?: string;
  /** Set where the allowance is conditional on something the app cannot verify. */
  readonly condition?: string;
}

export interface CompoundingAssessment {
  readonly isCompoundable: boolean;
  readonly column: CompoundingColumn;
  readonly limits: CompoundableLimits;
  readonly blockingReasons: readonly string[];
  readonly lineItems: readonly CompoundingLineItem[];
  /** Sum of every line item. There is no surcharge on top: Chapter 16 levies none. */
  readonly totalPayable: number;
  readonly overLimitItems: readonly CompoundingLineItem[];
  /** Conditions and readings a reviewer has to settle before the figure can be relied on. */
  readonly caveats: readonly string[];
  readonly clauseRef: string;
  /** Land rate actually used, after Clause 16.3.6.1 and Note-3. */
  readonly landRateApplied: number;
}

export interface CompoundingInput {
  use: CompoundingUse;
  /**
   * ₹ per m². Clause 16.3.6.1: "The cost of land shall be assessed at the prevailing
   * residential rate of the Authority, or the non-agriculture circle rate fixed by the
   * District Collector, whichever is higher. For calculation of Compounding fee for all
   * kinds of constructions only the residential rate of the land shall be taken into
   * consideration." So this is the *residential* rate whatever the building's use, and
   * the caller is responsible for taking the higher of the two sources.
   */
  residentialLandRate: number;
  plotAreaSqm: number;

  heightM: number;
  isGroupHousing?: boolean;
  isMultiUnit?: boolean;

  /** Note-3: 80(G) charitable, public-sector or educational — half the residential rate. */
  charitableOrPublicInstitution?: boolean;
  /** Note-4 cost-index factor on the per-square-metre heads. 1 = the notified 2025 base. */
  costIndexFactor?: number;

  flags: Partial<NonCompoundableFlags>;

  /** Item 2 — ground-floor footprint inside each setback, in m². */
  setbackEncroachmentSqm: Partial<Record<SetbackFace, number>>;
  /** Deficit on each face as a fraction of the required setback, for the 16.2 caps. */
  setbackDeficitFraction?: Partial<Record<SetbackFace, number>>;
  /** Deficit on each face in metres, for the 16.2 absolute 1.0 m caps. */
  setbackDeficitM?: Partial<Record<SetbackFace, number>>;
  /** Note-1 — projections (balcony, chhajja, porch) above the ground floor, in m². */
  projectionSqm?: number;

  /** Item 1 — built without permission but inside the permissible envelope, in m². */
  unauthorisedWithinEnvelopeSqm?: number;
  /** Item 1 F — dwelling units beyond the permissible count. */
  extraUnits?: number;

  /** Item 3 — floor area beyond permissible FAR, in m². */
  excessFarSqm: number;
  /** Excess FAR as a fraction of the permissible FAR, for the 10% cap. */
  excessFarFraction?: number;

  /** Item 4 — basement beyond the permissible limit, in m². */
  excessBasementSqm?: number;

  /** Item 10 — height beyond the permissible cap, in m. */
  heightDeviationM: number;
  heightDeviationFraction?: number;
  /** Perimeter of the existing building, in running m. */
  buildingPerimeterM?: number;
  /** Number of floors, which Item 10 charges over. */
  floors?: number;

  /** Item 9 — compound wall above the prescribed height, in running m. */
  compoundWallExcessRunningM?: number;

  /** Items 5–8 — rooms below the prescribed dimension, in m² of room area. */
  roomsBelowMinHeightSqm?: number;
  roomsBelowMinWidthSqm?: number;
  roomsBelowMinAreaSqm?: number;
  roomsBelowLightVentilationSqm?: number;

  /** Item 11 — unapproved but conforming land division, saleable area in m². */
  unapprovedConformingSaleableSqm?: number;
  /** Item 12 — shortfall in amenity/road/park area for a layout up to 1 acre, in m². */
  amenityAreaShortfallSqm?: number;

  /** Note-2 — impact fee assessed under Chapter 15, in ₹. */
  impactFee?: number;
}

const money = (n: number): number => Math.round(n * 100) / 100;
const positive = (n: unknown): number => Math.max(0, Number(n) || 0);

const FACE_LABEL: Readonly<Record<SetbackFace, string>> = {
  front: 'front setback', rear: 'rear setback', side1: 'side setback 1', side2: 'side setback 2',
};

/** Item 1's plot-size band. Group housing is charged at the top band whatever its plot. */
export function item1RatePerSqm(plotAreaSqm: number, isGroupHousing: boolean): number {
  if (isGroupHousing) return 62;
  const band = ITEM1_UNAUTHORISED_WITHIN_ENVELOPE.find(
    (b) => plotAreaSqm > b.overMoreThan && plotAreaSqm <= b.upToAndIncluding,
  );
  return band ? band.residentialRatePerSqm : 62;
}

export function assessCompounding(input: CompoundingInput): CompoundingAssessment {
  const ctx: BuildingContext = {
    heightM: positive(input.heightM),
    isGroupHousing: Boolean(input.isGroupHousing),
    isMultiUnit: Boolean(input.isMultiUnit),
  };
  const limits = compoundableLimits({ ...ctx, plotAreaSqm: positive(input.plotAreaSqm), use: input.use });

  const blockingReasons = (Object.keys(NON_COMPOUNDABLE_REASONS) as (keyof NonCompoundableFlags)[])
    .filter((key) => input.flags[key])
    .map((key) => NON_COMPOUNDABLE_REASONS[key]);

  if (blockingReasons.length > 0) {
    return {
      isCompoundable: false,
      column: limits.column,
      limits,
      blockingReasons,
      lineItems: [],
      totalPayable: 0,
      overLimitItems: [],
      caveats: [],
      clauseRef: 'Clause 16.1.3 — offences that shall not be compoundable',
      landRateApplied: 0,
    };
  }

  // Clause 16.3.6.1 + Note-3.
  const landRate = positive(input.residentialLandRate)
    * (input.charitableOrPublicInstitution ? NOTE3_CHARITABLE_FRACTION_OF_RESIDENTIAL : 1);
  // Note-4 indexes the per-square-metre heads only, never the land-price heads.
  const index = input.costIndexFactor && input.costIndexFactor > 0 ? input.costIndexFactor : 1;
  const perSqmScale = index * (input.charitableOrPublicInstitution ? NOTE3_CHARITABLE_FRACTION_OF_RESIDENTIAL : 1);
  const useMultiplier = USE_MULTIPLIER[input.use];

  const items: CompoundingLineItem[] = [];
  const caveats: string[] = [];

  // ---- Item 1 — unauthorised construction inside the permissible envelope ----------
  const withinEnvelope = positive(input.unauthorisedWithinEnvelopeSqm);
  if (withinEnvelope > 0) {
    const rate = item1RatePerSqm(positive(input.plotAreaSqm), ctx.isGroupHousing)
      * useMultiplier * perSqmScale;
    items.push({
      id: 'item1-within-envelope',
      scheduleItem: '16.3.8 Item 1',
      label: 'Built without permission, but inside the permissible ground coverage and FAR',
      quantity: withinEnvelope,
      unit: 'm²',
      ratePerUnit: money(rate),
      amount: money(withinEnvelope * rate),
      basis: `₹${item1RatePerSqm(positive(input.plotAreaSqm), ctx.isGroupHousing)}/m² residential rate for this plot size${useMultiplier === 1 ? '' : ` × ${useMultiplier} for ${COMPOUNDING_USE_LABEL[input.use].toLowerCase()}`}`,
      withinStatutoryLimit: true,
    });
  }

  // ---- Item 1 F — compoundable units beyond the permissible count -------------------
  const extraUnits = Math.max(0, Math.round(positive(input.extraUnits)));
  if (extraUnits > 0) {
    const allowed = limits.extraUnits === 'proportionate' ? extraUnits : limits.extraUnits;
    const within = limits.extraUnits === 'proportionate' || extraUnits <= allowed;
    const rate = ITEM1F_RATE_PER_EXTRA_UNIT * perSqmScale;
    items.push({
      id: 'item1f-extra-units',
      scheduleItem: '16.3.8 Item 1 F',
      label: 'Dwelling units beyond the permissible count',
      quantity: extraUnits,
      unit: extraUnits === 1 ? 'unit' : 'units',
      ratePerUnit: money(rate),
      amount: money(extraUnits * rate),
      basis: '₹1,22,640 per compoundable unit (Clause 16.3.8 Item 1 F)',
      withinStatutoryLimit: within,
      limitNote: within
        ? undefined
        : `${extraUnits} extra units proposed. ${limits.extraUnitsBasis}`,
      condition: limits.extraUnits === 'proportionate'
        ? 'Group housing: the compoundable count is proportionate to the compoundable additional or purchasable FAR, which the authority determines.'
        : undefined,
    });
    if (limits.extraUnits === 'proportionate') {
      caveats.push('The number of compoundable units in group housing is set proportionately by the authority (Clause 16.2).');
    }
  }

  // ---- Item 2 — ground-floor construction beyond permissible ground coverage --------
  const faces: SetbackFace[] = ['front', 'rear', 'side1', 'side2'];
  for (const face of faces) {
    const qty = positive(input.setbackEncroachmentSqm[face]);
    if (qty <= 0) continue;

    const fraction = ITEM2_BEYOND_GROUND_COVERAGE[limits.column][face][input.use];
    const rate = landRate * fraction;
    const limit = limits.setback[face];
    const deficitFraction = input.setbackDeficitFraction?.[face] ?? 0;
    const deficitM = input.setbackDeficitM?.[face] ?? 0;

    const withinFraction = deficitFraction <= limit.fraction + 1e-9;
    const withinDepth = deficitM <= limit.maxDepthM + 1e-9;
    const within = withinFraction && withinDepth;

    const failed = !withinFraction
      ? `Encroachment is ${(deficitFraction * 100).toFixed(0)}% of the ${FACE_LABEL[face]}; the limit is ${(limit.fraction * 100).toFixed(0)}%.`
      : `Encroachment is ${deficitM.toFixed(2)} m deep; the limit is ${limit.maxDepthM.toFixed(1)} m.`;

    items.push({
      id: `item2-${face}`,
      scheduleItem: '16.3.8 Item 2',
      label: `Ground-floor construction in the ${FACE_LABEL[face]}`,
      quantity: qty,
      unit: 'm²',
      ratePerUnit: money(rate),
      amount: money(qty * rate),
      basis: `${(fraction * 100).toFixed(0)}% of the price of land (₹${landRate.toLocaleString('en-IN')}/m²), ${COMPOUNDING_USE_LABEL[input.use].toLowerCase()}, ${limits.column === 'A' ? 'column A' : 'column B'}`,
      withinStatutoryLimit: within,
      limitNote: within ? undefined : `${failed} ${limit.basis}.`,
      condition: limit.condition,
    });

    if (within && limit.requiresFireNoc) {
      caveats.push(`Compounding the ${FACE_LABEL[face]} above 15 m is allowed only against a Fire NOC (Clause 16.2).`);
    }
    if (within && limit.condition) caveats.push(limit.condition);
  }

  // ---- Note-1 — projections above the ground floor ---------------------------------
  const projections = positive(input.projectionSqm);
  if (projections > 0) {
    const rate = NOTE1_OTHER_CONTRAVENTION_RATE * useMultiplier * perSqmScale;
    items.push({
      id: 'note1-projections',
      scheduleItem: '16.3.8 Note-1',
      label: 'Porch, balcony, chhajja and other projections',
      quantity: projections,
      unit: 'm²',
      ratePerUnit: money(rate),
      amount: money(projections * rate),
      basis: `₹491/m²${useMultiplier === 1 ? '' : ` × ${useMultiplier}`} (Clause 16.3.8 Note-1)`,
      withinStatutoryLimit: true,
      condition: 'Clause 16.3.7.4: projections are compoundable only up to the compoundable limit in the setback area.',
    });
  }

  // ---- Item 3 — floor area beyond permissible FAR ----------------------------------
  const excessFar = positive(input.excessFarSqm);
  if (excessFar > 0) {
    const { perSqm, landPriceFraction } = ITEM3_BEYOND_FAR[input.use];
    const rate = perSqm * perSqmScale + landRate * landPriceFraction;
    const fraction = input.excessFarFraction ?? 0;
    const within = fraction <= limits.farFraction + 1e-9;
    items.push({
      id: 'item3-excess-far',
      scheduleItem: '16.3.8 Item 3',
      label: 'Floor area beyond the permissible FAR',
      quantity: excessFar,
      unit: 'm²',
      ratePerUnit: money(rate),
      amount: money(excessFar * rate),
      basis: `₹${perSqm}/m² plus ${(landPriceFraction * 100).toFixed(0)}% of the price of land for the additional floor area`,
      withinStatutoryLimit: within,
      limitNote: within
        ? undefined
        : `The excess is ${(fraction * 100).toFixed(1)}% of the permissible FAR; Clause 16.2 caps compounding at ${(limits.farFraction * 100).toFixed(0)}%. Clause 16.3.8 Note-5: the authority shall not compound any construction beyond the maximum permissible FAR, and shall ensure demolition of it before considering purchasable FAR.`,
    });
    caveats.push('Clause 16.2 note: construction in the front, rear and side setbacks counts towards this same 10% of permissible FAR — the two allowances are one allowance.');
    caveats.push('Clause 16.3.7.1: additional parking must be provided for compoundable and purchasable FAR.');
  }

  // ---- Item 4 — basement beyond the permissible limit ------------------------------
  const excessBasement = positive(input.excessBasementSqm);
  if (excessBasement > 0) {
    const fraction = ITEM4_EXCESS_BASEMENT[input.use];
    const rate = landRate * fraction;
    items.push({
      id: 'item4-basement',
      scheduleItem: '16.3.8 Item 4',
      label: 'Basement beyond the permissible limit',
      quantity: excessBasement,
      unit: 'm²',
      ratePerUnit: money(rate),
      amount: money(excessBasement * rate),
      basis: `${(fraction * 100).toFixed(0)}% of the price of land`,
      withinStatutoryLimit: true,
      condition: 'Clause 16.3.7.3: where the basement is used for a purpose the byelaws do not permit, the area counts towards FAR and is compoundable only if standard parking is available inside the plot.',
    });
  }

  // ---- Items 5–8 — rooms below the prescribed dimensions ---------------------------
  const roomHeads: readonly [keyof CompoundingInput, string, string, UseTable][] = [
    ['roomsBelowMinHeightSqm', '16.3.8 Item 5', 'Rooms below the minimum internal height', ITEM5_ROOM_HEIGHT],
    ['roomsBelowMinWidthSqm', '16.3.8 Item 6', 'Rooms below the minimum width', ITEM6_ROOM_WIDTH],
    ['roomsBelowMinAreaSqm', '16.3.8 Item 7', 'Rooms below the minimum area', ITEM7_ROOM_AREA],
    ['roomsBelowLightVentilationSqm', '16.3.8 Item 8', 'Rooms below the prescribed light and ventilation', ITEM8_LIGHT_AND_VENTILATION],
  ];
  for (const [key, scheduleItem, label, table] of roomHeads) {
    const qty = positive(input[key]);
    if (qty <= 0) continue;
    const rate = table[input.use] * perSqmScale;
    items.push({
      id: `item-${key}`,
      scheduleItem,
      label,
      quantity: qty,
      unit: 'm² of room area',
      ratePerUnit: money(rate),
      amount: money(qty * rate),
      basis: `₹${table[input.use]}/m² on the area of the room`,
      withinStatutoryLimit: true,
    });
  }

  // ---- Item 9 — compound wall above the prescribed height --------------------------
  const wall = positive(input.compoundWallExcessRunningM);
  if (wall > 0) {
    const { perRunningM, minimum } = ITEM9_COMPOUND_WALL[input.use];
    const rate = perRunningM * perSqmScale;
    const raw = wall * rate;
    const amount = Math.max(raw, minimum * perSqmScale);
    items.push({
      id: 'item9-compound-wall',
      scheduleItem: '16.3.8 Item 9',
      label: 'Compound wall above the prescribed height',
      quantity: wall,
      unit: 'running m',
      ratePerUnit: money(rate),
      amount: money(amount),
      basis: `₹${perRunningM} per running metre, subject to a minimum of ₹${minimum.toLocaleString('en-IN')}`,
      withinStatutoryLimit: true,
    });
  }

  // ---- Item 10 — height beyond the permissible cap ---------------------------------
  const heightDev = positive(input.heightDeviationM);
  if (heightDev > 0) {
    const heightFraction = input.heightDeviationFraction ?? 0;
    const within = limits.heightFraction > 0 && heightFraction <= limits.heightFraction + 1e-9;

    const perimeter = positive(input.buildingPerimeterM);
    const floors = Math.max(1, Math.round(positive(input.floors)) || 1);
    const rate = ITEM10_EXCESS_HEIGHT_RESIDENTIAL_RATE * useMultiplier * perSqmScale;

    // Two readings of "per running meter of height (measured as per periphery of
    // existing building) per floor". Charge the larger and name the other.
    const byPerimeter = perimeter * floors;
    const byHeight = heightDev;
    const quantity = Math.max(byPerimeter, byHeight);

    items.push({
      id: 'item10-height',
      scheduleItem: '16.3.8 Item 10',
      label: 'Height beyond the permissible cap',
      quantity,
      unit: 'running m',
      ratePerUnit: money(rate),
      amount: money(quantity * rate),
      basis: `₹6,132 per running metre${useMultiplier === 1 ? '' : ` × ${useMultiplier}`}, measured on the periphery of the existing building, per floor`,
      withinStatutoryLimit: within,
      limitNote: within
        ? undefined
        : limits.heightFraction === 0
          ? `${limits.heightBasis}. The height has to come down.`
          : `The deviation is ${(heightFraction * 100).toFixed(1)}% above the permissible height; ${limits.heightBasis}.`,
      dispute: byPerimeter !== byHeight
        ? `The gazette's quantity for this head is ambiguous: "per running meter of height (measured as per periphery of existing building) per floor". Read as the building's perimeter over ${floors} floor${floors === 1 ? '' : 's'} it is ${byPerimeter.toFixed(1)} m; read as the metres of excess height it is ${byHeight.toFixed(2)} m. The larger is charged here.`
        : undefined,
    });

    if (within) {
      caveats.push('Clause 16.2: a height deviation is compoundable only if the number of floors does not change.');
    }
  }

  // ---- Item 11 — unapproved but conforming land division ---------------------------
  const saleable = positive(input.unapprovedConformingSaleableSqm);
  if (saleable > 0) {
    const fraction = ITEM11_UNAPPROVED_CONFORMING_LAYOUT[input.use];
    const rate = landRate * fraction;
    items.push({
      id: 'item11-layout',
      scheduleItem: '16.3.8 Item 11',
      label: 'Land division or development carried out without approval, conforming to the byelaws',
      quantity: saleable,
      unit: 'm² of saleable area',
      ratePerUnit: money(rate),
      amount: money(saleable * rate),
      basis: `${(fraction * 100).toFixed(2)}% of the price of land on the saleable area`,
      withinStatutoryLimit: true,
    });
  }

  // ---- Item 12 — amenity shortfall in a layout up to 1 acre ------------------------
  const shortfall = positive(input.amenityAreaShortfallSqm);
  if (shortfall > 0) {
    const rate = landRate * ITEM12_AMENITY_SHORTFALL_MULTIPLE;
    items.push({
      id: 'item12-amenity-shortfall',
      scheduleItem: '16.3.8 Item 12',
      label: 'Shortfall in the area required for roads, parks, open spaces and community amenities',
      quantity: shortfall,
      unit: 'm²',
      ratePerUnit: money(rate),
      amount: money(shortfall * rate),
      basis: 'Two times the price of land, on the area by which the required provision falls short',
      withinStatutoryLimit: true,
      condition: 'Clause 16.3.8 Item 12 applies to layouts up to one acre. Above that, Item 13 sends the matter to the government’s guidelines for regularisation of unauthorised colonies.',
    });
  }

  // ---- Note-2 — compounding of a Chapter 15 permitted activity ---------------------
  const impactFee = positive(input.impactFee);
  if (impactFee > 0) {
    items.push({
      id: 'note2-impact-fee',
      scheduleItem: '16.3.8 Note-2',
      label: 'Compounding charge on a Chapter 15 permitted activity',
      quantity: 1,
      unit: 'assessment',
      ratePerUnit: money(impactFee * NOTE2_IMPACT_FEE_COMPOUNDING_FRACTION),
      amount: money(impactFee * NOTE2_IMPACT_FEE_COMPOUNDING_FRACTION),
      basis: '10% of the impact fee, payable in addition to the impact fee itself',
      withinStatutoryLimit: true,
    });
  }

  const overLimitItems = items.filter((i) => !i.withinStatutoryLimit);
  const totalPayable = money(items.reduce((sum, i) => sum + i.amount, 0));

  if (input.charitableOrPublicInstitution) {
    caveats.push('Charged at 50% of the residential rate under Clause 16.3.8 Note-3 (80(G) charitable institution, public-sector or educational facility).');
  }
  if (index !== 1) {
    caveats.push(`Per-square-metre rates indexed by ×${index} under Clause 16.3.8 Note-4. Percentage-of-land-price heads are not indexed.`);
  }
  caveats.push('Clause 16.3.7.2: purchasable FAR charges are payable in addition to this, except on the first 10% of purchasable FAR.');
  caveats.push('Clause 16.3.4.2: the fee may be paid in instalments carrying interest at MCLR + 1%.');

  return {
    isCompoundable: overLimitItems.length === 0,
    column: limits.column,
    limits,
    blockingReasons: overLimitItems.map((i) => i.limitNote!).filter(Boolean),
    lineItems: items,
    totalPayable,
    overLimitItems,
    caveats: [...new Set(caveats)],
    clauseRef: 'Chapter 16 — Clause 16.2 (compoundable limits) and Clause 16.3.8 (Schedule of Compounding Fee, Rule No 4)',
    landRateApplied: money(landRate),
  };
}
