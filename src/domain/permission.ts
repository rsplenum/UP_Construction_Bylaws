/**
 * Chapter 2.1.2 — which sanction route a project takes.
 *
 * This is the first practical question an applicant asks and the engine answered it from
 * three inline branches in `findings.ts` that nobody had checked against the clause. Reading
 * 2.1.2 against them found four separate errors — see B-047 — of which the serious one let a
 * multi-unit building take a route the clause expressly denies it.
 *
 * The clause sets three routes and states each one's limits twice, by purpose:
 *
 *   (ii)  no permission at all   residential ≤100 m², commercial ≤30 m²
 *   (iii) instant online approval residential ≤500 m² EXCEPT multi-unit, commercial ≤200 m²,
 *                                and only in a layout approved or developed by the Authority
 *   (iv)  full scrutiny           everything else, and high-rise, group housing, multiplexes,
 *                                community facilities and industrial buildings by name
 *
 * Two of the three routes turn on facts about the site that no drawing shows — whether the
 * plot sits in an Authority-approved layout, in a mela area, or in an unauthorised colony.
 * Assuming those favourably is the *laxer* reading in both cases: it would tell an applicant
 * they need no permission when they do. So the route is reported with its conditions
 * attached rather than asserted, in the same posture as the fire and seismic triggers.
 */

import type { OccupancyDefinition } from './occupancy';

/** Clause 2.1.2(ii) — no permission required. */
export const EXEMPT_RESIDENTIAL_MAX_SQM = 100;
export const EXEMPT_COMMERCIAL_MAX_SQM = 30;

/** Clause 2.1.2(iii) — instant online approval on a licensed technical person's certificate. */
export const INSTANT_RESIDENTIAL_MAX_SQM = 500;
export const INSTANT_COMMERCIAL_MAX_SQM = 200;

/** Clause 2.1.2(ii) — the token fee for online self-certification. */
export const SELF_CERTIFICATION_FEE_RUPEES = 1;

/** Clause 2.1.2(v) — the window in which an (ii) or (iii) approval may be revoked. */
export const REVOCATION_WINDOW_DAYS = 30;

/** Clause 2.2.3(v) — when an unanswered departmental NOC is deemed given. */
export const DEEMED_NOC_DAYS = 30;
/** Clause 2.2.3(v)(g)–(h) — the window to object after a deemed NOC, before it is confirmed. */
export const DEEMED_NOC_OBJECTION_DAYS = 7;

export type SanctionRoute = 'exempt' | 'instant_ltp' | 'full_scrutiny';

export interface RouteAssessment {
  readonly route: SanctionRoute;
  readonly clause: string;
  /** Why this route and not the next one up. */
  readonly because: string;
  /**
   * Facts about the site that must hold for this route, which no drawing shows. Empty on
   * the full-scrutiny route, which has no preconditions to fail.
   */
  readonly conditions: readonly string[];
  /** True where a laxer route would apply but for a fact the app cannot see. */
  readonly conditional: boolean;
  readonly caveats: readonly string[];
}

/** Clause 2.1.2(iv) names these by category, whatever the plot size. */
function namedInFullScrutiny(occupancy: OccupancyDefinition): string | null {
  if (occupancy.id === 'res_group_housing') return 'group housing';
  if (occupancy.group === 'Industrial') return 'industrial buildings';
  if (occupancy.id === 'com_mall') return 'multiplexes and malls';
  if (occupancy.group === 'Institutional') return 'community facilities';
  return null;
}

export function assessSanctionRoute(input: {
  occupancy: OccupancyDefinition;
  plotAreaSqm: number;
  /** Metres. Clause 2.1.2(iv) sends "all types of High Rise Buildings" to full scrutiny. */
  buildingHeightM: number;
  /** The threshold at which a building becomes high-rise — Clause 1.2(m) via setbacks.ts. */
  highRiseThresholdM: number;
}): RouteAssessment {
  const { occupancy } = input;
  const area = Math.max(0, Number(input.plotAreaSqm) || 0);
  const isResidential = occupancy.group === 'Residential';
  const isCommercial = occupancy.group === 'Commercial';
  const caveats: string[] = [];

  const named = namedInFullScrutiny(occupancy);
  if (named) {
    return {
      route: 'full_scrutiny',
      clause: 'Clause 2.1.2(iv)',
      because: `Clause 2.1.2(iv) sends ${named} to the full route by name, whatever the plot size.`,
      conditions: [],
      conditional: false,
      caveats,
    };
  }

  if (input.buildingHeightM > input.highRiseThresholdM) {
    return {
      route: 'full_scrutiny',
      clause: 'Clause 2.1.2(iv)',
      because: `Clause 2.1.2(iv) sends "all types of High Rise Buildings" to the full route, and at `
        + `${input.buildingHeightM} m this is one.`,
      conditions: [],
      conditional: false,
      caveats,
    };
  }

  // (ii) — no permission. Single-unit residential only: a multi-unit building is not a
  // "plot for residential purpose" of the kind (ii) contemplates, and (iii) excludes it
  // expressly, so the stricter reading keeps it out of both.
  const exemptLimit = isResidential ? EXEMPT_RESIDENTIAL_MAX_SQM : isCommercial ? EXEMPT_COMMERCIAL_MAX_SQM : null;
  if (exemptLimit !== null && area <= exemptLimit && !occupancy.multiUnitHousing) {
    return {
      route: 'exempt',
      clause: 'Clause 2.1.2(ii)',
      because: `${isResidential ? 'Residential' : 'Commercial'} plots up to ${exemptLimit} m² require no `
        + `building permission — an online self-declaration with a token ₹${SELF_CERTIFICATION_FEE_RUPEES} `
        + 'registration, and no completion certificate.',
      conditions: [
        'The plot is NOT in a mela area declared under the Uttar Pradesh Melas Act, 1938',
        'The plot is NOT in an unauthorised layout or colony',
        'All master plan, zonal plan and byelaw provisions are complied with',
        'The plot was not created by splitting a plot larger than 100 m² for this purpose',
      ],
      conditional: true,
      caveats: [
        `The exemption is revocable within ${REVOCATION_WINDOW_DAYS} days if the approval was obtained `
        + 'by misrepresentation (Clause 2.1.2(v)), and the onus for the self-certification rests '
        + 'personally on the applicant, who is liable for a false declaration.',
      ],
    };
  }

  // (iii) — instant approval. Multi-unit is excluded in the clause's own words.
  const instantLimit = isResidential ? INSTANT_RESIDENTIAL_MAX_SQM : isCommercial ? INSTANT_COMMERCIAL_MAX_SQM : null;
  if (instantLimit !== null && area <= instantLimit) {
    if (occupancy.multiUnitHousing) {
      return {
        route: 'full_scrutiny',
        clause: 'Clause 2.1.2(iii) and (iv)',
        because: 'Clause 2.1.2(iii) gives instant approval to residential plots up to '
          + `${INSTANT_RESIDENTIAL_MAX_SQM} m² "(except multi-unit)". This is multi-unit, so it falls `
          + 'to Clause 2.1.2(iv) and the full route however small the plot.',
        conditions: [],
        conditional: false,
        caveats,
      };
    }
    return {
      route: 'instant_ltp',
      clause: 'Clause 2.1.2(iii)',
      because: `${isResidential ? 'Residential' : 'Commercial'} plots up to ${instantLimit} m² in a layout `
        + 'approved or developed by the Authority get instant online approval, on plans prepared and '
        + 'certified by a licensed technical person.',
      conditions: [
        'The plot is in a layout approved or developed by the Authority',
        'The plans are prepared by a licensed technical person and certified as compliant with the '
        + 'master plan and byelaws',
        'All required information and details are furnished and the fee is paid',
      ],
      conditional: true,
      caveats: [
        `Approval is revocable within ${REVOCATION_WINDOW_DAYS} days for misrepresentation, and the owner, `
        + 'applicant and licensed technical person are each personally liable for a false declaration '
        + '(Clause 2.1.2(iii) and (v)).',
      ],
    };
  }

  return {
    route: 'full_scrutiny',
    clause: 'Clause 2.1.2(iv)',
    because: isResidential || isCommercial
      ? `At ${area} m² this is past the ${instantLimit} m² limit for instant approval, so one common `
        + 'application goes through the web-based system with inter-departmental NOCs.'
      : 'Clause 2.1.2(iv) catches "all other categories" — the two lighter routes are stated for '
        + 'residential and commercial plots only.',
    conditions: [],
    conditional: false,
    caveats: [
      `Clause 2.2.3(v): where a department neither seeks details nor rejects the application with `
      + `reasons recorded in writing, its NOC is deemed given on the ${DEEMED_NOC_DAYS}th day — or `
      + 'earlier where the departmental table specifies fewer days. A deemed NOC may be objected to '
      + `within ${DEEMED_NOC_OBJECTION_DAYS} days, after which it is confirmed.`,
    ],
  };
}
