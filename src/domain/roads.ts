/**
 * Which sides of the plot carry a road, how wide each one is, and which of them the
 * byelaws call the front.
 *
 * The project model held this as `isCornerPlot: boolean` plus a single `roadWidth`, which
 * cannot express the thing an applicant on a corner actually knows: that there are two or
 * three or four roads and that they are not the same width. That gap is not cosmetic.
 * Clause 3.2.4.9 Note-1 settles the question in one sentence —
 *
 *     "For buildings situated on two or more roads of different road widths, then the side
 *      of the building towards the wider road shall be considered as the front."
 *
 * — and the engine could not read it, because with one road width there is no wider road to
 * find. So a plot with a 9 m road at the front and an 18 m road down the side was assessed
 * front-on to the 9 m road: the narrower road set the FAR band, and on a narrow enough road
 * it also decides whether purchasable FAR may be bought at all (Clause 9.2.1(ii) bars it
 * below 12 m). The applicant was told they could not buy density they were entitled to buy.
 *
 * ## Which road governs the FAR band
 *
 * Note-1 is printed under Clause 3.2.4.9's setback table, so its home ground is setback
 * geometry and there it is unarguable. The FAR tables key on "road width" without saying
 * which road a corner plot reads, and the byelaws restate Note-1 nowhere else. This module
 * therefore applies Note-1 generally — the front is the widest road, and the FAR tables
 * read the front — and says so on the result rather than burying it, because that is a
 * reading and not a quotation. `frontReassigned` marks every case where it changed the
 * answer, so a caller can show its working.
 *
 * The alternative reading, that each table wants the road its own chapter had in mind, is
 * not modelled because it has no determinate content: the byelaws never name that road.
 */

/** A side of the plot, named as the applicant sees it standing on the front road. */
export type PlotSide = 'front' | 'rear' | 'left' | 'right';

export const PLOT_SIDES: readonly PlotSide[] = ['front', 'rear', 'left', 'right'];

export const SIDE_LABEL: Readonly<Record<PlotSide, string>> = {
  front: 'Front',
  rear: 'Rear',
  left: 'Left side',
  right: 'Right side',
};

/**
 * Which setback face each side is measured on.
 *
 * `setbacks.ts` names the two flanks `side1` and `side2` without saying which is which.
 * Fixing left to `side1` and right to `side2` is arbitrary but has to be written down
 * once, because the corner rule raises one flank and not the other and the drawing has to
 * raise the same one.
 */
export const FACE_OF_SIDE = {
  front: 'front', rear: 'rear', left: 'side1', right: 'side2',
} as const satisfies Readonly<Record<PlotSide, 'front' | 'rear' | 'side1' | 'side2'>>;

/** Clause 1.2: "'Corner plot' means a plot which is situated on two or more intersecting/ meeting roads." */
export const CORNER_PLOT_DEFINITION =
  'A plot situated on two or more intersecting or meeting roads (Clause 1.2, "Corner Plot").';

export interface PlotRoads {
  /** Width in metres on each side. `0` means that side does not abut a road. */
  readonly widths: Readonly<Record<PlotSide, number>>;
  /** How many sides carry a road: 1 is mid-block, 2 a corner, 4 an island plot. */
  readonly count: number;
  /** The side Clause 3.2.4.9 Note-1 makes the front — the one on the widest road. */
  readonly frontSide: PlotSide;
  /** True where Note-1 moved the front off the side the applicant nominated. */
  readonly frontReassigned: boolean;
  /** The width of the road at the statutory front. This is the figure the FAR tables read. */
  readonly governingRoadWidthM: number;
  /** Every side that carries a road, widest first. */
  readonly frontages: readonly { readonly side: PlotSide; readonly widthM: number }[];
  readonly isCorner: boolean;
  /** "Mid-block", "Corner plot — two roads", and so on. */
  readonly label: string;
  readonly caveats: readonly string[];
}

const positive = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const COUNT_LABEL: Readonly<Record<number, string>> = {
  0: 'No road recorded',
  1: 'Mid-block — one road',
  2: 'Corner plot — two roads',
  3: 'Corner plot — three roads',
  4: 'Island plot — roads on all four sides',
};

/**
 * Resolve the geometry from the four widths.
 *
 * `cornerWithoutWidths` carries a project saved before this module existed: it recorded
 * that the plot was a corner without recording the second road, and that is a different
 * state from "not a corner". The corner setback rule still applies to it — the fact it
 * turns on is known — but Note-1 cannot, because the width it compares is missing.
 */
export function resolvePlotRoads(input: {
  front: number;
  rear?: number;
  left?: number;
  right?: number;
  /** The legacy boolean, honoured when no side width says otherwise. */
  cornerWithoutWidths?: boolean;
}): PlotRoads {
  const widths: Record<PlotSide, number> = {
    front: positive(input.front),
    rear: positive(input.rear),
    left: positive(input.left),
    right: positive(input.right),
  };

  const caveats: string[] = [];
  const named = PLOT_SIDES.filter((s) => widths[s] > 0);
  const legacyCorner = Boolean(input.cornerWithoutWidths) && named.length <= 1;

  if (legacyCorner) {
    caveats.push(
      'This plot is recorded as a corner plot without the width of its second road. The corner '
      + 'setback rule is applied, but Clause 3.2.4.9 Note-1 cannot be — there is no second width '
      + 'to compare, so the front stays where it was nominated. Enter the other road width to '
      + 'have the front assigned by the byelaws.',
    );
  }

  const frontages = named
    .map((side) => ({ side, widthM: widths[side] }))
    .sort((a, b) => b.widthM - a.widthM || PLOT_SIDES.indexOf(a.side) - PLOT_SIDES.indexOf(b.side));

  // Note-1: the widest road takes the front. Ties keep the nominated front, which is the
  // only stable answer when the rule's own discriminator — "different road widths" — is
  // absent. The gazette conditions the note on the widths differing, so on equal roads it
  // does not speak and there is nothing to reassign.
  const widest = frontages[0];
  const frontSide: PlotSide = widest && widest.widthM > widths.front ? widest.side : 'front';
  const frontReassigned = frontSide !== 'front';

  if (frontReassigned) {
    caveats.push(
      `Clause 3.2.4.9 Note-1: with roads of different widths the side towards the wider road is `
      + `the front. The ${SIDE_LABEL[frontSide].toLowerCase()} road is ${widths[frontSide]} m against `
      + `${widths.front} m at the nominated front, so it is treated as the front — for the setback `
      + `it carries and for the road width the FAR tables read.`,
    );
  }

  const count = legacyCorner ? Math.max(2, named.length) : named.length;
  const isCorner = count >= 2;

  if (named.length === 0) {
    caveats.push('No abutting road width has been given, so no FAR band or access check can be resolved.');
  }

  if (count >= 2) {
    caveats.push(
      'Clause 3.2.4.9 Note-1 is printed under the progressive high-rise setback table. It is the '
      + 'only rule in the byelaws that says which road a plot fronts, so it is applied to the FAR '
      + 'tables too; those tables ask for "road width" without saying which road a corner plot reads.',
    );
  }

  if (count >= 3) {
    caveats.push(
      `Table 3.2.1 Note-2 and Clause 3.2.4.3 Note-4 raise "the side setback in a corner plot" to `
      + `the front setback. Both are written for a plot on two roads; with ${count} this engine `
      + `applies the front setback to every road-facing side, which is the stricter reading. The `
      + `byelaws do not address the ${count}-road case in terms.`,
    );
  }

  return {
    widths,
    count,
    frontSide,
    frontReassigned,
    governingRoadWidthM: widths[frontSide] || widths.front,
    frontages,
    isCorner,
    label: COUNT_LABEL[count] ?? `${count} roads`,
    caveats,
  };
}

/** The sides that carry a road, expressed as setback faces. */
export function roadFacingFaces(roads: PlotRoads): readonly ('front' | 'rear' | 'side1' | 'side2')[] {
  const faces = PLOT_SIDES.filter((s) => roads.widths[s] > 0).map((s) => FACE_OF_SIDE[s]);
  // A legacy corner knows it has a second road but not which side, and the drawing has to
  // put it somewhere. The right flank is the conventional choice and matches the rule the
  // engine applied before this module existed, which raised `side2` alone.
  if (roads.isCorner && faces.length < 2) return [...faces, 'side2'];
  return faces;
}
