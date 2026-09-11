/**
 * Chapter 12 — Provisions for differently abled, elderly and children.
 *
 * Four pages, no tables, and the third of the three compounding bars that cite an unread
 * chapter. Clause 16.1.3(xii) makes "construction in the buildings where measures for
 * access to differently abled persons are mandatory as per chapter 12" non-compoundable,
 * and `accessibilityMandatory` has been a boolean nobody could set.
 *
 * What makes this chapter different from 10 and 11 is what its trigger does NOT contain.
 * The fire certificate turns on height and area; seismic design turns on height, floors and
 * ground cover. **Accessibility turns on use alone.** There is no height threshold, no area
 * threshold and no floor count anywhere in Clause 12.2 — which makes it the only one of the
 * three that is fully computable from what the project model already holds, and the only
 * one that catches a single-storey building.
 *
 * On how far the bar reaches, see `structural.ts` — V-039's argument applies here
 * unchanged, and for the same reason: the literal reading would empty Chapter 16's own
 * ">15-meter height" compounding column.
 */

import type { NbcGroup } from './fire';
import type { OccupancyGroup } from './occupancy';

/** Clause 12.1(e): "The standard size of wheelchair shall be taken as 1050 mm x 750 mm." */
export const WHEELCHAIR_SIZE_MM = { length: 1050, width: 750 } as const;

/**
 * Clause 12.2(a) names its scope as "all buildings and facilities used by the public such
 * as educational, institutional, assembly, commercial, business, mercantile buildings,
 * multi-units and group housing".
 *
 * Those are NBC groups B, C, D, E and F exactly, plus the multi-unit part of group A.
 * Groups G (industrial), H (storage) and J (hazardous) are absent — and conspicuously so,
 * because Clause 10.1.3(b)'s parallel list for the fire certificate names all three. Two
 * lists drafted for two purposes, differing in a way that reads as deliberate: a factory
 * is a special building for fire and is not a building "used by the public".
 */
export const ACCESSIBILITY_NAMED_GROUPS: readonly NbcGroup[] = ['B', 'C', 'D', 'E', 'F'];

/** Clause 12.2(a), final sentence: "It shall not apply to single unit residential dwellings." */
export const SINGLE_DWELLING_EXCLUDED = true;

export type AccessibilityBasis =
  /** An NBC group Clause 12.2(a) names. */
  | 'named_group'
  /** Multi-units or group housing, named expressly within residential. */
  | 'multi_unit_housing'
  /** A single dwelling, excluded by the clause's own final sentence. */
  | 'single_dwelling_excluded'
  /** Industrial, storage or hazardous — not named, and not normally public. */
  | 'not_named';

export interface AccessibilityAssessment {
  readonly mandatory: boolean;
  readonly basis: AccessibilityBasis;
  /**
   * True where the enumerated list does not settle it and the governing words — "used by
   * the public" — would. The app cannot see whether a factory has a public counter.
   */
  readonly dependsOnPublicUse: boolean;
  readonly because: string;
  readonly caveats: readonly string[];
  readonly clauseRef: string;
}

export function assessAccessibility(input: {
  nbcGroup: NbcGroup;
  /**
   * The byelaws' own use category, not the NBC group. Both are needed, because NBC group A
   * is "residential" in a sense the Code means and Chapter 12 does not: a hotel is group
   * A-4 in NBC 2016 and is plainly a building used by the public. Reading the exclusion off
   * the NBC group alone excused every hotel in the state from accessible design.
   */
  occupancyGroup: OccupancyGroup;
  multiUnitHousing: boolean;
  occupancyLabel: string;
}): AccessibilityAssessment {
  const caveats: string[] = [];
  const clauseRef = 'Clause 12.2 (Scope)';

  // The exclusion is narrow and literal: "single unit residential dwellings". It reaches a
  // dwelling, not everything the Code files under group A.
  if (input.occupancyGroup === 'Residential') {
    if (input.multiUnitHousing) {
      return {
        mandatory: true,
        basis: 'multi_unit_housing',
        dependsOnPublicUse: false,
        because: 'Clause 12.2(a) names multi-units and group housing in its scope expressly.',
        caveats,
        clauseRef,
      };
    }
    return {
      mandatory: false,
      basis: 'single_dwelling_excluded',
      dependsOnPublicUse: false,
      because: 'Clause 12.2(a): "It shall not apply to single unit residential dwellings."',
      caveats,
      clauseRef,
    };
  }

  // A use the byelaws treat as commercial, institutional or a workplace is within scope
  // whatever the Code calls it. Hotels are the case that matters: NBC group A, and named
  // by Clause 12.2(a)'s "buildings and facilities used by the public" beyond argument.
  if (input.nbcGroup === 'A') {
    return {
      mandatory: true,
      basis: 'named_group',
      dependsOnPublicUse: false,
      because: `${input.occupancyLabel} is a building used by the public within Clause 12.2(a), `
        + 'whatever its National Building Code group. Only single unit residential dwellings are '
        + 'excluded, and this is not one.',
      caveats,
      clauseRef,
    };
  }

  if (ACCESSIBILITY_NAMED_GROUPS.includes(input.nbcGroup)) {
    return {
      mandatory: true,
      basis: 'named_group',
      dependsOnPublicUse: false,
      because: `Clause 12.2(a) names this use in its scope. Unlike the fire and seismic `
        + 'triggers it sets no height, floor or area threshold, so it applies from the first '
        + 'storey up.',
      caveats,
      clauseRef,
    };
  }

  // G, H, J — industrial, storage, hazardous.
  caveats.push(
    `Clause 12.2(a) applies to "all buildings and facilities used by the public such as" `
    + 'six named categories, and industrial, storage and hazardous buildings are not among '
    + 'them — though Clause 10.1.3(b) names all three for the fire certificate. The list is '
    + 'illustrative rather than closed, so the governing test is whether the building is used '
    + 'by the public, which the project model cannot see. Treated as not mandatory, with the '
    + 'question surfaced rather than settled (V-041).',
  );
  return {
    mandatory: false,
    basis: 'not_named',
    dependsOnPublicUse: true,
    because: `${input.occupancyLabel} is not among the categories Clause 12.2(a) names.`,
    caveats,
    clauseRef,
  };
}

export interface AccessibilityRequirement {
  readonly area: string;
  readonly clause: string;
  readonly requirement: string;
}

/**
 * The dimensional requirements, as a checklist an LTP can work down. Every figure is the
 * gazette's own; nothing here is rounded or converted.
 *
 * Two drafting defects are carried through as the gazette prints them, noted rather than
 * silently corrected:
 *   - Clause 12.4.5(a) prints the accessible WC as "1500 mm x 1750 m" — metres for the
 *     second dimension. 1750 mm is the only reading that is not absurd.
 *   - Clause 12.4.1(d) refers to "paragraph 11.3.1" for guiding floor material. Chapter 11
 *     has no 11.3.1; the definition is at 12.3.1 of this chapter.
 */
export const ACCESSIBILITY_REQUIREMENTS: readonly AccessibilityRequirement[] = [
  { area: 'Access path', clause: '12.3.1', requirement: 'Minimum 1800 mm wide from plot entry and surface parking to the building entrance, even surface, no steps, gradient not steeper than 5%.' },
  { area: 'Access path', clause: '12.3.1', requirement: 'Guiding/warning floor material on the access path, at the landing lobby, at the start and end of a walkway meeting vehicular traffic, at any abrupt change of level or ramp end, and immediately in front of every entrance and exit.' },
  { area: 'Parking', clause: '12.3.2(a)', requirement: 'At least two surface car spaces near the entrance, within 30.0 m travel distance of the building entrance — or of the lift lobby where access is by lift.' },
  { area: 'Parking', clause: '12.3.2(b)', requirement: 'Bay minimum 3.6 m × 5.0 m, the width including a transfer area beside the car of at least 1200 mm. Two adjoining accessible bays may share one 1200 mm transfer bay.' },
  { area: 'Parking', clause: '12.3.2(e)', requirement: 'Drop-off area minimum 9000 mm long × 3600 mm wide, served by a kerb ramp.' },
  { area: 'Ramped approach', clause: '12.4.1(a)', requirement: 'Minimum 1800 mm wide, gradient not steeper than 1:12, length not exceeding 9.0 m, 800 mm handrail both sides extending 300 mm beyond top and bottom, 50 mm clear of the adjacent wall.' },
  { area: 'Stepped approach', clause: '12.4.1(b)', requirement: 'Tread not less than 300 mm, riser not more than 150 mm, 800 mm handrail both sides.' },
  { area: 'Entrance door', clause: '12.4.1(c)', requirement: 'Clear opening at least 900 mm, no step obstructing a wheelchair, threshold not raised more than 12 mm.' },
  { area: 'Entrance landing', clause: '12.4.1(d)', requirement: 'Minimum 1800 mm × 2000 mm adjacent to the ramp, with guiding floor material where it adjoins the top of a slope.' },
  { area: 'Corridor', clause: '12.4.2', requirement: 'Minimum 1500 mm wide, guiding floor material or sound-emitting devices, slope ways at 1:12 with handrails at any change of level.' },
  { area: 'Stairway', clause: '12.4.3', requirement: 'One stairway near the accessible entrance at least 1350 mm wide, riser not more than 150 mm, tread 300 mm, no abrupt nosing, at most 12 risers per flight, handrails both sides extending 300 mm, no fitting projecting more than 90 mm below 2100 mm.' },
  { area: 'Lift', clause: '12.4.4', requirement: 'Where a lift is required, at least one wheelchair-accessible car: clear internal depth 1100 mm, clear internal width 2000 mm, entrance door 900 mm. Handrail at least 600 mm long at 1000 mm above floor beside the control panel.' },
  { area: 'Lift', clause: '12.4.4(b–d)', requirement: 'Lift lobby at least 1800 mm × 1800 mm; automatic door open for at least 5 seconds, closing no faster than 0.25 m/s; audible floor indication and door-state indication inside the car.' },
  { area: 'Toilet', clause: '12.4.5', requirement: 'One accessible WC per set of toilets, minimum 1500 mm × 1750 mm, door clear opening at least 900 mm swinging outward, vertical and horizontal handrails 50 mm clear of the wall, WC seat 500 mm from the door, wash basin near the entrance.' },
  { area: 'Toilet', clause: '12.2(d)', requirement: 'At least one unisex accessible washroom per building; in a multi-level building, one on every floor near the general washrooms.' },
  { area: 'Drinking water', clause: '12.4.6', requirement: 'Provision for the disabled near the accessible toilet.' },
  { area: 'Refuge', clause: '12.4.8', requirement: 'Refuge area at the fire-protected stair landing on each floor holding one or two wheelchairs; doorways 900 mm clear; alarm switch 900–1200 mm above floor; stairs beside the refuge 1500 mm clear between handrails.' },
  { area: 'Signage', clause: '12.4.9', requirement: 'Letters not less than 20 mm high, Braille information board at approachable height, no protruding sign obstructing walking, contrasting and illuminated symbols, public address system in busy public areas, international wheelchair symbol at lift, toilet, staircase and parking.' },
  { area: 'Entrances', clause: '12.2(b)', requirement: 'At least one accessible entrance and exit per facility. In a new building the accessible entrance must be the main public entrance, not a side or back entry.' },
  { area: 'Public facilities', clause: '12.2(c)', requirement: 'Waiting areas, coffee shops, display and merchandising areas, service areas, ticket counters and refreshment stands accessible to all persons with disabilities, not only wheelchair users.' },
  { area: 'Buildings for children', clause: '12.4.7', requirement: 'Where children are the predominant users, handrail and fitting heights must be altered to suit.' },
];

/** Clause 16.1.3(xii), read as V-039 reads its two siblings. */
export const ACCESSIBILITY_NON_COMPOUNDABLE_NOTE =
  'Clause 16.1.3(xii) makes construction that breaches these mandatory provisions '
  + 'non-compoundable — no fee regularises it. As with the seismic and firefighting bars, it '
  + 'is read as catching construction that violates the measures rather than all construction '
  + 'in a building subject to them, because the literal reading would empty Chapter 16\'s own '
  + '">15-meter height" compounding column (V-039).';
