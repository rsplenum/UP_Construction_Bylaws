import { describe, expect, it } from 'vitest';
import { FACE_OF_SIDE, PLOT_SIDES, faceOfSide, resolvePlotRoads, roadFacingFaces, setbacksBySide } from '../roads';
import { studyEnvelope } from '../envelope';

/**
 * Clause 3.2.4.9 Note-1: where a plot faces two roads of different widths, the side
 * towards the wider road is the front.
 *
 * The engine read that into the FAR tables and not into the geometry, so the front
 * setback stayed on the edge the plot was entered as fronting while the wider road got a
 * flank setback — with a caveat beside it stating the opposite. These pin the rule, not
 * the output that was there before.
 */
const study = (roadsIn: Parameters<typeof resolvePlotRoads>[0], areaType: 'built_up' | 'non_built_up' = 'built_up') =>
  studyEnvelope({
    occupancy: 'res_single', plotAreaSqm: 300, frontageM: 12, depthM: 25,
    roads: resolvePlotRoads(roadsIn), areaType,
  });

describe('faceOfSide', () => {
  it('reproduces the old fixed mapping when the plot fronts where it was entered', () => {
    expect(faceOfSide('front')).toEqual(FACE_OF_SIDE);
  });

  it('gives every side exactly one face, whichever side is the front', () => {
    for (const front of PLOT_SIDES) {
      const faces = Object.values(faceOfSide(front));
      expect(new Set(faces).size).toBe(4);
      expect(faceOfSide(front)[front]).toBe('front');
    }
  });

  it('puts the rear face on the edge opposite the front', () => {
    const opposite = { front: 'rear', rear: 'front', left: 'right', right: 'left' } as const;
    for (const front of PLOT_SIDES) {
      expect(faceOfSide(front)[opposite[front]]).toBe('rear');
    }
  });
});

describe('setbacksBySide', () => {
  const set = { front: 3, rear: 1.5, side1: 1.2, side2: 0 };

  it('is the identity on an ordinary plot', () => {
    expect(setbacksBySide(set, 'front'))
      .toEqual({ front: 3, rear: 1.5, left: 1.2, right: 0 });
  });

  it('moves the front setback onto the edge Note-1 makes the front', () => {
    expect(setbacksBySide(set, 'left').left).toBe(3);
    expect(setbacksBySide(set, 'right').right).toBe(3);
  });

  it('conserves the four distances, only reassigning them', () => {
    for (const front of PLOT_SIDES) {
      const out = setbacksBySide(set, front);
      expect(Object.values(out).sort()).toEqual(Object.values(set).sort());
    }
  });
});

describe('a wider road on the side takes the front setback with it', () => {
  it('reassigns the front and reads the wider road into the tables', () => {
    const roads = resolvePlotRoads({ front: 9, left: 12 });
    expect(roads.frontSide).toBe('left');
    expect(roads.governingRoadWidthM).toBe(12);
  });

  it('puts the front setback on the 12 m edge and the corner uplift on the 9 m edge', () => {
    // This is the defect the owner reported. Before the rotation both plots below came
    // out with identical setbacks although Note-1 had fired on the second.
    const normal = study({ front: 12, left: 9 }).standard.setbacks;
    const flipped = study({ front: 9, left: 12 }).standard.setbacks;

    const normalBySide = setbacksBySide(normal, 'front');
    const flippedBySide = setbacksBySide(flipped, 'left');

    // Wider road 12 m is at the front here, and carries the front setback.
    expect(normalBySide.front).toBe(3);
    expect(normalBySide.left).toBe(1.5);

    // Wider road 12 m is on the left here, so the front setback goes there.
    expect(flippedBySide.left).toBe(3);
    expect(flippedBySide.front).toBe(1.5);
  });

  it('gives the corner uplift to the narrower road, not the wider one', () => {
    const roads = resolvePlotRoads({ front: 9, left: 12 });
    // The front face is excluded from the corner rule, and the front is now the left.
    expect(roadFacingFaces(roads)).toContain('front');
    expect(roadFacingFaces(roads).filter((f) => f !== 'front')).toEqual(['side2']);
    expect(faceOfSide('left').front).toBe('side2');
  });

  it('spends the setbacks on the axis they actually govern', () => {
    // Frontage 12 m, depth 25 m. With the front on the left edge the 3 m front setback
    // eats the 12 m frontage, not the 25 m depth — so the footprint is not the same as
    // the unrotated plot's, which is what the old arithmetic produced.
    const flipped = study({ front: 9, left: 12 }).standard;
    const bySide = setbacksBySide(flipped.setbacks, 'left');
    const expected = Math.max(0, 12 - bySide.left - bySide.right)
      * Math.max(0, 25 - bySide.front - bySide.rear);
    expect(flipped.footprintSqm).toBeCloseTo(expected, 1);
  });

  it('leaves an ordinary plot exactly as it was', () => {
    const plain = study({ front: 12 }).standard;
    const expected = Math.max(0, 12 - plain.setbacks.side1 - plain.setbacks.side2)
      * Math.max(0, 25 - plain.setbacks.front - plain.setbacks.rear);
    expect(plain.footprintSqm).toBeCloseTo(expected, 1);
  });

  it('applies the new-layout limb to the reassigned geometry too', () => {
    // Note-2 new-layout limb: the corner side setback equals the front setback.
    const flipped = study({ front: 9, left: 12 }, 'non_built_up').standard.setbacks;
    const bySide = setbacksBySide(flipped, 'left');
    expect(bySide.left).toBe(bySide.front);
  });
});
