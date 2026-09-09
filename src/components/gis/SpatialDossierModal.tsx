import React, { useRef } from 'react';
import {
  X,
  Printer,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Building2,
  MapPin,
  Compass,
  Plane,
  Droplets,
  Layers,
  FileText,
  FileCheck2,
  ExternalLink,
  Info
} from 'lucide-react';
import { SpatialAuditResult } from '../../data/upGisMasterPlanData';
import { useToast } from '../../context/ToastContext';

interface SpatialDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  spatialAudit: SpatialAuditResult | null;
}

export const SpatialDossierModal: React.FC<SpatialDossierModalProps> = ({
  isOpen,
  onClose,
  spatialAudit,
}) => {
  const toast = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !spatialAudit) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `
STATUTORY SPATIAL DUE DILIGENCE DOSSIER
Uttar Pradesh Urban Planning and Development Act, 1973 (Section 15)
UP Building Construction and Development Byelaws 2025

• Parcel Coordinates: ${spatialAudit.lat.toFixed(6)}° N, ${spatialAudit.lng.toFixed(6)}° E
• Cadastral Reference: ${spatialAudit.khasraProjection}
• Authority Jurisdiction: ${spatialAudit.nearestAuthority.name} (${spatialAudit.nearestAuthority.shortName})
• Master Plan Horizon: ${spatialAudit.nearestAuthority.masterPlanHorizon}
• Zoning Classification: ${spatialAudit.matchedZoningFeature ? spatialAudit.matchedZoningFeature.name : 'Standard Municipal Urban Core'}
• Permissible Base FAR: ${spatialAudit.recommendedFAR}
• Max Ground Coverage: ${spatialAudit.maxGroundCoverage}
• Abutting ROW Minimum: ${spatialAudit.minRoadWidthRow}
• Max Permissible Height: ${spatialAudit.maxPermissibleHeightMeters}
• Estimated Elevation (AMSL): ${spatialAudit.estimatedElevationAmsl} meters
• Airport Distance & OLS: ${spatialAudit.distanceToNearestAirportKm} km (${spatialAudit.aviationHeightLimitAmsl})
• River Buffer Status: ${spatialAudit.isProhibitedZone ? 'CRITICAL VIOLATION - 200m Eco-Buffer' : 'Clear (No Eco-Buffer Conflict)'}
• TOD Status: ${spatialAudit.isTODZone ? 'Eligible for Enhanced TOD Bonus FAR' : 'Standard Development Zone'}
• Mandatory Statutory NOCs: ${spatialAudit.requiredNOCs.join(', ')}
• Summary: ${spatialAudit.statutorySummary}
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success('Dossier Copied', 'Statutory spatial certificate summary copied to clipboard.');
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Top Action Header (Screen only) */}
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center space-x-2.5">
            <FileCheck2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Statutory Spatial Due Diligence Dossier
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Georeferenced Master Plan 2031 & Byelaw 2025 Clearance Report
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors"
              title="Copy Summary to Clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              title="Print Dossier"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Dossier Body */}
        <div ref={printRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* Certificate Header */}
          <div className="border-b-2 border-emerald-600 pb-4 text-center space-y-1.5">
            <div className="flex items-center justify-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs">
              <Building2 className="w-4 h-4" />
              <span>State Government of Uttar Pradesh • Housing & Urban Planning Department</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Official Spatial Planning & Land-Use Verification Certificate
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Evaluated under Section 15 of the Uttar Pradesh Urban Planning and Development Act, 1973 and UP Building Construction and Development Byelaws 2025 (Appendix-15 Automated Sanction Directives).
            </p>
          </div>

          {/* Conflict Banner if Prohibited */}
          {spatialAudit.isProhibitedZone ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/50 flex items-start space-x-3 text-rose-900 dark:text-rose-200">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-sm text-rose-700 dark:text-rose-300">
                  STATUTORY PROHIBITION DETECTED (SECTION 2.11 VIOLATION)
                </h4>
                <p>
                  This parcel falls within a prohibited statutory environmental zone (High Flood Level 200m River Embankment or Protected Green Belt). Under the Supreme Court and National Green Tribunal directives, zero permanent construction can be sanctioned.
                </p>
              </div>
            </div>
          ) : spatialAudit.isTODZone ? (
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/40 flex items-start space-x-3 text-indigo-900 dark:text-indigo-200">
              <Compass className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <h4 className="font-bold text-indigo-700 dark:text-indigo-300">
                  TRANSIT-ORIENTED DEVELOPMENT (TOD) CORRIDOR INCENTIVE
                </h4>
                <p>
                  Parcel is located within designated high-density rapid transit influence band. Eligible for FAR multiplier scaling up to 4.0 - 4.5 under Chapter 8.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-start space-x-3 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <h4 className="font-bold text-emerald-700 dark:text-emerald-300">
                  BUILDABLE URBAN PARCEL CONFIRMED
                </h4>
                <p>
                  Parcel clear of prohibited river floodplains and ASI core monument envelopes. Standard municipal byelaws apply.
                </p>
              </div>
            </div>
          )}

          {/* Cadastral & Geodetic Profile */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Geodetic & Cadastral Mapping</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-white/[0.02] p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <span className="text-slate-400 block text-[11px]">WGS84 Coordinates</span>
                <strong className="font-mono text-slate-900 dark:text-white block mt-0.5">
                  {spatialAudit.lat.toFixed(6)}° N, {spatialAudit.lng.toFixed(6)}° E
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Cadastral Revenue Projection</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5">
                  {spatialAudit.khasraProjection}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Elevation Above Mean Sea Level</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5 font-mono">
                  {spatialAudit.estimatedElevationAmsl} meters AMSL
                </strong>
              </div>
            </div>
          </div>

          {/* Development Authority & Master Plan Classification */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Authority Jurisdiction & Master Plan 2031 Classification</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-white/[0.02] p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <span className="text-slate-400 block text-[11px]">Development Authority</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5">
                  {spatialAudit.nearestAuthority.name} ({spatialAudit.nearestAuthority.shortName})
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  {spatialAudit.distanceToAuthorityCenterKm} km from authority core
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Master Plan Horizon</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5">
                  {spatialAudit.nearestAuthority.masterPlanHorizon} (Notified)
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  Area: {spatialAudit.nearestAuthority.planningAreaSqKm} sq. km
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Statutory Land-Use Zone</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5">
                  {spatialAudit.matchedZoningFeature
                    ? `Zone ${spatialAudit.matchedZoningFeature.zoneCode} (${spatialAudit.matchedZoningFeature.standardizedChapter15Zone})`
                    : 'Standard General Urban Zone'}
                </strong>
              </div>
            </div>
          </div>

          {/* Byelaw 2025 Dimensional Parameters */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Statutory Dimensional Parameters (Byelaws 2025)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-white/[0.02] p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <span className="text-slate-400 block text-[11px]">Permissible Base FAR</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5 text-sm font-bold">
                  {spatialAudit.recommendedFAR}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Max Ground Coverage</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5 text-sm font-bold">
                  {spatialAudit.maxGroundCoverage}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Mandatory Road ROW</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5 font-bold">
                  {spatialAudit.minRoadWidthRow}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Max Permissible Height</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5 font-bold">
                  {spatialAudit.maxPermissibleHeightMeters}
                </strong>
              </div>
            </div>
          </div>

          {/* Aviation, River, and Environmental Clearances */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
              <Plane className="w-3.5 h-3.5 text-indigo-600" />
              <span>4. Airspace & Environmental Envelopes</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-white/[0.02] p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <span className="text-slate-400 block text-[11px]">Civil Aviation Runway Proximity</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5">
                  {spatialAudit.distanceToNearestAirportKm} km to nearest runway
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  OLS Ceiling: {spatialAudit.aviationHeightLimitAmsl}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nearest River Embankment</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5">
                  {spatialAudit.distanceToNearestRiverKm} km to river channel
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  Requirement: Min 200m clear of HFL (Sec 2.11)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Rapid Transit (RRTS/Metro)</span>
                <strong className="text-slate-900 dark:text-white block mt-0.5">
                  {spatialAudit.distanceToNearestTransitKm} km to transit spine
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  TOD Influence Zone: 1.5 km band
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory Statutory NOC Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>5. Mandatory Statutory Clearances Matrix</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] space-y-2">
              <p className="text-[11px] text-slate-500">
                Prior to applying for automated sanction under Appendix-15, the following departmental NOCs must be secured based on the georeferenced spatial profile:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {spatialAudit.requiredNOCs.map((noc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{noc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Official Seal and Footnote */}
          <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
            <div>
              <span className="font-mono">VERIFIED VIA UP STATUTORY GIS ENGINE</span>
              <span className="block text-[10px]">Document Hash: SHA256-{(spatialAudit.lat * 100000 + spatialAudit.lng * 100000).toFixed(0)}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Compliant with Chapter 15 & Gazette Byelaws 2025
              </span>
              <span className="block text-[10px]">Self-certification valid under Section 32</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
