import { describe, expect, it } from 'vitest';
import {
  RESOLUTION_FAMILIES, RESOLUTIONS, familyFor, findConflicts, resolutionFor, resolutionKey,
  thresholdDivergence, undisposed,
} from '../conflicts';
import { CLAUSE_NODES } from '../clauses';

const CONFLICTS = findConflicts();
const pairs = new Set(CONFLICTS.map(resolutionKey));
const found = (a: string, b: string) => pairs.has([a, b].sort().join('|'));

/**
 * THE BENCHMARK.
 *
 * Eleven conflicts, every one found by a person reading two clauses side by side and
 * noticing. `docs/RULE-GRAPH-PLAN.md` named eight; three more arrived with chapters 13,
 * 17 and 18. The answer set existed before the query did, which is the only honest way to
 * measure a detector — and the acceptance bar the plan set was six of the eight.
 *
 * A miss is a finding about the schema, not a failure to tune away. V-038 is the one the
 * same-fact query structurally cannot see, and the reason is recorded against it.
 */
describe('recall — the query re-finds what people found by reading', () => {
  it('V-010 — Chapters 3 and 4 give different height ceilings', () => {
    expect(found('c3.2.4.1.height.large-plot', 'c4.1.4.height.single-unit')).toBe(true);
    expect(found('c3.2.4.1.height.small-plot', 'c4.1.4.height.multi-unit')).toBe(true);
  });

  it('V-014 and V-016 — Chapter 3 and the per-occupancy breakdowns disagree on Max FAR', () => {
    const far = CONFLICTS.filter((c) => c.fact === 'ceilingFar');
    const cell = (ch3: number, printed: number, area: string) => far.some(
      (c) => [c.a, c.b].some((n) => n.asserts === ch3 && n.id.startsWith('ch3.'))
        && [c.a, c.b].some((n) => n.asserts === printed && n.id.startsWith('printed.'))
        && [c.a, c.b].every((n) => n.id.includes(area)));

    // V-016's rows, in the bands the engine's own two sources can reach.
    expect(cell(2.0, 2.1, 'built_up'), 'group housing 9-12 m built-up').toBe(true);
    expect(cell(5.0, 5.25, 'built_up'), 'commercial units >24-45 m built-up').toBe(true);
    expect(cell(3.5, 3.6, 'non_built_up'), 'commercial units >12-24 m new layout').toBe(true);
    expect(cell(6.0, 6.1, 'non_built_up'), 'commercial units >24-45 m new layout').toBe(true);
    expect(cell(6.0, 10.5, 'non_built_up'), 'shopping malls >24-45 m new layout').toBe(true);
  });

  it('V-034 — two definitions of "Special Building", over four lists', () => {
    expect(found('c1.2q.special-building', 'c10.1.3b.special-building')).toBe(true);
    expect(found('c1.2q.special-building', 'c2.9.3.2.special-building')).toBe(true);
    expect(found('c10.1.3b.special-building', 'c2.9.3.2.special-building')).toBe(true);
  });

  it('V-035 — the certificate height limb reads 15 m or 17.5 m', () => {
    expect(found('c10.1.3a.fire-certificate', 'c10.1.3a.fire-certificate.read-with-c1.2m')).toBe(true);
  });

  it('V-036 — three words for area behind the same 500', () => {
    // All three limbs sit on one fact, so the query sees the full three-way.
    expect(found('c10.1.3c.special-building', 'c2.9.3.2.special-building')).toBe(true);
    expect(found('c1.2q.special-building', 'c2.9.3.2.special-building')).toBe(true);
    expect(found('c1.2q.special-building', 'c10.1.3c.special-building')).toBe(true);
  });

  it('V-037 — a fourth fire trigger, on a floor count Chapter 10 does not use', () => {
    expect(found('c10.1.3a.fire-certificate', 'c2.9.3.2.fire-noc.height')).toBe(true);
    expect(found('c10.1.3a.fire-certificate', 'c2.9.3.2.fire-noc.floors')).toBe(true);
  });

  it('V-044 — tree plantation stated twice, in two chapters, on two bases', () => {
    expect(found('c13.7.trees.commercial', 'c3.landscape-plan.commercial')).toBe(true);
    expect(found('c13.7.trees.industrial', 'c3.landscape-plan.industrial')).toBe(true);
  });

  it('V-049 — the EV share stated as 20% and as 15%', () => {
    expect(found('c17.1.ev-share', 'c17.5.1.ev-share')).toBe(true);
  });

  it('V-051 — two telecom tables captioned one way and keyed another', () => {
    expect(found('c18.5.1.2n.telecom-room.built-up', 'c18.5.1.2n.telecom-room.ibs-covered')).toBe(true);
  });

  /**
   * The one the same-fact query cannot see, and the reason is worth as much as a hit.
   *
   * V-038's eight obligations produce eight DIFFERENT facts — seismic design, a fire
   * certificate, a completion NOC, a peer review, four competence limits — so no two of
   * them ever meet in a same-fact comparison. What they share is the quantity they gate
   * on, which is a different query.
   */
  it('V-038 — found by threshold divergence, not by the same-fact query', () => {
    expect(CONFLICTS.some((c) => c.a.clause.includes('11.8.1') && c.b.clause.includes('10.1.3'))).toBe(false);

    const byFact = Object.fromEntries(thresholdDivergence().map((d) => [d.fact, d.values]));
    expect(byFact.buildingHeight).toEqual([7.5, 12, 15, 16, 17.5, 24, 50]);
    expect(byFact.floorCount).toEqual([2, 3, 4, 5, 8]);
  });
});

/**
 * Two clauses that both require the same thing on different triggers are not in conflict.
 * Clause 10.1.3 lists (a) a height, (b) a class and (c) an area, and the gazette joins
 * them itself. Without this the query reports every enumerated list as a pile of
 * disagreements and the signal is gone.
 */
describe('limbs of one enumerated list are not rivals', () => {
  it.each([
    ['c10.1.3b.special-building', 'c10.1.3c.special-building'],
    ['c2.9.3.2.fire-noc.height', 'c2.9.3.2.fire-noc.floors'],
    ['c11.8.1.seismic.height', 'c11.8.1.seismic.floors'],
  ])('%s and %s', (a, b) => {
    expect(found(a, b)).toBe(false);
  });
});

describe('the query is honest about what it does not do', () => {
  it('leaves shape (b) — a table contradicting its own components — to the extractor', () => {
    // Clause 8.1.3.1 prints 5.25 above its own components' 4.5 (V-025). That is one table
    // disagreeing with itself, which no pair of clauses can express, and
    // tools/extract-purchasable-far.py checks all 157 band checks on every run.
    expect(CONFLICTS.some((c) => c.a.clause === c.b.clause && c.a.produces === 'ceilingFar')).toBe(false);
  });

  it('does not detect shape (c), and says so by naming the disposition instead', () => {
    // V-039: a reading defeated because it would empty a neighbouring table. Recorded as a
    // disposition before anyone tries to detect it, which was the plan's recommendation.
    const dispositions = new Set(Object.values(RESOLUTIONS).map((r) => r.disposition));
    expect(dispositions.has('defeated-by-consequence')).toBe(false);
    expect(CONFLICTS.length).toBeGreaterThan(0);
  });
});

describe('resolution as data', () => {
  it('records a disposition only against a pair the query actually returns', () => {
    const stale = Object.keys(RESOLUTIONS).filter((key) => !pairs.has(key));
    expect(stale, `dispositions with no conflict behind them: ${stale.join(', ')}`).toEqual([]);
  });

  it('cites the log entry the disposition came from', () => {
    for (const [key, resolution] of Object.entries(RESOLUTIONS)) {
      expect(resolution.why.length, `${key} has no reasoning`).toBeGreaterThan(40);
      if (resolution.logEntry) expect(resolution.logEntry).toMatch(/^[BV]-\d{3}$/);
    }
  });

  it('keeps the undecided visible as undecided rather than defaulting them', () => {
    // This test used to require that some conflicts carried NO disposition at all, on the
    // ground that a disposition invented to make the number look better is worse than the
    // gap. That ground is right and the test has been strengthened rather than relaxed:
    // every conflict is now recorded, and what the guard checks is that recording one did
    // not quietly decide it. `unresolved` must remain a live disposition — if it ever
    // reached zero, something genuinely undecided would have been papered over.
    const dispositions = CONFLICTS.map((c) => resolutionFor(c)?.disposition);
    expect(dispositions.filter((d) => d === undefined)).toEqual([]);
    expect(dispositions.filter((d) => d === 'unresolved').length).toBeGreaterThan(0);
    // And no single disposition may account for everything, which is what a rubber stamp
    // would look like.
    expect(new Set(dispositions).size).toBeGreaterThan(2);
  });
});

describe('the node set', () => {
  it('has a unique id for every assertion', () => {
    expect(new Set(CLAUSE_NODES.map((n) => n.id)).size).toBe(CLAUSE_NODES.length);
  });

  it('names a clause on every one', () => {
    for (const node of CLAUSE_NODES) {
      expect(node.clause.length, `${node.id} names no clause`).toBeGreaterThan(3);
      expect(node.asks.length).toBeGreaterThan(10);
    }
  });

  it('holds readings the engine rejects as well as the ones it applies', () => {
    const rejected = CLAUSE_NODES.filter((n) => !n.applied);
    expect(rejected.length).toBeGreaterThan(5);
    // A rejected reading is not attached to a register entry — nothing executes it.
    for (const node of rejected) expect(node.implements).toBeUndefined();
  });
});

describe('the families are decisions, not a way to zero the count', () => {
  it('disposes every conflict the query returns', () => {
    expect(undisposed()).toEqual([]);
  });

  /**
   * Pinned per family. A family exists to state one decision about a relationship between
   * two clauses; if the number of pairs it covers changes, either a new conflict has
   * appeared or a rule has moved, and someone should look rather than have it absorbed
   * silently. This is the guard that keeps a family from becoming a wildcard.
   */
  it('covers exactly the pairs each family was written for', () => {
    const counts = new Map<string, number>();
    for (const c of findConflicts()) {
      const f = familyFor(c);
      if (f) counts.set(f.id, (counts.get(f.id) ?? 0) + 1);
    }
    expect(Object.fromEntries([...counts].sort())).toEqual({
      'ch3-ladder-vs-printed-table': 26,
      'clause-14.4-bands-overlap': 4,
      'completion-stage-fire-noc-floor-limb': 4,
      'engineer-and-supervisor-both-competent': 4,
      'special-building-four-lists': 5,
      'tree-rates-are-cumulative-obligations': 6,
    });
  });

  it('leaves no family dead, so a stale one cannot sit unnoticed', () => {
    const live = new Set(findConflicts().map((c) => familyFor(c)?.id).filter(Boolean));
    for (const f of RESOLUTION_FAMILIES) {
      expect(live.has(f.id), `${f.id} covers nothing`).toBe(true);
    }
  });

  it('makes every family answerable — a log entry, or a reason it is not a conflict', () => {
    for (const f of RESOLUTION_FAMILIES) {
      if (f.disposition === 'not-a-conflict') {
        expect(f.why.length, f.id).toBeGreaterThan(80);
      } else {
        expect(f.logEntry, `${f.id} has no log entry`).toBeTruthy();
      }
      expect(f.why, f.id).toMatch(/[a-z]/);
    }
  });

  it('lets an exact pair override its family', () => {
    // c13.7.trees.commercial|c3.landscape-plan.commercial is disposed exactly (V-044) and
    // also falls inside the tree family. The exact entry must win.
    const tree = findConflicts().find((c) =>
      resolutionKey(c) === 'c13.7.trees.commercial|c3.landscape-plan.commercial');
    expect(tree).toBeDefined();
    expect(resolutionFor(tree!)).toBe(RESOLUTIONS[resolutionKey(tree!)]);
  });
});
