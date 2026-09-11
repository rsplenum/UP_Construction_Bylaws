#!/usr/bin/env python3
"""
Appendix-15 — "Use zones across different master plans".

The translation table between what a real master plan calls a zone and what Clause 15.3's
columns mean. Its rows 1 to 16 are the sixteen standard use zones in the same order as the
Clause 15.3 matrix; its columns are twenty-two Development Authorities, five to a table
across five pages. A row 17, "Additional Land use", is printed empty throughout.

This matters because Clause 15.3 decides whether a use may go on a plot, keyed on a zone
code, and no applicant's master plan uses those codes. Gorakhpur's plan says "C3- Wholesale
/ Storage/godown /Warehousing"; Muzaffarnagar's says "Ganna Shodh Kendra". Without this
table a user cannot answer the engine's first question about their own plot.

Cell continuations are the whole difficulty. A cell with four lines of local zone names is
emitted by the page extractor as its first line only, with the remaining lines in following
rows whose serial-number column is empty. Those rows are folded back into the record above.

Usage:  python3 tools/extract-master-plan-zones.py > docs/source/derived/master-plan-zones.json
"""

import json
import pathlib
import re
import sys

SRC = 'docs/source/derived/chapters/appendix-15.json'
DOMAIN_JSON = 'src/domain/data/master-plan-zones.json'

# Rows 1-16 of Appendix-15, in the order Clause 15.3 prints its columns.
ZONE_CODES = ['BU', 'R', 'MU', 'C-1', 'C-2', 'SI', 'LI', 'OB', 'PSP',
              'TT', 'F', 'RC', 'GB', 'RA', 'A', 'HF']

SERIAL = re.compile(r'^(\d{1,2})$')
NIL = re.compile(r'^\s*NIL\s*$', re.I)


def text(cell):
    return (cell.get('text') or '').strip()


def unwrap(lines):
    """
    Re-join a local zone name that the page broke across two lines.

    Almost every line in this appendix is a separate zone name — Agra alone lists four under
    C-1 — so joining lines generally would fuse names the plan keeps apart. Only four cells
    in the whole table actually wrap, and each announces itself: the continuation begins with
    a slash, or the line before it ends with one, or it is a bare lowercase word that cannot
    start a zone name. Anything else is left as its own name.
    """
    out = []
    for line in lines:
        wraps = (out
                 and (line.startswith('/')
                      or out[-1].rstrip().endswith('/')
                      or (line[:1].islower() and ' ' not in line)))
        if wraps:
            sep = '' if line.startswith('/') or out[-1].rstrip().endswith('/') else ' '
            out[-1] = f'{out[-1].rstrip()}{sep}{line}'
        else:
            out.append(line)
    return out


def read_table(table):
    """One page's table → (authorities, {serial: {authority: [local names]}})."""
    rows = table['rows']
    authorities, header_at = [], None
    for ri, row in enumerate(rows):
        if text(row[1]).startswith('Development Authority'):
            authorities = [text(c) for c in row[2:]]
            header_at = ri
            break
    if header_at is None:
        return [], {}

    records, current = {}, None
    for row in rows[header_at + 1:]:
        serial = SERIAL.match(text(row[0]))
        if serial:
            current = serial.group(1)
            records.setdefault(current, {'label': [], 'values': [[] for _ in authorities]})
            if text(row[1]):
                records[current]['label'].append(text(row[1]))
            for i, cell in enumerate(row[2:]):
                if text(cell):
                    records[current]['values'][i].append(text(cell))
        elif current is not None:
            # A continuation of the record above: the serial column is empty and the
            # remaining columns carry further lines of the same cells.
            if text(row[1]) and not text(row[1]).startswith('Use Zone'):
                records[current]['label'].append(text(row[1]))
            for i, cell in enumerate(row[2:]):
                if text(cell):
                    records[current]['values'][i].append(text(cell))
    return authorities, records


def main():
    doc = json.load(open(SRC, encoding='utf-8'))
    zones = {}          # serial -> {'label': str, 'authorities': {name: [local names]}}
    order = []

    for page in doc['pages']:
        for table in page.get('tables', []):
            authorities, records = read_table(table)
            if not authorities:
                continue
            for serial, rec in records.items():
                if serial not in zones:
                    zones[serial] = {'label': ' '.join(rec['label']).strip(), 'authorities': {}}
                    order.append(serial)
                elif rec['label'] and not zones[serial]['label']:
                    zones[serial]['label'] = ' '.join(rec['label']).strip()
                for name, lines in zip(authorities, rec['values']):
                    joined = unwrap([l for l in lines if l])
                    if len(joined) == 1 and NIL.match(joined[0]):
                        zones[serial]['authorities'][name] = None
                    elif joined:
                        zones[serial]['authorities'][name] = joined

    rows = []
    for serial in sorted(order, key=int):
        n = int(serial)
        rows.append({
            'serial': n,
            'zone': ZONE_CODES[n - 1] if n <= len(ZONE_CODES) else None,
            'label': zones[serial]['label'],
            'authorities': zones[serial]['authorities'],
        })

    every_authority = sorted({a for r in rows for a in r['authorities']})
    payload = {'source': SRC, 'clause': 'Appendix-15',
               'authorities': every_authority, 'rows': rows}
    json.dump(payload, sys.stdout, indent=1)
    print()

    pathlib.Path(DOMAIN_JSON).parent.mkdir(parents=True, exist_ok=True)
    with open(DOMAIN_JSON, 'w', encoding='utf-8') as fh:
        json.dump(payload, fh, indent=1)
        fh.write('\n')

    mapped = sum(1 for r in rows for v in r['authorities'].values() if v)
    nil = sum(1 for r in rows for v in r['authorities'].values() if v is None)
    unmapped = [r['serial'] for r in rows if r['zone'] and len(r['authorities']) < len(every_authority)]
    print(f'{len(every_authority)} authorities × {len(rows)} use-zone rows · '
          f'{mapped} local zone names, {nil} NIL', file=sys.stderr)
    if unmapped:
        print(f'   rows not covering every authority: {unmapped}', file=sys.stderr)
    print(f'wrote {DOMAIN_JSON}', file=sys.stderr)


if __name__ == '__main__':
    main()
