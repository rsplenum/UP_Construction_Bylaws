/**
 * Clause 15.3 — may this use go on this plot at all?
 *
 * The app's first question, and until now the engine answered it from road width and plot
 * size alone. The table that actually answers it — 53 activities against 16 land-use zones,
 * 847 verdicts — has been extracted, checked and sitting unread since chapter 15 (V-008).
 *
 * Two things kept it unreachable, and both are fixed here:
 *
 *   1. `OccupancyDefinition.activityId` held values from a retired scheme — `act-single-unit`,
 *      `act-retail-shops` — against a matrix keyed on the gazette's own activity numbers,
 *      `1.1(a)`, `2.1`. Not one occupancy resolved to a row. See B-048.
 *   2. `ProjectState` had no land-use zone, so even a correct mapping had nothing to look up.
 *
 * The mapping below is deliberately partial. Several occupancies span more than one printed
 * row and the row turns on a fact the project model does not carry — a hotel's room count
 * splits 2.5 from 2.6 (V-011), a hospital's bed count splits 5.6 through 5.9, a school's
 * level splits 5.1 through 5.5. Where that happens the stricter row is used and the
 * alternative is named, rather than a row being picked silently.
 */

import raw from './data/zoning-matrix.json';
import type { AreaType } from './far';
import type { OccupancyId } from './occupancy';

export type ZoneCode =
  | 'BU' | 'R' | 'MU' | 'C-1' | 'C-2' | 'SI' | 'LI' | 'OB' | 'PSP'
  | 'TT' | 'F' | 'RC' | 'GB' | 'RA' | 'A' | 'HF';

/** Clause 15.3's column heads, expanded. */
export const ZONE_LABEL: Readonly<Record<ZoneCode, string>> = {
  'BU': 'Built-up / Abadi',
  'R': 'Residential',
  'MU': 'Mixed Use',
  'C-1': 'Commercial — city / district centre',
  'C-2': 'Commercial — community / convenience',
  'SI': 'Service Industry',
  'LI': 'Light Industry',
  'OB': 'Office / Business',
  'PSP': 'Public and Semi-Public',
  'TT': 'Transport and Traffic',
  'F': 'Facility / Utility',
  'RC': 'Recreational',
  'GB': 'Green Belt',
  'RA': 'Restricted / Regulated Area',
  'A': 'Agricultural',
  'HF': 'Hazardous Facility',
};

export type ZoneVerdict = 'permitted' | 'prohibited' | 'conditional';

export interface ZoneCell {
  readonly verdict: ZoneVerdict;
  /** The numbered condition in Clause 15.3's own note list, where one applies. */
  readonly condition?: string;
}

export interface ActivityRow {
  readonly gazettePage: number;
  readonly activity: string;
  readonly label: string;
  readonly zones: Readonly<Record<string, ZoneCell>>;
}

export const ZONES = raw.zones as readonly ZoneCode[];
export const ACTIVITY_ROWS = raw.rows as readonly ActivityRow[];

export function activityRow(code: string): ActivityRow | undefined {
  return ACTIVITY_ROWS.find((r) => r.activity === code);
}

interface ActivityMapping {
  /** The row to read. */
  readonly activity: string;
  /** A second row that would apply on a fact the project model does not carry. */
  readonly alternative?: { readonly activity: string; readonly turnsOn: string };
}

/**
 * Occupancy → Clause 15.3 activity row.
 *
 * Where the gazette splits an occupancy by area type it is keyed on that, because the
 * project model does carry it. Where it splits on something the model lacks, the stricter
 * row is taken and `alternative` names the other.
 */
export function activityFor(input: {
  occupancy: OccupancyId;
  areaType: AreaType;
  plotAreaSqm: number;
}): ActivityMapping | undefined {
  const builtUp = input.areaType === 'built_up';
  switch (input.occupancy) {
    case 'res_single':
    case 'res_multi':
      return { activity: builtUp ? '1.1(a)' : '1.1(b)' };
    case 'res_group_housing':
      return { activity: builtUp ? '1.2(a)' : '1.2(b)' };
    // Clause 15.3 splits shops at 100 m² of plot area, which the model carries.
    case 'com_shop':
    case 'com_bazaar':
      return { activity: input.plotAreaSqm <= 100 ? '2.1' : '2.2' };
    case 'com_complex':
      return { activity: '2.2' };
    case 'com_mall':
      return { activity: '2.4' };
    case 'com_hotel':
      // 2.5 is "Hotels up to 20 rooms", 2.6 "Hotels above 20 rooms". No room count (V-011),
      // so the larger and more restricted row is taken.
      return { activity: '2.6', alternative: { activity: '2.5', turnsOn: 'a room count of 20 or fewer' } };
    case 'office':
      return { activity: '4.2', alternative: { activity: '4.1', turnsOn: 'the office being a government or local-body office' } };
    case 'inst_health':
      // 5.6 non-bedded, 5.7 up to 50 beds, 5.8 above 50, 5.9 medical college.
      return { activity: '5.8', alternative: { activity: '5.7', turnsOn: 'a bed count of 50 or fewer' } };
    case 'inst_education':
      // 5.1 primary through 5.5 university.
      return { activity: '5.3', alternative: { activity: '5.1', turnsOn: 'the institution being a primary school' } };
    case 'inst_assembly':
      return { activity: '5.10', alternative: { activity: '5.11', turnsOn: 'the hall being an auditorium or convention centre' } };
    case 'ind_light':
      return { activity: '3.1' };
    case 'ind_general':
      return { activity: '3.5' };
    case 'ind_warehouse':
      return { activity: '3.3' };
    // Mixed use is a ZONE in this table (MU), not an activity. Clause 8.1 governs what may
    // be mixed; Clause 15.3 has no row for it.
    case 'mixed_use':
      return undefined;
    default:
      return undefined;
  }
}

export interface ZoningAssessment {
  readonly zone: ZoneCode;
  readonly zoneLabel: string;
  readonly activity: string;
  readonly activityLabel: string;
  readonly verdict: ZoneVerdict;
  /** Clause 15.3's numbered condition, where the cell is conditional. */
  readonly condition?: string;
  readonly gazettePage: number;
  /** Set where another row would apply on a fact the project model does not carry. */
  readonly alternative?: {
    readonly activity: string;
    readonly label: string;
    readonly verdict: ZoneVerdict;
    readonly turnsOn: string;
  };
  readonly caveats: readonly string[];
}

export function assessZoning(input: {
  occupancy: OccupancyId;
  areaType: AreaType;
  plotAreaSqm: number;
  zone: ZoneCode;
}): ZoningAssessment | undefined {
  const mapping = activityFor(input);
  if (!mapping) return undefined;
  const row = activityRow(mapping.activity);
  const cell = row?.zones[input.zone];
  if (!row || !cell) return undefined;

  const caveats: string[] = [];
  let alternative: ZoningAssessment['alternative'];
  if (mapping.alternative) {
    const alt = activityRow(mapping.alternative.activity);
    const altCell = alt?.zones[input.zone];
    if (alt && altCell) {
      alternative = {
        activity: alt.activity, label: alt.label,
        verdict: altCell.verdict, turnsOn: mapping.alternative.turnsOn,
      };
      if (altCell.verdict !== cell.verdict) {
        caveats.push(
          `Clause 15.3 also prints row ${alt.activity} for this use, which applies on `
          + `${mapping.alternative.turnsOn} — a fact the project model does not carry. There the `
          + `verdict is ${altCell.verdict}. The stricter row is applied.`,
        );
      }
    }
  }
  if (cell.verdict === 'conditional') {
    caveats.push(
      `The cell is green-with-a-number: permitted subject to condition ${cell.condition} of `
      + 'Clause 15.3\'s own note list, which the engine does not yet hold.',
    );
  }

  return {
    zone: input.zone,
    zoneLabel: ZONE_LABEL[input.zone],
    activity: row.activity,
    activityLabel: row.label,
    verdict: cell.verdict,
    condition: cell.condition,
    gazettePage: row.gazettePage,
    alternative,
    caveats,
  };
}
