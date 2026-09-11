# Verifying every chapter

*How the engine gets from "believed" to "read", chapter by chapter, without the accuracy
falling off somewhere in the middle.*

---

## The question this answers

We have the gazette. That removes the excuse for being wrong, and it replaces it with a
harder problem: **14,364 lines, roughly 6,000 numeric tokens, and no way to tell by
looking which of them the engine already has right.**

Chapter 16 is the evidence for how this goes. Reading it took one working session. Three
of its transcriptions turned out fine. Six were wrong, four of them in the direction that
lets someone build what they will later have to demolish. And one rule — whether a
30-metre building may compound a rear setback at all — could not be settled from the
gazette's *text*; it needed the cell borders in the document's XML. That is the actual
shape of this work, and any plan that assumes otherwise will produce something that looks
verified and isn't.

So: **phased, and phased by risk rather than by table of contents.**

---

## Why not all at once

Not because of the volume. Because of what verification actually costs.

Reading a chapter is fast. Reading a chapter *adversarially* — asking of every figure
"what would make this wrong, and what in the document would tell me" — is not, and it is
the only kind that finds anything. Chapter 16's six errors were all in code that had been
read before, by someone reasoning carefully, without the source. Careful reasoning is what
produced them.

Three things degrade when the work is batched:

- **Ambiguities get resolved by convenience.** A blank table cell means "same as the
  column to the left" or it means "not permitted", and those are opposite answers. Under
  time pressure you pick the one that matches the code you already have.
- **Cross-chapter conflicts go unnoticed.** Chapter 16.2's rear-setback allowance refers
  to a "permissible 40%" that is defined in Chapter 3, applies only to semi-detached
  buildings, and is withdrawn on corner plots and stilt floors. You only catch that if
  you are reading Chapter 16 slowly enough to wonder what the 40% is.
- **Nothing records what was checked.** Six months from now, "we verified Chapter 5" is
  worth nothing without a line number.

The phases exist to keep those three things from happening. Within a phase, the work is
as parallel as it wants to be.

---

## The bar

Three levels. A rule is not "verified" until it reaches level 3.

| | Level | What it means | Enforced by |
|---|---|---|---|
| 1 | **Transcribed** | The figure is in the code with a clause reference. | Nothing. This is where most of the engine still sits. |
| 2 | **Cited** | A verbatim quote or table fingerprint is recorded against the source line. | `citations.test.ts` re-checks every quote against `docs/source/gazette-tmpr8.txt` on every run. |
| 3 | **Behaviourally verified** | A test exercises the engine at each band boundary and asserts the gazette's own numbers, quoting the clause in the test. | The test suite. |

Chapter 16 is at level 3: 71 tests, each quoting the clause it checks.

The gate that makes this real is small and already in place. A rule marked
`confidence: 'gazette'` in `src/domain/rules/registry.ts` **must** have a citation, and
that citation must still resolve against the source file. It caught an unbacked claim
within a minute of being written.

---

## Standing rules

These bind every phase. They are what "without compromising accuracy" means in practice.

1. **A rule without a quote has not been checked.** Not "probably right". Not checked.
2. **Consensus is not verification.** Two published sources both said the front setback
   keys off road width. The gazette says plot area. Both were wrong; one had blended in
   another state's rules.
3. **When the text is ambiguous, go to the XML.** Cell borders, merges and grid spans
   survive in `word/document.xml` and they carry meaning the flattened text loses. This
   settled Chapter 16's column B.
4. **When the XML doesn't settle it either, model both readings and apply the stricter
   one** — the one that permits less or charges more — put the alternative in front of the
   user on the finding itself, and log it. Never quietly pick the convenient reading.
   Item 10's quantity is handled this way (V-004b).
5. **Never assert a fact the app cannot know.** Whether the Fire NOC was obtained, whether
   the land is disputed — these decide the answer and they are not in the drawing. Model
   them, collect them in advanced mode, and until then say what has been assumed.
6. **Record the near-misses.** Three of Chapter 16's transcriptions were right. Knowing
   which parts of the engine survived contact with the source is as useful as knowing
   which didn't.

---

## What is actually in the document

Measured, not estimated. Line counts from `docs/source/gazette-tmpr8.txt`; "table rows"
counts flattened cell lines, which is the best available proxy for how much of a chapter
is a rule table rather than prose.

| Ch | Chapter | Lines | Table rows | Numbers | Does the engine assert anything from it? |
|---:|---|---:|---:|---:|---|
| 1 | Short Title and Definitions | 623 | 435 | 150 | Implicitly — every measured quantity |
| 2 | Permission for Land Development and Building Construction | 708 | 298 | 285 | Sanction route, deemed approval |
| 3 | Standards for Land Development and Building Construction | **4,172** | **2,879** | **1,977** | **Almost everything** |
| 4 | Residential Buildings | 471 | 213 | 257 | EWS/LIG, group housing |
| 5 | Commercial Buildings | 831 | 479 | 313 | Six occupancies |
| 6 | Institutional Buildings & Community Facilities | 817 | 472 | 331 | Three occupancies |
| 7 | Industrial and Agricultural Use Buildings | 242 | 121 | 97 | Three occupancies |
| 8 | Mixed-Use and Transit-Oriented Development | 251 | 156 | 110 | One occupancy; TOD not modelled |
| 9 | Additional Floor Area Ratio | 263 | 127 | 131 | **Done — level 3** |
| 10 | Fire Prevention and Life Safety | 57 | 0 | 22 | **Done — level 3** |
| 11 | Structural Safety and Quality Control | 170 | 15 | 138 | Nothing yet |
| 12 | Provisions for differently abled, elderly and children | 92 | 0 | 59 | Nothing yet |
| 13 | Environmental Sustainability | 248 | 74 | 113 | RWH, solar |
| 14 | Qualifications and Competence of Licensed Technical Persons | 172 | 57 | 110 | LTP sanction route |
| 15 | Zoning Regulations | **1,820** | **1,223** | 491 | Permissibility, impact fee |
| 16 | Compounding of Building Construction and Development | 417 | 265 | 179 | **Done — level 3** |
| 17 | Provision of Electric Charging Infrastructure | 354 | 126 | 168 | Nothing yet |
| 18 | In-Building Solutions for Common Telecom Infrastructure | 124 | 21 | 105 | Nothing yet |
| — | Appendices 1–15 | 2,387 | 1,237 | 952 | Forms and schedules |

Two observations that shape the plan.

**Chapter 3 is not one chapter.** At 4,172 lines it is larger than chapters 4 through 14
combined. Inside it sits the FAR matrix — lines 2306 to roughly 3718, about forty
occupancy rows each split into built-up and non-built-up — which is the single largest
rule table in the byelaws and the thing V-003 and half of V-005 are open on.

**Chapters 10, 11 and 12 are short because they delegate.** Fire and accessibility
mostly incorporate the National Building Code by reference. That is itself a finding: the
binding numbers are in a document we do not have, and the engine must say so rather than
invent them.

---

## After the phases

`docs/RULE-GRAPH-PLAN.md` holds the agreed next piece of work: declaring `produces` /
`consumes` on every rule, deriving the edge graph from them, and running a build-time query
that finds the places where two clauses answer one question differently. It is deliberately
sequenced after the chapter reading — the query is only as good as the corpus it runs over,
and every chapter read adds nodes to it.

## The phases

Ordered by how badly a wrong answer hurts, not by chapter number.

### Phase 0 — the harness *(done)*

Before reading anything else, build the machinery that makes verification cheap, and
repeatable, and hard to fake.

- ✅ `docs/source/gazette-tmpr8.txt` — the flattened source, checked in, so every claim
  points at a line somebody else can open.
- ✅ `src/domain/rules/citations.ts` — prose and table-fingerprint citations, generated
  from the source by line number rather than typed, so a quote cannot be mistyped into
  agreement with the code.
- ✅ `src/domain/rules/__tests__/citations.test.ts` — re-checks every citation on every
  run, and refuses `confidence: 'gazette'` without one.
- ✅ `docs/VERIFICATION-LOG.md` — one entry per claim, closed only against the source.
- ✅ A table extractor that reads `word/document.xml` with border and merge metadata, for
  the cases the flattened text cannot settle.

The last one matters more than it looks. Chapter 16's hardest question was answered by
`tcBorders` and nothing else.

### Phase 1 — what the numbers mean, and where the building sits

*Chapter 1 (definitions that bind measurement) + Chapter 3 (envelope and bulk).*

Chapter 1 comes first because it decides what everything downstream is measuring. If
"building height", "built-up area", "plot area" or "setback" are defined in ways the
engine does not implement, every figure it produces is wrong in a way no amount of
checking Chapter 3 will reveal. Only the definitions that bind a measured quantity are in
scope — perhaps thirty of the several hundred.

Chapter 3 then splits by table, not by page:

1. **Setback tables** — plotted residential, group housing, commercial, institutional,
   industrial, and the >15 m ladder. *Partly done: plotted residential and the high-rise
   ladder are at level 3.* Outstanding: Note-1's 40% rear allowance, Note-2's alternative
   stepped-setback path, and the corner-plot distinction between new and approved layouts.
2. **The FAR matrix** (lines ~2306–3718) — forty-odd rows, each split built-up /
   non-built-up. *Partly done: plotted residential, group housing 2(a)/2(b), and shops
   3(a)/3(b).* This is where V-003 closes, and where most of V-005's minimum road widths
   come from — a mall's row starts at 18 m, which *is* the minimum road width for a mall.
3. **FAR exemptions** (line ~3719) — what counts toward FAR and what does not. Nothing in
   the engine implements this today, and it changes every FAR figure it prints.
4. **Ground coverage, plot sizes, room dimensions, staircases, lifts, courtyards** —
   Chapter 3's "Requirements of Parts of Building", 60-odd pages the engine currently
   ignores entirely, and which Chapter 16 Items 5–8 charge against.

Phase 1 is the largest single body of work in the plan, and it is the one that decides
whether the app is right about the question people actually ask it.

### Phase 2 — which occupancy, and what it needs

*Chapters 4–8.*

Per-occupancy overrides: EWS/LIG obligations, affordable-housing standards, hotel and
mall specifics, petrol pump and LPG godown separation distances, hospital and school
requirements, farmhouse and dairy rules, mixed-use predominance criteria, TOD.

This is where V-005 closes. Chapter 3's FAR matrix supplies the road widths and ceilings;
these chapters supply everything else the sixteen occupancy definitions currently guess at.

### Phase 3 — the gates

*Chapters 15 (zoning), 2 (procedure), 9 (additional FAR).*

Chapter 15 answers the *first* question the app asks — may this use go here at all — and
at 1,820 lines with 1,223 table rows it is the second-largest chapter. It also carries the
impact-fee determination, which the app lost when the zoning explorer was retired and has
not replaced.

Chapter 2 governs the sanction route and the deemed-approval clocks. Chapter 9 governs
purchasable and premium purchasable FAR and the green-building incentive — partly verified
already, since B-001 and B-004 came out of it.

### Phase 4 — the hard blockers

*Chapters 10 (done), 11, 12, 13.*

Small in lines, disproportionate in effect: each of these makes a project
**non-compoundable** under Clause 16.1.3. A building that needed a Fire NOC and did not
get one cannot be regularised at any price, and the app currently has no way to know that.
Phase 4 is where V-006 closes — the thirteen bars are modelled but nothing collects them.

Expect much of this phase to end in "the byelaws defer to the NBC here", which is a
legitimate and useful answer as long as it is recorded rather than filled in.

**Chapter 10 bore that prediction out, and also disproved the assumption underneath it.**
It delegates its numbers to the NBC and the UP Fire and Emergency Services Rules 2024
exactly as expected, and V-033 records the one place the engine had filled a delegated
number in for itself. But it was not a cheap chapter: 57 lines with no tables produced
three bugs and six open items, because the *trigger* for the one clearance that can end a
project is stated four times in the gazette, in four different forms, and nothing
reconciles them (V-034). Half of bar (vii) at 16.1.3 now computes — whether a fire
clearance is mandatory is a fact about the drawing, even though whether it was obtained is
not.

The lesson for chapters 11 and 12, which look equally thin: line count predicts reading
time, not defect count. What predicts defect count is how many places the same rule is
stated.

### Phase 5 — the long tail

*Chapters 14, 17, 18, and the appendices.*

Who may sign a drawing; EV charging provision; telecom ducting; and the fifteen appendix
forms, which matter for the output side of the app rather than the assessment.

---

## Sequencing, honestly

The measured rate from Chapter 16 is about **400 lines of rule-bearing text per working
session** at level 3 — read adversarially, corrected, cited, tested, logged. Roughly 9,000
of the gazette's 14,364 lines are rule-bearing at that density.

That is around twenty sessions. There is no version of this that is both faster and still
true, and the fastest way to make it take longer is to do a shallow pass first.

Two things do compress it, and both are already in place. The citation harness means each
figure is checked once and stays checked. And the phases are ordered so that the app gets
materially more correct early: Phase 1 alone covers most of what a person actually asks.

## What "done" looks like for a phase

- Every figure it touches carries a citation that resolves against the source.
- Every band boundary has a test asserting the gazette's own number.
- Every rule it touches is `confidence: 'gazette'` or has a `challenge` saying why not.
- `docs/VERIFICATION-LOG.md` has an entry per claim, including the ones that came back
  correct.
- Anything the gazette leaves genuinely ambiguous is modelled both ways, resolved to the
  stricter reading, and shown to the user on the finding itself.
