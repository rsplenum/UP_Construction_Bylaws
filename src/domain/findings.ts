/**
 * One question, one answer.
 *
 * The first version of this app split the byelaws across nine tabs that mirrored the
 * document's table of contents: a zoning grid, a FAR calculator, a fee calculator, a
 * chapter reader. None of them answered "can I build this?" — the user had to visit
 * each, carry numbers between them, and reconcile the results themselves.
 *
 * This module answers it once. `assessProject` takes the site and returns every finding
 * the byelaws produce for it, each one carrying: what the rule requires, what this
 * project proposes, the arithmetic, the clause, and — where there is one — the change
 * that would resolve it. The interface renders findings; it does not compute.
 *
 * Adding a rule means adding a finding here, and it appears everywhere at once.
 */

import { assessSetbackFaces, resolveRequiredSetbacks, HIGH_RISE_THRESHOLD_M, SetbackFace } from './setbacks';
import { PURCHASABLE_FAR_MIN_ROAD_WIDTH, resolveBaseFar } from './far';
import { assessCompounding, compoundableLimits } from './compounding';
import { assessPurchaseFee, splitPurchasedFar } from './purchasable-fee';
import { assessFireSafety, OCCUPANCY_CERTIFICATE_GATE } from './fire';
import { assessSocialHousing } from './social-housing';
import { forArea, getOccupancy } from './occupancy';
import { ProjectState, derivePlotDepth } from './project';
import { RULES } from './rules/registry';
import { CONFIDENCE_LABEL, Confidence, isContested } from './rules/schema';

export type FindingStatus = 'ok' | 'attention' | 'blocked' | 'info';

export type FindingTopic =
  | 'permissibility'
  | 'bulk'
  | 'envelope'
  | 'height'
  | 'parking'
  | 'safety'
  | 'services'
  | 'social'
  | 'procedure';

export const TOPIC_LABELS: Readonly<Record<FindingTopic, string>> = {
  permissibility: 'Can you build this here',
  bulk: 'How much you can build',
  envelope: 'Where it can sit on the plot',
  height: 'How tall it can be',
  parking: 'Parking and charging',
  safety: 'Fire and life safety',
  services: 'Water, energy and waste',
  social: 'Affordable housing',
  procedure: 'Getting it sanctioned',
};

export interface Finding {
  id: string;
  topic: FindingTopic;
  status: FindingStatus;
  /** One sentence, no jargon. This is what Simple mode shows. */
  headline: string;
  /** The same thing said precisely, for someone who will cite it. */
  detail: string;
  /** What the byelaws require. */
  required?: string;
  /** What this project proposes. */
  proposed?: string;
  /** How the number was reached. */
  working?: string;
  /** Chapter and clause. */
  clause?: string;
  /** A change that would resolve this finding, applied to the project. */
  fix?: { label: string; patch: Partial<ProjectState> };
  /** A cost this rule creates. */
  money?: { label: string; amount: number };
  /** True when no fee or redesign can regularise it. */
  nonNegotiable?: boolean;

  /**
   * ANGLE E — how much this answer can be trusted.
   *
   * A compliance engine that presents a transcribed number and a gazette-verified number
   * in the same typeface is lying by omission. Every finding carries the id of the rule
   * it applied, so the interface can say how well sourced the answer is, and can show
   * both readings where a rule is disputed.
   */
  rule?: string;
  confidence?: Confidence;
  /** Present when the rule behind this finding is under active challenge. */
  dispute?: { id: string; summary: string; divergence?: string };
}

export interface Assessment {
  findings: Finding[];
  /** The single sentence that answers the user's question. */
  headline: string;
  /** Supporting line under the headline. */
  subhead: string;
  canBuild: boolean;
  blocked: number;
  attention: number;
  ok: number;
  /** Total of every fee the findings imply. */
  totalFees: number;
  /** Buildable floor area at the current inputs, in sqm. */
  permissibleArea: number;
  proposedArea: number;
  /** How many findings rest on a disputed or unverified rule. */
  disputedCount: number;
}

const round = (n: number, dp = 1): number => Number(n.toFixed(dp));
const inr = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;
const sqm = (n: number): string => `${round(n)} m²`;

const FACE_LABEL: Record<SetbackFace, string> = {
  front: 'front', rear: 'rear', side1: 'left side', side2: 'right side',
};

/**
 * Occupancy names read naturally on their own ("A mall or cinema complex") but are also
 * dropped into the middle of sentences, where the leading article doubles up: "A a mall
 * or cinema complex needs a road…". This strips it for mid-sentence use.
 */
const noun = (plain: string): string => plain.replace(/^(a|an|the)\s+/i, '').toLowerCase();

/** Capitalise the first letter of a clause that follows a full stop. */
const sentence = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Attach the provenance of the rule a finding applied. Anything without a registered
 * rule is, by construction, unreviewed — and says so.
 */
function sourced(finding: Finding, ruleId: string): Finding {
  const meta = RULES[ruleId];
  if (!meta) return { ...finding, rule: ruleId, confidence: 'inferred' };
  return {
    ...finding,
    rule: ruleId,
    confidence: meta.confidence,
    dispute: meta.challenge && {
      id: meta.challenge.id,
      summary: meta.challenge.summary,
      divergence: meta.challenge.maxDivergence,
    },
  };
}

export function assessProject(project: ProjectState): Assessment {
  const occupancy = getOccupancy(project.occupancy);
  const findings: Finding[] = [];

  const plotArea = Math.max(0, project.plotArea);
  const roadWidth = Math.max(0, project.roadWidth);
  const height = Math.max(0, project.buildingHeight);
  const proposedArea = Math.max(0, project.proposedBuiltUpArea);
  const depth = derivePlotDepth(project);

  // ---- 1. Is this use allowed here at all? -------------------------------------
  // Clause 4.1.3 and 4.2.3: these thresholds differ between a built-up area and a new
  // layout, and the built-up figure is the laxer one.
  const areaType = project.areaType ?? 'built_up';
  const minRoadWidth = forArea(occupancy.minRoadWidthM, areaType);
  const minPlotArea = forArea(occupancy.minPlotAreaSqm, areaType);
  const areaLabel = areaType === 'built_up' ? 'built-up area' : 'new layout';

  if (roadWidth < minRoadWidth) {
    findings.push(sourced({
      id: 'use-road-width',
      topic: 'permissibility',
      status: 'blocked',
      headline: `A ${noun(occupancy.plain)} needs a road at least ${minRoadWidth} m wide. Yours is ${roadWidth} m.`,
      detail: `${occupancy.label} requires a minimum abutting right of way of ${minRoadWidth} m in a ${areaLabel}. The declared road is ${roadWidth} m.`,
      required: `≥ ${minRoadWidth} m right of way`,
      proposed: `${roadWidth} m`,
      clause: 'Chapter 3.1 (Means of Access) & Chapter 15.3.2',
      nonNegotiable: true,
      fix: { label: `Set the road width to ${minRoadWidth} m`, patch: { roadWidth: minRoadWidth } },
    }, 'occupancy.thresholds'));
  } else {
    findings.push(sourced({
      id: 'use-road-width',
      topic: 'permissibility',
      status: 'ok',
      headline: `The ${roadWidth} m road is wide enough for a ${noun(occupancy.plain)}.`,
      detail: `${occupancy.label} requires ≥ ${minRoadWidth} m; the abutting road is ${roadWidth} m.`,
      required: `≥ ${minRoadWidth} m`,
      proposed: `${roadWidth} m`,
      clause: 'Chapter 3.1 (Means of Access)',
    }, 'occupancy.thresholds'));
  }

  if (minPlotArea > 0 && plotArea < minPlotArea) {
    findings.push(sourced({
      id: 'use-plot-size',
      topic: 'permissibility',
      status: 'blocked',
      headline: `This plot is too small for a ${noun(occupancy.plain)} — the minimum is ${sqm(minPlotArea)}.`,
      detail: `${occupancy.label} requires a minimum plot area of ${sqm(minPlotArea)} in a ${areaLabel}. This plot is ${sqm(plotArea)}.`,
      required: `≥ ${sqm(minPlotArea)}`,
      proposed: sqm(plotArea),
      clause: 'Chapter 15.3.2 (Activity Permissibility)',
      nonNegotiable: true,
    }, 'occupancy.thresholds'));
  }

  // ---- 2. How much floor area? --------------------------------------------------
  const far = resolveBaseFar({
    occupancy: project.occupancy,
    plotArea,
    roadWidth,
    greenRating: project.greenRating,
    areaType,
    isAffordableHousingScheme: project.isAffordableHousingScheme,
  });

  const proposedFar = plotArea > 0 ? proposedArea / plotArea : 0;
  const headroom = far.effectiveBuiltUpArea - proposedArea;

  if (far.baseFar === 0) {
    findings.push(sourced({
      id: 'far',
      topic: 'bulk',
      status: 'blocked',
      headline: 'No floor area can be sanctioned at this road width.',
      detail: far.caveats.join(' ') || 'The road width falls below every FAR band for this occupancy.',
      clause: far.clauseRef,
      nonNegotiable: true,
    }, 'far.telescopic-residential'));
  } else if (proposedArea <= far.effectiveBuiltUpArea + 0.01) {
    findings.push(sourced({
      id: 'far',
      topic: 'bulk',
      status: 'ok',
      headline: `You can build ${sqm(far.effectiveBuiltUpArea)}. You've drawn ${sqm(proposedArea)} — ${sqm(Math.max(0, headroom))} spare.`,
      detail: `Base FAR ${far.effectiveBaseFar} on ${sqm(plotArea)} permits ${sqm(far.effectiveBuiltUpArea)}. Proposed ${sqm(proposedArea)} (FAR ${round(proposedFar, 2)}).`,
      required: `FAR ${far.effectiveBaseFar} = ${sqm(far.effectiveBuiltUpArea)}`,
      proposed: `${sqm(proposedArea)} (FAR ${round(proposedFar, 2)})`,
      working: far.workings,
      clause: far.clauseRef,
    }, 'far.telescopic-residential'));
  } else if (proposedArea <= far.maxPermissibleBuiltUpArea + 0.01) {
    const extra = proposedArea - far.effectiveBuiltUpArea;
    // Clause 9.2.5 is C = Le × Rc × P, and Le is FP ÷ Base FAR — not FP. Charging the floor
    // area directly over-states the fee by a factor of the base FAR (B-031), and the factor
    // coefficient is not 0.40 for every use: it runs from 0.20 to 1.0 across the seven
    // categories. Both now come from `purchasable-fee.ts`, which reproduces the gazette's
    // own worked example exactly.
    // The split comes from the printed chapter row where one covers this use, and from
    // Clause 9.2.3's general ladder where none does — resolveBaseFar has already decided
    // which, and says so on the tranche.
    const farTaken = extra / Math.max(1e-9, plotArea);
    const tranches = far.purchasableTranche
      ? {
        purchasable: Math.min(farTaken, far.purchasableTranche.purchasableCapacity),
        premiumPurchasable: Math.max(0, farTaken - far.purchasableTranche.purchasableCapacity),
      }
      : splitPurchasedFar({
        farAboveBase: farTaken,
        baseFar: far.effectiveBaseFar,
        roadWidth: project.roadWidth,
      });
    const fee = assessPurchaseFee({
      category: getOccupancy(project.occupancy).purchasableFarCategory,
      baseFar: far.effectiveBaseFar,
      plotAreaSqm: plotArea,
      landRate: project.circleRate,
      purchasableFarAvailed: tranches.purchasable,
      premiumPurchasableFarAvailed: tranches.premiumPurchasable,
    });
    const charge = fee.totalCharge;
    findings.push(sourced({
      id: 'far',
      topic: 'bulk',
      status: 'attention',
      headline: `You're ${sqm(extra)} over what's free. You can buy that extra floor area.`,
      detail: `Proposed ${sqm(proposedArea)} exceeds the base entitlement of ${sqm(far.effectiveBuiltUpArea)} by ${sqm(extra)}, within the purchasable ceiling of ${sqm(far.maxPermissibleBuiltUpArea)}.`,
      required: `Free up to ${sqm(far.effectiveBuiltUpArea)}; ceiling ${sqm(far.maxPermissibleBuiltUpArea)}`,
      proposed: sqm(proposedArea),
      working: [
        ...fee.lines.map((l) => `${l.kind === 'premiumPurchasable' ? 'Premium purchasable' : 'Purchasable'}: ${l.working} = ${inr(l.charge)}`),
        ...fee.caveats,
        far.purchasableTranche
          ? `Split from ${far.purchasableTranche.source === 'chapter-table' ? far.purchasableTranche.clause : 'Clause 9.2.3 (no chapter table covers this use)'}`
          : '',
      ].filter(Boolean).join(' · ') || `${sqm(extra)} within the base entitlement`,
      clause: fee.clauseRef,
      money: { label: 'Purchasable FAR charge', amount: charge },
      fix: { label: `Reduce to the free ${sqm(far.effectiveBuiltUpArea)}`, patch: { proposedBuiltUpArea: Math.floor(far.effectiveBuiltUpArea) } },
    }, 'far.purchasable-fee'));
  } else {
    findings.push(sourced({
      id: 'far',
      topic: 'bulk',
      status: 'blocked',
      headline: `${sqm(proposedArea)} is more than this plot can take. The absolute ceiling is ${sqm(far.maxPermissibleBuiltUpArea)}.`,
      detail: `Proposed FAR ${round(proposedFar, 2)} exceeds the ceiling of ${far.maxPermissibleFar} (base ${far.effectiveBaseFar} plus purchasable ${far.purchasableFar}). No fee regularises floor area beyond the ceiling.`,
      required: `≤ ${sqm(far.maxPermissibleBuiltUpArea)}`,
      proposed: sqm(proposedArea),
      working: far.workings,
      clause: 'Chapter 9.2.3 (Ceiling on Aggregate FAR)',
      nonNegotiable: true,
      fix: { label: `Clamp to the ${sqm(far.maxPermissibleBuiltUpArea)} ceiling`, patch: { proposedBuiltUpArea: Math.floor(far.maxPermissibleBuiltUpArea) } },
    }, 'far.telescopic-residential'));
  }

  if (far.purchasableFar === 0 && roadWidth < PURCHASABLE_FAR_MIN_ROAD_WIDTH && far.baseFar > 0) {
    findings.push(sourced({
      id: 'far-purchasable-barred',
      topic: 'bulk',
      status: 'info',
      headline: `You can't buy extra floor area here — that needs a ${PURCHASABLE_FAR_MIN_ROAD_WIDTH} m road.`,
      detail: `Purchasable FAR is barred below a ${PURCHASABLE_FAR_MIN_ROAD_WIDTH} m right of way; the abutting road is ${roadWidth} m.`,
      clause: 'Chapter 9.2.1',
    }, 'far.telescopic-residential'));
  }

  // ---- 3. Where can it sit? -----------------------------------------------------
  const required = resolveRequiredSetbacks({
    occupancy: project.occupancy,
    plotArea,
    buildingHeight: height,
    isCornerPlot: project.isCornerPlot,
    roadWidth,
  });
  // Chapter 16 decides what a shortfall means. Resolve its limits once, and use the
  // same object for the setback verdicts and for the fee, so the two cannot disagree.
  const isGroupHousing = occupancy.id === 'res_group_housing';
  const isMultiUnit = occupancy.id === 'res_multi';
  const limits = compoundableLimits({
    heightM: height,
    isGroupHousing,
    isMultiUnit,
    plotAreaSqm: plotArea,
    use: occupancy.compoundingUse,
  });

  const faces = assessSetbackFaces(required, {
    front: project.frontSetbackProvided,
    rear: project.rearSetbackProvided,
    side1: project.side1Provided,
    side2: project.side2Provided,
  }, limits.setback);

  const violations = faces.filter((f) => f.status === 'violation');
  const compoundable = faces.filter((f) => f.status === 'compoundable');

  if (violations.length === 0 && compoundable.length === 0) {
    findings.push(sourced({
      id: 'setbacks',
      topic: 'envelope',
      status: 'ok',
      headline: 'Your building sits far enough from every boundary.',
      detail: `${required.typology}, band ${required.bandLabel}. Required front ${required.front} m, rear ${required.rear} m, sides ${required.side1} and ${required.side2} m — all met.`,
      required: `F ${required.front} · R ${required.rear} · S ${required.side1}/${required.side2} m`,
      proposed: `F ${project.frontSetbackProvided} · R ${project.rearSetbackProvided} · S ${project.side1Provided}/${project.side2Provided} m`,
      clause: required.clauseRef,
    }, 'setback.plotted-residential'));
  } else {
    const worst = violations.length > 0 ? violations : compoundable;
    const names = worst.map((f) => `${FACE_LABEL[f.face]} short by ${f.deficitM} m`).join(', ');
    findings.push(sourced({
      id: 'setbacks',
      topic: 'envelope',
      status: violations.length > 0 ? 'blocked' : 'attention',
      headline: required.isHighRise && violations.length > 0
        ? `Fire engines need ${required.front} m clear all round on a building this tall. ${sentence(names)}.`
        : violations.length > 0
          ? `Your building is too close to the boundary: ${names}.`
          : `Slightly close to the boundary: ${names}. This can be regularised for a fee.`,
      detail: `${required.typology}, band ${required.bandLabel}. ${faces.map((f) => `${FACE_LABEL[f.face]} ${f.provided} m against ${f.required} m required`).join('; ')}.`,
      required: `F ${required.front} · R ${required.rear} · S ${required.side1}/${required.side2} m${required.cornerRuleApplied ? ' (corner plot rule applied)' : ''}`,
      proposed: `F ${project.frontSetbackProvided} · R ${project.rearSetbackProvided} · S ${project.side1Provided}/${project.side2Provided} m`,
      clause: required.clauseRef,
      nonNegotiable: required.isHighRise && violations.length > 0,
      fix: {
        label: 'Pull the building back to the required setbacks',
        patch: {
          frontSetbackProvided: required.front,
          rearSetbackProvided: required.rear,
          side1Provided: required.side1,
          side2Provided: required.side2,
        },
      },
    }, 'setback.plotted-residential'));
  }

  // Does anything actually fit inside the setbacks?
  const buildableWidth = project.plotFrontage - required.side1 - required.side2;
  const buildableDepth = depth - required.front - required.rear;
  if (buildableWidth <= 2.4 || buildableDepth <= 2.4) {
    findings.push(sourced({
      id: 'envelope-viability',
      topic: 'envelope',
      status: 'blocked',
      headline: 'After the required setbacks there is no room left to build.',
      detail: `A ${project.plotFrontage} m × ${round(depth)} m plot leaves ${round(Math.max(0, buildableWidth))} m × ${round(Math.max(0, buildableDepth))} m inside the setbacks. The minimum habitable room width is 2.4 m.`,
      required: 'A buildable rectangle of at least 2.4 m in each direction',
      proposed: `${round(Math.max(0, buildableWidth))} m × ${round(Math.max(0, buildableDepth))} m`,
      clause: 'Chapter 3.3 (Room Dimensions)',
      nonNegotiable: true,
    }, 'setback.plotted-residential'));
  }

  // ---- 4. How tall? -------------------------------------------------------------
  const isHighRise = height > HIGH_RISE_THRESHOLD_M;
  if (Number.isFinite(occupancy.maxHeightM) && height > occupancy.maxHeightM) {
    findings.push(sourced({
      id: 'height',
      topic: 'height',
      status: 'blocked',
      headline: `A ${noun(occupancy.plain)} can't go above ${occupancy.maxHeightM} m. You've drawn ${height} m.`,
      detail: `${occupancy.label} carries a statutory height ceiling of ${occupancy.maxHeightM} m.`,
      required: `≤ ${occupancy.maxHeightM} m`,
      proposed: `${height} m`,
      clause: 'Chapter 3.2.4',
      fix: { label: `Cap the height at ${occupancy.maxHeightM} m`, patch: { buildingHeight: occupancy.maxHeightM } },
    }, 'occupancy.thresholds'));
  } else {
    findings.push(sourced({
      id: 'height',
      topic: 'height',
      status: 'ok',
      headline: isHighRise
        ? `At ${height} m this is a high-rise, which is allowed here but brings extra fire rules.`
        : `${height} m is within what this use and road allow.`,
      detail: Number.isFinite(occupancy.maxHeightM)
        ? `Ceiling ${occupancy.maxHeightM} m for ${occupancy.label}; proposed ${height} m.`
        : `No fixed ceiling for ${occupancy.label}; height is governed by road width and fire clearance. Proposed ${height} m.`,
      required: Number.isFinite(occupancy.maxHeightM) ? `≤ ${occupancy.maxHeightM} m` : 'Governed by road width and fire clearance',
      proposed: `${height} m`,
      clause: 'Chapter 3.2.4',
    }, 'occupancy.thresholds'));
  }

  // Chapter 10 is where a fire-access width would be stated, and it states none. Its only
  // definition of access is "means of approach to each floor of the building or to nearest
  // point of the building ... at least from one side like-road or permanent open space"
  // (Clause 10.2.1) — no width at all. The 12 m figure this finding used to block on could
  // not be found anywhere in the gazette; the one 12 m road minimum that exists is a
  // condition on podium parking (Para 3.3.4.9), not on height. Demoted from a non-negotiable
  // block to the requirement the gazette does state: 6 m kept motorable all round. V-033.
  if (isHighRise && roadWidth < 12) {
    findings.push(sourced({
      id: 'high-rise-road',
      topic: 'safety',
      status: 'attention',
      headline: `At ${height} m, fire-tender access off a ${roadWidth} m road needs the fire officer's agreement.`,
      detail:
        `The byelaws set no minimum road width for fire access. Clause 10.2.1 requires only a means of approach ` +
        `"at least from one side", and Para 3.3.4.7 requires 6.0 m around the building kept motorable and clear of ` +
        `obstruction for firefighting. What a turntable ladder needs on a ${roadWidth} m right of way is settled by ` +
        `the Fire and Emergency Services under the 2024 Rules, not by these byelaws.`,
      required: '6.0 m motorable all round (Para 3.3.4.7); approach from at least one side (Clause 10.2.1)',
      proposed: `${roadWidth} m road`,
      clause: 'Clause 10.2.1 & Para 3.3.4.7',
    }, 'fire.access'));
  }

  // ---- 5. Parking ---------------------------------------------------------------
  const requiredEcs = Math.ceil((proposedArea / 100) * occupancy.parkingEcsPer100Sqm);
  const evBays = Math.ceil(requiredEcs * 0.2);
  const parkingOk = project.parkingBaysProvided >= requiredEcs;
  findings.push(sourced({
    id: 'parking',
    topic: 'parking',
    status: parkingOk ? 'ok' : 'attention',
    headline: parkingOk
      ? `${requiredEcs} car spaces needed, ${project.parkingBaysProvided} provided — including ${evBays} with EV charging.`
      : `You need ${requiredEcs} car spaces and have ${project.parkingBaysProvided}. ${requiredEcs - project.parkingBaysProvided} more required.`,
    detail: `${occupancy.parkingEcsPer100Sqm} ECS per 100 m² of built-up area. ${sqm(proposedArea)} → ${requiredEcs} ECS, of which 20% (${evBays}) must have EV charging points.`,
    required: `${requiredEcs} ECS (incl. ${evBays} EV)`,
    proposed: `${project.parkingBaysProvided} ECS`,
    working: `${sqm(proposedArea)} ÷ 100 × ${occupancy.parkingEcsPer100Sqm} = ${requiredEcs} ECS`,
    clause: 'Para 3.3.4.3 (Parking Standards) & Chapter 17 (EV Charging)',
    fix: parkingOk ? undefined : { label: `Provide ${requiredEcs} spaces`, patch: { parkingBaysProvided: requiredEcs } },
  }, 'parking.ecs-ratios'));

  // ---- 6. Fire ------------------------------------------------------------------
  const fire = assessFireSafety({ occupancy, buildingHeight: height, builtUpArea: proposedArea });
  if (fire.certificateRequired) {
    const limbs = fire.triggers.map((t) => `${t.clause} — ${t.because}`).join(' ');
    const isSpecial = fire.triggers.some(
      (t) => t.limb === 'special_occupancy' || t.limb === 'special_definition',
    );
    findings.push(sourced({
      id: 'fire-noc',
      topic: 'safety',
      status: 'attention',
      headline: 'This building must hold a Fire Safety Certificate before it can be occupied.',
      detail:
        `${limbs} ${OCCUPANCY_CERTIFICATE_GATE}` +
        (isSpecial
          ? ' As a special building it must also have two staircases, one of them an external fire escape ' +
            '(Para 3.3.1.16): internal stairs at least 1.5 m wide (Para 3.3.1.15), the fire escape at least 1.25 m.'
          : '') +
        ' Clause 16.1.3(vii) makes a deviation non-compoundable at any price where firefighting ' +
        'requirements are mandatory or the Fire NOC was not obtained where it is — so on this ' +
        'building a fee cannot regularise a breach later.' +
        (fire.caveats.length ? ` ${fire.caveats.join(' ')}` : ''),
      required: 'Fire Safety Certificate from UP Fire and Emergency Services',
      proposed: `${height} m, ${sqm(proposedArea)}, ${occupancy.label}`,
      clause: fire.triggers.map((t) => t.clause).join(', '),
    }, 'fire.safety-certificate'));
  } else if (fire.completionStage.dependsOnFloorCount) {
    findings.push(sourced({
      id: 'fire-noc',
      topic: 'safety',
      status: 'info',
      headline: 'No Fire Safety Certificate is triggered — unless this runs to more than four floors.',
      detail:
        `Clause 10.1.3 catches buildings over 15 m, NBC group B–J special buildings, and mixed occupancies ` +
        `over 500 m². At ${height} m, ${occupancy.label} meets none of them. But the records deposited with ` +
        `the notice of completion require a fire NOC for "buildings more than four floors or 15-meters and more ` +
        `high", and the floor count is not part of this description. ${OCCUPANCY_CERTIFICATE_GATE}`,
      required: 'None triggered at this height and occupancy',
      proposed: `${height} m, ${occupancy.label}`,
      clause: 'Clause 10.1.3 & Clause 2.9.3.2',
    }, 'fire.safety-certificate'));
  }

  // ---- 7. Water, energy, waste ---------------------------------------------------
  if (plotArea > 300 && !project.hasRWH) {
    findings.push(sourced({
      id: 'rwh',
      topic: 'services',
      status: 'blocked',
      headline: 'A rainwater harvesting pit is compulsory on a plot this size.',
      detail: `Plots above 300 m² require an engineered recharge pit with silt trap before sanction. This plot is ${sqm(plotArea)}.`,
      required: 'Rainwater harvesting pit',
      proposed: 'Not provided',
      clause: 'Chapter 13.1',
      fix: { label: 'Add rainwater harvesting', patch: { hasRWH: true } },
    }, 'services.rwh-threshold'));
  } else if (plotArea > 300) {
    findings.push(sourced({
      id: 'rwh', topic: 'services', status: 'ok',
      headline: 'Rainwater harvesting is provided, as required on this plot size.',
      detail: `Mandatory above 300 m²; plot is ${sqm(plotArea)}.`,
      clause: 'Chapter 13.1',
    }, 'services.rwh-threshold'));
  }

  if (plotArea > 500 && !project.hasSolarHeating) {
    findings.push(sourced({
      id: 'solar',
      topic: 'services',
      status: 'attention',
      headline: 'Solar water heating is required on plots above 500 m².',
      detail: `Rooftop solar thermal sized for at least 100 litres/day per 100 m² of built-up area.`,
      required: 'Solar water heating',
      proposed: 'Not provided',
      clause: 'Chapter 13.2',
      fix: { label: 'Add solar water heating', patch: { hasSolarHeating: true } },
    }, 'services.rwh-threshold'));
  }

  // ---- 8. Affordable housing -----------------------------------------------------
  const social = assessSocialHousing({
    multiUnitHousing: occupancy.multiUnitHousing,
    plotAreaSqm: plotArea,
    circleRate: project.circleRate,
    isAffordableHousingScheme: project.isAffordableHousingScheme,
  });

  if (social.applies) {
    findings.push(sourced({
      id: 'ews-lig',
      topic: 'social',
      status: 'attention',
      headline: social.shelterFeeAvailable
        ? '20% of the homes must go to lower-income buyers, or a shelter fee is payable.'
        : '20% of the homes must go to lower-income buyers. There is no fee alternative at this size.',
      detail: social.shelterFeeAvailable
        ? `10% of the dwelling units are reserved for EWS and another 10% for LIG. Below 4 hectares these may instead be bought out: ${inr(social.shelterFeePerUnit)} per dwelling unit in the scheme.`
        : `10% of the dwelling units are reserved for EWS and another 10% for LIG. ${social.reason} This plot is ${sqm(plotArea)}.`,
      required: '10% EWS + 10% LIG units',
      working: social.shelterFeeAvailable
        ? `Clause 4.3.11: 10% × (30 m² minimum EWS carpet + 35 m² minimum LIG carpet) × ₹${project.circleRate.toLocaleString('en-IN')}/m² = ${inr(social.shelterFeePerUnit)} per unit`
        : social.reason,
      clause: social.clause,
      nonNegotiable: !social.shelterFeeAvailable,
    }, 'social.ews-lig'));
  } else if (occupancy.multiUnitHousing && project.isAffordableHousingScheme) {
    findings.push(sourced({
      id: 'ews-lig',
      topic: 'social',
      status: 'ok',
      headline: 'No EWS or LIG reservation applies to an affordable housing scheme.',
      detail: social.reason,
      clause: 'Chapter 4.4 Note-2',
    }, 'social.ews-lig'));
  }

  // ---- 9. How it gets sanctioned --------------------------------------------------
  if (occupancy.id === 'res_single' && plotArea <= 100) {
    findings.push(sourced({
      id: 'route', topic: 'procedure', status: 'ok',
      headline: 'No building permit needed — you can self-certify online for ₹1.',
      detail: 'Residential plots up to 100 m² are exempt from building permit and completion certificate; a token ₹1 online self-certification with affidavit applies.',
      clause: 'Chapter 2.1.2',
    }, 'occupancy.thresholds'));
  } else if (plotArea <= 500 && occupancy.group === 'Residential' && occupancy.id !== 'res_group_housing') {
    findings.push(sourced({
      id: 'route', topic: 'procedure', status: 'ok',
      headline: 'This qualifies for instant online approval through a licensed technical person.',
      detail: 'Plots up to 500 m² in approved layouts receive instant sanction on an LTP certificate, with a 15-day deemed-sanction limit.',
      clause: 'Chapter 2.1.2 (OBPAS)',
    }, 'occupancy.thresholds'));
  } else {
    findings.push(sourced({
      id: 'route', topic: 'procedure', status: 'info',
      headline: 'This goes through full scrutiny with clearances from other departments.',
      detail: 'A unified online application with inter-departmental NOCs. Deemed approval is triggered on the 30th day where a department has not responded.',
      clause: 'Chapter 2.1.2 & Chapter 2.3 (Deemed NOC)',
    }, 'occupancy.thresholds'));
  }

  // ---- 10. What the deviations cost -----------------------------------------------
  const frontage = Math.max(1, project.plotFrontage);
  const encroachment = (face: SetbackFace, edge: number) => {
    const f = faces.find((x) => x.face === face);
    return f && f.deficitM > 0 ? f.deficitM * edge : 0;
  };

  const compounding = assessCompounding({
    use: occupancy.compoundingUse,
    residentialLandRate: project.circleRate,
    plotAreaSqm: plotArea,
    heightM: height,
    isGroupHousing,
    isMultiUnit,
    // The thirteen Clause 16.1.3 bars turn on facts about the land and the clearances —
    // whether the plot is disputed, whether the Fire NOC was obtained — that the app has
    // no way to know. Advanced mode will collect them; asserting them from the drawing
    // would be inventing evidence. Until then the assessment reports the fee and names
    // the bars in its caveats rather than applying them.
    flags: {},
    setbackEncroachmentSqm: {
      front: encroachment('front', frontage),
      rear: encroachment('rear', frontage),
      side1: encroachment('side1', depth),
      side2: encroachment('side2', depth),
    },
    setbackDeficitFraction: Object.fromEntries(
      faces.map((f) => [f.face, f.deficitPct / 100]),
    ) as Partial<Record<SetbackFace, number>>,
    setbackDeficitM: Object.fromEntries(
      faces.map((f) => [f.face, f.deficitM]),
    ) as Partial<Record<SetbackFace, number>>,
    excessFarSqm: Math.max(0, proposedArea - far.effectiveBuiltUpArea),
    excessFarFraction: far.maxPermissibleBuiltUpArea > 0
      ? Math.max(0, proposedArea - far.effectiveBuiltUpArea) / far.maxPermissibleBuiltUpArea
      : 0,
    heightDeviationM: Number.isFinite(occupancy.maxHeightM) ? Math.max(0, height - occupancy.maxHeightM) : 0,
    heightDeviationFraction: Number.isFinite(occupancy.maxHeightM) && occupancy.maxHeightM > 0
      ? Math.max(0, height - occupancy.maxHeightM) / occupancy.maxHeightM
      : 0,
    // Item 10 measures on the periphery of the existing building. Without a footprint
    // outline the best available proxy is the plot perimeter.
    buildingPerimeterM: 2 * (frontage + depth),
    floors: Math.max(1, Math.ceil(height / 3)),
  });

  if (compounding.lineItems.length > 0) {
    findings.push(sourced({
      id: 'compounding',
      topic: 'procedure',
      status: compounding.isCompoundable ? 'attention' : 'blocked',
      headline: compounding.isCompoundable
        ? `The deviations can be regularised for about ${inr(compounding.totalPayable)}.`
        : 'Some deviations cannot be regularised at any price — they have to be redesigned.',
      detail: compounding.isCompoundable
        ? compounding.lineItems.map((i) => `${i.label}: ${i.quantity} ${i.unit} → ${inr(i.amount)}`).join('; ')
        : compounding.blockingReasons.join(' '),
      working: compounding.isCompoundable
        ? compounding.lineItems
            .map((i) => `${i.scheduleItem}: ${i.quantity.toFixed(1)} ${i.unit} × ${inr(i.ratePerUnit)} — ${i.basis}`)
            .concat(compounding.caveats)
            .join('\n')
        : undefined,
      clause: compounding.clauseRef,
      money: compounding.isCompoundable ? { label: 'Compounding fee', amount: compounding.totalPayable } : undefined,
      nonNegotiable: !compounding.isCompoundable,
    }, 'compounding.schedule'));
  }

  // ---- Roll up -------------------------------------------------------------------
  const blocked = findings.filter((f) => f.status === 'blocked').length;
  const attention = findings.filter((f) => f.status === 'attention').length;
  const ok = findings.filter((f) => f.status === 'ok').length;
  const totalFees = findings.reduce((sum, f) => sum + (f.money?.amount ?? 0), 0);

  const headline = blocked > 0
    ? `This can't be built as drawn — ${blocked} thing${blocked === 1 ? '' : 's'} must change.`
    : attention > 0
      ? `You can build this, with ${attention} thing${attention === 1 ? '' : 's'} to settle first.`
      : `You can build this. ${sqm(far.effectiveBuiltUpArea)} on a ${sqm(plotArea)} plot.`;

  const subhead = blocked > 0
    ? findings.find((f) => f.status === 'blocked')?.headline ?? ''
    : totalFees > 0
      ? `About ${inr(totalFees)} in charges, on top of the standard sanction fee.`
      : `No purchasable FAR or compounding charges at these figures.`;

  return {
    findings,
    headline,
    subhead,
    canBuild: blocked === 0,
    blocked,
    attention,
    ok,
    totalFees,
    permissibleArea: far.effectiveBuiltUpArea,
    proposedArea,
    disputedCount: findings.filter((f) => f.dispute).length,
  };
}
