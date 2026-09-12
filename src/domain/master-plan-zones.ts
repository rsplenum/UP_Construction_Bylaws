/**
 * Appendix-15 — "Use zones across different master plans".
 *
 * Clause 15.3 decides whether a use may go on a plot, keyed on one of sixteen zone codes.
 * No applicant's master plan uses those codes. Gorakhpur's plan says "C3- Wholesale /
 * Storage/godown /Warehousing"; Muzaffarnagar's says "Ganna Shodh Kendra"; Bareilly splits
 * commerce three ways across C1, C2 and C3. Appendix-15 is the table that translates
 * between them — twenty-two Development Authorities against the same sixteen rows, in the
 * same order Clause 15.3 prints its columns.
 *
 * Without it `masterPlanZone` asks a question no user can answer: they can read their own
 * master plan and they cannot read the byelaws' shorthand. With it the app can ask the
 * question the other way round — which of these names appears on your plan — and derive
 * the code.
 *
 * The rows are IMPORTED. `tools/extract-master-plan-zones.py` folds the appendix's
 * continuation lines back into their cells and writes `./data/master-plan-zones.json`.
 */

import raw from './data/master-plan-zones.json';
import type { ZoneCode } from './zoning';

export interface MasterPlanZoneRow {
  readonly serial: number;
  /** The Clause 15.3 column this row is, or null for row 17, "Additional Land use". */
  readonly zone: ZoneCode | null;
  readonly label: string;
  /**
   * Authority → the names that authority's master plan uses for this zone. `null` where the
   * appendix prints NIL: that authority has no zone of this kind at all. An authority
   * missing from the map is a cell the appendix leaves blank, which is not the same thing —
   * see V-057.
   */
  readonly authorities: Readonly<Record<string, readonly string[] | null>>;
}

export const MASTER_PLAN_AUTHORITIES = raw.authorities as readonly string[];
export const MASTER_PLAN_ZONE_ROWS = raw.rows as readonly MasterPlanZoneRow[];

const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** The authority as Appendix-15 names it, matched loosely against a city name. */
export function authorityNamed(city: string): string | undefined {
  const want = normalise(city);
  return MASTER_PLAN_AUTHORITIES.find((a) => normalise(a) === want)
    ?? MASTER_PLAN_AUTHORITIES.find((a) => normalise(a).startsWith(`${want}-`));
}

export type LocalZoneLookup =
  /** The authority's plan names this zone, and these are the names it uses. */
  | { readonly state: 'named'; readonly names: readonly string[] }
  /** The appendix prints NIL: this authority has no zone of this kind. */
  | { readonly state: 'nil' }
  /** The appendix leaves the cell blank, which is not the same as NIL (V-057). */
  | { readonly state: 'blank' }
  /** The authority is not one of the twenty-two the appendix covers (V-056). */
  | { readonly state: 'authority-not-listed' };

export function localZoneNames(authority: string, zone: ZoneCode): LocalZoneLookup {
  const name = authorityNamed(authority);
  if (!name) return { state: 'authority-not-listed' };
  const row = MASTER_PLAN_ZONE_ROWS.find((r) => r.zone === zone);
  if (!row || !(name in row.authorities)) return { state: 'blank' };
  const names = row.authorities[name];
  return names === null ? { state: 'nil' } : { state: 'named', names };
}

/** The reverse: a name off a master plan → the Clause 15.3 column it is. */
export function zoneForLocalName(authority: string, localName: string): ZoneCode | undefined {
  const name = authorityNamed(authority);
  if (!name) return undefined;
  const want = normalise(localName);
  for (const row of MASTER_PLAN_ZONE_ROWS) {
    if (!row.zone) continue;
    const names = row.authorities[name];
    if (names && names.some((n) => normalise(n) === want)) return row.zone;
  }
  return undefined;
}

/** Every local name this authority's plan uses, with the column each maps to. */
export function zonesOfAuthority(authority: string): readonly {
  readonly zone: ZoneCode; readonly names: readonly string[];
}[] {
  const name = authorityNamed(authority);
  if (!name) return [];
  return MASTER_PLAN_ZONE_ROWS.flatMap((r) => {
    const names = r.zone ? r.authorities[name] : null;
    return names && names.length ? [{ zone: r.zone!, names }] : [];
  });
}
