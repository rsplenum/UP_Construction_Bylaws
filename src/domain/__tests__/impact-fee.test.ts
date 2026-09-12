import { describe, expect, it } from 'vitest';
import {
  HOTEL_EXEMPTION_EXCLUDES,
  IMPACT_FEE_FORMULA_CONSTANT,
  IMPACT_FEE_MATRIX,
  IMPACT_FEE_USES,
  IMPACT_FEE_USE_OF,
  IMPACT_FEE_ZONE_GROUPS,
  ZONE_GROUP_OF,
  assessImpactFee,
} from '../impact-fee';
import { OCCUPANCIES, type OccupancyId } from '../occupancy';
import { ZONES, ZONE_LABEL, type ZoneCode } from '../zoning';

/**
 * Clause 15.4 prints one worked example beside its formula, and reproducing it is the
 * strongest check available on this module — it tests the drafter's own arithmetic rather
 * than a reading of it.
 */
describe('Clause 15.4 — the gazette’s own worked example', () => {
  // "For permission of nursing home in Residential area: Area of the Plot 350 square
  // meters. The current residential rate of the authority is Rs 2000 per square meter.
  // Impact Fee payable: - (Area of the plot) x (Circle rate) x (Coefficient X 0.25)
  // That means 350 x 2000 x 0.25 x 0.25 = Rs 43,750/-"
  //
  // A nursing home is a Public & Semi-public Facility; "Residential area" is the R/RA
  // column. That cell reads 0.25 (1).
  const nursingHome = assessImpactFee({
    occupancy: 'inst_health',
    zone: 'R',
    plotAreaSqm: 350,
    circleRate: 2_000,
  });

  it('reaches the printed figure of ₹43,750', () => {
    expect(nursingHome.state).toBe('payable');
    expect(nursingHome.fee).toBe(43_750);
  });

  it('reads the coefficient the example implies, from the cell the example points at', () => {
    expect(nursingHome.use).toBe('public_semi_public');
    expect(nursingHome.zoneGroup).toBe('R_RA');
    expect(nursingHome.coefficient).toBe(0.25);
  });

  /**
   * V-063, stated as a test rather than only as prose.
   *
   * The example's own coefficient is 0.25, so "0.25 x 0.25" is equally consistent with the
   * trailing factor being a constant and with it belonging to the coefficient. The two
   * readings are indistinguishable on this example and differ by 4× everywhere else, so
   * both are computed here and the divergence is pinned. If a later reading settles it the
   * other way, this is the test that has to change.
   */
  it('cannot be settled by the example alone, and the divergence is 4×', () => {
    const asConstant = 350 * 2_000 * 0.25 * IMPACT_FEE_FORMULA_CONSTANT;
    const asPartOfCoefficient = 350 * 2_000 * 0.25;
    expect(asConstant).toBe(43_750);
    expect(asPartOfCoefficient).toBe(175_000);
    expect(asPartOfCoefficient / asConstant).toBe(4);
    // The engine applies the constant reading.
    expect(nursingHome.fee).toBe(asConstant);
  });
});

describe('the matrix, as Clause 15.4 prints it', () => {
  it('is seven activity rows against eight zone columns', () => {
    expect(IMPACT_FEE_USES).toHaveLength(7);
    expect(IMPACT_FEE_ZONE_GROUPS).toHaveLength(8);
    for (const use of IMPACT_FEE_USES) {
      expect(Object.keys(IMPACT_FEE_MATRIX[use]).sort()).toEqual([...IMPACT_FEE_ZONE_GROUPS].sort());
    }
  });

  /**
   * The check that the column mapping is right, and the reason the PDF had to be read
   * rather than the flattened text: the unfilled cell in every row is the row's own zone.
   * A use in its own zone is not a change of use, so the clause does not reach it. If any
   * coefficient had been placed one column out, this diagonal would break.
   */
  it('marks exactly one cell per row not-applicable, and it is the row’s own zone', () => {
    const ownZone: Partial<Record<string, string>> = {
      agriculture_greenbelt_park: 'A_GB_RC_HF',
      public_semi_public: 'PSP',
      traffic_transportation: 'TT',
      industrial: 'SI_LI',
      residential: 'R_RA',
      office: 'OB',
      commercial: 'MU_C1_C2',
    };
    for (const use of IMPACT_FEE_USES) {
      const notApplicable = IMPACT_FEE_ZONE_GROUPS
        .filter((z) => IMPACT_FEE_MATRIX[use][z].state === 'not-applicable');
      expect(notApplicable, use).toEqual([ownZone[use]]);
    }
  });

  /**
   * The count the two extraction paths agree on. `chapter-15.json` gives 22 green cells by
   * fill; `gazette-tmpr8.txt` gives 22 coefficient strings in the same row order. Where two
   * independent pipelines agree, `docs/source/README.md` treats the figure as settled.
   */
  it('carries 24 payable coefficients, in the per-row counts both extractions give', () => {
    const perRow = IMPACT_FEE_USES.map((use) =>
      IMPACT_FEE_ZONE_GROUPS.filter((z) => IMPACT_FEE_MATRIX[use][z].state === 'payable').length);
    expect(perRow).toEqual([0, 2, 3, 4, 4, 5, 6]);
    expect(perRow.reduce((a, b) => a + b, 0)).toBe(24);
  });

  /** The whole BU column, which is Clause 15.4's first prose exemption restated as colour. */
  it('charges nothing anywhere in the built-up column', () => {
    for (const use of IMPACT_FEE_USES) {
      expect(IMPACT_FEE_MATRIX[use].BU.state, use).toBe('not-payable');
    }
  });

  /**
   * The ordering the clause is named after. Reading down a column, the coefficient rises
   * with the order of the use; reading along a row, it falls as the zone rises. Both follow
   * from "for allowing higher use activities in lower land use zones" and neither was
   * assumed — the table is transcribed, and this checks the transcription against the rule
   * the clause states in words.
   */
  it('rises with the order of the use, in every column that charges twice or more', () => {
    for (const zone of IMPACT_FEE_ZONE_GROUPS) {
      const ladder = IMPACT_FEE_USES
        .map((use) => IMPACT_FEE_MATRIX[use][zone])
        .filter((c) => c.state === 'payable')
        .map((c) => (c as { coefficient: number }).coefficient);
      const sorted = [...ladder].sort((a, b) => a - b);
      expect(ladder, zone).toEqual(sorted);
    }
  });

  /**
   * V-065. The same expectation read along a row holds in five of the six charging rows and
   * fails in two cells — and those two are the gazette's, not a transcription slip. Both
   * were re-derived from `chapter-15.json` by cell x-position, independently of the
   * flattened text's row order.
   *
   *   Traffic & Transportation   A/GB 0.3   PSP 0.1   …   R/RA 0.30
   *   Industrial                 A/GB 0.4   PSP 0.25  TT 0.25   R/RA 0.40
   *
   * In both, the R/RA cell — zone 5 of 7 — climbs back to the value of the A/GB cell, which
   * is zone 1. Every other row falls monotonically across the whole ladder. These are also
   * the only two cells on the page written with a trailing zero, "0.30" and "0.40", against
   * "0.3" and "0.4" in the same rows, which reads like a second authoring pass.
   *
   * The engine charges what is printed. This test exists so the irregularity is recorded
   * where someone re-reading the clause will meet it, rather than smoothed into the pattern
   * the rest of the table follows.
   */
  it('falls as the zone rises along every row but two, and those two are the gazette’s', () => {
    const descending = (use: typeof IMPACT_FEE_USES[number]): boolean => {
      const ladder = IMPACT_FEE_ZONE_GROUPS
        .filter((z) => z !== 'BU')
        .map((z) => IMPACT_FEE_MATRIX[use][z])
        .filter((c) => c.state === 'payable')
        .map((c) => (c as { coefficient: number }).coefficient);
      return ladder.every((v, i) => i === 0 || ladder[i - 1] >= v);
    };

    expect(IMPACT_FEE_USES.filter((use) => !descending(use)))
      .toEqual(['traffic_transportation', 'industrial']);

    // Pinned exactly, because the value is the whole question.
    expect(IMPACT_FEE_MATRIX.traffic_transportation.PSP).toEqual({ state: 'payable', coefficient: 0.1 });
    expect(IMPACT_FEE_MATRIX.traffic_transportation.R_RA).toEqual({ state: 'payable', coefficient: 0.3 });
    expect(IMPACT_FEE_MATRIX.traffic_transportation.A_GB_RC_HF).toEqual({ state: 'payable', coefficient: 0.3 });
    expect(IMPACT_FEE_MATRIX.industrial.R_RA).toEqual({ state: 'payable', coefficient: 0.4 });
    expect(IMPACT_FEE_MATRIX.industrial.A_GB_RC_HF).toEqual({ state: 'payable', coefficient: 0.4, note: 2 });
  });

  it('puts the dearest cell at commercial-in-agricultural, at 1.5', () => {
    const cell = IMPACT_FEE_MATRIX.commercial.A_GB_RC_HF;
    expect(cell).toEqual({ state: 'payable', coefficient: 1.5 });
  });
});

describe('the fee', () => {
  it('is plot area × circle rate × coefficient × 0.25', () => {
    const r = assessImpactFee({
      occupancy: 'com_complex', zone: 'A', plotAreaSqm: 1_000, circleRate: 30_000,
    });
    expect(r.state).toBe('payable');
    expect(r.coefficient).toBe(1.5);
    expect(r.fee).toBe(1_000 * 30_000 * 1.5 * 0.25);
    expect(r.fee).toBe(11_25_000_0); // ₹1.125 crore
  });

  it('is nothing where the cell is blue — a lower use in a higher zone', () => {
    const r = assessImpactFee({
      occupancy: 'res_single', zone: 'C-1', plotAreaSqm: 1_000, circleRate: 30_000,
    });
    expect(r.state).toBe('not-payable');
    expect(r.fee).toBe(0);
  });

  it('is nothing in the use’s own zone', () => {
    const r = assessImpactFee({
      occupancy: 'res_single', zone: 'R', plotAreaSqm: 1_000, circleRate: 30_000,
    });
    expect(r.state).toBe('not-applicable');
    expect(r.fee).toBe(0);
  });

  it('is nothing in the built-up area, whatever the use', () => {
    for (const occupancy of Object.keys(OCCUPANCIES) as OccupancyId[]) {
      const r = assessImpactFee({ occupancy, zone: 'BU', plotAreaSqm: 500, circleRate: 20_000 });
      expect(r.fee, occupancy).toBe(0);
      expect(['not-payable', 'undetermined'], occupancy).toContain(r.state);
    }
  });

  it('scales with the plot and the rate, and with nothing else', () => {
    const base = assessImpactFee({
      occupancy: 'office', zone: 'R', plotAreaSqm: 500, circleRate: 20_000,
    });
    const doubleArea = assessImpactFee({
      occupancy: 'office', zone: 'R', plotAreaSqm: 1_000, circleRate: 20_000,
    });
    const doubleRate = assessImpactFee({
      occupancy: 'office', zone: 'R', plotAreaSqm: 500, circleRate: 40_000,
    });
    expect(doubleArea.fee).toBe(base.fee * 2);
    expect(doubleRate.fee).toBe(base.fee * 2);
  });

  it('treats a missing rate or area as zero rather than NaN', () => {
    const r = assessImpactFee({
      occupancy: 'com_complex', zone: 'A',
      plotAreaSqm: Number.NaN, circleRate: undefined as unknown as number,
    });
    expect(r.fee).toBe(0);
    expect(r.state).toBe('payable');
  });
});

describe('the exemptions', () => {
  /**
   * The hotel exemption is broader than the cell it displaces: Clause 15.4 exempts hotels
   * in every land use except six named ones, three of which are Clause 15.3 zones. The
   * commercial row would otherwise charge a hotel 1.0 in a residential zone.
   */
  it('lifts the fee off a hotel everywhere except the zones the clause names back', () => {
    const inResidential = assessImpactFee({
      occupancy: 'com_hotel', zone: 'R', plotAreaSqm: 1_000, circleRate: 30_000,
    });
    expect(inResidential.state).toBe('exempt');
    expect(inResidential.fee).toBe(0);
    // The coefficient it would have paid is still reported, so the exemption is auditable.
    expect(inResidential.coefficient).toBe(1);

    for (const zone of HOTEL_EXEMPTION_EXCLUDES) {
      const r = assessImpactFee({
        occupancy: 'com_hotel', zone, plotAreaSqm: 1_000, circleRate: 30_000,
      });
      expect(r.state, zone).toBe('payable');
      expect(r.fee, zone).toBeGreaterThan(0);
    }
  });

  it('does not extend the hotel exemption to any other commercial use', () => {
    const r = assessImpactFee({
      occupancy: 'com_mall', zone: 'R', plotAreaSqm: 1_000, circleRate: 30_000,
    });
    expect(r.state).toBe('payable');
  });

  /**
   * Three of the four cell footnotes and all four prose exemptions turn on facts no field
   * supplies. A caveat is the only honest output for those: an exemption the engine cannot
   * see is the difference between a fee and no fee.
   */
  it('says so on every payable assessment', () => {
    const r = assessImpactFee({
      occupancy: 'inst_education', zone: 'R', plotAreaSqm: 1_000, circleRate: 30_000,
    });
    expect(r.state).toBe('payable');
    // The cell is marked (1) — non-commercial and charitable uses are exempt.
    expect(r.cellNote).toBe('Non-Commercial and Charitable Activities/Uses');
    expect(r.caveats.length).toBeGreaterThanOrEqual(5);
    expect(r.caveats.join(' ')).toMatch(/charitable/i);
    expect(r.caveats.join(' ')).toMatch(/one week/i);
  });
});

describe('what it refuses to answer', () => {
  it('will not guess at a fee without a zone', () => {
    const r = assessImpactFee({
      occupancy: 'com_complex', zone: 'unknown', plotAreaSqm: 1_000, circleRate: 30_000,
    });
    expect(r.state).toBe('undetermined');
    expect(r.fee).toBe(0);
  });

  /**
   * Clause 15.3 has sixteen zones and Clause 15.4's matrix has columns for fifteen. `F`
   * (Facility/Utility) is the one it omits, and borrowing a neighbouring column would be
   * inventing a coefficient the gazette does not print.
   */
  it('names the one zone Clause 15.4 prints no column for', () => {
    const unmapped = (ZONES as readonly ZoneCode[]).filter((z) => !ZONE_GROUP_OF[z]);
    expect(unmapped).toEqual(['F']);

    const r = assessImpactFee({
      occupancy: 'com_complex', zone: 'F', plotAreaSqm: 1_000, circleRate: 30_000,
    });
    expect(r.state).toBe('undetermined');
    expect(r.fee).toBe(0);
    expect(r.reason).toMatch(/fifteen/);
  });

  it('maps every other zone onto a column', () => {
    for (const zone of ZONES as readonly ZoneCode[]) {
      if (zone === 'F') continue;
      expect(ZONE_GROUP_OF[zone], `${zone} — ${ZONE_LABEL[zone]}`).toBeDefined();
    }
  });

  /**
   * Mixed use is a zone in this table, not an activity — exactly as it is in Clause 15.3.
   * The table gives no rule for splitting one plot between the residential and commercial
   * rows, so the engine reports the row as undetermined rather than picking one.
   */
  it('will not place a mixed-use building on a row the clause does not print', () => {
    expect(IMPACT_FEE_USE_OF.mixed_use).toBeUndefined();
    const r = assessImpactFee({
      occupancy: 'mixed_use', zone: 'R', plotAreaSqm: 1_000, circleRate: 30_000,
    });
    expect(r.state).toBe('undetermined');
    expect(r.fee).toBe(0);
  });

  it('places every other occupancy on exactly one row', () => {
    for (const occupancy of Object.keys(OCCUPANCIES) as OccupancyId[]) {
      if (occupancy === 'mixed_use') continue;
      expect(IMPACT_FEE_USE_OF[occupancy], occupancy).toBeDefined();
    }
  });
});
