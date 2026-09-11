# Originals — do not edit

Files exactly as supplied. Nothing in here is generated, and nothing in here should ever
be modified: the whole verification chain assumes these bytes are the ones that were read.

    md5sum -c CHECKSUMS.txt

## What is here

| File | |
|---|---|
| `UP-Building-Byelaws-2025-TMPR8.docx` | The complete byelaws, as supplied 2026-09-10 |
| `pdf/chapter-NN.pdf` | One PDF per chapter, numbered by **chapter**, not by page |

### Chapters held so far

| Ch | Gazette pages | Pages | Tables | Notes |
|---:|---|---:|---:|---|
| 01 | 7–18 | 12 | 11 | Definitions |
| 02 | 19–36 | 18 | 10 | Permission for development and construction |
| 03 | 37–75 | 39 | 52 | Standards for land development. The FAR matrix — 161 band rows across 63 occupancies |
| 04 | 76–83 | 8 | 8 | Residential. EWS/LIG, group housing, affordable housing |
| 05 | 84–93 | 10 | 12 | Commercial. Bazaar street, units, malls, hotels, cinemas |
| 06 | 94–100 | 7 | 11 | Institutional. Healthcare, education, assembly |
| 07 | 100–103 | 4 | 5 | Industrial and agricultural. Farmhouses and dairy farms — see V-022 |
| 08 | 104–107 | 4 | 6 | Mixed use and TOD. **Standards keyed on LOCATION, and FAR as a multiplier** — see V-024 and V-026 |
| 09 | 108–112 | 5 | 4 | Additional FAR. Compensatory, purchasable and premium purchasable, green-building incentive. **The master FAR ladder's maximum column is mislabelled** — see V-029 |
| 10 | 113–115 | 3 | 0 | Fire prevention and life safety. Three pages, no tables, and **it states the certificate trigger four times in four different forms**. See B-029, B-030 and V-033 to V-037 |
| 11 | 116–122 | 7 | 1 | Structural safety and quality control. Mostly delegates to NBC 2016 and 23 Indian Standards; its own thresholds are 12 m / 3 floors for seismic design, 50 m for peer review — see B-032 and V-038 |
| 12 | 123–126 | 4 | 0 | Differently abled, elderly and children. **The only mandatory-measure chapter with no height, floor or area threshold** — use alone decides it. See B-033, B-034 and V-041 |
| 13 | 127–133 | 7 | 9 | Environmental sustainability. Rainwater harvesting, solar, waste, trees — and **seven tables of conditions keyed on built-up area**, where the SEIAA Environment Clearance lives. See B-035 to B-037 and V-042 to V-045 |
| 14 | 134–137 | 4 | 3 | Licensed technical persons — who may sign. **Three 19-column tables whose merged spans the text pipeline lost**; recovered from cell geometry. See B-038, B-039, V-046 and V-047 |
| 15 | 138–156 | 19 | 31 | Zoning. **States permitted/prohibited in colour** — see V-008 |
| 16 | 157–163 | 7 | 5 | Compounding. Read from the flattened docx in an earlier pass; the PDF confirmed every figure and corrected **91 clause numbers**. See B-040, B-041, V-048 |
| 17 | 164–174 | 11 | 6 | EV charging. Three clauses bind a building permit; the other eight pages reproduce the MoP 2018 Guidelines. See B-042, V-049, V-050 |
| 18 | 175–180 | 6 | 2 | Common Telecom Infrastructure. **An IBS NOC from the TERM cell that gates the occupancy certificate** — and which the applicant must apply for themselves. See B-043, V-051 |

Chapters 7 and 8 share gazette page 100: Chapter 7 opens on it, and the last table of
Chapter 6 finishes on it.

## Adding a chapter PDF

Two commands. Never hand-edit anything under `docs/source/derived/`.

```bash
cp <file> docs/source/gazette/pdf/chapter-03.pdf
./tools/extract-all.sh
```

`extract-all.sh` regenerates every extraction and rewrites `CHECKSUMS.txt`, so the derived
files and the originals cannot drift apart. `src/domain/rules/__tests__/sources.test.ts`
fails if they do — each extraction records the md5 of the PDF it came from, and the test
re-checks it on every run. A stale extraction is otherwise indistinguishable from a fresh
one, and would quietly become a second, wrong source of truth.

## What to look at first in a new chapter

The extractor prints a one-line summary per chapter. Two figures matter:

- **`colour-coded rows`** — the chapter states some rule as a colour. Chapter 15 does this
  for the whole permissibility matrix, and the flattened docx text lost every one of them
  (V-008). Read `chapter-NN.txt`, where such cells render as `[GREEN]` / `[RED]`.
- **`WARNINGS`** — rasterised content. No extractor can read a picture of a table. Anything
  listed has to be read from the PDF by eye and transcribed by hand.
