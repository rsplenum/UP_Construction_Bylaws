/**
 * Statutory band lookup primitives.
 *
 * Every table in the byelaws is a ladder of bands ("up to 150 sqm", ">150 to 300 sqm").
 * Encoding those bands as `min: 150.01, max: 300` leaves numeric holes: a 150.005 sqm plot
 * matches no row, and callers that fall back to `table[table.length - 1]` then silently
 * apply the *largest* band's rule. That produced, for example, a 15m front-setback
 * requirement for a 15.005m-tall building.
 *
 * These helpers encode bands as half-open intervals [lowerExclusive, upperInclusive] with
 * no gaps, and resolve a value to exactly one band or report why it could not.
 */

export interface Band {
  /** Exclusive lower bound. Use 0 (or -Infinity) for the first band. */
  readonly overMoreThan: number;
  /** Inclusive upper bound. Use Infinity for the open-ended final band. */
  readonly upToAndIncluding: number;
}

export type BandResolution<T> =
  | { readonly ok: true; readonly band: T }
  | { readonly ok: false; readonly reason: 'below-first-band' | 'no-band-defined'; readonly value: number };

/**
 * Resolve `value` against a ladder of bands. Bands are matched as
 * `overMoreThan < value <= upToAndIncluding`, so contiguous ladders have no holes.
 */
export function resolveBand<T extends Band>(table: readonly T[], value: number): BandResolution<T> {
  if (!Number.isFinite(value)) return { ok: false, reason: 'no-band-defined', value };
  if (table.length === 0) return { ok: false, reason: 'no-band-defined', value };

  for (const band of table) {
    if (value > band.overMoreThan && value <= band.upToAndIncluding) {
      return { ok: true, band };
    }
  }

  const lowest = table.reduce((a, b) => (b.overMoreThan < a.overMoreThan ? b : a));
  if (value <= lowest.overMoreThan) return { ok: false, reason: 'below-first-band', value };
  return { ok: false, reason: 'no-band-defined', value };
}

/**
 * Assert at module-load time that a ladder is contiguous and open-ended, so a malformed
 * table fails loudly in development instead of silently mis-classifying a project.
 */
export function assertContiguousLadder(name: string, table: readonly Band[]): void {
  if (table.length === 0) throw new Error(`[byelaws] ladder "${name}" is empty`);

  const sorted = [...table].sort((a, b) => a.overMoreThan - b.overMoreThan);
  for (let i = 0; i < sorted.length; i++) {
    const band = sorted[i];
    if (band.upToAndIncluding <= band.overMoreThan) {
      throw new Error(`[byelaws] ladder "${name}" band ${i} is inverted or empty`);
    }
    const next = sorted[i + 1];
    if (next && next.overMoreThan !== band.upToAndIncluding) {
      throw new Error(
        `[byelaws] ladder "${name}" has a hole between ${band.upToAndIncluding} and ${next.overMoreThan}`,
      );
    }
  }

  const last = sorted[sorted.length - 1];
  if (last.upToAndIncluding !== Infinity) {
    throw new Error(`[byelaws] ladder "${name}" is not open-ended; final band caps at ${last.upToAndIncluding}`);
  }
}
