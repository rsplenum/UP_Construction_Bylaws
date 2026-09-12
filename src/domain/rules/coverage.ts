/**
 * Where the conflict query has not looked.
 *
 * `graph.ts` runs over `registry.ts` — one node per rule the engine applies. `conflicts.ts`
 * runs over `clauses.ts` — one node per assertion the gazette makes. The two files were
 * built for the two halves of `docs/RULE-GRAPH-PLAN.md` and nothing checked either against
 * the other, which left a hole precisely shaped like the query's own claim.
 *
 * The claim is "54 conflicts, and every one of them disposed". Read without this file it
 * sounds like a sweep of the document. It was a sweep of ELEVEN of the thirty-eight facts
 * the engine establishes — and, worse, of the eleven where the verification log already
 * said something was wrong. A query that is only pointed where a person has already looked
 * cannot find what a person missed, and its silence everywhere else says nothing at all.
 *
 * So: for every derived fact, how many rules establish it, whether any two of those can
 * speak to one project at once, and whether the clause layer holds anything for the query
 * to compare. Four verdicts, and only one of them is a gap:
 *
 *   `cumulative`  the producers do not compete — three clearances, one certificate
 *   `uncontested` nothing could disagree: one producer, or producers that never meet
 *   `swept`       rivals, and assertions the query can compare
 *   `unswept`     rivals that CAN meet, and nothing for the query to compare  ← the gap
 *
 * Running it the first time returned four unswept facts, and the largest of them —
 * `requiredSetback`, five rules and not one clause assertion — held two setback tables the
 * gazette prints and the engine had never carried (B-050, B-051) and a scope exclusion in
 * a third that it had been ignoring in both directions (B-052).
 */

import {
  Combination, DerivedFact, DERIVED_FACTS, FACT_COMBINATION, coSatisfiable,
  type Guard, type RuleSet,
} from './schema';
import { RULES } from './registry';
import { CLAUSE_NODES, type ClauseNode } from './clauses';
import { findConflicts } from './conflicts';

export type Verdict = 'cumulative' | 'uncontested' | 'swept' | 'unswept';

export interface FactCoverage {
  readonly fact: DerivedFact;
  readonly combination: Combination;
  /** Register entries that establish it. */
  readonly producers: readonly string[];
  /**
   * Producer pairs that can both speak to one project. Two rules producing one fact are
   * only rivals if some real site satisfies both guards — a rule for shops and a rule for
   * group housing never meet, and their sharing a fact is not a question anyone has to
   * answer.
   */
  readonly rivalRules: readonly (readonly [string, string])[];
  /** Assertions in `clauses.ts` the conflict query can compare. */
  readonly assertions: number;
  /** Conflicts the query actually returned on this fact. */
  readonly conflicts: number;
  readonly verdict: Verdict;
}

const guardOf = (g: Guard | undefined): Guard => g ?? {};

export function factCoverage(
  rules: RuleSet = RULES,
  nodes: readonly ClauseNode[] = CLAUSE_NODES,
): readonly FactCoverage[] {
  const conflictsByFact = new Map<string, number>();
  for (const c of findConflicts(nodes)) {
    conflictsByFact.set(c.fact, (conflictsByFact.get(c.fact) ?? 0) + 1);
  }

  return DERIVED_FACTS.map((fact) => {
    const producers = Object.values(rules)
      .filter((r) => r.produces.includes(fact)).map((r) => r.id).sort();

    const rivalRules: (readonly [string, string])[] = [];
    for (let i = 0; i < producers.length; i += 1) {
      for (let j = i + 1; j < producers.length; j += 1) {
        if (coSatisfiable(guardOf(rules[producers[i]].appliesWhen), guardOf(rules[producers[j]].appliesWhen))) {
          rivalRules.push([producers[i], producers[j]]);
        }
      }
    }

    const assertions = nodes.filter((n) => n.produces === fact).length;
    const combination = FACT_COMBINATION[fact];
    const verdict: Verdict =
      combination === 'cumulative' ? 'cumulative'
        : assertions > 0 ? 'swept'
          : rivalRules.length > 0 ? 'unswept'
            : 'uncontested';

    return {
      fact, combination, producers, rivalRules, assertions,
      conflicts: conflictsByFact.get(fact) ?? 0,
      verdict,
    };
  });
}

/**
 * Facts with rival producers and nothing for the query to compare, largest first.
 *
 * This is the working list. An entry here is not a conflict and not a bug — it is a
 * question the document may or may not answer twice, and nobody has looked.
 */
export function unsweptFacts(
  rules: RuleSet = RULES,
  nodes: readonly ClauseNode[] = CLAUSE_NODES,
): readonly FactCoverage[] {
  return factCoverage(rules, nodes)
    .filter((c) => c.verdict === 'unswept')
    .sort((a, b) => b.rivalRules.length - a.rivalRules.length
      || b.producers.length - a.producers.length
      || a.fact.localeCompare(b.fact));
}

export interface CoverageSummary {
  readonly facts: number;
  readonly swept: number;
  readonly unswept: number;
  readonly uncontested: number;
  readonly cumulative: number;
}

export function coverageSummary(
  rules: RuleSet = RULES,
  nodes: readonly ClauseNode[] = CLAUSE_NODES,
): CoverageSummary {
  const all = factCoverage(rules, nodes);
  const count = (v: Verdict) => all.filter((c) => c.verdict === v).length;
  return {
    facts: all.length,
    swept: count('swept'),
    unswept: count('unswept'),
    uncontested: count('uncontested'),
    cumulative: count('cumulative'),
  };
}

/**
 * A rule the clause layer holds nothing for.
 *
 * Weaker than `unsweptFacts` and worth having beside it: a rule can share a well-swept
 * fact and still have no assertion of its own, which means the query compares its rivals
 * to each other and never to it. `far.tod` is the standing example — it adjusts a ceiling
 * fifty-five assertions argue about, and states nothing any of them can be held against.
 */
export function rulesWithoutAssertions(
  rules: RuleSet = RULES,
  nodes: readonly ClauseNode[] = CLAUSE_NODES,
): readonly string[] {
  const named = new Set(nodes.map((n) => n.implements).filter(Boolean) as string[]);
  return Object.keys(rules).filter((id) => !named.has(id)).sort();
}
