#!/usr/bin/env python3
"""
Extract every minimum-plot-size and minimum-road-width table from the chapter extractions.

This is what V-005 has been waiting for. The engine carries one minimum plot size and one
minimum road width per occupancy, reasoned from four occupancies before the gazette was
available. The gazette states them per *facility*, and the facilities inside one occupancy
differ by more than an order of magnitude:

    Non-bedded medical establishment      100 m²      9 m
    Nursing home, up to 50 beds           300 m²     12 m
    Nursing institute                   2,000 m²     18 m
    Hospital over 50 beds               3,000 m²     18 m
    Medical college                  NMC/MCI norms   24 m

The engine's single hospital occupancy holds 500 m² and 12 m, which matches none of them.

Two forms appear. Most tables are keyed on the facility; Clause 6.3.3 and 6.4.2 invert it
and key the road width on the plot size, or the plot size on the road. Both are captured
as they are printed, with `keyedOn` saying which.

Usage:
    python3 tools/extract-thresholds.py > docs/source/derived/thresholds.json
"""

import glob
import json
import os
import re
import sys

CHAPTERS = sorted(glob.glob('docs/source/derived/chapters/chapter-*.json'))
DOMAIN_JSON = 'src/domain/data/thresholds.json'

PLOT = re.compile(r'min(?:imum)?\.?\s*plot\s*(?:area|size)', re.I)
ROAD = re.compile(r'min(?:imum)?\.?\s*road\s*width', re.I)
PLOT_KEY = re.compile(r'^plot\s*size', re.I)
ROAD_KEY = re.compile(r'^road\s*width', re.I)
SERIAL = re.compile(r'^\d{1,2}$')

# "7-meters (Agriculture Use Zone) 9-meters (Industrial Use Zones)"
BY_USE_ZONE = re.compile(r'([\d.]+)\s*-?\s*met(?:er|re)s?\s*\(([^)]*?)\s*Use\s*Zones?\)', re.I)

# "9 – Built-up area 12 – Non-Built-up area" and "6 (built up) 9 (non-built up)"
SPLIT_BY_AREA = re.compile(
    r'([\d.]+)\s*(?:[–-]\s*)?\(?\s*Built-?\s?up\s*(?:area)?\)?\s*'
    r'([\d.]+)\s*(?:[–-]\s*)?\(?\s*Non-?\s?Built-?\s?up\s*(?:area)?\)?', re.I)
# ">10 to 100", "=>100 to 300", "More than 300 - 3000", "More than 3000"
RANGE = re.compile(r'^(?:=?>|more than)?\s*([\d.]+)\s*(?:to|[–-])\s*([\d.]+)$', re.I)
OPEN_RANGE = re.compile(r'^(?:=?>|more than)\s*([\d.]+)$', re.I)
# "500 square meters", "2.0 hectares", "1.0 acre"
UNIT = re.compile(r'^([\d.]+)\s*(square\s*met(?:er|re)s?|sq\.?\s*m\.?|hectares?|acres?|m)\b', re.I)
TO_SQM = {'hectare': 10_000, 'hectares': 10_000, 'acre': 4_046.86, 'acres': 4_046.86}


def cells(row):
    return [c['text'].replace('\n', ' ').strip() for c in row if c['text'].strip()]


def parse_value(text):
    """
    A threshold cell. The gazette writes the same quantity six ways, and every form here
    was one the first pass reported as unparseable:

        "300"                          a bare number
        "500 square meters"            with the unit spelled out
        "2.0 hectares" / "1.0 acre"    in another unit entirely
        "6 (built up) 9 (non-built up)" split by area type
        ">10 to 100"                   a range, whose lower bound is the minimum
        "As per NMC / MCI norms"       a deferral to somebody else's rules
    """
    t = (text or '').strip()
    if not t:
        return None

    zones = BY_USE_ZONE.findall(t)
    if zones:
        # Clause 7.1.3 splits the road minimum by USE ZONE — 7 m in an agriculture zone,
        # 9 m in an industrial one — a third dimension after the facility and the area
        # type, and one the occupancy list has no field for. See V-021.
        return {'byUseZone': {z.strip().lower().replace(' ', '_'): float(v) for v, z in zones}}

    m = SPLIT_BY_AREA.search(t)
    if m:
        return {'built_up': float(m.group(1)), 'non_built_up': float(m.group(2))}

    m = re.fullmatch(r'([\d.]+)', t)
    if m:
        return float(m.group(1))

    m = UNIT.match(t)
    if m:
        return float(m.group(1)) * TO_SQM.get(m.group(2).lower().rstrip('.'), 1)

    m = RANGE.match(t)
    if m:
        return {'from': float(m.group(1)), 'to': float(m.group(2))}

    m = OPEN_RANGE.match(t)
    if m:
        return {'from': float(m.group(1)), 'to': None}

    return {'defersTo': t}


def extract(table, chapter, gazette_page):
    header = cells(table['rows'][0]) if table['rows'] else []
    if not header:
        return None

    joined = ' | '.join(header)
    measures = ('minPlotAreaSqm' if PLOT.search(joined) else None,
                'minRoadWidthM' if ROAD.search(joined) else None)
    measure = next((m for m in measures if m), None)
    if not measure:
        return None

    # Which column is the subject, and which the value?
    value_index = next((i for i, h in enumerate(header)
                        if (PLOT if measure == 'minPlotAreaSqm' else ROAD).search(h)), None)
    if value_index is None:
        return None

    if value_index == 0:
        # The measure is in the FIRST column, so this table is keyed the other way round
        # and its subject is something other than a facility. Two of these exist and they
        # are different rules that happen to share vocabulary — Clause 3.1.3 sizes a
        # layout's own internal roads by their length, and Clause 7.3.6 sets dairy-farm
        # setbacks by plot area. Neither is a plot's access requirement. See V-020.
        return {'skip': f'chapter {chapter} p.{gazette_page}: measure column is first, so '
                        f'this table is keyed on {header[-1]!r} — not a facility access '
                        f'table'}

    keyed_on = ('plotAreaSqm' if PLOT_KEY.match(header[0])
                else 'roadWidthM' if ROAD_KEY.match(header[0])
                else 'facility')

    rows = []
    for row in table['rows'][1:]:
        c = cells(row)
        if len(c) < 2:
            continue
        if SERIAL.match(c[0]) and len(c) >= 3:
            subject, value = c[1], c[-1]
        else:
            subject, value = c[0], c[-1]
        if (PLOT if measure == 'minPlotAreaSqm' else ROAD).search(subject):
            continue                       # a repeated header
        rows.append({'subject': subject, 'value': parse_value(value)})

    if not rows:
        return None
    return {'chapter': chapter, 'gazettePage': gazette_page,
            'measure': measure, 'keyedOn': keyed_on,
            'header': header, 'rows': rows}


def main():
    tables, warnings = [], []
    for path in CHAPTERS:
        doc = json.load(open(path))
        for page in doc['pages']:
            for table in page['tables']:
                got = extract(table, doc['chapter'], page['gazettePage'])
                if not got:
                    continue
                if 'skip' in got:
                    warnings.append(got['skip'])
                    continue
                # Clause 3.1.2's community-facility list is a two-level structure —
                # numbered categories with lettered sub-items — not a flat facility
                # table, and reading it as one produces subjects like "(a)". It needs
                # its own pass; see V-020.
                if sum(1 for r in got['rows'] if re.fullmatch(r'\(?[a-z0-9]\)?\.?', r['subject'], re.I)) > 2:
                    warnings.append(f"ch{got['chapter']} p.{got['gazettePage']}: "
                                    f'skipped a multi-level list, not a flat facility table')
                    continue
                tables.append(got)

    for t in tables:
        for r in t['rows']:
            v = r['value']
            if isinstance(v, dict) and 'defersTo' in v:
                warnings.append(f"ch{t['chapter']} p.{t['gazettePage']} {t['measure']}: "
                                f"{r['subject'][:44]!r} defers to {v['defersTo'][:60]!r}")

    by_measure = {}
    for t in tables:
        by_measure.setdefault(t['measure'], 0)
        by_measure[t['measure']] += len(t['rows'])

    print(f"{len(tables)} tables · {sum(len(t['rows']) for t in tables)} rows "
          f"({', '.join(f'{k}: {v}' for k, v in sorted(by_measure.items()))}) · "
          f'{len(warnings)} non-numeric values', file=sys.stderr)
    for w in warnings:
        print(f'   non-numeric {w}', file=sys.stderr)

    payload = {'generatedBy': 'tools/extract-thresholds.py', 'tables': tables}
    os.makedirs(os.path.dirname(DOMAIN_JSON), exist_ok=True)
    with open(DOMAIN_JSON, 'w') as f:
        json.dump(payload, f, indent=1)
        f.write('\n')
    print(f'wrote {DOMAIN_JSON}', file=sys.stderr)

    json.dump({**payload, 'warnings': warnings}, sys.stdout, indent=1)
    print()


if __name__ == '__main__':
    main()
