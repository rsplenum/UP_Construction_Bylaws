/**
 * The rule graph — edges nobody authors.
 *
 * `docs/RULE-GRAPH-PLAN.md`, Step 2: *"No one authors edges. `A → B` where
 * `A.produces ∩ B.consumes ≠ ∅`. Generate it, assert it is acyclic, and use the
 * topological order to check that `findings.ts` evaluates in a legal sequence — which is
 * itself a test we do not currently have."*
 *
 * That is the whole of this file. Everything here is derived from the `consumes` and
 * `produces` declarations in `registry.ts`; nothing is stated twice. An edge that appears
 * here and should not is a declaration to correct, not an edge to delete.
 *
 * Three reports fall out of the same declarations, and each one answers a question the
 * verification log has been answering by hand:
 *
 *   `unsuppliedDependencies` — which obligations rest on a field `ProjectState` does not
 *   have. V-038 counts these in prose ("the fifth obligation blocked on the same missing
 *   field"); this counts them.
 *
 *   `unproducedFacts` — a rule reads a derived fact no rule establishes. That is either a
 *   missing rule or a wrong declaration, and both are worth knowing.
 *
 *   `unconsumedFacts` — a rule establishes a fact nothing reads. Legitimate for a terminal
 *   answer (`compoundingFee` is the end of its chain), and a smell anywhere else.
 */

import {
  DerivedFact, Fact, GivenFact, RuleSet, UNSUPPLIED_FACTS, isDerived,
} from './schema';
import { RULES } from './registry';

export interface Edge {
  /** The rule that establishes the fact. */
  readonly from: string;
  /** The rule that reads it. */
  readonly to: string;
  /** Why the edge exists. More than one fact can carry the same dependency. */
  readonly facts: readonly DerivedFact[];
}

/**
 * `A → B` wherever B reads something A establishes.
 *
 * Guards are deliberately NOT consulted. An edge is a statement about dataflow, and
 * `assessProject` evaluates every rule in one pass whatever the project is: a legal
 * evaluation order has to be legal for all projects at once, not for the one in front of
 * it. Narrowing edges by co-satisfiability would produce an order that happens to work
 * for a plotted house and breaks on a mall.
 */
export function buildEdges(rules: RuleSet = RULES): readonly Edge[] {
  const edges: Edge[] = [];
  for (const from of Object.values(rules)) {
    const produced = new Set<string>(from.produces);
    if (produced.size === 0) continue;
    for (const to of Object.values(rules)) {
      if (to.id === from.id) continue;
      const facts = to.consumes.filter((f) => produced.has(f)) as DerivedFact[];
      if (facts.length > 0) edges.push({ from: from.id, to: to.id, facts });
    }
  }
  return edges;
}

export interface TopologicalResult {
  /** Rule ids in an order where every producer precedes every consumer. */
  readonly order: readonly string[];
  /** Rules left over when no such order exists — a cycle, or downstream of one. */
  readonly unordered: readonly string[];
}

/**
 * Kahn's algorithm, with ties broken by rule id so the order is stable between runs.
 *
 * A stable order matters more than an optimal one: this is compared against the sequence
 * `findings.ts` actually evaluates in, and a test that reorders itself between runs
 * cannot be the thing that catches a reordering in the code.
 */
export function topologicalOrder(rules: RuleSet = RULES, edges = buildEdges(rules)): TopologicalResult {
  const indegree = new Map<string, number>();
  const out = new Map<string, string[]>();
  for (const id of Object.keys(rules)) { indegree.set(id, 0); out.set(id, []); }
  for (const e of edges) {
    if (!indegree.has(e.from) || !indegree.has(e.to)) continue;
    out.get(e.from)!.push(e.to);
    indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1);
  }

  const ready = [...indegree.entries()].filter(([, n]) => n === 0).map(([id]) => id).sort();
  const order: string[] = [];
  while (ready.length > 0) {
    const id = ready.shift()!;
    order.push(id);
    for (const next of out.get(id) ?? []) {
      const left = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, left);
      if (left === 0) { ready.push(next); ready.sort(); }
    }
  }
  return { order, unordered: Object.keys(rules).filter((id) => !order.includes(id)).sort() };
}

/** Where a rule sits in the legal order. Later means it may read more. */
export function rankOf(result: TopologicalResult): ReadonlyMap<string, number> {
  return new Map(result.order.map((id, i) => [id, i]));
}

export interface FactDemand {
  readonly fact: Fact;
  readonly rules: readonly string[];
}

const sortedDemand = (m: Map<Fact, string[]>): readonly FactDemand[] =>
  [...m.entries()]
    .map(([fact, ids]) => ({ fact, rules: [...ids].sort() }))
    .sort((a, b) => b.rules.length - a.rules.length || String(a.fact).localeCompare(String(b.fact)));

/**
 * Obligations resting on a fact no field supplies, commonest first.
 *
 * This is the number V-038 keeps restating. A rule listed here answers with a caveat —
 * *"unless this runs to more than three floors"* rather than *"no"* — and the count is
 * the size of the hole, not a defect in any one rule.
 */
export function unsuppliedDependencies(rules: RuleSet = RULES): readonly FactDemand[] {
  const missing = new Set<string>(UNSUPPLIED_FACTS as readonly string[]);
  const byFact = new Map<Fact, string[]>();
  for (const rule of Object.values(rules)) {
    const seen = new Set<Fact>([...rule.consumes, ...guardFactsOf(rule)]);
    for (const fact of seen) {
      if (!missing.has(fact)) continue;
      byFact.set(fact, [...(byFact.get(fact) ?? []), rule.id]);
    }
  }
  return sortedDemand(byFact);
}

function guardFactsOf(rule: { appliesWhen?: { ranges?: readonly { fact: Fact }[]; oneOf?: readonly { fact: Fact }[]; flags?: readonly { fact: Fact }[] } }): readonly Fact[] {
  const g = rule.appliesWhen;
  if (!g) return [];
  return [
    ...(g.ranges ?? []).map((t) => t.fact),
    ...(g.oneOf ?? []).map((t) => t.fact),
    ...(g.flags ?? []).map((t) => t.fact),
  ];
}

/** A derived fact some rule reads and no rule establishes — a missing rule, or a typo. */
export function unproducedFacts(rules: RuleSet = RULES): readonly FactDemand[] {
  const produced = new Set<string>();
  for (const rule of Object.values(rules)) for (const f of rule.produces) produced.add(f);
  const byFact = new Map<Fact, string[]>();
  for (const rule of Object.values(rules)) {
    for (const fact of rule.consumes) {
      if (!isDerived(fact) || produced.has(fact)) continue;
      byFact.set(fact, [...(byFact.get(fact) ?? []), rule.id]);
    }
  }
  return sortedDemand(byFact);
}

/** A derived fact some rule establishes and no rule reads. Terminal answers live here. */
export function unconsumedFacts(rules: RuleSet = RULES): readonly DerivedFact[] {
  const consumed = new Set<string>();
  for (const rule of Object.values(rules)) for (const f of rule.consumes) consumed.add(f);
  const orphans = new Set<DerivedFact>();
  for (const rule of Object.values(rules)) {
    for (const fact of rule.produces) if (!consumed.has(fact)) orphans.add(fact);
  }
  return [...orphans].sort();
}

/** Every rule that establishes a given fact. Two entries is where the conflict query starts. */
export function producersOf(fact: DerivedFact, rules: RuleSet = RULES): readonly string[] {
  return Object.values(rules).filter((r) => r.produces.includes(fact)).map((r) => r.id).sort();
}

/** Facts `ProjectState` cannot supply, as a set, for callers that only need membership. */
export const UNSUPPLIED: ReadonlySet<GivenFact> = new Set(UNSUPPLIED_FACTS);
