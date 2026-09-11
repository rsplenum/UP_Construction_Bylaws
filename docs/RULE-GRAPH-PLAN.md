# The rule graph, and the conflict query

**Status: BUILT. All four steps done, 2026-09-11.**

`src/domain/rules/schema.ts` (facts, guards), `registry.ts` (31 rules declared),
`graph.ts` (edges, topological order), `clauses.ts` (87 clause assertions),
`conflicts.ts` (the query and the dispositions). 72 new tests.

**What it found.** 54 conflicts, of which the eleven known ones are 11 — ten by the
same-fact query and V-038 by the threshold-divergence query added for it. Three live bugs
fell out of the declaration before the query ran a line: B-044, B-045 and B-046. The
outcome section at the end of this document records the whole of it.

This is the execution plan for the *cross-reference graph* named as a cross-cutting
mechanism in `docs/ARCHITECTURE-RESEARCH.md`, written up in full because it answers a
design question that came up in its own right and deserves a settled answer rather than a
re-derivation every time it resurfaces.

---

## The question that started it

> *"These are rules and exceptions to rules for each case. What else is there? We should
> not expect a set of measurements, i.e. numbers — rather it's an exception-laden statement
> that makes a node in the matrix. I keep imagining a 3D matrix of such nodes. Every node is
> a statement of rules & exceptions, or there are multiple rules that make a complex rule at
> such a node. Is it possible to model this labyrinth of rules and exceptions in a 3D matrix
> which, when queried, cross-references the relevant nodes to answer the query and produces
> output for user inputs?"*

Keep the question. It is the right question, and half of it is right.

## What is right about it

**"Not a set of numbers, rather an exception-laden statement."** This is the truest single
observation anyone has made about this document, and the whole verification log is evidence
for it. A figure in these byelaws is almost never a figure: it is a figure *plus* the
conditions under which it holds, *plus* the clause elsewhere that displaces it.

- **V-035** — the certificate threshold is 15 m or 17.5 m depending on which clause you
  enter the document from.
- **V-039** — a non-compoundable bar whose literal reading is defeated by a *table in
  another chapter* that the bar does not reference.
- **V-034** — one defined term, "Special Building", with four different lists behind it.

**"Multiple rules that make a complex rule at such a node."** Right, and that is
composition — exactly what the engine does when it resolves base FAR, then the purchase
gate, then the tranche split, then the fee.

**"Cross-references the relevant nodes to answer the query."** Right, and that is
evaluation. `assessProject` already does this; what it does not do is *declare* the
cross-references as data.

## What is wrong about it

### 1. It is not three axes

Eleven chapters in, the engine has needed: occupancy, road width, area type, plot area,
building height, floor count, ground cover, dwelling units, unit area, use zone,
location-within-mixed-use, TOD zone flag, hotel room count, green rating, certification
status, plot frontage, corner plot, stilt, affordable-scheme flag, existing-building class.

That is twenty axes. `ProjectState` carries 56 fields. Seven chapters remain.

Twenty axes at five values each is roughly 10^14 cells holding perhaps 3,000 actual rules.
The structure would be 99.999999% empty, and every one of those empty cells is a cell
someone has to decide is genuinely empty.

### 2. Some axes are outputs, not coordinates

This is the fatal objection, and it is not about size.

A matrix presumes you can address a cell by coordinates known *before* you look. In this
document you cannot:

```
fire certificate  ←  built-up area  ←  FAR  ←  road width
                                            ←  purchase gate  ←  occupancy, area type
                                            ←  base FAR       ←  plot area (telescopic)
```

Setbacks depend on height; the height ceiling depends on plot size *and* on the setbacks
achievable (V-010). Half the coordinates of the cell you want are computed by other cells.
That is a dataflow graph with a topological order, not a lookup.

### 3. Exceptions live on edges, not in cells

**V-039 is the proof and it is worth restating, because it is the clearest case in the
whole log.** Clause 16.1.3(vi) bars compounding of *"construction in the buildings where
earthquake resistance measures are mandatory as per chapter 11.8"*. Read literally, that
bars every building over 12 m.

It does not, because Chapter 16's own table of compoundable limits carries a column headed
*"Buildings >15-meter height and Group Housing"* with figures in every row — a column that
could never apply to anything under the literal reading.

**There is no cell in any matrix where that fact belongs.** It is not a property of the
bar and not a property of the table. It is a relationship between two nodes. A matrix has
nowhere to put it; a graph has an edge.

## Where matrices *are* right

Not nowhere — and this is worth keeping, because the instinct is sound about the leaves.

- Chapter 15's permissibility matrix is **53 activities × 16 zones = 847 verdicts**, dense
  and genuinely two-dimensional. It is stored as a matrix and should be.
- The FAR bands are a three-axis table — occupancy × area type × road band — and stored as
  one.

**Matrices for what the gazette tabulates; a graph for what the gazette argues.** The
document itself splits this way: tables for the dense parts, prose for the conditions and
the exceptions. The storage should mirror the source, not fight it.

---

## What we build

A sparse, typed rule graph. **We are roughly 70% of the way there already** — this is
mostly a declaration exercise, not a rewrite.

| Piece | State |
|---|---|
| Nodes — one per rule, with question, clause, confidence, challenge | `rules/registry.ts` — **built** |
| Provenance — every node's quote re-checked against the source | `rules/citations.ts` — **built** |
| Applicability guards | implicit in code — **to declare** |
| `produces` / `consumes` | implicit in code — **to declare** |
| Edges | derived from the above — **to generate** |
| Conflict query | — **to build** |

### Step 1 — declare `produces` and `consumes`

`RuleInput` already exists and is the `consumes` half, partially. Add the other half.

```ts
export interface RuleMeta {
  // ...existing
  /** Facts this rule reads. Already present as derivedFrom; rename or alias. */
  consumes: RuleInput[];
  /** Facts this rule establishes. New. */
  produces: RuleOutput[];
  /** When this rule applies at all. New — the RASE 'Applicability' limb. */
  appliesWhen?: Guard;
}
```

`RuleOutput` is a closed union, same discipline as `RuleInput`: `baseFar`, `ceilingFar`,
`purchasableSplit`, `requiredSetback`, `maxHeight`, `fireCertificateRequired`,
`seismicMandatory`, `compoundingFee`, `nonCompoundable`, and so on. Closed, because the
value of the whole exercise is that two rules naming the same output is *detectable*, and
that only works if the names are drawn from a fixed set.

`Guard` starts as the smallest thing that expresses what we have actually met — a
conjunction of comparisons on `RuleInput` values, plus set membership for occupancy. Do not
design for generality here; design against the guards we already know, per the architecture
doc's rule about schema design.

### Step 2 — derive the edges

No one authors edges. `A → B` where `A.produces ∩ B.consumes ≠ ∅`. Generate it, assert it
is acyclic, and use the topological order to check that `findings.ts` evaluates in a legal
sequence — which is itself a test we do not currently have.

### Step 3 — the conflict query

This is the payoff, and it is the thing a matrix structurally cannot do.

> **Two nodes that produce the same output, whose applicability guards can both be
> satisfied at once, are a conflict.**

Run it over the graph at build time and it enumerates every place the byelaws answer one
question two ways.

#### There are two conflict shapes, and we already detect one of them

Getting this distinction right is what makes the benchmark honest.

**Shape (b) — a table that contradicts itself.** One printed figure disagrees with the
other printed figures in its own row. `tools/extract-purchasable-far.py` already detects
these mechanically, on every run, via the identity `MFAR = BFAR + PFAR + PPFAR` across 157
band checks:

```
16 tables · 43 rows · 157 band checks · 5 FAILED · 3 rounded
   FAILS   ch07 p.102 Flatted Factories, Data Centres >12-24m: 3.0 + 1.0 = 4.0 vs MFAR 2.0
   FAILS   ch08 p.105 MU Built-up Area 24-45m: 2.0 + 2.5 = 4.5 vs MFAR 5.25
```

That is V-018, V-023, V-025 and V-029 — **found by a script, not by a reader.** The
precedent for mechanical conflict detection in this repository is therefore already
established and already working. What it cannot see is anything spanning two clauses,
because it only ever looks at one row at a time.

**Shape (a) — two clauses answering the same question differently.** This is what the graph
query is for, and it is the shape that has cost the most:

| | Conflict |
|---|---|
| V-010 | Chapters 3 and 4 give different height ceilings |
| V-014 | Chapters 3 and 5 print different maximum FARs for the same commercial units |
| V-016 | Six cells conflict between Chapter 3 and the per-occupancy breakdowns |
| V-034 | Two definitions of "Special Building", over four different lists |
| V-035 | The certificate height limb reads 15 m or 17.5 m depending on the entry clause |
| V-036 | Three different words for area behind the same 500 m² threshold |
| V-037 | A fourth fire-NOC trigger, on a floor count Chapter 10 does not use |
| V-038 | Four safety obligations, three floor counts, two heights, three area bases |

**Eight known conflicts, every one of them found by a person reading two clauses side by
side and noticing.** That is the benchmark, and it is a real one: the answer set exists
before the query does, which is the only honest way to measure a detector.

- **Recall** — it should re-find all eight. Anything it misses is a hole in the schema, and
  locating that hole is worth as much as the query.
- **Precision** — what it finds *beyond* the eight is the return. Those are conflicts nobody
  has noticed. On the evidence of the last three chapters, they exist.

**A third shape, for later.** V-039 is neither: a reading defeated because it would render
another provision inoperative. Detecting that automatically needs a notion of one rule
emptying another's domain, which is a harder query and should not gate this work. Record it
as a disposition (below) before trying to detect it.

**Acceptance:** the query re-finds at least 6 of the 8 known shape-(a) conflicts, and every
miss is explained in the log rather than waved through. A miss is a finding about the
schema, not a failure to be quietly tuned away.

### Step 4 — resolution as data

Each conflict gets a recorded disposition, not a code comment:

- `stricter` — standing rule 4, the default.
- `subordinated` — one clause explicitly yields. Clause 9.2.3 Note-2 is the clean example:
  *"the figures in respective chapters will prevail."*
- `defeated-by-consequence` — V-039's shape. One reading is rejected because it would
  render another provision inoperative. This is the disposition a matrix has nowhere to
  record, and having a name for it is half the benefit.
- `unresolved` — both readings stand, the stricter is applied, the alternative is surfaced
  on the finding.

---

## Why this is sequenced after the chapters

Not because it is less valuable. Because the conflict query is only as good as the corpus
it runs over, and every chapter read adds nodes to it. Building it at chapter 11 means
running it against two-thirds of the document and then re-running it seven times.

The chapters are also still yielding at a high rate — chapters 9, 10 and 11 produced B-031,
B-032 and V-039, and B-031 was a live 2.5× error on the app's main screen. That rate has
not fallen off, so the reading is not yet the lower-value activity.

**Resume condition:** all chapters read, or the yield per chapter drops sharply — whichever
comes first.

## Chapters outstanding

Held: 01–11, 15. Still to come: **12, 13, 14, 16, 17, 18, and the appendices.**

Note that **Chapter 16 has been read in full but has no chapter PDF**. It was read from the
flattened docx text before the per-chapter PDFs started arriving, which means its clause
numbers have never been checked against a paginated source — and the note at V-037 records
that four clause numbers written from memory in one pass were all wrong. Chapter 16 is the
single most consequential chapter in the engine (every fee comes from it). **Its PDF should
be treated as required, not optional.**

---

## What this does not change

The neuro-symbolic rule stands, and nothing here softens it: **the LLM authors rules, a
deterministic engine executes them, and there is never a model at runtime.** The conflict
query is a build-time analysis over declared data. It proposes; it does not decide.

---

# What was built, and what it found

*Appended 2026-09-11, after the work. The plan above is left exactly as it was written so
that what it predicted can be read against what happened.*

## The shape, as built

| Piece | Where | Size |
|---|---|---|
| Facts — a closed vocabulary, given and derived | `rules/schema.ts` | 23 given, 36 derived |
| Guards — flat conjunctions, decidable | `rules/schema.ts` | `coSatisfiable` in a dozen lines |
| Rules, with `consumes` / `produces` / `appliesWhen` | `rules/registry.ts` | **31** |
| Edges, topological order, missing-field reports | `rules/graph.ts` | **35 edges, acyclic** |
| Clause assertions — what the gazette says, clause by clause | `rules/clauses.ts` | **87** (32 authored, 55 generated) |
| The conflict query, threshold divergence, dispositions | `rules/conflicts.ts` | **54 conflicts** |
| Tests | `rules/__tests__/` | 72 |

## One repair the plan needed on contact

**Step 1's sketch could not have produced a single edge.** It typed `consumes` as
`RuleInput[]` and `produces` as `RuleOutput[]` — two disjoint unions, whose intersection is
empty by construction, so `A.produces ∩ B.consumes` is empty for every pair. The fix is
one vocabulary of facts with two halves: `Fact = GivenFact | DerivedFact`, `consumes`
spanning both, `produces` drawn from the derived half only. `RuleInput` survives as an
alias, because `derivedFrom` and `Challenge` still mean the given half specifically.

## Two repairs the corpus forced

**The definition needed a third condition.** *"Two nodes that produce the same output,
whose applicability guards can both be satisfied at once"* reports Clause 10.1.3(a), (b)
and (c) as three mutual conflicts. They are three limbs of one enumerated list requiring
one certificate; the gazette joins them itself. So a conflict also requires that the two
assertions can **disagree** — different answers where both state one, or guards that are
not equivalent where neither does. `limbOf` carries the exception. Without it the query
returns a pile in which the signal is invisible.

**A second query was needed, and V-038 is why.** The same-fact query structurally cannot
see V-038, and this is worth stating plainly because it is the largest single entry in the
log. Its eight obligations produce **eight different facts** — seismic design, a fire
certificate, a completion NOC, a peer review, four competence limits — so no two of them
ever meet in a same-fact comparison. What they share is the *quantity they gate on*.
`thresholdDivergence` counts that instead, and it is reported separately so the recall
figure stays meaningful:

```
buildingHeight   7 distinct →  7.5, 12, 15, 16, 17.5, 24, 50
floorCount       5 distinct →  2, 3, 4, 5, 8
roadWidth        5 distinct →  9, 12, 18, 24, 45
builtUpArea      4 distinct →  465, 500, 2500, 5000
plotArea         3 distinct →  100, 300, 500
```

Seven heights is exactly what V-038 counted by hand. **Five floor counts is not six.**
V-038 says six, and the difference is that it counted distinct *statements* where this
counts distinct *numbers*: Clause 11.8.1's ">3 including ground" and Chapter 2's ">3
storeys" are two statements sharing the number 3 on two different bases. Both readings are
defensible and the log entry has been corrected to say which it means.

## Recall against the benchmark

Eleven conflicts found by people reading. The acceptance bar was six of eight.

| | Conflict | Found by |
|---|---|---|
| V-010 | Chapters 3 and 4 give different height ceilings | same-fact ✓ |
| V-014 | Chapters 3 and 5 print different maximum FARs | same-fact ✓ |
| V-016 | Six cells conflict between Chapter 3 and the breakdowns | same-fact — **5 of 6** |
| V-034 | Two definitions of "Special Building", four lists | same-fact ✓ |
| V-035 | The certificate limb reads 15 m or 17.5 m | same-fact ✓ |
| V-036 | Three words for area behind the same 500 | same-fact ✓ |
| V-037 | A fourth fire trigger, on a floor count Chapter 10 lacks | same-fact ✓ |
| V-038 | Eight obligations, seven heights, six floor counts | **threshold divergence only** |
| V-044 | Tree plantation twice, two chapters, two bases | same-fact ✓ |
| V-049 | The EV share as 20% and as 15% | same-fact ✓ |
| V-051 | Telecom tables captioned one way, keyed another | same-fact ✓ |

**Ten of eleven on the primary query; eleven of eleven across both.**

**The one miss inside V-016 is a schema hole, and it is worth more than the hit would
have been.** The multiplex row is not found because `purchasableRowFor` maps no occupancy
to Clause 5.4.4's cinema table — `inst_assembly` returns nothing — so the node was never
generated. The query cannot see a conflict between a table the engine reads and a table it
has no path to. The hole is in the occupancy mapping, not in the query.

A second, quieter hole: the V-016 rows for shopping malls are found, but against the wrong
Chapter 3 figure. V-016 compares Chapter 3's own *mall* row (9.0) against Clause 5.2.5's
10.5; the query compares rows 3(a)/3(b) (6.0) against 10.5, because rows 3(a)/3(b) are
what the engine actually reads for a mall. That is V-003 showing through, and the pair is
right even though the left-hand number is not the one a reader would have picked.

## Precision — what it found that nobody had

**54 conflicts, 11 of them known.** The 43 others are not all news of equal weight — 26 are
FAR cells, and most of those are V-003 showing through band by band — but the enumeration
is itself the return. V-003 was known as a sentence: *"ten occupancies read a table written
for shops."* It is now known as a list of where the two readings diverge and by how much.

**And six of those cells were a live over-permission.** `CROSS_CHAPTER_MAX_FAR_CONFLICTS`
enumerates six bands where Chapter 3 is the *lower* of the two figures and records the
engine's policy: *"the engine keeps the LOWER ceiling, so no project is told it may build
more than the most restrictive reading allows."* Nobody had enumerated the bands where
Chapter 3 is the **higher** one — and there the engine kept it too, against its own stated
policy. On a 12 m road a bazaar shop or a commercial unit over 100 m² was given a ceiling
of 2.1 built-up or 2.45 in a new layout where Clauses 5.1.4 and 5.2.5 print 1.5 and 1.75.
That is B-046, and the query found it.

## Three bugs found before the query ran

Worth separating from the query's own yield, because they came from the *declaration* —
from having to write down what each rule reads and establishes, and noticing that two
rules answered one question.

- **B-044** — declaring `maxHeight` twice made it obvious the engine reported only one of
  the two. A multi-unit on a 200 m² plot was cleared to 17.5 m where Clause 3.2.4.1 allows
  15. V-010 said the stricter was applied; `setbacks.ts` computed it and `findings.ts`
  ignored it.
- **B-045** — `produces` says which rule answers which question, and checking whether the
  finding that answers it cites that rule showed **ten of twenty-nine rules never reached a
  finding at all**. A warehouse's FAR verdict was stamped "verified against the gazette"
  with no dispute, when the figure came from a rule of `inferred` confidence carrying
  V-003's challenge.
- **V-052** — two of the six setback tables had no register entry of any kind, so the
  register's own guarantee ("anything absent from this register is unreviewed") had an
  unguarded inverse.

## What is still not detected

**Shape (c) — V-039's shape**, a reading defeated because it would render a neighbouring
provision inoperative. Unchanged from the plan: it has a disposition name,
`defeated-by-consequence`, and no detector. A test asserts that no conflict currently
carries that disposition, so the day one does, it is deliberate.

**Guards have no disjunction.** Where the gazette states a trigger with an "or" — Clause
2.9.3.2's *"more than four floors or 15-metres and more"* — each limb is its own node.
That turned out to be the more faithful modelling rather than a compromise, since the
gazette numbers its limbs separately anyway, but it is a decision and not an accident.

**The query proposes; it does not decide.** 45 of the 54 conflicts have no recorded
disposition, and that is the honest state rather than a gap to be closed by inventing one.

## On authoring bias

A benchmark is only a benchmark if the nodes were written from the clauses and not from
the answer sheet. Two disciplines, both testable:

1. No node names another node, and nothing in `clauses.ts` records that any pair
   disagrees. The dispositions in `conflicts.ts` were written **after** the query ran,
   against what it returned — and a test fails if a disposition names a pair the query
   does not produce, so they cannot drift into being the input.
2. All 55 FAR ceiling nodes are **generated** from the ladders the engine already holds.
   `CROSS_CHAPTER_MAX_FAR_CONFLICTS` — which already holds V-016's six answers as data —
   is deliberately not read by `clauses.ts`, because generating from it would be feeding
   the query its own answer.

The residual risk is in the 32 authored nodes, and it is real: they were written by
someone who had read the log. The defence is that they are written per clause, with the
quote, and a reviewer can check any one of them against the gazette without knowing what
the query does with it.
