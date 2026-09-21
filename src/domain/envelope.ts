/**
 * How much building this plot will actually take — solved, not asked.
 *
 * Every other module here answers a question of the form "given a building, is it lawful".
 * This one runs the question backwards: given a plot, what is the largest lawful building,
 * and which rule is the one stopping it from being larger. That inversion is the whole
 * point, because the forward question needs a floor area and a height, and an applicant
 * standing on a plot has neither. They have a plot and a number of floors in mind.
 *
 * ## Why it has to be a search
 *
 * The obvious arithmetic — footprint x floors, clamped to FAR — is wrong, because the
 * inputs depend on the output. Floors set the height; height above 15 m moves the building
 * onto Clause 3.2.4.9's progressive fire-tender ladder; that ladder's setbacks shrink the
 * footprint; a smaller footprint needs more floors for the same area. The loop is real and
 * it does not always converge upward. On a 500 m² commercial plot at 20 x 25 m on an 18 m
 * road:
 *
 *     5 floors @ 15.0 m    setbacks 4.5/3/1.5/1.5    footprint 297.5 m²   1,488 m²
 *     6 floors @ 18.0 m    setbacks 6/6/6/6          footprint 104.0 m²     624 m²
 *
 * The sixth floor destroys 864 m² of floor area. The plot would need about fifteen storeys
 * to climb back to where five had already put it, and no table on it reaches fifteen
 * storeys. The right answer is "five floors, and stop at exactly 15.0 m" — which no
 * applicant arrives at with a calculator, and which this module finds by evaluating every
 * floor count and keeping the best.
 *
 * So the ladder is returned whole, not just its maximum. A reader who is told "five floors"
 * deserves to see what the sixth would have cost them.
 */

import { GreenRating } from './project';
import { OccupancyId, getOccupancy } from './occupancy';
import { AreaType, resolveBaseFar } from './far';
import { GroundCoverageLimit, resolveGroundCoverage } from './ground-coverage';
import { PlotRoads } from './roads';
import {
  HIGH_RISE_THRESHOLD_M, RequiredSetbacks, SetbackFace, resolveRequiredSetbacks,
} from './setbacks';
import { CompoundableLimits, CompoundingUse, compoundableLimits } from './compounding';

/**
 * Floor-to-floor height, in metres, when the applicant has given a floor count and not a
 * height.
 *
 * The byelaws set a minimum ROOM height of 2.75 m for every habitable room in the
 * "Requirements of Parts of Building" table, and say nothing about the slab between one
 * room and the next. 3.0 m is that minimum plus a 250 mm structural depth, which is the
 * shallowest slab that spans an ordinary residential bay — so this is the assumption that
 * makes the fewest floors fit under a height cap, and therefore the one that cannot
 * over-permit. It is exposed on the result and overridable, because it is an assumption and
 * not a rule, and a 3.3 m commercial floor is perfectly ordinary.
 */
export const DEFAULT_FLOOR_TO_FLOOR_M = 3.0;

/** The gazette's minimum room height, quoted so the derivation above can be checked. */
export const MIN_ROOM_HEIGHT_M = 2.75;

/** No table in the byelaws reaches this, so a search past it is wasted work. */
const MAX_FLOORS_SEARCHED = 40;

/**
 * Clause 3.2.4.3 Note-1's ceiling: "In commercial building with covered area on ground
 * floor up to 500 sqm, if lighting and ventilation requirements are ensured, then setbacks
 * shall not be mandatory along the rear and the side edges."
 */
export const NOTE1_MAX_GROUND_FLOOR_SQM = 500;

/** What is stopping the building from being bigger. */
export type BindingConstraint =
  /** The FAR entitlement is exhausted — the plot could hold more but the ratio may not. */
  | 'far'
  /** The setbacks leave too little ground to reach the FAR entitlement. */
  | 'footprint'
  /** A printed floor-count ceiling — Table 3.2.1's "3 floors + stilt". */
  | 'floors'
  /** A printed height ceiling. */
  | 'height';

export const BINDING_LABEL: Readonly<Record<BindingConstraint, string>> = {
  far: 'Floor Area Ratio',
  footprint: 'The setbacks',
  floors: 'The floor-count ceiling',
  height: 'The height ceiling',
};

/** One candidate building: a floor count and everything that follows from it. */
export interface FloorRung {
  readonly floors: number;
  readonly heightM: number;
  readonly setbacks: RequiredSetbacks;
  readonly coverage: GroundCoverageLimit;
  /** Ground floor area the setbacks leave, in m². */
  readonly footprintSqm: number;
  /** Footprint over every floor, before FAR is applied. */
  readonly grossSqm: number;
  /** What the applicant may actually build: the gross, clamped to the FAR entitlement. */
  readonly usableSqm: number;
  /** Set where this floor count is not permitted at all, with the reason. */
  readonly refusedBecause: string | null;
  readonly isHighRise: boolean;
}

/** A floor count that costs more than it earns, and how much. */
export interface Cliff {
  readonly atFloors: number;
  readonly lossSqm: number;
  readonly fromFootprintSqm: number;
  readonly toFootprintSqm: number;
  readonly note: string;
}

export interface BuildablePlan {
  readonly floors: number;
  readonly heightM: number;
  readonly setbacks: RequiredSetbacks;
  readonly coverage: GroundCoverageLimit;
  readonly footprintSqm: number;
  readonly floorAreaSqm: number;
  /** The FAR this building actually works out at. */
  readonly farAchieved: number;
  /** The FAR entitlement it was measured against. */
  readonly farEntitlement: number;
  readonly farEntitlementSqm: number;
  readonly binding: BindingConstraint;
  readonly bindingNote: string;
  /** Floor area the entitlement allows but the plot's geometry cannot take. */
  readonly strandedSqm: number;
}

/** The compoundable margin, per face and in total. Chapter 16, and retrospective. */
export interface CompoundableMargin {
  readonly limits: CompoundableLimits;
  /** How far into each setback construction may go, in metres. */
  readonly depthM: Readonly<Record<SetbackFace, number>>;
  /** The ground-floor area that encroachment represents, in m². */
  readonly encroachmentSqm: Readonly<Record<SetbackFace, number>>;
  readonly totalEncroachmentSqm: number;
  /**
   * Floor area the compounding route could still add, after Clause 16.3.8(v).
   *
   * 16.3.3 allows "up to a maximum of 10% of total permissible FAR" — but 16.3.8(v) says
   * "The authority shall not permit or compound any construction beyond the limit of
   * maximum permissible FAR", so the 10% is headroom below that ceiling and not above it.
   * A plan that has already bought its way to the ceiling has none of it left, and this is
   * then 0: for that building compounding buys shape, not size.
   */
  readonly extraFarSqm: number;
  /** The 10% of 16.3.3 before 16.3.8(v)'s ceiling is applied, so the two can be shown apart. */
  readonly farAllowanceSqm: number;
  /** True where 16.3.8(v) has taken the whole allowance away. */
  readonly farHeadroomExhausted: boolean;
  /**
   * 16.3.3 — 10% above the PERMISSIBLE height in column A, nothing in column B.
   *
   * Measured against the ceiling the building is entitled to, not against the height it
   * happens to reach: a three-storey house at 9 m under a 15 m ceiling has 6 m of headroom
   * as of right and needs no compounding to use it. Taking the previous reading — 10% of
   * the plan's own height — put a ₹13.6 lakh height-deviation charge on a house with 6 m to
   * spare, two thirds of its whole compounding bill, for a deviation nobody was making.
   *
   * It buys no floor area either way. Clause 16.3.3 allows the height deviation only
   * "without changing the number of floors", so it is taller floors and not more of them,
   * and `plan-pricing.ts` reports it rather than charging for it.
   */
  readonly extraHeightM: number;
  /** True where the plan has height left under its own ceiling, so the allowance is moot. */
  readonly heightHeadroomM: number;
  readonly footprintWithMarginSqm: number;
  readonly caveats: readonly string[];
}

export interface EnvelopeStudy {
  readonly roads: PlotRoads;
  readonly plotAreaSqm: number;
  readonly frontageM: number;
  readonly depthM: number;
  readonly floorToFloorM: number;
  /** Every floor count evaluated, so the reader can see what the next one would cost. */
  readonly ladder: readonly FloorRung[];
  /** What a sanction grants without any extra payment. */
  readonly standard: BuildablePlan;
  /** What it grants once purchasable and premium FAR are bought. */
  readonly maximum: BuildablePlan;
  /** What Chapter 16 would forgive on top — retrospectively, and at the Authority's discretion. */
  readonly compoundable: CompoundableMargin;
  readonly cliff: Cliff | null;
  readonly caveats: readonly string[];
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface EnvelopeInput {
  occupancy: OccupancyId;
  plotAreaSqm: number;
  frontageM: number;
  depthM: number;
  roads: PlotRoads;
  areaType: AreaType;
  greenRating?: GreenRating;
  isAffordableHousingScheme?: boolean;
  zonalCoverageCapPct?: number;
  floorToFloorM?: number;
  /** Clause 3.2.4.3 Note-1, which the applicant has to declare. */
  lightVentilationEnsured?: boolean;
}

/** Which fee column of Chapter 16 a use sits in. */
export function compoundingUseOf(occupancy: OccupancyId): CompoundingUse {
  const d = getOccupancy(occupancy);
  if (d.id.startsWith('res_')) return 'residential';
  if (d.id === 'office') return 'office';
  if (d.id.startsWith('ind_')) return 'industrial';
  if (d.id.startsWith('inst_')) return 'facilities';
  return 'commercial';
}

/**
 * Walk every floor count and keep the best.
 *
 * `farCapSqm` is what makes one call answer for both plans: pass the base entitlement and
 * the result is what a sanction grants as of right; pass the maximum and it is what the
 * same plot grants once the density has been bought. The geometry is identical either way,
 * which is the point — buying FAR does not move a setback.
 */
function solve(input: EnvelopeInput, farCapSqm: number, farEntitlement: number): {
  plan: BuildablePlan; ladder: readonly FloorRung[]; cliff: Cliff | null;
} {
  const floorToFloor = input.floorToFloorM && input.floorToFloorM > 0
    ? input.floorToFloorM : DEFAULT_FLOOR_TO_FLOOR_M;
  const ladder: FloorRung[] = [];

  for (let floors = 1; floors <= MAX_FLOORS_SEARCHED; floors++) {
    const heightM = round2(floors * floorToFloor);
    const zonalCap = input.zonalCoverageCapPct && input.zonalCoverageCapPct > 0
      ? input.zonalCoverageCapPct : null;

    const base = {
      occupancy: input.occupancy,
      plotArea: input.plotAreaSqm,
      buildingHeight: heightM,
      isCornerPlot: input.roads.isCorner,
      roadWidth: input.roads.governingRoadWidthM,
      roads: input.roads,
      areaType: input.areaType,
    };
    const geometry = {
      occupancy: input.occupancy,
      plotAreaSqm: input.plotAreaSqm,
      plotFrontageM: input.frontageM,
      plotDepthM: input.depthM,
      // Which edge the byelaws front the plot on, so the setbacks land on the axis they
      // actually govern rather than the one they were named after.
      frontSide: input.roads.frontSide,
    };

    // The table's own answer.
    let setbacks = resolveRequiredSetbacks(base);
    let coverage = resolveGroundCoverage({ ...geometry, required: setbacks, capPct: zonalCap });

    /**
     * Clause 3.2.4.3 Note-1 is an ALTERNATIVE, not a replacement, and it is one the
     * applicant elects: cover no more than 500 m² of ground and the rear and side setbacks
     * stop being mandatory. So it is evaluated as a second candidate and kept only where it
     * leaves more ground than the table does — which on a small plot it does not, because
     * the 500 m² ceiling it trades for is below what the table already allows.
     *
     * Its 500 m² enters through `capPct` so that one resolver still owns the arithmetic and
     * `restrictedByCap` stays true to what is binding. The cap is the note's, not a master
     * plan's, and the caveat below says so.
     */
    if (input.lightVentilationEnsured && !setbacks.isHighRise) {
      const noteSetbacks = resolveRequiredSetbacks({
        ...base, groundFloorCoveredAreaSqm: NOTE1_MAX_GROUND_FLOOR_SQM, lightVentilationEnsured: true,
      });
      if (noteSetbacks !== setbacks && input.plotAreaSqm > 0) {
        const notePct = Math.min(100, (NOTE1_MAX_GROUND_FLOOR_SQM / input.plotAreaSqm) * 100);
        const noteCoverage = resolveGroundCoverage({
          ...geometry,
          required: noteSetbacks,
          capPct: zonalCap == null ? notePct : Math.min(zonalCap, notePct),
        });
        if (noteCoverage.governingSqm > coverage.governingSqm + 1e-9) {
          setbacks = noteSetbacks;
          coverage = noteCoverage;
        }
      }
    }

    let refusedBecause: string | null = null;
    if (setbacks.maxFloorsNum != null && floors > setbacks.maxFloorsNum) {
      refusedBecause = `${setbacks.bandLabel} allows ${setbacks.maxFloors}.`;
    } else if (Number.isFinite(setbacks.maxHeight) && heightM > setbacks.maxHeight + 1e-9) {
      refusedBecause = `${heightM} m is above the ${setbacks.maxHeight} m this building may reach.`;
    } else if (coverage.governingSqm <= 0) {
      refusedBecause = 'The setbacks at this height leave no ground to build on.';
    }

    const footprintSqm = coverage.governingSqm;
    const grossSqm = footprintSqm * floors;

    ladder.push({
      floors, heightM, setbacks, coverage,
      footprintSqm,
      grossSqm,
      usableSqm: refusedBecause ? 0 : Math.min(grossSqm, farCapSqm),
      refusedBecause,
      isHighRise: setbacks.isHighRise,
    });

    // Once the footprint has collapsed and the ceiling is in sight, nothing above can win.
    if (refusedBecause && floors > 1 && setbacks.maxFloorsNum != null) break;
  }

  const permitted = ladder.filter((r) => !r.refusedBecause);
  const best = permitted.reduce<FloorRung | null>(
    (acc, r) => (!acc || r.usableSqm > acc.usableSqm + 1e-9 ? r : acc), null,
  ) ?? ladder[0];

  // The cliff: the first permitted rung above the best that gives back less than the best.
  let cliff: Cliff | null = null;
  const next = permitted.find((r) => r.floors === best.floors + 1);
  if (next && next.usableSqm < best.usableSqm - 1e-9) {
    cliff = {
      atFloors: next.floors,
      lossSqm: round2(best.usableSqm - next.usableSqm),
      fromFootprintSqm: round2(best.footprintSqm),
      toFootprintSqm: round2(next.footprintSqm),
      note:
        `A ${next.floors}th floor takes the building to ${next.heightM} m, past the `
        + `${HIGH_RISE_THRESHOLD_M} m high-rise threshold, and Clause 3.2.4.9's progressive `
        + `fire-tender setbacks then apply on all four sides. The footprint falls from `
        + `${round2(best.footprintSqm)} m² to ${round2(next.footprintSqm)} m², so the extra floor `
        + `costs ${round2(best.usableSqm - next.usableSqm)} m² of floor area rather than adding any.`,
    };
  }

  const binding: BindingConstraint =
    best.grossSqm > farCapSqm + 1e-9 ? 'far'
    : best.setbacks.maxFloorsNum != null && best.floors >= best.setbacks.maxFloorsNum ? 'floors'
    : cliff ? 'footprint'
    : 'height';

  const strandedSqm = Math.max(0, farCapSqm - best.usableSqm);

  return {
    plan: {
      floors: best.floors,
      heightM: best.heightM,
      setbacks: best.setbacks,
      coverage: best.coverage,
      footprintSqm: round2(best.footprintSqm),
      floorAreaSqm: round2(best.usableSqm),
      farAchieved: input.plotAreaSqm > 0 ? round2(best.usableSqm / input.plotAreaSqm) : 0,
      farEntitlement,
      farEntitlementSqm: round2(farCapSqm),
      binding,
      bindingNote:
        binding === 'far'
          ? `The setbacks would carry ${round2(best.grossSqm)} m² over ${best.floors} floors, but the `
            + `FAR entitlement of ${farEntitlement} stops at ${round2(farCapSqm)} m². The ratio binds, `
            + 'not the plot.'
          : binding === 'floors'
            ? `${best.setbacks.bandLabel} allows ${best.setbacks.maxFloors}, which is reached here. `
              + `${round2(strandedSqm)} m² of the FAR entitlement cannot be used.`
            : binding === 'footprint'
              ? `The setbacks hold the footprint to ${round2(best.footprintSqm)} m², and going higher `
                + `costs more ground than it gains. ${round2(strandedSqm)} m² of the entitlement is `
                + 'out of reach.'
              : `The height ceiling is reached at ${best.heightM} m.`,
      strandedSqm: round2(strandedSqm),
    },
    ladder,
    cliff,
  };
}

/**
 * The compoundable margin — what Chapter 16 would forgive, drawn so it can be marked.
 *
 * This is NOT a sanction route and the shape of this function says so: it is computed from
 * the standard plan rather than folded into it, and every figure it returns is labelled
 * separately, because the gazette's compounding chapter is written about construction that
 * already exists. Its own words are "offence", "the accused", and an officer who stays
 * "free to re-prosecute and demolish". An applicant at the drawing board who builds to this
 * line is not buying permission; they are choosing to be in breach and hoping to pay their
 * way out, and the Authority "shall take a decision on the application" either way.
 */
export function resolveCompoundableMargin(input: {
  occupancy: OccupancyId;
  plotAreaSqm: number;
  frontageM: number;
  depthM: number;
  plan: BuildablePlan;
  maxPermissibleBuiltUpAreaSqm: number;
}): CompoundableMargin {
  const definition = getOccupancy(input.occupancy);
  const limits = compoundableLimits({
    heightM: input.plan.heightM,
    isGroupHousing: definition.setbackTable === 'group_housing',
    isMultiUnit: input.occupancy === 'res_multi',
    plotAreaSqm: input.plotAreaSqm,
    use: compoundingUseOf(input.occupancy),
  });

  const faces: SetbackFace[] = ['front', 'rear', 'side1', 'side2'];
  const depthM = {} as Record<SetbackFace, number>;
  const encroachmentSqm = {} as Record<SetbackFace, number>;

  for (const face of faces) {
    const required = input.plan.setbacks[face];
    const limit = limits.setback[face];
    // The gazette states the front and rear allowances as a fraction of the setback AREA
    // and the sides as a fraction of the setback WIDTH. On a rectangular strip of uniform
    // depth the two are the same fraction of the depth, so one expression serves both.
    const d = Math.min(required * limit.fraction, limit.maxDepthM);
    depthM[face] = round2(d);
    const runM = face === 'front' || face === 'rear'
      ? Math.max(0, input.frontageM - input.plan.setbacks.side1 - input.plan.setbacks.side2)
      : Math.max(0, input.depthM - input.plan.setbacks.front - input.plan.setbacks.rear);
    encroachmentSqm[face] = round2(d * runM);
  }

  const totalEncroachmentSqm = round2(faces.reduce((sum, f) => sum + encroachmentSqm[f], 0));

  // The height the building is entitled to, and how much of it the plan has not used.
  const ceilingM = Number.isFinite(input.plan.setbacks.maxHeight)
    ? input.plan.setbacks.maxHeight : input.plan.heightM;
  const headroomM = Math.max(0, ceilingM - input.plan.heightM);

  // 16.3.3's allowance, and then 16.3.8(v)'s ceiling over the top of it.
  const farAllowanceSqm = round2(input.maxPermissibleBuiltUpAreaSqm * limits.farFraction);
  const headroomToCeiling = Math.max(0, input.maxPermissibleBuiltUpAreaSqm - input.plan.floorAreaSqm);
  const extraFarSqm = round2(Math.min(farAllowanceSqm, headroomToCeiling));
  const farHeadroomExhausted = extraFarSqm <= 1e-9 && farAllowanceSqm > 1e-9;

  const caveats: string[] = [
    'Chapter 16 regularises construction that has already been carried out. It is not a route '
    + 'to a sanction: nothing here can be applied for in advance, and an applicant who builds to '
    + 'this line is in breach until the Authority decides otherwise.',
    'Clause 16.3.2 lists thirteen offences that cannot be compounded at any price. None of them '
    + 'can be checked from plot dimensions alone.',
  ];

  if (farHeadroomExhausted) {
    caveats.push(
      `Clause 16.3.8(v): "The authority shall not permit or compound any construction beyond the `
      + `limit of maximum permissible FAR." This plan already reaches that ceiling, so the 10% of `
      + `Clause 16.3.3 — ${farAllowanceSqm} m² — has nothing left to sit in. Compounding cannot add `
      + `floor area to this building at any price. What the setback margin below buys is a wider `
      + `footprint for the same total area: the same building on fewer floors, not a bigger one.`,
    );
  } else {
    caveats.push(
      `Clause 16.3.3 allows up to 10% of the total permissible FAR — ${farAllowanceSqm} m² here — `
      + `and Clause 16.3.8(v) caps the building at the maximum permissible FAR whatever route it `
      + `takes, leaving ${extraFarSqm} m². Buying that density under Clause 9.2.5 is the lawful `
      + 'route to the same square metres and is priced beside this one.',
    );
  }

  caveats.push(
    'Clause 16.3.3 note: "Construction in front, rear and side setbacks shall be counted while '
    + `calculating the maximum permissible compoundable area." The ${totalEncroachmentSqm} m² of `
    + 'setback encroachment is drawn against that same allowance, not added to it.',
  );

  if (limits.setback.front.requiresFireNoc) {
    caveats.push('Above 15 m the allowance is conditional on a Fire NOC (Clause 16.3.3).');
  }
  if (limits.heightFraction === 0) {
    caveats.push(limits.heightBasis);
  }
  for (const face of faces) {
    const c = limits.setback[face].condition;
    if (c && !caveats.includes(c)) caveats.push(c);
  }

  return {
    limits,
    depthM,
    encroachmentSqm,
    totalEncroachmentSqm,
    extraFarSqm,
    farAllowanceSqm,
    farHeadroomExhausted,
    extraHeightM: round2(ceilingM * limits.heightFraction),
    heightHeadroomM: round2(headroomM),
    footprintWithMarginSqm: round2(input.plan.footprintSqm + totalEncroachmentSqm),
    caveats,
  };
}

/** The whole study: both plans, the ladder behind them, and the compoundable margin. */
export function studyEnvelope(input: EnvelopeInput): EnvelopeStudy {
  const far = resolveBaseFar({
    occupancy: input.occupancy,
    plotArea: input.plotAreaSqm,
    roadWidth: input.roads.governingRoadWidthM,
    greenRating: input.greenRating,
    areaType: input.areaType,
    isAffordableHousingScheme: input.isAffordableHousingScheme,
  });

  const asOfRight = solve(input, far.effectiveBuiltUpArea || far.baseBuiltUpArea, far.effectiveBaseFar || far.baseFar);
  const bought = solve(input, far.maxPermissibleBuiltUpArea, far.maxPermissibleFar);

  const compoundable = resolveCompoundableMargin({
    occupancy: input.occupancy,
    plotAreaSqm: input.plotAreaSqm,
    frontageM: input.frontageM,
    depthM: input.depthM,
    plan: bought.plan,
    maxPermissibleBuiltUpAreaSqm: far.maxPermissibleBuiltUpArea,
  });

  return {
    roads: input.roads,
    plotAreaSqm: input.plotAreaSqm,
    frontageM: input.frontageM,
    depthM: input.depthM,
    floorToFloorM: input.floorToFloorM ?? DEFAULT_FLOOR_TO_FLOOR_M,
    ladder: bought.ladder,
    standard: asOfRight.plan,
    maximum: bought.plan,
    compoundable,
    cliff: bought.cliff ?? asOfRight.cliff,
    caveats: [
      // Once the reader states their own floor-to-floor height it stops being the
      // engine's assumption and becomes their figure, and the caveat has to say which
      // it is. Presenting someone's own input back to them as something we guessed is
      // the same failure as presenting a guess as something the gazette states.
      input.floorToFloorM !== undefined
        ? `Floor-to-floor height is ${input.floorToFloorM} m, as you set it. The byelaws fix no `
          + `floor-to-floor figure — only a ${MIN_ROOM_HEIGHT_M} m minimum room height — so this `
          + 'one is yours, and it moves the floor count under any height cap.'
        : `Floor-to-floor height is taken at ${DEFAULT_FLOOR_TO_FLOOR_M} m — the byelaws' `
          + `${MIN_ROOM_HEIGHT_M} m minimum room height plus a slab. The byelaws set no `
          + 'floor-to-floor figure, so this is an assumption and it moves the floor count under '
          + 'any height cap.',
      ...far.caveats,
    ],
  };
}
