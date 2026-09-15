/**
 * What the two plans cost, and which of the two prices is a price for permission.
 *
 * The question this answers is the applicant's second one — "how much can I stretch, and
 * what does the stretch cost" — and the honest answer has a seam down the middle that a
 * single total would hide.
 *
 * **Buying density is a sanction.** Clause 9.2.5 prices purchasable and premium purchasable
 * FAR with a formula, C = Le x Rc x P, and an applicant who pays it is granted the floor
 * area on their sanctioned plan. The money buys permission. It buys nothing but floor area:
 * no setback moves, and the building still has to fit inside the envelope.
 *
 * **Compounding is not.** Chapter 16 prices construction that already exists. Its own words
 * are "offence", "the accused", and an officer left "free to re-prosecute and demolish the
 * construction in contravention of the byelaws"; Clause 16.3.5 has the applicant file "an
 * affidavit for demolition of the non-compoundable part" and then "the Authority shall take
 * a decision on the application". So the compounding figure is not a price for permission.
 * It is an estimate of what regularisation would cost if it were granted, on a building
 * that is already in breach, and it is returned under its own type so that no caller can
 * add it to the first number by accident.
 *
 * The byelaws set neither sanction nor development charges — those are each Authority's own
 * schedule — so `standard` carries no invented figure. Saying "the byelaws price nothing
 * here" is the true answer and a made-up number is not.
 */

import { OccupancyId, getOccupancy } from './occupancy';
import { AreaType } from './far';
import { assessPurchaseFee, splitPurchasedFar } from './purchasable-fee';
import { CompoundingAssessment, assessCompounding } from './compounding';
import { BuildablePlan, CompoundableMargin, EnvelopeStudy, compoundingUseOf } from './envelope';
import type { SetbackFace } from './setbacks';

export interface PriceLine {
  readonly label: string;
  readonly amount: number;
  readonly basis: string;
  readonly working: string;
  readonly clause: string;
}

/** A price that buys a sanction. */
export interface SanctionPrice {
  readonly lines: readonly PriceLine[];
  readonly total: number;
  readonly caveats: readonly string[];
}

/**
 * An estimate of what regularising a breach would cost. Deliberately NOT a `SanctionPrice`:
 * the type keeps the two out of the same total.
 */
export interface RegularisationEstimate {
  readonly lines: readonly PriceLine[];
  readonly total: number;
  readonly assessment: CompoundingAssessment;
  /** The standing warning that this buys no permission. */
  readonly statusNote: string;
  readonly caveats: readonly string[];
}

export interface PricedPlans {
  /** What a sanction costs for the standard plan. The byelaws price nothing here. */
  readonly standard: SanctionPrice;
  /** What the extra density on the maximum plan costs, under Clause 9.2.5. */
  readonly maximum: SanctionPrice;
  /** What the compoundable margin would cost to regularise. Not a sanction. */
  readonly compounding: RegularisationEstimate | null;
}

export const COMPOUNDING_STATUS_NOTE =
  'This is not a fee for permission. Chapter 16 prices construction that has already been '
  + 'carried out: the byelaws call it an offence, require an affidavit undertaking to demolish '
  + 'the non-compoundable part, and leave the officer free to re-prosecute and demolish. The '
  + 'Authority decides each application on its merits, and may refuse. Nothing here can be '
  + 'applied for before building.';

const round2 = (n: number): number => Math.round(n * 100) / 100;
const inr = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

export interface PricingInput {
  study: EnvelopeStudy;
  occupancy: OccupancyId;
  areaType: AreaType;
  /**
   * ₹/m². Clause 16.3.7(c) takes the *residential* rate whatever the building's use, and
   * Clause 9.2.5 takes the circle rate or the Authority's residential rate, whichever is
   * higher. One field serves both because the byelaws point both at the same source.
   */
  landRate: number;
  /** Base FAR for the plot, the divisor in Clause 9.2.5's Le = FP ÷ Base FAR. */
  baseFar: number;
}

/** Price the density the maximum plan buys over the standard one. */
function priceBoughtDensity(input: PricingInput): SanctionPrice {
  const { study } = input;
  const plotArea = study.plotAreaSqm;
  const bought = Math.max(0, study.maximum.floorAreaSqm - study.standard.floorAreaSqm);

  if (bought <= 1e-9 || plotArea <= 0) {
    return {
      lines: [],
      total: 0,
      caveats: [
        'The maximum plan builds no more floor area than the standard one, so there is no '
        + 'density to buy. On this plot the setbacks, not the FAR entitlement, are what bind.',
      ],
    };
  }

  const farTaken = bought / plotArea;
  const tranches = splitPurchasedFar({
    farAboveBase: farTaken,
    baseFar: input.baseFar,
    roadWidth: study.roads.governingRoadWidthM,
  });
  const fee = assessPurchaseFee({
    category: getOccupancy(input.occupancy).purchasableFarCategory,
    baseFar: input.baseFar,
    plotAreaSqm: plotArea,
    landRate: input.landRate,
    purchasableFarAvailed: tranches.purchasable,
    premiumPurchasableFarAvailed: tranches.premiumPurchasable,
  });

  return {
    lines: fee.lines.map((l) => ({
      label: l.kind === 'premiumPurchasable' ? 'Premium purchasable FAR' : 'Purchasable FAR',
      amount: l.charge,
      basis: `${round2(l.additionalFloorAreaSqm)} m² at FAR +${round2(l.farAvailed)}`,
      working: l.working,
      clause: fee.clauseRef,
    })),
    total: fee.totalCharge,
    caveats: [
      `Buying ${round2(bought)} m² takes the building from FAR ${study.standard.farEntitlement} to `
      + `${study.maximum.farEntitlement}. It is a sanctioned entitlement: the money buys the floor `
      + 'area, and no setback moves.',
      ...fee.caveats,
    ],
  };
}

/** What regularising the compoundable margin would cost, if it were granted. */
function priceCompounding(input: PricingInput, plan: BuildablePlan, margin: CompoundableMargin): RegularisationEstimate {
  const { study } = input;
  const definition = getOccupancy(input.occupancy);
  const faces: SetbackFace[] = ['front', 'rear', 'side1', 'side2'];

  const assessment = assessCompounding({
    use: compoundingUseOf(input.occupancy),
    residentialLandRate: input.landRate,
    plotAreaSqm: study.plotAreaSqm,
    heightM: plan.heightM,
    isGroupHousing: definition.setbackTable === 'group_housing',
    isMultiUnit: input.occupancy === 'res_multi',
    // The thirteen Clause 16.3.2 bars turn on facts about the land and the clearances that
    // plot dimensions cannot establish. They are named in the caveats rather than asserted.
    flags: {},
    setbackEncroachmentSqm: margin.encroachmentSqm,
    setbackDeficitFraction: Object.fromEntries(
      faces.map((f) => [f, plan.setbacks[f] > 0 ? margin.depthM[f] / plan.setbacks[f] : 0]),
    ) as Partial<Record<SetbackFace, number>>,
    setbackDeficitM: Object.fromEntries(
      faces.map((f) => [f, margin.depthM[f]]),
    ) as Partial<Record<SetbackFace, number>>,
    excessFarSqm: margin.extraFarSqm,
    excessFarFraction: study.maximum.farEntitlementSqm > 0
      ? margin.extraFarSqm / study.maximum.farEntitlementSqm
      : 0,
    /**
     * Not charged. Clause 16.3.3 allows a height deviation in column A only "without
     * changing the number of floors" — it buys taller floors, never more of them, so it
     * adds no floor area to the plan being drawn and is reported in the caveats instead.
     * Charging the allowance by default put ₹13.6 lakh on a house that had 6 m of headroom
     * under its own ceiling and was making no height deviation at all.
     */
    heightDeviationM: 0,
    heightDeviationFraction: 0,
    buildingPerimeterM: 2 * (study.frontageM + study.depthM),
    floors: plan.floors,
  });

  const lines: PriceLine[] = assessment.lineItems.map((l) => ({
    label: l.label,
    amount: l.amount,
    basis: l.basis,
    working: `${round2(l.quantity)} ${l.unit} × ${inr(l.ratePerUnit)}`,
    clause: `Clause 16.3.8, item ${l.scheduleItem}`,
  }));

  // Items the schedule prices but Clause 16.3.3 puts past its own limit are not payable —
  // they are a refusal, and folding them into a total would sell them as available.
  const overLimit = assessment.overLimitItems.map((l) => l.label);

  return {
    lines,
    total: assessment.totalPayable,
    assessment,
    statusNote: COMPOUNDING_STATUS_NOTE,
    caveats: [
      ...margin.caveats,
      margin.heightHeadroomM > 0
        ? `This plan stands at ${plan.heightM} m under a ceiling of ${plan.setbacks.maxHeight} m, so `
          + `${margin.heightHeadroomM} m of height is available as of right and no height deviation `
          + 'arises. Nothing is charged for height.'
        : margin.extraHeightM > 0
          ? `Clause 16.3.3 would compound ${margin.extraHeightM} m above the permissible height, but `
            + 'only "without changing the number of floors" — taller floors, not more of them. It adds '
            + 'no floor area to this plan, so it is not priced here; elect it and the schedule charges '
            + 'it per running metre of periphery, per floor.'
          : margin.limits.heightBasis,
      ...(overLimit.length
        ? [`Past the Clause 16.3.3 limit and not compoundable at any price: ${overLimit.join('; ')}.`]
        : []),
      ...assessment.blockingReasons,
      ...assessment.caveats,
    ],
  };
}

export function pricePlans(input: PricingInput): PricedPlans {
  const { study } = input;
  const margin = study.compoundable;
  const hasMargin = margin.totalEncroachmentSqm > 1e-9
    || margin.extraFarSqm > 1e-9
    || margin.extraHeightM > 1e-9;

  return {
    standard: {
      lines: [],
      total: 0,
      caveats: [
        'The byelaws set no sanction or development charge — each Development Authority '
        + 'publishes its own schedule — so nothing is priced here. This plan is the applicant\'s '
        + 'entitlement, and it is granted without buying anything.',
        study.standard.bindingNote,
      ],
    },
    maximum: priceBoughtDensity(input),
    compounding: hasMargin ? priceCompounding(input, study.maximum, margin) : null,
  };
}

/** One line of prose for a summary card. */
export function priceSummary(priced: PricedPlans): string {
  const buy = priced.maximum.total;
  const compound = priced.compounding?.total ?? 0;
  if (buy <= 0 && compound <= 0) return 'Nothing to buy and nothing to regularise on this plot.';
  if (buy <= 0) return `Nothing to buy; regularising the margin would cost about ${inr(compound)}.`;
  if (compound <= 0) return `Buying the extra density costs ${inr(buy)}.`;
  return `Buying the extra density costs ${inr(buy)}. Regularising the margin on top would cost `
    + `about ${inr(compound)} — and buys no permission.`;
}
