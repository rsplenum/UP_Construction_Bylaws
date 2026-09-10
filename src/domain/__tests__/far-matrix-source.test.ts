import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BASE_FAR, COMMERCIAL_MAX_FAR, GROUP_HOUSING_MAX_FAR, PLOTTED_RESIDENTIAL_MAX_FAR, RESIDENTIAL_TELESCOPIC_SLABS } from '../far';

/**
 * Checks the engine's FAR ladders against the Chapter 3 PDF — a source, and an extraction
 * path, entirely separate from the .docx the ladders were originally read from.
 *
 * Two independent readings agreeing is the strongest evidence available short of a human
 * with the printed gazette. Where they disagree, one of the two pipelines has a bug, and
 * that is worth failing a build over: the .docx path already lost a whole table in silence
 * (V-008), and B-013 sat in the engine because nobody had a second reading to compare.
 *
 * Regenerate the matrix with ./tools/extract-all.sh
 */

const MATRIX = resolve(process.cwd(), 'docs/source/derived/far-matrix.json');

interface Row {
  key: string;
  band: string;
  baseFar: number | string | null;
  maxFar: number | string | null;
}

const present = existsSync(MATRIX);
const rows: Row[] = present ? JSON.parse(readFileSync(MATRIX, 'utf-8')).rows : [];
const ladder = (key: string) => rows.filter((r) => r.key === key);
const ceiling = (v: number | string | null) => (v === 'unrestricted' ? Infinity : v);

describe.skipIf(!present)('the engine agrees with the Chapter 3 PDF', () => {
  // Clause 3.2.2.1 — the telescopic ladder, and Max FAR 2.0 in every band.
  it('plotted residential: base FAR per band, and a flat 2.0 ceiling', () => {
    const bands = ladder('3.2.2.1#0:1');
    expect(bands).toHaveLength(RESIDENTIAL_TELESCOPIC_SLABS.length);
    expect(bands.map((b) => b.baseFar)).toEqual(RESIDENTIAL_TELESCOPIC_SLABS.map((s) => s.far));
    for (const b of bands) expect(b.maxFar).toBe(PLOTTED_RESIDENTIAL_MAX_FAR);
  });

  // Clause 3.2.2.2 — B-013. The two area types carry different ceilings, and the
  // non-built-up row has no band below 12 m at all.
  it('group housing: separate ceilings for built-up and non-built-up', () => {
    const builtUp = ladder('3.2.2.2#0:2(a)');
    const newLayout = ladder('3.2.2.2#0:2(b)');

    expect(builtUp.map((b) => ceiling(b.maxFar))).toEqual([2.0, 3.0, 3.0, 5.25, Infinity]);
    expect(newLayout.map((b) => ceiling(b.maxFar))).toEqual([5.0, 5.0, 8.75, Infinity]);

    for (const b of builtUp) expect(b.baseFar).toBe(BASE_FAR.group_housing.built_up);
    for (const b of newLayout) expect(b.baseFar).toBe(BASE_FAR.group_housing.non_built_up);

    // The engine's ladders must carry the same ceilings, ignoring its explicit
    // zero-FAR bands below the gazette's first row.
    const engineCeilings = (t: readonly { maxFar: number }[]) =>
      t.map((b) => b.maxFar).filter((f) => f !== 0);
    expect(engineCeilings(GROUP_HOUSING_MAX_FAR.built_up)).toEqual([2.0, 3.0, 3.0, 5.25, Infinity]);
    expect(engineCeilings(GROUP_HOUSING_MAX_FAR.non_built_up)).toEqual([5.0, 5.0, 8.75, Infinity]);
  });

  // Clause 3.2.2.3 rows 3(a)/3(b) — shops.
  it('shops: separate ceilings for built-up and non-built-up', () => {
    expect(ladder('3.2.2.3#0:3(a)').map((b) => ceiling(b.maxFar))).toEqual([2.1, 3.0, 5.0, Infinity]);
    expect(ladder('3.2.2.3#0:3(b)').map((b) => ceiling(b.maxFar))).toEqual([2.45, 3.5, 6.0, Infinity]);

    const engineCeilings = (t: readonly { maxFar: number }[]) =>
      t.map((b) => b.maxFar).filter((f) => f !== 0);
    expect(engineCeilings(COMMERCIAL_MAX_FAR.built_up)).toEqual([2.1, 3.0, 5.0, Infinity]);
    expect(engineCeilings(COMMERCIAL_MAX_FAR.non_built_up)).toEqual([2.45, 3.5, 6.0, Infinity]);
    for (const b of ladder('3.2.2.3#0:3(a)')) expect(b.baseFar).toBe(BASE_FAR.commercial.built_up);
    for (const b of ladder('3.2.2.3#0:3(b)')) expect(b.baseFar).toBe(BASE_FAR.commercial.non_built_up);
  });
});

describe.skipIf(!present)('the extraction stayed sane', () => {
  const matrix = present ? JSON.parse(readFileSync(MATRIX, 'utf-8')) : { rows: [], unparsed: [] };

  it('parsed every row it saw', () => {
    expect(matrix.unparsed).toHaveLength(0);
  });

  it('covers all seven clauses of the matrix', () => {
    const clauses = [...new Set(matrix.rows.map((r: { clause: string }) => r.clause))].sort();
    expect(clauses).toEqual(['3.2.2.1', '3.2.2.2', '3.2.2.3', '3.2.2.4',
                            '3.2.2.5', '3.2.2.6', '3.2.2.7']);
  });

  it('keeps occupancies distinct across sub-tables that all restart at Sl. 1', () => {
    // Seven sub-tables each number from 1, so plotted residential, non-bedded medical
    // establishments, farmhouses, industrial buildings and open spaces are all "1".
    const ones = matrix.rows.filter((r: { sl: string }) => r.sl === '1');
    const keys = new Set(ones.map((r: { key: string }) => r.key));
    expect(keys.size).toBeGreaterThan(1);
    expect(matrix.occupancyKeys.length).toBeGreaterThanOrEqual(60);
  });

  it('surfaces the gazette’s own defects rather than papering over them', () => {
    const issues = matrix.anomalies.map((a: { issue?: string }) => a.issue).join(' ');
    expect(issues).toMatch(/no use type printed/);
    const blank = matrix.rows.filter((r: Row) => r.baseFar === null && r.maxFar === null);
    expect(blank.length).toBeGreaterThan(0); // Sl. 11 Cold Storage: a road width and nothing else
  });
});
