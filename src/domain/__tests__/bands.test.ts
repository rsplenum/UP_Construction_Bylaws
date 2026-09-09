import { describe, expect, it } from 'vitest';
import { assertContiguousLadder, resolveBand } from '../bands';

const LADDER = [
  { overMoreThan: 0, upToAndIncluding: 10, tag: 'a' },
  { overMoreThan: 10, upToAndIncluding: 20, tag: 'b' },
  { overMoreThan: 20, upToAndIncluding: Infinity, tag: 'c' },
];

describe('resolveBand', () => {
  it('matches on the inclusive upper bound', () => {
    expect(resolveBand(LADDER, 10)).toMatchObject({ ok: true, band: { tag: 'a' } });
    expect(resolveBand(LADDER, 20)).toMatchObject({ ok: true, band: { tag: 'b' } });
  });

  it('leaves no hole between adjacent bands', () => {
    // The bug this replaces: 10.005 matched no row and fell through to the last band.
    expect(resolveBand(LADDER, 10.005)).toMatchObject({ ok: true, band: { tag: 'b' } });
    expect(resolveBand(LADDER, 20.000001)).toMatchObject({ ok: true, band: { tag: 'c' } });
  });

  it('reports rather than guesses when the value is below the ladder', () => {
    expect(resolveBand(LADDER, 0)).toMatchObject({ ok: false, reason: 'below-first-band' });
    expect(resolveBand(LADDER, -5)).toMatchObject({ ok: false, reason: 'below-first-band' });
  });

  it('rejects non-finite input rather than guessing a band', () => {
    expect(resolveBand(LADDER, NaN)).toMatchObject({ ok: false, reason: 'no-band-defined' });
    expect(resolveBand(LADDER, Infinity)).toMatchObject({ ok: false, reason: 'no-band-defined' });
  });
});

describe('assertContiguousLadder', () => {
  it('accepts a contiguous open-ended ladder', () => {
    expect(() => assertContiguousLadder('ok', LADDER)).not.toThrow();
  });

  it('rejects a ladder with a hole', () => {
    expect(() =>
      assertContiguousLadder('holey', [
        { overMoreThan: 0, upToAndIncluding: 10 },
        { overMoreThan: 10.01, upToAndIncluding: Infinity },
      ]),
    ).toThrow(/hole/);
  });

  it('rejects a ladder that is not open-ended', () => {
    expect(() =>
      assertContiguousLadder('capped', [{ overMoreThan: 0, upToAndIncluding: 99999 }]),
    ).toThrow(/open-ended/);
  });
});
