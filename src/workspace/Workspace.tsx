import React, { useMemo, useState } from 'react';
import { Building2, FileDown, RotateCcw, Undo2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { assessProject } from '../domain/findings';
import { resolveRequiredSetbacks } from '../domain/setbacks';
import { getOccupancy } from '../domain/occupancy';
import { Finding } from '../domain/findings';
import { SitePanel } from './SitePanel';
import { SitePlan } from './SitePlan';
import { VerdictPanel } from './VerdictPanel';

const FACE_OF: Record<string, 'front' | 'rear' | 'side1' | 'side2' | null> = {
  setbacks: 'front',
  'envelope-viability': null,
};

/**
 * The whole application.
 *
 * Left: what you have. Middle: what that means, drawn. Right: what the byelaws say
 * about it. There is nowhere else to go, because there is nothing else to ask.
 */
export const Workspace: React.FC = () => {
  const { project, patch, reset, undo, canUndo, lastSavedLabel } = useProject();
  const [hovered, setHovered] = useState<Finding | null>(null);

  const assessment = useMemo(() => assessProject(project), [project]);
  const required = useMemo(
    () =>
      resolveRequiredSetbacks({
        occupancy: project.occupancy,
        plotArea: project.plotArea,
        buildingHeight: project.buildingHeight,
        isCornerPlot: project.isCornerPlot,
      }),
    [project],
  );

  const occupancy = getOccupancy(project.occupancy);
  const simple = project.mode === 'simple';

  return (
    <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-px overflow-hidden bg-slate-200 lg:h-[calc(100vh-8.5rem)] lg:grid-cols-[minmax(280px,320px)_1fr_minmax(340px,420px)] dark:bg-white/10">
      {/* what you have */}
      <aside aria-label="Your site" className="bg-white lg:overflow-hidden dark:bg-[#161617]">
        <SitePanel />
      </aside>

      {/* what it means */}
      <section aria-label="Site plan" className="flex flex-col overflow-y-auto bg-slate-50 dark:bg-[#0f0f10]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-3 dark:border-white/10">
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
              {simple ? occupancy.plain : occupancy.label}
            </h2>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {project.plotArea} m² plot · {project.roadWidth} m road · {project.buildingHeight} m tall
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Simple / Advanced */}
            <div className="flex rounded-full bg-slate-200/70 p-0.5 dark:bg-white/10" role="group" aria-label="Detail level">
              {(['simple', 'advanced'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => patch({ mode: m })}
                  aria-pressed={project.mode === m}
                  className={`rounded-full px-3 py-1 text-[11.5px] font-semibold capitalize transition-colors ${
                    project.mode === m
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              type="button" onClick={undo} disabled={!canUndo}
              title="Undo the last change" aria-label="Undo the last change"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button" onClick={reset}
              title="Start again" aria-label="Start again"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="w-full max-w-[560px]">
            <SitePlan
              project={project}
              required={required}
              highlight={hovered ? FACE_OF[hovered.id] ?? null : null}
              coveragePct={project.zonalCoverageCapPct > 0 ? project.zonalCoverageCapPct : null}
            />
          </div>

          {/* The two numbers that matter, under the drawing */}
          <div className="mt-6 grid w-full max-w-[560px] grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-200 dark:bg-white/10">
            <div className="bg-white p-4 dark:bg-[#161617]">
              <p className="text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Floor area you may build
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {assessment.permissibleArea.toFixed(0)}
                <span className="ml-1 text-sm font-medium text-slate-600 dark:text-slate-400">m²</span>
              </p>
            </div>
            <div className="bg-white p-4 dark:bg-[#161617]">
              <p className="text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                You have drawn
              </p>
              <p
                className={`mt-0.5 text-2xl font-bold tabular-nums ${
                  assessment.proposedArea > assessment.permissibleArea
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {assessment.proposedArea.toFixed(0)}
                <span className="ml-1 text-sm font-medium text-slate-600 dark:text-slate-400">m²</span>
              </p>
            </div>
          </div>

          <p className="mt-4 text-[10.5px] text-slate-600 dark:text-slate-400">
            {lastSavedLabel ? `Saved ${lastSavedLabel} on this device` : 'Saved on this device'}
          </p>
        </div>
      </section>

      {/* what the byelaws say */}
      <aside aria-label="What the byelaws say" className="bg-white lg:overflow-hidden dark:bg-[#161617]">
        <VerdictPanel assessment={assessment} onHoverFinding={setHovered} />
      </aside>
    </div>
  );
};
