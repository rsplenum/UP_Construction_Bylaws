# The rule graph, and the conflict query

**Status: agreed, not started. Resume here after the chapter reading is finished.**

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
