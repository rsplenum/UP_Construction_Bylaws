# Source

Everything the engine claims has to be traceable to something in here. A rule without a
source line has not been checked.

```
docs/source/
├─ gazette/
│  ├─ UP-Building-Byelaws-2025-TMPR8.docx   the original, as supplied
│  ├─ pdf/chapter-NN.pdf                    per-chapter PDFs
│  └─ CHECKSUMS.txt                         md5 of every original
├─ gazette-tmpr8.txt                        flattened text of the docx
└─ derived/                                 machine-extracted, regenerable
   └─ zoning-matrix.json
```

## The originals

`gazette/` holds the files exactly as supplied, unmodified, checked in so that no future
session has to ask for them again and no claim ever rests on a file only one person has.
Verify them before trusting anything derived from them:

```bash
cd docs/source/gazette && md5sum -c CHECKSUMS.txt
```

**Provenance, stated plainly.** The Word file is labelled *"4/9/25 Version TMPR8"*, from
the Housing & Urban Planning Department, Government of Uttar Pradesh. TMPR8 reads as a
revision marker rather than a gazette notification number, and the file carries no
notification number or date of publication. Everything verified so far is verified against
*this* document. If it differs from the notified byelaws, the verification differs with
it. Treat that as an open question, not a settled one.

## Why both formats

They are not redundant. Each holds something the other loses.

| | `.docx` | chapter `.pdf` |
|---|---|---|
| Cell merges | `tcBorders` nil top/bottom — **661 cells**, and this is what settled Chapter 16's column B | rendered, visually confirmable |
| Page numbers | none at all — no `lastRenderedPageBreak` anywhere | every page, matching the gazette's own numbering |
| Chapter 15 permissibility | ~half is a pasted raster; shaded cells give **280** verdicts, with columns broken by merges | fully vector: **847** verdicts, 52 of 53 rows aligned across all 16 zones |
| Text quality | clean, structured | good, positioned |

The deeper reason for keeping both is that they are **two independent extraction paths**.
Where they agree, confidence is high. Where they disagree, one of the pipelines has a bug
and we want to know. That is not hypothetical: the single-path docx pipeline silently
dropped the entire Chapter 15 permissibility matrix, and nothing noticed until the colours
were looked for directly.

## The flattened text

`gazette-tmpr8.txt` is the docx converted to lines, with table cells separated by `|`.
`src/domain/rules/citations.ts` cites it by line number and
`src/domain/rules/__tests__/citations.test.ts` re-checks every quote against it on every
test run.

```bash
grep -n "Building Setbacks" docs/source/gazette-tmpr8.txt
sed -n '4426,4500p' docs/source/gazette-tmpr8.txt
```

**Its known blind spot: it carries text only.** Anything the gazette says with a colour,
a merge or a border is gone. Clause 15.3 says *permitted* and *prohibited* entirely in
green and red, so in the flattened text that table reads as empty. Never conclude a cell
is blank from this file alone.

## Derived data

`derived/` is machine-extracted and regenerable — never hand-edit it. Each file names the
tool that produces it.

```bash
python3 tools/extract-zoning-matrix.py docs/source/gazette/pdf/chapter-15.pdf \
  > docs/source/derived/zoning-matrix.json
```

## When you verify a rule

Record it in `docs/VERIFICATION-LOG.md`, set the rule's `confidence` to `gazette` in
`src/domain/rules/registry.ts`, and add a citation in `src/domain/rules/citations.ts`.
The test suite will not let a rule claim the gazette without one.
