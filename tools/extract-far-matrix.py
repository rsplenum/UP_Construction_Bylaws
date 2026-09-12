#!/usr/bin/env python3
"""
Extract the ground-coverage and FAR matrix from Chapter 3 (Clauses 3.2.2.1 to 3.2.2.7).

This is the table V-003 is open on: roughly forty occupancy rows, each split into
"(Built up)" and "(Non-Built up)", each giving a base FAR and a maximum FAR per road-width
or plot-area band. The engine currently applies the *shops* ladder to ten other
occupancies by analogy, because nothing better had been transcribed.

It also answers much of V-005 as a by-product. An occupancy's first band IS its minimum
road width: a commercial complex starts at ">=12 - 24m" and a shopping mall at
">=18 - 24m", so a mall needs an 18 m road. That was previously reasoned about; here it
is read.

Two layout traps, both of which corrupt the result silently if missed.

**The Sl. numbering restarts.** This is not one table. It is seven, under clause headings
3.2.2.1 to 3.2.2.7, and each restarts at 1 - and clause 3.2.2.7 "Other Uses" restarts
again internally for farmhouses, industry, recreation, parking and open spaces. Keying a
row on its Sl. alone merges the plotted-residential ladder with non-bedded medical
establishments, industrial buildings and open spaces, all of which are numbered "1". The
key here is (clause, subTable, sl), with subTable incremented whenever the numbering goes
backwards.

**Only the heading above a table says which clause it belongs to**, and a single page can
carry three headings and three tables. So headings and tables are interleaved by their
vertical position on the page, which is why L0 records prose with its y coordinate.

**Column count varies** - six, seven or twelve - because of merged headers. Dropping empty
cells makes every row regular:

    [Sl.] [Use Type] [Ground Coverage] [band] [Base FAR] [Max FAR]      a new occupancy
                                       [band] [Base FAR] [Max FAR]      another of its bands

so Sl., use type and ground coverage carry forward down the continuation rows.

Usage:
    python3 tools/extract-far-matrix.py > docs/source/derived/far-matrix.json
"""

import json
import re
import sys

CHAPTER_JSON = 'docs/source/derived/chapters/chapter-03.json'

CLAUSE = re.compile(r'^(3\.2\.2\.\d)\s+(.*)')

HEADER_WORDS = {'sl.', 'use types', 'ground coverage (%)', 'base far', 'max. far',
                'road width (m)', 'plot area (sq.m.)', 'road width', 'ground', 'coverage (%)',
                'far', 'max. far', '(m)', 'road width (m)', 'base', 'use type', 'road width'}

# ">12 - 18m", "Up to 150", "=>18 - 24m", "> 45m", ">1200"
_BAND_START = re.compile(r'^(=?>|<|up to|upto|more than|less than|below|above)?\s*\d', re.I)
_BARE_NUMBER = re.compile(r'^\d+(\.\d+)?$')
# A band cell can stack several bands: clause 3.2.2.6 prints "=>12 - 24m >24 - 45m More
# than 45m" in ONE cell, with the three FAR pairs on the rows beside it.
_SPLIT_BANDS = re.compile(r'(?=(?:=?>|More than|Up to|Less than)\s*\d)', re.I)


def BAND(text):
    """
    Is this a road-width or plot-area band?

    The guard against a bare number matters: a FAR value of "2.0" starts with a digit and
    was being read as a band, which silently shifted every column of clause 3.2.2.6 Sl. 5
    one place to the left.
    """
    t = (text or '').strip()
    return bool(t) and not _BARE_NUMBER.match(t) and bool(_BAND_START.match(t))


def split_bands(text):
    parts = [p.strip() for p in _SPLIT_BANDS.split(text or '') if p.strip()]
    return [p for p in parts if BAND(p)] or [text]
SL = re.compile(r'^\d{1,2}\s*(\([a-z]\))?$')   # the gazette writes both '7(a)' and '7 (a)'


def number(text):
    """A FAR value. 'Unrestricted' is the gazette's word for no ceiling."""
    t = (text or '').strip()
    if not t:
        return None
    if t.lower().startswith('unrestric'):
        return 'unrestricted'
    try:
        return float(t)
    except ValueError:
        return t


def is_header(cells):
    joined = ' '.join(cells).lower()
    if all(c.strip().lower() in HEADER_WORDS for c in cells):
        return True                      # a wrapped header fragment: 'Coverage (%) | (m) | FAR'
    return any(h in joined for h in ('sl.', 'use types', 'base far', 'max. far')) \
        and not any(SL.match(c) for c in cells)


def classify(cells):
    """
    What kind of row is this? The matrix mixes five shapes, and guessing wrong merges
    unrelated occupancies without any visible error.

      occupancy   a new Sl., its use type, and its first band
      band        a further band of the occupancy above it
      group       an unnumbered sub-heading inside a table — "Recreational",
                  "Transportation", "Parks and Open Spaces" in clause 3.2.2.7
      named       a use type and values but no Sl., sitting under a group heading
      reference   defers to another clause, e.g. Mixed Use "As per 8.1"
    """
    if any(c.lower().startswith('as per') for c in cells):
        return 'reference', {}
    if len(cells) == 1:
        return 'group', {'group': cells[0]}

    has_sl = SL.match(cells[0])

    if has_sl and len(cells) >= 6:
        return 'occupancy', {'sl': cells[0], 'useType': cells[1], 'coverage': cells[2],
                             'band': cells[3], 'base': cells[4], 'max': cells[5]}
    if has_sl and len(cells) == 5 and BAND(cells[3]):
        return 'occupancy', {'sl': cells[0], 'useType': cells[1], 'coverage': cells[2],
                             'band': cells[3], 'base': cells[4], 'max': ''}
    if has_sl and len(cells) == 5:
        return 'occupancy', {'sl': cells[0], 'useType': cells[1], 'coverage': '',
                             'band': cells[2], 'base': cells[3], 'max': cells[4]}
    if has_sl and len(cells) == 4 and BAND(cells[1]):
        # a new Sl. whose use-type cell is blank: the gazette prints the name on the
        # continuation page. Clause 3.2.2.6 Sl. 2(b) does exactly this.
        return 'occupancy', {'sl': cells[0], 'useType': None, 'coverage': '',
                             'band': cells[1], 'base': cells[2], 'max': cells[3]}
    if has_sl and len(cells) == 4:
        return 'occupancy', {'sl': cells[0], 'useType': cells[1], 'coverage': cells[2],
                             'band': 'any', 'base': cells[3], 'max': ''}
    if has_sl and len(cells) == 3 and BAND(cells[2]):
        # Sl. 11 "Cold Storage" is printed with a road width and NOTHING else - no ground
        # coverage, no base FAR, no max FAR. Recorded as it stands rather than dropped.
        return 'occupancy', {'sl': cells[0], 'useType': cells[1], 'coverage': '',
                             'band': cells[2], 'base': '', 'max': ''}

    if len(cells) == 5 and BAND(cells[2]):
        return 'named', {'useType': cells[0], 'coverage': cells[1],
                         'band': cells[2], 'base': cells[3], 'max': cells[4]}
    if len(cells) == 3 and '%' in cells[1]:
        return 'named', {'useType': cells[0], 'coverage': cells[1],
                         'band': 'any', 'base': cells[2], 'max': ''}
    if len(cells) == 3 and BAND(cells[0]):
        return 'band', {'band': cells[0], 'base': cells[1], 'max': cells[2]}
    if len(cells) == 2 and BAND(cells[0]):
        return 'band', {'band': cells[0], 'base': cells[1], 'max': ''}
    if len(cells) == 2 and all(_BARE_NUMBER.match(c) or c.lower().startswith('unrestric')
                               for c in cells):
        # A FAR pair with no band of its own: it belongs to the next band stacked in the
        # cell above. Clause 3.2.2.6 Sl. 3 and 5 are printed this way.
        return 'values', {'base': cells[0], 'max': cells[1]}
    return 'unknown', {}


def rank(sl):
    m = re.match(r'(\d+)\s*(?:\((\w)\))?', sl or '')
    return (int(m.group(1)), m.group(2) or '') if m else (0, '')


def main():
    doc = json.load(open(CHAPTER_JSON))
    rows_out, unparsed, references, anomalies = [], [], [], []

    clause = clause_title = group = None
    sub_table, prev_sl = 0, None
    sl = use_type = coverage = None
    carried_name = False        # is the current use type inherited rather than printed?
    pending_bands = []          # bands stacked in one cell, awaiting their FAR pairs

    for page in doc['pages']:
        # Interleave headings and tables by vertical position. A page can carry three of
        # each, and a table that spills across a page break belongs to the heading above
        # it on the PREVIOUS page - clause 3.2.2.6's last table runs onto page 52 above
        # the 3.2.2.7 heading, and assigning it by page rather than by position would
        # file Guest House and Utilities under Other Uses.
        items = [('heading', l['y'], l['text']) for l in page.get('proseLines', [])
                 if CLAUSE.match(l['text'].strip())]
        items += [('table', t['bbox'][1], t) for t in page['tables']]
        items.sort(key=lambda i: i[1])

        for kind, _y, payload in items:
            if kind == 'heading':
                m = CLAUSE.match(payload.strip())
                if m.group(1) != clause:
                    clause, clause_title = m.group(1), m.group(2).strip()
                    group, sub_table, prev_sl = None, 0, None
                continue

            table = payload
            if 'Use Types' not in ' '.join(c['text'] for r in table['rows'] for c in r):
                continue

            for row in table['rows']:
                cells = [c['text'].replace('\n', ' ').strip() for c in row]
                cells = [c for c in cells if c]
                if not cells or is_header(cells):
                    continue

                kind_, f = classify(cells)

                if kind_ == 'reference':
                    references.append({'gazettePage': page['gazettePage'],
                                       'clause': clause, 'cells': cells})
                    continue
                if kind_ == 'group':
                    # An unnumbered sub-heading starts a fresh sub-table, and the Sl.
                    # above it does not carry into it.
                    group, sub_table, prev_sl, sl = f['group'], sub_table + 1, None, None
                    continue
                if kind_ == 'unknown':
                    unparsed.append({'gazettePage': page['gazettePage'], 'cells': cells})
                    continue

                if kind_ in ('occupancy', 'named'):
                    pending_bands = []      # a new occupancy cancels any unclaimed bands

                if kind_ == 'occupancy':
                    if prev_sl and rank(f['sl']) <= rank(prev_sl):
                        sub_table += 1          # numbering went backwards: new sub-table
                    sl, prev_sl = f['sl'], f['sl']
                    coverage = f['coverage'] or coverage
                    if f['useType']:
                        use_type, carried_name = f['useType'], False
                    else:
                        # Name not printed on this row. Carrying the previous occupancy's
                        # name would be wrong - 3.2.2.6 Sl. 2(b) is the Non-built-up twin
                        # of a row labelled "(Built-up)" - so it is left unresolved and
                        # recorded.
                        use_type, carried_name = None, True
                        anomalies.append({
                            'gazettePage': page['gazettePage'], 'clause': clause,
                            'sl': f['sl'],
                            'issue': 'new Sl. with no use type printed; name appears on '
                                     'the continuation page and is NOT inherited here'})
                elif kind_ == 'named':
                    sl = None
                    use_type, carried_name = f['useType'], False
                    coverage = f['coverage'] or coverage
                elif kind_ == 'values':
                    if not pending_bands:
                        unparsed.append({'gazettePage': page['gazettePage'], 'cells': cells})
                        continue
                    f = {'band': pending_bands.pop(0), 'base': f['base'], 'max': f['max']}
                elif kind_ == 'band':
                    if use_type is None and not carried_name:
                        unparsed.append({'gazettePage': page['gazettePage'], 'cells': cells})
                        continue

                band, base, mx = f['band'], f['base'], f['max']

                if kind_ in ('occupancy', 'named'):
                    stacked = split_bands(band)
                    band, pending_bands = stacked[0], stacked[1:]

                if band != 'any' and not BAND(band):
                    unparsed.append({'gazettePage': page['gazettePage'], 'cells': cells})
                    continue

                key_name = (use_type or f'{clause}#{sub_table}:{sl}:unnamed')
                rows_out.append({
                    'gazettePage': page['gazettePage'],
                    'clause': clause,
                    'clauseTitle': clause_title,
                    'group': group,
                    'subTable': sub_table,
                    'sl': (sl or '').replace(' ', '') or None,
                    'key': f"{clause}#{sub_table}:{(sl or key_name).replace(' ', '')}",
                    'useType': use_type,
                    'useTypeMissing': use_type is None,
                    'areaType': ('non_built_up' if use_type and 'non-built' in use_type.lower()
                                 else 'built_up' if use_type and 'built' in use_type.lower()
                                 else None),
                    'groundCoverage': coverage,
                    'band': band,
                    'baseFar': number(base),
                    'maxFar': number(mx),
                })

    keys = []
    for r in rows_out:
        if r['key'] not in keys:
            keys.append(r['key'])

    names = {}
    for r in rows_out:
        if r['useType']:
            names.setdefault(r['key'], set()).add(r['useType'])
    for k, n in sorted(names.items()):
        if len(n) > 1:
            anomalies.append({'key': k, 'issue': 'one key, several use types',
                              'names': sorted(n)})

    clauses = sorted({r['clause'] for r in rows_out if r['clause']})
    print(f'{len(rows_out)} band rows · {len(keys)} occupancies · '
          f'{len(clauses)} clauses ({", ".join(clauses)}) · '
          f'{len(references)} cross-references · {len(unparsed)} unparsed · '
          f'{len(anomalies)} anomalies', file=sys.stderr)
    for a in anomalies:
        print(f"   ANOMALY {a.get('key') or a.get('clause') + ' Sl.' + a.get('sl', '')}: "
              f"{a.get('issue') or a.get('names')}", file=sys.stderr)
    for u in unparsed[:6]:
        print(f"   unparsed p.{u['gazettePage']}: {u['cells']}", file=sys.stderr)

    json.dump({'clauses': '3.2.2.1–3.2.2.7',
               'source': CHAPTER_JSON,
               'sourceMd5': doc['sourceMd5'],
               'occupancyKeys': keys,
               'anomalies': anomalies,
               'crossReferences': references,
               'unparsed': unparsed,
               'rows': rows_out}, sys.stdout, indent=1)
    print()


if __name__ == '__main__':
    main()
