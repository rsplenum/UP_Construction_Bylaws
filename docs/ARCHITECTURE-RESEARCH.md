# How other people have solved this

*Research into automated code compliance, and what it means for this project.*

---

## The finding that reframes everything

This problem has a name — **Automated Code Compliance checking (ACC)** — and about thirty
years of literature. Singapore's CORENET started in 1995 and put automated plan checking
into production in 2002. The EU ran a Horizon project on it (ACCORD) that finished
recently. There are systematic reviews of the systematic reviews.

We are not solving a new problem. We are solving a well-documented one badly, from
scratch, and the field has already found the traps.

The single most useful thing in the literature is not a technology. It is the repeated,
unanimous finding about **where the difficulty actually is**:

> The main bottleneck in BIM-based automatic code-compliance checking is the automated
> conversion of human-readable rules into machine-readable formats. […] Existing
> representations cannot represent "unknowns" and "side-effects", lack the ability to
> deal with ambiguous rules, and are typically restricted by the rule engine and/or
> target data model.

That is a precise description of the two things that cost us most in Chapter 16 — the
blank column-B cell that the text could not settle, and Item 10's ambiguous quantity.
The field's verdict is that these are not edge cases to be tidied away. **Ambiguity and
unknown-ness have to be representable, or the model lies.** Our engine currently
represents them in prose comments and a `dispute` string. That is not enough.

---

## What the field has that we don't

### 1. RASE — a decomposition for normative text

Hjelseth & Nisbet's **RASE** methodology marks up every clause of a regulation with four
operators:

| | Operator | What it captures |
|---|---|---|
| **R** | Requirement | The constraint itself — the number, the comparison |
| **A** | Applicability | When this rule is in play at all |
| **S** | Selection | Which subject or quantity it constrains |
| **E** | Exception | What takes it out of play |

It is the basis of SMARTcodes (ICC + AEC3) and it is still the reference point in 2026
reviews.

**It maps onto the UP byelaws almost exactly**, and it explains three of our six Chapter
16 bugs in one sentence. The compoundable-limits table's two column headers —
*"All Buildings <=15-meter and multi-units upto 17.5 meter height except Group Housing"* —
are **applicability**. The cells are **requirement**. The Notes are **exception**.

B-009, B-010 and B-011 were all the same error: **the requirement was transcribed and its
applicability was not.** `COMPOUNDABLE_SETBACK_LIMITS.rear = 1.0` recorded a number and
threw away the four conditions attached to it. In RASE you cannot write the number
without the conditions, because they are separate mandatory fields.

That is a structural fix for our single most common failure mode, and it costs nothing
but discipline.

### 2. Defeasible logic — the formalism for exceptions

Governatori's work on **defeasible deontic logic** gives formal semantics for exactly the
shape the byelaws are written in: *A holds **unless** B applies, **unless** C overrides B.*
Three rule types — strict, defeasible, and defeaters — plus a **priority relation** saying
which wins.

Chapter 3.2.4.1 Note-1 is a textbook instance: *"Construction shall be permitted on 40
percent of the rear setback up to 7 meter height, **in semi-detached buildings**. **But in
corner plots** the said covering shall be permissible only after leaving the side setback.
**In case of stilt floor**, construction on 40 percent area of the rear setback shall not
be allowed."* One rule, one applicability restriction, two defeaters.

Standard boolean logic expresses that as a tangle of nested conditions that nobody can
review. Defeasible logic expresses it as four separate records with a priority ordering —
which is reviewable, and which survives a later session adding a fifth.

### 3. Catala — default logic as a first-class language feature

**Catala** (INRIA) is a DSL for law, built with law professionals, in production at the
French tax authority (DGFiP) and family benefits agency (CNAF). Its central insight:

> Catala is the only programming language to our knowledge that embeds **default logic**
> as a first-class feature […] allowing lawyers to express the general case / exceptions
> pattern naturally.

It is also **literate**: the legal text and the code sit interleaved, so a domain expert
reviews the rule against the words it came from, on the same page.

We should not adopt Catala — see the decisions below — but the two ideas are free to
steal, and both are things our codebase currently lacks.

### 4. OpenFisca — the "JSON matrix" idea, done properly and at national scale

**OpenFisca** models legislation as a **date-versioned parameter tree** (YAML, one file
per parameter, path-addressed like `tax_on_salary.public_sector.rate`), plus formulas that
carry their legislative references, plus **YAML test cases** as the primary test format.
It handles legislation changing over time as a first-class concern, not a migration.

This is a direct vindication of the JSON idea, and a ready-made answer to *"one file or
many?"* — many, path-addressed, one per parameter, each carrying its own validity dates.

### 5. DMN — decision tables that non-programmers can author

OMG's **Decision Model and Notation** gives a standard for decision tables with an
explicit **hit policy** (what happens when several rows match) and **FEEL**, an expression
language deliberately designed to be readable by subject-matter experts rather than
developers. It is used for regulatory work specifically because it produces a clear audit
trail.

Roughly half our source is tabular. DMN's decision-table semantics — especially the hit
policy, which is precisely the "which row wins when two apply" question — are worth
importing even if the DMN toolchain is not.

### 6. s(CASP) / Blawx — explanation as an output, not an afterthought

**Blawx** wraps goal-directed answer set programming (s(CASP)) in a visual editor for
"Rules as Code" work. The property worth stealing:

> s(CASP) can explain its conclusions, returns not just a good answer but **all** good
> answers, and returns everything that it believes to be relevant with regard to each
> good answer. […] providing explanations linked back to the relevant sections of the law.

Our engine returns findings with a `working` string assembled by hand at each call site.
That is a hand-rolled, lossy version of a derivation trace. The engine should **produce**
the derivation, and the UI should render it.

---

## The warning that decides the architecture

A 2026 benchmark, *Confidently Wrong: Exception Chain Collapse in Frontier LLM Rule
Evaluation*, tested frontier models on nested conditional rules — *"A is required UNLESS B
applies, UNLESS C overrides B"* — across 225 scenarios in four regulatory domains. Three
of four frontier configurations failed the adversarial coverage-gap case. It also found
that measured accuracy **shifted silently under the same model alias with no version
bump**, and concluded that for regulated workflows, frontier-model accuracy is *"a moving
compliance boundary that moves without notice."*

Two things follow, and they are not comfortable.

**First: this is a measured description of how I failed on Chapter 16.** B-009, B-010 and
B-011 were all exception-chain errors — a rule whose conditions I collapsed. Not
arithmetic slips. The exact failure mode the benchmark isolates.

**Second: it names the fix.** The paper's own architecture is neuro-symbolic — the LLM
**authors** rules from authoritative sources; a **deterministic symbolic layer executes**
them. The model is used where it is strong (reading dense text, proposing structure) and
kept away from where it is weak (evaluating chained conditions at runtime).

That is the architecture. Not because it is fashionable, but because the specific thing we
are building has a documented failure mode and this is the documented mitigation.

---

## The lesson from the one system that shipped

CORENET e-PlanCheck is still the only nationally operational ACC system. Its rule library,
**FORNAX**, is the most-cited cautionary tale in the field:

> Since FORNAX is a black-box implementation maintained by a private company, the
> individual steps of the checking process are not visible, so there is limited way for
> users to alter it, and extensions and modifications have to be carried out by the
> original provider.

And on adoption generally, across the literature: there has been **no meaningful uptake**
of automated compliance checking despite mature technology, and industry's stated
condition for accepting it is that **human oversight be maintained**.

For a tool whose users are plot owners, architects, LTPs and authority reviewers, this
settles the product question. The app must be an **advisor that shows its work**, never an
oracle that returns a verdict. Every number traceable to a clause; every clause traceable
to a line; every conclusion traceable to a derivation. We were already heading there. The
literature says it is not optional — it is the adoption condition.

---

## Decisions

### What we adopt as concepts

| Concept | From | Why |
|---|---|---|
| **RASE decomposition** — every rule carries applicability, selection, requirement, exception as separate mandatory fields | Hjelseth & Nisbet / SMARTcodes | Structurally prevents our commonest bug: a number transcribed without its conditions |
| **Defeasible rules + explicit priority** | Governatori | The Notes-override-Tables pattern is the byelaws' native shape |
| **Default logic / general case + exceptions** | Catala | Same, expressed so a reviewer sees the general rule and its defeaters side by side |
| **Literate rules** — gazette quote adjacent to the rule | Catala | A planner reviews the rule against the words, on one screen |
| **Date-versioned parameter tree, path-addressed, one file per parameter** | OpenFisca | Amendments become data, not migrations |
| **Test cases as data** | OpenFisca | A planner can add a test case; nobody outside this repo can add a `describe()` block |
| **Decision tables with an explicit hit policy** | DMN | Half the source is tabular, and "which row wins" is a real question we currently answer implicitly |
| **Derivation as engine output** | s(CASP) / Blawx | Replaces hand-assembled `working` strings with something the engine actually produces |
| **Three-valued results** — satisfied / violated / **undetermined**, with undetermined split into *missing input* and *source ambiguous* | The ACC reviews' central complaint | This is the gap the field says every existing representation has. We have it too |
| **Neuro-symbolic split** — LLM authors, deterministic engine executes | *Confidently Wrong*, 2026 | Documented mitigation for a failure mode we have already exhibited |

### What we do NOT adopt as technology, and why

| | Verdict | Reason |
|---|---|---|
| **Catala** | No | Intellectually the right answer, but OCaml/Python backends, a compiler toolchain, and a language perhaps a few dozen people can read. We ship a browser app maintained by one person. Steal the ideas, not the compiler |
| **OpenFisca** | No | Python and server-side. Tax-shaped: strong on time-varying scalars, weak on geometry and on "which table applies" |
| **Drools / full DMN engine** | No | JVM. We would be shipping a rules platform to solve eighteen chapters |
| **s(CASP) / ASP / Prolog** | No | Deployment cost in a browser is out of proportion. Our rule count is in the hundreds, not the millions |
| **json-rules-engine / JSON Logic** | No | Right shape, wrong semantics — no applicability/exception distinction, no priority relation, no derivation output, no provenance. We would spend more time fighting it than writing ours |
| **LLM at runtime** | **Never** | The benchmark above. The model authors rules offline, under review. It does not evaluate them at request time |
| **buildingSMART IDS / IFC** | Not now — design toward it | IDS v1.0 (June 2024) is the standard for machine-checkable requirements against a BIM model. The day we accept a real drawing instead of typed numbers, this is the interface. Keep the rule layer geometry-agnostic so that door stays open |

**The engine is ours.** Roughly 500 lines of deterministic evaluator over our own rule
format. That is smaller than the integration cost of any option above, and it is the only
way to get exactly the three-valued, provenance-carrying, derivation-producing behaviour
the research says matters and no off-the-shelf engine provides.

### One dataset worth knowing about

**CODE-ACCORD** — 862 annotated sentences from the building regulations of England and
Finland, 4,297 entities and 4,329 relations, openly published on HuggingFace by the EU
ACCORD project. Different jurisdiction, so not directly usable, but it is a worked example
of *what to annotate* in a building-regulation sentence. Worth reading before finalising
our clause schema.

---

## The architecture

Four layers. Each one is checkable on its own, and each has exactly one job.

```
L0  SOURCE          gazette text + 206 tables extracted from word/document.xml
                    with merge and span metadata preserved
                    → immutable, regenerable, checked in
                         │
                    (authoring: LLM reads, human reviews)
                         ▼
L1  RULES           path-addressed JSON, one file per rule or table
                    RASE-shaped · defeasible priorities · provenance
                    · validity dates · status incl. AMBIGUOUS
                         │
                    (compiled: generated TypeScript types)
                         ▼
L2  ENGINE          ~500 lines. Deterministic. No LLM.
                    Three-valued. Emits a derivation, not just a verdict
                         │
                         ▼
L3  FINDINGS/UI     renders the derivation in plain language
                    (exists already)
```

**L0 is the fix for something we are losing right now.** 661 cells in the docx carry a
nil top or bottom border — Word's marker for a vertically merged cell, and the thing that
settled Chapter 16's column B. The flattened text renders every one of them as blank. We
have been discarding that signal 661 times.

**L1 is the answer to "should we make JSON first?"** — yes, but RASE-shaped rather than a
flat matrix, because half the document is prose and a matrix cannot hold a conditional.

**L2 is small on purpose.** Every argument above for not adopting a platform is also an
argument for the engine staying small enough to read in one sitting.

### Three cross-cutting mechanisms

- **Citation gate** — every L1 node's quote re-checked against L0 on every run. *(Built.)*
- **Golden fixtures** — full assessment output snapshotted for ~25 projects, so a change in
  session 14 cannot silently alter a session-5 answer. *(Not built. Highest priority.)*
- **Cross-reference graph** — 197 explicit cross-chapter references harvested from the
  source, plus a declared produces/consumes graph for the implicit links the text does not
  name. *(Extractor prototyped.)*

---

## What this changes about the plan

1. **L0 first, as a script.** 206 tables → JSON grids with merge metadata. Hours, not
   sessions, and it recovers the 661 cells we are currently throwing away.
2. **Design the L1 schema against the three hardest clauses we already know**, not against
   a blank page: Chapter 16.2's merged column, Chapter 3.2.4.1 Note-1's two defeaters, and
   Chapter 16.3.8 Item 3's dual fee basis. A schema that holds those three holds most of
   the document.
3. **Port Chapter 16 to L1 first.** It is the one chapter we have read properly, so it is
   the only honest test of whether the schema is expressive enough. If RASE + defeasible
   priority cannot express what we already know Chapter 16 says, the schema is wrong and we
   find out in week one rather than month six.
4. **Golden fixtures before the next chapter.** They are the only mechanism that catches a
   cross-chapter regression nobody anticipated.
5. **Then Chapter 3**, with the citation gate, the fixtures and the graph all live.

The reading estimate does not change — roughly twenty sessions of interpretation. What
changes is that the output is reviewable by a planner, survives an amendment, and cannot
silently lose a rule's conditions.

---

## Sources

- Hjelseth & Nisbet — RASE methodology; see *Rule capture of automated compliance checking
  of building requirements: a review* and *Towards fully-automated code compliance checking
  of building regulations: challenges for rule interpretation and representation*
- Governatori — *Defeasible Logic for Normative Reasoning* (ICAIL tutorial); *Automating
  Defeasible Reasoning in Law*
- Merigoux et al. — *Catala: A Programming Language for the Law*, PACMPL 2021; Inria/DGFiP
  deployment notes; Lawsky, *Coding the Code: Catala and Computationally Accessible Tax Law*
- OpenFisca — *From law to code*, *Legislation parameters*, *Legislation evolutions*,
  *Writing YAML tests*
- OMG — Decision Model and Notation, FEEL
- Morris — *Blawx: User-friendly Goal-Directed Answer Set Programming for Rules as Code*,
  ProLaLa 2023
- *Confidently Wrong: Exception Chain Collapse in Frontier LLM Rule Evaluation*,
  arXiv:2607.23386
- Hjelseth et al. / Eastman et al. lineage — *CORENET e-PlanCheck: Singapore's Automated
  Code Checking System*; *Automated compliance checking using building information models*
- *CODE-ACCORD: A Corpus of building regulatory data for rule generation towards automatic
  compliance checking*, arXiv:2403.02231 / Scientific Data
- buildingSMART — *Information Delivery Specification (IDS)* v1.0
- *A systematic review of methods for interpreting building code regulations in automated
  compliance systems*, Building Research & Information, 2026
- *Framework for automated building code compliance checking to improve transparency,
  trust, validation, and design interpretation*, Automation in Construction, 2025
