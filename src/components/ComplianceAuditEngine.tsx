import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileCheck2,
  Printer,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Building,
  HelpCircle,
  Car,
  Flame,
  Sun,
  Droplets,
  RotateCcw,
  Download,
  Save,
  Check,
  Wrench,
  FileDown,
  History,
  FolderGit2,
  Trash2,
  BookmarkPlus,
  Clock
} from 'lucide-react';
import {
  Occupancy,
  GreenRating,
  assessSetbackFaces,
  resolveBaseFar,
  resolveRequiredSetbacks,
  OCCUPANCY_LABELS,
} from '../domain';
import { useProject } from '../context/ProjectContext';
import { TabId } from '../navigation';
import { NumberField } from './ui/NumberField';
import { AuditEngineState } from '../utils/auditStorage';
import { SavedProject } from '../context/ProjectContext';
import {
  evaluateLogicalConstraints,
  RegulatoryConflict
} from '../utils/constraintEngine';
import { useToast } from '../context/ToastContext';

interface AuditItem {
  id: string;
  chapterRef: string;
  ruleTitle: string;
  category: string;
  status: 'compliant' | 'conditional' | 'non_compliant' | 'exempt';
  statutoryLimit: string;
  proposedValue: string;
  mathExplanation: string;
  remediation?: string;
}

interface ComplianceAuditEngineProps {
  onNavigate?: (tab: TabId) => void;
}

export const ComplianceAuditEngine: React.FC<ComplianceAuditEngineProps> = ({ onNavigate }) => {
  const toast = useToast();

  // The site description lives in one place now; this screen reads and patches it rather
  // than keeping a sixteenth private copy of the plot.
  const {
    project,
    patch,
    reset: resetProject,
    undo,
    canUndo,
    savedProjects,
    saveSnapshot,
    loadSnapshot,
    deleteSnapshot,
    lastSavedLabel,
  } = useProject();

  const [historyProjectName, setHistoryProjectName] = useState<string>('');
  const [isSavingHistory, setIsSavingHistory] = useState<boolean>(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(true);

  // Read-side aliases keep the render tree unchanged while the source of truth moves.
  const {
    occupancy,
    plotArea,
    plotFrontage,
    roadWidth,
    buildingHeight,
    proposedBuiltUpArea,
    isCornerPlot,
    hasStilt,
    frontSetbackProvided,
    rearSetbackProvided,
    side1Provided,
    side2Provided,
    parkingBaysProvided,
    hasRWH,
    hasSolarHeating,
    greenRating,
  } = project;

  const setOccupancy = (v: Occupancy) => patch({ occupancy: v });
  const setPlotArea = (v: number) => patch({ plotArea: v });
  const setPlotFrontage = (v: number) => patch({ plotFrontage: v });
  const setRoadWidth = (v: number) => patch({ roadWidth: v });
  const setBuildingHeight = (v: number) => patch({ buildingHeight: v });
  const setProposedBuiltUpArea = (v: number) => patch({ proposedBuiltUpArea: v });
  const setIsCornerPlot = (v: boolean) => patch({ isCornerPlot: v });
  const setHasStilt = (v: boolean) => patch({ hasStilt: v });
  const setFrontSetbackProvided = (v: number) => patch({ frontSetbackProvided: v });
  const setRearSetbackProvided = (v: number) => patch({ rearSetbackProvided: v });
  const setSide1Provided = (v: number) => patch({ side1Provided: v });
  const setSide2Provided = (v: number) => patch({ side2Provided: v });
  const setParkingBaysProvided = (v: number) => patch({ parkingBaysProvided: v });
  const setHasRWH = (v: boolean) => patch({ hasRWH: v });
  const setHasSolarHeating = (v: boolean) => patch({ hasSolarHeating: v });
  const setGreenRating = (v: GreenRating) => patch({ greenRating: v });

  // Persistence tracking
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const currentState: AuditEngineState = project;

  // Evaluate Logical Constraints in Real-Time
  const logicalConflicts = useMemo(() => {
    return evaluateLogicalConstraints(currentState);
  }, [currentState]);

  const handleResetDefaults = () => {
    resetProject();
    toast.info('Reset to defaults', 'Undo is available if that was not what you wanted.');
  };

  // Apply a remedy proposed by the constraint engine as a single undoable change.
  const applyAutoFix = (conflict: RegulatoryConflict) => {
    if (!conflict.autoFix) return;
    patch(conflict.autoFix(currentState));
    toast.success('Remedy applied', conflict.remedyActionTitle);
  };

  // Load Presets
  const applyPreset = (preset: string) => {
    if (preset === 'small_plot') {
      setOccupancy('single_unit');
      setPlotArea(90);
      setPlotFrontage(6);
      setRoadWidth(9);
      setBuildingHeight(10.5);
      setProposedBuiltUpArea(170);
      setIsCornerPlot(false);
      setHasStilt(false);
      setFrontSetbackProvided(1.2);
      setRearSetbackProvided(0);
      setSide1Provided(0);
      setSide2Provided(0);
      setParkingBaysProvided(1);
      setHasRWH(false);
      setHasSolarHeating(false);
      setGreenRating('none');
    } else if (preset === 'plotted_res') {
      setOccupancy('single_unit');
      setPlotArea(320);
      setPlotFrontage(14);
      setRoadWidth(12);
      setBuildingHeight(12);
      setProposedBuiltUpArea(450);
      setIsCornerPlot(false);
      setHasStilt(true);
      setFrontSetbackProvided(3.5);
      setRearSetbackProvided(3.0);
      setSide1Provided(1.5);
      setSide2Provided(1.5);
      setParkingBaysProvided(3);
      setHasRWH(true);
      setHasSolarHeating(false);
      setGreenRating('none');
    } else if (preset === 'multi_unit') {
      setOccupancy('multi_unit');
      setPlotArea(450);
      setPlotFrontage(16);
      setRoadWidth(12);
      setBuildingHeight(15.0);
      setProposedBuiltUpArea(650);
      setIsCornerPlot(true);
      setHasStilt(true);
      setFrontSetbackProvided(3.0);
      setRearSetbackProvided(3.0);
      setSide1Provided(1.5);
      setSide2Provided(3.0);
      setParkingBaysProvided(6);
      setHasRWH(true);
      setHasSolarHeating(false);
      setGreenRating('gold');
    } else if (preset === 'high_rise') {
      setOccupancy('group_housing');
      setPlotArea(4500);
      setPlotFrontage(40);
      setRoadWidth(24);
      setBuildingHeight(42);
      setProposedBuiltUpArea(11000);
      setIsCornerPlot(false);
      setHasStilt(true);
      setFrontSetbackProvided(12);
      setRearSetbackProvided(12);
      setSide1Provided(12);
      setSide2Provided(12);
      setParkingBaysProvided(110);
      setHasRWH(true);
      setHasSolarHeating(true);
      setGreenRating('platinum');
    } else if (preset === 'commercial') {
      setOccupancy('commercial');
      setPlotArea(1200);
      setPlotFrontage(25);
      setRoadWidth(18);
      setBuildingHeight(18);
      setProposedBuiltUpArea(2200);
      setIsCornerPlot(false);
      setHasStilt(true);
      setFrontSetbackProvided(6.0);
      setRearSetbackProvided(3.5);
      setSide1Provided(3.0);
      setSide2Provided(3.0);
      setParkingBaysProvided(30);
      setHasRWH(true);
      setHasSolarHeating(true);
      setGreenRating('silver');
    }
  };

  // Comprehensive Cross-Rule Evaluation
  const auditResults = useMemo<AuditItem[]>(() => {
    const items: AuditItem[] = [];

    // 1. Chapter 2/17: Self-Certification & Sanction Route
    if (occupancy === 'single_unit' && plotArea <= 100) {
      items.push({
        id: 'sanction_route',
        chapterRef: 'Chapter 2.1.2 & Chapter 17',
        ruleTitle: 'Building Plan Approval Route',
        category: 'Statutory Procedure',
        status: 'exempt',
        statutoryLimit: 'Exempt from building permit & completion certificate for plots <= 100 sqm',
        proposedValue: `Plot Area: ${plotArea} sqm`,
        mathExplanation: 'Plot <= 100 sqm qualifies for instant self-certification via token fee of Re 1/- with online affidavit.',
      });
    } else if (plotArea <= 500 && roadWidth >= 9) {
      items.push({
        id: 'sanction_route',
        chapterRef: 'Chapter 2.1.2',
        ruleTitle: 'Building Plan Approval Route',
        category: 'Statutory Procedure',
        status: 'compliant',
        statutoryLimit: 'Instant online approval by Licensed Technical Person (LTP) up to 500 sqm',
        proposedValue: `Plot Area: ${plotArea} sqm`,
        mathExplanation: 'Qualifies for fast-track Online Building Plan Approval System (OBPAS) with 15-day deemed sanction limit.',
      });
    } else {
      items.push({
        id: 'sanction_route',
        chapterRef: 'Chapter 2.1.2 & Chapter 8',
        ruleTitle: 'Building Plan Approval Route',
        category: 'Statutory Procedure',
        status: 'conditional',
        statutoryLimit: 'Standard scrutiny by Authority Committee with inter-departmental NOCs',
        proposedValue: `Plot Area: ${plotArea} sqm`,
        mathExplanation: 'Requires unified online application. Deemed approval triggered on 30th day if NOC departments do not respond.',
      });
    }

    // 2. FAR — resolved by the shared engine so every screen agrees on the number.
    const far = resolveBaseFar({ occupancy, plotArea, roadWidth, greenRating });
    const proposedFar = plotArea > 0 ? proposedBuiltUpArea / plotArea : 0;

    let farStatus: AuditItem['status'] = 'compliant';
    let farRemediation: string | undefined;

    if (proposedFar <= far.effectiveBaseFar + 1e-9) {
      farStatus = 'compliant';
    } else if (proposedFar <= far.maxPermissibleFar + 1e-9) {
      farStatus = 'conditional';
      farRemediation = `The excess ${(proposedBuiltUpArea - far.effectiveBuiltUpArea).toFixed(1)} sqm must be bought as purchasable FAR under the Chapter 9 formula C = Le × Rc × P. The ${roadWidth}m road permits up to FAR ${far.maxPermissibleFar}.`;
    } else {
      farStatus = 'non_compliant';
      farRemediation = `Proposed FAR ${proposedFar.toFixed(2)} exceeds the absolute ceiling of ${far.maxPermissibleFar} (base ${far.effectiveBaseFar} + purchasable ${far.purchasableFar}). Reduce built-up area to ${far.maxPermissibleBuiltUpArea.toFixed(0)} sqm.${far.caveats.length ? ' ' + far.caveats.join(' ') : ''}`;
    }

    items.push({
      id: 'far_audit',
      chapterRef: far.clauseRef,
      ruleTitle: 'Floor Area Ratio (FAR) & built-up area',
      category: 'Building Bulk',
      status: farStatus,
      statutoryLimit: `Base FAR ${far.effectiveBaseFar}${far.greenBonusFraction > 0 ? ` (incl. +${(far.greenBonusFraction * 100).toFixed(0)}% green incentive)` : ''} = ${far.effectiveBuiltUpArea.toFixed(1)} sqm; ceiling with purchasable FAR ${far.maxPermissibleFar} = ${far.maxPermissibleBuiltUpArea.toFixed(1)} sqm`,
      proposedValue: `${proposedBuiltUpArea} sqm (FAR ${proposedFar.toFixed(2)})`,
      mathExplanation: far.workings,
      remediation: farRemediation,
    });

    // 3. Setbacks — one ladder, no numeric holes, high-rise fire setbacks non-compoundable.
    const required = resolveRequiredSetbacks({ occupancy, plotArea, buildingHeight, isCornerPlot });
    const faceVerdicts = assessSetbackFaces(required, {
      front: frontSetbackProvided,
      rear: rearSetbackProvided,
      side1: side1Provided,
      side2: side2Provided,
    });

    const violations = faceVerdicts.filter((v) => v.status === 'violation');
    const compoundable = faceVerdicts.filter((v) => v.status === 'compoundable');

    let setbackStatus: AuditItem['status'] = 'compliant';
    let setbackRemediation: string | undefined;

    if (violations.length > 0) {
      setbackStatus = 'non_compliant';
      setbackRemediation = required.isHighRise
        ? `Fire-tender setbacks on a ${buildingHeight}m building cannot be compounded at any fee (Clause 16.3.2 ii). Deficient: ${violations.map((v) => `${v.face} short by ${v.deficitM}m`).join(', ')}.`
        : `Beyond the Chapter 16.3 compoundable ceiling: ${violations.map((v) => `${v.face} short by ${v.deficitM}m (${v.deficitPct}%)`).join(', ')}. Redesign the envelope.`;
    } else if (compoundable.length > 0) {
      setbackStatus = 'conditional';
      setbackRemediation = `Within the Chapter 16.3 compoundable range: ${compoundable.map((v) => `${v.face} short by ${v.deficitM}m (${v.deficitPct}%)`).join(', ')}. A compounding fee is payable; regularisation is at the Authority's discretion.`;
    }

    items.push({
      id: 'setback_audit',
      chapterRef: required.clauseRef,
      ruleTitle: 'Building setbacks & fire separation',
      category: 'Site Envelope',
      status: setbackStatus,
      statutoryLimit: `Front ${required.front}m · Rear ${required.rear}m · Side-1 ${required.side1}m · Side-2 ${required.side2}m${required.cornerRuleApplied ? ' (corner plot: Note 2 applied)' : ''}`,
      proposedValue: `Front ${frontSetbackProvided}m · Rear ${rearSetbackProvided}m · Side-1 ${side1Provided}m · Side-2 ${side2Provided}m`,
      mathExplanation: `Band "${required.bandLabel}" (${required.typology}). ${faceVerdicts.map((v) => `${v.face} ${v.provided}/${v.required}m`).join('; ')}.`,
      remediation: setbackRemediation,
    });

    // 4. Building Height & Means of Access (Chapter 3.1.1 & Chapter 3.2.4)
    let maxAllowedHeight = roadWidth * 1.5;
    let heightStatus: 'compliant' | 'conditional' | 'non_compliant' = 'compliant';
    let heightRemediation: string | undefined;

    if (occupancy === 'single_unit') {
      if (buildingHeight <= 15.0 && roadWidth >= 6) {
        heightStatus = 'compliant';
      } else if (buildingHeight > 15.0) {
        heightStatus = 'non_compliant';
        heightRemediation = 'Single-unit plotted residential has maximum statutory height limit of 15.0m (3 floors + optional stilt). Cannot exceed 15m.';
      } else {
        heightStatus = 'non_compliant';
        heightRemediation = 'Minimum road width of 6.0m required for residential plotted construction.';
      }
    } else if (occupancy === 'multi_unit') {
      if (roadWidth < 9) {
        heightStatus = 'non_compliant';
        heightRemediation = 'Chapter 3.2.4 Note: Multi-unit residential strictly requires minimum 9.0m road width.';
      } else if (buildingHeight <= 17.5) {
        heightStatus = 'compliant';
      } else {
        heightStatus = 'non_compliant';
        heightRemediation = 'Multi-unit plotted residential has statutory height cap of 17.5m (4 storeys + mandatory stilt).';
      }
    } else {
      if (buildingHeight <= 15) {
        heightStatus = 'compliant';
      } else if (buildingHeight <= 30 && roadWidth >= 12) {
        heightStatus = 'compliant';
      } else if (buildingHeight > 30 && roadWidth >= 18) {
        heightStatus = 'compliant';
      } else {
        heightStatus = 'non_compliant';
        heightRemediation = `Building height of ${buildingHeight}m requires minimum road width of ${buildingHeight > 30 ? '18m' : '12m'}. Abutting road width is ${roadWidth}m.`;
      }
    }

    items.push({
      id: 'height_audit',
      chapterRef: 'Chapter 3.2.4 & Chapter 8',
      ruleTitle: 'Building Height vs. Abutting Road Width',
      category: 'Vertical Envelope',
      status: heightStatus,
      statutoryLimit: occupancy === 'single_unit' ? 'Max 15.0m (min 6m road)' : occupancy === 'multi_unit' ? 'Max 17.5m (min 9m road)' : `Scaled to road width (${roadWidth}m) & progressive setback`,
      proposedValue: `Proposed Height: ${buildingHeight}m on ${roadWidth}m road`,
      mathExplanation: `Occupancy: ${occupancy}. Road width: ${roadWidth}m. Stilt floor provided: ${hasStilt ? 'Yes' : 'No'}.`,
      remediation: heightRemediation,
    });

    // 5. Fire Safety & CFO NOC (Chapter 8)
    const isHighRise = buildingHeight > 15;
    let fireStatus: 'compliant' | 'conditional' | 'exempt' = 'exempt';
    let fireRemediation: string | undefined;

    if (isHighRise || (occupancy === 'commercial' && proposedBuiltUpArea > 500)) {
      fireStatus = 'conditional';
      fireRemediation = 'Mandatory Chief Fire Officer (CFO) provisional & final NOC, dual fire escape staircases, 6m clear motorable fire tender pathway around building, and pressurized shafts.';
    }

    items.push({
      id: 'fire_safety_audit',
      chapterRef: 'Chapter 8 (High Rise & Fire Safety)',
      ruleTitle: 'CFO Fire NOC & Emergency Tender Accessway',
      category: 'Life Safety',
      status: fireStatus === 'conditional' ? 'conditional' : 'compliant',
      statutoryLimit: isHighRise ? 'Mandatory CFO NOC (>15m height), 6m fire driveway, 2 staircases' : 'Standard fire extinguishers under NBC Part 4',
      proposedValue: `Building Height: ${buildingHeight}m | Occupancy: ${occupancy}`,
      mathExplanation: isHighRise
        ? 'Height > 15m classifies as High-Rise under UP Byelaws Chapter 8. Requires dual staircases (min 1.5m width each).'
        : 'Height <= 15m. Does not trigger mandatory High-Rise CFO committee review.',
      remediation: fireRemediation,
    });

    // 6. Parking & EVCI Infrastructure (Chapter 10)
    let reqEcsRatio = 1.0; // ECS per 100 sqm
    if (occupancy === 'single_unit') reqEcsRatio = 0.5;
    else if (occupancy === 'multi_unit') reqEcsRatio = 1.0;
    else if (occupancy === 'group_housing') reqEcsRatio = 1.25;
    else if (occupancy === 'commercial') reqEcsRatio = 2.0;

    const minRequiredParking = Math.ceil((proposedBuiltUpArea / 100) * reqEcsRatio);
    const minEvBays = Math.ceil(minRequiredParking * 0.20);
    const parkingOk = parkingBaysProvided >= minRequiredParking;

    items.push({
      id: 'parking_audit',
      chapterRef: 'Chapter 10 (Table 10.1 & EVCI Norms)',
      ruleTitle: 'Parking Space (ECS) & 20% EV Charging Station Infrastructure',
      category: 'Mobility & Infrastructure',
      status: parkingOk ? 'compliant' : 'non_compliant',
      statutoryLimit: `Min ${minRequiredParking} ECS (${reqEcsRatio} ECS/100m² Built-up) including min ${minEvBays} EV Charging Bays (20%)`,
      proposedValue: `Provided: ${parkingBaysProvided} bays`,
      mathExplanation: `Built-up area: ${proposedBuiltUpArea} sqm / 100 × ${reqEcsRatio} = ${minRequiredParking} ECS. Mandatory EV bays (20%): ${minEvBays} bays with 1.25 safety diversity factor.`,
      remediation: parkingOk
        ? undefined
        : `Deficit of ${minRequiredParking - parkingBaysProvided} ECS. Stilt floor or basement parking must be expanded. Stilt parking clear height must be 2.40m min.`,
    });

    // 7. Environmental & Sustainable Building Norms (Chapter 12)
    const rwhMandatory = plotArea > 300;
    const solarMandatory = plotArea > 500;

    let envStatus: 'compliant' | 'non_compliant' | 'conditional' = 'compliant';
    let envRemediation: string | undefined;

    if (rwhMandatory && !hasRWH) {
      envStatus = 'non_compliant';
      envRemediation = 'Rainwater Harvesting (RWH) system is legally mandatory for all plots > 300 sqm (Chapter 12.1). Construction cannot receive completion certificate without RWH pit.';
    } else if (solarMandatory && !hasSolarHeating) {
      envStatus = 'conditional';
      envRemediation = 'Solar water heating plant (min 100 litres/day per 100 sqm) mandatory for plots > 500 sqm (Chapter 12.2).';
    }

    items.push({
      id: 'env_audit',
      chapterRef: 'Chapter 12 (Sustainability & Green Provisions)',
      ruleTitle: 'Mandatory Rainwater Harvesting (RWH) & Solar Water Heating',
      category: 'Environmental Compliance',
      status: envStatus,
      statutoryLimit: `RWH mandatory if plot > 300 sqm (Your plot: ${plotArea}m²). Solar heating mandatory if plot > 500 sqm.`,
      proposedValue: `RWH: ${hasRWH ? 'Yes' : 'No'} | Solar Plant: ${hasSolarHeating ? 'Yes' : 'No'}`,
      mathExplanation: `Plot Area: ${plotArea} sqm. RWH Pit capacity: ${((plotArea * 0.02) * 1000).toFixed(0)} litres required for 1-hour peak rainfall.`,
      remediation: envRemediation,
    });

    // 8. EWS/LIG Shelter Reservation (Chapter 4.1.2)
    if (plotArea >= 3000 || occupancy === 'group_housing') {
      items.push({
        id: 'ews_audit',
        chapterRef: 'Chapter 4.1.2 (Social Housing)',
        ruleTitle: 'EWS/LIG 10% Dwelling Unit Reservation or Shelter Fund',
        category: 'Statutory Housing',
        status: 'conditional',
        statutoryLimit: 'Mandatory 10% of total dwelling units reserved for EWS/LIG or equivalent shelter fee deposit',
        proposedValue: `Plot Area: ${plotArea} sqm`,
        mathExplanation: 'Plots >= 3000 sqm or multi-family complexes require 10% unit reservation or contribution to UP Awas Bandhu Shelter Fund.',
        remediation: 'Submit undertaking for 10% EWS/LIG unit construction or deposit Shelter Fund fee as notified by Development Authority.',
      });
    }

    return items;
  }, [
    occupancy,
    plotArea,
    plotFrontage,
    roadWidth,
    buildingHeight,
    proposedBuiltUpArea,
    isCornerPlot,
    hasStilt,
    frontSetbackProvided,
    rearSetbackProvided,
    side1Provided,
    side2Provided,
    parkingBaysProvided,
    hasRWH,
    hasSolarHeating,
    greenRating,
  ]);

  // Overall Score & Summary
  const compliantCount = auditResults.filter((i) => i.status === 'compliant' || i.status === 'exempt').length;
  const conditionalCount = auditResults.filter((i) => i.status === 'conditional').length;
  const nonCompliantCount = auditResults.filter((i) => i.status === 'non_compliant').length;
  const totalCount = auditResults.length;
  const scorePercent = Math.round(((compliantCount + conditionalCount * 0.5) / totalCount) * 100);

  const handleSaveToHistory = () => {
    const defaultName =
      historyProjectName.trim() || `${OCCUPANCY_LABELS[occupancy]} · ${plotArea} m² · ${roadWidth}m road`;
    saveSnapshot(defaultName, scorePercent);
    setHistoryProjectName('');
    setIsSavingHistory(false);
    toast.success('Project saved', `"${defaultName}" is in your saved projects on this device.`);
  };

  const handleSwitchSession = (session: SavedProject) => {
    loadSnapshot(session.id);
    toast.info('Project loaded', `Every tab is now working from "${session.name}".`);
  };

  const handleDeleteHistoryItem = (id: string, name: string) => {
    deleteSnapshot(id);
    toast.warning('Project removed', `"${name}" deleted from this device.`);
  };

  const handlePrint = () => {
    window.print();
  };

  // jsPDF and html2canvas are ~600 KB. Loading them on click keeps them out of the
  // first paint for the majority of visitors who never export a report.
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { generateAuditPdfReport } = await import('../utils/pdfGenerator');
      generateAuditPdfReport(currentState, auditResults, logicalConflicts);
      toast.success('PDF Generated', 'Official UP Byelaws 2025 audit report downloaded.');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('PDF Error', 'Failed to generate compliance report.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Cross-Rule Automated Compliance & Verification Engine
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl dark:text-slate-400">
            Evaluates interrelated statutory planning constraints across the unified state code. Simultaneously cross-audits plot bulk, telescopic FAR, purchasable multipliers, progressive fire setbacks, parking ECS, EVCI, rainwater harvesting, and compounding limits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Persistence status indicator */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
            <Save className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Saved {lastSaved || 'just now'}</span>
          </div>

          <button
            onClick={() => setIsSavingHistory((prev) => !prev)}
            title="Save current audit snapshot to local history (last 5 sessions)"
            className="flex items-center space-x-1 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold transition-colors border border-emerald-300 dark:border-emerald-700"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save to History</span>
          </button>

          <button
            onClick={handleResetDefaults}
            title="Reset to statutory default parameters"
            className="flex items-center space-x-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Save Project Modal/Bar (When isSavingHistory is true) */}
      {isSavingHistory && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500/40 p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center space-x-2.5">
            <BookmarkPlus className="w-5 h-5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Save Current Audit Snapshot to Local History
              </h4>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                Stores current plot specifications, setbacks, and compliance results into your 5 most recent project iterations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`e.g. ${occupancy.replace('_', ' ')} ${plotArea}sqm road${roadWidth}m`}
              aria-label="Name for this saved project"
              value={historyProjectName}
              onChange={(e) => setHistoryProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveToHistory();
              }}
              className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-64"
            />
            <button
              onClick={handleSaveToHistory}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
            >
              Confirm Save
            </button>
            <button
              onClick={() => setIsSavingHistory(false)}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-medium dark:text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Local History Tracker (Last 5 Sessions in localStorage) */}
      <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <History className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Recent Audit Sessions (Last 5 Projects in LocalStorage)</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono px-2 py-0.2 rounded-full font-bold">
                  {savedProjects.length}/5 Saved
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {savedProjects.length > 0 && (
              <button
                onClick={() => {
                  savedProjects.forEach((p) => deleteSnapshot(p.id));
                  toast.info('Saved projects cleared', 'All snapshots removed from this device.');
                }}
                className="text-[11px] text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors dark:text-slate-400"
                title="Clear all saved sessions"
              >
                Clear History
              </button>
            )}
            <button
              onClick={() => setShowHistoryPanel((prev) => !prev)}
              className="text-xs text-slate-600 hover:text-slate-800 dark:hover:text-slate-200 font-medium dark:text-slate-400"
            >
              {showHistoryPanel ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {showHistoryPanel && (
          <>
            {savedProjects.length === 0 ? (
              <div className="text-center py-4 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                <FolderGit2 className="w-6 h-6 mx-auto mb-1 text-slate-600 dark:text-slate-400" />
                <p className="font-medium">No saved audit sessions in local history yet.</p>
                <p className="text-[11px] text-slate-600 mt-0.5 dark:text-slate-400">
                  Click <strong className="text-emerald-700 dark:text-emerald-300">"Save to History"</strong> above to bookmark this project configuration for quick switching.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                {savedProjects.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          {item.name}
                        </span>
                        <button
                          onClick={() => handleDeleteHistoryItem(item.id, item.name)}
                          className="text-slate-600 hover:text-rose-500 p-0.5 rounded transition-colors dark:text-slate-400"
                          title="Delete this project session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                        <span>{item.savedAt}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 text-[10px]">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono uppercase">
                          {item.state.occupancy.replace('_', ' ')}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
                          {item.state.plotArea}m² / {item.state.roadWidth}m road
                        </span>
                      </div>

                      {item.score !== undefined && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-600 dark:text-slate-400">Compliance:</span>
                          <span
                            className={`font-bold font-mono ${
                              item.score >= 80
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : item.score >= 60
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {item.score}%
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSwitchSession(item)}
                      className="mt-3 w-full py-1 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Switch to Project</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Preset Quick Loader */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Load Project Template:</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => applyPreset('small_plot')}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            Small Plot (90 m² Self-Cert)
          </button>
          <button
            onClick={() => applyPreset('plotted_res')}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            Plotted Residential (320 m²)
          </button>
          <button
            onClick={() => applyPreset('multi_unit')}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            Multi-Unit Stilt+4 (450 m²)
          </button>
          <button
            onClick={() => applyPreset('high_rise')}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            High-Rise Group Housing (45m ht)
          </button>
          <button
            onClick={() => applyPreset('commercial')}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            Commercial Retail (1200 m²)
          </button>
        </div>
      </div>

      {/* Real-time Logical Constraint Engine Scrutiny Panel */}
      {logicalConflicts.length > 0 && (
        <div className="bg-rose-50/80 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                  Logical Constraint Engine: {logicalConflicts.length} Regulatory Conflict(s) Detected
                </h3>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  Real-time cross-referencing against UP Byelaws 2025 has identified statutory incompatibilities in your proposed parameters:
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 px-2 py-0.5 rounded">
              Active Scrutiny
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-1">
            {logicalConflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-rose-200 dark:border-rose-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1 text-xs max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase ${
                        conflict.severity === 'fatal'
                          ? 'bg-red-600 text-white'
                          : conflict.severity === 'conflict'
                          ? 'bg-amber-600 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {conflict.severity}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {conflict.title}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono dark:text-slate-400">
                      ({conflict.chapterRef})
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {conflict.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] pt-0.5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {conflict.detectedValues.fieldA}: <strong>{conflict.detectedValues.valueA}</strong>
                    </span>
                    {conflict.detectedValues.fieldB && (
                      <span className="text-rose-700 dark:text-rose-400 font-semibold">
                        vs {conflict.detectedValues.fieldB}: <strong>{conflict.detectedValues.valueB}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {conflict.autoFix && (
                  <button
                    onClick={() => applyAutoFix(conflict)}
                    className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-800 text-rose-900 dark:text-rose-200 rounded-lg text-xs font-bold transition-colors border border-rose-300 dark:border-rose-700"
                  >
                    <Wrench className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Auto-Resolve</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Parameters Form (Left) & Live Audit Scorecard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Input Panel */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              <span>Proposed Project Specifications</span>
            </h3>
            <span className="text-[10px] text-slate-600 dark:text-slate-400">Live Evaluation</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Occupancy */}
            <div>
              <label htmlFor="compliance-audit-engine-occupancy-land-use-classification" className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Occupancy / Land Use Classification
              </label>
              <select id="compliance-audit-engine-occupancy-land-use-classification"
                value={occupancy}
                onChange={(e) => setOccupancy(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="single_unit">Residential Plotted: Single Unit (max 15m)</option>
                <option value="multi_unit">Residential Plotted: Multi Unit (max 17.5m)</option>
                <option value="group_housing">Group Housing High-Rise</option>
                <option value="commercial">Commercial / Retail Shopping</option>
              </select>
            </div>

            {/* Site geometry. NumberField clamps on blur, so an intermediate keystroke
                on the way to a larger number is not rewritten under the user's cursor. */}
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Plot area"
                unit="sqm"
                value={plotArea}
                onChange={setPlotArea}
                min={10}
                step={1}
              />
              <NumberField
                label="Abutting road width"
                unit="m"
                value={roadWidth}
                onChange={setRoadWidth}
                min={3}
                step={0.5}
                warning={
                  roadWidth < 9 && (occupancy === 'multi_unit' || occupancy === 'group_housing')
                    ? 'Below the 9 m minimum for multi-family development.'
                    : undefined
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Plot frontage"
                unit="m"
                value={plotFrontage}
                onChange={setPlotFrontage}
                min={3}
                step={0.5}
                hint={plotFrontage > 0 ? `Implied depth ${(plotArea / plotFrontage).toFixed(1)} m` : undefined}
              />
              <NumberField
                label="Building height"
                unit="m"
                value={buildingHeight}
                onChange={setBuildingHeight}
                min={3}
                step={0.5}
                hint={buildingHeight > 15 ? 'High-rise: progressive fire setbacks apply' : undefined}
              />
            </div>

            <NumberField
              label="Total built-up area"
              unit="sqm"
              value={proposedBuiltUpArea}
              onChange={setProposedBuiltUpArea}
              min={10}
              step={5}
              hint={plotArea > 0 ? `Proposed FAR ${(proposedBuiltUpArea / plotArea).toFixed(2)}` : undefined}
            />

            <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Setbacks provided on site
              </span>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Front" unit="m" value={frontSetbackProvided} onChange={setFrontSetbackProvided} min={0} step={0.1} />
                <NumberField label="Rear" unit="m" value={rearSetbackProvided} onChange={setRearSetbackProvided} min={0} step={0.1} />
                <NumberField label="Side-1" unit="m" value={side1Provided} onChange={setSide1Provided} min={0} step={0.1} />
                <NumberField label="Side-2" unit="m" value={side2Provided} onChange={setSide2Provided} min={0} step={0.1} />
              </div>
            </div>

            {/* Parking & Sustainable Features */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div>
                <NumberField
                  label="Parking provided"
                  unit="ECS bays"
                  value={parkingBaysProvided}
                  onChange={setParkingBaysProvided}
                  min={0}
                  step={1}
                />
              </div>

              <div>
                <label htmlFor="compliance-audit-engine-green-rating-certification" className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Green Rating Certification
                </label>
                <select id="compliance-audit-engine-green-rating-certification"
                  value={greenRating}
                  onChange={(e) => setGreenRating(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="none">Standard Non-Rated (0% bonus)</option>
                  <option value="silver">GRIHA 3-Star / IGBC Silver (+3% FAR)</option>
                  <option value="gold">GRIHA 4-Star / IGBC Gold (+5% FAR)</option>
                  <option value="platinum">GRIHA 5-Star / IGBC Platinum (+7% FAR)</option>
                </select>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCornerPlot}
                    onChange={(e) => setIsCornerPlot(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-500 dark:text-emerald-300"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Corner Plot (Side-2 setback = Front setback)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasStilt}
                    onChange={(e) => setHasStilt(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-500 dark:text-emerald-300"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Stilt Floor Proposed (FAR Exempt)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasRWH}
                    onChange={(e) => setHasRWH(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-500 dark:text-emerald-300"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Rainwater Harvesting Pit Proposed</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSolarHeating}
                    onChange={(e) => setHasSolarHeating(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-500 dark:text-emerald-300"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Solar Water Heating System Proposed</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Comprehensive Compliance Audit Scorecard */}
        <div className="lg:col-span-8 space-y-4">
          {/* Audit Summary Header Card */}
          <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-emerald-400 font-mono uppercase tracking-wider font-bold">
                Automated Verification Scorecard
              </span>
              <h3 className="text-lg font-bold">
                {nonCompliantCount === 0 ? 'Plan Permissible for Sanction' : 'Statutory Violations Detected'}
              </h3>
              <p className="text-xs text-slate-300">
                Cross-evaluated across {totalCount} regulatory checkpoints of UP Byelaws 2025.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono text-emerald-400">
                  {scorePercent}%
                </div>
                <div className="text-[10px] text-slate-300">Compliance Index</div>
              </div>

              <div className="h-10 w-[1px] bg-slate-700" />

              <div className="space-y-0.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{compliantCount} Compliant</span>
                </div>
                {conditionalCount > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{conditionalCount} Conditional</span>
                  </div>
                )}
                {nonCompliantCount > 0 && (
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{nonCompliantCount} Non-Compliant</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Audit Checkpoints List */}
          <div className="space-y-3">
            {auditResults.map((item) => {
              const isOk = item.status === 'compliant' || item.status === 'exempt';
              const isConditional = item.status === 'conditional';
              const isFail = item.status === 'non_compliant';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isFail
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : isConditional
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      {isOk && <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />}
                      {isConditional && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />}
                      {isFail && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />}

                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.ruleTitle}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded dark:text-slate-400">
                        {item.chapterRef}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isFail
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            : isConditional
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                    <div>
                      <span className="text-slate-600 text-[11px] block dark:text-slate-400">Statutory Mandate:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{item.statutoryLimit}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 text-[11px] block dark:text-slate-400">Plan Proposed:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{item.proposedValue}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Verification Logic: </span>
                    {item.mathExplanation}
                  </div>

                  {item.remediation && (
                    <div
                      className={`text-xs mt-2 p-2.5 rounded-lg border flex items-start gap-2 ${
                        isFail
                          ? 'bg-rose-100/60 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                          : 'bg-amber-100/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Statutory Action Required: </strong>
                        {item.remediation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
