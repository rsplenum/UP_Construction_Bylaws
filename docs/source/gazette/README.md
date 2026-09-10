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
| 15 | 138–156 | 19 | 31 | Zoning. **States permitted/prohibited in colour** — see V-008 |

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
