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

/**
 * Which completion-certificate form to file — Appendix-4 and the three parts of Appendix-7.
 *
 * The forms themselves are field templates and carry no rule the chapters do not already
 * state. Their *titles*, though, partition the world, and the partition has a hole in it:
 *
 *   Form A  residential building > 300 sqm
 *   Form B  group housing, commercial and multi-storey building
 *   Form C  buildings OTHER THAN residential, group housing, commercial and multi-storey
 *   Form D  layout plan (Appendix-4)
 *
 * A residential building on a plot between 100 and 300 m² needs a completion certificate —
 * Clause 2.1.2(ii) exempts only up to 100 m² — and Form A excludes it on size, Form B on
 * type, and Form C on type expressly. See V-058.
 */
export type CompletionForm = 'A' | 'B' | 'C' | 'D' | 'none' | 'unmatched';

export interface CompletionFormChoice {
  readonly form: CompletionForm;
  readonly appendix: string;
  readonly title: string;
  readonly note?: string;
}

export function completionFormFor(input: {
  occupancy: OccupancyDefinition;
  plotAreaSqm: number;
  buildingHeightM: number;
  highRiseThresholdM: number;
  /** True where the route is Clause 2.1.2(ii), which requires no completion certificate. */
  exemptRoute: boolean;
}): CompletionFormChoice {
  if (input.exemptRoute) {
    return {
      form: 'none', appendix: '—',
      title: 'No completion certificate is required',
      note: 'Clause 2.1.2(ii): a plot on the no-permission route "shall also not require a '
        + 'completion certificate".',
    };
  }

  const residential = input.occupancy.group === 'Residential';
  const multiStorey = input.buildingHeightM > input.highRiseThresholdM;
  const groupHousingOrCommercial = input.occupancy.id === 'res_group_housing'
    || input.occupancy.group === 'Commercial';

  if (groupHousingOrCommercial || multiStorey) {
    return {
      form: 'B', appendix: 'Appendix-7 Form-B',
      title: 'Completion certificate for group housing, commercial and multi-storey building',
    };
  }
  if (residential) {
    if (input.plotAreaSqm > 300) {
      return {
        form: 'A', appendix: 'Appendix-7 Form-A',
        title: 'Completion certificate for a residential building over 300 sqm',
      };
    }
    return {
      form: 'unmatched', appendix: '—',
      title: 'No completion form matches this building',
      note: 'Form A covers residential buildings over 300 m², Form B group housing, commercial '
        + 'and multi-storey, and Form C buildings "other than residential". A residential '
        + 'building on a plot between 100 and 300 m² needs a completion certificate and is '
        + 'excluded from all three. File Form A, which is the nearest, and expect the authority '
        + 'to have its own practice here (V-058).',
    };
  }
  return {
    form: 'C', appendix: 'Appendix-7 Form-C',
    title: 'Completion certificate for buildings other than residential, group housing, '
      + 'commercial and multi-storey',
  };
}

/** Appendix-4 — the layout-plan completion certificate, filed for a land sub-division. */
export const LAYOUT_COMPLETION_FORM: CompletionFormChoice = {
  form: 'D', appendix: 'Appendix-4 Form-D',
  title: 'Completion certificate for a layout plan',
};

/**
 * Clause 2.7.3 — the procedural clock.
 *
 * Every deadline in the sanction process, and the engine had none of them. They were found
 * by checking a feature suggestion that claimed a "15-day deemed sanction" against Clause
 * 2.1.2, where no such period exists (B-047 removed exactly that claim). It does exist — at
 * **Clause 2.7.3.2(iii)**, on the formal route, and it is the most valuable single deadline
 * in Chapter 2 because it runs in the applicant's favour.
 *
 * Two of these cut against the applicant and two for, which is why listing them together
 * matters more than any one of them.
 */
export interface PermitClock {
  readonly clause: string;
  readonly days: number;
  readonly what: string;
  /** Who the clock runs against. */
  readonly against: 'applicant' | 'authority';
  /** What the applicant must do, where the rule does not operate on its own. */
  readonly actionRequired?: string;
}

export const PERMIT_CLOCKS: readonly PermitClock[] = [
  {
    clause: 'Clause 2.7.3.2(iii)', days: 15, against: 'authority',
    what: 'If the Authority does not intimate refusal or sanction in writing within 15 days of '
      + 'receiving the application, the plan is DEEMED SANCTIONED.',
    actionRequired: 'The deeming is not automatic. It applies only "provided the fact is '
      + 'immediately brought to the notice of the Authority in writing" by the applicant. An '
      + 'applicant who simply waits has not been deemed sanctioned.',
  },
  {
    clause: 'Clause 2.7.3.1(i)', days: 15, against: 'applicant',
    what: 'A shortfall raised against the map or documents must be resolved and the revised map '
      + 'submitted within 15 days, or the map is AUTO-REJECTED.',
  },
  {
    clause: 'Clause 2.7.3.1(ii)', days: 30, against: 'applicant',
    what: 'Fees must be deposited within 30 days of the fee demand, or the map is AUTO-REJECTED.',
  },
  {
    clause: 'Clause 2.2.3(v)', days: DEEMED_NOC_DAYS, against: 'authority',
    what: 'A departmental NOC neither queried nor refused with reasons in writing is deemed given '
      + 'on the 30th day, or earlier where the departmental table specifies fewer days.',
  },
];

/**
 * Clause 2.7.3.1(iii)–(iv) — what an auto-rejected application costs to restart.
 *
 * Worth stating because the ladder is steep and the first rung is free: an applicant who
 * re-applies inside six months pays no permit fee again.
 */
export const REVIVAL_TERMS = {
  /** (iii) An application auto-rejected for non-payment may be revived once, within 6 months. */
  revivalWindowMonths: 6,
  revivalPaymentDays: 30,
  revivalAvailableTimes: 1,
  /** (iv) Fee payable on a fresh application after rejection, by elapsed time. */
  reapplicationFee: [
    { withinMonths: 6, fractionOfFee: 0 },
    { withinMonths: 12, fractionOfFee: 0.20 },
    { withinMonths: 24, fractionOfFee: 0.50 },
    { withinMonths: Infinity, fractionOfFee: 1.00 },
  ],
} as const;

/** Clause 2.7.3.1(iv) — the fee payable on re-applying this many months after rejection. */
export function reapplicationFeeFraction(monthsSinceRejection: number): number {
  const m = Math.max(0, Number(monthsSinceRejection) || 0);
  return REVIVAL_TERMS.reapplicationFee.find((r) => m <= r.withinMonths)?.fractionOfFee ?? 1;
}
