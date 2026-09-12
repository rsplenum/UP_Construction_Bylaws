import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildEdges, producersOf, rankOf, topologicalOrder,
  unconsumedFacts, unproducedFacts, unsuppliedDependencies,
} from '../graph';
import { RULES } from '../registry';
import { DERIVED_FACTS, UNSUPPLIED_FACTS, coSatisfiable, isDerived } from '../schema';

const ALL_FACTS = new Set<string>([
  ...DERIVED_FACTS,
  'plotArea', 'roadWidth', 'buildingHeight', 'occupancy', 'plotFrontage', 'greenRating',
  'zone', 'areaType', 'landRate', 'builtUpArea', 'affordableScheme', 'hasStilt',
  'cornerPlot', 'greenCertified', ...UNSUPPLIED_FACTS,
]);

describe('every rule declares its wiring', () => {
  it.each(Object.values(RULES))('$id names what it reads and what it establishes', (rule) => {
    expect(rule.consumes.length, `${rule.id} reads nothing`).toBeGreaterThan(0);
    expect(rule.produces.length, `${rule.id} establishes nothing`).toBeGreaterThan(0);
  });

  it('draws every fact from the closed vocabulary', () => {
    for (const rule of Object.values(RULES)) {
      for (const fact of rule.consumes) {
        expect(ALL_FACTS.has(fact), `${rule.id} consumes unknown fact ${fact}`).toBe(true);
      }
      for (const term of [
        ...(rule.appliesWhen?.ranges ?? []), ...(rule.appliesWhen?.oneOf ?? []), ...(rule.appliesWhen?.flags ?? []),
      ]) {
        expect(ALL_FACTS.has(term.fact), `${rule.id} guards on unknown fact ${term.fact}`).toBe(true);
      }
    }
  });

  it('reads its own guard facts, so a guard cannot key on something the rule never sees', () => {
    for (const rule of Object.values(RULES)) {
      const consumed = new Set<string>(rule.consumes);
      for (const term of [
        ...(rule.appliesWhen?.ranges ?? []), ...(rule.appliesWhen?.oneOf ?? []), ...(rule.appliesWhen?.flags ?? []),
      ]) {
        expect(consumed.has(term.fact), `${rule.id} guards on ${term.fact} without consuming it`).toBe(true);
      }
    }
  });

  it('keeps derivedFrom a subset of consumes', () => {
    for (const rule of Object.values(RULES)) {
      const consumed = new Set<string>(rule.consumes);
      for (const input of rule.derivedFrom) {
        expect(consumed.has(input), `${rule.id} is derivedFrom ${input} but does not consume it`).toBe(true);
      }
    }
  });
});

describe('the graph', () => {
  it('is acyclic', () => {
    const result = topologicalOrder();
    expect(result.unordered, `cycle among: ${result.unordered.join(', ')}`).toEqual([]);
    expect(result.order).toHaveLength(Object.keys(RULES).length);
  });

  it('derives edges rather than taking them on trust', () => {
    const edges = buildEdges();
    expect(edges.length).toBeGreaterThan(20);
    for (const edge of edges) {
      const produced = new Set<string>(RULES[edge.from].produces);
      expect(edge.facts.every((f) => produced.has(f))).toBe(true);
      expect(edge.facts.every((f) => RULES[edge.to].consumes.includes(f))).toBe(true);
    }
  });

  it('leaves no derived fact consumed but unestablished', () => {
    expect(unproducedFacts().map((d) => `${String(d.fact)} ← ${d.rules.join(', ')}`)).toEqual([]);
  });

  it('establishes nothing outside the closed output vocabulary', () => {
    const known = new Set<string>(DERIVED_FACTS);
    for (const rule of Object.values(RULES)) {
      for (const fact of rule.produces) expect(known.has(fact), `${rule.id} produces ${fact}`).toBe(true);
      for (const fact of rule.produces) expect(isDerived(fact)).toBe(true);
    }
  });

  /**
   * Terminal answers — things the app reports and nothing downstream reads. Pinned rather
   * than merely allowed: a fact arriving here that should have been consumed is a wiring
   * mistake, and the only way to notice is for the list to change under someone.
   */
  it('leaves only terminal answers unconsumed', () => {
    expect([...unconsumedFacts()]).toEqual([
      'compoundableLimit', 'compoundingFee', 'environmentalCategory', 'evChargingProvision',
      'ewsLigReservation', 'fireAccessRequirement', 'ibsNocRequired', 'licensedRole',
      'minPlotArea', 'minRoadWidth', 'nonCompoundable', 'occupancyCertificateGate',
      'peerReviewRequired', 'purchaseFee', 'rainwaterHarvestingRequired',
      'sanctionRoute', 'shelterFee',
      'siteEngineerRequired', 'solarPvRequired', 'solarWaterHeatingRequired',
      'solidWasteProvision', 'specialBuilding', 'structuralAuditSchedule',
      'telecomRoomSpace', 'treePlantingRequired', 'useAllowed',
    ]);
  });
});

/**
 * The test `docs/RULE-GRAPH-PLAN.md` Step 2 asked for and the repository did not have.
 *
 * `assessProject` resolves the site in one pass, and nothing checked that a resolver
 * reading `baseFar` runs after the one that establishes it. The order was correct by the
 * author's care alone; a reordering during an edit would have produced a wrong number
 * rather than a failing test.
 *
 * The sequence is read out of the source rather than declared, because a declared order
 * is a second thing to keep in step and would drift from the code it describes.
 *
 * What counts as the sequence is the order the RESOLVERS are called, not the order
 * findings are pushed. The two are different and only the first is a dataflow claim: the
 * purchase gate is evaluated inside `resolveBaseFar` and reported several findings later,
 * which is a reporting choice and not a rule reading a fact before it exists. A rule
 * resolved inside another rule's resolver is not in this sequence at all — being nested,
 * it cannot run late.
 */
describe('findings.ts evaluates in an order the graph permits', () => {
  const source = readFileSync(new URL('../../findings.ts', import.meta.url), 'utf8');

  /** Resolver call site → the register entries it settles. */
  const RESOLVERS: readonly (readonly [RegExp, readonly string[]])[] = [
    [/\bresolveBaseFar\(/, ['far.telescopic-residential', 'far.road-width-group-housing',
      'far.road-width-commercial', 'far.mixed-use', 'far.purchasable-commercial']],
    [/\bassessPurchaseFee\(/, ['far.purchasable-fee']],
    [/\bresolveRequiredSetbacks\(/, ['setback.plotted-residential', 'setback.high-rise',
      'setback.bazaar-street', 'setback.group-housing', 'setback.non-residential',
      'setback.other-commercial', 'setback.public-amenity']],
    [/\bassessEvCharging\(/, ['ev.charging-infrastructure']],
    [/\bassessFireSafety\(/, ['fire.safety-certificate']],
    [/\bassessStructuralSafety\(/, ['structural.seismic-applicability']],
    [/\bassessAccessibility\(/, ['accessibility.scope']],
    [/\bassessLicensing\(/, ['licensing.competence']],
    [/\bassessTelecom\(/, ['telecom.cti']],
    [/\bassessSustainability\(/, ['services.rainwater-harvesting', 'services.solar-pv',
      'services.solar-water-heating', 'services.solid-waste', 'services.tree-plantation',
      'services.environmental-conditions']],
    [/\bassessSocialHousing\(/, ['social.ews-lig']],
    [/\bassessSanctionRoute\(/, ['permission.route']],
    [/\bassessCompounding\(/, ['compounding.schedule']],
  ];

  /** Where in `assessProject` each rule is settled. */
  const settledAt = new Map<string, number>();
  const body = source.slice(source.indexOf('export function assessProject'));
  for (const [pattern, ruleIds] of RESOLVERS) {
    const at = body.search(pattern);
    for (const id of ruleIds) if (at >= 0) settledAt.set(id, at);
  }

  it('locates every resolver in the source', () => {
    for (const [pattern] of RESOLVERS) {
      expect(body.search(pattern), `${pattern} is not called in assessProject`).toBeGreaterThan(0);
    }
    expect(settledAt.size).toBeGreaterThan(15);
  });

  it('never reads a fact before the rule that establishes it has run', () => {
    const violations: string[] = [];
    for (const edge of buildEdges()) {
      const producedAt = settledAt.get(edge.from);
      const consumedAt = settledAt.get(edge.to);
      // A rule settled inside another resolver has no position of its own; nesting
      // guarantees its order.
      if (producedAt === undefined || consumedAt === undefined) continue;
      if (producedAt === consumedAt) continue;
      if (producedAt > consumedAt) {
        violations.push(`${edge.to} reads [${edge.facts.join(', ')}] from ${edge.from}, which runs later`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('agrees with a legal topological order', () => {
    const rank = rankOf(topologicalOrder());
    const sequence = [...settledAt.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([id]) => id);
    for (const edge of buildEdges()) {
      const from = sequence.indexOf(edge.from);
      const to = sequence.indexOf(edge.to);
      if (from < 0 || to < 0) continue;
      expect(rank.get(edge.from)!).toBeLessThan(rank.get(edge.to)!);
    }
  });
});

describe('what the engine cannot see', () => {
  /**
   * The count V-038 has been keeping in prose. `floorCount` is the one that matters: four
   * separate rules gate on it and none of them can answer without a caveat.
   */
  it('names every obligation blocked on a field ProjectState does not have', () => {
    const report = Object.fromEntries(unsuppliedDependencies().map((d) => [d.fact, d.rules]));
    expect(report.floorCount).toEqual([
      'compounding.schedule', 'fire.safety-certificate', 'licensing.competence',
      'structural.seismic-applicability',
    ]);
    expect(report.groundCoverage).toEqual(['fire.safety-certificate', 'structural.seismic-applicability']);
    expect(report.dwellingUnits).toEqual(['parking.ecs-ratios', 'social.ews-lig']);
  });
});

describe('two rules answering one question', () => {
  it('is what the conflict query is looking for, and the graph can point at it', () => {
    expect(producersOf('maxHeight')).toEqual(['occupancy.thresholds', 'setback.plotted-residential']);
    expect(producersOf('ceilingFar').length).toBeGreaterThan(1);
  });

  it('is not a conflict where the guards cannot both hold', () => {
    // A plotted house and a mall both produce a FAR ceiling and no plot is ever both.
    expect(coSatisfiable(
      RULES['far.telescopic-residential'].appliesWhen!,
      RULES['far.road-width-commercial'].appliesWhen!,
    )).toBe(false);
  });
});

/**
 * Ten rules in the register are never named by a finding. Every one of them still governs
 * a number the app shows — the finding carries someone else's provenance (B-045). Four
 * were fixed by routing `far.rule` and `required.rule` through; the rest are recorded
 * here so that a rule joining or leaving the list is a deliberate edit rather than a
 * silent regression.
 */
describe('provenance reaches the findings', () => {
  const source = readFileSync(new URL('../../findings.ts', import.meta.url), 'utf8');
  const named = new Set([...source.matchAll(/\}\s*,\s*'([a-z][a-z0-9.-]*)'\s*\)/g)].map((m) => m[1]));
  const viaResolver = new Set(['far.telescopic-residential', 'far.road-width-group-housing',
    'far.road-width-commercial', 'far.mixed-use', 'setback.plotted-residential',
    'setback.high-rise', 'setback.bazaar-street', 'setback.group-housing',
    'setback.non-residential', 'setback.other-commercial', 'setback.public-amenity']);

  it('still has rules that never reach one, and they are these', () => {
    const orphans = Object.keys(RULES).filter((id) => !named.has(id) && !viaResolver.has(id)).sort();
    expect(orphans).toEqual([
      'ev.charging-infrastructure',
      'far.green-incentive',
      'far.purchasable-commercial',
      'far.tod',
    ]);
  });
});
