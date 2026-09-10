import { describe, expect, it } from 'vitest';
import {
  SHELTER_FEE_MAX_PLOT_SQM,
  assessSocialHousing,
  shelterFee,
  shelterFeePerUnit,
} from '../social-housing';

/**
 * Chapter 4.3, quoted in the comment above each case.
 */

const RATE = 40_000; // ₹/m²

describe('Clause 4.3.1 — who the reservation applies to', () => {
  // "For all housing projects (except affordable housing schemes) having more than one
  // unit, a 10% each of the total units shall be mandatorily reserved…"
  it('applies to any housing project above one unit', () => {
    const r = assessSocialHousing({ multiUnitHousing: true, plotAreaSqm: 2_000, circleRate: RATE });
    expect(r.applies).toBe(true);
  });

  it('does not apply to a single dwelling', () => {
    const r = assessSocialHousing({ multiUnitHousing: false, plotAreaSqm: 2_000, circleRate: RATE });
    expect(r.applies).toBe(false);
  });

  // Clause 4.4 Note-2: "In such affordable housing schemes, the provisions of paragraph
  // 4.3.1 shall not be applicable, i.e. mandatory EWS and LIG requirements or shelter fee
  // requirements shall not be applicable."
  it('does not apply to an affordable housing scheme, whatever its size', () => {
    const r = assessSocialHousing({
      multiUnitHousing: true, plotAreaSqm: 50_000, circleRate: RATE,
      isAffordableHousingScheme: true,
    });
    expect(r.applies).toBe(false);
    expect(r.reason).toMatch(/4\.4 Note-2/);
  });
});

describe('Clause 4.3.1 — the shelter fee is only available below 4 hectares', () => {
  const at = (plotAreaSqm: number) =>
    assessSocialHousing({ multiUnitHousing: true, plotAreaSqm, circleRate: RATE });

  it('is 40,000 m²', () => {
    expect(SHELTER_FEE_MAX_PLOT_SQM).toBe(40_000);
  });

  it('offers the buy-out below 4 Ha', () => {
    expect(at(39_999).shelterFeeAvailable).toBe(true);
    expect(at(39_999).shelterFeePerUnit).toBeGreaterThan(0);
  });

  // B-015. The engine used to offer the fee at any size, which told a large developer it
  // could buy out an obligation the gazette gives it no way to buy out of.
  it('withholds it at 4 Ha and above', () => {
    for (const area of [40_000, 60_000, 200_000]) {
      const r = at(area);
      expect(r.applies).toBe(true);
      expect(r.shelterFeeAvailable).toBe(false);
      expect(r.shelterFeePerUnit).toBe(0);
      expect(r.reason).toMatch(/have to be built/);
    }
  });
});

describe('Clause 4.3.11 — the fee formula', () => {
  // "Shelter Fees = 10% of [(total number of dwelling units) X (minimum EWS dwelling unit
  // carpet area + minimum LIG dwelling unit carpet area) X Circle Rate]", with the
  // Clause 4.3.3 minimum group-housing carpet areas of 30 m² (EWS) and 35 m² (LIG).
  it('is 6.5 m² of circle rate per dwelling unit', () => {
    expect(shelterFeePerUnit(RATE)).toBeCloseTo(0.10 * (30 + 35) * RATE, 6);
    expect(shelterFeePerUnit(RATE)).toBeCloseTo(6.5 * RATE, 6);
  });

  it('scales with the unit count', () => {
    expect(shelterFee(120, RATE)).toBeCloseTo(120 * 6.5 * RATE, 4);
    expect(shelterFee(0, RATE)).toBe(0);
  });

  it('is zero at a zero circle rate', () => {
    expect(shelterFeePerUnit(0)).toBe(0);
  });
});
