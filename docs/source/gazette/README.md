# Originals — do not edit

Files exactly as supplied. Nothing in here is generated, and nothing in here should ever
be modified: the whole verification chain assumes these bytes are the ones that were read.

    md5sum -c CHECKSUMS.txt

## What is here

| File | |
|---|---|
| `UP-Building-Byelaws-2025-TMPR8.docx` | The complete byelaws, as supplied 2026-09-10 |
| `pdf/chapter-15.pdf` | Chapter 15, Zoning Regulations — gazette pages 138–156 |

Per-chapter PDFs land in `pdf/` as `chapter-NN.pdf`, numbered by chapter, not by page.

## Adding a chapter PDF

```bash
cp <file> docs/source/gazette/pdf/chapter-03.pdf
cd docs/source/gazette && md5sum pdf/chapter-03.pdf >> CHECKSUMS.txt
```

Then check what the docx lost for that chapter before reading it — colour-coded cells,
merged cells and rasterised tables are all invisible in the flattened text:

```bash
python3 - <<'EOF'
import pymupdf, collections
d = pymupdf.open('docs/source/gazette/pdf/chapter-03.pdf')
fills = collections.Counter()
for p in d:
    for dr in p.get_drawings():
        if dr.get('fill'):
            fills['#%02X%02X%02X' % tuple(int(round(c*255)) for c in dr['fill'])] += 1
print('pages', d.page_count, '| rasters', sum(len(p.get_images()) for p in d))
print(fills.most_common(12))
EOF
```

Saturated green (`#00B050`) or red (`#FF0000`) means that chapter states some rule as a
colour, and the flattened text does not have it.
