import React, { useMemo, useState } from 'react';
import { AlertTriangle, Ruler, TrendingDown } from 'lucide-react';
import { Clause } from '../components/ui/Clause';
import { NumberField } from '../components/ui/NumberField';
import { PlanDrawing } from './PlanDrawing';
import { PLOT_SIDES, SIDE_LABEL, type PlotSide, resolvePlotRoads } from '../domain/roads';
import { studyEnvelope, planAtFloors, DEFAULT_FLOOR_TO_FLOOR_M } from '../domain/envelope';
import {
  COST_RATES, QUALITY_LABEL, estimateBuildCost, type BuildQuality,
} from '../domain/build-cost';
import { pricePlans } from '../domain/plan-pricing';
import { resolveBaseFar } from '../domain/far';
import { assessSanctionRoute } from '../domain/permission';
import { HIGH_RISE_THRESHOLD_M } from '../domain/setbacks';
import { getOccupancy } from '../domain/occupancy';
import { ScopeFooter } from './ScopeFooter';
import {
  AREA_UNITS, UNIT_LABEL, UP_BIGHA_RECKONINGS, bighaToSqm, formatArea, fromSqm, toSqm,
  type AreaUnit,
} from '../domain/units';
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
  // Gaj is how land is bought and sold across Uttar Pradesh, so it is the default;
  // the engine still only ever sees square metres.
  const [unit, setUnit] = useState<AreaUnit>('gaj');
  const [frontage, setFrontage] = useState(12);
  const [depth, setDepth] = useState(25);
  const [widths, setWidths] = useState<Record<PlotSide, number>>({
    front: 12, rear: 0, left: 0, right: 0,
  });
  const [lightVent, setLightVent] = useState(false);
  /** null = let the engine assume 3 m. Set, it is the reader's own figure. */
  const [floorToFloor, setFloorToFloor] = useState<number | null>(null);
  /** null = "as many as the byelaws allow", which is the answer most people want. */
  const [wantedFloors, setWantedFloors] = useState<number | null>(null);
  const [landRate, setLandRate] = useState(35000);
  const [costRateId, setCostRateId] = useState(COST_RATES[0].id);
  const [quality, setQuality] = useState<BuildQuality>('standard');
  const [bigha, setBigha] = useState(1);
  const [reckoningId, setReckoningId] = useState(UP_BIGHA_RECKONINGS[0].id);

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
      ...(floorToFloor !== null ? { floorToFloorM: floorToFloor } : {}),
    });
    const far = resolveBaseFar({
      occupancy: use, plotArea, roadWidth: roads.governingRoadWidthM, areaType,
    });
    const priced = pricePlans({
      study, occupancy: use, areaType, landRate,
      baseFar: far.effectiveBaseFar || far.baseFar,
    });
    return { roads, study, priced };
  }, [use, areaType, plotArea, frontage, depth, widths, lightVent, landRate, floorToFloor]);

  const { roads, study, priced } = result;

  // What the two site plans draw. Asking for three floors used to change the sentence and
  // leave both drawings showing four; a drawing that disagrees with the sentence above it
  // is worse than no drawing. Each is measured against its own entitlement — the ladders
  // differ, and the maximum one is clamped to the purchasable ceiling.
  const standardPlan = (wantedFloors !== null && planAtFloors(study, wantedFloors, 'standard'))
    || study.standard;
  const maximumPlan = (wantedFloors !== null && planAtFloors(study, wantedFloors, 'maximum'))
    || study.maximum;
  const showingChoice = standardPlan !== study.standard || maximumPlan !== study.maximum;

  // The question people actually arrive with. UP's own coverage of these byelaws led on
  // it — "no approved map under 1,000 sq ft", "an architect's certificate up to 5,000" —
  // and the engine has answered it all along on a screen nobody opened.
  const route = assessSanctionRoute({
    occupancy: getOccupancy(use),
    plotAreaSqm: plotArea,
    buildingHeightM: study.standard.heightM,
    highRiseThresholdM: HIGH_RISE_THRESHOLD_M,
  });
  // A citation is the receipt for the sentence beside it, so it has to be the right one.
  // The first cut printed the setback table whatever bound, which put Table 3.2.1 under
  // "Floor Area Ratio is what stops you" — a wrong citation is worse than none, because
  // a reader who follows it finds a table that says nothing about their problem. Only the
  // two setback-driven cases have a ref to hand, so only they carry one.
  const BINDING_SENTENCE: Record<typeof study.standard.binding, string> = {
    far: 'The FAR entitlement is what stops you.',
    footprint: 'The setbacks are what stop you.',
    floors: 'The floor-count ceiling is what stops you.',
    height: 'The height ceiling is what stops you.',
    choice: 'Nothing stops you — this is the floor count you asked for.',
  };
  const bindingCite = study.standard.binding === 'footprint' || study.standard.binding === 'floors'
    ? study.standard.setbacks.clauseRef
    : null;

  const ROUTE_HEADLINE: Record<typeof route.route, string> = {
    exempt: 'No approved map needed.',
    instant_ltp: 'Approved online, on your architect\u2019s certificate.',
    full_scrutiny: 'This one goes through full scrutiny.',
  };
  const costRate = COST_RATES.find((r) => r.id === costRateId) ?? COST_RATES[0];
  const buildCost = estimateBuildCost({
    floorAreaSqm: standardPlan.floorAreaSqm, rate: costRate, quality,
  });
  const reckoning = UP_BIGHA_RECKONINGS.find((r) => r.id === reckoningId) ?? UP_BIGHA_RECKONINGS[0];

  const geometryMismatch = Math.abs(frontage * depth - plotArea) > Math.max(1, plotArea * 0.02);
  const boughtArea = study.maximum.floorAreaSqm - study.standard.floorAreaSqm;

  // Area is the number people actually know — a plot is bought and sold by it, and the
  // byelaws meter by it — so an area edit carries the rectangle with it, keeping the shape
  // it had, instead of leaving the width and depth behind to contradict it one field later.
  // Typing a width or a depth still stands on its own: a plot that is not a rectangle is a
  // real thing, and the note under Depth is for that case, not for this one.
  const setPlotAreaKeepingShape = (nextSqm: number) => {
    setPlotArea(nextSqm);
    if (!(nextSqm > 0) || !(frontage > 0) || !(depth > 0)) return;
    const scale = Math.sqrt(nextSqm / (frontage * depth));
    const nextFrontage = Math.max(3, Math.round(frontage * scale * 10) / 10);
    setFrontage(nextFrontage);
    setDepth(Math.max(3, Math.round((nextSqm / nextFrontage) * 10) / 10));
  };

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
      : `${standardPlan.floorAreaSqm.toFixed(0)} m² across ${standardPlan.floors} `
        + `floor${standardPlan.floors === 1 ? '' : 's'}, as of right. `
        + (maximumPlan.floorAreaSqm - standardPlan.floorAreaSqm > 0.5
          ? `Up to ${maximumPlan.floorAreaSqm.toFixed(0)} m² if you buy the extra density.`
          : 'Buying extra density adds nothing on this plot.')
        // A reader who has asked for fewer floors than the plot allows should be told
        // what the choice costs them, once, rather than left to compare two numbers.
        + (showingChoice && study.standard.floorAreaSqm - standardPlan.floorAreaSqm > 0.5
          ? ` Your ${standardPlan.floors} floors leave `
            + `${(study.standard.floorAreaSqm - standardPlan.floorAreaSqm).toFixed(0)} m² unused: `
            + `this plot would take ${study.standard.floors}.`
          : '');

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6">
      <header className="mb-6">
        <h2 className={`font-serif text-[clamp(2.4rem,8vw,3.6rem)] font-semibold leading-[1.04] tracking-[-0.022em] ${verdictTone}`}>
          {verdictWord}
        </h2>
        <p className="mt-2.5 max-w-[46ch] font-serif text-[clamp(1rem,2.8vw,1.2rem)] leading-snug text-slate-700 dark:text-slate-300">
          {verdictLine}
        </p>

        {/* Permission, answered on the same screen as size. A reader's first worry is
            whether they need a sanctioned map at all — a bigger relief than any FAR
            figure, and until now it lived two clicks away on a different screen. */}
        {buildable && (
          <div className="mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[13px]">
            <span className={`font-semibold ${
              route.route === 'full_scrutiny'
                ? 'text-slate-800 dark:text-slate-200'
                : 'text-emerald-800 dark:text-emerald-300'
            }`}
            >
              {ROUTE_HEADLINE[route.route]}
            </span>
            <span className="text-slate-600 dark:text-slate-400">{route.because}</span>
            <Clause>{route.clause}</Clause>
          </div>
        )}

        {/* What stopped the building, which the engine has always known and never said.
            A competitor's entire marketing line is this one sentence — "which bylaw binds
            first" — and ours was the third bullet of a panel near the bottom of the page.
            The stranded area is the part that stings: entitlement you hold and cannot use. */}
        {buildable && (
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px]">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {BINDING_SENTENCE[study.standard.binding]}
            </span>
            {study.standard.strandedSqm > 0.5 && (
              <span className="text-slate-600 dark:text-slate-400">
                {study.standard.strandedSqm.toFixed(0)} m² of the entitlement is out of reach.
              </span>
            )}
            {bindingCite && <Clause>{bindingCite}</Clause>}
          </p>
        )}

        {/* The conditions are real — any one of them failing moves you to a slower route —
            but four clauses of prose set above the fold buried the answer they qualify.
            Folded: one line says the route has strings, opening it names every one. */}
        {buildable && route.conditional && route.conditions.length > 0 && (
          <details className="group mt-1.5 max-w-[62ch]">
            <summary className="cursor-pointer list-none text-[12px] text-amber-800 marker:content-none hover:underline dark:text-amber-300">
              {route.conditions.length === 1
                ? 'One thing must be true for this route'
                : `${route.conditions.length} things must be true for this route`}
              <span className="ml-1 text-amber-700/70 group-open:hidden dark:text-amber-400/70">
                — show them
              </span>
            </summary>
            <ul className="mt-1.5 space-y-1 border-l border-amber-300 pl-3 text-[12px] leading-snug text-amber-800 dark:border-amber-500/40 dark:text-amber-300">
              {route.conditions.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </details>
        )}
        {/* The number that turns an entitlement into a decision, and the only figure on
            this screen the gazette has no view on — so it sits below everything the
            byelaws settle, behind a rule, wearing a label saying what it is not. */}
        {buildable && buildCost.totalRupees > 0 && (
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-dashed border-slate-300 pt-2.5 text-[13px] dark:border-white/15">
            <span className="text-slate-800 dark:text-slate-200">
              About <span className="font-semibold">{inr(buildCost.totalRupees)}</span> to build
              it — {costRate.label} rates, {QUALITY_LABEL[quality].toLowerCase()}.
            </span>
            <span className="rounded bg-slate-200 px-1.5 py-px text-[10.5px] font-medium uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-400">
              Not a byelaws figure
            </span>
          </p>
        )}

        <p className="mt-2 max-w-[62ch] text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
          Tell it about the ground and it works out the building. The floor area, the height,
          every offset and which approval route you are on are answers here, not questions —
          each one is fixed by the byelaws once the plot is known.
        </p>
      </header>

      {/* The verdict already sits above this block, so the answer comes first on every
          width without moving anything. An earlier version pushed the form below the
          drawings on a phone as well; that solved nothing — the answer was never behind
          the form — and left a reader who wanted to change their plot area scrolling
          past two site plans to find the field. Reverted. */}
      <div className="grid gap-6 lg:grid-cols-[264px_1fr]">
        {/* ---------------------------------------------------------------- inputs */}
        <form id="plot-inputs" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
              <div>
                <NumberField
                  label="Plot area"
                  value={Number(fromSqm(plotArea, unit).toFixed(unit === 'sqm' ? 1 : 0))}
                  onChange={(v) => setPlotAreaKeepingShape(toSqm(v, unit))}
                  min={1} step={unit === 'sqm' ? 10 : 10} unit={UNIT_LABEL[unit]}
                  hint={unit === 'sqm' ? undefined : formatArea(plotArea, 'sqm')}
                />
                <div className="mt-1.5 flex gap-1" role="group" aria-label="Unit for plot area">
                  {AREA_UNITS.map((u) => (
                    <button
                      key={u} type="button" onClick={() => setUnit(u)}
                      aria-pressed={unit === u}
                      className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                        unit === u
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10'
                      }`}
                    >
                      {UNIT_LABEL[u]}
                    </button>
                  ))}
                </div>

                {/* The bigha is not in the picker above and cannot be: inside UP alone it
                    runs from 5 biswa to 20, so choosing one silently would size a plot
                    wrong by up to four to one while the answer stayed confident and fully
                    cited. Folded away, because most readers were quoted in gaj and should
                    not have to read any of this. */}
                <details className="group mt-2">
                  <summary className="cursor-pointer list-none text-[11px] text-sky-700 marker:content-none hover:underline dark:text-sky-400">
                    Quoted in bigha?
                  </summary>
                  <div className="mt-1.5 rounded-lg border border-slate-200 p-2 dark:border-white/10">
                    <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                      A bigha is not one size in Uttar Pradesh. Say which one you were
                      quoted — getting it wrong is a factor of four.
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {UP_BIGHA_RECKONINGS.map((r) => (
                        <button
                          key={r.id} type="button" onClick={() => setReckoningId(r.id)}
                          aria-pressed={reckoningId === r.id} title={r.where}
                          className={`rounded px-2 py-1 text-[11px] transition-colors ${
                            reckoningId === r.id
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">
                      {reckoning.where}
                    </p>
                    <div className="mt-2">
                      <NumberField
                        label="Bigha" value={bigha} onChange={setBigha}
                        min={0} step={0.25} unit="bigha"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlotAreaKeepingShape(bighaToSqm(bigha, reckoning))}
                      className="mt-1.5 w-full rounded-lg bg-sky-600 px-2 py-1.5 text-[11.5px] font-medium text-white transition hover:bg-sky-700"
                    >
                      Use {formatArea(bighaToSqm(bigha, reckoning), unit)}
                    </button>
                  </div>
                </details>
              </div>
              <NumberField label="Width at the road" value={frontage} onChange={setFrontage} min={3} step={0.5} unit="m" />
              <NumberField
                label="Depth" value={depth} onChange={setDepth} min={3} step={0.5} unit="m"
                warning={geometryMismatch
                  ? `${frontage} × ${depth} m is ${formatArea(frontage * depth, unit)}, not ${formatArea(plotArea, unit)}. The drawing uses the width and depth.`
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

          {/* Market rates, kept visibly apart from everything the gazette settles. */}
          <fieldset>
            <legend className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Build cost — not a byelaws figure
            </legend>
            <div className="flex flex-wrap gap-1">
              {COST_RATES.map((r) => (
                <button
                  key={r.id} type="button" onClick={() => setCostRateId(r.id)}
                  aria-pressed={costRateId === r.id} title={r.note}
                  className={`rounded px-2 py-1 text-[11px] transition-colors ${
                    costRateId === r.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(['basic', 'standard', 'premium'] as const).map((q) => (
                <button
                  key={q} type="button" onClick={() => setQuality(q)}
                  aria-pressed={quality === q}
                  className={`rounded px-2 py-1 text-[11px] transition-colors ${
                    quality === q
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10'
                  }`}
                >
                  {QUALITY_LABEL[q]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">
              {inr(buildCost.perSqft)}/sq ft. {costRate.note}
            </p>
          </fieldset>

          {/* Height is an answer here, not a question: the byelaws cap it, and it follows
              from the floor count and the storey height. But the storey height is the one
              part of that the gazette does not settle — it fixes a 2.75 m minimum room
              height and no floor-to-floor figure at all — so the engine had to assume 3 m,
              and a reader who wants taller ceilings had no way to say so even though it
              changes how many floors fit under the cap. Folded away, because 3 m is right
              for almost everyone. */}
          <details className="group">
            <summary className="cursor-pointer list-none text-[11px] text-sky-700 marker:content-none hover:underline dark:text-sky-400">
              Want taller ceilings?
            </summary>
            <div className="mt-1.5 rounded-lg border border-slate-200 p-2 dark:border-white/10">
              <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                The building’s total height is set by the byelaws and is not yours to choose.
                The height of one storey is: the gazette fixes only a 2.75 m minimum room
                height. Raise it and fewer floors fit under the same cap.
              </p>
              <div className="mt-2">
                <NumberField
                  label="Floor to floor"
                  value={floorToFloor ?? DEFAULT_FLOOR_TO_FLOOR_M}
                  onChange={(v) => setFloorToFloor(v)}
                  min={2.75} max={6} step={0.25} unit="m"
                  hint={floorToFloor === null
                    ? `Assumed at ${DEFAULT_FLOOR_TO_FLOOR_M} m — the minimum room height plus a slab`
                    : 'Your figure, not the gazette\u2019s'}
                />
              </div>
              {floorToFloor !== null && (
                <button
                  type="button" onClick={() => setFloorToFloor(null)}
                  className="mt-1.5 text-[11px] text-sky-700 hover:underline dark:text-sky-400"
                >
                  Back to the {DEFAULT_FLOOR_TO_FLOOR_M} m assumption
                </button>
              )}
            </div>
          </details>

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
                plan={standardPlan} roads={roads} frontageM={frontage} depthM={depth}
                title="Standard planning"
                subtitle="What a sanction grants you, without buying anything. This is the plan you apply for."
              />
              <dl className="mt-3 space-y-1 border-t border-slate-200 pt-2.5 text-[11.5px] dark:border-white/10">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-slate-400">Floor area</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {standardPlan.floorAreaSqm.toFixed(0)} m²
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-slate-400">Floors</dt>
                  <dd className="tabular-nums text-slate-800 dark:text-slate-200">
                    {standardPlan.floors} at {standardPlan.heightM} m
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
                plan={maximumPlan} roads={roads} frontageM={frontage} depthM={depth}
                margin={study.compoundable}
                title="The most you can buy"
                subtitle="Also sanctioned — you pay for the extra density before you build."
              />
              {/* The ring is drawn on this plan, so it has to be disowned on this plan.
                  Placed below the card the reader has already taken the two drawings for
                  two options by the time they reach it. */}
              {study.compoundable.totalEncroachmentSqm > 0 && (
                <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                  <AlertTriangle className="mt-[3px] h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>
                    The amber ring is not part of this plan, and there is no application for it.
                    Chapter 16 prices building that has already happened.
                  </span>
                </p>
              )}
              <dl className="mt-3 space-y-1 border-t border-slate-200 pt-2.5 text-[11.5px] dark:border-white/10">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-slate-400">Floor area</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {maximumPlan.floorAreaSqm.toFixed(0)} m²
                    {maximumPlan.floorAreaSqm - standardPlan.floorAreaSqm > 0.5 && (
                      <span className="ml-1 font-normal text-emerald-700 dark:text-emerald-400">
                        +{(maximumPlan.floorAreaSqm - standardPlan.floorAreaSqm).toFixed(0)}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-slate-400">Floors</dt>
                  <dd className="tabular-nums text-slate-800 dark:text-slate-200">
                    {maximumPlan.floors} at {maximumPlan.heightM} m
                  </dd>
                </div>
                {/* The fees are worked out for the plot's best plan, and once a reader
                    picks a smaller floor count they are the price of a different
                    building. Showing "Buy the density" against a card that buys nothing
                    at this floor count is a wrong number, so it is not shown — a blank
                    with a reason beats a figure for somebody else's plan. */}
                {showingChoice ? (
                  <p className="mt-1.5 border-t border-dashed border-slate-300 pt-1.5 text-[11px] leading-snug text-slate-500 dark:border-white/15 dark:text-slate-400">
                    The fees and the compoundable band are worked out for this plot's best
                    plan of {study.maximum.floors} floors, not for the {maximumPlan.floors} you
                    asked for. Clear the floor choice to see them.
                  </p>
                ) : (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600 dark:text-slate-400">Buy the density</dt>
                      <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {priced.maximum.total > 0 ? inr(priced.maximum.total) : '—'}
                      </dd>
                    </div>
                    {priced.compounding && priced.compounding.total > 0 && (
                      <div className="mt-1.5 flex justify-between gap-2 border-t border-dashed border-amber-300 pt-1.5 dark:border-amber-500/40">
                        <dt className="text-amber-700 dark:text-amber-400">Amber ring, if already built</dt>
                        <dd className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                          {inr(priced.compounding.total)}
                        </dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </div>
          </div>

          {/* The amber band is the one thing on this screen that can be misread. Hidden
              while a floor choice is showing, because every figure in it belongs to the
              plot's best plan rather than the one drawn above. */}
          {priced.compounding && !showingChoice && (
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
                  buildCost.sourceNote,
                  ...study.caveats,
                  ...study.maximum.setbacks.caveats,
                  ...(priced.compounding?.caveats ?? []),
                ].map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </details>
          </section>
        </div>
      </div>

      <ScopeFooter />
    </div>
  );
};
