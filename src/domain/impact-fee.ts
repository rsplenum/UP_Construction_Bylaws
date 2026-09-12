/**
 * Clause 15.4 — the impact fee, and the third statutory charge the engine never held.
 *
 * The app has priced purchasable FAR since Clause 9.2.5 was read (`purchasable-fee.ts`)
 * and the shelter fee since Clause 4.3.11 (`social-housing.ts`). Chapter 15 carries a
 * third charge and nothing in `src/domain` looked at it: `compounding.ts` takes an
 * `impactFee` as an *input* to Note-2 and charges 10% on top of it, so the engine has been
 * able to surcharge a number it could not compute. An applicant asked for the figure and
 * the app had nowhere to get it.
 *
 * The clause is short and the table under it does the work:
 *
 *   15.4 — "For allowing higher use activities in lower land use zones, 'impact fee' shall
 *   be payable by the applicant at the time of such permission as per paragraph 15.4."
 *
 * and the formula, from the gazette's own worked example:
 *
 *     fee = plot area × circle rate × (coefficient × 0.25)
 *
 * The 0.25 is part of the formula, not a property of the cell. The example makes that
 * legible only because its coefficient happens to be 0.25 as well — "350 x 2000 x 0.25 x
 * 0.25 = Rs 43,750" — and that coincidence is the one place this reading could go wrong,
 * so it is recorded as the registry challenge on `zoning.impact-fee` rather than presented
 * as settled. Both readings are reproduced in the tests.
 *
 * ## Why the matrix needed the PDF
 *
 * `gazette-tmpr8.txt` flattens the table to one value per line, which loses every column
 * position: row 3 reads `0.3`, `0.1`, `0.30` with no way to tell which zones they sit
 * under. The three payable cells of a four-cell row are indistinguishable from the first
 * three. `docs/source/derived/chapters/chapter-15.json` keeps the cell bboxes and fills,
 * and that is what settles it — the coefficients are placed by x-range against the column
 * heads, and the *unpayable* cells are recoverable too, because the gazette says those
 * with colour alone:
 *
 *     #A8D08D  green   impact fee payable          — the cell carries a coefficient
 *     #0070C0  blue    impact fee not payable      — a lower use in a higher zone
 *     no fill  white   impact fee not applicable   — the use's own zone
 *
 * The white cells fall on the diagonal in all seven rows, which is the check that the
 * column mapping is right: an activity in its own zone is not a change of use at all. The
 * two extraction paths then agree on the coefficient count per row (2, 3, 4, 4, 5, 6),
 * which is the standard `docs/source/README.md` sets for confidence.
 *
 * ## Two cells that do not follow the clause's own pattern
 *
 * V-065. Read down a column the coefficient rises with the order of the use, in every
 * column. Read along a row it falls as the zone rises — in five of the six charging rows.
 * Traffic & Transportation and Industrial each climb back at R/RA:
 *
 *     Traffic & Transportation   A/GB 0.3   PSP 0.1   ·   ·   R/RA 0.30
 *     Industrial                 A/GB 0.4   PSP 0.25  TT 0.25  ·  R/RA 0.40
 *
 * R/RA is zone 5 of 7 and A/GB is zone 1, so in both rows the higher zone is charged at the
 * lowest zone's rate. These are also the only two cells on the page printed with a trailing
 * zero — "0.30" and "0.40" against "0.3" and "0.4" in the same rows — which reads like a
 * second authoring pass rather than a considered figure. Both were re-derived from the PDF
 * by cell position, independently of the flattened text, and both are as printed.
 *
 * The engine charges what the gazette prints. The irregularity is recorded here, in the
 * verification log, and in a test that pins the two values, so that nobody later "fixes"
 * the table into the pattern the rest of it follows.
 *
 * ## What this cannot answer
 *
 * Four of the clause's six exemptions turn on facts no drawing carries — who is developing
 * the facility, whether the use is temporary, whether it falls under a State policy, the
 * KVA rating of an IT unit. They are named in `caveats` rather than silently ignored,
 * because an exemption the engine cannot see is the difference between a fee and no fee.
 */

import type { OccupancyId } from './occupancy';
import type { ZoneCode } from './zoning';

/**
 * The seven activity rows, in the order Clause 15.4 prints them — lowest use to highest.
 * The ordering is the clause's own subject matter ("Order of land use zones from lowest to
 * highest order"), so it is kept as the array order rather than left implicit.
 */
export type ImpactFeeUse =
  | 'agriculture_greenbelt_park'
  | 'public_semi_public'
  | 'traffic_transportation'
  | 'industrial'
  | 'residential'
  | 'office'
  | 'commercial';

export const IMPACT_FEE_USES: readonly ImpactFeeUse[] = [
  'agriculture_greenbelt_park', 'public_semi_public', 'traffic_transportation',
  'industrial', 'residential', 'office', 'commercial',
];

export const IMPACT_FEE_USE_LABEL: Readonly<Record<ImpactFeeUse, string>> = {
  agriculture_greenbelt_park: 'Agriculture, Greenbelt, Park/Playground',
  public_semi_public: 'Public & Semi-public Facilities',
  traffic_transportation: 'Traffic & Transportation',
  industrial: 'Industrial',
  residential: 'Residential (incl. rural)',
  office: 'Office Buildings',
  commercial: 'Commercial',
};

/**
 * The eight zone columns. Clause 15.4 groups the sixteen Clause 15.3 zones into these,
 * and numbers seven of them 1–7; `BU` carries no number because the built-up area is not a
 * rung on the ladder — every cell in its column is unpayable, which is the table restating
 * the first exemption in the prose ("For generally permitted activities/uses in the
 * built-up area").
 */
export type ImpactFeeZoneGroup =
  | 'BU' | 'A_GB_RC_HF' | 'PSP' | 'TT' | 'SI_LI' | 'R_RA' | 'OB' | 'MU_C1_C2';

export const IMPACT_FEE_ZONE_GROUPS: readonly ImpactFeeZoneGroup[] = [
  'BU', 'A_GB_RC_HF', 'PSP', 'TT', 'SI_LI', 'R_RA', 'OB', 'MU_C1_C2',
];

export const IMPACT_FEE_ZONE_LABEL: Readonly<Record<ImpactFeeZoneGroup, string>> = {
  BU: 'BU',
  A_GB_RC_HF: 'A/GB/RC/HF',
  PSP: 'PSP',
  TT: 'TT',
  SI_LI: 'SI / LI',
  R_RA: 'R/RA',
  OB: 'OB',
  MU_C1_C2: 'MU/C1/C2',
};

/**
 * The three footnote markers printed inside the payable cells. Each names a class of use
 * the clause exempts, and none of the three can be decided from `ProjectState`: a hospital
 * is not marked charitable anywhere on a drawing, and "group housing for related use
 * purposes" turns on whose workers live in it.
 */
export const IMPACT_FEE_EXEMPTION_NOTE: Readonly<Record<1 | 2 | 3, string>> = {
  1: 'Non-Commercial and Charitable Activities/Uses',
  2: 'Service and cottage industries',
  3: 'Group housing for related use purposes',
};

export type ImpactFeeCell =
  /** Green in the gazette. The coefficient is printed in the cell. */
  | { readonly state: 'payable'; readonly coefficient: number; readonly note?: 1 | 2 | 3 }
  /** Blue. A lower-order use in a higher-order zone: permitted, and charged nothing. */
  | { readonly state: 'not-payable' }
  /** White. The use's own zone — no change of use, so the clause does not reach it. */
  | { readonly state: 'not-applicable' };

const PAYABLE = (coefficient: number, note?: 1 | 2 | 3): ImpactFeeCell =>
  ({ state: 'payable', coefficient, ...(note ? { note } : {}) });
const NOT_PAYABLE: ImpactFeeCell = { state: 'not-payable' };
const OWN_ZONE: ImpactFeeCell = { state: 'not-applicable' };

/**
 * Clause 15.4's matrix, gazette page 155. Seven activity rows × eight zone columns.
 *
 * Read off `chapter-15.json` table 3 by cell x-range, and cross-checked against the
 * coefficient sequence in `gazette-tmpr8.txt` lines 10993–11072. The `OWN_ZONE` diagonal
 * is the gazette's, not an assumption: those cells are the only unfilled ones on the page.
 */
export const IMPACT_FEE_MATRIX: Readonly<Record<ImpactFeeUse, Readonly<Record<ImpactFeeZoneGroup, ImpactFeeCell>>>> = {
  agriculture_greenbelt_park: {
    BU: NOT_PAYABLE, A_GB_RC_HF: OWN_ZONE, PSP: NOT_PAYABLE, TT: NOT_PAYABLE,
    SI_LI: NOT_PAYABLE, R_RA: NOT_PAYABLE, OB: NOT_PAYABLE, MU_C1_C2: NOT_PAYABLE,
  },
  public_semi_public: {
    BU: NOT_PAYABLE, A_GB_RC_HF: PAYABLE(0.25, 1), PSP: OWN_ZONE, TT: NOT_PAYABLE,
    SI_LI: NOT_PAYABLE, R_RA: PAYABLE(0.25, 1), OB: NOT_PAYABLE, MU_C1_C2: NOT_PAYABLE,
  },
  traffic_transportation: {
    BU: NOT_PAYABLE, A_GB_RC_HF: PAYABLE(0.3), PSP: PAYABLE(0.1), TT: OWN_ZONE,
    SI_LI: NOT_PAYABLE, R_RA: PAYABLE(0.30), OB: NOT_PAYABLE, MU_C1_C2: NOT_PAYABLE,
  },
  industrial: {
    BU: NOT_PAYABLE, A_GB_RC_HF: PAYABLE(0.4, 2), PSP: PAYABLE(0.25, 2), TT: PAYABLE(0.25, 2),
    SI_LI: OWN_ZONE, R_RA: PAYABLE(0.40), OB: NOT_PAYABLE, MU_C1_C2: NOT_PAYABLE,
  },
  residential: {
    BU: NOT_PAYABLE, A_GB_RC_HF: PAYABLE(0.5), PSP: PAYABLE(0.4), TT: PAYABLE(0.4),
    SI_LI: PAYABLE(0.25, 3), R_RA: OWN_ZONE, OB: NOT_PAYABLE, MU_C1_C2: NOT_PAYABLE,
  },
  office: {
    BU: NOT_PAYABLE, A_GB_RC_HF: PAYABLE(1), PSP: PAYABLE(0.75), TT: PAYABLE(0.75),
    SI_LI: PAYABLE(0.75), R_RA: PAYABLE(0.5), OB: OWN_ZONE, MU_C1_C2: NOT_PAYABLE,
  },
  commercial: {
    BU: NOT_PAYABLE, A_GB_RC_HF: PAYABLE(1.5), PSP: PAYABLE(1.25), TT: PAYABLE(1.25),
    SI_LI: PAYABLE(1), R_RA: PAYABLE(1), OB: PAYABLE(0.5), MU_C1_C2: OWN_ZONE,
  },
};

/**
 * The constant in the formula, held separately from the coefficients because it is a
 * separate factor. See the challenge recorded on `zoning.impact-fee`.
 */
export const IMPACT_FEE_FORMULA_CONSTANT = 0.25;

/**
 * Clause 15.3's sixteen zones onto Clause 15.4's eight columns.
 *
 * `F` — Facility/Utility — is absent, and that is the gazette's omission rather than this
 * engine's: Clause 15.4 prints no column for it. A plot the master plan puts in an `F`
 * zone therefore has no impact-fee coefficient to read, and `assessImpactFee` says so
 * instead of borrowing a neighbouring column.
 */
export const ZONE_GROUP_OF: Readonly<Partial<Record<ZoneCode, ImpactFeeZoneGroup>>> = {
  'BU': 'BU',
  'A': 'A_GB_RC_HF', 'GB': 'A_GB_RC_HF', 'RC': 'A_GB_RC_HF', 'HF': 'A_GB_RC_HF',
  'PSP': 'PSP',
  'TT': 'TT',
  'SI': 'SI_LI', 'LI': 'SI_LI',
  'R': 'R_RA', 'RA': 'R_RA',
  'OB': 'OB',
  'MU': 'MU_C1_C2', 'C-1': 'MU_C1_C2', 'C-2': 'MU_C1_C2',
};

/**
 * Occupancy onto the activity row.
 *
 * `mixed_use` is deliberately absent. Mixed use is a *zone* in this table (the MU/C1/C2
 * column) and Clause 15.4 prints no row for it, exactly as Clause 15.3 prints no activity
 * row for it (see `zoning.ts`). A mixed-use building is residential and commercial at
 * once, and the clause gives no rule for splitting one plot between two rows, so the
 * engine reports the row as undetermined rather than picking the dearer or the cheaper.
 */
export const IMPACT_FEE_USE_OF: Readonly<Partial<Record<OccupancyId, ImpactFeeUse>>> = {
  res_single: 'residential', res_multi: 'residential', res_group_housing: 'residential',
  com_shop: 'commercial', com_complex: 'commercial', com_mall: 'commercial',
  com_hotel: 'commercial', com_bazaar: 'commercial',
  office: 'office',
  inst_health: 'public_semi_public', inst_education: 'public_semi_public',
  inst_assembly: 'public_semi_public',
  ind_light: 'industrial', ind_general: 'industrial', ind_warehouse: 'industrial',
};

/**
 * The zones the hotel exemption does NOT reach.
 *
 * Clause 15.4's prose: "Impact fee shall also not be payable for permission of hotels in
 * all other land uses except parks and open spaces, gardens, green areas, forest areas,
 * hazardous industries, flood affected areas". So the exemption is the rule for a hotel
 * and this is the exception to it. Forest and flood-affected areas are not Clause 15.3
 * zones at all — there is no column for either — so only three of the six named land uses
 * can be tested here, and `caveats` says so.
 */
export const HOTEL_EXEMPTION_EXCLUDES: readonly ZoneCode[] = ['GB', 'RC', 'HF'];

/**
 * The exemptions in Clause 15.4's prose that turn on a fact no field supplies. Reported on
 * every payable assessment, because each one of them takes the fee to zero.
 */
export const IMPACT_FEE_UNSEEN_EXEMPTIONS: readonly string[] = [
  'Public and semi-public facilities developed by government or semi-government agencies '
  + 'in a mixed land use zone pay nothing — the engine does not know who is developing this.',
  'A use permitted temporarily, for at most one week, pays nothing.',
  'A use permitted under a State Government policy — Tourism, Information Technology, '
  + 'Film — pays nothing.',
  'An information technology unit or park up to five KVA in a residential area pays nothing.',
];

export type ImpactFeeState =
  /** A coefficient applies and the fee is computed. */
  | 'payable'
  /** The table's own blue cell: permitted, charged nothing. */
  | 'not-payable'
  /** The table's own white cell: the use's own zone. */
  | 'not-applicable'
  /** An exemption in the clause's prose that the engine can decide. */
  | 'exempt'
  /** The engine cannot place this project on the table. */
  | 'undetermined';

export interface ImpactFeeAssessment {
  readonly state: ImpactFeeState;
  /** ₹. Zero unless `state` is `'payable'`. */
  readonly fee: number;
  readonly use?: ImpactFeeUse;
  readonly useLabel?: string;
  readonly zoneGroup?: ImpactFeeZoneGroup;
  readonly zoneGroupLabel?: string;
  readonly coefficient?: number;
  /** The exemption note printed in the cell, where there is one. */
  readonly cellNote?: string;
  /** The arithmetic, as a sentence. */
  readonly working: string;
  /** Why, where the fee is not payable or cannot be determined. */
  readonly reason?: string;
  readonly clause: string;
  readonly gazettePage: number;
  readonly caveats: readonly string[];
}

const positive = (n: unknown): number => Math.max(0, Number(n) || 0);
const money = (n: number): number => Math.round(n * 100) / 100;
const inr = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

const CLAUSE = 'Clause 15.4 (Order of land use zones and determination of Impact fee)';
const GAZETTE_PAGE = 155;

/**
 * The impact fee for permitting this use in this zone.
 *
 * `circleRate` is the same figure Clause 9.2.5 calls Rc and Clause 16.3.7(c) calls the
 * residential rate — `ProjectState.circleRate`. Clause 15.4's note states the basis in its
 * own words and it is the same one: "the circle rate determined by the District Magistrate,
 * where such rate is not available, the current residential rate determined by the
 * Authority/Awas Vikas Parishad whichever is higher."
 */
export function assessImpactFee(input: {
  readonly occupancy: OccupancyId;
  readonly zone: ZoneCode | 'unknown';
  readonly plotAreaSqm: number;
  readonly circleRate: number;
}): ImpactFeeAssessment {
  const plotArea = positive(input.plotAreaSqm);
  const circleRate = positive(input.circleRate);
  const base = { fee: 0, working: '', clause: CLAUSE, gazettePage: GAZETTE_PAGE } as const;

  if (input.zone === 'unknown') {
    return {
      ...base,
      state: 'undetermined',
      working: 'No land-use zone is set, and the fee is read from a matrix keyed on it.',
      reason:
        'The impact fee is charged for allowing a higher use in a lower land-use zone, so it '
        + 'cannot be determined until the zone is known. Set the master plan zone.',
      caveats: [],
    };
  }

  const use = IMPACT_FEE_USE_OF[input.occupancy];
  if (!use) {
    return {
      ...base,
      state: 'undetermined',
      working: 'Clause 15.4 prints no activity row this occupancy maps onto.',
      reason:
        'Mixed use is a zone in Clause 15.4, not an activity: the table has no row for a '
        + 'building that is residential and commercial at once, and no rule for splitting one '
        + 'plot between the residential and commercial rows. The fee is payable and the '
        + 'Authority assesses it.',
      caveats: [],
    };
  }

  const zoneGroup = ZONE_GROUP_OF[input.zone];
  if (!zoneGroup) {
    return {
      ...base,
      state: 'undetermined',
      use,
      useLabel: IMPACT_FEE_USE_LABEL[use],
      working: `Clause 15.4 prints no column for the ${input.zone} zone.`,
      reason:
        `Clause 15.3 has sixteen land-use zones and Clause 15.4's matrix has columns for `
        + `fifteen of them. ${input.zone} is the one it omits, so there is no coefficient to `
        + `read. The Authority assesses the fee.`,
      caveats: [],
    };
  }

  const cell = IMPACT_FEE_MATRIX[use][zoneGroup];
  const placed = {
    use,
    useLabel: IMPACT_FEE_USE_LABEL[use],
    zoneGroup,
    zoneGroupLabel: IMPACT_FEE_ZONE_LABEL[zoneGroup],
  };

  if (cell.state === 'not-applicable') {
    return {
      ...base,
      ...placed,
      state: 'not-applicable',
      working: `${IMPACT_FEE_USE_LABEL[use]} in ${IMPACT_FEE_ZONE_LABEL[zoneGroup]} is the use's own zone.`,
      reason:
        'The impact fee is charged for allowing a higher use in a lower zone. This use is the '
        + 'zone\'s own use, so there is no change of use for the fee to attach to.',
      caveats: [],
    };
  }

  if (cell.state === 'not-payable') {
    return {
      ...base,
      ...placed,
      state: 'not-payable',
      working:
        `Clause 15.4 leaves the ${IMPACT_FEE_USE_LABEL[use]} × ${IMPACT_FEE_ZONE_LABEL[zoneGroup]} `
        + 'cell marked not payable.',
      reason: zoneGroup === 'BU'
        ? 'Clause 15.4 exempts generally permitted activities in the built-up area, and the '
          + 'whole BU column of the matrix is marked not payable in agreement with it.'
        : `${IMPACT_FEE_USE_LABEL[use]} is a lower-order use than this zone, and the fee is `
          + 'charged only on the way up the order.',
      caveats: [],
    };
  }

  // Clause 15.4's prose exemption for hotels, which is broader than the cell it sits in:
  // a hotel is exempt everywhere except six named land uses, three of which are zones.
  if (input.occupancy === 'com_hotel' && !HOTEL_EXEMPTION_EXCLUDES.includes(input.zone)) {
    return {
      ...base,
      ...placed,
      state: 'exempt',
      coefficient: cell.coefficient,
      working:
        `The commercial row would charge a coefficient of ${cell.coefficient} here, and the `
        + 'prose exemption for hotels displaces it.',
      reason:
        'Clause 15.4: "Impact fee shall also not be payable for permission of hotels in all '
        + 'other land uses except parks and open spaces, gardens, green areas, forest areas, '
        + 'hazardous industries, flood affected areas." This zone is none of those.',
      caveats: [
        'The exemption is lifted in forest areas and flood-affected areas too. Neither is a '
        + 'Clause 15.3 land-use zone, so neither can be tested from the zone alone.',
        'Clause 15.4 also withholds the exemption where the hotel is permitted "for use other '
        + 'than hotel or commercial use".',
      ],
    };
  }

  const fee = money(plotArea * circleRate * cell.coefficient * IMPACT_FEE_FORMULA_CONSTANT);
  const caveats = [...IMPACT_FEE_UNSEEN_EXEMPTIONS];
  if (cell.note) {
    caveats.unshift(
      `The cell is marked (${cell.note}): ${IMPACT_FEE_EXEMPTION_NOTE[cell.note]} are exempt. `
      + 'Nothing in the project model records whether this use is one of them.',
    );
  }

  return {
    ...base,
    ...placed,
    state: 'payable',
    fee,
    coefficient: cell.coefficient,
    cellNote: cell.note ? IMPACT_FEE_EXEMPTION_NOTE[cell.note] : undefined,
    working:
      `Clause 15.4: (plot area) × (circle rate) × (coefficient × ${IMPACT_FEE_FORMULA_CONSTANT}) `
      + `= ${plotArea} m² × ₹${circleRate.toLocaleString('en-IN')}/m² × ${cell.coefficient} × `
      + `${IMPACT_FEE_FORMULA_CONSTANT} = ${inr(fee)}`,
    caveats,
  };
}
