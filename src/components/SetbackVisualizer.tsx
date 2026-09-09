import React, { useState, useMemo } from 'react';
import {
  Compass,
  Info,
  CheckCircle2,
  Sliders,
  Shield,
  AlertTriangle,
  Scale,
  Coins,
  FileCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Building,
  Check,
  Download,
  Printer,
  FileText
} from 'lucide-react';
import { COMPOUNDABLE_SETBACK_LIMITS, resolveRequiredSetbacks } from '../domain';
import { useToast } from '../context/ToastContext';
import { RoadFrontagePreset, SiteRoadsConfig } from '../types';

interface CircleRatePreset {
  label: string;
  city: string;
  rate: number;
}

const CIRCLE_RATE_PRESETS: CircleRatePreset[] = [
  { label: 'Lucknow • Gomti Nagar / Shaheed Path', city: 'Lucknow', rate: 35000 },
  { label: 'Noida • Sector 62 / Expressway', city: 'Noida', rate: 48000 },
  { label: 'Kanpur • Swaroop Nagar / Mall Road', city: 'Kanpur', rate: 32000 },
  { label: 'Varanasi • Cantonment / Orderly Bazar', city: 'Varanasi', rate: 28000 },
  { label: 'Tier-2 Baseline (Meerut / Agra / Bareilly)', city: 'Tier-2', rate: 22000 },
];

interface SetbackVisualizerProps {
  onOpenRationale?: () => void;
}

export const SetbackVisualizer: React.FC<SetbackVisualizerProps> = ({ onOpenRationale }) => {
  // Base site parameters (using string state so users can backspace/clear without snapping to 3 or 5)
  const [widthInput, setWidthInput] = useState<string>('13.5');
  const [depthInput, setDepthInput] = useState<string>('22.2');
  const [buildingHeight, setBuildingHeight] = useState<number>(12); // meters
  const [isCornerPlot, setIsCornerPlot] = useState<boolean>(false);
  const [hasStilt, setHasStilt] = useState<boolean>(true);
  const [occupancy, setOccupancy] = useState<'single_unit' | 'multi_unit' | 'commercial' | 'group_housing'>('single_unit');

  // Multi-Side Abutting Roads Configuration
  const [roadPreset, setRoadPreset] = useState<RoadFrontagePreset>('1_side');
  const [frontRoadWidth, setFrontRoadWidth] = useState<number>(12); // meters ROW
  const [hasRearRoad, setHasRearRoad] = useState<boolean>(false);
  const [rearRoadWidth, setRearRoadWidth] = useState<number>(9);
  const [hasSide1Road, setHasSide1Road] = useState<boolean>(false);
  const [side1RoadWidth, setSide1RoadWidth] = useState<number>(9);
  const [hasSide2Road, setHasSide2Road] = useState<boolean>(false);
  const [side2RoadWidth, setSide2RoadWidth] = useState<number>(9);

  // Safely parse dimensions without blocking user input while typing
  const plotWidth = useMemo(() => {
    const parsed = parseFloat(widthInput);
    return isNaN(parsed) || parsed <= 0 ? 13.5 : parsed;
  }, [widthInput]);

  const plotDepth = useMemo(() => {
    const parsed = parseFloat(depthInput);
    return isNaN(parsed) || parsed <= 0 ? 22.2 : parsed;
  }, [depthInput]);

  // Compounding & Post-Facto Regularization State (Section 32 UP Urban Planning & Development Act 1973)
  const [enableCompounding, setEnableCompounding] = useState<boolean>(true);
  const [circleRate, setCircleRate] = useState<number>(35000); // ₹ per sqm
  const [frontDevPercent, setFrontDevPercent] = useState<number>(8); // 0 to 20% (10% max statutory)
  const [rearDevPercent, setRearDevPercent] = useState<number>(10); // 0 to 25% (15% max statutory)
  const [side1DevPercent, setSide1DevPercent] = useState<number>(0); // 0 to 25% (15% max statutory)
  const [side2DevPercent, setSide2DevPercent] = useState<number>(0); // 0 to 25% (15% max statutory)
  const [showRationaleDrawer, setShowRationaleDrawer] = useState<boolean>(false);

  const plotArea = plotWidth * plotDepth;

  // Setbacks come from the shared resolver. This screen used to carry its own fourth copy
  // of the ladders, which disagreed with the audit engine on both plot bands and
  // high-rise heights.
  const setbackInfo = useMemo(() => {
    const required = resolveRequiredSetbacks({
      occupancy,
      plotArea,
      buildingHeight,
      isCornerPlot: isCornerPlot || hasSide2Road,
    });

    // Table 3.2.1 Note 2 generalised: every road-facing edge carries the front setback.
    const effectiveSide2 = hasSide2Road || isCornerPlot ? Math.max(required.side2, required.front) : required.side2;
    const effectiveSide1 = hasSide1Road ? Math.max(required.side1, required.front) : required.side1;
    const effectiveRear = hasRearRoad ? Math.max(required.rear, required.front) : required.rear;

    const envelopeWidth = Math.max(0, plotWidth - effectiveSide1 - effectiveSide2);
    const envelopeDepth = Math.max(0, plotDepth - required.front - effectiveRear);
    const envelopeArea = envelopeWidth * envelopeDepth;

    return {
      front: required.front,
      rear: effectiveRear,
      side1: effectiveSide1,
      side2: effectiveSide2,
      maxHeight: required.maxHeight,
      maxFloors: required.maxFloors,
      ruleRef: required.clauseRef,
      bandLabel: required.bandLabel,
      typology: required.typology,
      isHighRise: required.isHighRise,
      note: required.note,
      envelopeWidth,
      envelopeDepth,
      envelopeArea,
      groundCoveragePercent: plotArea > 0 ? (envelopeArea / plotArea) * 100 : 0,
    };
  }, [plotArea, plotWidth, plotDepth, buildingHeight, isCornerPlot, hasSide2Road, hasSide1Road, hasRearRoad, occupancy]);

  // Compounding & Deviation Calculations (Section 32 UP Urban Planning & Development Act, 1973)
  const compoundingAnalysis = useMemo(() => {
    // Statutory Thresholds:
    // Front setback deviation max 10% (strict due to road ROW and front vista)
    // Rear setback deviation max 15% (subject to retaining light court)
    // Side setback deviation max 15%
    // Chapter 16.3 ceilings, shared with the audit engine and the fee calculator.
    // A high-rise fire setback is never compoundable, so the ceiling collapses to zero.
    const highRiseBar = setbackInfo.isHighRise;
    const STATUTORY_MAX_FRONT_PERCENT = highRiseBar ? 0 : COMPOUNDABLE_SETBACK_LIMITS.front * 100;
    const STATUTORY_MAX_REAR_PERCENT = highRiseBar ? 0 : COMPOUNDABLE_SETBACK_LIMITS.rear * 100;
    const STATUTORY_MAX_SIDE_PERCENT = highRiseBar ? 0 : COMPOUNDABLE_SETBACK_LIMITS.side1 * 100;

    // Encroached meters
    const frontEncroachMeters = setbackInfo.front * (frontDevPercent / 100);
    const rearEncroachMeters = setbackInfo.rear * (rearDevPercent / 100);
    const side1EncroachMeters = setbackInfo.side1 * (side1DevPercent / 100);
    const side2EncroachMeters = setbackInfo.side2 * (side2DevPercent / 100);

    // Deviated (Reduced) Setback Dimensions
    const devFront = Math.max(0, setbackInfo.front - frontEncroachMeters);
    const devRear = Math.max(0, setbackInfo.rear - rearEncroachMeters);
    const devSide1 = Math.max(0, setbackInfo.side1 - side1EncroachMeters);
    const devSide2 = Math.max(0, setbackInfo.side2 - side2EncroachMeters);

    // Maximum statutory compoundable envelope (the outer legal ceiling)
    const maxLegalDevFront = Math.max(0, setbackInfo.front * (1 - STATUTORY_MAX_FRONT_PERCENT / 100));
    const maxLegalDevRear = Math.max(0, setbackInfo.rear * (1 - STATUTORY_MAX_REAR_PERCENT / 100));
    const maxLegalDevSide1 = Math.max(0, setbackInfo.side1 * (1 - STATUTORY_MAX_SIDE_PERCENT / 100));
    const maxLegalDevSide2 = Math.max(0, setbackInfo.side2 * (1 - STATUTORY_MAX_SIDE_PERCENT / 100));

    const maxLegalEnvWidth = Math.max(0, plotWidth - maxLegalDevSide1 - maxLegalDevSide2);
    const maxLegalEnvDepth = Math.max(0, plotDepth - maxLegalDevFront - maxLegalDevRear);
    const maxLegalEnvArea = maxLegalEnvWidth * maxLegalEnvDepth;

    // Actual user proposed deviated envelope
    const devEnvWidth = Math.max(0, plotWidth - devSide1 - devSide2);
    const devEnvDepth = Math.max(0, plotDepth - devFront - devRear);
    const devEnvArea = devEnvWidth * devEnvDepth;

    // Excess encroached covered area beyond sanctioned envelope
    const encroachedFootprintArea = Math.max(0, devEnvArea - setbackInfo.envelopeArea);
    const encroachedFootprintPercent = setbackInfo.envelopeArea > 0
      ? (encroachedFootprintArea / setbackInfo.envelopeArea) * 100
      : 0;

    // Statutory Violation Check
    const isFrontViolation = frontDevPercent > STATUTORY_MAX_FRONT_PERCENT;
    const isRearViolation = rearDevPercent > STATUTORY_MAX_REAR_PERCENT;
    const isSide1Violation = side1DevPercent > STATUTORY_MAX_SIDE_PERCENT;
    const isSide2Violation = side2DevPercent > STATUTORY_MAX_SIDE_PERCENT;
    const isRearCourtyardChoked = devRear < 1.0 && setbackInfo.rear >= 1.5;

    const hasStatutoryViolation =
      isFrontViolation || isRearViolation || isSide1Violation || isSide2Violation || isRearCourtyardChoked;

    // Compounding Fee Calculation (Shaman Shulk / शमन शुल्क):
    // Rate Multiplier: 50% of DM Circle Rate for Residential; 100% for Commercial
    // Base Fee = Encroached Ground Footprint Area (sqm) × (Multiplier × DM Circle Rate)
    // Plus 10% Administrative Surcharge (Cess)
    const rateMultiplier = occupancy === 'commercial' ? 1.0 : 0.5;
    const effectiveRatePerSqm = circleRate * rateMultiplier;
    const baseCompoundingFee = encroachedFootprintArea * effectiveRatePerSqm;
    const adminSurcharge = baseCompoundingFee * 0.10;
    const totalCompoundingFee = baseCompoundingFee + adminSurcharge;

    return {
      STATUTORY_MAX_FRONT_PERCENT,
      STATUTORY_MAX_REAR_PERCENT,
      STATUTORY_MAX_SIDE_PERCENT,
      frontEncroachMeters,
      rearEncroachMeters,
      side1EncroachMeters,
      side2EncroachMeters,
      devFront,
      devRear,
      devSide1,
      devSide2,
      maxLegalDevFront,
      maxLegalDevRear,
      maxLegalDevSide1,
      maxLegalDevSide2,
      maxLegalEnvWidth,
      maxLegalEnvDepth,
      maxLegalEnvArea,
      devEnvWidth,
      devEnvDepth,
      devEnvArea,
      encroachedFootprintArea,
      encroachedFootprintPercent,
      isFrontViolation,
      isRearViolation,
      isSide1Violation,
      isSide2Violation,
      isRearCourtyardChoked,
      hasStatutoryViolation,
      circleRate,
      rateMultiplier,
      effectiveRatePerSqm,
      baseCompoundingFee,
      adminSurcharge,
      totalCompoundingFee,
    };
  }, [
    setbackInfo,
    frontDevPercent,
    rearDevPercent,
    side1DevPercent,
    side2DevPercent,
    plotWidth,
    plotDepth,
    circleRate,
    occupancy
  ]);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const toast = useToast();

  const hasEastRoad = hasSide2Road || isCornerPlot;
  const hasWestRoad = hasSide1Road;
  const hasNorthRoad = hasRearRoad;
  const roadCount = 1 + (hasNorthRoad ? 1 : 0) + (hasWestRoad ? 1 : 0) + (hasEastRoad ? 1 : 0);

  const roadsConfig: SiteRoadsConfig = useMemo(() => ({
    preset: roadPreset,
    frontWidth: frontRoadWidth,
    hasRearRoad: hasNorthRoad,
    rearWidth: rearRoadWidth,
    hasSide1Road: hasWestRoad,
    side1Width: side1RoadWidth,
    hasSide2Road: hasEastRoad,
    side2Width: side2RoadWidth,
  }), [roadPreset, frontRoadWidth, hasNorthRoad, rearRoadWidth, hasWestRoad, side1RoadWidth, hasEastRoad, side2RoadWidth]);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { generateSetbackBlueprintPdfReport } = await import('../utils/pdfGenerator');
      generateSetbackBlueprintPdfReport({
        plotWidth,
        plotDepth,
        plotArea,
        buildingHeight,
        occupancy,
        isCornerPlot: hasEastRoad,
        roads: roadsConfig,
        hasStilt,
        circleRate,
        setbackInfo,
        enableCompounding,
        compoundingAnalysis: {
          ...compoundingAnalysis,
          circleRate,
        },
        frontDevPercent,
        rearDevPercent,
        side1DevPercent,
        side2DevPercent,
      });
      toast.success(
        'PDF Blueprint Generated',
        `Official 2D Setback & Envelope dossier downloaded (${plotArea.toFixed(1)} sqm, ${roadCount}-side road frontage).`
      );
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('PDF Generation Failed', 'An error occurred while building the architectural blueprint PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Scaled Responsive Blueprint Coordinates (Mathematical Layout)
  const leftDimGutter = hasWestRoad ? 68 : 52;
  const rightGutter = hasEastRoad ? 68 : 34;
  const topGutter = hasNorthRoad ? 64 : 46;
  const bottomRoadGutter = 58;

  const vbWidth = 560;
  const vbHeight = 560;

  const availablePlotW = vbWidth - leftDimGutter - rightGutter;
  const availablePlotH = vbHeight - topGutter - bottomRoadGutter;

  const scale = Math.min(availablePlotW / plotWidth, availablePlotH / plotDepth);

  const plotSvgW = plotWidth * scale;
  const plotSvgH = plotDepth * scale;

  // Center plot within the available coordinate window
  const plotX = leftDimGutter + (availablePlotW - plotSvgW) / 2;
  const plotY = topGutter + (availablePlotH - plotSvgH) / 2;

  // Standard envelope coordinates (top is rear, bottom is front towards road)
  const stdEnvX = plotX + setbackInfo.side1 * scale;
  const stdEnvY = plotY + setbackInfo.rear * scale;
  const stdEnvW = Math.max(0, setbackInfo.envelopeWidth * scale);
  const stdEnvH = Math.max(0, setbackInfo.envelopeDepth * scale);

  // Maximum legal compoundable envelope coordinates
  const maxLegalX = plotX + compoundingAnalysis.maxLegalDevSide1 * scale;
  const maxLegalY = plotY + compoundingAnalysis.maxLegalDevRear * scale;
  const maxLegalW = Math.max(0, compoundingAnalysis.maxLegalEnvWidth * scale);
  const maxLegalH = Math.max(0, compoundingAnalysis.maxLegalEnvDepth * scale);

  // Proposed deviated envelope coordinates
  const devEnvX = plotX + compoundingAnalysis.devSide1 * scale;
  const devEnvY = plotY + compoundingAnalysis.devRear * scale;
  const devEnvW = Math.max(0, compoundingAnalysis.devEnvWidth * scale);
  const devEnvH = Math.max(0, compoundingAnalysis.devEnvDepth * scale);

  // Road Frontage Preset Handlers
  const handleApplyPreset = (preset: RoadFrontagePreset) => {
    setRoadPreset(preset);
    if (preset === '1_side') {
      setHasRearRoad(false);
      setHasSide1Road(false);
      setHasSide2Road(false);
      setIsCornerPlot(false);
    } else if (preset === '2_side_corner') {
      setHasRearRoad(false);
      setHasSide1Road(false);
      setHasSide2Road(true);
      setIsCornerPlot(true);
      if (side2RoadWidth === 0) setSide2RoadWidth(9);
    } else if (preset === '2_side_through') {
      setHasRearRoad(true);
      setHasSide1Road(false);
      setHasSide2Road(false);
      setIsCornerPlot(false);
      if (rearRoadWidth === 0) setRearRoadWidth(9);
    } else if (preset === '3_side') {
      setHasRearRoad(false);
      setHasSide1Road(true);
      setHasSide2Road(true);
      setIsCornerPlot(true);
      if (side1RoadWidth === 0) setSide1RoadWidth(9);
      if (side2RoadWidth === 0) setSide2RoadWidth(9);
    } else if (preset === '4_side') {
      setHasRearRoad(true);
      setHasSide1Road(true);
      setHasSide2Road(true);
      setIsCornerPlot(true);
      if (rearRoadWidth === 0) setRearRoadWidth(9);
      if (side1RoadWidth === 0) setSide1RoadWidth(9);
      if (side2RoadWidth === 0) setSide2RoadWidth(9);
    }
  };

  // Preset Scenario Handlers
  const applySanctionedOnly = () => {
    setFrontDevPercent(0);
    setRearDevPercent(0);
    setSide1DevPercent(0);
    setSide2DevPercent(0);
  };

  const applySafeDeviation = () => {
    setFrontDevPercent(5);
    setRearDevPercent(5);
    setSide1DevPercent(setbackInfo.side1 > 0 ? 5 : 0);
    setSide2DevPercent(setbackInfo.side2 > 0 ? 5 : 0);
  };

  const applyMaxAllowedSec32 = () => {
    setFrontDevPercent(10);
    setRearDevPercent(15);
    setSide1DevPercent(setbackInfo.side1 > 0 ? 15 : 0);
    setSide2DevPercent(setbackInfo.side2 > 0 ? 15 : 0);
  };

  const applyOverLimitTest = () => {
    setFrontDevPercent(16);
    setRearDevPercent(20);
    setSide1DevPercent(setbackInfo.side1 > 0 ? 18 : 0);
    setSide2DevPercent(setbackInfo.side2 > 0 ? 18 : 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Compounding Toggle */}
      <div className="rounded-[1.25rem] border border-white/10 bg-slate-900 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-md sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Compass className="w-3.5 h-3.5" />
                <span>2D Spatial Geometry & Envelope Solver</span>
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                UP Byelaws 2025 • Chapter 3.2.4
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Site Layout, Setbacks & Regularization Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed dark:text-slate-400">
              Verify statutory setback clearance corridors and simulate compoundable deviations under Section 32 of the UP Urban Planning and Development Act, 1973.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenRationale && (
              <button
                onClick={onOpenRationale}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all active:scale-95 dark:bg-white/10"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Planning Rationale Guide</span>
                <ArrowRight className="w-3 h-3 text-slate-600 dark:text-slate-400" />
              </button>
            )}

            {/* Apple-Style Compounding Mode Toggle */}
            <div className="flex items-center gap-3 bg-white/10 px-3.5 py-2 rounded-xl border border-white/15 backdrop-blur-md dark:bg-white/10">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  <span>Compoundable Deviations</span>
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400">
                  Section 32 Post-Facto Regularization
                </div>
              </div>

              <button
                onClick={() => setEnableCompounding(!enableCompounding)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  enableCompounding ? 'bg-amber-500' : 'bg-slate-700'
                }`}
                role="switch"
                aria-checked={enableCompounding}
                aria-label="Toggle Compoundable Deviations Mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableCompounding ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameters & Compounding Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Base Geometry Card */}
          <div className="apple-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Plot & Occupancy Configuration
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.08] px-2 py-0.5 rounded-full">
                {plotArea.toFixed(1)} sqm
              </span>
            </div>

            <div>
              <label htmlFor="setback-visualizer-occupancy-building-typology" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Occupancy & Building Typology
              </label>
              <select id="setback-visualizer-occupancy-building-typology"
                value={occupancy}
                onChange={(e) => setOccupancy(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-white/[0.05] border border-black/[0.1] dark:border-white/[0.1] rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="single_unit">Residential Plotted: Single Unit (max 15m ht)</option>
                <option value="multi_unit">Residential Plotted: Multi Unit (max 17.5m ht)</option>
                <option value="group_housing">Residential Group Housing (Progressive Setbacks)</option>
                <option value="commercial">Commercial / Retail Shopping Center</option>
              </select>
            </div>

            {/* Quick Plot Dimensions Presets */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Standard Standard Plot Sizes:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => { setWidthInput('10'); setDepthInput('15'); }}
                  className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono transition-colors text-center"
                >
                  10m × 15m (150m²)
                </button>
                <button
                  type="button"
                  onClick={() => { setWidthInput('13.5'); setDepthInput('22.2'); }}
                  className="py-1 px-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-mono transition-colors text-center font-bold"
                >
                  13.5m × 22.2m (300m²)
                </button>
                <button
                  type="button"
                  onClick={() => { setWidthInput('18'); setDepthInput('28'); }}
                  className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono transition-colors text-center"
                >
                  18m × 28m (504m²)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="setback-visualizer-plot-width-frontage" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Plot Width (Frontage)
                </label>
                <div className="flex items-center space-x-1.5">
                  <input id="setback-visualizer-plot-width-frontage"
                    type="text"
                    inputMode="decimal"
                    value={widthInput}
                    onChange={(e) => setWidthInput(e.target.value)}
                    placeholder="e.g. 13.5"
                    className="w-full bg-slate-50 dark:bg-white/[0.05] border border-black/[0.1] dark:border-white/[0.1] rounded-xl p-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">m</span>
                </div>
              </div>
              <div>
                <label htmlFor="setback-visualizer-plot-depth" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Plot Depth
                </label>
                <div className="flex items-center space-x-1.5">
                  <input id="setback-visualizer-plot-depth"
                    type="text"
                    inputMode="decimal"
                    value={depthInput}
                    onChange={(e) => setDepthInput(e.target.value)}
                    placeholder="e.g. 22.2"
                    className="w-full bg-slate-50 dark:bg-white/[0.05] border border-black/[0.1] dark:border-white/[0.1] rounded-xl p-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">m</span>
                </div>
              </div>
            </div>

            {occupancy === 'group_housing' && (
              <div>
                <label htmlFor="setback-visualizer-proposed-building-height" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Proposed Building Height
                </label>
                <div className="flex items-center space-x-1.5">
                  <input id="setback-visualizer-proposed-building-height"
                    type="number"
                    min="5"
                    max="150"
                    value={buildingHeight}
                    onChange={(e) => setBuildingHeight(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-white/[0.05] border border-black/[0.1] dark:border-white/[0.1] rounded-xl p-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">m</span>
                </div>
                <span className="text-[10px] text-slate-600 mt-1 block dark:text-slate-400">
                  Scales +1.0m peripheral setback for every 3m height above 15m (Chapter 3.2.4.9)
                </span>
              </div>
            )}

            {/* Abutting Roads & Frontage Configuration (Statutory Byelaws Note-2) */}
            <div className="space-y-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Abutting Roads & Right-of-Way (ROW)
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {roadCount}-Side Road{roadCount > 1 ? 's' : ''}
                </span>
              </div>

              {/* Road Frontage Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Frontage Layout Preset:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('1_side')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition-colors text-center border ${
                      roadPreset === '1_side'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'bg-slate-100 dark:bg-white/[0.05] border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    1-Side (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('2_side_corner')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition-colors text-center border ${
                      roadPreset === '2_side_corner'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'bg-slate-100 dark:bg-white/[0.05] border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    2-Side (Corner)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('3_side')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition-colors text-center border ${
                      roadPreset === '3_side'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'bg-slate-100 dark:bg-white/[0.05] border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    3-Side Roads
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('4_side')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition-colors text-center border ${
                      roadPreset === '4_side'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'bg-slate-100 dark:bg-white/[0.05] border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    4-Side (Island)
                  </button>
                </div>
              </div>

              {/* Individual Road Width Controls */}
              <div className="space-y-1.5 pt-1 text-xs">
                {/* Front (Primary) Road */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
                        Front Road (South)
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400">Primary access frontage</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      step="0.5"
                      min="3"
                      max="60"
                      aria-label="Front road width in metres"
              value={frontRoadWidth}
                      onChange={(e) => setFrontRoadWidth(Math.max(3, parseFloat(e.target.value) || 3))}
                      className="w-16 bg-white dark:bg-[#1e2430] border border-black/[0.1] dark:border-white/[0.15] rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white text-right"
                    />
                    <span className="text-slate-600 text-xs font-mono dark:text-slate-400">m</span>
                  </div>
                </div>

                {/* Rear Road (North) */}
                <div className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  hasRearRoad
                    ? 'bg-slate-50 dark:bg-white/[0.03] border-emerald-500/30'
                    : 'bg-transparent border-black/[0.04] dark:border-white/[0.04]'
                }`}>
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasRearRoad}
                      onChange={(e) => {
                        setHasRearRoad(e.target.checked);
                        setRoadPreset('1_side');
                      }}
                      className="rounded text-emerald-700 focus:ring-emerald-500 dark:text-emerald-300"
                    />
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs block">
                        Rear Road (North)
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400">
                        {hasRearRoad ? 'Through / Double frontage' : 'Adjacent private plot'}
                      </span>
                    </div>
                  </label>
                  {hasRearRoad ? (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="3"
                        max="60"
                        aria-label="Rear road width in metres"
              value={rearRoadWidth}
                        onChange={(e) => setRearRoadWidth(Math.max(3, parseFloat(e.target.value) || 3))}
                        className="w-16 bg-white dark:bg-[#1e2430] border border-black/[0.1] dark:border-white/[0.15] rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white text-right"
                      />
                      <span className="text-slate-600 text-xs font-mono dark:text-slate-400">m</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-700 italic dark:text-slate-300">No road</span>
                  )}
                </div>

                {/* Side-1 Road (West) */}
                <div className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  hasSide1Road
                    ? 'bg-slate-50 dark:bg-white/[0.03] border-emerald-500/30'
                    : 'bg-transparent border-black/[0.04] dark:border-white/[0.04]'
                }`}>
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasSide1Road}
                      onChange={(e) => {
                        setHasSide1Road(e.target.checked);
                        setRoadPreset('1_side');
                      }}
                      className="rounded text-emerald-700 focus:ring-emerald-500 dark:text-emerald-300"
                    />
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs block">
                        Side-1 Road (West)
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400">
                        {hasSide1Road ? 'Flanking western road' : 'Adjacent private plot'}
                      </span>
                    </div>
                  </label>
                  {hasSide1Road ? (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="3"
                        max="60"
                        aria-label="Side-1 road width in metres"
              value={side1RoadWidth}
                        onChange={(e) => setSide1RoadWidth(Math.max(3, parseFloat(e.target.value) || 3))}
                        className="w-16 bg-white dark:bg-[#1e2430] border border-black/[0.1] dark:border-white/[0.15] rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white text-right"
                      />
                      <span className="text-slate-600 text-xs font-mono dark:text-slate-400">m</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-700 italic dark:text-slate-300">No road</span>
                  )}
                </div>

                {/* Side-2 Road (East / Corner) */}
                <div className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  hasEastRoad
                    ? 'bg-amber-500/[0.06] border-amber-500/40'
                    : 'bg-transparent border-black/[0.04] dark:border-white/[0.04]'
                }`}>
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasEastRoad}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setHasSide2Road(val);
                        setIsCornerPlot(val);
                        setRoadPreset('1_side');
                      }}
                      className="rounded text-amber-700 focus:ring-amber-500 dark:text-amber-300"
                    />
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs block">
                        Side-2 Road (East / Corner)
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400">
                        {hasEastRoad ? 'Flanking corner road (Note-2 applies)' : 'Adjacent private plot'}
                      </span>
                    </div>
                  </label>
                  {hasEastRoad ? (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="3"
                        max="60"
                        aria-label="Side-2 road width in metres"
              value={side2RoadWidth}
                        onChange={(e) => setSide2RoadWidth(Math.max(3, parseFloat(e.target.value) || 3))}
                        className="w-16 bg-white dark:bg-[#1e2430] border border-black/[0.1] dark:border-white/[0.15] rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white text-right"
                      />
                      <span className="text-slate-600 text-xs font-mono dark:text-slate-400">m</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-700 italic dark:text-slate-300">No road</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasStilt}
                  onChange={(e) => setHasStilt(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-500 dark:text-emerald-300"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  Stilt Floor Proposed (2.4m ht clearance; exempt from FAR)
                </span>
              </label>
            </div>
          </div>

          {/* Section 32 Compounding & Deviation Sliders */}
          {enableCompounding ? (
            <div className="apple-card p-5 space-y-4 border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-500/[0.03]">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center space-x-2">
                  <Scale className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Section 32 Deviation Simulator
                  </h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                  Post-Facto Regularization
                </span>
              </div>

              {/* Scenario Preset Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  Simulate Regulatory Scenarios:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={applySanctionedOnly}
                    className={`p-2 rounded-xl text-left border text-[11px] transition-all ${
                      frontDevPercent === 0 && rearDevPercent === 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'bg-white dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Zero Deviation</span>
                      <Shield className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-[10px] text-slate-600 font-normal dark:text-slate-400">Sanctioned plan baseline</span>
                  </button>

                  <button
                    type="button"
                    onClick={applySafeDeviation}
                    className={`p-2 rounded-xl text-left border text-[11px] transition-all ${
                      frontDevPercent === 5 && rearDevPercent === 5
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-white dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Minor Tolerance (5%)</span>
                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">Safe</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-normal dark:text-slate-400">Construction tolerance</span>
                  </button>

                  <button
                    type="button"
                    onClick={applyMaxAllowedSec32}
                    className={`p-2 rounded-xl text-left border text-[11px] transition-all ${
                      frontDevPercent === 10 && rearDevPercent === 15
                        ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-400 text-amber-950 dark:text-amber-100 font-bold shadow-xs'
                        : 'bg-white dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Max Legal Cap (Sec 32)</span>
                      <Check className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                    </div>
                    <span className="text-[10px] text-slate-600 font-normal dark:text-slate-400">10% front, 15% rear/sides</span>
                  </button>

                  <button
                    type="button"
                    onClick={applyOverLimitTest}
                    className={`p-2 rounded-xl text-left border text-[11px] transition-all ${
                      frontDevPercent > 10 || rearDevPercent > 15
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200 font-bold'
                        : 'bg-white dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Violation Demo (&gt;15%)</span>
                      <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-[10px] text-slate-600 font-normal dark:text-slate-400">Mandatory demolition</span>
                  </button>
                </div>
              </div>

              {/* Circle Rate Configuration */}
              <div className="pt-3 border-t border-amber-500/15 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                    <span>DM Circle Rate for Shaman Shulk:</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    ₹{circleRate.toLocaleString()}/sqm
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {CIRCLE_RATE_PRESETS.map((p) => (
                    <button
                      key={p.city}
                      type="button"
                      onClick={() => setCircleRate(p.rate)}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                        circleRate === p.rate
                          ? 'bg-amber-700 text-white font-bold border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-white/[0.05] border-black/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {p.city} (₹{(p.rate / 1000).toFixed(0)}k)
                    </button>
                  ))}
                </div>
              </div>

              {/* Front Setback Deviation Slider */}
              <div className="space-y-1.5 pt-3 border-t border-amber-500/15">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Front Setback Deviation:
                  </span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {frontDevPercent}% ({compoundingAnalysis.frontEncroachMeters.toFixed(2)}m reduced)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  aria-label="Front setback deviation, percent"
              value={frontDevPercent}
                  onChange={(e) => setFrontDevPercent(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-white/10 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                  <span>0%</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">Statutory Cap: 10%</span>
                  <span className="text-red-600 dark:text-red-400">&gt;10% Non-Compoundable</span>
                </div>
                {compoundingAnalysis.isFrontViolation && (
                  <div className="text-[10px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>Exceeds 10% front limit! Demolition / rectification mandated under Sec 32.</span>
                  </div>
                )}
              </div>

              {/* Rear Setback Deviation Slider */}
              <div className="space-y-1.5 pt-2 border-t border-amber-500/15">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Rear Setback Deviation:
                  </span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {rearDevPercent}% ({compoundingAnalysis.rearEncroachMeters.toFixed(2)}m reduced)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  aria-label="Rear setback deviation, percent"
              value={rearDevPercent}
                  onChange={(e) => setRearDevPercent(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-white/10 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                  <span>0%</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">Statutory Cap: 15%</span>
                  <span className="text-red-600 font-semibold dark:text-red-400">&gt;15% Non-Compoundable</span>
                </div>
                {compoundingAnalysis.isRearViolation && (
                  <div className="text-[10px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>Exceeds 15% rear limit! Courtyard enclosure strictly prohibited.</span>
                  </div>
                )}
              </div>

              {/* Side-1 & Side-2 Setback Deviation Sliders */}
              {setbackInfo.side1 > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-amber-500/15">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Side-1 Setback Deviation:
                    </span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                      {side1DevPercent}% ({compoundingAnalysis.side1EncroachMeters.toFixed(2)}m)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    aria-label="Side-1 setback deviation, percent"
              value={side1DevPercent}
                    onChange={(e) => setSide1DevPercent(Number(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-white/10 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                    <span>0%</span>
                    <span className="font-bold text-amber-700 dark:text-amber-300">Cap: 15%</span>
                    <span className="text-red-600 dark:text-red-400">&gt;15% Violation</span>
                  </div>
                </div>
              )}

              {setbackInfo.side2 > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-amber-500/15">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Side-2 Setback Deviation:
                    </span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                      {side2DevPercent}% ({compoundingAnalysis.side2EncroachMeters.toFixed(2)}m)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    aria-label="Side-2 setback deviation, percent"
              value={side2DevPercent}
                    onChange={(e) => setSide2DevPercent(Number(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-white/10 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                    <span>0%</span>
                    <span className="font-bold text-amber-700 dark:text-amber-300">Cap: 15%</span>
                    <span className="text-red-600 dark:text-red-400">&gt;15% Violation</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Standard Baseline Guidance Card */
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2 text-emerald-950 dark:text-emerald-200">
              <span className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                <span>Statutory Clearances Applied:</span>
              </span>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                Governing Section: <strong>{setbackInfo.ruleRef}</strong>
              </p>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                Max Permissible Height: <strong>{setbackInfo.maxHeight === 999 ? 'Unrestricted (Subject to Airport NOC)' : `${setbackInfo.maxHeight} meters`}</strong>
              </p>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                Permissible Storeys: <strong>{setbackInfo.maxFloors}</strong>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-emerald-500/15">
                Toggle <strong>Compoundable Deviations</strong> above to simulate post-facto regularization tolerances and fee schedules under Section 32 of UP Act, 1973.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive 2D Blueprint & Fee Schedule (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 2D Blueprint Card */}
          <div className="apple-card p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                  <span>Architectural Site Blueprint & Setback Envelope</span>
                </h3>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  {plotWidth}m Frontage × {plotDepth}m Depth ({plotArea.toFixed(1)} sqm Plot Area)
                </span>
              </div>

              {/* Actions & Status Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-download-blueprint-pdf"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Download Official 2D Setback Blueprint & Byelaw Schedule (PDF)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isGeneratingPdf ? 'Building PDF...' : 'Download PDF Blueprint'}</span>
                </button>

                <button
                  id="btn-print-blueprint"
                  onClick={handlePrintPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer"
                  title="Print or Save as PDF via Browser"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / Save PDF</span>
                </button>

                {enableCompounding ? (
                  compoundingAnalysis.hasStatutoryViolation ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800 shadow-xs">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Non-Compoundable</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-xs">
                      <FileCheck className="w-3 h-3" />
                      <span>Regularizable Sec 32</span>
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Compliant</span>
                  </span>
                )}
              </div>
            </div>

            {/* Setback Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className={`p-2 rounded-xl border ${
                enableCompounding && frontDevPercent > 0
                  ? compoundingAnalysis.isFrontViolation
                    ? 'bg-red-50 border-red-200 dark:bg-red-950/40 text-red-900 dark:text-red-300 dark:border-red-500/30'
                    : 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 dark:border-amber-500/30'
                  : 'bg-slate-50 dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.08]'
              }`}>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Front Setback</span>
                <span className="font-bold font-mono text-sm">
                  {enableCompounding
                    ? `${compoundingAnalysis.devFront.toFixed(2)}m`
                    : `${setbackInfo.front}m`}
                </span>
                {enableCompounding && frontDevPercent > 0 && (
                  <span className="text-[9px] block font-bold text-amber-700 dark:text-amber-400 font-mono">
                    -{compoundingAnalysis.frontEncroachMeters.toFixed(2)}m ({frontDevPercent}%)
                  </span>
                )}
              </div>

              <div className={`p-2 rounded-xl border ${
                enableCompounding && rearDevPercent > 0
                  ? compoundingAnalysis.isRearViolation
                    ? 'bg-red-50 border-red-200 dark:bg-red-950/40 text-red-900 dark:text-red-300 dark:border-red-500/30'
                    : 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 dark:border-amber-500/30'
                  : 'bg-slate-50 dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.08]'
              }`}>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Rear Setback</span>
                <span className="font-bold font-mono text-sm">
                  {enableCompounding
                    ? `${compoundingAnalysis.devRear.toFixed(2)}m`
                    : `${setbackInfo.rear}m`}
                </span>
                {enableCompounding && rearDevPercent > 0 && (
                  <span className="text-[9px] block font-bold text-amber-700 dark:text-amber-400 font-mono">
                    -{compoundingAnalysis.rearEncroachMeters.toFixed(2)}m ({rearDevPercent}%)
                  </span>
                )}
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Side Setbacks</span>
                <span className="font-bold font-mono text-sm">
                  {setbackInfo.side1 > 0 ? `${setbackInfo.side1}m` : '0m'} / {setbackInfo.side2 > 0 ? `${setbackInfo.side2}m` : '0m'}
                </span>
                <span className="text-[9px] text-slate-600 dark:text-slate-400 block font-mono">
                  {isCornerPlot ? 'Side-2 is Road' : 'Internal plot'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-medium">Built Footprint</span>
                <span className="font-bold font-mono text-sm text-emerald-900 dark:text-emerald-100">
                  {enableCompounding
                    ? `${compoundingAnalysis.devEnvArea.toFixed(1)} m²`
                    : `${setbackInfo.envelopeArea.toFixed(1)} m²`}
                </span>
                <span className="text-[9px] text-emerald-700 dark:text-emerald-300 block font-mono">
                  {enableCompounding && compoundingAnalysis.encroachedFootprintArea > 0
                    ? `+${compoundingAnalysis.encroachedFootprintArea.toFixed(1)} m² deviation`
                    : `${setbackInfo.groundCoveragePercent.toFixed(1)}% Coverage`}
                </span>
              </div>
            </div>

            {/* Overhauled Responsive 2D Blueprint Canvas */}
            <div className="relative rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] p-2 sm:p-4 overflow-hidden shadow-inner">
              <svg
                viewBox={`0 0 ${vbWidth} ${vbHeight}`}
                className="w-full max-w-[500px] h-auto aspect-[540/560] select-none mx-auto drop-shadow-sm"
              >
                <defs>
                  {/* Subtle Blueprint Dot Grid Pattern */}
                  <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="currentColor"
                      className="text-slate-600 dark:text-slate-700/60"
                      strokeWidth="0.5"
                    />
                  </pattern>

                  {/* Compounding Deviation Diagonal Hatch */}
                  <pattern id="compoundingHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.45" />
                  </pattern>

                  {/* Statutory Violation Warning Hatch */}
                  <pattern id="violationHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.55" />
                  </pattern>
                </defs>

                {/* Background Grid Canvas */}
                <rect width={vbWidth} height={vbHeight} fill="url(#cadGrid)" rx="16" />

                {/* Top Rear Boundary Label */}
                <text
                  x={plotX + plotSvgW / 2}
                  y={plotY - 32}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontWeight="600"
                  letterSpacing="0.5"
                >
                  REAR PROPERTY BOUNDARY
                </text>

                {/* CAD Top Dimension Line (Width: 13.5m) with clean witness arrows */}
                <g>
                  {/* Witness Lines */}
                  <line x1={plotX} y1={plotY - 24} x2={plotX} y2={plotY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1={plotX + plotSvgW} y1={plotY - 24} x2={plotX + plotSvgW} y2={plotY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                  {/* Dimension Bar */}
                  <line x1={plotX} y1={plotY - 18} x2={plotX + plotSvgW} y2={plotY - 18} stroke="#64748b" strokeWidth="1.5" />
                  {/* End Ticks */}
                  <line x1={plotX - 3} y1={plotY - 22} x2={plotX + 3} y2={plotY - 14} stroke="#475569" strokeWidth="2" />
                  <line x1={plotX + plotSvgW - 3} y1={plotY - 22} x2={plotX + plotSvgW + 3} y2={plotY - 14} stroke="#475569" strokeWidth="2" />
                  {/* Dimension Label Pill */}
                  <rect
                    x={plotX + plotSvgW / 2 - 42}
                    y={plotY - 26}
                    width="84"
                    height="16"
                    rx="4"
                    fill="#ffffff"
                    className="dark:fill-slate-900"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <text
                    x={plotX + plotSvgW / 2}
                    y={plotY - 14}
                    textAnchor="middle"
                    fill="#334155"
                    className="dark:fill-slate-200"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    Width: {plotWidth}m
                  </text>
                </g>

                {/* CAD Left Dimension Line (Depth: 22.2m) */}
                <g>
                  {/* Witness Lines */}
                  <line x1={plotX - 30} y1={plotY} x2={plotX} y2={plotY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1={plotX - 30} y1={plotY + plotSvgH} x2={plotX} y2={plotY + plotSvgH} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                  {/* Dimension Bar */}
                  <line x1={plotX - 22} y1={plotY} x2={plotX - 22} y2={plotY + plotSvgH} stroke="#64748b" strokeWidth="1.5" />
                  {/* End Ticks */}
                  <line x1={plotX - 26} y1={plotY - 3} x2={plotX - 18} y2={plotY + 3} stroke="#475569" strokeWidth="2" />
                  <line x1={plotX - 26} y1={plotY + plotSvgH - 3} x2={plotX - 18} y2={plotY + plotSvgH + 3} stroke="#475569" strokeWidth="2" />
                  {/* Dimension Label Pill */}
                  <g transform={`rotate(-90 ${plotX - 22} ${plotY + plotSvgH / 2})`}>
                    <rect
                      x={plotX - 22 - 42}
                      y={plotY + plotSvgH / 2 - 8}
                      width="84"
                      height="16"
                      rx="4"
                      fill="#ffffff"
                      className="dark:fill-slate-900"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <text
                      x={plotX - 22}
                      y={plotY + plotSvgH / 2 + 4}
                      textAnchor="middle"
                      fill="#334155"
                      className="dark:fill-slate-200"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      Depth: {plotDepth}m
                    </text>
                  </g>
                </g>

                {/* Plot Boundary Surface */}
                <rect
                  x={plotX}
                  y={plotY}
                  width={plotSvgW}
                  height={plotSvgH}
                  fill="#ffffff"
                  className="dark:fill-[#1e2430]"
                  stroke="#334155"
                  strokeWidth="2.5"
                  rx="3"
                />

                {/* Plot Corner Survey Marks */}
                <g stroke="#64748b" strokeWidth="1.5">
                  <line x1={plotX - 4} y1={plotY} x2={plotX + 4} y2={plotY} />
                  <line x1={plotX} y1={plotY - 4} x2={plotX} y2={plotY + 4} />
                  <line x1={plotX + plotSvgW - 4} y1={plotY} x2={plotX + plotSvgW + 4} y2={plotY} />
                  <line x1={plotX + plotSvgW} y1={plotY - 4} x2={plotX + plotSvgW} y2={plotY + 4} />
                </g>

                {/* Front Setback Clearance Corridor (Soft Sky Blue Shading) */}
                <rect
                  x={plotX}
                  y={plotY + plotSvgH - setbackInfo.front * scale}
                  width={plotSvgW}
                  height={setbackInfo.front * scale}
                  fill="#0ea5e9"
                  fillOpacity="0.08"
                />

                {/* Rear Setback Clearance Corridor (Soft Emerald Shading) */}
                {setbackInfo.rear > 0 && (
                  <rect
                    x={plotX}
                    y={plotY}
                    width={plotSvgW}
                    height={setbackInfo.rear * scale}
                    fill="#10b981"
                    fillOpacity="0.08"
                  />
                )}

                {/* Side Setback Clearance Corridors */}
                {setbackInfo.side1 > 0 && (
                  <rect
                    x={plotX}
                    y={plotY}
                    width={setbackInfo.side1 * scale}
                    height={plotSvgH}
                    fill="#64748b"
                    fillOpacity="0.06"
                  />
                )}
                {setbackInfo.side2 > 0 && (
                  <rect
                    x={plotX + plotSvgW - setbackInfo.side2 * scale}
                    y={plotY}
                    width={setbackInfo.side2 * scale}
                    height={plotSvgH}
                    fill="#64748b"
                    fillOpacity="0.06"
                  />
                )}

                {/* Maximum Legal Compoundable Regularization Boundary (Amber Dashed Outline) */}
                {enableCompounding && maxLegalW > 0 && maxLegalH > 0 && (
                  <g>
                    <rect
                      x={maxLegalX}
                      y={maxLegalY}
                      width={maxLegalW}
                      height={maxLegalH}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    {/* Small legal envelope indicator flag */}
                    <g transform={`translate(${maxLegalX + maxLegalW - 84}, ${maxLegalY + 4})`}>
                      <rect width="80" height="13" rx="3" fill="#fffbeb" stroke="#f59e0b" strokeWidth="0.8" />
                      <text x="40" y="9.5" textAnchor="middle" fill="#b45309" fontSize="7.5" fontWeight="700">
                        SEC 32 LEGAL CAP
                      </text>
                    </g>
                  </g>
                )}

                {/* Standard Building Envelope (Sanctioned Baseline) */}
                {stdEnvW > 0 && stdEnvH > 0 && (
                  <rect
                    x={stdEnvX}
                    y={stdEnvY}
                    width={stdEnvW}
                    height={stdEnvH}
                    fill="#10b981"
                    fillOpacity={enableCompounding ? 0.08 : 0.22}
                    stroke="#059669"
                    strokeWidth={enableCompounding ? 1.5 : 2}
                    strokeDasharray={enableCompounding ? '4 3' : undefined}
                    rx="2"
                  />
                )}

                {/* Proposed Deviated Footprint (When Compounding is Enabled) */}
                {enableCompounding && devEnvW > 0 && devEnvH > 0 && (
                  <g>
                    <rect
                      x={devEnvX}
                      y={devEnvY}
                      width={devEnvW}
                      height={devEnvH}
                      fill={compoundingAnalysis.hasStatutoryViolation ? 'url(#violationHatch)' : 'url(#compoundingHatch)'}
                      stroke={compoundingAnalysis.hasStatutoryViolation ? '#dc2626' : '#d97706'}
                      strokeWidth="2"
                      rx="2"
                    />

                    {/* Encroached Delta Highlight Bands */}
                    {compoundingAnalysis.frontEncroachMeters > 0 && (
                      <rect
                        x={devEnvX}
                        y={stdEnvY + stdEnvH}
                        width={devEnvW}
                        height={compoundingAnalysis.frontEncroachMeters * scale}
                        fill={compoundingAnalysis.isFrontViolation ? '#ef4444' : '#f59e0b'}
                        fillOpacity="0.4"
                      />
                    )}
                    {compoundingAnalysis.rearEncroachMeters > 0 && (
                      <rect
                        x={devEnvX}
                        y={devEnvY}
                        width={devEnvW}
                        height={compoundingAnalysis.rearEncroachMeters * scale}
                        fill={compoundingAnalysis.isRearViolation ? '#ef4444' : '#f59e0b'}
                        fillOpacity="0.4"
                      />
                    )}
                  </g>
                )}

                {/* Center CAD Footprint Info Floating Badge (Clean, Legible, No Clashing Text!) */}
                {(() => {
                  const badgeW = 186;
                  const badgeH = 50;
                  const centerX = plotX + plotSvgW / 2;
                  const centerY = plotY + plotSvgH / 2;

                  return (
                    <g transform={`translate(${centerX - badgeW / 2}, ${centerY - badgeH / 2})`}>
                      <rect
                        width={badgeW}
                        height={badgeH}
                        rx="8"
                        fill="#ffffff"
                        className="dark:fill-[#0f172a]"
                        stroke={
                          enableCompounding
                            ? compoundingAnalysis.hasStatutoryViolation
                              ? '#ef4444'
                              : '#f59e0b'
                            : '#10b981'
                        }
                        strokeWidth="1.5"
                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                      />

                      {enableCompounding ? (
                        <>
                          <text
                            x={badgeW / 2}
                            y="18"
                            textAnchor="middle"
                            fill={compoundingAnalysis.hasStatutoryViolation ? '#dc2626' : '#b45309'}
                            fontSize="11"
                            fontWeight="800"
                          >
                            {compoundingAnalysis.hasStatutoryViolation
                              ? 'EXCEEDS STATUTORY CAP'
                              : 'DEVIATED FOOTPRINT'}
                          </text>
                          <text
                            x={badgeW / 2}
                            y="33"
                            textAnchor="middle"
                            fill="#334155"
                            className="dark:fill-slate-200"
                            fontSize="11"
                            fontWeight="700"
                            fontFamily="monospace"
                          >
                            {compoundingAnalysis.devEnvArea.toFixed(1)} m²
                            <tspan fill={compoundingAnalysis.hasStatutoryViolation ? '#dc2626' : '#d97706'} fontWeight="bold">
                              {' '}(+{compoundingAnalysis.encroachedFootprintArea.toFixed(1)} m²)
                            </tspan>
                          </text>
                          <text
                            x={badgeW / 2}
                            y="44"
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize="8"
                            fontWeight="600"
                          >
                            Sanctioned: {setbackInfo.envelopeArea.toFixed(1)} m²
                          </text>
                        </>
                      ) : (
                        <>
                          <text
                            x={badgeW / 2}
                            y="18"
                            textAnchor="middle"
                            fill="#059669"
                            fontSize="11"
                            fontWeight="800"
                          >
                            PERMISSIBLE FOOTPRINT
                          </text>
                          <text
                            x={badgeW / 2}
                            y="33"
                            textAnchor="middle"
                            fill="#1e293b"
                            className="dark:fill-white"
                            fontSize="12"
                            fontWeight="700"
                            fontFamily="monospace"
                          >
                            {setbackInfo.envelopeArea.toFixed(1)} m²
                          </text>
                          <text
                            x={badgeW / 2}
                            y="44"
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize="8"
                            fontWeight="600"
                          >
                            {setbackInfo.envelopeWidth.toFixed(1)}m × {setbackInfo.envelopeDepth.toFixed(1)}m • {setbackInfo.groundCoveragePercent.toFixed(1)}% Coverage
                          </text>
                        </>
                      )}
                    </g>
                  );
                })()}

                {/* Setback Corridor Indicators & Tags */}
                <g fontSize="8.5" fontWeight="600">
                  {/* Rear Setback Tag */}
                  {setbackInfo.rear > 0 && (
                    <g>
                      <rect
                        x={plotX + plotSvgW / 2 - 45}
                        y={plotY + Math.max(3, (setbackInfo.rear * scale) / 2 - 7)}
                        width="90"
                        height="14"
                        rx="3"
                        fill="#ffffff"
                        className="dark:fill-slate-900"
                        stroke="#a7f3d0"
                        strokeWidth="0.8"
                      />
                      <text
                        x={plotX + plotSvgW / 2}
                        y={plotY + Math.max(3, (setbackInfo.rear * scale) / 2 - 7) + 10}
                        textAnchor="middle"
                        fill="#059669"
                      >
                        Rear: {enableCompounding ? `${compoundingAnalysis.devRear.toFixed(2)}m` : `${setbackInfo.rear.toFixed(2)}m`}
                      </text>
                    </g>
                  )}

                  {/* Front Setback Tag */}
                  <g>
                    <rect
                      x={plotX + plotSvgW / 2 - 55}
                      y={plotY + plotSvgH - Math.max(16, (setbackInfo.front * scale) / 2 + 7)}
                      width="110"
                      height="14"
                      rx="3"
                      fill="#ffffff"
                      className="dark:fill-slate-900"
                      stroke="#bae6fd"
                      strokeWidth="0.8"
                    />
                    <text
                      x={plotX + plotSvgW / 2}
                      y={plotY + plotSvgH - Math.max(16, (setbackInfo.front * scale) / 2 + 7) + 10}
                      textAnchor="middle"
                      fill="#0284c7"
                    >
                      Front: {enableCompounding ? `${compoundingAnalysis.devFront.toFixed(2)}m` : `${setbackInfo.front.toFixed(2)}m`}
                    </text>
                  </g>

                  {/* Side-1 (West) Setback Tag */}
                  {setbackInfo.side1 > 0 && (
                    <g>
                      <rect
                        x={plotX + 4}
                        y={plotY + plotSvgH * 0.35 - 7}
                        width="54"
                        height="14"
                        rx="3"
                        fill="#ffffff"
                        className="dark:fill-slate-900"
                        stroke={hasWestRoad ? '#a7f3d0' : '#cbd5e1'}
                        strokeWidth="0.8"
                      />
                      <text
                        x={plotX + 31}
                        y={plotY + plotSvgH * 0.35 + 3}
                        textAnchor="middle"
                        fill={hasWestRoad ? '#059669' : '#334155'}
                        className={hasWestRoad ? undefined : 'dark:fill-slate-300'}
                      >
                        Side-1: {enableCompounding ? `${compoundingAnalysis.devSide1.toFixed(2)}m` : `${setbackInfo.side1.toFixed(2)}m`}
                      </text>
                    </g>
                  )}

                  {/* Side-2 (East / Corner) Setback Tag */}
                  {setbackInfo.side2 > 0 && (
                    <g>
                      <rect
                        x={plotX + plotSvgW - Math.max(side2RoadWidth > 0 ? 64 : 56, setbackInfo.side2 * scale - 2)}
                        y={plotY + plotSvgH * 0.65 - 7}
                        width={hasEastRoad ? '64' : '54'}
                        height="14"
                        rx="3"
                        fill="#ffffff"
                        className="dark:fill-slate-900"
                        stroke={hasEastRoad ? '#fde68a' : '#cbd5e1'}
                        strokeWidth="0.8"
                      />
                      <text
                        x={plotX + plotSvgW - Math.max(side2RoadWidth > 0 ? 32 : 28, (setbackInfo.side2 * scale) / 2)}
                        y={plotY + plotSvgH * 0.65 + 3}
                        textAnchor="middle"
                        fill={hasEastRoad ? '#b45309' : '#334155'}
                        className={hasEastRoad ? undefined : 'dark:fill-slate-300'}
                      >
                        {hasEastRoad ? 'Corner' : 'Side-2'}: {enableCompounding ? `${compoundingAnalysis.devSide2.toFixed(2)}m` : `${setbackInfo.side2.toFixed(2)}m`}
                      </text>
                    </g>
                  )}
                </g>

                {/* Abutting Roads Surfaces (Crisp Architectural Renderings) */}
                {/* 1. Front Abutting Road (South - Primary Access) */}
                <g>
                  {/* Curb line */}
                  <line
                    x1={plotX - 22}
                    y1={plotY + plotSvgH + 4}
                    x2={plotX + plotSvgW + 22}
                    y2={plotY + plotSvgH + 4}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                  {/* Asphalt Surface */}
                  <rect
                    x={plotX - 22}
                    y={plotY + plotSvgH + 6}
                    width={plotSvgW + 44}
                    height="36"
                    fill="#1e293b"
                    rx="4"
                  />
                  {/* Yellow Centerline Dashes */}
                  <line
                    x1={plotX - 16}
                    y1={plotY + plotSvgH + 24}
                    x2={plotX + plotSvgW + 16}
                    y2={plotY + plotSvgH + 24}
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                    strokeDasharray="8 6"
                  />
                  {/* Road Text Badge */}
                  <text
                    x={plotX + plotSvgW / 2}
                    y={plotY + plotSvgH + 21}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="700"
                    letterSpacing="0.5"
                  >
                    FRONT ROAD • {frontRoadWidth}m ROW
                  </text>
                </g>

                {/* 2. Rear Abutting Road (North - if configured) */}
                {hasNorthRoad && (
                  <g>
                    {/* Asphalt Surface */}
                    <rect
                      x={plotX - 22}
                      y={plotY - 40}
                      width={plotSvgW + 44}
                      height="32"
                      fill="#1e293b"
                      rx="4"
                    />
                    {/* Curb line */}
                    <line
                      x1={plotX - 22}
                      y1={plotY - 8}
                      x2={plotX + plotSvgW + 22}
                      y2={plotY - 8}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />
                    {/* Yellow Centerline Dashes */}
                    <line
                      x1={plotX - 16}
                      y1={plotY - 24}
                      x2={plotX + plotSvgW + 16}
                      y2={plotY - 24}
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="8 6"
                    />
                    <text
                      x={plotX + plotSvgW / 2}
                      y={plotY - 21}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="700"
                      letterSpacing="0.5"
                    >
                      REAR ROAD • {rearRoadWidth}m ROW
                    </text>
                  </g>
                )}

                {/* 3. West Abutting Road (Side-1 - if configured) */}
                {hasWestRoad && (
                  <g>
                    {/* Asphalt Surface */}
                    <rect
                      x={plotX - 44}
                      y={plotY - 10}
                      width="36"
                      height={plotSvgH + 20}
                      fill="#1e293b"
                      rx="4"
                    />
                    {/* Curb line */}
                    <line
                      x1={plotX - 6}
                      y1={plotY - 10}
                      x2={plotX - 6}
                      y2={plotY + plotSvgH + 10}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />
                    {/* Yellow Centerline Dashes */}
                    <line
                      x1={plotX - 26}
                      y1={plotY - 6}
                      x2={plotX - 26}
                      y2={plotY + plotSvgH + 6}
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="6 4"
                    />
                    <text
                      x={plotX - 26}
                      y={plotY + plotSvgH / 2}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="bold"
                      transform={`rotate(-90 ${plotX - 26} ${plotY + plotSvgH / 2})`}
                      letterSpacing="0.5"
                    >
                      WEST ROAD • {side1RoadWidth}m ROW
                    </text>
                  </g>
                )}

                {/* 4. East Abutting Road (Side-2 / Corner - if configured) */}
                {hasEastRoad && (
                  <g>
                    {/* Curb line */}
                    <line
                      x1={plotX + plotSvgW + 6}
                      y1={plotY - 10}
                      x2={plotX + plotSvgW + 6}
                      y2={plotY + plotSvgH + 10}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />
                    {/* Asphalt Surface */}
                    <rect
                      x={plotX + plotSvgW + 8}
                      y={plotY - 10}
                      width="38"
                      height={plotSvgH + 20}
                      fill="#1e293b"
                      rx="4"
                    />
                    {/* Yellow Centerline Dashes */}
                    <line
                      x1={plotX + plotSvgW + 27}
                      y1={plotY - 6}
                      x2={plotX + plotSvgW + 27}
                      y2={plotY + plotSvgH + 6}
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="6 4"
                    />
                    <text
                      x={plotX + plotSvgW + 27}
                      y={plotY + plotSvgH / 2}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="bold"
                      transform={`rotate(90 ${plotX + plotSvgW + 27} ${plotY + plotSvgH / 2})`}
                      letterSpacing="0.5"
                    >
                      EAST ROAD • {side2RoadWidth}m ROW
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Clean Architectural Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-xs border-2 border-slate-700 bg-white dark:bg-white/10" />
                <span>Property Boundary</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500/25 border border-emerald-600" />
                <span>Sanctioned Baseline</span>
              </div>
              {enableCompounding && (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-xs border border-amber-500 border-dashed" />
                    <span>Sec 32 Legal Limit</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-xs bg-amber-500/40 border border-amber-600" />
                    <span>Deviated Footprint</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* REAL-TIME COMPOUNDING FEE & REGULARIZATION BREAKDOWN CARD */}
          {enableCompounding && (
            <div className="apple-card p-5 sm:p-6 space-y-4 border-amber-500/30 bg-white dark:bg-[#1c1c1e] shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                <div className="flex items-center space-x-2">
                  <Coins className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Compounding Fee Breakdown (शमन शुल्क विवरण)
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                    UP Urban Planning Act, 1973 § 32
                  </span>
                  <button
                    id="btn-download-fee-pdf"
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-700 hover:bg-amber-800 text-white shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Export Compounding & Setback Schedule as PDF"
                  >
                    <Download className="w-3 h-3" />
                    <span>{isGeneratingPdf ? 'Generating...' : 'Export Fee PDF'}</span>
                  </button>
                </div>
              </div>

              {/* High-Level Fee Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                    Deviated Ground Area
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    +{compoundingAnalysis.encroachedFootprintArea.toFixed(1)} sqm
                  </span>
                  <span className="text-[10px] text-slate-600 block font-mono dark:text-slate-400">
                    ({compoundingAnalysis.encroachedFootprintPercent.toFixed(1)}% above plan)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                    Effective Compounding Rate
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    ₹{compoundingAnalysis.effectiveRatePerSqm.toLocaleString()} / sqm
                  </span>
                  <span className="text-[10px] text-slate-600 block font-mono dark:text-slate-400">
                    {occupancy === 'commercial' ? '100% Circle Rate' : '50% Circle Rate (Res)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold block">
                    Total Regularization Fee
                  </span>
                  <span className="text-lg font-bold font-mono text-amber-900 dark:text-amber-200">
                    ₹{Math.round(compoundingAnalysis.totalCompoundingFee).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 block">
                    Incl. 10% administrative cess
                  </span>
                </div>
              </div>

              {/* Fee Line-Item Calculation Table */}
              <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden text-xs">
                <table className="w-full text-left divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                  <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 text-[11px]">
                    <tr>
                      <th className="p-2.5 font-semibold">Statutory Charge Item</th>
                      <th className="p-2.5 font-semibold">Computation Formula</th>
                      <th className="p-2.5 font-semibold text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] font-mono">
                    <tr>
                      <td className="p-2.5 text-slate-800 dark:text-slate-200 font-sans">
                        Base Setback Encroachment Compounding
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px]">
                        {compoundingAnalysis.encroachedFootprintArea.toFixed(1)} m² × ₹{compoundingAnalysis.effectiveRatePerSqm.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                        ₹{Math.round(compoundingAnalysis.baseCompoundingFee).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-slate-800 dark:text-slate-200 font-sans">
                        Administrative Cess & Scrutiny Surcharge (10%)
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px]">
                        10% of base compounding fee
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                        ₹{Math.round(compoundingAnalysis.adminSurcharge).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-amber-500/10 font-bold">
                      <td className="p-2.5 text-slate-900 dark:text-white font-sans">
                        Total Estimated Payable for Post-Facto Regularization
                      </td>
                      <td className="p-2.5 text-amber-800 dark:text-amber-300 text-[11px]">
                        Payable into Development Authority Account
                      </td>
                      <td className="p-2.5 text-right text-sm text-amber-800 dark:text-amber-200">
                        ₹{Math.round(compoundingAnalysis.totalCompoundingFee).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Statutory Verdict Notice */}
              <div className={`p-4 rounded-xl border ${
                compoundingAnalysis.hasStatutoryViolation
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              } text-xs space-y-1.5`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {compoundingAnalysis.hasStatutoryViolation ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>Ineligible for Compounding: Demolition Mandate</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                      <span>Legally Regularizable by Vice-Chairman (V.C.)</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed text-[11px]">
                  {compoundingAnalysis.hasStatutoryViolation
                    ? 'The proposed deviations exceed the statutory limits prescribed under Section 32 (max 10% front, 15% rear/side). The Vice-Chairman lacks legal authority to compound this envelope. Structural modification or demolition of the encroaching portion is required.'
                    : 'The proposed deviations fall within statutory tolerances under Section 32 of the UP Urban Planning & Development Act, 1973. Upon payment of ₹' + Math.round(compoundingAnalysis.totalCompoundingFee).toLocaleString() + ' Shaman Shulk and submission of structural safety certificates, post-facto sanction can be legally issued.'}
                </p>
              </div>
            </div>
          )}

          {/* Expandable Engineering & Regulatory Rationale Drawer */}
          <div className="apple-card p-5 space-y-3">
            <button
              onClick={() => setShowRationaleDrawer(!showRationaleDrawer)}
              className="w-full flex items-center justify-between text-left focus:outline-none"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Regulatory Rationale: Why Setbacks & Deviation Caps Exist
                </h4>
              </div>
              {showRationaleDrawer ? (
                <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              )}
            </button>

            {showRationaleDrawer && (
              <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed animate-in fade-in duration-200">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">
                    1. Transportation Sight Lines & Subsurface Utilities (Front Setback):
                  </span>
                  <p>
                    Front setbacks guarantee a clear sight triangle at intersections, prevent structural overhangs into municipal road right-of-ways (ROW), and accommodate underground trunk infrastructure (storm drainage, water lines, electricity, and telecommunications). Deviations are strictly capped at 10% because municipal roadway expansion cannot be compromised.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">
                    2. Daylight Penetration & Passive Cross-Ventilation:
                  </span>
                  <p>
                    Under Indian Standard IS 3362 and NBC 2016 Part 8, habitable rooms require unobstructed 45° vertical cones of daylight penetration. Continuous perimeter walls without rear/side setback corridors trap humidity and carbon dioxide. Open courts act as thermal chimneys to expel hot indoor air.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">
                    3. Emergency Fire Tender Access & Rescue Radius:
                  </span>
                  <p>
                    Structures exceeding 15m require continuous peripheral access for hydraulic aerial platforms (Bronto Skylifts). Setback encroachments prevent hydraulic stabilizer deployment, jeopardizing firefighting and upper-floor evacuation operations.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">
                    4. Seismic Separation & Structural Pounding (IS 1893):
                  </span>
                  <p>
                    In Seismic Zones III and IV (covering central and northern UP), buildings vibrate dynamically during earthquakes. Inadequate boundary setbacks cause adjacent floor slabs to strike each other (structural pounding), shearing columns and triggering progressive failure.
                  </p>
                </div>

                {onOpenRationale && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={onOpenRationale}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <span>Read full literature & engineering standards citations</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
