/**
 * EWS and LIG reservation — Chapter 4.3, read from the gazette PDF (p.79–81).
 *
 * What the engine had wrong before this file existed:
 *
 *   - It cited Clause 4.1.2, which is Minimum Plot Size. The rule is at 4.3.1, and the
 *     fee formula at 4.3.11.
 *   - It offered the shelter fee as an unconditional alternative to building the units.
 *     The gazette allows it only "For plots less than 4 Ha". On four hectares or more the
 *     units must be built, and telling a large developer otherwise is the worst direction
 *     to be wrong in (B-015).
 *   - It applied only to group housing and mixed use, exempting multi-unit plotted
 *     development from an obligation the gazette places on any project above one unit
 *     (B-014).
 *   - It did not model the affordable-housing exemption at 4.4 Note-2.
 */

/**
 * Clause 4.3.1: "For all housing projects (except affordable housing schemes) having more
 * than one unit, a 10% each of the total units shall be mandatorily reserved for
 * Economically Weaker Section (EWS) and Lower Income Group (LIG) housing respectively.
 * For plots less than 4 Ha, provision to deposit shelter fee shall be applicable."
 */
export const EWS_RESERVATION = 0.10;
export const LIG_RESERVATION = 0.10;

/** The shelter fee is available only below this plot size. 4 hectares = 40,000 m². */
export const SHELTER_FEE_MAX_PLOT_SQM = 40_000;

/**
 * Clause 4.3.3, minimum sizes. The plotted figures are plot areas; the group-housing
 * figures are carpet areas, and it is the carpet areas the fee formula uses.
 *
 *                              EWS          LIG
 *   Plotted (plot size)        =>35 – 40    >40 – 50
 *   Group Housing (carpet)     =>30 – 35    >35 – 45
 */
export const MIN_SIZES = {
  plottedPlotSqm: { ews: 35, lig: 40 },
  groupHousingCarpetSqm: { ews: 30, lig: 35 },
} as const;

/**
 * Clause 4.3.11: "Shelter Fees = 10% of [(total number of dwelling units) X (minimum EWS
 * dwelling unit carpet area + minimum LIG dwelling unit carpet area) X Circle Rate]".
 *
 * The total-unit count factors straight out, so the fee has an exact per-unit form that
 * can be quoted without knowing how many units a scheme will hold:
 *
 *     0.10 × (30 + 35) × circleRate  =  6.5 × circleRate  per dwelling unit
 */
export const SHELTER_FEE_SQM_PER_UNIT =
  EWS_RESERVATION * (MIN_SIZES.groupHousingCarpetSqm.ews + MIN_SIZES.groupHousingCarpetSqm.lig);

export function shelterFeePerUnit(circleRate: number): number {
  return Math.max(0, Number(circleRate) || 0) * SHELTER_FEE_SQM_PER_UNIT;
}

export function shelterFee(dwellingUnits: number, circleRate: number): number {
  return Math.max(0, Number(dwellingUnits) || 0) * shelterFeePerUnit(circleRate);
}

export interface SocialHousingObligation {
  readonly applies: boolean;
  /** True where the units may be bought out instead of built. */
  readonly shelterFeeAvailable: boolean;
  /** ₹ per dwelling unit, where the buy-out is available. */
  readonly shelterFeePerUnit: number;
  readonly reason: string;
  readonly clause: string;
}

export function assessSocialHousing(input: {
  /** More than one dwelling unit — the Clause 4.3.1 trigger. */
  multiUnitHousing: boolean;
  plotAreaSqm: number;
  circleRate: number;
  /** Clause 4.4 Note-2 exempts a qualifying affordable-housing scheme entirely. */
  isAffordableHousingScheme?: boolean;
}): SocialHousingObligation {
  const clause = 'Chapter 4.3.1 (reservation) and 4.3.11 (shelter fee)';

  if (input.isAffordableHousingScheme) {
    return {
      applies: false, shelterFeeAvailable: false, shelterFeePerUnit: 0,
      reason: 'Clause 4.4 Note-2: in an affordable housing scheme the mandatory EWS and '
        + 'LIG requirement and the shelter fee do not apply at all.',
      clause,
    };
  }

  if (!input.multiUnitHousing) {
    return {
      applies: false, shelterFeeAvailable: false, shelterFeePerUnit: 0,
      reason: 'Clause 4.3.1 applies to housing projects having more than one dwelling unit.',
      clause,
    };
  }

  const belowFourHectares = input.plotAreaSqm < SHELTER_FEE_MAX_PLOT_SQM;
  return {
    applies: true,
    shelterFeeAvailable: belowFourHectares,
    shelterFeePerUnit: belowFourHectares ? shelterFeePerUnit(input.circleRate) : 0,
    reason: belowFourHectares
      ? 'Below 4 hectares, the units may be provided or a shelter fee deposited instead.'
      : 'At 4 hectares and above the gazette offers no shelter fee: the units have to be built.',
    clause,
  };
}
