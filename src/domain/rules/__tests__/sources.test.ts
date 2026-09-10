import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards the source layer.
 *
 * A derived extraction is only worth anything if you can tell it still matches the bytes
 * it was extracted from. Every JSON under docs/source/derived/chapters records the md5 of
 * its PDF; this checks that the PDF still has it. A stale extraction — one produced from
 * a file that has since been replaced — is otherwise indistinguishable from a fresh one,
 * and would quietly become a second, wrong source of truth.
 *
 * Regenerate with ./tools/extract-all.sh
 */

const ROOT = process.cwd();
const PDF_DIR = resolve(ROOT, 'docs/source/gazette/pdf');
const DERIVED = resolve(ROOT, 'docs/source/derived/chapters');

const md5 = (path: string) => createHash('md5').update(readFileSync(path)).digest('hex');

const chapters = existsSync(PDF_DIR)
  ? readdirSync(PDF_DIR).filter((f) => f.endsWith('.pdf')).sort()
  : [];

describe('the checked-in gazette originals', () => {
  it('has the Word original', () => {
    expect(existsSync(resolve(ROOT, 'docs/source/gazette/UP-Building-Byelaws-2025-TMPR8.docx')))
      .toBe(true);
  });

  it('matches the recorded checksums', () => {
    const lines = readFileSync(resolve(ROOT, 'docs/source/gazette/CHECKSUMS.txt'), 'utf-8')
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('#'));
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      const [sum, name] = line.trim().split(/\s+/);
      const path = resolve(ROOT, 'docs/source/gazette', name);
      expect(existsSync(path), `${name} is listed in CHECKSUMS.txt but missing`).toBe(true);
      expect(md5(path), `${name} does not match its recorded checksum`).toBe(sum);
    }
  });
});

describe.skipIf(chapters.length === 0)('every chapter PDF has a current extraction', () => {
  it.each(chapters)('%s', (pdf) => {
    const n = pdf.match(/chapter-(\d+)\.pdf/)?.[1];
    const json = join(DERIVED, `chapter-${n}.json`);
    const text = join(DERIVED, `chapter-${n}.txt`);

    expect(existsSync(json), `${pdf} has no extraction — run ./tools/extract-all.sh`).toBe(true);
    expect(existsSync(text), `${pdf} has no text rendering — run ./tools/extract-all.sh`).toBe(true);

    const extraction = JSON.parse(readFileSync(json, 'utf-8'));
    expect(extraction.sourceMd5, `chapter-${n}.json was extracted from a different ${pdf} — run ./tools/extract-all.sh`)
      .toBe(md5(join(PDF_DIR, pdf)));

    // A chapter with no pages, or one that lost its page numbering, is a broken extraction.
    expect(extraction.pageCount).toBeGreaterThan(0);
    expect(extraction.gazettePages?.[0]).toBeGreaterThan(0);
    expect(extraction.gazettePages[1]).toBeGreaterThanOrEqual(extraction.gazettePages[0]);
  });

  it('reports any rasterised content, which no extractor can read', () => {
    const warnings = chapters.flatMap((pdf) => {
      const n = pdf.match(/chapter-(\d+)\.pdf/)?.[1];
      const json = join(DERIVED, `chapter-${n}.json`);
      if (!existsSync(json)) return [];
      return (JSON.parse(readFileSync(json, 'utf-8')).warnings ?? [])
        .map((w: string) => `chapter ${n}, ${w}`);
    });
    // Not a failure — a manifest. Anything listed here has to be read by eye.
    if (warnings.length > 0) console.warn('Rasterised content:\n  ' + warnings.join('\n  '));
    expect(Array.isArray(warnings)).toBe(true);
  });
});
