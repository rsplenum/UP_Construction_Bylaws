/**
 * Chapter 8 — mixed-use development and Transit Oriented Development.
 *
 * The FAR table of Clause 8.1.3.1 lives with the other BFAR/PFAR/PPFAR/MFAR tables in
 * `purchasable-far.ts`, and the ladder it resolves to is in `far.ts`. What is left is the
 * part of the chapter that does not fit the shape of any rule the engine already applies,
 * and this module holds it rather than leaving it unread:
 *
 *   - Clause 8.1.3 states every development standard FIVE TIMES, once per permissible
 *     location, and they disagree. The means of access runs from 9 m to 24 m across the
 *     five, and the engine has one field for it.
 *   - Clause 8.2.2.2 states TOD FAR as a PERCENTAGE of whatever base FAR the use would
 *     otherwise carry. Every other FAR rule in the byelaws prints absolute figures, and
 *     a multiplier cannot be resolved without first resolving the underlying use.
 *   - Clause 8.3.1 bars twenty-four named activities from mixing at all, and constrains
 *     the proportions of those that may.
 *
 * The rows are IMPORTED, not transcribed: `tools/extract-mixed-use.py` writes
 * ./data/mixed-use.json from the chapter PDF and this reads it, so a figure here cannot
 * disagree with the gazette without the extraction disagreeing first.
 *
 * What this module deliberately does NOT do is decide anything. None of these rules can
 * be applied to a project the engine can currently describe: nothing in `ProjectState`
 * says which of the five locations a plot sits in, what the mix of uses is, or whether
 * the site is inside a TOD zone. Modelling them and stating the gap is the honest
 * position — see V-026 and V-027 — and it is a great deal better than the alternative
 * the engine was living with, which was a mixed-use occupancy carrying an invented
 * minimum plot size and an invented parking ratio because nobody had read this chapter.
 */

import raw from './data/mixed-use.json';

/** The five places Clause 8.1.2 permits mixed use, in the order the standards table prints. */
export type MixedUseLocationKey =
  | 'mixed_use_zone'          // 8.1.2(a) — earmarked under the Master Plan
  | 'approved_layout_plot'    // 8.1.2(b) — identified as part of an approved layout
  | 'bazaar_street'           // 8.1.2(c) — notified bazaar streets, governed by Clause 5.1
  | 'wide_road'               // 8.1.2(d) — along 24 m and wider roads
  | 'tod_zone';               // 8.1.2(e) — TOD zones, governed by Clause 8.2

export interface MixedUseLocation {
  readonly key: MixedUseLocationKey;
  readonly clause: string;
  readonly name: string;
}

export interface MixedUseStandard {
  readonly key: string;
  readonly parameter: string;
  readonly byLocation: Readonly<Record<MixedUseLocationKey, string>>;
}

export const MIXED_USE_LOCATIONS = raw.standards.locations as readonly MixedUseLocation[];
export const MIXED_USE_STANDARDS = raw.standards.parameters as readonly MixedUseStandard[];

export function mixedUseStandard(key: string): MixedUseStandard | undefined {
  return MIXED_USE_STANDARDS.find((s) => s.key === key);
}

/**
 * The means of access, per location — the figure the engine most visibly cannot carry.
 *
 * | Location | Minimum road |
 * |---|---|
 * | Mixed-use zone, plot up to 100 m² | 9 m |
 * | Mixed-use zone, larger plot | 12 m |
 * | Plot in an approved layout | 24 m |
 * | Notified bazaar street | 12 m |
 * | Along a 24 m or wider road | 24 m |
 * | TOD zone | 12 m or more |
 *
 * `mixed_use` holds 12 m, which is right for a mixed-use zone above 100 m² and for a
 * bazaar street. It is 3 m too strict for a small plot in a mixed-use zone and 12 m too
 * lenient for an approved-layout plot. Recorded as V-024.
 */
export const MIXED_USE_MIN_ROAD_M: Readonly<Record<MixedUseLocationKey, number>> = {
  mixed_use_zone: 9,          // 12 m above a 100 m² plot; the engine cannot split on that
  approved_layout_plot: 24,
  bazaar_street: 12,
  wide_road: 24,
  tod_zone: 12,
};

/**
 * Clause 8.1.3, Mixing row — the proportions, where the gazette states them as numbers.
 *
 * Locations (a) and (b) print "0-100%", which is no constraint at all. A bazaar street
 * is limited to commercial on two floors and is governed by Clause 5.1 instead. Only (d)
 * and (e) carry a real ratio, and it has three limbs, the third of which is easy to miss
 * because it is printed as a sentence under the table rather than as a figure in it.
 */
export interface MixingRule {
  /** Minimum share of FAR the principal use must take. */
  readonly principalUseMinShare: number;
  /** Maximum share of FAR all other uses may take between them. */
  readonly otherUsesMaxShare: number;
  /** "share of single other use shall not be more than principal use". */
  readonly noSingleOtherUseAbovePrincipal: boolean;
}

export const MIXING_RULE: Readonly<Record<MixedUseLocationKey, MixingRule | null>> = {
  mixed_use_zone: null,       // "0-100%"
  approved_layout_plot: null, // "0-100%"
  bazaar_street: null,        // "Commercial (2 floors)" — Clause 5.1 governs
  wide_road: { principalUseMinShare: 0.33, otherUsesMaxShare: 0.67, noSingleOtherUseAbovePrincipal: true },
  tod_zone: { principalUseMinShare: 0.33, otherUsesMaxShare: 0.67, noSingleOtherUseAbovePrincipal: true },
};

export interface MixingBreach {
  readonly limb: 'principal-share' | 'other-share' | 'single-other-use';
  readonly detail: string;
}

/**
 * Check a proposed mix against Clause 8.1.3.
 *
 * `principalUse` has to be given rather than derived, and that is the whole substance of
 * the rule. Taking the largest share as the principal use makes the third limb — "share
 * of single other use shall not be more than principal use" — vacuously true, because
 * nothing can exceed the largest. The principal use is the one the master plan, zonal
 * plan or layout assigns: Clause 8.2.2.1's note says the "MP/ZDP/layout land use shall
 * remain pre-dominant land use", and Clause 16.1.3(xiii) makes building in breach of the
 * predominant land use non-compoundable. So it is a fact about the plot, not about the
 * drawing, and a mix can breach the clause while still having a clear largest use.
 *
 * `shares` maps a use to its floor area, in any unit; only the proportions are read.
 *
 * Nothing in the app calls this yet, because nothing collects the mix. It is written
 * against the clause so that the day advanced mode asks, the rule is already right.
 */
export function checkMixing(
  location: MixedUseLocationKey,
  principalUse: string,
  shares: Readonly<Record<string, number>>,
): readonly MixingBreach[] {
  const rule = MIXING_RULE[location];
  const entries = Object.entries(shares).filter(([, v]) => v > 0);
  if (!rule || entries.length === 0) return [];

  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total <= 0) return [];
  const fractions = entries.map(([use, v]) => [use, v / total] as const);

  const principalShare = (shares[principalUse] ?? 0) / total;
  const breaches: MixingBreach[] = [];
  const pct = (f: number) => `${(f * 100).toFixed(1)}%`;

  if (principalShare < rule.principalUseMinShare) {
    breaches.push({
      limb: 'principal-share',
      detail: `The principal use (${principalUse}) takes ${pct(principalShare)} of the floor `
        + `area, below the ${pct(rule.principalUseMinShare)} minimum.`,
    });
  }
  const otherShare = 1 - principalShare;
  if (otherShare > rule.otherUsesMaxShare + 1e-9) {
    breaches.push({
      limb: 'other-share',
      detail: `Other uses take ${pct(otherShare)} between them, above the `
        + `${pct(rule.otherUsesMaxShare)} maximum.`,
    });
  }
  if (rule.noSingleOtherUseAbovePrincipal) {
    for (const [use, share] of fractions.filter(([use]) => use !== principalUse)) {
      if (share > principalShare + 1e-9) {
        breaches.push({
          limb: 'single-other-use',
          detail: `${use} takes ${pct(share)}, more than the principal use `
            + `${principalUse} at ${pct(principalShare)}.`,
        });
      }
    }
  }
  return breaches;
}

export interface TodFarBand {
  readonly label: string;
  readonly overMoreThan: number;
  readonly upToAndIncluding: number | null;
  readonly baseFar: string;
  readonly todFarPercentOfBase: number | null;
  readonly multiplier: number | null;
  readonly unrestricted: boolean;
}

/**
 * Clause 8.2.2.2 — TOD FAR as a multiple of base FAR: 150%, 250%, 350%, then unrestricted.
 *
 * This is the only FAR rule in the byelaws expressed as a multiplier. The base column
 * reads "As per byelaws" in every row, so the figure it multiplies is whatever the
 * underlying use would carry outside the TOD zone — which means a TOD determination
 * cannot be made from the TOD chapter alone.
 *
 * The bottom band is printed as "12m" where the three above it are ranges beginning ">".
 * Read against Clause 8.1.3, which puts the TOD means of access at "=>12m", it is the
 * right of way of exactly 12 m; below that a TOD plot has no access at all, so the band
 * is modelled from zero and the access rule bars what sits under it.
 */
export const TOD_FAR_BANDS = raw.todFar.bands as readonly TodFarBand[];

/** The TOD ceiling for a use whose ordinary base FAR is `baseFar`. Infinity above 45 m. */
export function todMaxFar(baseFar: number, roadWidthM: number): number | null {
  const band = TOD_FAR_BANDS.find(
    (b) => roadWidthM > b.overMoreThan
      && (b.upToAndIncluding === null || roadWidthM <= b.upToAndIncluding),
  );
  if (!band) return null;
  if (band.unrestricted) return Infinity;
  return band.multiplier === null ? null : Number((baseFar * band.multiplier).toFixed(4));
}

/**
 * Clause 8.2.2.2 Note (2) — in a TOD zone, premium purchasable FAR is charged at the
 * purchasable rate: "the charges for purchasable FAR and premium purchasable FAR shall
 * be the same".
 *
 * Everywhere else the two are priced differently, which is the whole reason
 * `purchasable-far.ts` keeps them apart. This is the one place the distinction collapses,
 * and it collapses in the direction of the cheaper rate.
 */
export const TOD_PREMIUM_CHARGED_AS_PURCHASABLE = true;

export interface TodMixingRow {
  readonly landUse: string;
  readonly changedLandUse: string;
  readonly minimumFarInExistingUse: string;
  readonly farInOtherUse: string;
  readonly minimumSharePercent: number | null;
  readonly otherSharePercent: number | null;
}

/**
 * Clause 8.2.2.1 — what a TOD plot's land use may become, and the FAR split.
 *
 * Six land uses, each keeping at least 33% of its FAR in the existing use and giving up
 * to 67% to the other, except Transportation, which keeps "Operation as required" and
 * gives the remainder. The note under the table restates the predominance bar: the
 * master-plan land use must remain predominant.
 */
export const TOD_MIXING = raw.todMixing.rows as readonly TodMixingRow[];

export interface ExcludedCategory {
  readonly category: string;
  readonly activities: readonly string[];
}

/**
 * Clause 8.3.1(4) — activities that shall not be mixed with other permissible uses.
 *
 * Twenty-four of them across five land-use categories. Several are already occupancies
 * the engine knows: a farmhouse is Clause 7.2, an LPG refilling plant and a power
 * generation plant sit under industry. Nothing checks a proposed mix against this list
 * yet, for the same reason nothing checks the proportions — the engine cannot describe
 * a mix. The list is here so that when it can, the bar is already read.
 */
export const EXCLUDED_FROM_MIXING = raw.excludedFromMixing.categories as readonly ExcludedCategory[];

export function isExcludedFromMixing(activity: string): boolean {
  const needle = activity.trim().toLowerCase();
  return EXCLUDED_FROM_MIXING.some(
    (c) => c.activities.some((a) => a.toLowerCase().includes(needle)
      || needle.includes(a.toLowerCase())),
  );
}

/**
 * Cross-references Chapter 8 makes to paragraphs that do not exist.
 *
 * Both are recorded rather than quietly repaired, because a reader holding the gazette
 * will hit them too and the resolution of one of them is a guess:
 *
 *   8.1.3.6  The standards table sends the reader here for the FAR of a mixed-use zone
 *            and an approved-layout plot. The chapter's FAR clause is numbered 8.1.3.1
 *            and is introduced as applying to "paragraph 8.1.2 (a) and (b)" — exactly
 *            the two columns pointing at 8.1.3.6 — so the intent is not in doubt and the
 *            engine reads 8.1.3.1.
 *   8.1.4    Note-1 says the permissible occupancies in mixed-use development "shall be
 *            as per paragraph 8.1.4". There is no 8.1.4, and no other list of permissible
 *            mixed-use occupancies anywhere in the byelaws. Clause 8.3.1 constrains what
 *            may be mixed but does not enumerate what is permitted, so this one cannot be
 *            resolved by reading — the list is simply absent. See V-027.
 *
 * Neither number appears anywhere else in the document; both were found by checking every
 * cross-reference in the chapter against its own headings, in `tools/extract-mixed-use.py`.
 */
export const DANGLING_REFERENCES = raw.danglingReferences as readonly {
  readonly reference: string;
  readonly gazettePage: number;
  readonly context: string;
}[];
