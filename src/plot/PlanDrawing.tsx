import React, { useMemo } from 'react';
import type { SetbackFace } from '../domain/setbacks';
import type { BuildablePlan, CompoundableMargin } from '../domain/envelope';
import { PLOT_SIDES, setbacksBySide, type PlotRoads, type PlotSide } from '../domain/roads';

interface PlanDrawingProps {
  plan: BuildablePlan;
  roads: PlotRoads;
  frontageM: number;
  depthM: number;
  /**
   * The Chapter 16 margin, drawn only on the maximum plan.
   *
   * It is passed separately from the plan rather than folded into it, because it is a
   * different kind of thing and the drawing has to say so: everything inside the green line
   * is what a sanction grants, and everything in the amber band is a breach with a price on
   * it. A single outline containing both would be the one misreading this drawing must not
   * allow.
   */
  margin?: CompoundableMargin | null;
  title: string;
  subtitle: string;
}

interface Box { x: number; y: number; w: number; h: number }

/** An even-odd path: the outer box with the inner box punched out of it. */
const ring = (outer: Box, inner: Box): string =>
  `M${outer.x},${outer.y}h${outer.w}v${outer.h}h${-outer.w}Z`
  + `M${inner.x},${inner.y}h${inner.w}v${inner.h}h${-inner.w}Z`;

/**
 * One plan, drawn to scale with its offsets, footprint and roads marked.
 *
 * The compoundable margin is drawn as a band OUTSIDE the sanctioned envelope, in a
 * different colour, hatched, dashed, and captioned in the drawing itself. Three redundant
 * signals rather than one, because the cost of this particular confusion is that somebody
 * builds to the amber line believing it is approved.
 */
export const PlanDrawing: React.FC<PlanDrawingProps> = ({
  plan, roads, frontageM, depthM, margin, title, subtitle,
}) => {
  const g = useMemo(() => {
    const width = Math.max(1, frontageM);
    const depth = Math.max(1, depthM);

    const VB_W = 520;
    const VB_H = 500;
    // Room for a road on any side, plus dimension lines outside those.
    const margins = { top: 62, right: 76, bottom: 92, left: 76 };
    const availW = VB_W - margins.left - margins.right;
    const availH = VB_H - margins.top - margins.bottom;
    const scale = Math.min(availW / width, availH / depth);

    const plotW = width * scale;
    const plotH = depth * scale;
    const x = margins.left + (availW - plotW) / 2;
    const y = margins.top + (availH - plotH) / 2;

    // Faces resolved to the edges they actually govern. On an ordinary plot this is the
    // identity; where Clause 3.2.4.9 Note-1 has moved the front to a side road the front
    // setback belongs on that edge, and drawing it at the bottom regardless drew the plot
    // with its offsets rotated a quarter turn away from the building it describes.
    const bySide = setbacksBySide(plan.setbacks, roads.frontSide);
    const inset = {
      front: bySide.front * scale,
      rear: bySide.rear * scale,
      left: bySide.left * scale,
      right: bySide.right * scale,
    };

    // The nominated front is drawn at the bottom, as a site plan is read.
    const envelope = {
      x: x + inset.left,
      y: y + inset.rear,
      w: Math.max(0, plotW - inset.left - inset.right),
      h: Math.max(0, plotH - inset.rear - inset.front),
    };

    const marginBySide = margin ? setbacksBySide(margin.depthM, roads.frontSide) : null;
    const stretched = marginBySide
      ? {
        x: envelope.x - marginBySide.left * scale,
        y: envelope.y - marginBySide.rear * scale,
        w: envelope.w + (marginBySide.left + marginBySide.right) * scale,
        h: envelope.h + (marginBySide.rear + marginBySide.front) * scale,
      }
      : null;

    return { VB_W, VB_H, x, y, plotW, plotH, scale, envelope, stretched, width, depth };
  }, [plan, frontageM, depthM, margin, roads.frontSide]);

  const { VB_W, VB_H, x, y, plotW, plotH, scale, envelope, stretched, width, depth } = g;
  const uid = React.useId().replace(/:/g, '');

  /** A road drawn against one edge of the plot, with its width called out. */
  const road = (side: PlotSide) => {
    const w = roads.widths[side];
    if (w <= 0) return null;
    const T = 20;           // drawn thickness of the carriageway
    const GAP = 13;         // clear of the plot boundary
    const isFront = roads.frontSide === side;
    const box =
      side === 'front' ? { rx: x - 10, ry: y + plotH + GAP, rw: plotW + 20, rh: T }
      : side === 'rear' ? { rx: x - 10, ry: y - GAP - T, rw: plotW + 20, rh: T }
      : side === 'left' ? { rx: x - GAP - T, ry: y - 10, rw: T, rh: plotH + 20 }
      : { rx: x + plotW + GAP, ry: y - 10, rw: T, rh: plotH + 20 };
    const label =
      side === 'front' ? { lx: x + plotW / 2, ly: y + plotH + GAP + T + 15, rot: 0 }
      : side === 'rear' ? { lx: x + plotW / 2, ly: y - GAP - T - 7, rot: 0 }
      : side === 'left' ? { lx: x - GAP - T - 8, ly: y + plotH / 2, rot: -90 }
      : { lx: x + plotW + GAP + T + 8, ly: y + plotH / 2, rot: 90 };

    return (
      <g key={side}>
        <rect
          x={box.rx} y={box.ry} width={box.rw} height={box.rh} rx="2"
          className={isFront ? 'fill-slate-700 dark:fill-slate-500' : 'fill-slate-500 dark:fill-slate-600'}
        />
        <text
          x={label.lx} y={label.ly} textAnchor="middle"
          className="fill-slate-700 dark:fill-slate-300"
          style={{ fontSize: 10.5, fontWeight: 600 }}
          transform={label.rot ? `rotate(${label.rot} ${label.lx} ${label.ly})` : undefined}
        >
          {w} m{isFront ? ' — front' : ''}
        </text>
      </g>
    );
  };

  /** The offset written inside the strip it measures. */
  const offset = (face: SetbackFace) => {
    const v = plan.setbacks[face];
    if (v <= 0) return null;
    const strip = v * scale;
    const pos =
      face === 'front' ? { tx: x + plotW / 2, ty: y + plotH - strip / 2 + 4 }
      : face === 'rear' ? { tx: x + plotW / 2, ty: y + strip / 2 + 4 }
      : face === 'side1' ? { tx: x + strip / 2, ty: y + plotH / 2 }
      : { tx: x + plotW - strip / 2, ty: y + plotH / 2 };
    const vertical = face === 'side1' || face === 'side2';
    if (vertical && strip < 15) return null;
    return (
      <text
        key={face} x={pos.tx} y={pos.ty} textAnchor="middle"
        className="fill-slate-700 dark:fill-slate-200"
        style={{ fontSize: 10, fontWeight: 600 }}
        transform={vertical ? `rotate(-90 ${pos.tx} ${pos.ty})` : undefined}
      >
        {v} m
      </text>
    );
  };

  const cornerSides = PLOT_SIDES.filter((s) => roads.widths[s] > 0);

  return (
    <figure className="m-0">
      <figcaption className="mb-1.5">
        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">{subtitle}</p>
      </figcaption>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-auto w-full"
        role="img"
        aria-label={
          `${title}. A ${width} by ${depth.toFixed(1)} metre plot with `
          + `${cornerSides.length} abutting road${cornerSides.length === 1 ? '' : 's'}. `
          + `Offsets: ${plan.setbacks.front} metres front, ${plan.setbacks.rear} rear, `
          + `${plan.setbacks.side1} left, ${plan.setbacks.side2} right. `
          + `Footprint ${plan.footprintSqm} square metres over ${plan.floors} floors `
          + `at ${plan.heightM} metres, giving ${plan.floorAreaSqm} square metres of floor area, `
          + `a floor area ratio of ${plan.farAchieved}.`
          + (margin
            ? ` A compoundable margin of ${margin.totalEncroachmentSqm} square metres is drawn `
              + 'outside that envelope. It is not part of the sanctioned building.'
            : '')
        }
      >
        <defs>
          <pattern id={`sb-${uid}`} width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.16" />
          </pattern>
          <pattern id={`cm-${uid}`} width="6" height="6" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
          </pattern>
        </defs>

        {cornerSides.map(road)}

        {/* the setback zone — the part of the plot that must stay open */}
        <rect x={x} y={y} width={plotW} height={plotH} className="fill-slate-100 text-slate-500 dark:fill-white/[0.05]" />
        <rect x={x} y={y} width={plotW} height={plotH} fill={`url(#sb-${uid})`} className="text-slate-600 dark:text-slate-300" />

        {/*
          The compoundable margin, drawn as a RING rather than a filled rectangle under the
          envelope. A rectangle put amber hatching beneath the translucent green fill, and
          the green then read as hatched too — muddying the one distinction this drawing
          exists to make. An even-odd path leaves the sanctioned envelope untouched.
        */}
        {stretched && margin && margin.totalEncroachmentSqm > 0 && (
          <>
            <path
              d={ring(stretched, envelope)} fillRule="evenodd"
              className="fill-amber-500/30 text-amber-600 dark:fill-amber-400/25 dark:text-amber-400"
            />
            <path
              d={ring(stretched, envelope)} fillRule="evenodd"
              fill={`url(#cm-${uid})`} className="text-amber-700 dark:text-amber-400"
            />
            <rect
              x={stretched.x} y={stretched.y} width={stretched.w} height={stretched.h}
              className="fill-none stroke-amber-600 dark:stroke-amber-400"
              strokeWidth="2" strokeDasharray="6 4"
            />
          </>
        )}

        {/* plot boundary */}
        <rect
          x={x} y={y} width={plotW} height={plotH}
          className="fill-none stroke-slate-500 dark:stroke-slate-300" strokeWidth="1.5"
        />

        {/* the sanctioned envelope */}
        {envelope.w > 0 && envelope.h > 0 && (
          <>
            <rect
              x={envelope.x} y={envelope.y} width={envelope.w} height={envelope.h}
              className="fill-emerald-500/25 stroke-emerald-600 dark:fill-emerald-400/20 dark:stroke-emerald-400"
              strokeWidth="1.75"
            />
            {envelope.w > 96 && envelope.h > 52 && (
              <>
                <text
                  x={envelope.x + envelope.w / 2} y={envelope.y + envelope.h / 2 - 8}
                  textAnchor="middle" className="fill-emerald-900 dark:fill-emerald-200"
                  style={{ fontSize: 14, fontWeight: 700 }}
                >
                  {plan.footprintSqm.toFixed(0)} m²
                </text>
                <text
                  x={envelope.x + envelope.w / 2} y={envelope.y + envelope.h / 2 + 8}
                  textAnchor="middle" className="fill-emerald-800/80 dark:fill-emerald-300/80"
                  style={{ fontSize: 10 }}
                >
                  {plan.floors} floor{plan.floors === 1 ? '' : 's'} · {plan.heightM} m
                </text>
                <text
                  x={envelope.x + envelope.w / 2} y={envelope.y + envelope.h / 2 + 22}
                  textAnchor="middle" className="fill-emerald-800/80 dark:fill-emerald-300/80"
                  style={{ fontSize: 10 }}
                >
                  {plan.floorAreaSqm.toFixed(0)} m² · FAR {plan.farAchieved}
                </text>
              </>
            )}
          </>
        )}

        {(['front', 'rear', 'side1', 'side2'] as SetbackFace[]).map(offset)}

        {/*
          The caption, pinned to the corner of the viewBox rather than to the plot. Centred
          under the boundary it collided with the front offset label on every plot deep
          enough to have one; here nothing else is ever drawn.
        */}
        {stretched && margin && margin.totalEncroachmentSqm > 0 && (
          <g>
            <rect
              x={8} y={8} width={232} height={19} rx={4}
              className="fill-amber-100 stroke-amber-500 dark:fill-amber-500/20 dark:stroke-amber-400/60"
              strokeWidth="1"
            />
            <text
              x={16} y={21.5} className="fill-amber-800 dark:fill-amber-200"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.02em' }}
            >
              ⚠ AMBER BAND IS NOT SANCTIONED
            </text>
          </g>
        )}

        {/* plot dimensions */}
        <text
          x={x + plotW / 2} y={y - (roads.widths.rear > 0 ? 42 : 14)}
          textAnchor="middle" className="fill-slate-700 dark:fill-slate-300"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          {width} m
        </text>
        <text
          x={x - (roads.widths.left > 0 ? 50 : 20)} y={y + plotH / 2}
          textAnchor="middle" className="fill-slate-700 dark:fill-slate-300"
          style={{ fontSize: 11, fontWeight: 600 }}
          transform={`rotate(-90 ${x - (roads.widths.left > 0 ? 50 : 20)} ${y + plotH / 2})`}
        >
          {depth.toFixed(1)} m
        </text>
      </svg>

      <ul className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[10.5px] text-slate-600 dark:text-slate-400">
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-emerald-500/40 ring-1 ring-emerald-600" />
          buildable — {plan.footprintSqm.toFixed(0)} m² footprint
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-slate-200 ring-1 ring-slate-400 dark:bg-white/10" />
          offset — must stay open
        </li>
        {margin && margin.totalEncroachmentSqm > 0 && (
          <li className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-amber-500/30 ring-1 ring-dashed ring-amber-600" />
            compoundable — a breach, not a permission
          </li>
        )}
      </ul>

      {/*
        The band had no number on it. A reader could see that something extra was drawn
        around the envelope and had no way to tell how much ground it was, or whether
        regularising it would buy them any floor area at all — which, once Clause
        16.3.8(v) has capped compounding at the maximum permissible FAR, is very often
        none. Both figures are on the margin already; neither was ever rendered.
      */}
      {margin && margin.totalEncroachmentSqm > 0 && (
        <dl className="mt-2 space-y-1 border-t border-amber-300/60 pt-2 text-[11px] dark:border-amber-500/30">
          <div className="flex justify-between gap-2">
            <dt className="text-amber-800 dark:text-amber-300">Ground the band covers</dt>
            <dd className="font-semibold tabular-nums text-amber-900 dark:text-amber-200">
              {margin.totalEncroachmentSqm.toFixed(0)} m²
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-amber-800 dark:text-amber-300">
              That band over {plan.floors} floor{plan.floors === 1 ? '' : 's'}
            </dt>
            <dd className="font-semibold tabular-nums text-amber-900 dark:text-amber-200">
              {margin.bandFloorAreaSqm.toFixed(0)} m² of floor area
            </dd>
          </div>
          {/* The allowance is a different quantity from the band and was printed beside it
              as though it were the same one — so a 20 m² band on three floors sat next to
              "90 m²", and 20 x 3 is 60. It is what Chapter 16 will forgive in total,
              wherever the construction is, and the band is one particular piece of it. */}
          <div className="flex justify-between gap-2">
            <dt className="text-amber-800 dark:text-amber-300">
              Most Chapter 16 will forgive
            </dt>
            <dd className="font-semibold tabular-nums text-amber-900 dark:text-amber-200">
              {margin.extraFarSqm > 0.5 ? `${margin.extraFarSqm.toFixed(0)} m²` : 'Nothing'}
            </dd>
          </div>
          {margin.farHeadroomExhausted && (
            <p className="pt-0.5 leading-snug text-amber-800/90 dark:text-amber-300/90">
              Clause 16.3.3 would have allowed {margin.farAllowanceSqm.toFixed(0)} m² — ten per
              cent of the permissible FAR — but 16.3.8(v) bars compounding above the maximum
              permissible FAR, and this plan already reaches it. The band buys a wider
              footprint for the same total area, not a bigger building.
            </p>
          )}
        </dl>
      )}
    </figure>
  );
};
