# UP Building Byelaws 2025 Portal

A decision-support tool for the **Uttar Pradesh Building Construction and Development
Byelaws 2025**. It computes FAR, setbacks, parking, fees and compounding for a proposed
building, checks the result against the byelaws, and shows the arithmetic behind every
verdict.

> **This is not an official tool.** It is not issued or endorsed by any Development
> Authority, and its output carries no statutory force. The figures encoded here must be
> verified against the gazette before they are relied on for a submission. See
> [Statutory status](#statutory-status).

## What it does

You describe a plot and what you want to build on it. It tells you whether you can, what
stops you, what it costs, and what to change — on one screen.

```
  Your site          The site plan            What the byelaws say
  ─────────          ─────────────            ────────────────────
  What are you   →   plot drawn to scale  →   ✗ 5 blocking
  building?          setbacks shaded          ⚠ 3 to settle
  How big?           buildable area           ✓ 7 clear
  Which road?
  How much           605 m² permitted         each one expands to the
  floor area?        450 m² drawn             rule, the arithmetic,
  How tall?                                   and a one-click fix
```

**Simple** mode asks five questions in plain words. **Advanced** mode adds the fields a
drawing needs — plot shape, each setback, provisions, circle rate. Both write to the same
project and run the same engine, so switching never loses work and never changes the
answer, only how much of it you are shown.

Behind the workspace sits a **Reference** shelf: the byelaws text, the master-plan map,
the planning rationale, the statutory forms, and an assistant. These are supporting
material you open when a finding raises a question — not places you have to visit to
assemble an answer yourself.

### Why it is shaped this way

The first version had nine tabs named after chapters of the byelaws — a zoning matrix, a
FAR calculator, a fee calculator, a chapter reader. Each rendered part of the rulebook
and left you to carry numbers between them. The zoning tab drew a 13-activity × 10-zone
grid when the app already knew your project was a single-unit house on a 12 m road; the
FAR tab computed what was permissible and never mentioned what you had proposed.

Nine screens each showing a table is the easy version. One screen that answers the
question is the hard one, and it is the one worth building.

## Running it

```bash
bun install          # or: npm install
bun run dev          # http://localhost:3000
```

| Script | Does |
| --- | --- |
| `dev` | Express + Vite middleware, with HMR |
| `build` | Builds the client to `dist/` and bundles the server to `dist/server.cjs` |
| `start` | Runs the production server (set `NODE_ENV=production`) |
| `test` | Runs the rules-engine test suite |
| `typecheck` | `tsc --noEmit` |
| `lint` | Typecheck plus tests |

### Configuration

Copy `.env.example` to `.env`. Every variable is optional — the portal is fully
functional without any of them, except that the AI Copilot falls back to an offline
message.

| Variable | Effect |
| --- | --- |
| `GEMINI_API_KEY` | Enables the AI Copilot. Without it, `/api/chat` returns a message pointing at the offline tools. |
| `GEMINI_MODEL` | Overrides the model id. |
| `PORT` | Server port (default 3000). |

## How it is put together

```
src/
  domain/          The rules engine — the single source of truth
    occupancy.ts   The 16 occupancies, and which rules each one keys off
    bands.ts       Contiguous band lookup, asserted at module load
    far.ts         Telescopic and road-width FAR ladders
    setbacks.ts    Plotted, group housing, commercial, healthcare,
                   educational, industrial and high-rise ladders
    compounding.ts Chapter 16 fee schedule and non-compoundable exclusions
    findings.ts    assessProject() — every rule, applied to one project
    project.ts     The shared project model
  workspace/       The application
    Workspace.tsx  The three panels
    SitePanel.tsx  What you have (simple and advanced)
    SitePlan.tsx   The drawing
    VerdictPanel.tsx  What the byelaws say about it
  context/         ProjectContext, ThemeContext, ToastContext
  components/      The reference views, plus ui/ primitives
  data/            Byelaw text, tables and the GIS dataset
server.ts          Express: static hosting plus the /api/chat proxy
```

### One assessment, many findings

`assessProject(project)` returns every finding the byelaws produce for a site. Each one
carries what the rule requires, what the project proposes, the arithmetic, the clause, and
where possible the change that would resolve it. The interface renders findings; it does
not compute. Adding a rule means adding a finding, and it appears everywhere at once —
the panel, the report, and the tests.

### The rules engine is the point

Every statutory figure lives in `src/domain`. Screens do not compute FAR or setbacks
themselves — they call `resolveBaseFar`, `resolveRequiredSetbacks` and
`assessCompounding`. This exists because the same plot used to produce different answers
on different tabs: a 2000 sqm plot resolved to a Base FAR of 1.485, 1.363 or 1.262
depending on which screen you were standing on.

Two invariants keep it that way:

- **Ladders are contiguous.** Every band is a half-open interval
  `overMoreThan < value <= upToAndIncluding`, and `assertContiguousLadder` throws at
  module load if a table develops a hole. The tables previously used `min: 15.01` /
  `max: 15.0` bounds, so a 15.005 m building matched no row and a
  `find(...) || table[table.length - 1]` fallback silently applied the >51 m rule.
- **The engine is tested.** `src/domain/__tests__` covers the band boundaries, ladder
  monotonicity, the purchasable-FAR road threshold, the corner-plot rule, the
  non-compoundable exclusions and the Chapter 16 ceilings — and asserts that every
  occupancy produces a finished answer, that no finding ever renders `NaN`, and that
  applying a finding's own fix actually clears it.
- **The rules are declared, not only executed.** `src/domain/rules` holds a register of
  every rule the engine applies — its question, clause, confidence, and what it reads and
  establishes — plus one node per assertion the gazette makes. Edges between rules are
  derived from those declarations rather than authored, the graph is asserted acyclic, and
  `findings.ts` is checked to evaluate in an order the graph permits. A build-time query
  over the same data enumerates every place the byelaws answer one question two ways; it
  re-finds all eleven conflicts people had found by reading, and found seven bugs they had
  not. A second query reports where it has *not* looked — a fact two rules answer with
  nothing written down to compare — which is what turned up two setback tables the gazette
  prints and the engine had never held. See `docs/RULE-GRAPH-PLAN.md`.

If a figure here disagrees with the gazette, fix it in `src/domain` — one edit changes
every screen, the PDF exports and the tests together.

## Statutory status

The byelaw figures in this repository were transcribed from the published byelaws and
have **not been independently verified against the gazette**. Treat the ladders in
`src/domain/far.ts`, `src/domain/setbacks.ts` and `src/domain/compounding.ts` as the
places to check and correct.

The tool deliberately does not overstate what it knows:

- Reports are labelled pre-scrutiny output, not certificates, and carry a reference
  derived from the inputs rather than a random number resembling an Authority file number.
- Statutory forms start empty. The portal never invents an applicant, an architect or a
  council registration number.
- Geocoding results come from OpenStreetMap Nominatim and are labelled as such.
- The AMSL figure is a regional interpolation across the Gangetic plain, not surveyed
  elevation, and is labelled as an estimate wherever it appears.
- Spatial buffer distances are measured to sampled points, not to river or corridor
  geometry, so a Ganga 200 m determination needs the authoritative layer.

## Privacy

Project data stays in the browser's `localStorage`. Nothing is uploaded. The single
exception is the AI Copilot: a question you send, plus a summary of the loaded project,
goes to the configured model provider through `/api/chat`. The copilot is optional and
the portal is fully usable with it disabled.

## Accessibility

The portal is checked with axe-core against WCAG 2.1 A/AA plus best-practice rules, across
every tab and the sub-views that are only reachable by clicking, in both light and dark
themes. It currently reports **zero violations** in both.

What that rests on, and what to preserve when editing:

- Every form control resolves an accessible name — `htmlFor`/`id` where a visible label
  exists, `aria-label` where the layout supplies the context visually.
- Colour tokens are paired. A light text token without a `dark:` counterpart will fail in
  one theme or the other; `text-slate-500` is deliberately not used as a body token
  because it measures 4.3:1 on grey chips.
- Translucent light panels (`bg-slate-50/50` and similar) need a `dark:` counterpart, or
  they composite to a mid-grey over the dark ground and take the text down with them.
- Headings step by one. The page-level `h1` is rendered in `App.tsx` from the active tab.
- `:focus-visible` opts out of transitions, because `outline-width` is animatable and
  several controls carry `transition-all`.

Re-check after any visual change; the source alone will not tell you what a colour
resolves to once Tailwind's `oklch()` values and opacity modifiers composite.

## Contributing

- `bun run lint` must pass (typecheck plus tests).
- Statutory figures belong in `src/domain`, with a test and a clause reference.
- New tabs are lazily loaded in `src/App.tsx` and declared in `src/navigation.ts`.
- Keep every surface working in both light and dark themes.
