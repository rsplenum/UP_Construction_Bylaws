import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { NumberField } from '../components/ui/NumberField';
import {
  OCCUPANCY_GROUPS,
  OccupancyId,
  forArea, getOccupancy,
  occupanciesInGroup,
} from '../domain/occupancy';
import { derivePlotDepth } from '../domain/project';

/**
 * What you have and what you want to build.
 *
 * Simple mode asks five questions in plain words. Advanced mode adds the fields a
 * drawing needs. Both write to the same project, so switching modes never loses work
 * and never changes the answer — only how much of the input you are shown.
 */
export const SitePanel: React.FC = () => {
  const { project, patch } = useProject();
  const simple = project.mode === 'simple';
  const occupancy = getOccupancy(project.occupancy);
  // Clause 4.1.3 / 4.2.3: the minimum road width differs between a built-up area
  // and a new layout.
  const minRoadWidth = forArea(occupancy.minRoadWidthM, project.areaType ?? 'built_up');
  const depth = derivePlotDepth(project);

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <div>
        <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Your site</h2>
        <p className="mt-0.5 text-[11.5px] text-slate-600 dark:text-slate-400">
          {simple ? 'Five questions. Everything else is worked out for you.' : 'Full specification.'}
        </p>
      </div>

      {/* 1. What are you building? */}
      <div>
        <label htmlFor="ws-occupancy" className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
          What are you building?
        </label>
        <div className="relative">
          <select
            id="ws-occupancy"
            value={project.occupancy}
            onChange={(e) => patch({ occupancy: e.target.value as OccupancyId })}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
          >
            {OCCUPANCY_GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {occupanciesInGroup(group).map((o) => (
                  <option key={o.id} value={o.id}>
                    {simple ? o.plain : o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        </div>
        <p className="mt-1.5 text-[10.5px] leading-snug text-slate-600 dark:text-slate-400">{occupancy.note}</p>
      </div>

      {/* 2-3. The plot */}
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Plot area" unit="m²" value={project.plotArea}
          onChange={(v) => patch({ plotArea: v })} min={10} step={10}
        />
        <NumberField
          label="Road width" unit="m" value={project.roadWidth}
          onChange={(v) => patch({ roadWidth: v })} min={3} step={1}
          warning={project.roadWidth < minRoadWidth ? `Needs ${minRoadWidth} m` : undefined}
        />
      </div>

      {/* 4-5. The building */}
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Floor area you want" unit="m²" value={project.proposedBuiltUpArea}
          onChange={(v) => patch({ proposedBuiltUpArea: v })} min={10} step={10}
        />
        <NumberField
          label="Height" unit="m" value={project.buildingHeight}
          onChange={(v) => patch({ buildingHeight: v })} min={3} step={0.5}
          hint={project.buildingHeight > 15 ? 'High-rise rules apply' : undefined}
        />
      </div>

      {!simple && (
        <>
          <div className="border-t border-slate-200 pt-4 dark:border-white/10">
            <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Plot shape
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Frontage" unit="m" value={project.plotFrontage}
                onChange={(v) => patch({ plotFrontage: v, plotDepth: 0 })} min={3} step={0.5}
                hint={`Depth ${depth.toFixed(1)} m`}
              />
              <NumberField
                label="Circle rate" unit="₹/m²" value={project.circleRate}
                onChange={(v) => patch({ circleRate: v })} min={0} step={1000}
              />
              {/* Clause 3.2.2 sets no coverage percentage, so this can only come from the
                  applicant's own notified zonal plan. Blank means none. See B-056, V-064. */}
              <NumberField
                label="Zonal coverage cap" unit="%" value={project.zonalCoverageCapPct}
                onChange={(v) => patch({ zonalCoverageCapPct: v })} min={0} max={100} step={5}
                hint={project.zonalCoverageCapPct > 0
                  ? 'From your zonal plan — this clips the envelope'
                  : 'Byelaws set none; leave 0 unless your plan does'}
              />
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
              <input
                type="checkbox" checked={project.isCornerPlot}
                onChange={(e) => patch({ isCornerPlot: e.target.checked })}
                className="rounded text-emerald-700 focus:ring-emerald-500"
              />
              Corner plot — two road frontages
            </label>
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-white/10">
            <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Setbacks you have drawn
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Front" unit="m" value={project.frontSetbackProvided} onChange={(v) => patch({ frontSetbackProvided: v })} min={0} step={0.1} />
              <NumberField label="Rear" unit="m" value={project.rearSetbackProvided} onChange={(v) => patch({ rearSetbackProvided: v })} min={0} step={0.1} />
              <NumberField label="Left side" unit="m" value={project.side1Provided} onChange={(v) => patch({ side1Provided: v })} min={0} step={0.1} />
              <NumberField label="Right side" unit="m" value={project.side2Provided} onChange={(v) => patch({ side2Provided: v })} min={0} step={0.1} />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-white/10">
            <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Provisions
            </h3>
            <NumberField
              label="Parking" unit="car spaces" value={project.parkingBaysProvided}
              onChange={(v) => patch({ parkingBaysProvided: v })} min={0} step={1}
            />
            <div className="mt-3 space-y-2 text-[12px] text-slate-700 dark:text-slate-300">
              {([
                ['hasRWH', 'Rainwater harvesting system'],
                ['hasSolarPv', 'Solar photovoltaics'],
                ['hasSolarHeating', 'Solar water heating'],
                ['hasStilt', 'Stilt floor for parking'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox" checked={Boolean(project[key])}
                    onChange={(e) => patch({ [key]: e.target.checked })}
                    className="rounded text-emerald-700 focus:ring-emerald-500"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label htmlFor="ws-green" className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Green rating
              </label>
              <select
                id="ws-green"
                value={project.greenRating}
                onChange={(e) => patch({ greenRating: e.target.value as typeof project.greenRating })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              >
                <option value="none">None</option>
                <option value="silver">GRIHA 3-star / IGBC Silver (+3% FAR)</option>
                <option value="gold">GRIHA 4-star / IGBC Gold (+5% FAR)</option>
                <option value="platinum">GRIHA 5-star / IGBC Platinum (+7% FAR)</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
