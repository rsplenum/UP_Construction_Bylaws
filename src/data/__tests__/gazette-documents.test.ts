import { existsSync, readFileSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  GAZETTE_DOCUMENTS,
  GAZETTE_TOTAL_PAGES,
  documentLabel,
  gazetteRange,
} from '../gazetteDocuments';
import { BYELAW_CHAPTERS } from '../byelawsData';

const PDF_DIR = path.resolve(__dirname, '../../../docs/source/gazette/pdf');

/**
 * The reader may not describe a document it does not serve.
 *
 * The predecessor of this manifest indexed 18 chapters at gazette pages 7–180 while the
 * file it actually opened was a seven-page generated summary. These tests make that class
 * of drift a build failure rather than something a user discovers.
 */
describe('the gazette manifest describes the files on disk', () => {
  it('names a file that exists for every document', () => {
    for (const doc of GAZETTE_DOCUMENTS) {
      const onDisk = path.join(PDF_DIR, path.basename(doc.file));
      expect(existsSync(onDisk), `${doc.id}: ${onDisk}`).toBe(true);
    }
  });

  it('records the true size and checksum of each file', () => {
    for (const doc of GAZETTE_DOCUMENTS) {
      const bytes = readFileSync(path.join(PDF_DIR, path.basename(doc.file)));
      expect(bytes.byteLength, `${doc.id} size`).toBe(doc.bytes);
      expect(createHash('md5').update(bytes).digest('hex'), `${doc.id} md5`).toBe(doc.md5);
    }
  });

  it('leaves no PDF in the source directory unlisted', () => {
    const onDisk = readdirSync(PDF_DIR).filter((f) => f.endsWith('.pdf')).sort();
    const listed = GAZETTE_DOCUMENTS.map((d) => path.basename(d.file)).sort();
    expect(listed).toEqual(onDisk);
  });

  it('agrees with the checksums recorded for the originals', () => {
    const checksums = readFileSync(path.join(PDF_DIR, '../CHECKSUMS.txt'), 'utf-8');
    for (const doc of GAZETTE_DOCUMENTS) {
      expect(checksums, doc.id).toContain(`${doc.md5}  pdf/${path.basename(doc.file)}`);
    }
  });
});

describe('the index it presents', () => {
  it('covers all 18 chapters and Appendix-15', () => {
    const chapters = GAZETTE_DOCUMENTS.filter((d) => d.kind === 'chapter').map((d) => d.number);
    expect(chapters).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    expect(GAZETTE_DOCUMENTS.filter((d) => d.kind === 'appendix').map((d) => d.number)).toEqual([15]);
  });

  it('titles every chapter from the same data the navigator reads', () => {
    for (const doc of GAZETTE_DOCUMENTS.filter((d) => d.kind === 'chapter')) {
      const chapter = BYELAW_CHAPTERS.find((c) => c.id === doc.number);
      expect(chapter, `chapter ${doc.number} missing from BYELAW_CHAPTERS`).toBeDefined();
      expect(doc.title).toBe(chapter!.title);
      expect(doc.title).not.toMatch(/^chapter \d+$/);
    }
  });

  it('states gazette pages that match the page ranges byelawsData declares', () => {
    for (const doc of GAZETTE_DOCUMENTS.filter((d) => d.kind === 'chapter')) {
      const declared = BYELAW_CHAPTERS.find((c) => c.id === doc.number)!.pageRange;
      expect(declared, `chapter ${doc.number}`).toBe(`pp. ${doc.gazetteFrom}-${doc.gazetteTo}`);
    }
  });

  it('spans a contiguous run of gazette pages across the chapters', () => {
    const chapters = GAZETTE_DOCUMENTS.filter((d) => d.kind === 'chapter');
    for (let i = 1; i < chapters.length; i += 1) {
      const previousEnd = chapters[i - 1].gazetteTo!;
      const start = chapters[i].gazetteFrom!;
      // A chapter starts on the page the last one ended, or the page after it — never a gap.
      expect(start - previousEnd, `between chapters ${i} and ${i + 1}`).toBeLessThanOrEqual(1);
      expect(start).toBeGreaterThanOrEqual(previousEnd);
    }
  });

  it('totals the pages it actually holds, not a claimed figure', () => {
    // 180 pages across 19 files, counted by pymupdf when the manifest was built.
    // DOCUMENT_METADATA.totalPages says 224; that figure is unverified and is not shown.
    expect(GAZETTE_TOTAL_PAGES).toBe(180);
    expect(GAZETTE_DOCUMENTS.every((d) => d.pdfPages > 0)).toBe(true);
  });
});

describe('how a document is labelled', () => {
  it('names chapters and appendices the way the byelaws do', () => {
    const ch3 = GAZETTE_DOCUMENTS.find((d) => d.id === 'chapter-03')!;
    expect(documentLabel(ch3)).toBe('Chapter 3');
    expect(gazetteRange(ch3)).toBe('pp. 37–75');

    const app15 = GAZETTE_DOCUMENTS.find((d) => d.id === 'appendix-15')!;
    expect(documentLabel(app15)).toBe('Appendix-15');
    expect(gazetteRange(app15)).toBe('pp. 214–218');
  });
});
