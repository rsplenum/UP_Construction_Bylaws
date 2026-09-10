#!/usr/bin/env python3
"""
L0 — turn a chapter PDF into a faithful, greppable, structured extraction.

This is the bottom layer of the architecture in docs/ARCHITECTURE-RESEARCH.md. It does no
interpretation whatsoever: it records what the page contains, and it is regenerable, so
nothing downstream ever has to trust a transcription nobody can re-derive.

It exists because the gazette says things in three different channels and the flattened
docx text only carried one of them:

  1. cell text      - carried by the old pipeline
  2. cell merges    - lost; decided Chapter 16's column B (661 cells affected)
  3. cell FILL      - lost; Clause 15.3 states permitted/prohibited entirely in green and
                      red, so 53 activities x 16 zones read as an empty table (V-008)

So this captures all three, and marks the one thing it cannot capture - a rasterised
table - loudly, rather than emitting silence.

Outputs, per chapter:

  chapter-NN.txt   Readable and greppable. Every page carries its GAZETTE page number, so
                   a citation can say "page 149" - something a planner or an authority
                   reviewer can actually look up. Tables are pipe-delimited, and a cell
                   whose meaning is its colour is annotated inline, e.g. `[GREEN]`.
  chapter-NN.json  The same content structured: pages, tables, cells with text, fill and
                   bbox, plus warnings.

Usage:
    python3 tools/extract-chapter.py docs/source/gazette/pdf/chapter-15.pdf
    python3 tools/extract-chapter.py --all

Requires pymupdf.
"""

import argparse
import collections
import hashlib
import json
import pathlib
import re
import sys

import pymupdf

OUT_DIR = pathlib.Path('docs/source/derived/chapters')
PDF_DIR = pathlib.Path('docs/source/gazette/pdf')

# Colours the gazette uses to carry meaning rather than decoration. Anything filled and
# textless is annotated whatever its colour; these are named because they recur.
NAMED_FILLS = {
    '#00B050': 'GREEN',       # Clause 15.3 legend: Permitted
    '#FF0000': 'RED',         # Clause 15.3 legend: Prohibited
    '#A8D08D': 'LIGHTGREEN',
    '#FFFF00': 'YELLOW',      # highlighter; usually an editing artefact, recorded anyway
}
# Fills that are page furniture. Never annotated inline, always recorded in the JSON.
DECORATIVE = {'#FFFFFF', '#000000', '#7F7F7F', '#D9D9D9', '#E7E6E6', '#F1F1F1'}


def as_hex(colour):
    return '#%02X%02X%02X' % tuple(int(round(c * 255)) for c in colour)


def gazette_page_number(page):
    """The gazette prints its own page number as the first token on the page."""
    words = page.get_text('words')
    if words and re.fullmatch(r'\d{1,3}', words[0][4]):
        return int(words[0][4])
    return None


def cell_fills(page):
    """Filled rectangles that are plausibly table cells, deduplicated."""
    seen, out = set(), []
    for drawing in page.get_drawings():
        fill = drawing.get('fill')
        if not fill:
            continue
        rect = drawing['rect']
        if rect.width < 3 or rect.height < 3 or rect.width > 560 or rect.height > 700:
            continue
        key = (as_hex(fill), *(round(v, 1) for v in (rect.x0, rect.y0, rect.x1, rect.y1)))
        if key in seen:
            continue
        seen.add(key)
        out.append((rect, as_hex(fill)))
    # Smallest first, so an inner cell fill wins over the band behind it.
    out.sort(key=lambda rf: rf[0].get_area())
    return out


def fill_of(bbox, fills):
    """The fill covering a cell: the smallest filled rect containing the cell's centre."""
    if not bbox:
        return None
    cx, cy = (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2
    for rect, colour in fills:
        if rect.x0 <= cx <= rect.x1 and rect.y0 <= cy <= rect.y1:
            if colour in DECORATIVE:
                return None
            return colour
    return None


def annotate(text, colour):
    """Inline colour annotation, but only where the colour is carrying meaning."""
    if not colour:
        return text
    if text and colour not in NAMED_FILLS:
        return text                      # text present, ordinary shading: decoration
    tag = NAMED_FILLS.get(colour, colour)
    return f'{text}[{tag}]' if text else f'[{tag}]'


def band_colour(row):
    """
    A section band - a row filled edge to edge in one colour with almost no text - is
    page furniture, not a rule. Annotating each of its seventeen empty cells buries the
    rows that matter. Detected rather than hardcoded, because each chapter picks its own
    palette: chapter 15 bands are #9BC2E6, chapter 1 uses #FFF2CC.
    """
    blank = [c for c in row if not c['text']]
    if len(blank) < 5 or len(blank) < len(row) - 2:
        return None
    colours = {c.get('fill') for c in blank}
    if len(colours) != 1:
        return None
    colour = colours.pop()
    return None if colour is None or colour in NAMED_FILLS else colour


def extract_page(page, pdf_index):
    fills = cell_fills(page)
    tables, table_bboxes = [], []

    for tno, table in enumerate(page.find_tables().tables):
        table_bboxes.append(pymupdf.Rect(table.bbox))
        rows = []
        for row in table.cells_with_text() if hasattr(table, 'cells_with_text') else []:
            rows.append(row)
        # extract() gives text per cell; row_cells geometry comes from .rows
        data = table.extract()
        geometry = [r.cells for r in table.rows]
        out_rows = []
        for r, cells in enumerate(data):
            out_cells = []
            for c, text in enumerate(cells):
                bbox = geometry[r][c] if r < len(geometry) and c < len(geometry[r]) else None
                colour = fill_of(bbox, fills)
                out_cells.append({
                    'text': (text or '').strip(),
                    **({'fill': colour} if colour else {}),
                    **({'bbox': [round(v, 1) for v in bbox]} if bbox else {}),
                })
            out_rows.append(out_cells)
        tables.append({'index': tno, 'bbox': [round(v, 1) for v in table.bbox], 'rows': out_rows})

    # Prose = words not inside any detected table, in reading order.
    prose_lines = collections.defaultdict(list)
    for x0, y0, x1, y1, word, *_ in page.get_text('words'):
        centre = pymupdf.Point((x0 + x1) / 2, (y0 + y1) / 2)
        if any(b.contains(centre) for b in table_bboxes):
            continue
        prose_lines[round(y0)].append((x0, word))
    prose_ordered = [{'y': y, 'text': ' '.join(w for _, w in sorted(ws))}
                     for y, ws in sorted(prose_lines.items())]
    prose = '\n'.join(l['text'] for l in prose_ordered)

    warnings = []
    rasters = page.get_images()
    if rasters:
        warnings.append(
            f'{len(rasters)} raster image(s) on this page — any rule stated inside them is '
            f'NOT captured here and must be read from the PDF by eye')

    return {
        'pdfPage': pdf_index + 1,
        'gazettePage': gazette_page_number(page),
        'prose': prose,
        # Prose with its vertical position, so a consumer can interleave headings with
        # tables in document order. Clause 3.2.2's FAR matrix needs this: seven sub-tables
        # each restart their Sl. numbering at 1, and only the heading above a table says
        # which section a row belongs to.
        'proseLines': prose_ordered,
        'tables': tables,
        'warnings': warnings,
    }


def render_text(chapter, pages):
    out = []
    for p in pages:
        out.append(f"\n=== chapter {chapter} · gazette page {p['gazettePage']} "
                   f"· pdf page {p['pdfPage']} ===")
        for w in p['warnings']:
            out.append(f'!!! {w}')
        if p['prose']:
            out.append(p['prose'])
        for t in p['tables']:
            rows = t['rows']
            cols = max((len(r) for r in rows), default=0)
            out.append(f"\n--- table {t['index']} ({len(rows)} rows × {cols} cols) ---")
            for row in rows:
                band = band_colour(row)
                cells = [c['text'].replace('\n', ' ') if band
                         else annotate(c['text'].replace('\n', ' '), c.get('fill'))
                         for c in row]
                line = ' | '.join(cells)
                out.append(f'{line}«band {band}»' if band else line)
    return '\n'.join(out).strip() + '\n'


def extract(pdf_path):
    chapter = re.search(r'chapter-(\d+)', pdf_path.stem)
    chapter = chapter.group(1) if chapter else pdf_path.stem
    doc = pymupdf.open(pdf_path)
    pages = [extract_page(page, i) for i, page in enumerate(doc)]

    fill_counts = collections.Counter()
    colour_only = verdict_rows = 0
    for p in pages:
        for t in p['tables']:
            for row in t['rows']:
                semantic = 0
                band = band_colour(row)
                for c in row:
                    colour = c.get('fill')
                    if not colour:
                        continue
                    fill_counts[colour] += 1
                    if colour in NAMED_FILLS:
                        semantic += 1
                        if not c['text']:
                            colour_only += 1
                    elif not c['text'] and not band:
                        colour_only += 1
                if semantic >= 8:
                    verdict_rows += 1   # layout rows, not logical rows - see below

    numbers = [p['gazettePage'] for p in pages if p['gazettePage']]
    payload = {
        'chapter': chapter,
        'source': str(pdf_path),
        'sourceMd5': hashlib.md5(pdf_path.read_bytes()).hexdigest(),
        'gazettePages': [min(numbers), max(numbers)] if numbers else None,
        'pageCount': len(pages),
        'tableCount': sum(len(p['tables']) for p in pages),
        'fillCounts': dict(fill_counts.most_common()),
        'colourOnlyCells': colour_only,
        # Layout rows, not logical rules. Where an activity's name wraps, find_tables()
        # splits it into several rows and each inherits the fill of the cell it sits in.
        # That is faithful - the fill really does span them - so L0 keeps it. Joining
        # them is interpretation, and belongs upstairs: see tools/extract-zoning-matrix.py
        # for the deduplicated logical view of the Clause 15.3 matrix.
        'colourCodedTableRows': verdict_rows,
        'warnings': [f"page {p['gazettePage']}: {w}" for p in pages for w in p['warnings']],
        'pages': pages,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / f'chapter-{chapter}.json').write_text(json.dumps(payload, indent=1))
    (OUT_DIR / f'chapter-{chapter}.txt').write_text(render_text(chapter, pages))

    span = f"p.{payload['gazettePages'][0]}–{payload['gazettePages'][1]}" if numbers else 'p.?'
    note = f'  colour-only cells: {colour_only}' if colour_only else ''
    vr = f'  colour-coded rows: {verdict_rows}' if verdict_rows else ''
    warn = f'  WARNINGS: {len(payload["warnings"])}' if payload['warnings'] else ''
    print(f"chapter {chapter}: {len(pages)} pages ({span}), "
          f"{payload['tableCount']} tables{vr}{note}{warn}", file=sys.stderr)
    return payload


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf', nargs='*', type=pathlib.Path)
    ap.add_argument('--all', action='store_true', help='every chapter PDF in the repo')
    args = ap.parse_args()

    paths = sorted(PDF_DIR.glob('chapter-*.pdf')) if args.all else args.pdf
    if not paths:
        ap.error('give a PDF path, or --all')
    for p in paths:
        extract(p)


if __name__ == '__main__':
    main()
