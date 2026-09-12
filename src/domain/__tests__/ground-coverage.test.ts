import { describe, expect, it } from 'vitest';
import {
  MASTER_PLAN_CAP_NOTE, PRINTED_PERCENTAGE_CAPS, resolveGroundCoverage,
} from '../ground-coverage';
import { OCCUPANCIES, type OccupancyId } from '../occupancy';
import { resolveRequiredSetbacks } from '../setbacks';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT } from '../project';

const SETBACKS = { front: 3, rear: 3, side1: 1.5, side2: 1.5 };

/**
 * The claim this module exists to make, and the one an engine is most likely to get wrong
 * in the restrictive direction: Clause 3.2.2 prints a "Ground Coverage (%)" column and no
 * percentage in it, for every use this engine models.
 */
describe('Clause 3.2.2 caps coverage with the setbacks, not a percentage', () => {
  it('reports no cap for every one of the sixteen occupancies', () => {
    for (const occupancy of Object.keys(OCCUPANCIES) as OccupancyId[]) {
      const r = resolveGroundCoverage({
        occupancy,
        plotAreaSqm: 500,
        plotFrontageM: 20,
        plotDepthM: 25,
        required: SETBACKS,
      });
      expect(r.capPct, occupancy).toBeNull();
      expect(r.capSqm, occupancy).toBeNull();
      expect(r.basis, occupancy).toBe('setback_limited');
      expect(r.restrictedByCap, occupancy).toBe(false);
      // The governing footprint is the whole envelope, not a fraction of the plot.
      expect(r.governingSqm, occupancy).toBe(r.envelopeSqm);
    }
  });

  /**
   * Clause 2.1.3.2's worked example, which is the gazette doing this arithmetic itself:
   * a 500 m² plot at 20 m × 25 m, "maximum ground coverage after ensuring minimum setbacks",
   * and the permissible coverage stated as 76 percent.
   *
   * With the Clause 3.2.4.1 setbacks for a 500 m² plot the engine reaches the same figure.
   * Any reading that clipped coverage at 50% or 60% would contradict the drafter's own sum —
   * and would under-report the buildable footprint on this plot by a fifth.
   */
  it('reaches the 76 percent the gazette computes for a 20 m × 25 m plot', () => {
    const required = resolveRequiredSetbacks({
      occupancy: 'res_single',
      plotArea: 500,
      buildingHeight: 12,
      isCornerPlot: false,
    });

    const r = resolveGroundCoverage({
      occupancy: 'res_single',
      plotAreaSqm: 500,
      plotFrontageM: 20,
      plotDepthM: 25,
      required,
    });

    expect(r.envelopePct).toBe(76);
    expect(r.governingPct).toBe(76);
    // Stated the other way: the figure a percentage-capped reading would have produced.
    expect(r.governingSqm).toBeGreaterThan((500 * 60) / 100);
  });

  it('names the clause it read, per occupancy', () => {
    const clauseOf = (occupancy: OccupancyId) => resolveGroundCoverage({
      occupancy, plotAreaSqm: 500, plotFrontageM: 20, plotDepthM: 25, required: SETBACKS,
    }).clauseRef;

    expect(clauseOf('res_single')).toBe('Clause 3.2.2.1');
    expect(clauseOf('res_group_housing')).toBe('Clause 3.2.2.2');
    expect(clauseOf('com_mall')).toBe('Clause 3.2.2.3');
    expect(clauseOf('inst_health')).toBe('Clause 3.2.2.4');
    expect(clauseOf('inst_education')).toBe('Clause 3.2.2.5');
    expect(clauseOf('inst_assembly')).toBe('Clause 3.2.2.6');
    expect(clauseOf('ind_general')).toBe('Clause 3.2.2.7');
    // Bazaar street has its own chapter, and Clause 5.1.4 is where it restates the rule.
    expect(clauseOf('com_bazaar')).toBe('Clause 5.1.4, with Clause 3.2.2.3');
  });

  it('says in terms that the setbacks are the cap', () => {
    const r = resolveGroundCoverage({
      occupancy: 'res_single', plotAreaSqm: 500, plotFrontageM: 20, plotDepthM: 25,
      required: SETBACKS,
    });
    expect(r.basisNote).toMatch(/prints no coverage percentage/);
    expect(r.basisNote).toMatch(/Max. coverage after ensuring setbacks/);
  });
});

describe('the envelope arithmetic', () => {
  it('is the plot less the required setbacks on each face', () => {
    const r = resolveGroundCoverage({
      occupancy: 'res_single',
      plotAreaSqm: 500,
      plotFrontageM: 20,
      plotDepthM: 25,
      required: { front: 4.5, rear: 3, side1: 2, side2: 2 },
    });
    expect(r.envelopeWidthM).toBe(16);      // 20 − 2 − 2
    expect(r.envelopeDepthM).toBe(17.5);    // 25 − 4.5 − 3
    expect(r.envelopeSqm).toBe(280);
    expect(r.envelopePct).toBe(56);
  });

  /**
   * Kept exact on purpose. `findings.ts` tests the envelope against the 2.4 m minimum
   * habitable room width, and rounding the dimensions here would move that boundary by up
   * to 5 mm — the class of numeric-edge defect `bands.ts` exists to prevent.
   */
  it('does not round the dimensions it returns', () => {
    const r = resolveGroundCoverage({
      occupancy: 'res_single',
      plotAreaSqm: 100,
      plotFrontageM: 10.004,
      plotDepthM: 10,
      required: { front: 1, rear: 1, side1: 3.8, side2: 3.8 },
    });
    expect(r.envelopeWidthM).toBeCloseTo(2.404, 10);
    expect(r.envelopeWidthM).not.toBe(2.4);
  });

  it('never returns a negative envelope when the setbacks exceed the plot', () => {
    const r = resolveGroundCoverage({
      occupancy: 'res_single',
      plotAreaSqm: 40,
      plotFrontageM: 4,
      plotDepthM: 10,
      required: { front: 6, rear: 6, side1: 3, side2: 3 },
    });
    expect(r.envelopeWidthM).toBe(0);
    expect(r.envelopeDepthM).toBe(0);
    expect(r.envelopeSqm).toBe(0);
    expect(r.governingPct).toBe(0);
  });

  it('treats a missing frontage or area as zero rather than NaN', () => {
    const r = resolveGroundCoverage({
      occupancy: 'res_single',
      plotAreaSqm: Number.NaN,
      plotFrontageM: undefined as unknown as number,
      plotDepthM: 25,
      required: SETBACKS,
    });
    expect(r.envelopeSqm).toBe(0);
    expect(r.envelopePct).toBe(0);
    expect(Number.isNaN(r.governingPct)).toBe(false);
  });
});

/**
 * The dual-constraint case. Clause 3.2.2 never reaches it for the sixteen occupancies, so
 * the cap can only come from outside the byelaws — `zonalCoverageCapPct` on the project, or
 * one of `PRINTED_PERCENTAGE_CAPS` once an occupancy reaches it. When it does, the setback
 * envelope and the coverage cap are two constraints rather than one, and the smaller governs.
 */
describe('when a percentage cap does bind', () => {
  it('clips the footprint and says which instrument governs', () => {
    const r = resolveGroundCoverage({
      occupancy: 'com_complex',
      plotAreaSqm: 1_000,
      plotFrontageM: 40,
      plotDepthM: 25,
      required: { front: 6, rear: 3, side1: 3, side2: 3 },
      capPct: 50,
    });

    // The setbacks alone would leave 34 × 16 = 544 m², which is 54.4% of the plot.
    expect(r.envelopeSqm).toBe(544);
    expect(r.envelopePct).toBe(54.4);

    expect(r.restrictedByCap).toBe(true);
    expect(r.basis).toBe('percentage_cap');
    expect(r.capSqm).toBe(500);
    expect(r.governingSqm).toBe(500);
    expect(r.governingPct).toBe(50);
    expect(r.basisNote).toMatch(/The cap governs/);
  });

  it('leaves the envelope alone where the cap is looser than the setbacks', () => {
    const r = resolveGroundCoverage({
      occupancy: 'com_complex',
      plotAreaSqm: 1_000,
      plotFrontageM: 40,
      plotDepthM: 25,
      required: { front: 6, rear: 3, side1: 3, side2: 3 },
      capPct: 80,
    });
    expect(r.restrictedByCap).toBe(false);
    expect(r.basis).toBe('setback_limited');
    expect(r.governingSqm).toBe(544);
    // The cap is still reported, because an applicant needs to know it exists.
    expect(r.capPct).toBe(80);
    expect(r.capSqm).toBe(800);
  });

  it('treats a zero cap as a cap, not as an absent one', () => {
    const r = resolveGroundCoverage({
      occupancy: 'com_complex',
      plotAreaSqm: 1_000,
      plotFrontageM: 40,
      plotDepthM: 25,
      required: { front: 6, rear: 3, side1: 3, side2: 3 },
      capPct: 0,
    });
    expect(r.capPct).toBe(0);
    expect(r.restrictedByCap).toBe(true);
    expect(r.governingSqm).toBe(0);
  });
});

describe('the caps the gazette prints for uses this engine has no occupancy for', () => {
  it('records all four, with the clause each comes from', () => {
    expect(PRINTED_PERCENTAGE_CAPS.map((c) => c.capPct)).toEqual([10, 20, 20, 35]);
    for (const cap of PRINTED_PERCENTAGE_CAPS) {
      expect(cap.clause, cap.use).toMatch(/^Clause /);
      expect(cap.note.length, cap.use).toBeGreaterThan(20);
    }
  });

  it('keeps the riverbank 35% as the one flat replacement for the envelope', () => {
    const ganga = PRINTED_PERCENTAGE_CAPS.find((c) => c.capPct === 35)!;
    expect(ganga.clause).toBe('Clause 2.11(i)(a)');
    expect(ganga.use).toMatch(/Ganga/);
  });
});

describe('what the byelaws cannot settle', () => {
  /**
   * A master plan may cap coverage below the setback envelope. `upGisMasterPlanData.ts`
   * carries such figures, and they are deliberately not applied: that dataset is
   * illustrative zoning rather than a notified plan for any particular plot, and reading it
   * into a statutory computation would present a guess about which polygon a plot sits in
   * as law. The caveat travels with every answer instead.
   */
  it('says on every answer that a master plan may bind tighter', () => {
    for (const occupancy of Object.keys(OCCUPANCIES) as OccupancyId[]) {
      const r = resolveGroundCoverage({
        occupancy, plotAreaSqm: 500, plotFrontageM: 20, plotDepthM: 25, required: SETBACKS,
      });
      expect(r.masterPlanCapNote, occupancy).toBe(MASTER_PLAN_CAP_NOTE);
    }
    expect(MASTER_PLAN_CAP_NOTE).toMatch(/its figure governs/);
  });
});

/**
 * The whole path, from the field the applicant fills to the finding the panel renders.
 *
 * `zonalCoverageCapPct` is the one way a percentage cap reaches this engine, and it exists
 * because the engine must not invent one (V-064). These check that a figure entered there
 * actually governs, and that leaving it alone leaves the byelaw answer standing.
 */
describe('through assessProject, from the applicant’s own zonal plan', () => {
  const base = {
    ...DEFAULT_PROJECT,
    occupancy: 'com_complex' as const,
    plotArea: 1_000,
    plotFrontage: 40,
    plotDepth: 25,
    roadWidth: 24,
    buildingHeight: 14,
  };

  const coverageFinding = (project: typeof base) =>
    assessProject(project).findings.find((f) => f.id === 'ground-coverage')!;

  it('reports the setback envelope as the cap when no zonal figure is given', () => {
    const f = coverageFinding({ ...base, zonalCoverageCapPct: 0 });
    expect(f.status).toBe('ok');
    expect(f.required).toMatch(/No percentage cap/);
    expect(f.headline).toMatch(/whole/);
    // 64.8% — above the 60% an assumed cap would have clipped to.
    expect(f.headline).toMatch(/64\.8%|647/);
  });

  it('clips to a zonal figure the applicant does give, and says the cap governs', () => {
    const f = coverageFinding({ ...base, zonalCoverageCapPct: 50 });
    expect(f.required).toMatch(/≤ 50%/);
    expect(f.headline).toMatch(/capped/);
    expect(f.detail).toMatch(/The cap governs/);
  });

  it('ignores a zonal figure looser than the setbacks already are', () => {
    const f = coverageFinding({ ...base, zonalCoverageCapPct: 90 });
    expect(f.headline).toMatch(/whole/);
    expect(f.detail).toMatch(/prints no coverage percentage/);
  });

  it('always carries the clause and the master-plan caveat', () => {
    const f = coverageFinding({ ...base, zonalCoverageCapPct: 0 });
    expect(f.clause).toBe('Clause 3.2.2.3 (gazette p.46)');
    expect(f.detail).toContain('may cap ground coverage below what the setbacks leave');
  });
});
