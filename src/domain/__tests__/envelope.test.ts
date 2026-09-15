import { describe, expect, it } from 'vitest';
import { resolvePlotRoads, roadFacingFaces } from '../roads';
import { resolveRequiredSetbacks } from '../setbacks';
import {
  DEFAULT_FLOOR_TO_FLOOR_M, NOTE1_MAX_GROUND_FLOOR_SQM, studyEnvelope,
} from '../envelope';
import { pricePlans } from '../plan-pricing';
import { resolveBaseFar } from '../far';

const roads = (r: Parameters<typeof resolvePlotRoads>[0]) => resolvePlotRoads(r);

const study = (over: Partial<Parameters<typeof studyEnvelope>[0]> = {}) => studyEnvelope({
  occupancy: 'res_single',
  plotAreaSqm: 300,
  frontageM: 12,
  depthM: 25,
  roads: roads({ front: 12 }),
  areaType: 'built_up',
  ...over,
});

describe('road geometry — Clause 3.2.4.9 Note-1', () => {
  it('makes the wider road the front, and the FAR tables read it', () => {
    const r = roads({ front: 9, left: 18 });
    expect(r.frontSide).toBe('left');
    expect(r.frontReassigned).toBe(true);
    expect(r.governingRoadWidthM).toBe(18);
  });

  it('leaves the nominated front alone when the roads are equal — the note needs a wider one', () => {
    const r = roads({ front: 12, left: 12 });
    expect(r.frontSide).toBe('front');
    expect(r.frontReassigned).toBe(false);
  });

  it('counts the roads, and a plot on four of them is an island', () => {
    expect(roads({ front: 12 }).count).toBe(1);
    expect(roads({ front: 12 }).isCorner).toBe(false);
    expect(roads({ front: 12, right: 9 }).count).toBe(2);
    expect(roads({ front: 12, right: 9, left: 9 }).count).toBe(3);
    expect(roads({ front: 12, right: 9, left: 9, rear: 9 }).label).toMatch(/Island/);
  });

  it('carries a project saved before road widths existed without changing its answer', () => {
    const legacy = roads({ front: 12, cornerWithoutWidths: true });
    expect(legacy.isCorner).toBe(true);
    expect(legacy.governingRoadWidthM).toBe(12);
    // The old engine raised side2 alone; the legacy path has to keep doing exactly that.
    expect(roadFacingFaces(legacy)).toEqual(['front', 'side2']);
    expect(legacy.caveats.join(' ')).toMatch(/without the width of its second road/);
  });
});

describe('the corner rule has two limbs — Table 3.2.1 Note-2', () => {
  const corner = (areaType: 'built_up' | 'non_built_up', plotArea: number) =>
    resolveRequiredSetbacks({
      occupancy: 'res_single', plotArea, buildingHeight: 9, isCornerPlot: true,
      roads: roads({ front: 12, right: 9 }), areaType, roadWidth: 12,
    });

  it('new layout: the side setback matches the front', () => {
    expect(corner('non_built_up', 300).side2).toBe(3);
  });

  it('already approved layout up to 500 m²: the note sets 1.5 m, not the front setback', () => {
    // The bug this fixes: the engine applied the new-layout limb to every corner plot, and
    // demanded 3 m here. On a 12 m frontage that is 30.75 m² of footprint per floor.
    expect(corner('built_up', 300).side2).toBe(1.5);
  });

  it('already approved layout above 500 m²: the table stands, with no uplift at all', () => {
    expect(corner('built_up', 600).side2).toBe(0);
  });

  it('names the figure the other limb would give, so the reading can be checked', () => {
    expect(corner('built_up', 300).caveats.join(' ')).toMatch(/in a new layout it would be 3 m/);
  });

  it('raises every road-facing side on a three-road corner', () => {
    const s = resolveRequiredSetbacks({
      occupancy: 'res_single', plotArea: 300, buildingHeight: 9, isCornerPlot: true,
      roads: roads({ front: 12, left: 9, right: 9 }), areaType: 'non_built_up', roadWidth: 12,
    });
    expect([s.side1, s.side2]).toEqual([3, 3]);
    expect(s.caveats.join(' ')).toMatch(/do not address the 3-road case/);
  });
});

describe('commercial Note-1 — Clause 3.2.4.3', () => {
  const commercial = (gf: number, ensured: boolean) => resolveRequiredSetbacks({
    occupancy: 'com_complex', plotArea: 500, buildingHeight: 15, isCornerPlot: false,
    roadWidth: 18, groundFloorCoveredAreaSqm: gf, lightVentilationEnsured: ensured,
  });

  it('lifts the rear and side setbacks at or below 500 m² of ground floor', () => {
    const s = commercial(410, true);
    expect([s.front, s.rear, s.side1, s.side2]).toEqual([4.5, 0, 0, 0]);
  });

  it('withholds the note unless light and ventilation are declared', () => {
    expect(commercial(410, false).rear).toBe(3);
  });

  it('withholds the note above its own 500 m² ceiling', () => {
    expect(commercial(NOTE1_MAX_GROUND_FLOOR_SQM + 1, true).rear).toBe(3);
  });

  it('puts the front setback back on a corner plot, as the note closes', () => {
    const s = resolveRequiredSetbacks({
      occupancy: 'com_complex', plotArea: 500, buildingHeight: 15, isCornerPlot: true,
      roads: roads({ front: 18, right: 12 }), areaType: 'non_built_up', roadWidth: 18,
      groundFloorCoveredAreaSqm: 410, lightVentilationEnsured: true,
    });
    expect(s.rear).toBe(0);
    expect(s.side2).toBe(4.5);
  });
});

describe('the floor ceiling is a number now', () => {
  it('reads Table 3.2.1 as a count, not as prose', () => {
    const under = resolveRequiredSetbacks({
      occupancy: 'res_single', plotArea: 250, buildingHeight: 9, isCornerPlot: false,
    });
    expect(under.maxFloorsNum).toBe(3);
    expect(under.stiltAllowed).toBe(true);
    const over = resolveRequiredSetbacks({
      occupancy: 'res_single', plotArea: 400, buildingHeight: 9, isCornerPlot: false,
    });
    expect(over.maxFloorsNum).toBe(4);
  });

  it('stops the solver at the printed count even where the height would allow more', () => {
    // 4 floors at 3 m is 12 m, under the 15 m ceiling — only the floor count refuses it.
    const s = study({ plotAreaSqm: 250, frontageM: 12, depthM: 20.83 });
    expect(s.standard.floors).toBeLessThanOrEqual(3);
    const fourth = s.ladder.find((r) => r.floors === 4);
    expect(fourth?.refusedBecause).toMatch(/3 floors \+ stilt/);
  });
});

describe('the envelope solver', () => {
  it('finds the 15 m cliff, and stops below it', () => {
    const s = study({
      occupancy: 'com_complex', plotAreaSqm: 500, frontageM: 20, depthM: 25,
      roads: roads({ front: 18 }),
    });
    expect(s.maximum.floors).toBe(5);
    expect(s.maximum.heightM).toBe(15);
    expect(s.cliff).not.toBeNull();
    expect(s.cliff!.atFloors).toBe(6);
    // The sixth floor costs more than it earns — that is the whole point of searching.
    expect(s.cliff!.lossSqm).toBeGreaterThan(800);
    expect(s.cliff!.toFootprintSqm).toBeLessThan(s.cliff!.fromFootprintSqm);
  });

  it('says which constraint binds, and how much entitlement is stranded', () => {
    const s = study({ plotAreaSqm: 200, frontageM: 10, depthM: 20, roads: roads({ front: 9 }) });
    expect(s.standard.binding).toBe('far');
    expect(s.standard.strandedSqm).toBe(0);
  });

  it('elects Clause 3.2.4.3 Note-1 only where it leaves more ground than the table', () => {
    const base = study({
      occupancy: 'com_complex', plotAreaSqm: 500, frontageM: 20, depthM: 25,
      roads: roads({ front: 18 }),
    });
    const elected = study({
      occupancy: 'com_complex', plotAreaSqm: 500, frontageM: 20, depthM: 25,
      roads: roads({ front: 18 }), lightVentilationEnsured: true,
    });
    expect(elected.maximum.footprintSqm).toBeGreaterThan(base.maximum.footprintSqm);
    // The wider footprint reaches the full entitlement in four floors instead of stranding
    // it at five — and never crosses 15 m, so the cliff does not arise.
    expect(elected.maximum.floors).toBeLessThan(base.maximum.floors);
    expect(elected.maximum.strandedSqm).toBe(0);
  });

  it('derives height from floors rather than asking for it', () => {
    const s = study();
    expect(s.floorToFloorM).toBe(DEFAULT_FLOOR_TO_FLOOR_M);
    expect(s.standard.heightM).toBe(s.standard.floors * DEFAULT_FLOOR_TO_FLOOR_M);
  });
});

describe('the compoundable margin is capped by Clause 16.3.8(v)', () => {
  it('leaves no floor area to compound once the maximum FAR is bought', () => {
    const s = study();
    expect(s.compoundable.farAllowanceSqm).toBeGreaterThan(0);
    expect(s.compoundable.extraFarSqm).toBe(0);
    expect(s.compoundable.farHeadroomExhausted).toBe(true);
    expect(s.compoundable.caveats.join(' ')).toMatch(/16\.3\.8\(v\)/);
  });

  it('still widens the footprint — shape, not size', () => {
    const s = study();
    expect(s.compoundable.totalEncroachmentSqm).toBeGreaterThan(0);
    expect(s.compoundable.footprintWithMarginSqm).toBeGreaterThan(s.maximum.footprintSqm);
  });

  it('gives the whole rear setback to a residential plot up to 500 m², and a tenth above it', () => {
    const small = study({ plotAreaSqm: 300 });
    expect(small.compoundable.depthM.rear).toBeCloseTo(small.maximum.setbacks.rear, 5);
    const large = study({ plotAreaSqm: 800, frontageM: 20, depthM: 40 });
    expect(large.compoundable.depthM.rear).toBeCloseTo(large.maximum.setbacks.rear * 0.1, 5);
  });
});

describe('pricing keeps a sanction and a regularisation apart', () => {
  const priced = (over = {}) => {
    const s = study(over);
    const far = resolveBaseFar({
      occupancy: 'res_single', plotArea: s.plotAreaSqm,
      roadWidth: s.roads.governingRoadWidthM, areaType: 'built_up',
    });
    return { s, p: pricePlans({
      study: s, occupancy: 'res_single', areaType: 'built_up', landRate: 35000,
      baseFar: far.effectiveBaseFar || far.baseFar,
    }) };
  };

  it('prices bought density under Clause 9.2.5 and charges nothing for the standard plan', () => {
    const { p } = priced();
    expect(p.standard.total).toBe(0);
    expect(p.maximum.total).toBeGreaterThan(0);
    expect(p.maximum.lines[0].clause).toMatch(/9\.2\.5/);
  });

  it('does not charge a height deviation the plan is not making', () => {
    const { s, p } = priced();
    expect(s.compoundable.heightHeadroomM).toBeGreaterThan(0);
    expect(p.compounding!.lines.some((l) => /height/i.test(l.label))).toBe(false);
    expect(p.compounding!.caveats.join(' ')).toMatch(/available as of right/);
  });

  it('marks the compounding estimate as buying no permission', () => {
    const { p } = priced();
    expect(p.compounding!.statusNote).toMatch(/not a fee for permission/i);
    expect(p.compounding!.caveats.join(' ')).toMatch(/already been carried out/);
  });
});
