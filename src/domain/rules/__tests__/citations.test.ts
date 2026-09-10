import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CITATIONS, CITED_RULES, GAZETTE_SOURCE } from '../citations';
import { RULES } from '../registry';

/**
 * The gate. A figure in `src/domain` may be presented as the byelaw only if a line of
 * the gazette says so, and this checks that the line still says it.
 *
 * It fails in three ways, each of which is a real problem:
 *   - the quote is not in the source at all       → the figure was assumed, not read
 *   - the quote is in the source at a different line → the source was re-extracted; re-read
 *   - a rule claims `confidence: 'gazette'` with no citation → an unbacked claim
 */

const source = readFileSync(resolve(process.cwd(), GAZETTE_SOURCE), 'utf-8').split('\n');
const at = (line: number): string => (source[line - 1] ?? '').trim();
const squash = (s: string): string => s.replace(/\s+/g, ' ').trim();

describe('citations resolve against the gazette', () => {
  it('has the source file the citations point at', () => {
    expect(source.length).toBeGreaterThan(10_000);
  });

  it.each(CITATIONS.filter((c) => c.kind === 'prose'))(
    '$id — $clause',
    (c) => {
      if (c.kind !== 'prose') return;
      const found = squash(at(c.line));
      if (found === squash(c.text)) return;

      // Not at the recorded line. Say where it actually is, so the fix is one edit.
      const elsewhere = source.findIndex((l) => squash(l) === squash(c.text));
      throw new Error(
        elsewhere >= 0
          ? `${c.id}: the text has moved to line ${elsewhere + 1} (recorded ${c.line}). Update the citation.`
          : `${c.id}: line ${c.line} does not carry this text and it is nowhere in the source.\n` +
            `  expected: ${squash(c.text).slice(0, 160)}\n` +
            `  found:    ${found.slice(0, 160)}`,
      );
    },
  );

  it.each(CITATIONS.filter((c) => c.kind === 'cells'))(
    '$id — $clause',
    (c) => {
      if (c.kind !== 'cells') return;
      const [from, to] = c.lines;
      const actual: string[] = [];
      for (let n = from; n <= to; n += 1) {
        for (const part of (source[n - 1] ?? '').split('|')) {
          const t = part.trim();
          if (t) actual.push(t);
        }
      }
      expect(actual).toEqual([...c.cells]);
    },
  );
});

describe('a rule may not claim the gazette without one', () => {
  const claimed = Object.values(RULES).filter((r) => r.confidence === 'gazette');

  it('has at least one rule marked as read from the gazette', () => {
    expect(claimed.length).toBeGreaterThan(0);
  });

  it.each(claimed)('$id is cited', (rule) => {
    expect(CITED_RULES.has(rule.id)).toBe(true);
  });

  it('carries a checked date on every gazette-confidence rule', () => {
    for (const rule of claimed) {
      expect(rule.checked, `${rule.id} has no checked date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('points every citation at a rule that exists', () => {
    for (const c of CITATIONS) {
      expect(RULES[c.rule], `citation ${c.id} names unknown rule ${c.rule}`).toBeDefined();
    }
  });
});
