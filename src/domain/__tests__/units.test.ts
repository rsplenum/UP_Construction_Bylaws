import { describe, expect, it } from 'vitest';
import {
  AREA_UNITS, formatArea, formatBoth, fromSqm, isAreaUnit, toSqm, type AreaUnit,
} from '../units';
import { EXEMPT_RESIDENTIAL_MAX_SQM, INSTANT_RESIDENTIAL_MAX_SQM } from '../permission';

describe('the units a plot owner uses', () => {
  it('holds the exact definitions, not approximations', () => {
    // 1 gaj = 1 square yard = 9 square feet, exactly. A rounded factor drifts across a
    // statutory threshold on a large plot, which is the one place it must not.
    expect(toSqm(1, 'gaj')).toBeCloseTo(9 * toSqm(1, 'sqft'), 12);
    expect(toSqm(1, 'sqm')).toBe(1);
  });

  it('round-trips every unit without loss', () => {
    for (const unit of AREA_UNITS) {
      for (const value of [1, 200, 1_337.5, 20_000]) {
        expect(fromSqm(toSqm(value, unit), unit)).toBeCloseTo(value, 9);
      }
    }
  });

  it('converts the sizes people actually quote', () => {
    expect(toSqm(200, 'gaj')).toBeCloseTo(167.23, 2);   // "a 200 gaj plot"
    expect(toSqm(1_800, 'sqft')).toBeCloseTo(167.23, 2); // the same plot, in sq ft
    expect(fromSqm(300, 'gaj')).toBeCloseTo(358.8, 1);
  });

  /**
   * The thresholds the UP press reported as "1,000 sq ft" and "5,000 sq ft" are the
   * engine's 100 m² and 500 m². A reader should recognise their own plot in them.
   */
  it('renders the statutory thresholds in the reader’s own unit', () => {
    expect(formatArea(EXEMPT_RESIDENTIAL_MAX_SQM, 'gaj')).toBe('120 gaj');
    expect(formatArea(EXEMPT_RESIDENTIAL_MAX_SQM, 'sqft')).toBe('1,076 sq ft');
    expect(formatArea(INSTANT_RESIDENTIAL_MAX_SQM, 'gaj')).toBe('598 gaj');
    expect(formatArea(INSTANT_RESIDENTIAL_MAX_SQM, 'sqft')).toBe('5,382 sq ft');
  });

  it('shows the byelaws’ own figure alongside, except when that is what you asked for', () => {
    expect(formatBoth(167.23, 'gaj')).toBe('200 gaj (167.2 m²)');
    expect(formatBoth(167.23, 'sqm')).toBe('167.2 m²');
  });

  it('never rounds a plot onto a statutory threshold it is actually over', () => {
    // 500 m² is the instant-approval ceiling. Showing 500.4 as "500 m²" would tell a
    // reader they qualify for a route they have just missed.
    expect(formatArea(500.4, 'sqm')).toBe('500.4 m²');
    expect(formatArea(99.5, 'sqm')).toBe('99.5 m²');
    expect(formatArea(100.2, 'sqm')).toBe('100.2 m²');
    // Far above every threshold the decimal is noise.
    expect(formatArea(5_000.4, 'sqm')).toBe('5,000 m²');
  });

  it('guards the stored value', () => {
    expect(isAreaUnit('gaj')).toBe(true);
    for (const bad of ['bigha', '', null, 9]) expect(isAreaUnit(bad)).toBe(false);
  });

  it('treats junk as zero rather than NaN, so a half-typed number cannot poison a verdict', () => {
    expect(toSqm(Number.NaN, 'gaj')).toBe(0);
    expect(fromSqm(Number.NaN, 'sqft')).toBe(0);
  });
});
