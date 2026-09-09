import React, { useMemo } from 'react';
import { RequiredSetbacks } from '../domain/setbacks';
import { ProjectState, derivePlotDepth } from '../domain/project';

interface SitePlanProps {
  project: ProjectState;
  required: RequiredSetbacks;
  /** Highlight one edge, when the reader is hovering the finding about it. */
  highlight?: 'front' | 'rear' | 'side1' | 'side2' | null;
}

/**
 * The plot, the setbacks, and what is left to build in — drawn to scale.
 *
 * This is the one view the old app got right, so it moves from being a tab to being the
 * centre of the screen. Everything else on the workspace describes what is drawn here.
 */
export const SitePlan: React.FC<SitePlanProps> = ({ project, required, highlight }) => {
  const geometry = useMemo(() => {
    const width = Math.max(1, project.plotFrontage);
    const depth = Math.max(1, derivePlotDepth(project));

    // Fit the plot into the viewBox with room for dimension lines and the road.
    const VB_W = 520;
    const VB_H = 460;
    const margin = { top: 44, right: 52, bottom: 76, left: 62 };
    const availW = VB_W - margin.left - margin.right;
    const availH = VB_H - margin.top - margin.bottom;
    const scale = Math.min(availW / width, availH / depth);

    const plotW = width * scale;
    const plotH = depth * scale;
    const x = margin.left + (availW - plotW) / 2;
    const y = margin.top + (availH - plotH) / 2;

    const inset = {
      front: required.front * scale,
      rear: required.rear * scale,
      side1: required.side1 * scale,
      side2: required.side2 * scale,
    };

    // Front faces the road, drawn at the bottom.
    const envelope = {
      x: x + inset.side1,
      y: y + inset.rear,
      w: Math.max(0, plotW - inset.side1 - inset.side2),
      h: Math.max(0, plotH - inset.rear - inset.front),
    };

    const buildableArea = Math.max(0, (plotW - inset.side1 - inset.side2) / scale)
      * Math.max(0, (plotH - inset.rear - inset.front) / scale);

    return { VB_W, VB_H, x, y, plotW, plotH, scale, envelope, width, depth, buildableArea };
  }, [project, required]);

  const { VB_W, VB_H, x, y, plotW, plotH, envelope, width, depth, buildableArea } = geometry;
  const coverage = project.plotArea > 0 ? (buildableArea / project.plotArea) * 100 : 0;

  const edgeStroke = (edge: string) =>
    highlight === edge ? 'var(--sp-accent)' : 'transparent';

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Site plan: a ${width} by ${depth} metre plot. After setbacks of ${required.front} metres at the front, ${required.rear} at the rear and ${required.side1} and ${required.side2} at the sides, the buildable area is ${buildableArea.toFixed(0)} square metres, or ${coverage.toFixed(0)} percent of the plot.`}
        style={{
          ['--sp-accent' as string]: '#0ea5e9',
        }}
      >
        <defs>
          <pattern id="sp-hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.16" />
          </pattern>
        </defs>

        {/* setback zone: the part of the plot you may not build on */}
        <rect
          x={x} y={y} width={plotW} height={plotH}
          className="fill-slate-100 dark:fill-white/[0.05] text-slate-500"
        />
        <rect x={x} y={y} width={plotW} height={plotH} fill="url(#sp-hatch)" className="text-slate-600 dark:text-slate-300" />

        {/* plot boundary */}
        <rect
          x={x} y={y} width={plotW} height={plotH}
          className="fill-none stroke-slate-500 dark:stroke-slate-300"
          strokeWidth="1.5"
        />

        {/* buildable envelope */}
        {envelope.w > 0 && envelope.h > 0 && (
          <>
            <rect
              x={envelope.x} y={envelope.y} width={envelope.w} height={envelope.h}
              className="fill-emerald-500/25 stroke-emerald-600 dark:fill-emerald-400/20 dark:stroke-emerald-400"
              strokeWidth="1.5"
            />
            {envelope.w > 74 && envelope.h > 40 && (
              <>
                <text
                  x={envelope.x + envelope.w / 2} y={envelope.y + envelope.h / 2 - 5}
                  textAnchor="middle"
                  className="fill-emerald-900 dark:fill-emerald-200"
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  {buildableArea.toFixed(0)} m²
                </text>
                <text
                  x={envelope.x + envelope.w / 2} y={envelope.y + envelope.h / 2 + 11}
                  textAnchor="middle"
                  className="fill-emerald-800/80 dark:fill-emerald-300/80"
                  style={{ fontSize: 10.5 }}
                >
                  you can build here
                </text>
              </>
            )}
          </>
        )}

        {/* highlighted edge */}
        <rect x={x} y={y + plotH - 3} width={plotW} height={3} fill={edgeStroke('front')} />
        <rect x={x} y={y} width={plotW} height={3} fill={edgeStroke('rear')} />
        <rect x={x} y={y} width={3} height={plotH} fill={edgeStroke('side1')} />
        <rect x={x + plotW - 3} y={y} width={3} height={plotH} fill={edgeStroke('side2')} />

        {/* setback dimensions */}
        {required.front > 0 && envelope.h > 0 && (
          <text
            x={x + plotW / 2} y={y + plotH - (required.front * geometry.scale) / 2 + 4}
            textAnchor="middle" className="fill-slate-700 dark:fill-slate-200"
            style={{ fontSize: 10.5, fontWeight: 600 }}
          >
            {required.front} m
          </text>
        )}
        {required.rear > 0 && envelope.h > 0 && (
          <text
            x={x + plotW / 2} y={y + (required.rear * geometry.scale) / 2 + 4}
            textAnchor="middle" className="fill-slate-700 dark:fill-slate-200"
            style={{ fontSize: 10.5, fontWeight: 600 }}
          >
            {required.rear} m
          </text>
        )}

        {/* the road */}
        <rect
          x={x - 14} y={y + plotH + 16} width={plotW + 28} height={22}
          className="fill-slate-700 dark:fill-slate-600"
          rx="2"
        />
        <line
          x1={x - 6} y1={y + plotH + 27} x2={x + plotW + 6} y2={y + plotH + 27}
          className="stroke-white/70" strokeWidth="1.5" strokeDasharray="9 7"
        />
        <text
          x={x + plotW / 2} y={y + plotH + 52}
          textAnchor="middle" className="fill-slate-700 dark:fill-slate-300"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          {project.roadWidth} m road
        </text>

        {/* plot dimensions */}
        <text
          x={x + plotW / 2} y={y - 14}
          textAnchor="middle" className="fill-slate-700 dark:fill-slate-300"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          {width} m
        </text>
        <text
          x={x - 18} y={y + plotH / 2}
          textAnchor="middle" className="fill-slate-700 dark:fill-slate-300"
          style={{ fontSize: 11, fontWeight: 600 }}
          transform={`rotate(-90 ${x - 18} ${y + plotH / 2})`}
        >
          {depth.toFixed(1)} m
        </text>
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/40 ring-1 ring-emerald-600" />
          buildable {buildableArea.toFixed(0)} m² ({coverage.toFixed(0)}% of plot)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200 ring-1 ring-slate-400 dark:bg-white/10" />
          setback — must stay open
        </span>
      </figcaption>
    </figure>
  );
};
