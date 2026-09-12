#!/usr/bin/env python3
"""Describe the gazette PDFs the app serves, from the bytes themselves.

The viewer must never assert a page number it has not read. Everything here is measured
from docs/source/gazette/pdf/*.pdf and docs/source/derived/chapters/*.txt — the same
originals every rule is verified against — so the manifest cannot drift from what the
reader actually opens.

    python3 tools/build-gazette-manifest.py > src/data/gazette-documents.json
"""
import glob
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(ROOT, 'docs/source/gazette/pdf')
TXT_DIR = os.path.join(ROOT, 'docs/source/derived/chapters')

try:
    import pymupdf
except ImportError:  # pragma: no cover - the extractor's own dependency
    sys.exit('pymupdf is required: pip install pymupdf')


def gazette_pages(stem):
    """The gazette page numbers this chapter occupies, read off the derived text."""
    path = os.path.join(TXT_DIR, stem + '.txt')
    if not os.path.exists(path):
        return None, None
    with open(path, encoding='utf-8') as fh:
        pages = [int(m) for m in re.findall(r'gazette page (\d+)', fh.read())]
    return (min(pages), max(pages)) if pages else (None, None)


def main():
    documents = []
    for path in sorted(glob.glob(os.path.join(PDF_DIR, '*.pdf'))):
        stem = os.path.basename(path)[:-4]          # chapter-03, appendix-15
        kind, number = stem.split('-')
        first, last = gazette_pages(stem)
        with pymupdf.open(path) as doc:
            pdf_pages = doc.page_count
        with open(path, 'rb') as fh:
            digest = hashlib.md5(fh.read()).hexdigest()
        documents.append({
            'id': stem,
            'kind': kind,                            # 'chapter' | 'appendix'
            'number': int(number),
            'file': 'gazette/%s.pdf' % stem,         # served from the site root
            'pdfPages': pdf_pages,
            'gazetteFrom': first,
            'gazetteTo': last,
            'bytes': os.path.getsize(path),
            'md5': digest,
        })

    documents.sort(key=lambda d: (d['kind'] != 'chapter', d['number']))
    json.dump({
        'generatedBy': 'tools/build-gazette-manifest.py',
        'source': 'docs/source/gazette/pdf/',
        'documents': documents,
    }, sys.stdout, indent=2)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
