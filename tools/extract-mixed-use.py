#!/usr/bin/env python3
"""
Extract Chapter 8 — mixed-use development and Transit Oriented Development.

Chapter 8 states its rules in shapes no existing extractor takes. `extract-thresholds.py`
reads a table keyed on a *facility* down the left edge; `extract-purchasable-far.py` reads
the fourteen-column BFAR/PFAR/PPFAR/MFAR grid. Chapter 8's four tables are neither, and
running them through either produces silence rather than an error — which is the failure
mode this repository exists to avoid. Chapter 8's development standards went unread by
both tools until this one was written.

Four tables, four shapes:

  8.1.3    Development standards, TRANSPOSED. The parameters run down the left edge and
           the five permissible LOCATIONS run across the top, so one row states five
           different rules. Minimum plot size, means of access, height, setbacks, FAR,
           mixing, parking and ground coverage. This is the table that gives the engine
           its mixed-use thresholds, and the reason the occupancy's 300 m² minimum and
           1.75 ECS parking ratio turned out to be inventions.
  8.2.2.1  TOD land-use mixing: what each master-plan land use may become, and the FAR
           split between the existing use and the other one.
  8.2.2.2  TOD FAR, as a PERCENTAGE OF BASE FAR by right of way — a multiplier, where
           every other FAR table in the byelaws prints absolute figures.
  8.3.1(4) The activities barred from mixing, as prose wrapped across table cells.

It also checks the chapter's own internal cross-references, because two of them do not
resolve — see `danglingReferences` in the output.

Usage:
    python3 tools/extract-mixed-use.py > docs/source/derived/mixed-use.json
"""

import json
import os
import re
import sys

CHAPTER_JSON = 'docs/source/derived/chapters/chapter-08.json'
DOMAIN_JSON = 'src/domain/data/mixed-use.json'

# The five locations of Clause 8.1.2, in the order the standards table prints them.
LOCATION_KEYS = ['mixed_use_zone', 'approved_layout_plot', 'bazaar_street',
                 'wide_road', 'tod_zone']
LOCATION_CLAUSES = ['8.1.2(a)', '8.1.2(b)', '8.1.2(c)', '8.1.2(d)', '8.1.2(e)']

PARAMETER_KEYS = {
    'minimum plot size': 'minPlotSize',
    'means of access': 'meansOfAccess',
    'building height': 'buildingHeight',
    'minimum setbacks': 'minSetbacks',
    'floor area ratio': 'floorAreaRatio',
    'mixing': 'mixing',
    'parking': 'parking',
    'ground coverage': 'groundCoverage',
}

# "12m", ">12 - 24m", ">45m" — the right-of-way bands of Clause 8.2.2.2.
ROW_BAND = re.compile(r'^(?:(>)\s*)?([\d.]+)(?:\s*[–-]\s*([\d.]+))?\s*m$', re.I)
PERCENT = re.compile(r'^([\d.]+)\s*%$')
# A cross-reference to a paragraph of the byelaws: "as per para 8.1.3.6".
PARA_REF = re.compile(r'par(?:a|agraph)\.?\s*(\d+(?:\.\d+){1,3})', re.I)
HEADING = re.compile(r'^(8(?:\.\d+){1,3})\s', re.M)


def text(cell):
    return cell['text'].replace('\n', ' ').strip()


def cells(row):
    return [text(c) for c in row]


def non_empty(row):
    return [t for t in cells(row) if t]


def load():
    with open(CHAPTER_JSON) as f:
        return json.load(f)


def tables_on(doc, page):
    for p in doc['pages']:
        if p['gazettePage'] == page:
            return p['tables']
    return []


def standards(doc):
    """
    Clause 8.1.3, transposed: parameters down, the five permissible locations across.

    The header wraps over six physical rows and one column's name — "Along 24-meter and
    wider roads" — is split across two of them with an empty cell between, so the column
    names are joined down each column rather than read off row 0. The table then breaks
    across the page boundary: Parking and Ground Coverage are printed on page 105 as a
    headerless continuation, and dropping them would silently lose the parking rule that
    the engine currently gets wrong.
    """
    table = next(t for t in tables_on(doc, 104)
                 if t['rows'] and text(t['rows'][0][0]).startswith('Parameter'))
    width = max(len(r) for r in table['rows'])

    header_rows = [r for r in table['rows']
                   if not PARAMETER_KEYS.get(text(r[0]).lower())]
    columns = []
    for c in range(1, width):
        parts = [text(r[c]) for r in header_rows if c < len(r) and text(r[c])]
        columns.append(' '.join(parts))

    body = list(table['rows'])
    # The continuation on page 105: same width, and every row leads with a parameter name.
    for t in tables_on(doc, 105):
        rows = [r for r in t['rows'] if len(r) == width]
        if rows and all(PARAMETER_KEYS.get(text(r[0]).lower()) for r in rows):
            body += rows

    parameters, unknown = [], []
    for row in body:
        key = PARAMETER_KEYS.get(text(row[0]).lower())
        if not key:
            if text(row[0]) and not text(row[0]).startswith('Parameter'):
                unknown.append(text(row[0]))
            continue
        values = [text(row[c]) if c < len(row) else '' for c in range(1, width)]
        parameters.append({
            'key': key,
            'parameter': text(row[0]),
            'byLocation': dict(zip(LOCATION_KEYS, values)),
        })

    return {
        'clause': '8.1.3',
        'gazettePage': 104,
        'locations': [
            {'key': k, 'clause': c, 'name': n}
            for k, c, n in zip(LOCATION_KEYS, LOCATION_CLAUSES, columns)
        ],
        'parameters': parameters,
    }, unknown


def tod_mixing(doc):
    """Clause 8.2.2.1 — what each land use may become, and the FAR split."""
    table = next(t for t in tables_on(doc, 106)
                 if t['rows'] and text(t['rows'][0][0]).startswith('Land use'))
    rows = []
    for row in table['rows'][1:]:
        got = non_empty(row)
        if len(got) != 4:
            continue
        existing, changed, minimum, other = got
        rows.append({
            'landUse': existing,
            'changedLandUse': changed,
            'minimumFarInExistingUse': minimum,
            'farInOtherUse': other,
            'minimumSharePercent': percent_or_none(minimum),
            'otherSharePercent': percent_or_none(other),
        })
    return {'clause': '8.2.2.1', 'gazettePage': 106, 'rows': rows}


def percent_or_none(value):
    m = re.match(r'^([\d.]+)\s*percent$', value, re.I)
    return float(m.group(1)) if m else None


def tod_far(doc):
    """
    Clause 8.2.2.2 — TOD FAR as a percentage of base FAR.

    Every other FAR table in the byelaws prints an absolute maximum. This one prints a
    MULTIPLIER against whatever base FAR the use would otherwise carry ("As per byelaws"),
    which is a different kind of rule: it cannot be resolved without first resolving the
    underlying use, and it has no meaning of its own.
    """
    table = next(t for t in tables_on(doc, 106)
                 if t['rows'] and text(t['rows'][0][0]).startswith('Minimum Right of Way'))
    bands, previous = [], 0.0
    for row in table['rows'][1:]:
        got = non_empty(row)
        if len(got) != 3:
            continue
        label, base, share = got
        m = ROW_BAND.match(label)
        if not m:
            continue
        gt, low, high = m.group(1), float(m.group(2)), m.group(3)
        # "12m" is the bottom row and reads as a right of way OF 12 m, not over it; the
        # rows above it are all explicitly ">". Below 12 m no TOD plot has access at all
        # (Clause 8.1.3), so the band runs from zero and the access rule bars the rest.
        over = previous if gt else 0.0
        upto = float(high) if high else (None if gt and not high else low)
        pct = PERCENT.match(share)
        bands.append({
            'label': label,
            'overMoreThan': over,
            'upToAndIncluding': upto,
            'baseFar': base,
            'todFarPercentOfBase': float(pct.group(1)) if pct else None,
            'multiplier': round(float(pct.group(1)) / 100, 4) if pct else None,
            'unrestricted': share.lower().startswith('unrestricted'),
        })
        previous = upto if upto is not None else previous
    return {'clause': '8.2.2.2', 'gazettePage': 106, 'bands': bands}


def excluded_activities(doc):
    """
    Clause 8.3.1(4) — activities that shall not be mixed with other permissible uses.

    Prose set in a borderless table, so each entry wraps across two or three physical
    rows and alternates between column 0 and column 1 as it wraps. Reading cell by cell
    gives fragments beginning "centre, Meat Processing Plant".

    The cell boundary is what separates a category from the activity before it, so the
    split is made cell by cell rather than over the flowed text. Nothing in the words
    themselves distinguishes the two: "Slaughterhouses Traffic & Transportation:" is a
    single run of capitalised words that ends in a colon, and flowing the text first
    reads the last activity of one category as part of the next one's name.
    """
    table = next(t for t in tables_on(doc, 107) if t['rows'])
    # A cell that opens with a short capitalised label and a colon starts a category;
    # anything else continues the one before it.
    opener = re.compile(r'^([A-Z][A-Za-z&\- ]{0,40}?):\s*(.*)$', re.S)

    entries = []
    for row in table['rows']:
        for chunk in non_empty(row):
            m = opener.match(chunk)
            if m and len(m.group(1).split()) <= 4:
                entries.append([m.group(1).strip(), m.group(2)])
            elif entries:
                entries[-1][1] += ' ' + chunk

    out = []
    for category, listed in entries:
        listed = re.sub(r'\s+', ' ', listed).strip().rstrip(',')
        out.append({
            'category': category,
            'activities': [a.strip() for a in listed.split(',') if a.strip()],
        })
    flowed = ' '.join(f"{c['category']}: {', '.join(c['activities'])}" for c in out)
    return {'clause': '8.3.1(4)', 'gazettePage': 107, 'categories': out, 'text': flowed}


def dangling_references(doc):
    """
    Cross-references the chapter makes to paragraphs of itself that do not exist.

    Two of them do not resolve, and one is load-bearing: the standards table sends the
    reader to paragraph 8.1.3.6 for the FAR of a mixed-use zone, and there is no 8.1.3.6
    in the chapter or anywhere else in the byelaws.
    """
    prose = '\n'.join(p['prose'] for p in doc['pages'])
    present = set(HEADING.findall(prose))
    seen = {}
    for p in doc['pages']:
        haystack = [p['prose']] + [text(c) for t in p['tables']
                                   for r in t['rows'] for c in r]
        for chunk in haystack:
            for ref in PARA_REF.findall(chunk):
                if ref.startswith('8.') and ref not in present:
                    seen.setdefault(ref, {'reference': ref,
                                          'gazettePage': p['gazettePage'],
                                          'context': re.sub(r'\s+', ' ', chunk)[:160]})
    return sorted(seen.values(), key=lambda d: d['reference'])


def main():
    doc = load()
    standards_table, unknown = standards(doc)
    payload = {
        'generatedBy': 'tools/extract-mixed-use.py',
        'source': doc['source'],
        'sourceMd5': doc['sourceMd5'],
        'chapter': '08',
        'standards': standards_table,
        'todMixing': tod_mixing(doc),
        'todFar': tod_far(doc),
        'excludedFromMixing': excluded_activities(doc),
        'danglingReferences': dangling_references(doc),
    }

    warnings = [f'unrecognised parameter row: {u!r}' for u in unknown]
    for d in payload['danglingReferences']:
        warnings.append(f"p.{d['gazettePage']} refers to paragraph {d['reference']}, "
                        f'which the chapter does not contain')

    print(f"{len(standards_table['parameters'])} standards × "
          f"{len(standards_table['locations'])} locations · "
          f"{len(payload['todMixing']['rows'])} TOD mixing rows · "
          f"{len(payload['todFar']['bands'])} TOD FAR bands · "
          f"{sum(len(c['activities']) for c in payload['excludedFromMixing']['categories'])} "
          f"excluded activities in {len(payload['excludedFromMixing']['categories'])} "
          f'categories · {len(warnings)} warnings', file=sys.stderr)
    for w in warnings:
        print(f'   WARNING {w}', file=sys.stderr)

    os.makedirs(os.path.dirname(DOMAIN_JSON), exist_ok=True)
    with open(DOMAIN_JSON, 'w') as f:
        json.dump(payload, f, indent=1)
        f.write('\n')
    print(f'wrote {DOMAIN_JSON}', file=sys.stderr)

    json.dump(payload, sys.stdout, indent=1)
    print()


if __name__ == '__main__':
    main()
