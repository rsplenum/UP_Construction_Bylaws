#!/usr/bin/env python3
"""
Extract every BFAR / PFAR / PPFAR / MFAR table from the chapter extractions.

Why this table matters more than its size suggests
--------------------------------------------------
Chapter 3's FAR matrix gives a base FAR and a maximum FAR, and the engine derives what a
project may buy as the gap between them — one lump. This table splits that gap the way the
byelaws actually price it:

    MFAR  =  BFAR  +  PFAR  +  PPFAR
             base     purchasable   premium purchasable

Those two are different entitlements bought on different terms (Chapter 9), so collapsing
them loses the distinction the fee schedule turns on.

Layout
------
Fourteen columns, and only the header row says which is which. There is ONE BFAR column
shared by every road band, then four road bands each with their own PFAR, PPFAR and MFAR:

    x=69   label
    x=168  BFAR                     (shared)
    x=195  x=222  x=249             PFAR PPFAR MFAR   Up to 12 m
    x=275  x=302  x=329             PFAR PPFAR MFAR   >12 – 24 m
    x=355  x=382  x=409             PFAR PPFAR MFAR   >24 – 45 m
    x=435  x=462  x=490             PFAR PPFAR MFAR   >45 m

Each data row wraps across two physical rows, so cells are matched to columns by their x
coordinate rather than by position — the same technique the zoning matrix needs.

The identity MFAR = BFAR + PFAR + PPFAR is checked on every row, which is what makes the
column mapping verifiable rather than merely plausible.

Usage:
    python3 tools/extract-commercial-far.py > docs/source/derived/commercial-far.json
"""

import glob
import json
import re
import sys

CHAPTERS = sorted(glob.glob('docs/source/derived/chapters/chapter-*.json'))

DEFAULT_ROAD_BANDS = ['Up to 12m', '>12 – 24m', '>24 – 45m', '>45m']
ROAD_BANDS = DEFAULT_ROAD_BANDS       # kept for the summary; each table reads its own
TOLERANCE = 0.06          # the gazette rounds 3.55 to 3.6 in two cells


def value(text):
    t = (text or '').strip()
    if not t:
        return None
    if t.upper() == 'UR':
        return 'unrestricted'
    if t.upper() == 'NA':
        return 'not available'
    try:
        return float(t)
    except ValueError:
        return t


AREA_LABELS = {'built-uparea': 'built_up', 'non-built-uparea': 'non_built_up'}

# "Road Width (>=18 -24m)" -> ">=18 -24m". Bands are read from each table's own header
# rather than assumed: clause 4.4's affordable-housing table bands on 18 m, not 12 m.
ROAD_HEADER = re.compile(r'^Road\s*Width\s*\(?\s*(.*)$', re.I)
# "2.00 (<18m)" -> 2.00, qualified by "<18m"
QUALIFIED = re.compile(r'^([\d.]+)\s*\((.+)\)$')
FAR_NAMES = ('BFAR', 'PFAR', 'PPFAR', 'MFAR')


def area_from_label(label):
    flat = re.sub(r'\s+', '', label or '').lower()
    if 'non-built-uparea' in flat:
        return 'non_built_up'
    if 'built-uparea' in flat:
        return 'built_up'
    return None


def positioned(table):
    """Every non-empty cell as (x, text). Layout here is geometry, not row order."""
    for row in table['rows']:
        for c in row:
            t = c['text'].replace('\n', ' ').strip()
            if t and c.get('bbox'):
                yield round(c['bbox'][0]), t


def far_columns_of(table):
    """
    The FAR columns, gathered from the whole table rather than from one header row.

    Clause 4.4's table prints BFAR on its own line and PFAR/PPFAR/MFAR on the next, so
    reading a single row finds one column out of thirteen — and produced a table that
    parsed to nothing without complaining.
    """
    seen = {}
    for x, text in positioned(table):
        if text in FAR_NAMES:
            seen[x] = text
    return [(x, seen[x]) for x in sorted(seen)]


def road_bands(table, far_columns):
    """
    One band label per PFAR/PPFAR/MFAR group, anchored to the x of the group's PFAR
    column rather than sorted left to right.

    Sorting broke on two tables: clause 5.1's header wraps ">45m" onto an earlier line,
    which rotated the sequence, and clause 4.4 bands on 18 m rather than 12 m. Anchoring
    works because the gazette prints each "Road Width (...)" heading directly above the
    group it labels. Where the heading itself wraps — "Road Width (>24 -" then "45m)" —
    the label comes out truncated, which costs nothing: order and count are what matter.
    """
    group_x = [x for x, n in far_columns if n == 'PFAR']
    labels = {}
    for x, text in positioned(table):
        m = ROAD_HEADER.match(text)
        if not m or not group_x:
            continue
        anchor = min(group_x, key=lambda gx: abs(gx - x))
        if abs(anchor - x) <= 8:
            labels[anchor] = m.group(1).strip().rstrip(')').strip()

    # A heading that wraps — "Road Width (>24 -" then "45m)" — leaves a dangling label.
    # Its continuation is the next cell at the same x, so pull it in.
    for anchor, label in list(labels.items()):
        if not label.endswith('-'):
            continue
        tail = next((t for x, t in positioned(table)
                     if abs(x - anchor) <= 8 and re.fullmatch(r'[\d.]+\s*m?\)?', t)), None)
        if tail:
            labels[anchor] = f'{label} {tail.rstrip(")")}'.strip()

    return [labels.get(gx) or (DEFAULT_ROAD_BANDS[i] if i < len(DEFAULT_ROAD_BANDS)
                               else f'band {i + 1}')
            for i, gx in enumerate(group_x)]


def extract_table(table, chapter, gazette_page):
    """One BFAR/PFAR/PPFAR/MFAR table. Columns are matched by x, never by position."""
    far_columns = far_columns_of(table)
    if not far_columns:
        return [], [f'chapter {chapter} p.{gazette_page}: no FAR columns found']

    # The label column is the leftmost x anywhere in the table, not something derived from
    # a header row: several of these tables print their FAR names with no cell in the
    # label column at all.
    label_x = min(x for x, _ in positioned(table))

    names = [n for _, n in far_columns]
    expected = ['BFAR'] + ['PFAR', 'PPFAR', 'MFAR'] * ((len(names) - 1) // 3)
    if not names or names != expected:
        return [], [f'chapter {chapter} p.{gazette_page}: unexpected header {names}']

    bands = road_bands(table, far_columns)
    if len(bands) != max(1, (len(far_columns) - 1) // 3):
        return [], [f'chapter {chapter} p.{gazette_page}: read {len(bands)} road bands '
                    f'for {len(far_columns) - 1} FAR columns']

    def band_of(index):
        return bands[min((index - 1) // 3, len(bands) - 1)]

    rows, area_type, current, pending = [], None, None, ''
    for row in table['rows']:
        cells = [(round(c['bbox'][0]), c['text'].replace('\n', ' ').strip())
                 for c in row if c['text'].strip() and c.get('bbox')]
        if not cells:
            continue
        label = next((t for x, t in cells if abs(x - label_x) <= 6), None)
        values = [(x, t) for x, t in cells if abs(x - label_x) > 6]

        # Some tables carry no area band row and state it in the use type instead.
        inline_area = area_from_label(label)
        if inline_area:
            area_type = inline_area

        if label and not values:
            # An area-type heading can wrap over two rows: "Non-Built-up" then "Area".
            joined = re.sub(r'\s+', '', pending + label).lower()
            if joined in AREA_LABELS:
                area_type, current, pending = AREA_LABELS[joined], None, ''
                continue
            if re.sub(r'\s+', '', label).lower() in ('non-built-up', 'built-up'):
                pending = label
                continue
            pending = ''
            if area_type is None or label in ('FAR', 'Commercial Buildings'):
                continue
        else:
            pending = ''

        if area_type is None:
            continue
        if label:
            current = {'chapter': chapter, 'gazettePage': gazette_page,
                       'useType': label, 'areaType': area_type, 'values': {}}
            rows.append(current)
        if current is None:
            continue

        for x, text in values:
            match = min(far_columns, key=lambda c: abs(c[0] - x))
            if abs(match[0] - x) > 6:
                continue
            index = far_columns.index(match)
            key = 'BFAR' if index == 0 else f'{band_of(index)}|{match[1]}'
            q = QUALIFIED.match(text)
            if q and index == 0:
                # "2.00 (<18m)" — a base FAR that applies only on part of the road range.
                current['values'][key] = float(q.group(1))
                current['baseFarQualifier'] = q.group(2)
            else:
                current['values'][key] = value(text)

    for r in rows:
        r['roadBands'] = bands
    return rows, []


BOUND = re.compile(r'(\d+(?:\.\d+)?)')


def qualifier_covers(qualifier, band):
    """
    Does a base FAR qualified as "<18m" or ">=18m" apply to this band?

    Clause 4.4 prints TWO base FARs for the same use — 2.00 below an 18 m road and 2.25
    at or above it — against one shared set of band columns. Summing the wrong pair makes
    the identity fail, which is how this was noticed rather than assumed.
    """
    q = re.sub(r'\s+', '', qualifier or '')
    b = re.sub(r'\s+', '', band or '')
    qn, bn = BOUND.search(q), BOUND.search(b)
    if not qn or not bn:
        return True
    threshold, lower = float(qn.group(1)), float(bn.group(1))
    if q.startswith('<'):
        return lower < threshold
    if q.startswith(('≥', '>=', '>')):
        return lower >= threshold
    return True


def check(rows):
    """MFAR = BFAR + PFAR + PPFAR. This is what proves the column mapping."""
    out = []
    for r in rows:
        base = r['values'].get('BFAR')
        for band in r.get('roadBands', ROAD_BANDS):
            p = r['values'].get(f'{band}|PFAR')
            pp = r['values'].get(f'{band}|PPFAR')
            m = r['values'].get(f'{band}|MFAR')
            if not isinstance(base, float) or m is None:
                continue
            qualifier = r.get('baseFarQualifier')
            if qualifier and not qualifier_covers(qualifier, band):
                out.append({'chapter': r['chapter'], 'gazettePage': r['gazettePage'],
                            'useType': r['useType'], 'areaType': r['areaType'],
                            'band': band, 'holds': True, 'baseFarQualifier': qualifier,
                            'working': f'base FAR {base} applies only {qualifier}; '
                                       f'this band is covered by the other base FAR row'})
                continue
            add = sum(v for v in (p, pp) if isinstance(v, float))
            if isinstance(m, str):
                ok, note = (isinstance(p, str) or isinstance(pp, str)), 'unrestricted'
            else:
                ok = abs(base + add - m) <= TOLERANCE
                note = f'{base} + {add} = {round(base + add, 3)} vs MFAR {m}'
            out.append({'chapter': r['chapter'], 'gazettePage': r['gazettePage'],
                        'useType': r['useType'], 'areaType': r['areaType'],
                        'band': band, 'holds': ok, 'working': note,
                        **({'baseFarQualifier': r['baseFarQualifier']}
                           if r.get('baseFarQualifier') else {})})
    return out


def main():
    all_rows, warnings, tables = [], [], 0
    for path in CHAPTERS:
        doc = json.load(open(path))
        for page in doc['pages']:
            for table in page['tables']:
                if not any(c['text'].strip() == 'PPFAR' for r in table['rows'] for c in r):
                    continue
                tables += 1
                rows, warn = extract_table(table, doc['chapter'], page['gazettePage'])
                if not rows and not warn:
                    # Silent loss is the failure mode that costs most. A table that
                    # matched the PPFAR signature and yielded nothing is always a bug.
                    warn = [f"chapter {doc['chapter']} p.{page['gazettePage']}: "
                            f'matched a purchasable-FAR table but produced no rows']
                all_rows += rows
                warnings += warn

    checks = check(all_rows)
    failed = [c for c in checks if not c['holds']]
    rounded = [c for c in checks if c['holds'] and 'vs MFAR' in c['working']
               and c['working'].split(' = ')[1].split(' vs ')[0] != c['working'].rsplit(' ', 1)[1]]

    print(f'{tables} tables · {len(all_rows)} rows · {len(checks)} band checks · '
          f'{len(failed)} FAILED · {len(rounded)} rounded · {len(warnings)} warnings',
          file=sys.stderr)
    for c in failed + rounded:
        tag = 'FAILS  ' if not c['holds'] else 'rounded'
        print(f"   {tag} ch{c['chapter']} p.{c['gazettePage']} {c['areaType']} "
              f"{c['useType']} {c['band']}: {c['working']}", file=sys.stderr)
    for w in warnings:
        print(f'   WARNING {w}', file=sys.stderr)

    json.dump({'identity': 'MFAR = BFAR + PFAR + PPFAR',
               'roadBands': ROAD_BANDS, 'tableCount': tables,
               'checks': checks, 'warnings': warnings, 'rows': all_rows},
              sys.stdout, indent=1)
    print()


if __name__ == '__main__':
    main()
