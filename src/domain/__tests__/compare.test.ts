import { describe, it, expect } from 'vitest';
import { comparePlots, assumeShape, type PlotCandidate } from '../compare';

const plot = (
  label: string, areaSqm: number, frontRoadM: number,
  askingPriceRupees: number | null = null, sideRoadM: number | null = null,
): PlotCandidate => ({ label, areaSqm, frontRoadM, sideRoadM, askingPriceRupees });

const house = (a: PlotCandidate, b: PlotCandidate) =>
  comparePlots({ a, b, occupancy: 'res_single', areaType: 'built_up' });
const complex = (a: PlotCandidate, b: PlotCandidate) =>
  comparePlots({ a, b, occupancy: 'com_complex', areaType: 'built_up' });

describe('assumeShape', () => {
  it('derives a rectangle at the stated ratio whose area is the one given', () => {
    const { frontageM, depthM } = assumeShape(200);
    expect(depthM / frontageM).toBeCloseTo(2, 1);
    expect(frontageM * depthM).toBeCloseTo(200, 0);
  });
});

describe('a house does not care about the road', () => {
  // This is the belief the module was written to correct. Base FAR is a property of the
  // occupancy and the area type, not of the road (far.ts), and plotted residential tops
  // out at a flat 2.0 at every width — so a wider road buys a house nothing at all.
  it('gives the same floor area, floors and ceiling from a 4.5 m road to a 45 m road', () => {
    const at = (road: number) => house(plot('A', 300, road), plot('B', 300, road)).outcomes[0];
    const base = at(4.5);
    for (const road of [6, 9, 12, 18, 24, 30, 45]) {
      expect(at(road).floorAreaSqm).toBeCloseTo(base.floorAreaSqm, 6);
      expect(at(road).maxFloorAreaSqm).toBeCloseTo(base.maxFloorAreaSqm, 6);
      expect(at(road).floors).toBe(base.floors);
    }
  });

  it('reports two houses on different roads as separated by nothing', () => {
    const c = house(plot('Plot A', 300, 9), plot('Plot B', 300, 30));
    expect(c.level).toBe(true);
    expect(c.headline).toBe('Nothing in the byelaws separates these two plots.');
  });

  it('never lets a smaller residential plot out-build a bigger one', () => {
    for (const road of [4.5, 12, 30]) {
      const c = house(plot('A', 200, road), plot('B', 260, road));
      expect(c.outcomes[0].floorAreaSqm).toBeLessThan(c.outcomes[1].floorAreaSqm);
    }
  });
});

describe('for a commercial plot the road is a gate', () => {
  it('leads with the plot that cannot take the use at all', () => {
    const c = complex(plot('Plot A', 200, 18), plot('Plot B', 400, 9));
    const gate = c.differences[0];
    expect(gate.kind).toBe('roadGate');
    expect(gate.decisive).toBe(true);
    expect(gate.favours).toBe(0);
    expect(gate.note).toContain('Plot B cannot');
    expect(gate.note).toContain('12 m');
    expect(gate.note).toContain('only Plot A is a candidate');
    expect(c.headline).toBe('Plot B cannot be built on \u2014 its road is 9 m and this use needs 12 m.');
  });

  it('says nothing about floor area, floors or route once a plot is barred', () => {
    // Those three are read off an envelope that may not lawfully exist. Reporting them
    // would dress a dead plot in the clothes of a live one — "Plot A takes instant online
    // approval" is true of nothing you can build there.
    const c = complex(plot('Plot A', 200, 18), plot('Plot B', 400, 9));
    expect(c.outcomes[1].floorAreaSqm).toBe(0);
    expect(c.differences.map((d) => d.kind)).toEqual(['roadGate']);
    expect(c.level).toBe(false);
  });

  it('reports both plots barred without calling them equivalent', () => {
    const c = complex(plot('Plot A', 200, 6), plot('Plot B', 400, 9));
    expect(c.level).toBe(false);
    expect(c.headline).toContain('Neither plot can be built on');
    const gate = c.differences[0];
    expect(gate.kind).toBe('roadGate');
    expect(gate.favours).toBeNull();
    expect(gate.note).toContain('Neither.');
  });

  it('separates "cannot build" from "can build but can never enlarge"', () => {
    // A retail shop clears its own 6 m minimum on a 9 m road, but Clause 9.2.1(ii) bars
    // any purchased FAR below 12 m — buildable, and capped for good.
    const c = comparePlots({
      a: plot('Plot A', 300, 9), b: plot('Plot B', 300, 18),
      occupancy: 'com_shop', areaType: 'built_up',
    });
    expect(c.outcomes[0].gate.barred).toBe(false);
    expect(c.outcomes[0].gate.purchaseBarred).toBe(true);
    expect(c.outcomes[1].gate.purchaseBarred).toBe(false);
    const ceiling = c.differences.find((d) => d.kind === 'ceiling');
    expect(ceiling?.favours).toBe(1);
    expect(ceiling?.note).toContain('stuck at');
    expect(ceiling?.note).toContain('9.2.1(ii)');
  });
});

describe('the approval route turns on plot size alone', () => {
  it('flags two plots either side of the 500 m² line', () => {
    const c = house(plot('Plot A', 480, 12), plot('Plot B', 540, 12));
    const route = c.differences.find((d) => d.kind === 'route');
    expect(route?.favours).toBe(0);
    expect(route?.note).toContain('instant online approval');
    expect(route?.note).toContain('full scrutiny');
  });

  it('flags the 100 m² exemption line', () => {
    const c = house(plot('Plot A', 95, 12), plot('Plot B', 140, 12));
    expect(c.differences.find((d) => d.kind === 'route')?.note)
      .toContain('no approved map at all');
  });

  it('says nothing about the route when both plots take the same one', () => {
    const c = house(plot('Plot A', 200, 12), plot('Plot B', 300, 12));
    expect(c.differences.some((d) => d.kind === 'route')).toBe(false);
  });
});

describe('price is the buyer’s own figure', () => {
  it('is left out entirely unless both plots carry one', () => {
    const c = house(plot('Plot A', 200, 12, 9_000_000), plot('Plot B', 300, 12));
    expect(c.differences.some((d) => d.kind === 'pricePerSqm')).toBe(false);
    expect(c.outcomes[1].pricePerBuildableSqm).toBeNull();
  });

  it('reports per buildable metre, not per plot metre, and says whose number it is', () => {
    // Plot B is dearer outright and cheaper per metre you may build, which is the whole
    // point of dividing by floor area rather than by plot area.
    const c = house(plot('Plot A', 200, 12, 9_000_000), plot('Plot B', 300, 12, 11_000_000));
    const price = c.differences.find((d) => d.kind === 'pricePerSqm');
    expect(price?.favours).toBe(1);
    expect(price?.note).toContain('not a byelaws figure');
  });

  it('calls out a trade rather than a winner when the two measures disagree', () => {
    const c = house(plot('Plot A', 200, 12, 5_000_000), plot('Plot B', 300, 12, 20_000_000));
    expect(c.split).toBe(true);
    expect(c.headline).toContain('a trade here, not a better plot');
  });

  it('names one plot when both measures agree', () => {
    const c = house(plot('Plot A', 200, 12, 9_000_000), plot('Plot B', 300, 12, 11_000_000));
    expect(c.split).toBe(false);
    expect(c.headline).toContain('costs less per buildable metre');
  });
});
