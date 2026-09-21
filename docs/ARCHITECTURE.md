# How this app is put together

*Four stages. Everything in `src/` is one of them.*

```
   1. DATA              2. INPUTS           3. PROCESSING        4. PRESENTATION
   the gazette,         what we ask         solvers that         one answer,
   as typed tables      a person            read 1 against 2     drawn and cited
   ───────────────      ─────────────       ──────────────       ────────────────
   docs/source/…        plot state          studyEnvelope()      PlotStudy.tsx
   domain/far.ts        domain/units.ts     comparePlots()       PlanDrawing.tsx
   domain/setbacks.ts   ui/NumberField      assessProject()      PlotCompare.tsx
```

No model runs at any stage. Every figure is arithmetic over a typed table, and every
table traces to `docs/source/gazette/`.

---

## 1. The gazette, as structured data

The PDFs are in `docs/source/gazette/`. `docs/source/derived/chapters/*.json` holds each
chapter's text and tables, extracted once. From there the figures are hand-typed into
`src/domain/` as exported constants, with the clause quoted in the comment above them.

**A gazette table and the function that reads it live in the same file, deliberately.**
`far.ts` holds `RESIDENTIAL_TELESCOPIC_SLABS`, `COMMERCIAL_MAX_FAR` and seven more tables
*and* `resolveBaseFar()` which reads them. Splitting data from logic would double the file
count and separate every figure from the rule that uses it — the opposite of simpler. So
stages 1 and 3 are co-located by module, and the boundary is inside the file: exported
`CONST_TABLES` are stage 1, exported `functions` are stage 3.

The statutory tables, by module:

| module | tables | what it holds |
|---|---|---|
| `compounding.ts` | 23 | Chapter 16's schedule of compounding fees |
| `sustainability.ts` | 20 | rainwater, solar, waste, green cover |
| `licensing.ts` | 18 | who may sign which drawing |
| `setbacks.ts` | 12 | the front/rear/side ladders, per occupancy |
| `impact-fee.ts`, `permission.ts`, `telecom.ts`, `structural.ts`, `fire.ts` | 10–11 each | Chapter 15, Clause 2.1.2, Chapter 13, Chapter 11, Chapter 10 |
| `far.ts`, `ev-charging.ts`, `mixed-use.ts` | 8–9 each | FAR ladders, EV charging, Chapter 8 |
| the rest | 1–5 each | occupancy, roads, zoning, coverage, thresholds |

**The rule is that a figure the engine inferred is never presented as one the gazette
states.** Where the gazette admits two readings, both are modelled, the stricter applied,
the alternative surfaced in a caveat, and the whole thing logged in
`docs/VERIFICATION-LOG.md`. That log is the record of what has been checked and what is
still open — read it before trusting a number, and update it when you settle one.

## 2. What we ask a person

Deliberately short, and it shrank again in September 2026. The plot screen asks: what are
you building, the two sides of the plot, the road on each side, how tall you want it, and
where it sits. **Plot area is not asked** — it is width × length. Holding it as a third
independent number let the three disagree, and the form spent a year warning readers about
a contradiction it had created itself.

- `domain/units.ts` — gaj, biswa, square feet, metres, and why the bigha is not a unit here
- `components/ui/NumberField.tsx` — the one numeric input, which lets people actually type
- `domain/inputs.ts` — the field registry the **workspace** path uses (not the plot path)
- the plot screen's own `useState` — the plot path's inputs live in the component

Anything the byelaws fix is an answer, not a question. Floor area, setbacks, the approval
route and the total height are all derived. The one height figure the gazette does *not*
fix — floor-to-floor, where it sets only a 2.75 m minimum room height — is askable, and
says so.

## 3. Processing

```
resolvePlotRoads()        which edge is the front (Clause 3.2.4.9 Note-1)
   └─ studyEnvelope()     solves every floor count, returns two plans + a ladder
        ├─ resolveBaseFar()            the entitlement
        ├─ resolveRequiredSetbacks()   the offsets, per band
        ├─ resolveGroundCoverage()     the footprint the offsets leave
        └─ resolveCompoundableMargin() Chapter 16's band, and what it forgives
   └─ pricePlans()        what buying density and compounding would cost
   └─ assessSanctionRoute()  which approval route, and on what conditions
```

`studyAtFloors(study, n)` re-derives the whole study at a chosen floor count, so the
drawings, the fees and the margin all follow one choice without any of them special-casing
it.

**There are two paths over the same tables**, and this is the one real duplication:

- **`studyEnvelope()`** — "what fits on my plot". Answers from the ground up. This is the
  landing screen and the one under active work.
- **`assessProject()`** in `findings.ts` — "check this building I have designed". Takes a
  proposed floor area and height and reports findings against every chapter. Feeds
  `#/workspace`.

They share `setbacks.ts`, `far.ts`, `occupancy.ts` and the rest. They are not two rule
sets — they are two questions over one rule set.

## 4. Presentation

One answer, in a serif, at the top. Then the evidence. Then the inputs.

- `plot/PlotStudy.tsx` — the landing screen
- `plot/PlanDrawing.tsx` — the site plan, including Chapter 16's amber band
- `plot/PlotCompare.tsx` — two plots, before either is bought
- `plot/ScopeFooter.tsx` — which authorities this covers, and the Hindi terms
- `components/ui/Clause.tsx` — every citation, styled as evidence and not as small print
- `workspace/` — the second path's screen

The layout rule is in `CLAUDE.md`: progressive disclosure, with two things it does not
license — nothing that changes the verdict may be folded away, and a citation is never
small print and must be the clause that actually governs.

---

## What else is in here

**`domain/rules/`** — a verification harness, not a user path. `citations.ts`,
`clauses.ts`, `conflicts.ts`, `graph.ts` and `coverage.ts` are reachable only from tests,
by design: they cross-check the engine's figures against the extracted chapters and have
found real bugs. Unreachable from `main.tsx` is the correct state for them.

**The reference shelf** — `components/ByelawsNavigator`, `MapServerExplorer`,
`FormsAndAppendices`, `AiAssistant`, `OfficialPdfViewer`, `StatutoryRationaleGuide`, and
the GIS data in `src/data/`. Supporting material behind the "Reference" menu, roughly
11,500 lines. It is not on the four-stage path, and the GIS explorer in particular is
known not to work reliably — its tile hosts fall through three providers and then say so.

## The size of it

| | lines | on the four-stage path? |
|---|---|---|
| plot screens and everything they pull in | 14,406 | **yes — this is the product** |
| used only by the workspace path | 7,358 | second question, same tables |
| used only by the reference shelf | 11,515 | no |
| tests | 6,773 | — |

Measured from the import graph, not estimated. If you change the shape of the app, re-run
the measurement rather than trusting this table.

## Where to start

Reading order for the core: `domain/roads.ts` → `domain/setbacks.ts` → `domain/far.ts` →
`domain/envelope.ts` → `plot/PlotStudy.tsx`. That is the whole pipeline, five files, and
everything else is either a chapter of the gazette bolted onto the same shape or a screen
that reads the result.
