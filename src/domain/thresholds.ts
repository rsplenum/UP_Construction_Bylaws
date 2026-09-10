/**
 * Minimum plot size and minimum road width, as the gazette states them.
 *
 * The engine carries one of each per occupancy, reasoned from four occupancies before the
 * gazette was available (V-005). The gazette states them per *facility*, and the
 * facilities inside a single occupancy differ by more than an order of magnitude:
 *
 *     Non-bedded medical establishment       100 m²      9 m
 *     Nursing home, up to 50 beds            300 m²     12 m
 *     Nursing institute                    2,000 m²     18 m
 *     Hospital over 50 beds                3,000 m²     18 m
 *     Medical college                   NMC/MCI norms   24 m
 *
 * `inst_health` holds 500 m² and 12 m, which matches none of them.
 *
 * These rows are IMPORTED, not transcribed — tools/extract-thresholds.py writes
 * ./data/thresholds.json from the chapter extractions. Reconciling them against the
 * occupancy list needs sub-occupancies, which is a change to the shape of the engine
 * rather than to a number, so this module exposes the data and states the gap rather
 * than pretending one figure per occupancy is right.
 */

import raw from './data/thresholds.json';

/** What the gazette prints in a threshold cell. */
export type ThresholdValue =
  | number
  /** Stated separately for a built-up area and a new layout. */
  | { readonly built_up: number; readonly non_built_up: number }
  /** A band — the lower bound is the minimum. `to` is null where it is open-ended. */
  | { readonly from: number; readonly to: number | null }
  /** The gazette defers to somebody else's rules, e.g. "As per NMC / MCI norms". */
  | { readonly defersTo: string };

export interface ThresholdRow {
  readonly subject: string;
  readonly value: ThresholdValue;
}

export interface ThresholdTable {
  readonly chapter: string;
  readonly gazettePage: number;
  readonly measure: 'minPlotAreaSqm' | 'minRoadWidthM';
  /** Most tables key on the facility; Clauses 6.3.3 and 6.4.2 invert it. */
  readonly keyedOn: 'facility' | 'plotAreaSqm' | 'roadWidthM';
  readonly header: readonly string[];
  readonly rows: readonly ThresholdRow[];
}

export const THRESHOLD_TABLES = raw.tables as readonly ThresholdTable[];

/** The single number to test against, taking the strictest reading of whatever is printed. */
export function strictestThreshold(value: ThresholdValue): number | null {
  if (typeof value === 'number') return value;
  if ('defersTo' in value) return null;
  if ('built_up' in value) return Math.max(value.built_up, value.non_built_up);
  return value.from;
}

export function thresholdFor(value: ThresholdValue, areaType: 'built_up' | 'non_built_up'): number | null {
  if (typeof value === 'number') return value;
  if ('defersTo' in value) return null;
  if ('built_up' in value) return value[areaType];
  return value.from;
}

/** Every facility the gazette names, with both thresholds where it gives them. */
export interface Facility {
  readonly subject: string;
  readonly gazettePage: number;
  readonly minPlotAreaSqm?: ThresholdValue;
  readonly minRoadWidthM?: ThresholdValue;
  /** Both printed names, where the plot and road tables spell the facility differently. */
  readonly names: readonly string[];
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '').replace(/s$/, '');

/**
 * The plot-size and road-width tables sit on the same page and name the same facilities,
 * but not in the same words: "Primary" against "Primary School", "Secondary / High School
 * / Intercollege" against "Secondary/ High School", "Retails Shops" against "Retail
 * Shops". They are paired where one squashed name is a prefix of the other, and only
 * within one page — a looser rule risks merging facilities the gazette keeps apart, and
 * the whole point of this module is that those distinctions matter.
 */
export function facilities(): readonly Facility[] {
  const out: (Facility & { key: string })[] = [];

  for (const table of THRESHOLD_TABLES) {
    if (table.keyedOn !== 'facility') continue;
    for (const row of table.rows) {
      const key = squash(row.subject);
      const match = out.find(
        (f) => f.gazettePage === table.gazettePage
          && f[table.measure] === undefined
          && (f.key.startsWith(key) || key.startsWith(f.key)));

      if (match) {
        Object.assign(match, {
          [table.measure]: row.value,
          names: [...match.names, row.subject],
          // Keep the longer printed name: it is the more specific of the two.
          subject: row.subject.length > match.subject.length ? row.subject : match.subject,
        });
      } else {
        out.push({
          key, subject: row.subject, gazettePage: table.gazettePage,
          names: [row.subject], [table.measure]: row.value,
        });
      }
    }
  }

  return out.map(({ key: _key, ...f }) => f);
}
