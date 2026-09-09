import React, { useState, useMemo } from 'react';
import { MapPin, Search, CheckCircle2, XCircle, AlertCircle, Building2, Landmark, HelpCircle } from 'lucide-react';
import {
  AUTHORITIES_MAPPING,
  CHAPTER_15_ACTIVITY_PERMISSIBILITY,
} from '../data/byelawsData';
import { PermissibilityStatus, StandardZoneCode } from '../types';

/**
 * The zones the Section 15.3.2 dataset carries a ruling for.
 *
 * This screen previously rendered a 16-column grid from a hardcoded list literally named
 * SAMPLE_ZONING_ACTIVITIES, while the curated dataset — with per-zone conditions and
 * clause references — sat unused in the data layer. The grid now reads the real dataset,
 * and shows only the zones it can actually speak to rather than implying a ruling for
 * zones it has none for.
 */
const STANDARD_ZONES: { code: StandardZoneCode; name: string }[] = [
  { code: 'BU', name: 'Built-up' },
  { code: 'R', name: 'Residential' },
  { code: 'MU', name: 'Mixed Use' },
  { code: 'C-1', name: 'Commercial 1 (Retail / Bazaar)' },
  { code: 'C-2', name: 'Commercial 2 (Wholesale)' },
  { code: 'SI', name: 'Small Industries' },
  { code: 'LI', name: 'Large Industries' },
  { code: 'PSP', name: 'Public & Semi-Public' },
  { code: 'RC', name: 'Recreational' },
  { code: 'A', name: 'Agriculture' },
];

const STATUS_GLYPH: Record<PermissibilityStatus, { short: string; label: string; className: string }> = {
  Permitted: {
    short: 'P',
    label: 'Permitted',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  Conditional: {
    short: 'C',
    label: 'Conditional',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  },
  Prohibited: {
    short: '—',
    label: 'Prohibited',
    className: 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400',
  },
};

export const ZoningMatrixExplorer: React.FC = () => {
  const [selectedAuthorityCode, setSelectedAuthorityCode] = useState<number>(1); // Ayodhya default
  const [filterText, setFilterText] = useState<string>('');
  const [impactPlotArea, setImpactPlotArea] = useState<number>(350);
  const [impactCircleRate, setImpactCircleRate] = useState<number>(2000);
  const [impactCoefficient, setImpactCoefficient] = useState<number>(0.25);

  const selectedAuthority = useMemo(() => {
    return (
      AUTHORITIES_MAPPING.find((a) => a.code === selectedAuthorityCode) ||
      AUTHORITIES_MAPPING[0]
    );
  }, [selectedAuthorityCode]);

  const filteredActivities = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    if (!q) return CHAPTER_15_ACTIVITY_PERMISSIBILITY;
    return CHAPTER_15_ACTIVITY_PERMISSIBILITY.filter((a) =>
      [
        a.activityName,
        a.category,
        a.clauseRef,
        a.statutoryNotes ?? '',
        ...Object.values(a.zonePermissibility).map((z) => z.conditions ?? ''),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [filterText]);

  // Impact Fee Calculation (Chapter 15.4 Example on p. 157: 350 * 2000 * 0.25 * 0.25 = 43,750)
  const impactFeeTotal = useMemo(() => {
    return impactPlotArea * impactCircleRate * impactCoefficient * 0.25;
  }, [impactPlotArea, impactCircleRate, impactCoefficient]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 dark:bg-[#161617] dark:border-white/[0.10]">
        <div>
          <div className="flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Chapter 15 & Appendix-15: Zoning Regulations & Master Plan Concordance
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl dark:text-slate-400">
            Standardizes 16 Land Use Zones across all 22 Development Authorities of Uttar Pradesh. Select any city authority to examine local nomenclature mappings and permissible activities.
          </p>
        </div>

        {/* Development Authority Selector */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap dark:text-slate-300">
            Select Authority:
          </span>
          <select
            aria-label="Development authority"
              value={selectedAuthorityCode}
            onChange={(e) => setSelectedAuthorityCode(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.14] dark:text-slate-100"
          >
            {AUTHORITIES_MAPPING.map((auth) => (
              <option key={auth.code} value={auth.code}>
                {auth.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Authority Mapping Card */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm space-y-3 dark:bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-tight">
              {selectedAuthority.name} — Master Plan Zoning Dictionary (Appendix-15)
            </h3>
          </div>
          <span className="text-xs text-slate-300 font-mono">
            {selectedAuthority.zones.length} Mapped Zones
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {selectedAuthority.zones.map((z, idx) => (
            <div key={idx} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                Standard: {z.standardZone}
              </span>
              <span className="text-slate-200 font-medium block mt-0.5">
                {z.localZoneName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Permissibility Matrix */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Activity Permissibility Matrix (Chapter 15.3.2)
            </h4>
            <div className="flex items-center space-x-3 text-xs mt-1 text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Permitted (P)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Conditional (C)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Prohibited (X)</span>
              </span>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <input
              type="text"
              aria-label="Filter activities"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter activities..."
              className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs dark:bg-white/[0.04] dark:border-white/[0.10]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.10]">
                <th scope="col" className="p-2.5 font-bold">Activity / development type</th>
                <th scope="col" className="p-2.5 font-bold">Clause</th>
                {STANDARD_ZONES.map((z) => (
                  <th key={z.code} scope="col" className="p-1.5 text-center text-[10px] font-bold" title={z.name}>
                    <abbr title={z.name} className="no-underline">
                      {z.code}
                    </abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/[0.10]">
              {filteredActivities.map((act) => (
                <tr key={act.activityId} className="hover:bg-slate-50 dark:hover:bg-white/[0.06]">
                  <th scope="row" className="p-2.5 text-left font-normal">
                    <span className="block font-semibold text-slate-900 dark:text-white">{act.activityName}</span>
                    <span className="block text-[10px] text-slate-600 dark:text-slate-400">{act.category}</span>
                    {act.statutoryNotes && (
                      <span className="mt-0.5 block text-[10px] italic text-amber-700 dark:text-amber-300">
                        {act.statutoryNotes}
                      </span>
                    )}
                  </th>
                  <td className="whitespace-nowrap p-2.5 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                    {act.clauseRef}
                  </td>
                  {STANDARD_ZONES.map((z) => {
                    const ruling = act.zonePermissibility[z.code];
                    const glyph = STATUS_GLYPH[ruling?.status ?? 'Prohibited'];
                    // The condition text is the value here — it is what turns a "C" into
                    // an answer. It was previously discarded.
                    const tooltip = `${z.name}: ${glyph.label}${ruling?.conditions ? ` — ${ruling.conditions}` : ''}`;
                    return (
                      <td key={z.code} className="p-1 text-center">
                        <span
                          title={tooltip}
                          className={`inline-block h-5 w-5 cursor-help rounded text-[11px] font-bold leading-5 ${glyph.className}`}
                        >
                          {glyph.short}
                          <span className="sr-only">{tooltip}</span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredActivities.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-600 dark:text-slate-400">No activity matches “{filterText}”.</p>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-3 text-[10.5px] text-slate-600 dark:border-white/[0.10] dark:text-slate-400">
          {(Object.keys(STATUS_GLYPH) as PermissibilityStatus[]).map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={`inline-block h-4 w-4 rounded text-center text-[10px] font-bold leading-4 ${STATUS_GLYPH[status].className}`}>
                {STATUS_GLYPH[status].short}
              </span>
              {STATUS_GLYPH[status].label}
            </span>
          ))}
          <span className="text-slate-600 dark:text-slate-400">Hover any cell for the statutory condition.</span>
        </div>
      </div>

      {/* Impact Fee Calculator (Chapter 15.4) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
        <div className="border-b pb-2">
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Chapter 15.4: Land Use Change Impact Fee Calculator
          </h4>
          <p className="text-xs text-slate-600 mt-0.5 dark:text-slate-400">
            Formula: <strong>Impact Fee = (Plot Area) × (Circle Rate) × (Coefficient × 0.25)</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="zoning-matrix-explorer-plot-area-sqm" className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Plot Area (sqm)
            </label>
            <input id="zoning-matrix-explorer-plot-area-sqm"
              type="number"
              value={impactPlotArea}
              onChange={(e) => setImpactPlotArea(Number(e.target.value))}
              className="w-full bg-slate-50 border rounded-lg p-2 text-xs dark:bg-white/[0.04]"
            />
          </div>

          <div>
            <label htmlFor="zoning-matrix-explorer-residential-circle-rate-rs-sqm" className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Residential Circle Rate (Rs/sqm)
            </label>
            <input id="zoning-matrix-explorer-residential-circle-rate-rs-sqm"
              type="number"
              value={impactCircleRate}
              onChange={(e) => setImpactCircleRate(Number(e.target.value))}
              className="w-full bg-slate-50 border rounded-lg p-2 text-xs dark:bg-white/[0.04]"
            />
          </div>

          <div>
            <label htmlFor="zoning-matrix-explorer-impact-fee-coefficient" className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Impact Fee Coefficient
            </label>
            <select id="zoning-matrix-explorer-impact-fee-coefficient"
              value={impactCoefficient}
              onChange={(e) => setImpactCoefficient(Number(e.target.value))}
              className="w-full bg-slate-50 border rounded-lg p-2 text-xs dark:bg-white/[0.04]"
            >
              <option value={0.25}>0.25 (e.g., Nursing home in Residential / Example p. 157)</option>
              <option value={0.30}>0.30 (Traffic & Transportation)</option>
              <option value={0.40}>0.40 (Industrial in Agriculture/Residential)</option>
              <option value={0.50}>0.50 (Residential in Agriculture / Commercial in Office)</option>
              <option value={0.75}>0.75 (Office in Residential/Agriculture)</option>
              <option value={1.00}>1.00 (Commercial in Industrial/Residential)</option>
              <option value={1.50}>1.50 (Commercial in Agriculture/Greenbelt)</option>
            </select>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center dark:bg-emerald-950/40 dark:border-emerald-500/30">
            <span className="text-[11px] text-emerald-800 font-bold block dark:text-emerald-300">
              Calculated Impact Fee
            </span>
            <span className="text-xl font-extrabold text-emerald-950 font-mono dark:text-emerald-200">
              ₹ {impactFeeTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
