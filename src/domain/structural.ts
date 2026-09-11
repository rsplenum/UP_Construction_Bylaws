/**
 * Chapter 11 — Structural Safety and Quality Control.
 *
 * Seven pages, one table, and almost all of it delegates: Part 6 of NBC 2016, twenty-three
 * Indian Standards by number, IS 18299:2023 for peer reviewers. None of that is a figure an
 * engine can check, and pretending otherwise would be inventing compliance.
 *
 * What the chapter does state in its own right is a set of *thresholds* — which buildings
 * must be designed seismically, which must be peer reviewed, which must be re-audited and
 * how often. Those are computable, and one of them is load-bearing far outside this
 * chapter: Clause 16.1.3(vi) makes "construction in the buildings where earthquake
 * resistance measures are mandatory as per chapter 11.8" non-compoundable, and until now
 * `earthquakeMeasuresMandatory` was a boolean nobody could set because 11.8 had not been
 * read.
 *
 * On how far that bar reaches, see NON_COMPOUNDABLE_READING below. The short version is
 * that the literal reading empties a neighbouring table of all meaning, so it is not the
 * reading this module applies.
 */

/**
 * Clause 11.8.1(i): "Earthquake-proof construction requirements will be applicable to
 * buildings with more than 3 floors including ground floor or more than 12 meters in
 * height and all infrastructure facilities with land cover of more than 500 square
 * meters."
 *
 * Chapter 3 states the same rule a second time — "Buildings more than 3 floors including
 * the ground floor or more than 12 meters high and buildings related to important
 * infrastructure facilities with more than 500 square meters of ground cover" — and the
 * two agree on every figure. Two independent printings agreeing is the strongest
 * confirmation the gazette offers, and it is rare.
 */
export const EARTHQUAKE_HEIGHT_M = 12;
export const EARTHQUAKE_FLOORS_INCLUDING_GROUND = 3;
export const INFRASTRUCTURE_GROUND_COVER_SQM = 500;

/**
 * Clause 11.3: the Authority empanels structural engineers to peer review "the design of
 * buildings with height above 50 m, important service and community buildings or
 * structures, lifeline and emergency buildings and/or large assembly buildings".
 *
 * Note this is a *fourth* height threshold in the byelaws, after 12 m here, 15 m for the
 * fire certificate and 15/17.5 m for a multi-storeyed building. Nothing relates them.
 */
export const PEER_REVIEW_HEIGHT_M = 50;

/**
 * Clause 11.5: a structural audit "first in the tenth year from the date of grant of
 * occupancy permit, and thereafter in every 5 years", for high-rise and special buildings.
 * Above 50 m, by an expert structural engineer only.
 */
export const PERIODIC_AUDIT_FIRST_YEAR = 10;
export const PERIODIC_AUDIT_INTERVAL_YEARS = 5;

/** Clause 11.6's table — which standard governs the retrofit of which structure. */
export const SEISMIC_RETROFIT_STANDARDS: readonly {
  readonly buildingType: string;
  readonly standard: string;
}[] = [
  { buildingType: 'Masonry Buildings', standard: 'IS 13935 — Seismic evaluation, repair and strengthening of masonry buildings' },
  { buildingType: 'Concrete Buildings and Structures', standard: 'IS 15988 — Seismic evaluation and strengthening of existing RCC buildings' },
  { buildingType: 'Low strength masonry buildings', standard: 'IS 13828 — Improving earthquake resistance of low strength masonry buildings' },
  { buildingType: 'Earthen Buildings', standard: 'IS 13827 — Improving earthquake resistance of earthen buildings' },
];

/**
 * How far Clause 16.1.3(vi) reaches — and why this module does not apply it on height
 * alone.
 *
 * Read literally, "construction in the buildings where earthquake resistance measures are
 * mandatory" makes every building over 12 m non-compoundable outright. The standing rule
 * is to take the stricter reading where the gazette is ambiguous, and that would be it.
 *
 * The gazette resolves the ambiguity itself, two clauses later. Chapter 16's own table of
 * compoundable limits has a column headed "Buildings >15-meter height and Group Housing
 * except multi-units", with figures in every row. Under the literal reading that column
 * could never apply to anything: every building it describes is over 12 m and therefore
 * already barred. A reading that empties a neighbouring table of all meaning is the wrong
 * reading, so the bar is taken to catch construction that *violates* the mandatory
 * measures, not all construction in a building subject to them.
 *
 * The same argument applies to bar (vii) — firefighting — and bar (xii) — accessibility.
 * All three share the "buildings where X is mandatory" shape and all three would empty the
 * same column.
 */
export const NON_COMPOUNDABLE_READING =
  'Clause 16.1.3(vi) bars compounding of construction that violates the mandatory '
  + 'earthquake-resistance measures, not all construction in a building subject to them: '
  + 'the literal reading would empty Chapter 16\'s own ">15-meter height" compounding '
  + 'column, which prescribes limits for exactly those buildings.';

export type EarthquakeLimb = 'height' | 'floors' | 'infrastructure_ground_cover';

export interface EarthquakeTrigger {
  readonly limb: EarthquakeLimb;
  readonly clause: string;
  readonly because: string;
}

export interface StructuralSafetyInput {
  /** Metres, to terrace level. */
  readonly buildingHeight: number;
  /**
   * Floors including the ground floor. Undefined where the app cannot see one — a floor
   * count cannot be derived from height, and Clause 11.8.1's first limb needs it.
   */
  readonly floorsIncludingGround?: number;
  /** True for the infrastructure facilities Clause 11.8.1 lists. */
  readonly isImportantInfrastructure?: boolean;
  /** Ground cover in m², for the infrastructure limb only. Not built-up area. */
  readonly groundCoverSqm?: number;
  /** Clause 11.5 applies the audit cycle to high-rise and special buildings. */
  readonly isHighRiseOrSpecial?: boolean;
}

export interface StructuralSafetyAssessment {
  /** Whether Chapter 11.8's seismic design requirements bind this building. */
  readonly earthquakeMeasuresMandatory: boolean;
  readonly triggers: readonly EarthquakeTrigger[];
  /** True where only a floor count could settle it and the app cannot see one. */
  readonly dependsOnFloorCount: boolean;
  /** Clause 11.3 — peer review / proof checking by an empanelled engineer. */
  readonly peerReviewRequired: boolean;
  /** Clause 11.5 — periodic structural audit, and whether it needs an expert engineer. */
  readonly periodicAudit: {
    readonly required: boolean;
    readonly firstAuditYear: number;
    readonly thereafterEveryYears: number;
    readonly expertEngineerOnly: boolean;
  };
  readonly caveats: readonly string[];
  readonly clauseRef: string;
}

export function assessStructuralSafety(input: StructuralSafetyInput): StructuralSafetyAssessment {
  const height = Math.max(0, Number(input.buildingHeight) || 0);
  const triggers: EarthquakeTrigger[] = [];
  const caveats: string[] = [];

  if (height > EARTHQUAKE_HEIGHT_M) {
    triggers.push({
      limb: 'height',
      clause: 'Clause 11.8.1(i)',
      because: `${height} m is more than ${EARTHQUAKE_HEIGHT_M} m.`,
    });
  }

  const floors = input.floorsIncludingGround;
  if (typeof floors === 'number' && floors > EARTHQUAKE_FLOORS_INCLUDING_GROUND) {
    triggers.push({
      limb: 'floors',
      clause: 'Clause 11.8.1(i)',
      because: `${floors} floors including the ground floor is more than ${EARTHQUAKE_FLOORS_INCLUDING_GROUND}.`,
    });
  }

  // The floor limb can fire where the height limb does not: four floors at 2.75 m each
  // stands at 11 m. So an unknown floor count is only immaterial once height has settled it.
  const dependsOnFloorCount = typeof floors !== 'number' && height <= EARTHQUAKE_HEIGHT_M;
  if (dependsOnFloorCount) {
    caveats.push(
      `At ${height} m the height limb of Clause 11.8.1 is not met, but the clause also `
      + `catches any building of more than ${EARTHQUAKE_FLOORS_INCLUDING_GROUND} floors `
      + 'including the ground floor. The project model carries no floor count and one '
      + 'cannot be derived from height, so this is unresolved rather than negative.',
    );
  }

  if (input.isImportantInfrastructure) {
    const cover = input.groundCoverSqm;
    if (typeof cover === 'number') {
      if (cover > INFRASTRUCTURE_GROUND_COVER_SQM) {
        triggers.push({
          limb: 'infrastructure_ground_cover',
          clause: 'Clause 11.8.1(i)',
          because: `An infrastructure facility covering ${cover} m² is more than ${INFRASTRUCTURE_GROUND_COVER_SQM} m².`,
        });
      }
    } else {
      caveats.push(
        'Clause 11.8.1 catches infrastructure facilities with a land cover over '
        + `${INFRASTRUCTURE_GROUND_COVER_SQM} m². The project model carries built-up area `
        + 'across all floors, not ground cover, so this limb cannot be evaluated (V-036).',
      );
    }
  }

  const mandatory = triggers.length > 0;
  if (mandatory) {
    caveats.push(NON_COMPOUNDABLE_READING);
  }

  return {
    earthquakeMeasuresMandatory: mandatory,
    triggers,
    dependsOnFloorCount,
    peerReviewRequired: height > PEER_REVIEW_HEIGHT_M,
    periodicAudit: {
      required: Boolean(input.isHighRiseOrSpecial),
      firstAuditYear: PERIODIC_AUDIT_FIRST_YEAR,
      thereafterEveryYears: PERIODIC_AUDIT_INTERVAL_YEARS,
      expertEngineerOnly: height > PEER_REVIEW_HEIGHT_M,
    },
    caveats,
    clauseRef: 'Clause 11.8.1 (earthquake-resistant construction), 11.3 (peer review), 11.5 (periodic evaluation)',
  };
}

/**
 * Clause 11.2 — the Structural Design Basis Report, Appendix-14. Part 1 always, plus
 * whichever of Parts 2–4 matches the structural system.
 *
 * Clause 11.7 lets two pieces of it arrive late, which matters to anyone planning a
 * submission: items (iii), (x), (xviii), (xix) and (xx) of Part 1 at least one week before
 * construction starts, and for a reinforced concrete framed building the whole of Part 3
 * at least one month before.
 */
export const SDBR_PARTS: readonly { readonly part: string; readonly applies: string }[] = [
  { part: 'Part 1 — General information / data', applies: 'Always' },
  { part: 'Part 2 — Load bearing masonry buildings', applies: 'Load-bearing masonry only' },
  { part: 'Part 3 — Reinforced concrete buildings', applies: 'RC framed buildings only' },
  { part: 'Part 4 — Steel buildings', applies: 'Steel buildings only' },
];

export const SDBR_DEFERRALS: readonly string[] = [
  'Items (iii), (x), (xviii), (xix) and (xx) of Part 1 may be submitted at least one week before construction commences (Clause 11.7 b).',
  'For a reinforced concrete framed building, Part 3 may be completed and submitted at least one month before construction commences, against a certificate lodged with the permit application (Clause 11.7 c).',
];
