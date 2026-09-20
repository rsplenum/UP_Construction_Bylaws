import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, Ban } from 'lucide-react';
import { NumberField } from '../components/ui/NumberField';
import { comparePlots, type PlotCandidate } from '../domain/compare';
import { ScopeFooter } from './ScopeFooter';
import { AREA_UNITS, UNIT_LABEL, formatArea, fromSqm, toSqm, type AreaUnit } from '../domain/units';
import type { AreaType } from '../domain/far';
import type { OccupancyId } from '../domain/occupancy';

const inr = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (abs >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2).replace(/\.00$/, '')} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

const USES = [
  { id: 'res_single' as OccupancyId, label: 'A house' },
  { id: 'com_complex' as OccupancyId, label: 'Shops or offices' },
];
const LAYOUTS: readonly { id: AreaType; label: string }[] = [
  { id: 'built_up', label: 'An existing colony' },
  { id: 'non_built_up', label: 'A new layout' },
];

const ROUTE_SHORT: Readonly<Record<string, string>> = {
  exempt: 'No approved map needed',
  instant_ltp: 'Instant online approval',
  full_scrutiny: 'Full scrutiny',
};

/**
 * Two plots, before either is bought.
 *
 * Every other screen here assumes the plot is already yours. The money is committed
 * earlier, choosing between two listings that read almost the same, and the byelaws have a
 * great deal to say about that choice which nobody works out, because working it out means
 * reading three tables twice.
 *
 * It asks four things per plot, and they are the four a listing already prints: area, the
 * road out front, the second road if it is a corner, and the asking price. Frontage and
 * depth are assumed from the area at a fixed ratio — a buyer at this stage rarely has
 * them, and since the same shape is assumed for both plots, neither can win on it.
 */
export const PlotCompare: React.FC = () => {
  const [use, setUse] = useState<OccupancyId>('res_single');
  const [areaType, setAreaType] = useState<AreaType>('built_up');
  const [unit, setUnit] = useState<AreaUnit>('gaj');
  const [a, setA] = useState<PlotCandidate>({
    label: 'Plot A', areaSqm: 167, frontRoadM: 9, sideRoadM: null, askingPriceRupees: null,
  });
  const [b, setB] = useState<PlotCandidate>({
    label: 'Plot B', areaSqm: 209, frontRoadM: 12, sideRoadM: null, askingPriceRupees: null,
  });

  const comparison = useMemo(
    () => comparePlots({ a, b, occupancy: use, areaType }),
    [a, b, use, areaType],
  );
  const [outA, outB] = comparison.outcomes;
  const barred = comparison.differences.find((d) => d.kind === 'roadGate');

  const editors: readonly [PlotCandidate, (p: PlotCandidate) => void][] = [[a, setA], [b, setB]];

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-6">
      <header className="mb-5">
        <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <ArrowLeftRight className="h-3 w-3" aria-hidden="true" />
          Before you buy
        </p>
        <h2 className={`font-serif text-[clamp(1.6rem,5vw,2.3rem)] font-semibold leading-[1.1] tracking-[-0.02em] ${
          barred ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
        }`}
        >
          {comparison.headline}
        </h2>
        <p className="mt-2 max-w-[58ch] text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
          Four things off the listing, for each plot. Width and depth are assumed at 1:2
          from the area — the same shape for both, so neither plot wins on a figure you
          have not given.
        </p>
      </header>

      {/* The same building on either plot: you are choosing the ground, not the project. */}
      <div className="mb-5 flex flex-wrap gap-4">
        {([
          ['What are you building', USES, use, (v: string) => setUse(v as OccupancyId)],
          ['Where', LAYOUTS, areaType, (v: string) => setAreaType(v as AreaType)],
        ] as const).map(([legend, options, current, set]) => (
          <fieldset key={legend}>
            <legend className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {legend}
            </legend>
            <div className="flex gap-1.5">
              {options.map((o) => (
                <button
                  key={o.id} type="button" onClick={() => set(o.id)} aria-pressed={current === o.id}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ring-1 transition ${
                    current === o.id
                      ? 'bg-sky-600 text-white ring-sky-600'
                      : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        <fieldset>
          <legend className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Area in
          </legend>
          <div className="flex gap-1" role="group" aria-label="Unit for plot area">
            {AREA_UNITS.map((u) => (
              <button
                key={u} type="button" onClick={() => setUnit(u)} aria-pressed={unit === u}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] transition-colors ${
                  unit === u
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10'
                }`}
              >
                {UNIT_LABEL[u]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {editors.map(([plot, set], i) => {
          const out = i === 0 ? outA : outB;
          const dead = out.gate.barred;
          return (
            <form
              key={plot.label} onSubmit={(e) => e.preventDefault()}
              className={`rounded-xl border p-3.5 ${
                dead
                  ? 'border-rose-300 bg-rose-50/60 dark:border-rose-500/40 dark:bg-rose-500/5'
                  : 'border-slate-200 bg-white dark:border-white/10 dark:bg-[#161617]'
              }`}
            >
              <input
                value={plot.label} aria-label={`Name for ${plot.label}`}
                onChange={(e) => set({ ...plot, label: e.target.value || (i === 0 ? 'Plot A' : 'Plot B') })}
                className="mb-2.5 w-full border-0 bg-transparent p-0 text-[13px] font-semibold text-slate-900 focus:outline-none focus:ring-0 dark:text-slate-100"
              />
              <div className="space-y-2.5">
                <NumberField
                  label="Plot area"
                  value={Number(fromSqm(plot.areaSqm, unit).toFixed(unit === 'sqm' ? 1 : 0))}
                  onChange={(v) => set({ ...plot, areaSqm: toSqm(v, unit) })}
                  min={1} step={10} unit={UNIT_LABEL[unit]}
                  hint={unit === 'sqm' ? undefined : formatArea(plot.areaSqm, 'sqm')}
                />
                <NumberField
                  label="Road out front" value={plot.frontRoadM}
                  onChange={(v) => set({ ...plot, frontRoadM: v })}
                  min={0} step={1.5} unit="m"
                />
                <NumberField
                  label="Second road, if a corner" value={plot.sideRoadM ?? 0}
                  onChange={(v) => set({ ...plot, sideRoadM: v > 0 ? v : null })}
                  min={0} step={1.5} unit="m" hint="0 if it is not a corner plot"
                />
                <NumberField
                  label="Asking price" value={plot.askingPriceRupees ?? 0}
                  onChange={(v) => set({ ...plot, askingPriceRupees: v > 0 ? v : null })}
                  min={0} step={1_00_000} unit="₹" hint="Your figure, not the byelaws'. 0 to leave it out."
                />
              </div>

              {/* The receipt. Same engine as the single-plot screen, so the two cannot
                  disagree about the same plot. */}
              <dl className="mt-3 space-y-1 border-t border-slate-200 pt-2.5 text-[11.5px] dark:border-white/10">
                {dead ? (
                  <p className="flex items-start gap-1.5 text-[11.5px] font-medium leading-snug text-rose-800 dark:text-rose-300">
                    <Ban className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Nothing can be built here for this use.
                  </p>
                ) : (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600 dark:text-slate-400">Builds</dt>
                      <dd className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                        {out.floorAreaSqm.toFixed(0)} m²
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600 dark:text-slate-400">Floors</dt>
                      <dd className="tabular-nums text-slate-800 dark:text-slate-200">
                        {out.floors} at {out.study.standard.heightM} m
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600 dark:text-slate-400">Approval</dt>
                      <dd className="text-right text-slate-800 dark:text-slate-200">
                        {ROUTE_SHORT[out.route.route]}
                      </dd>
                    </div>
                    {out.pricePerBuildableSqm !== null && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-600 dark:text-slate-400">Per buildable m²</dt>
                        <dd className="tabular-nums text-slate-800 dark:text-slate-200">
                          {inr(out.pricePerBuildableSqm)}
                        </dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </form>
          );
        })}
      </div>

      {comparison.level ? (
        <p className="mt-5 rounded-xl border border-slate-200 bg-white p-3.5 text-[12px] leading-relaxed text-slate-600 dark:border-white/10 dark:bg-[#161617] dark:text-slate-400">
          Same floor area, same floor count, same approval route. Whatever should decide
          between these two plots, it is not in the byelaws — price, aspect, the neighbours
          and the commute are yours to weigh.
        </p>
      ) : (
        <section className="mt-5">
          <h3 className="mb-2 text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
            What separates them
          </h3>
          <ul className="space-y-2">
            {comparison.differences.map((d) => (
              <li
                key={d.kind}
                className={`rounded-xl border p-3 ${
                  d.decisive
                    ? 'border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10'
                    : 'border-slate-200 bg-white dark:border-white/10 dark:bg-[#161617]'
                }`}
              >
                <p className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider ${
                  d.decisive ? 'text-rose-800 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'
                }`}
                >
                  {d.decisive && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />}
                  {d.label}
                </p>
                <p className={`mt-1 text-[12.5px] leading-snug ${
                  d.decisive ? 'text-rose-900 dark:text-rose-200' : 'text-slate-800 dark:text-slate-200'
                }`}
                >
                  {d.note}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        Both plots are run through the same engine as the single-plot screen, so nothing
        here can disagree with what that screen says about either one. Open a plot there to
        see its drawings, its setbacks and what the deviations would cost.
      </p>

      <ScopeFooter />
    </div>
  );
};
