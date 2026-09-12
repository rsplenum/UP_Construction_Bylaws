import { describe, expect, it } from 'vitest';
import {
  coverageSummary, factCoverage, rulesWithoutAssertions, unsweptFacts,
} from '../coverage';
import { buildEdges } from '../graph';
import { RULES } from '../registry';
import { DERIVED_FACTS, FACT_COMBINATION } from '../schema';

const BY_FACT = Object.fromEntries(factCoverage().map((c) => [c.fact, c]));

/**
 * The claim this file exists to make checkable.
 *
 * "54 conflicts and every one disposed" sounds like a sweep of the document. It was a
 * sweep of eleven of the thirty-eight facts the engine establishes, and of the eleven the
 * verification log had already pointed at. The rest of the silence meant nothing, and
 * nothing in the repository could tell the two silences apart.
 */
describe('every fact says how its producers combine', () => {
  it('declares one for each, and none for anything else', () => {
    expect(Object.keys(FACT_COMBINATION).sort()).toEqual([...DERIVED_FACTS].sort());
  });

  it('keeps `cumulative` rare and deliberate', () => {
    const cumulative = DERIVED_FACTS.filter((f) => FACT_COMBINATION[f] === 'cumulative');
    // Three clearances, one certificate. If this list grows, someone has decided that two
    // rules answering a question is not news, which is the one way to make the coverage
    // report lie.
    expect(cumulative).toEqual(['occupancyCertificateGate']);
  });
});

describe('the coverage report', () => {
  it('classifies every derived fact exactly once', () => {
    const all = factCoverage();
    expect(all).toHaveLength(DERIVED_FACTS.length);
    expect(new Set(all.map((c) => c.fact)).size).toBe(DERIVED_FACTS.length);
  });

  /**
   * The working list, and it is empty — which is a claim, not a formality. An entry here
   * is a question the byelaws may answer twice with nobody having looked.
   *
   * It was not empty when this file was written. `requiredSetback` had five rules and no
   * assertions, and authoring them turned up two tables the gazette prints and the engine
   * had never held (B-050, B-051), a clause whose scope it had been ignoring in both
   * directions (B-052), and a front setback it was under-applying above 15 m (B-053).
   */
  it('has nothing left unswept', () => {
    expect(unsweptFacts().map((c) => `${c.fact} — ${c.producers.join(', ')}`)).toEqual([]);
  });

  it('counts what it swept', () => {
    expect(coverageSummary()).toEqual({
      // 40 after Clause 15.4's impact fee and Clause 3.2.2's coverage limit. Both are
      // uncontested rather than swept: one rule each, and no second clause in the document
      // answering either, so there is nothing for the conflict query to compare.
      facts: 40, swept: 12, unswept: 0, uncontested: 27, cumulative: 1,
    });
  });

  it('does not call a fact swept because one rule happens to answer it', () => {
    // `sanctionRoute` has one producer and no assertions. That is uncontested, not swept:
    // the query has nothing to compare and nothing is missing.
    expect(BY_FACT.sanctionRoute.verdict).toBe('uncontested');
    expect(BY_FACT.sanctionRoute.conflicts).toBe(0);
  });

  it('does not call four rules rivals when no plot can satisfy two of them', () => {
    // Four rules establish `baseFar` — plotted, group housing, commercial, mixed use — and
    // no plot is ever two of those at once.
    expect(BY_FACT.baseFar.producers).toHaveLength(4);
    expect(BY_FACT.baseFar.rivalRules).toEqual([]);
    expect(BY_FACT.baseFar.verdict).toBe('uncontested');
  });

  it('excuses the certificate gate on the ground that its producers do not compete', () => {
    // Fire, telecom and environment each close the same gate; all three hold at once.
    expect(BY_FACT.occupancyCertificateGate.producers).toEqual([
      'fire.safety-certificate', 'services.environmental-conditions', 'telecom.cti',
    ]);
    expect(BY_FACT.occupancyCertificateGate.rivalRules.length).toBe(3);
    expect(BY_FACT.occupancyCertificateGate.verdict).toBe('cumulative');
  });

  it('reports the setback sweep that closed the gap', () => {
    expect(BY_FACT.requiredSetback).toMatchObject({ verdict: 'swept', conflicts: 3 });
    expect(BY_FACT.requiredSetback.producers).toHaveLength(7);
    expect(BY_FACT.requiredSetback.assertions).toBeGreaterThan(10);
  });

  /**
   * Weaker than the fact-level report and worth keeping beside it: a rule can share a
   * well-swept fact and still state nothing the query can hold it to.
   */
  it('names the rules the clause layer holds nothing for', () => {
    // Pinned rather than counted. Half the register is here, and most of it legitimately:
    // a rule whose fact nothing else produces has no rival to be compared against. The
    // list is worth keeping stable so that a rule LEAVING it — someone authoring an
    // assertion — and a rule joining it are both visible edits.
    expect(rulesWithoutAssertions()).toEqual([
      'accessibility.scope', 'compounding.schedule', 'coverage.ground-coverage',
      'far.green-incentive', 'far.mixed-use',
      'far.purchasable-fee', 'far.purchase-gate', 'far.telescopic-residential', 'far.tod',
      'fire.access', 'parking.ecs-ratios', 'permission.route',
      'services.rainwater-harvesting', 'services.solar-pv', 'services.solar-water-heating',
      'services.solid-waste', 'social.ews-lig', 'zoning.impact-fee',
      'zoning.master-plan-names', 'zoning.permissibility',
    ]);
    expect(rulesWithoutAssertions().length).toBeLessThan(Object.keys(RULES).length);
  });
});

/**
 * Two declarations the coverage query found wrong on its first run, both about the same
 * fact and in opposite directions.
 */
describe('useAllowed had three rules answering it and only one of them was', () => {
  it('leaves the zoning matrix as the only rule that decides permissibility', () => {
    expect(BY_FACT.useAllowed.producers).toEqual(['zoning.permissibility']);
  });

  it('gives the Appendix-15 translation its own fact', () => {
    // It says what a master plan calls the zone Clause 15.3 codes. That is not a verdict
    // about a use, and declaring it as one invented a conflict AND hid a dependency.
    expect(BY_FACT.masterPlanZoneName.producers).toEqual(['zoning.master-plan-names']);
  });

  it('makes the dependency an edge, which it never was', () => {
    const edge = buildEdges().find(
      (e) => e.from === 'zoning.master-plan-names' && e.to === 'zoning.permissibility');
    expect(edge, 'Appendix-15 must run before the matrix that needs its translation').toBeDefined();
    expect(edge!.facts).toEqual(['masterPlanZoneName']);
  });

  it('leaves the occupancy minimums where they belong', () => {
    // A project refused for a too-narrow road is refused for a reason Clause 15.3 knows
    // nothing about, so these are cumulative conditions and not two answers to a question.
    expect(RULES['occupancy.thresholds'].produces).not.toContain('useAllowed');
    expect(RULES['occupancy.thresholds'].produces).toContain('minRoadWidth');
  });
});
