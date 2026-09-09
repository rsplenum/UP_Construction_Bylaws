import React, { useState, useMemo } from 'react';
import { MapPin, Search, CheckCircle2, XCircle, AlertCircle, Building2, Landmark, HelpCircle } from 'lucide-react';
import { AUTHORITIES_MAPPING } from '../data/byelawsData';

interface ActivityPermissibility {
  name: string;
  category: string;
  minRoadWidth: string;
  status: Record<string, 'P' | 'C' | 'X'>; // P: Permitted, C: Conditional, X: Prohibited
  conditionNote?: string;
}

const SAMPLE_ZONING_ACTIVITIES: ActivityPermissibility[] = [
  {
    name: "Single Dwelling / Multi-Dwelling, Homestay, PG (Built-up)",
    category: "Residential",
    minRoadWidth: "4m (Built-up) / 9m (Non-built-up)",
    status: { BU: 'P', R: 'P', MU: 'P', 'C-1': 'X', 'C-2': 'X', SI: 'X', LI: 'X', OB: 'X', PSP: 'X', TT: 'X', F: 'X', RC: 'X', GB: 'X', RA: 'P', A: 'X', HF: 'X' },
  },
  {
    name: "Group Housing (Built-up / Non-Built-up)",
    category: "Residential",
    minRoadWidth: "9m (Built-up) / 12m (Non-built-up)",
    status: { BU: 'P', R: 'P', MU: 'P', 'C-1': 'C', 'C-2': 'C', SI: 'C', LI: 'C', OB: 'C', PSP: 'X', TT: 'X', F: 'X', RC: 'X', GB: 'X', RA: 'P', A: 'X', HF: 'X' },
    conditionNote: "Conditional in Commercial/Office/Industrial (max 20-30% of total FAR for worker housing/ancillary).",
  },
  {
    name: "Retail Shops & Daily Use Stores (<100 sqm)",
    category: "Commercial",
    minRoadWidth: "6m (Built-up) / 9m (Non-built-up)",
    status: { BU: 'P', R: 'P', MU: 'P', 'C-1': 'P', 'C-2': 'P', SI: 'P', LI: 'P', OB: 'P', PSP: 'P', TT: 'P', F: 'X', RC: 'X', GB: 'X', RA: 'P', A: 'X', HF: 'P' },
    conditionNote: "Permissible in residential areas as convenience shopping.",
  },
  {
    name: "Commercial Complexes, Automobile Showrooms (>100 sqm)",
    category: "Commercial",
    minRoadWidth: "12m",
    status: { BU: 'P', R: 'C', MU: 'P', 'C-1': 'P', 'C-2': 'P', SI: 'P', LI: 'P', OB: 'P', PSP: 'X', TT: 'X', F: 'X', RC: 'X', GB: 'X', RA: 'C', A: 'X', HF: 'P' },
    conditionNote: "Allowed in residential only on 12m+ roads with Impact Fee.",
  },
  {
    name: "Shopping Malls & Multiplexes",
    category: "Commercial",
    minRoadWidth: "18m",
    status: { BU: 'P', R: 'C', MU: 'P', 'C-1': 'P', 'C-2': 'P', SI: 'X', LI: 'X', OB: 'P', PSP: 'X', TT: 'X', F: 'X', RC: 'X', GB: 'X', RA: 'X', A: 'X', HF: 'P' },
    conditionNote: "Permissible on 18m+ roads with Impact Fee.",
  },
  {
    name: "Hotels (Up to 20 rooms)",
    category: "Commercial",
    minRoadWidth: "9m",
    status: { BU: 'P', R: 'P', MU: 'P', 'C-1': 'P', 'C-2': 'P', SI: 'P', LI: 'P', OB: 'P', PSP: 'P', TT: 'P', F: 'X', RC: 'C', GB: 'X', RA: 'P', A: 'X', HF: 'P' },
  },
  {
    name: "Hotels (>20 rooms) / Motels / Resorts",
    category: "Commercial",
    minRoadWidth: "12m",
    status: { BU: 'P', R: 'P', MU: 'P', 'C-1': 'P', 'C-2': 'P', SI: 'P', LI: 'P', OB: 'P', PSP: 'P', TT: 'P', F: 'X', RC: 'C', GB: 'X', RA: 'P', A: 'X', HF: 'P' },
  },
  {
    name: "Cottage Industries / Small Non-Polluting MSME",
    category: "Industrial",
    minRoadWidth: "7m - 9m",
    status: { BU: 'P', R: 'P', MU: 'P', 'C-1': 'P', 'C-2': 'P', SI: 'P', LI: 'P', OB: 'P', PSP: 'X', TT: 'X', F: 'X', RC: 'X', GB: 'X', RA: 'P', A: 'C', HF: 'P' },
  },
  {
    name: "Data Processing Centres / IT-ITeS Parks",
    category: "Industrial / Office",
    minRoadWidth: "12m",
    status: { BU: 'P', R: 'P', MU: 'P', 'C-1': 'P', 'C-2': 'P', SI: 'P', LI: 'P', OB: 'P', PSP: 'P', TT: 'P', F: 'X', RC: 'X', GB: 'X', RA: 'P', A: 'X', HF: 'P' },
  },
  {
    name: "Hospitals (>50 beds) & Medical Colleges",
    category: "Institutional",
    minRoadWidth: "18m - 24m",
    status: { BU: 'P', R: 'P', MU: 'P', 'C-1': 'P', 'C-2': 'P', SI: 'X', LI: 'X', OB: 'P', PSP: 'P', TT: 'X', F: 'X', RC: 'X', GB: 'X', RA: 'P', A: 'X', HF: 'P' },
  },
  {
    name: "Marriage Halls & Banquet Centres",
    category: "Social / Commercial",
    minRoadWidth: "18m - 24m",
    status: { BU: 'P', R: 'C', MU: 'P', 'C-1': 'P', 'C-2': 'P', SI: 'X', LI: 'X', OB: 'P', PSP: 'P', TT: 'X', F: 'X', RC: 'C', GB: 'X', RA: 'C', A: 'X', HF: 'P' },
  },
  {
    name: "Farmhouses, Greenhouses & Nurseries",
    category: "Agriculture",
    minRoadWidth: "7.0m",
    status: { BU: 'X', R: 'X', MU: 'X', 'C-1': 'X', 'C-2': 'X', SI: 'X', LI: 'X', OB: 'X', PSP: 'X', TT: 'X', F: 'X', RC: 'C', GB: 'P', RA: 'P', A: 'P', HF: 'X' },
  }
];

const STANDARD_ZONES = [
  { code: 'BU', name: 'Built-up' },
  { code: 'R', name: 'Residential' },
  { code: 'MU', name: 'Mixed Use' },
  { code: 'C-1', name: 'Commercial 1 (Retail/Bazaar)' },
  { code: 'C-2', name: 'Commercial 2 (Wholesale)' },
  { code: 'SI', name: 'Small Industries' },
  { code: 'LI', name: 'Large Industries' },
  { code: 'OB', name: 'Office Buildings' },
  { code: 'PSP', name: 'Public & Semi-Public' },
  { code: 'TT', name: 'Traffic & Transport' },
  { code: 'F', name: 'Forest' },
  { code: 'RC', name: 'Recreational' },
  { code: 'GB', name: 'Green Belt' },
  { code: 'RA', name: 'Rural Abadi' },
  { code: 'A', name: 'Agriculture' },
  { code: 'HF', name: 'Highway Facilities' },
];

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
    if (!q) return SAMPLE_ZONING_ACTIVITIES;
    return SAMPLE_ZONING_ACTIVITIES.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.conditionNote && a.conditionNote.toLowerCase().includes(q))
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
            <Landmark className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Chapter 15 & Appendix-15: Zoning Regulations & Master Plan Concordance
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl dark:text-slate-400">
            Standardizes 16 Land Use Zones across all 22 Development Authorities of Uttar Pradesh. Select any city authority to examine local nomenclature mappings and permissible activities.
          </p>
        </div>

        {/* Development Authority Selector */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap dark:text-slate-300">
            Select Authority:
          </span>
          <select
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
            <h4 className="text-sm font-bold tracking-tight">
              {selectedAuthority.name} — Master Plan Zoning Dictionary (Appendix-15)
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono dark:text-slate-500">
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
            <div className="flex items-center space-x-3 text-xs mt-1 text-slate-500 dark:text-slate-400">
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
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
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
                <th className="p-2.5 font-bold">Activity / Development Type</th>
                <th className="p-2.5 font-bold">Min Road</th>
                {STANDARD_ZONES.map((z) => (
                  <th key={z.code} className="p-1.5 text-center font-bold text-[10px]" title={z.name}>
                    {z.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/[0.10]">
              {filteredActivities.map((act, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.06]">
                  <td className="p-2.5">
                    <div className="font-semibold text-slate-900 dark:text-white">{act.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{act.category}</div>
                    {act.conditionNote && (
                      <div className="text-[10px] text-amber-700 italic mt-0.5 dark:text-amber-300">
                        {act.conditionNote}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap dark:text-slate-400">
                    {act.minRoadWidth}
                  </td>
                  {STANDARD_ZONES.map((z) => {
                    const st = act.status[z.code] || 'X';
                    return (
                      <td key={z.code} className="p-1 text-center">
                        {st === 'P' && (
                          <span className="inline-block w-5 h-5 leading-5 text-[11px] font-bold rounded bg-emerald-100 text-emerald-800 dark:text-emerald-300">
                            P
                          </span>
                        )}
                        {st === 'C' && (
                          <span className="inline-block w-5 h-5 leading-5 text-[11px] font-bold rounded bg-amber-100 text-amber-800 dark:text-amber-300">
                            C
                          </span>
                        )}
                        {st === 'X' && (
                          <span className="inline-block w-5 h-5 leading-5 text-[11px] font-bold rounded bg-rose-100 text-rose-700 dark:text-rose-300">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Impact Fee Calculator (Chapter 15.4) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
        <div className="border-b pb-2">
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Chapter 15.4: Land Use Change Impact Fee Calculator
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
            Formula: <strong>Impact Fee = (Plot Area) × (Circle Rate) × (Coefficient × 0.25)</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Plot Area (sqm)
            </label>
            <input
              type="number"
              value={impactPlotArea}
              onChange={(e) => setImpactPlotArea(Number(e.target.value))}
              className="w-full bg-slate-50 border rounded-lg p-2 text-xs dark:bg-white/[0.04]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Residential Circle Rate (Rs/sqm)
            </label>
            <input
              type="number"
              value={impactCircleRate}
              onChange={(e) => setImpactCircleRate(Number(e.target.value))}
              className="w-full bg-slate-50 border rounded-lg p-2 text-xs dark:bg-white/[0.04]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Impact Fee Coefficient
            </label>
            <select
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
            <span className="text-xl font-extrabold text-emerald-950 font-mono">
              ₹ {impactFeeTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
