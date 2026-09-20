/**
 * Two plots, side by side, before either is bought.
 *
 * Every other screen here assumes the plot is already yours. The decision that actually
 * costs money is made earlier, at a dealer's desk or in a listing, between two plots that
 * look alike: "200 gaj on a 30 ft road" against "240 gaj on a 20 ft road". Nothing is
 * hidden at that moment — it is simply never worked out, because working it out means
 * reading a FAR table, a road-minimum table and Clause 2.1.2, twice.
 *
 * Writing this corrected a belief the author held and the property trade repeats. A sweep
 * of every area against every road width, for both uses, settled three things:
 *
 *  - **For a house, the road outside changes nothing.** Not the floor area, not the floor
 *    count, not the height, not the ceiling. Base FAR is a property of the occupancy and
 *    the area type, not of the road (`far.ts`), and plotted residential tops out at a flat
 *    2.0 at every width (`PLOTTED_RESIDENTIAL_MAX_FAR`). A house needs a 4 m road in a
 *    built-up area and gains nothing from a wider one. "Wider road, more FAR" is a
 *    commercial rule that gets repeated about houses.
 *  - **For a shop or an office, the road is a gate before it is a ladder.** Below the
 *    occupancy's minimum right of way nothing may be built at all; below 12 m no extra FAR
 *    may be bought at any price (Clause 9.2.1(ii)). A retail shop on a 9 m road can be
 *    built and can never be enlarged. A commercial complex on a 9 m road cannot be built.
 *  - **The approval route turns on plot size alone.** Clause 2.1.2 changes at 100 m² and
 *    again at 500 m². Two plots either side of a line are months apart in process, and the
 *    gap is fixed the day you buy.
 *
 * So the comparison leads with whichever of those actually separates the two plots, and it
 * does not rank them. Where "builds more" and "costs less per buildable metre" point at
 * different plots, that disagreement is the finding; picking a winner would mean inventing
 * a weighting the buyer never stated.
 */
import { assessSanctionRoute, type RouteAssessment } from './permission';
import { getOccupancy, type OccupancyId } from './occupancy';
import { resolvePlotRoads } from './roads';
import { studyEnvelope, type EnvelopeStudy } from './envelope';
import { HIGH_RISE_THRESHOLD_M } from './setbacks';
import { canPurchaseFarAt, type AreaType } from './far';

/**
 * The shape assumed when a buyer knows the area but not the dimensions, which is the usual
 * case at this stage — listings quote area and road, rarely frontage and depth.
 *
 * Setbacks are driven by frontage and depth, so this assumption does move the floor area.
 * It is applied identically to both plots, which is what keeps the comparison sound where
 * either absolute figure would shift: no plot wins here on a shape nobody stated.
 */
export const ASSUMED_DEPTH_TO_FRONTAGE = 2;

export interface PlotCandidate {
  /** "Plot A" — or whatever the buyer calls it. Carried through for labelling only. */
  readonly label: string;
  readonly areaSqm: number;
  /** The road the plot fronts. */
  readonly frontRoadM: number;
  /** The second road on a corner plot; null on a plot that is not a corner. */
  readonly sideRoadM: number | null;
  /** The asking price. The buyer's own figure, never the gazette's. Null if not given. */
  readonly askingPriceRupees: number | null;
}

/** What the road does to this use on this plot — the pass/fail nobody sees on a listing. */
export interface RoadGate {
  /** Below the occupancy's minimum right of way: nothing may be built at all. */
  readonly barred: boolean;
  /** Buildable, but no extra FAR may be purchased at any price. */
  readonly purchaseBarred: boolean;
  readonly minRoadM: number;
  readonly purchaseThresholdM: number;
}

export interface PlotOutcome {
  readonly candidate: PlotCandidate;
  readonly study: EnvelopeStudy;
  readonly route: RouteAssessment;
  readonly gate: RoadGate;
  /** Frontage and depth as assumed from the area, so the caller can show its working. */
  readonly frontageM: number;
  readonly depthM: number;
  /** Floor area granted without buying anything. */
  readonly floorAreaSqm: number;
  /** Floor area once purchasable and premium FAR are bought. */
  readonly maxFloorAreaSqm: number;
  readonly floors: number;
  /** Asking price per square metre of as-of-right floor area. Null without a price. */
  readonly pricePerBuildableSqm: number | null;
}

export type DifferenceKind = 'roadGate' | 'floorArea' | 'ceiling' | 'floors' | 'route' | 'pricePerSqm';

export interface Difference {
  readonly kind: DifferenceKind;
  /** Index of the candidate this favours, or null where they are level. */
  readonly favours: 0 | 1 | null;
  readonly label: string;
  /** The finding in one sentence, already naming the plots. */
  readonly note: string;
  /** True where this decides the purchase on its own. */
  readonly decisive: boolean;
}

export interface PlotComparison {
  readonly outcomes: readonly [PlotOutcome, PlotOutcome];
  readonly differences: readonly Difference[];
  /** The one line to lead with. */
  readonly headline: string;
  /**
   * True where more floor area and a lower price per buildable metre point at different
   * plots. The buyer has a real trade to make, and neither plot is simply better.
   */
  readonly split: boolean;
  /** True where neither plot is separated by anything the byelaws can see. */
  readonly level: boolean;
}

const ROUTE_RANK: Readonly<Record<RouteAssessment['route'], number>> = {
  exempt: 0, instant_ltp: 1, full_scrutiny: 2,
};
const ROUTE_NAME: Readonly<Record<RouteAssessment['route'], string>> = {
  exempt: 'no approved map at all',
  instant_ltp: 'instant online approval',
  full_scrutiny: 'full scrutiny',
};

/** Frontage and depth from area alone, at the assumed shape. */
export function assumeShape(areaSqm: number): { frontageM: number; depthM: number } {
  const frontage = Math.sqrt(Math.max(areaSqm, 0) / ASSUMED_DEPTH_TO_FRONTAGE);
  return {
    frontageM: Math.round(frontage * 10) / 10,
    depthM: Math.round(frontage * ASSUMED_DEPTH_TO_FRONTAGE * 10) / 10,
  };
}

function gateFor(
  candidate: PlotCandidate, occupancy: OccupancyId, areaType: AreaType,
): RoadGate {
  const definition = getOccupancy(occupancy);
  const raw = definition.minRoadWidthM;
  const minRoadM = typeof raw === 'number' ? raw : raw[areaType];
  const purchase = canPurchaseFarAt({ occupancy, roadWidth: candidate.frontRoadM, areaType });
  return {
    barred: candidate.frontRoadM > 0 && candidate.frontRoadM < minRoadM,
    purchaseBarred: !purchase.allowed,
    minRoadM,
    purchaseThresholdM: purchase.threshold,
  };
}

function study(candidate: PlotCandidate, occupancy: OccupancyId, areaType: AreaType): PlotOutcome {
  const { frontageM, depthM } = assumeShape(candidate.areaSqm);
  const roads = resolvePlotRoads({ front: candidate.frontRoadM, left: candidate.sideRoadM ?? 0 });
  const envelope = studyEnvelope({
    occupancy, plotAreaSqm: candidate.areaSqm, frontageM, depthM, roads, areaType,
  });
  const route = assessSanctionRoute({
    occupancy: getOccupancy(occupancy),
    plotAreaSqm: candidate.areaSqm,
    buildingHeightM: envelope.standard.heightM,
    highRiseThresholdM: HIGH_RISE_THRESHOLD_M,
  });
  const floorAreaSqm = envelope.standard.floorAreaSqm;
  return {
    candidate, study: envelope, route, gate: gateFor(candidate, occupancy, areaType),
    frontageM, depthM,
    floorAreaSqm,
    maxFloorAreaSqm: envelope.maximum.floorAreaSqm,
    floors: envelope.standard.floors,
    pricePerBuildableSqm: candidate.askingPriceRupees !== null && floorAreaSqm > 0.5
      ? candidate.askingPriceRupees / floorAreaSqm
      : null,
  };
}

const pct = (a: number, b: number): number => (b > 0 ? Math.round(((a - b) / b) * 100) : 0);
const m2 = (n: number): string => `${n.toFixed(0)} m²`;

export function comparePlots(input: {
  a: PlotCandidate;
  b: PlotCandidate;
  /** The same building on either plot — you are choosing the ground, not the project. */
  occupancy: OccupancyId;
  areaType: AreaType;
}): PlotComparison {
  const a = study(input.a, input.occupancy, input.areaType);
  const b = study(input.b, input.occupancy, input.areaType);
  const use = getOccupancy(input.occupancy);
  const [la, lb] = [a.candidate.label, b.candidate.label];
  const differences: Difference[] = [];

  // The gate first, and on a barred plot it is also the last: floor area, floor count and
  // approval route are all read off an envelope that may not lawfully exist, so reporting
  // them would dress a dead plot in the clothes of a live one. It is the one fact a
  // listing never carries, and it decides the purchase on its own.
  const bothBarred = a.gate.barred && b.gate.barred;
  const oneBarred = a.gate.barred !== b.gate.barred;
  if (bothBarred) {
    differences.push({
      kind: 'roadGate',
      favours: null,
      label: 'Can either take this use at all',
      decisive: true,
      note: `Neither. ${use.label} needs a road at least ${a.gate.minRoadM} m wide; `
        + `${la} fronts ${a.candidate.frontRoadM} m and ${lb} fronts ${b.candidate.frontRoadM} m. `
        + 'No floor area, no fee and no application changes that.',
    });
  } else if (oneBarred) {
    const bad = a.gate.barred ? a : b;
    const good = a.gate.barred ? b : a;
    differences.push({
      kind: 'roadGate',
      favours: a.gate.barred ? 1 : 0,
      label: 'Can it take this use at all',
      decisive: true,
      note: `${bad.candidate.label} cannot. ${use.label} needs a road at least `
        + `${bad.gate.minRoadM} m wide and its road is ${bad.candidate.frontRoadM} m. `
        + `No floor area, no fee and no application changes that, so only `
        + `${good.candidate.label} is a candidate.`,
    });
  } else if (a.gate.purchaseBarred !== b.gate.purchaseBarred) {
    const bad = a.gate.purchaseBarred ? a : b;
    const good = a.gate.purchaseBarred ? b : a;
    differences.push({
      kind: 'ceiling',
      favours: a.gate.purchaseBarred ? 1 : 0,
      label: 'Room to grow later',
      decisive: false,
      note: `${bad.candidate.label} is stuck at ${m2(bad.floorAreaSqm)} for good — Clause `
        + `9.2.1(ii) allows no purchased FAR below a ${bad.gate.purchaseThresholdM} m road, and `
        + `its road is ${bad.candidate.frontRoadM} m. ${good.candidate.label} can be taken to `
        + `${m2(good.maxFloorAreaSqm)} by buying the density.`,
    });
  }

  const anyBarred = bothBarred || oneBarred;

  // Floor area, as of right. What a buyer thinks they are comparing when they compare
  // plot sizes — and it is not proportional to plot size.
  const areaGap = a.floorAreaSqm - b.floorAreaSqm;
  const areaLevel = Math.abs(areaGap) < 1;
  const bigger = areaLevel ? null : areaGap > 0 ? 0 : 1;
  const sizeGap = a.candidate.areaSqm - b.candidate.areaSqm;
  if (!anyBarred) differences.push({
    kind: 'floorArea',
    favours: bigger,
    label: 'Floor area, as of right',
    decisive: false,
    note: areaLevel
      ? `Both build ${m2(a.floorAreaSqm)}.`
      : `${bigger === 0 ? la : lb} builds ${m2(Math.abs(areaGap))} more — `
        + `${m2(a.floorAreaSqm)} against ${m2(b.floorAreaSqm)}.`
        + (sizeGap !== 0 && Math.sign(sizeGap) === -Math.sign(areaGap)
          ? ' That is the smaller plot: its road carries the use and the other one’s does not.'
          : ''),
  });

  if (!anyBarred && a.floors !== b.floors) {
    differences.push({
      kind: 'floors',
      favours: a.floors > b.floors ? 0 : 1,
      label: 'Floors',
      decisive: false,
      note: `${la} reaches ${a.floors} floor${a.floors === 1 ? '' : 's'}, ${lb} ${b.floors}.`,
    });
  }

  // Months of difference, invisible on any listing, and fixed the day you buy.
  if (!anyBarred && ROUTE_RANK[a.route.route] !== ROUTE_RANK[b.route.route]) {
    differences.push({
      kind: 'route',
      favours: ROUTE_RANK[a.route.route] < ROUTE_RANK[b.route.route] ? 0 : 1,
      label: 'Approval route',
      decisive: false,
      note: `${la} takes ${ROUTE_NAME[a.route.route]}; ${lb} takes ${ROUTE_NAME[b.route.route]}. `
        + 'Clause 2.1.2 sets the route on plot size alone, so this gap is fixed the day you buy.',
    });
  }

  // The buyer's own number, and the only one here that is.
  let cheaper: 0 | 1 | null = null;
  if (a.pricePerBuildableSqm !== null && b.pricePerBuildableSqm !== null) {
    const gap = pct(a.pricePerBuildableSqm, b.pricePerBuildableSqm);
    cheaper = gap === 0 ? null : gap < 0 ? 0 : 1;
    differences.push({
      kind: 'pricePerSqm',
      favours: cheaper,
      label: 'Asking price per buildable m²',
      decisive: false,
      note: gap === 0
        ? 'The same, per square metre you may actually build.'
        : `${cheaper === 0 ? la : lb} costs ${Math.abs(gap)}% less per square metre you may `
          + 'actually build. Your asking prices, not a byelaws figure.',
    });
  }

  const split = !anyBarred && bigger !== null && cheaper !== null && bigger !== cheaper;
  const level = !anyBarred && areaLevel && a.floors === b.floors
    && a.route.route === b.route.route && cheaper === null;
  const deadPlot = oneBarred ? (a.gate.barred ? a : b) : null;

  const headline = bothBarred
    ? `Neither plot can be built on \u2014 both roads are under the ${a.gate.minRoadM} m this use needs.`
    : deadPlot
      ? `${deadPlot.candidate.label} cannot be built on \u2014 its road is `
        + `${deadPlot.candidate.frontRoadM} m and this use needs ${deadPlot.gate.minRoadM} m.`
      : level
        ? 'Nothing in the byelaws separates these two plots.'
        : bigger === null
          ? 'Both plots build the same floor area. What separates them is below.'
          : split
            ? `${bigger === 0 ? la : lb} builds more; ${cheaper === 0 ? la : lb} costs less per `
              + 'buildable metre. There is a trade here, not a better plot.'
            : `${bigger === 0 ? la : lb} builds ${m2(Math.abs(areaGap))} more`
              + (cheaper === bigger ? ' and costs less per buildable metre.' : '.');

  return { outcomes: [a, b], differences, headline, split, level };
}
