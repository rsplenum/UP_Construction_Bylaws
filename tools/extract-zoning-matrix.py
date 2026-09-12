#!/usr/bin/env python3
"""
Recover the Chapter 15 permissibility matrix from the chapter PDF.

Why this exists
---------------
Clause 15.3, "Permissibility of various activities in major land use zones", answers the
first question this app asks: may this use go on this plot at all. It is a matrix of
activities against the sixteen standard land-use zones, and **its answers are colours,
not text** — the legend on gazette page 149 reads:

    green  -> Permitted
    digit  -> Permitted with conditions   (the digit is a footnote reference)
    red    -> Prohibited

Flattening the .docx to text loses every one of them, and roughly half the matrix is a
pasted raster image in the .docx, so the cell shading cannot be read there either. In the
chapter PDF the whole matrix is vector: the fills are real drawing operations and the
condition digits are real text, both with coordinates.

So this pairs geometry with geometry — a filled rectangle's centre against the x of its
column header, and against the y band of its row — and reconstructs the table.

Usage
-----
    python3 tools/extract-zoning-matrix.py docs/source/gazette/pdf/chapter-15.pdf \
        > docs/source/derived/zoning-matrix.json

Requires pymupdf.
"""

import collections
import json
import pathlib
import re
import sys

import pymupdf

# The sixteen standard notations, in the order the header prints them (Clause 15.3.1).
ZONES = ['BU', 'R', 'MU', 'C-1', 'C-2', 'SI', 'LI', 'OB', 'PSP',
         'TT', 'F', 'RC', 'GB', 'RA', 'A', 'HF']

DOMAIN_JSON = 'src/domain/data/zoning-matrix.json'

FILL_MEANING = {'#00B050': 'permitted', '#FF0000': 'prohibited'}

ACTIVITY_CODE = re.compile(r'^\d{1,2}(\.\d{1,2})?(\([a-z]\))?$')
CONDITION_REF = re.compile(r'^\d{1,2}[a-z]?$')

# Column x-positions of the two leftmost columns, in PDF points. The activity code sits
# left of CODE_X; the activity name runs from there to LABEL_X, where the road-width
# column begins.
CODE_X, LABEL_X = 75, 245


def as_hex(colour):
    return '#%02X%02X%02X' % tuple(int(round(c * 255)) for c in colour)


def column_centres(words):
    """Locate the matrix header row and return {zone: x-centre}, or None if absent."""
    by_line = collections.defaultdict(list)
    for x0, y0, x1, _y1, word, *_ in words:
        by_line[round(y0)].append((x0, x1, word))

    for y, line in by_line.items():
        tokens = {w for _, _, w in line}
        if not {'BU', 'PSP', 'HF'} <= tokens:
            continue
        centres = {}
        for zone in ZONES:
            hit = [(x0 + x1) / 2 for x0, x1, w in line if w == zone]
            if hit:
                centres[zone] = hit[0]
        if len(centres) == len(ZONES):
            return y, centres
    return None


def coloured_cells(page, header_y):
    """Deduplicated verdict rectangles below the header. Cells are drawn more than once."""
    seen, cells = set(), []
    for drawing in page.get_drawings():
        fill = drawing.get('fill')
        if not fill or as_hex(fill) not in FILL_MEANING:
            continue
        rect = drawing['rect']
        if rect.y0 < header_y:
            continue
        if not (6 <= rect.width <= 40 and 5 <= rect.height <= 60):
            continue
        key = tuple(round(v, 1) for v in (rect.x0, rect.y0, rect.x1, rect.y1))
        if key in seen:
            continue
        seen.add(key)
        cells.append((rect, FILL_MEANING[as_hex(fill)]))
    return cells


def group_into_rows(cells):
    """Cluster cells into rows by vertical overlap. Rows vary in height as names wrap."""
    rows = []
    for rect, verdict in sorted(cells, key=lambda c: (c[0].y0, c[0].x0)):
        for row in rows:
            if rect.y0 < row['y1'] - 2 and rect.y1 > row['y0'] + 2:
                row['y0'] = min(row['y0'], rect.y0)
                row['y1'] = max(row['y1'], rect.y1)
                row['cells'].append((rect, verdict))
                break
        else:
            rows.append({'y0': rect.y0, 'y1': rect.y1, 'cells': [(rect, verdict)]})
    return rows


def extract_page(page):
    words = page.get_text('words')
    if not words:
        return []
    header = column_centres(words)
    if not header:
        return []
    header_y, centres = header

    rows = group_into_rows(coloured_cells(page, header_y))
    if not rows:
        return []

    # Words whose vertical centre falls inside a row band belong to that row. Testing the
    # centre rather than any overlap keeps the repeated table header, and the tail of the
    # row above, out of the row's own label.
    gazette_page = int(words[0][4]) if words[0][4].isdigit() else None
    first_row_top = min(r['y0'] for r in rows)

    out = []
    for row in rows:
        mid = (row['y0'] + row['y1']) / 2
        in_band = [w for w in words
                   if row['y0'] <= (w[1] + w[3]) / 2 <= row['y1'] and w[3] > first_row_top - 2]

        codes = [(abs((w[1] + w[3]) / 2 - mid), w[4]) for w in in_band
                 if w[0] < CODE_X and ACTIVITY_CODE.match(w[4])]
        label = ' '.join(w[4] for w in sorted(in_band, key=lambda w: (round(w[1]), w[0]))
                         if CODE_X <= w[0] < LABEL_X)

        verdicts = {}
        for rect, verdict in row['cells']:
            centre_x = (rect.x0 + rect.x1) / 2
            zone = min(centres, key=lambda z: abs(centres[z] - centre_x))
            if abs(centres[zone] - centre_x) > 12:
                continue
            note = next((w[4] for w in in_band
                         if rect.x0 - 1 <= (w[0] + w[2]) / 2 <= rect.x1 + 1
                         and CONDITION_REF.match(w[4])), None)
            entry = {'verdict': 'conditional' if note and verdict == 'permitted' else verdict}
            if note:
                entry['condition'] = note
            verdicts[zone] = entry

        if codes and len(verdicts) >= 8:
            out.append({
                'gazettePage': gazette_page,
                'activity': min(codes)[1],
                'label': label.strip()[:160],
                'zones': verdicts,
            })
    return out


def main(path):
    doc = pymupdf.open(path)
    rows = [row for page in doc for row in extract_page(page)]

    complete = sum(1 for r in rows if len(r['zones']) == len(ZONES))
    print(f'{len(rows)} activity rows, {sum(len(r["zones"]) for r in rows)} verdicts, '
          f'{complete} rows complete across all {len(ZONES)} zones', file=sys.stderr)

    duplicates = [c for c, n in collections.Counter(r['activity'] for r in rows).items() if n > 1]
    if duplicates:
        print(f'WARNING duplicate activity codes (row alignment suspect): {duplicates}',
              file=sys.stderr)

    payload = {'source': path, 'zones': ZONES, 'clause': '15.3', 'rows': rows}
    json.dump(payload, sys.stdout, indent=1)
    print()

    # The engine reads from src/domain/data, the same arrangement purchasable-far.json
    # uses: one generated file, no transcription step, and nothing for a typo to enter.
    pathlib.Path(DOMAIN_JSON).parent.mkdir(parents=True, exist_ok=True)
    with open(DOMAIN_JSON, 'w', encoding='utf-8') as fh:
        json.dump(payload, fh, indent=1)
        fh.write('\n')
    print(f'wrote {DOMAIN_JSON} ({len(rows)} activity rows)', file=sys.stderr)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'docs/source/gazette/pdf/chapter-15.pdf')
