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

| Tab | Purpose |
| --- | --- |
| **Compliance Audit** | Cross-rule verdict on the whole project: sanction route, FAR, setbacks, height vs. road width, fire NOC, parking and EVCI, sustainability mandates, EWS/LIG. Exports a PDF pre-scrutiny report. |
| **FAR & Fees** | Telescopic FAR, purchasable and premium FAR charges, parking ECS with EV load, and a Chapter 16 compounding assessment. |
| **2D Setbacks** | Scaled site plan with the buildable envelope, multi-road frontage handling, and deviation analysis. Exports a dimensioned blueprint. |
| **Spatial GIS** | Master plan layers for the 22 Development Authorities, statutory buffers, distance and area measurement, and a point-level spatial audit. |
| **Byelaws Code** | All 18 chapters with definitions, schedules, NOC timelines, FAR exemptions and setback tables. |
| **Zoning Matrix** | Activity permissibility across the standard use zones, with the statutory condition on each ruling. |
| **Planning Rationale** | Why each threshold exists, traced to NBC and IS codes. |
| **Statutory Forms** | Appendices 2–14, filled from the project. |
| **AI Copilot** | Questions about any rule, grounded in the byelaws and in the loaded project. Optional. |

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
  domain/          The statutory rules engine — the single source of truth
    bands.ts       Contiguous band lookup, with a load-time contiguity assertion
    far.ts         Telescopic and road-width FAR ladders
    setbacks.ts    Plotted, commercial and progressive high-rise setback ladders
    compounding.ts Chapter 16 fee schedule and non-compoundable exclusions
    project.ts     The shared project model
  context/         ProjectContext (one site, shared by every tab), ThemeContext, ToastContext
  components/      One component per tab, plus ui/ primitives
  data/            Byelaw text, tables and the GIS dataset
  utils/           PDF generation, the constraint engine, storage adapters
server.ts          Express: static hosting plus the /api/chat proxy
```

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
- **The engine is tested.** `src/domain/__tests__` covers the band boundaries, the
  ladder monotonicity, the purchasable-FAR road threshold, the corner-plot rule, the
  non-compoundable exclusions and the Chapter 16 ceilings.

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
