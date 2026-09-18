import React, { useMemo, useState } from 'react';
import { AlertTriangle, Ruler, TrendingDown } from 'lucide-react';
import { NumberField } from '../components/ui/NumberField';
import { PlanDrawing } from './PlanDrawing';
import { PLOT_SIDES, SIDE_LABEL, type PlotSide, resolvePlotRoads } from '../domain/roads';
import { studyEnvelope } from '../domain/envelope';
import { pricePlans } from '../domain/plan-pricing';
import { resolveBaseFar } from '../domain/far';
import type { AreaType } from '../domain/far';
import type { OccupancyId } from '../domain/occupancy';

const inr = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (abs >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2).replace(/\.00$/, '')} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

/** The two uses this tool covers. Anything else needs the full workspace. */
const USES = [
  { id: 'res_single' as OccupancyId, label: 'A house', hint: 'One or more dwellings on a plotted residential site' },
  { id: 'com_complex' as OccupancyId, label: 'Shops or offices', hint: 'A commercial building — shops, units, a small complex' },
];

const LAYOUTS: readonly { id: AreaType; label: string; hint: string }[] = [
  { id: 'built_up', label: 'An existing colony', hint: 'A sanctioned layout that is already built up around you' },
  { id: 'non_built_up', label: 'A new layout', hint: 'A scheme being laid out now' },
];

/**
 * Two plans for one plot, from the six things an applicant actually knows.
 *
 * Every other screen in this app asks what you are building and answers whether it is
 * lawful. This one asks only about the ground — area, frontage, depth, and the road on each
 * side — and answers what may be built on it. Nothing here asks for a figure the applicant
 * would have to work out first: the floor area, the height, the floor count and every
 * offset are results, not questions, because each of them is a function of the plot and the
 * byelaws and the engine is better placed to compute it than the person asking.
 *
 * The two drawings answer the two questions people actually arrive with. The first is what
 * a sanction grants. The second is how far the same plot stretches once money is on the
 * table — and that one has a seam down the middle, because half the stretch is bought and
 * lawful and the other half is a breach with a price on it. The amber band is drawn outside
 * the sanctioned line, in another colour, hatched the other way, dashed, captioned inside
 * the drawing and again in the legend. Four signals for one fact, because the failure mode
 * is somebody building to the amber line thinking it was approved.
 */
export const PlotStudy: React.FC = () => {
  const [use, setUse] = useState<OccupancyId>('res_single');
  const [areaType, setAreaType] = useState<AreaType>('built_up');
  const [plotArea, setPlotArea] = useState(300);
  const [frontage, setFrontage] = useState(12);
  const [depth, setDepth] = useState(25);
  const [widths, setWidths] = useState<Record<PlotSide, number>>({
    front: 12, rear: 0, left: 0, right: 0,
  });
  const [lightVent, setLightVent] = useState(false);
  /** null = "as many as the byelaws allow", which is the answer most people want. */
  const [wantedFloors, setWantedFloors] = useState<number | null>(null);
  const [landRate, setLandRate] = useState(35000);

  const result = useMemo(() => {
    const roads = resolvePlotRoads(widths);
    const study = studyEnvelope({
      occupancy: use,
      plotAreaSqm: plotArea,
      frontageM: frontage,
      depthM: depth,
      roads,
      areaType,
      lightVentilationEnsured: use === 'com_complex' && lightVent,
    });
    const far = resolveBaseFar({
      occupancy: use, plotArea, roadWidth: roads.governingRoadWidthM, areaType,
    });
    const priced = pricePlans({
      study, occupancy: use, areaType, landRate,
      baseFar: far.effectiveBaseFar || far.baseFar,
    });
    return { roads, study, priced };
  }, [use, areaType, plotArea, frontage, depth, widths, lightVent, landRate]);

  const { roads, study, priced } = result;
  const geometryMismatch = Math.abs(frontage * depth - plotArea) > Math.max(1, plotArea * 0.02);
  const boughtArea = study.maximum.floorAreaSqm - study.standard.floorAreaSqm;

  // The ladder already holds every floor count the engine evaluated, so wanting a
  // particular number of floors selects a rung rather than driving the arithmetic. A
  // person knows how many floors they want; nobody knows their own floor area.
  const allowed = study.ladder.filter((r) => !r.refusedBecause);
  const chosen = wantedFloors === null
    ? null
    : study.ladder.find((r) => r.floors === wantedFloors) ?? null;

  // Computed from the same study that draws the plans, so the answer at the top and the
  // drawings beneath it cannot disagree.
  const buildable = study.standard.floorAreaSqm > 0.5;
  const verdictWord = !buildable
    ? 'Nothing, yet.'
    : chosen?.refusedBecause
      ? `${chosen.floors} floors: no.`
      : 'Yes.';
  const verdictTone = !buildable || chosen?.refusedBecause
    ? 'text-rose-700 dark:text-rose-400'
    : 'text-emerald-700 dark:text-emerald-400';
  const verdictLine = !buildable
    ? 'No floor area can be sanctioned on these figures. Check the plot size and the road widths.'
    : chosen?.refusedBecause
      ? chosen.refusedBecause
      : `${study.standard.floorAreaSqm.toFixed(0)} m² across ${study.standard.floors} `
        + `floor${study.standard.floors === 1 ? '' : 's'}, as of right. `
        + (boughtArea > 0.5
          ? `Up to ${study.maximum.floorAreaSqm.toFixed(0)} m² if you buy the extra density.`
          : 'Buying extra density adds nothing on this plot.');

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6">
      <header className="mb-6">
        <h2 className={`font-serif text-[clamp(2.4rem,8vw,3.6rem)] font-semibold leading-[1.04] tracking-[-0.022em] ${verdictTone}`}>
          {verdictWord}
        </h2>
        <p className="mt-2.5 max-w-[46ch] font-serif text-[clamp(1rem,2.8vw,1.2rem)] leading-snug text-slate-700 dark:text-slate-300">
          {verdictLine}
        </p>
        <p className="mt-2 max-w-[62ch] text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
          Tell it about the ground and it works out the building. The floor area, the height and
          every offset are answers here, not questions — each one is fixed by the byelaws once the
          plot is known.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[264px_1fr]">
        {/* ---------------------------------------------------------------- inputs */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            <legend className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
              What are you building
            </legend>
            <div className="grid grid-cols-2 gap-1.5">
              {USES.map((u) => (
                <button
                  key={u.id} type="button" onClick={() => setUse(u.id)}
                  aria-pressed={use === u.id} title={u.hint}
                  className={`rounded-lg px-2.5 py-2 text-[12px] font-medium ring-1 transition ${
                    use === u.id
                      ? 'bg-sky-600 text-white ring-sky-600'
                      : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
              The plot
            </legend>
            <div className="space-y-2.5">
              <NumberField label="Plot area" value={plotArea} onChange={setPlotArea} min={20} step={10} unit="m²" />
              <NumberField label="Width at the road" value={frontage} onChange={setFrontage} min={3} step={0.5} unit="m" />
              <NumberField
                label="Depth" value={depth} onChange={setDepth} min={3} step={0.5} unit="m"
                warning={geometryMismatch
                  ? `${frontage} × ${depth} is ${(frontage * depth).toFixed(0)} m², not ${plotArea} m². The drawing uses the width and depth.`
                  : undefined}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1 text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Roads
            </legend>
            <p className="mb-2 text-[10.5px] leading-snug text-slate-500 dark:text-slate-500">
              Leave a side at 0 where there is no road. {roads.count >= 2 && (
                <span className="text-slate-700 dark:text-slate-300">{roads.label}.</span>
              )}
            </p>
            <div className="space-y-2.5">
              {PLOT_SIDES.map((side) => (
                <NumberField
                  key={side}
                  label={`${SIDE_LABEL[side]} road`}
                  value={widths[side]}
                  onChange={(v) => setWidths((w) => ({ ...w, [side]: v }))}
                  min={0} step={0.5} unit="m"
                  hint={roads.frontSide === side && roads.count >= 2
                    ? 'The widest road — the byelaws call this the front'
                    : undefined}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Where it sits
            </legend>
            <div className="space-y-1.5">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id} type="button" onClick={() => setAreaType(l.id)}
                  aria-pressed={areaType === l.id}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[12px] ring-1 transition ${
                    areaType === l.id
                      ? 'bg-sky-50 text-sky-900 ring-sky-400 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-500/40'
                      : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/10'
                  }`}
                >
                  <span className="font-medium">{l.label}</span>
                  <span className="block text-[10.5px] leading-snug opacity-70">{l.hint}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] leading-snug text-slate-500 dark:text-slate-500">
              On a corner plot this changes the side offset — Table 3.2.1 Note-2 reads the two cases
              differently.
            </p>
          </fieldset>

          {use === 'com_complex' && (
            <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-200 dark:bg-white/[0.04] dark:ring-white/10">
              <input
                type="checkbox" checked={lightVent} onChange={(e) => setLightVent(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-sky-600"
              />
              <span className="text-[11.5px] leading-snug text-slate-700 dark:text-slate-300">
                <span className="font-medium">Light and ventilation ensured otherwise</span>
                <span className="block text-[10.5px] opacity-75">
                  Clause 3.2.4.3 Note-1 then lifts the rear and side offsets, up to 500 m² of ground floor.
                </span>
              </span>
            </label>
          )}

          <NumberField
            label="Land rate" value={landRate} onChange={setLandRate} min={0} step={1000} unit="₹/m²"
            hint="The residential circle rate — what the fees are worked out on"
          />

          {/* The one thing about the building a person does know. It selects a rung of the
              ladder the engine has already worked out; it does not drive the arithmetic. */}
          {allowed.length > 0 && (
            <fieldset className="border-0 p-0">
              <legend className="mb-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                How many floors do you want?
              </legend>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button" onClick={() => setWantedFloors(null)}
                  aria-pressed={wantedFloors === null}
                  className={`rounded-lg border px-2.5 py-1 text-[12px] transition-colors ${
                    wantedFloors === null
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:text-slate-300'
                  }`}
                >
                  As many as allowed
                </button>
                {study.ladder.map((rung) => (
                  <button
                    key={rung.floors} type="button"
                    onClick={() => setWantedFloors(rung.floors)}
                    aria-pressed={wantedFloors === rung.floors}
                    title={rung.refusedBecause ?? `${rung.usableSqm.toFixed(0)} m² usable`}
                    className={`rounded-lg border px-2.5 py-1 text-[12px] tabular-nums transition-colors ${
                      wantedFloors === rung.floors
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : rung.refusedBecause
                          ? 'border-slate-200 text-slate-400 line-through dark:border-white/10 dark:text-slate-600'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:text-slate-300'
                    }`}
                  >
                    {rung.floors}
                  </button>
                ))}
              </div>
              {chosen && !chosen.refusedBecause && (
                <p className="mt-1.5 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                  {chosen.floors} floors gives {chosen.usableSqm.toFixed(0)} m² at{' '}
                  {chosen.heightM} m
                  {chosen.usableSqm < study.standard.floorAreaSqm - 0.5
                    ? ` — ${(study.standard.floorAreaSqm - chosen.usableSqm).toFixed(0)} m² less than the best this plot can do.`
                    : '.'}
                </p>
              )}
              {chosen?.refusedBecause && (
                <p className="mt-1.5 text-[11px] leading-snug text-rose-700 dark:text-rose-400">
                  {chosen.refusedBecause}
                </p>
              )}
            </fieldset>
          )}
        </form>

        {/* --------------------------------------------------------------- results */}
        <div className="min-w-0 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-[#161617]">
              <PlanDrawing
                plan={study.standard} roads={roads} frontageM={frontage} depthM={depth}
                title="Standard planning"
                subtitle="What a sanction grants you, without buying anything."
              />
              <dl className="mt-3 space-y-1 border-t border-slate-200 pt-2.5 text-[11.5px] dark:border-white/10">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-slate-400">Floor area</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {study.standard.floorAreaSqm.toFixed(0)} m²
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-slate-400">Floors</dt>
                  <dd className="tabular-nums text-slate-800 dark:text-slate-200">
                    {study.standard.floors} at {study.standard.heightM} m
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-slate-400">Extra to pay</dt>
                  <dd className="font-medium text-emerald-700 dark:text-emerald-400">Nothing</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-[#161617]">
              <PlanDrawing
                plan={study.maximum} roads={roads} frontageM={frontage} depthM={depth}
                margin={study.compoundable}
                title="Stretched, with fees"
                subtitle="Green is bought and sanctioned. Amber is a breach you would be paying to have forgiven."
              />
              <dl className="mt-3 space-y-1 border-t border-slate-200 pt-2.5 text-[11.5px] dark:border-white/10">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-slate-400">Floor area</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {study.maximum.floorAreaSqm.toFixed(0)} m²
                    {boughtArea > 0.5 && (
                      <span className="ml-1 font-normal text-emerald-700 dark:text-emerald-400">
                        +{boughtArea.toFixed(0)}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-slate-400">Floors</dt>
                  <dd className="tabular-nums text-slate-800 dark:text-slate-200">
                    {study.maximum.floors} at {study.maximum.heightM} m
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-slate-400">Buy the density</dt>
                  <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {priced.maximum.total > 0 ? inr(priced.maximum.total) : '—'}
                  </dd>
                </div>
                {priced.compounding && priced.compounding.total > 0 && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-amber-700 dark:text-amber-400">Amber band, if built</dt>
                    <dd className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {inr(priced.compounding.total)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* The amber band is the one thing on this screen that can be misread. */}
          {priced.compounding && (
            <section className="rounded-xl border-2 border-amber-400 bg-amber-50 p-3.5 dark:border-amber-500/50 dark:bg-amber-500/10">
              <h2 className="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                The amber band buys no permission
              </h2>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                {priced.compounding.statusNote}
              </p>
              {study.compoundable.farHeadroomExhausted && (
                <p className="mt-2 rounded-lg bg-amber-100/70 px-2.5 py-2 text-[11.5px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                  <span className="font-semibold">And it buys no floor area either.</span>{' '}
                  Clause 16.3.8(v) caps compounding at the maximum permissible FAR, which the green
                  plan already reaches. The {study.compoundable.totalEncroachmentSqm.toFixed(0)} m² of
                  offset it would take back gives you a wider footprint for the same total area — the
                  same building on fewer floors, not a bigger one.
                </p>
              )}
              <ul className="mt-2 space-y-1">
                {priced.compounding.lines.map((l) => (
                  <li key={l.label} className="flex justify-between gap-3 text-[11px] text-amber-900/85 dark:text-amber-200/85">
                    <span>{l.label}</span>
                    <span className="shrink-0 font-medium tabular-nums">{inr(l.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {study.cliff && (
            <section className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 dark:border-rose-500/40 dark:bg-rose-500/10">
              <h2 className="flex items-center gap-1.5 text-[12.5px] font-semibold text-rose-900 dark:text-rose-200">
                <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Do not add a {study.cliff.atFloors}th floor
              </h2>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-rose-900/90 dark:text-rose-200/90">
                {study.cliff.note}
              </p>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-[#161617]">
            <h2 className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <Ruler className="h-3 w-3" aria-hidden="true" />
              What the engine worked out, and why
            </h2>
            <ul className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
              <li>{study.standard.bindingNote}</li>
              <li>{study.maximum.setbacks.clauseRef} sets the offsets at {study.maximum.setbacks.front}/{study.maximum.setbacks.rear}/{study.maximum.setbacks.side1}/{study.maximum.setbacks.side2} m ({study.maximum.setbacks.bandLabel}).</li>
              <li>{study.maximum.coverage.basisNote}</li>
            </ul>
            <details className="mt-2.5 group">
              <summary className="cursor-pointer text-[11px] font-medium text-sky-700 hover:underline dark:text-sky-400">
                Every assumption and reading behind these numbers
              </summary>
              <ul className="mt-2 space-y-1.5 border-l-2 border-slate-200 pl-3 text-[11px] leading-relaxed text-slate-600 dark:border-white/10 dark:text-slate-400">
                {[
                  ...study.caveats,
                  ...study.maximum.setbacks.caveats,
                  ...(priced.compounding?.caveats ?? []),
                ].map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </details>
          </section>
        </div>
      </div>
    </div>
  );
};
