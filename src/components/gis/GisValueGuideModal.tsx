import React from 'react';
import {
  X,
  Globe,
  Layers,
  Compass,
  Building2,
  ShieldCheck,
  TrendingUp,
  AlertOctagon,
  Plane,
  Droplets,
  Cpu,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface GisValueGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GisValueGuideModal: React.FC<GisValueGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center space-x-2.5">
            <Globe className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Strategic Value & Engineering Utility of Spatial GIS
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Why Geographic Information Systems drive statutory compliance and urban governance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm">
            <strong className="block font-bold mb-1 text-emerald-800 dark:text-emerald-300">
              Executive Context: The GIS Engine in Statutory Urban Planning
            </strong>
            A Geographic Information System (GIS) is not a decorative map viewer; it is an analytical computation engine. In modern urban governance and building compliance under the UP Byelaws 2025, GIS converts subjective textual regulations into mathematical, georeferenced spatial verifications.
          </div>

          {/* 5 Core Value Pillars */}
          <div className="space-y-6">
            {/* Pillar 1 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Elimination of Cadastral & Boundary Distortions</span>
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                </h4>
              </div>
              <div className="pl-9 space-y-1.5 text-xs sm:text-sm">
                <p>
                  Historically, land titles and municipal jurisdictions across Uttar Pradesh relied on 19th-century hand-drawn cloth or paper revenue maps (<em>Sajra</em>). Over decades of humidity and physical handling, paper shrinks and stretches by 15% to 20%, resulting in boundary overlaps, overlapping registry deeds, and protracted legal disputes.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-black/[0.04] dark:border-white/[0.06] text-xs">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">The GIS Advantage:</strong>
                  GIS georeferences historical revenue Khasras onto WGS84 and Indian Geodetic Datum coordinates using high-resolution satellite orthophotos (ISRO Bhuvan / Cartosat). Every plot boundary is fixed to millimeter precision, making fraudulent double-selling and boundary encroachment mathematically impossible.
                </div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Appendix-15 Automated Sanction: Zero Bureaucratic Discretion</span>
                  <Cpu className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                </h4>
              </div>
              <div className="pl-9 space-y-1.5 text-xs sm:text-sm">
                <p>
                  Under UP Byelaws 2025 Appendix-15, building sanctioning is transitioned to automated online platforms. Without GIS, evaluating whether a proposed site violates a green belt, master plan road widening, or utility corridor requires weeks of manual desk inspections and on-site visits.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-black/[0.04] dark:border-white/[0.06] text-xs">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">The GIS Advantage:</strong>
                  The system performs an instantaneous <em>point-in-polygon</em> and <em>buffer-intersection</em> query. If an applicant submits a site plan on a parcel zoned as agricultural or falling within a proposed 45m arterial road right-of-way, the algorithm immediately issues a rejection or conditional clearance, cutting sanction time from 90 days to under 48 hours.
                </div>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>3D Airspace Obstacle Limitation (CCZM & AAI NOCAS)</span>
                  <Plane className="w-4 h-4 text-indigo-600" />
                </h4>
              </div>
              <div className="pl-9 space-y-1.5 text-xs sm:text-sm">
                <p>
                  Standard 2D zoning maps fail completely around airports. Civil Aviation Obstacle Limitation Surfaces (OLS) are not flat lines; they are complex three-dimensional sloping funnels extending 20 kilometers from runway thresholds (such as Lucknow CCS Amausi, Jewar Noida International, Varanasi Babatpur, and Ayodhya Maharishi Valmiki).
                </p>
                <div className="p-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-black/[0.04] dark:border-white/[0.06] text-xs">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">The GIS Advantage:</strong>
                  GIS models the 3D Colour Coded Zoning Map (CCZM) against the Digital Elevation Model (DEM) of the terrain. When an architect enters coordinates, the GIS engine calculates the exact permissible building height Above Mean Sea Level (AMSL), eliminating the risk of constructing towers that later receive mandatory demolition orders from the DGCA.
                </div>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                  4
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Hydrological Vulnerability & 50-Year HFL Resiliency</span>
                  <Droplets className="w-4 h-4 text-sky-600" />
                </h4>
              </div>
              <div className="pl-9 space-y-1.5 text-xs sm:text-sm">
                <p>
                  Section 2.11 of the UP Byelaws 2025 and multiple National Green Tribunal (NGT) directives strictly ban permanent construction within 200 meters of the Highest Flood Level (HFL) of major rivers (Ganga, Yamuna, Saryu, Gomti, Hindon).
                </p>
                <div className="p-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-black/[0.04] dark:border-white/[0.06] text-xs">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">The GIS Advantage:</strong>
                  GIS utilizes satellite hydrological radar data and elevation contours to trace the exact 100-year and 50-year flood lines. Real estate developers and home buyers can instantly verify that their land is outside the non-compoundable demolition zone, protecting lives and capital.
                </div>
              </div>
            </div>

            {/* Pillar 5 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-xs">
                  5
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Transit-Oriented Development (TOD) & Land Value Capture</span>
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                </h4>
              </div>
              <div className="pl-9 space-y-1.5 text-xs sm:text-sm">
                <p>
                  To combat urban sprawl and vehicle emissions, Chapter 8 introduces high-intensity Transit-Oriented Development. Within 500m to 1500m of rapid rail corridors (e.g. Delhi-Meerut Namo Bharat RRTS and Lucknow/Kanpur metro networks), the statutory FAR cap is boosted up to 4.0 or 4.5.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-black/[0.04] dark:border-white/[0.06] text-xs">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">The GIS Advantage:</strong>
                  GIS provides exact spatial buffering around transit stations. Development authorities can accurately calculate the Purchasable FAR (PFAR) premium payable by developers, raising thousands of crores in municipal revenue that directly funds civic infrastructure.
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              System Comparison: Traditional Paper Maps vs Unified Statutory GIS
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-black/[0.06] dark:border-white/[0.08] rounded-xl overflow-hidden">
                <thead className="bg-slate-100 dark:bg-white/[0.04] text-slate-900 dark:text-white font-bold">
                  <tr>
                    <th className="p-3 border-b border-black/[0.06] dark:border-white/[0.08]">Dimension</th>
                    <th className="p-3 border-b border-black/[0.06] dark:border-white/[0.08]">Traditional Paper Blueprints</th>
                    <th className="p-3 border-b border-black/[0.06] dark:border-white/[0.08] text-emerald-700 dark:text-emerald-400">
                      Unified Statutory GIS Engine
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  <tr>
                    <td className="p-3 font-semibold">Boundary Accuracy</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">±10m to ±50m (paper shrinkage & manual surveying)</td>
                    <td className="p-3 font-medium text-emerald-700 dark:text-emerald-300">
                      Sub-meter satellite georeferenced (WGS84 datum)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Sanction Speed</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">30 to 90 days of manual file movement</td>
                    <td className="p-3 font-medium text-emerald-700 dark:text-emerald-300">
                      Instantaneous automated algorithmic audit (seconds)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Aviation Airspace</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Manual height guessing; post-facto demolition risk</td>
                    <td className="p-3 font-medium text-emerald-700 dark:text-emerald-300">
                      3D CCZM obstacle limitation surface calculation
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Flood Risk Evaluation</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Subjective site inspection often missing high flood levels</td>
                    <td className="p-3 font-medium text-emerald-700 dark:text-emerald-300">
                      DEM hydrological modeling & automated 200m buffer flag
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Compliant with Ministry of Housing & Urban Affairs (MoHUA) GIS Master Plan Design Standards
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
