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
  FileDown
} from 'lucide-react';
import { HIGH_RISE_SETBACKS } from '../data/byelawsData';
import {
  AuditEngineState,
  loadAuditState,
  saveAuditState,
  clearAuditState,
  DEFAULT_AUDIT_STATE
} from '../utils/auditStorage';
import {
  evaluateLogicalConstraints,
  RegulatoryConflict
} from '../utils/constraintEngine';
import { generateAuditPdfReport } from '../utils/pdfGenerator';

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

export const ComplianceAuditEngine: React.FC = () => {
  // Load Initial State from LocalStorage
  const initialSavedState = useMemo(() => loadAuditState(), []);

  // Project Parameters State
  const [occupancy, setOccupancy] = useState<'single_unit' | 'multi_unit' | 'group_housing' | 'commercial'>(initialSavedState.occupancy);
  const [plotArea, setPlotArea] = useState<number>(initialSavedState.plotArea); // sqm
  const [plotFrontage, setPlotFrontage] = useState<number>(initialSavedState.plotFrontage); // m
  const [roadWidth, setRoadWidth] = useState<number>(initialSavedState.roadWidth); // m
  const [buildingHeight, setBuildingHeight] = useState<number>(initialSavedState.buildingHeight); // m
  const [proposedBuiltUpArea, setProposedBuiltUpArea] = useState<number>(initialSavedState.proposedBuiltUpArea); // sqm
  const [isCornerPlot, setIsCornerPlot] = useState<boolean>(initialSavedState.isCornerPlot);
  const [hasStilt, setHasStilt] = useState<boolean>(initialSavedState.hasStilt);
  const [frontSetbackProvided, setFrontSetbackProvided] = useState<number>(initialSavedState.frontSetbackProvided);
  const [rearSetbackProvided, setRearSetbackProvided] = useState<number>(initialSavedState.rearSetbackProvided);
  const [side1Provided, setSide1Provided] = useState<number>(initialSavedState.side1Provided);
  const [side2Provided, setSide2Provided] = useState<number>(initialSavedState.side2Provided);
  const [parkingBaysProvided, setParkingBaysProvided] = useState<number>(initialSavedState.parkingBaysProvided);
  const [hasRWH, setHasRWH] = useState<boolean>(initialSavedState.hasRWH);
  const [hasSolarHeating, setHasSolarHeating] = useState<boolean>(initialSavedState.hasSolarHeating);
  const [greenRating, setGreenRating] = useState<'none' | 'silver' | 'gold' | 'platinum'>(initialSavedState.greenRating);

  // Persistence tracking
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Consolidated current state object
  const currentState: AuditEngineState = useMemo(() => ({
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
  }), [
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

  // Auto-save to LocalStorage whenever state changes
  useEffect(() => {
    saveAuditState(currentState);
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSaved(timeStr);
  }, [currentState]);

  // Evaluate Logical Constraints in Real-Time
  const logicalConflicts = useMemo(() => {
    return evaluateLogicalConstraints(currentState);
  }, [currentState]);

  // Reset to Statutory Defaults
  const handleResetDefaults = () => {
    clearAuditState();
    setOccupancy(DEFAULT_AUDIT_STATE.occupancy);
    setPlotArea(DEFAULT_AUDIT_STATE.plotArea);
    setPlotFrontage(DEFAULT_AUDIT_STATE.plotFrontage);
    setRoadWidth(DEFAULT_AUDIT_STATE.roadWidth);
    setBuildingHeight(DEFAULT_AUDIT_STATE.buildingHeight);
    setProposedBuiltUpArea(DEFAULT_AUDIT_STATE.proposedBuiltUpArea);
    setIsCornerPlot(DEFAULT_AUDIT_STATE.isCornerPlot);
    setHasStilt(DEFAULT_AUDIT_STATE.hasStilt);
    setFrontSetbackProvided(DEFAULT_AUDIT_STATE.frontSetbackProvided);
    setRearSetbackProvided(DEFAULT_AUDIT_STATE.rearSetbackProvided);
    setSide1Provided(DEFAULT_AUDIT_STATE.side1Provided);
    setSide2Provided(DEFAULT_AUDIT_STATE.side2Provided);
    setParkingBaysProvided(DEFAULT_AUDIT_STATE.parkingBaysProvided);
    setHasRWH(DEFAULT_AUDIT_STATE.hasRWH);
    setHasSolarHeating(DEFAULT_AUDIT_STATE.hasSolarHeating);
    setGreenRating(DEFAULT_AUDIT_STATE.greenRating);
  };

  // Apply Auto-Fix from Conflict Engine
  const applyAutoFix = (conflict: RegulatoryConflict) => {
    if (!conflict.autoFix) return;
    const fixPatch = conflict.autoFix(currentState);
    if (fixPatch.occupancy !== undefined) setOccupancy(fixPatch.occupancy);
    if (fixPatch.plotArea !== undefined) setPlotArea(fixPatch.plotArea);
    if (fixPatch.plotFrontage !== undefined) setPlotFrontage(fixPatch.plotFrontage);
    if (fixPatch.roadWidth !== undefined) setRoadWidth(fixPatch.roadWidth);
    if (fixPatch.buildingHeight !== undefined) setBuildingHeight(fixPatch.buildingHeight);
    if (fixPatch.proposedBuiltUpArea !== undefined) setProposedBuiltUpArea(fixPatch.proposedBuiltUpArea);
    if (fixPatch.isCornerPlot !== undefined) setIsCornerPlot(fixPatch.isCornerPlot);
    if (fixPatch.hasStilt !== undefined) setHasStilt(fixPatch.hasStilt);
    if (fixPatch.frontSetbackProvided !== undefined) setFrontSetbackProvided(fixPatch.frontSetbackProvided);
    if (fixPatch.rearSetbackProvided !== undefined) setRearSetbackProvided(fixPatch.rearSetbackProvided);
    if (fixPatch.side1Provided !== undefined) setSide1Provided(fixPatch.side1Provided);
    if (fixPatch.side2Provided !== undefined) setSide2Provided(fixPatch.side2Provided);
    if (fixPatch.parkingBaysProvided !== undefined) setParkingBaysProvided(fixPatch.parkingBaysProvided);
    if (fixPatch.hasRWH !== undefined) setHasRWH(fixPatch.hasRWH);
    if (fixPatch.hasSolarHeating !== undefined) setHasSolarHeating(fixPatch.hasSolarHeating);
    if (fixPatch.greenRating !== undefined) setGreenRating(fixPatch.greenRating);
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

    // 2. Chapter 3.2.2: Telescopic Base FAR & Maximum Area
    let baseFar = 1.5;
    let telescopicExplanation = '';
    if (occupancy === 'single_unit' || occupancy === 'multi_unit') {
      if (plotArea <= 100) {
        baseFar = 2.0;
        telescopicExplanation = 'Plot <= 100 sqm: Flat FAR = 2.0';
      } else if (plotArea <= 300) {
        const area1 = 100 * 2.0;
        const area2 = (plotArea - 100) * 1.75;
        baseFar = (area1 + area2) / plotArea;
        telescopicExplanation = `Telescopic: (100×2.0 + ${plotArea - 100}×1.75)/${plotArea} = ${baseFar.toFixed(2)}`;
      } else if (plotArea <= 500) {
        const area1 = 100 * 2.0;
        const area2 = 200 * 1.75;
        const area3 = (plotArea - 300) * 1.50;
        baseFar = (area1 + area2 + area3) / plotArea;
        telescopicExplanation = `Telescopic: (100×2.0 + 200×1.75 + ${plotArea - 300}×1.50)/${plotArea} = ${baseFar.toFixed(2)}`;
      } else if (plotArea <= 1200) {
        const area1 = 100 * 2.0;
        const area2 = 200 * 1.75;
        const area3 = 200 * 1.50;
        const area4 = (plotArea - 500) * 1.25;
        baseFar = (area1 + area2 + area3 + area4) / plotArea;
        telescopicExplanation = `Telescopic: (200 + 350 + 300 + ${plotArea - 500}×1.25)/${plotArea} = ${baseFar.toFixed(2)}`;
      } else {
        const area1 = 100 * 2.0;
        const area2 = 200 * 1.75;
        const area3 = 200 * 1.50;
        const area4 = 700 * 1.25;
        const area5 = (plotArea - 1200) * 1.0;
        baseFar = (area1 + area2 + area3 + area4 + area5) / plotArea;
        telescopicExplanation = `Telescopic: (200 + 350 + 300 + 875 + ${plotArea - 1200}×1.0)/${plotArea} = ${baseFar.toFixed(2)}`;
      }
    } else if (occupancy === 'group_housing') {
      baseFar = roadWidth >= 24 ? 2.5 : roadWidth >= 18 ? 2.0 : 1.75;
      telescopicExplanation = `Group Housing Base FAR for ${roadWidth}m road width = ${baseFar}`;
    } else if (occupancy === 'commercial') {
      baseFar = roadWidth >= 24 ? 2.0 : roadWidth >= 18 ? 1.75 : 1.5;
      telescopicExplanation = `Commercial Base FAR for ${roadWidth}m road width = ${baseFar}`;
    }

    // Green Building Incentive (Chapter 9.3)
    let greenBonus = 0;
    if (greenRating === 'silver') greenBonus = 0.03;
    if (greenRating === 'gold') greenBonus = 0.05;
    if (greenRating === 'platinum') greenBonus = 0.07;
    const effectiveBaseFar = baseFar * (1 + greenBonus);

    const maxPermissibleBaseBuiltUp = plotArea * effectiveBaseFar;
    const proposedFar = proposedBuiltUpArea / plotArea;

    let farStatus: 'compliant' | 'conditional' | 'non_compliant' = 'compliant';
    let farRemediation = undefined;

    if (proposedFar <= effectiveBaseFar) {
      farStatus = 'compliant';
    } else if (proposedFar <= effectiveBaseFar * 1.5 && roadWidth >= 12) {
      farStatus = 'conditional';
      farRemediation = `Purchasable FAR required for excess ${(proposedBuiltUpArea - maxPermissibleBaseBuiltUp).toFixed(1)} sqm under Chapter 9 formula C = Le × Rc × P. Road width ${roadWidth}m >= 12m permits purchasable FAR.`;
    } else {
      farStatus = 'non_compliant';
      farRemediation = `Proposed FAR (${proposedFar.toFixed(2)}) exceeds maximum cap (Base ${effectiveBaseFar.toFixed(2)} + max purchasable limit) or road width is under 12m. Reduce built-up area to max ${(effectiveBaseFar * plotArea).toFixed(0)} sqm.`;
    }

    items.push({
      id: 'far_audit',
      chapterRef: 'Chapter 3.2.2 & Chapter 9',
      ruleTitle: 'Floor Area Ratio (FAR) & Built-up Area',
      category: 'Building Bulk',
      status: farStatus,
      statutoryLimit: `Base FAR: ${baseFar.toFixed(2)} ${greenBonus > 0 ? `(+${(greenBonus * 100)}% Green Bonus)` : ''} = Permissible: ${maxPermissibleBaseBuiltUp.toFixed(1)} sqm`,
      proposedValue: `Proposed: ${proposedBuiltUpArea} sqm (FAR: ${proposedFar.toFixed(2)})`,
      mathExplanation: `${telescopicExplanation}. Max base area: ${plotArea} × ${effectiveBaseFar.toFixed(2)} = ${maxPermissibleBaseBuiltUp.toFixed(1)} sqm.`,
      remediation: farRemediation,
    });

    // 3. Setback Compliance (Chapter 3.2.4.1 & Chapter 3.2.4.9)
    let reqFront = 3.0;
    let reqRear = 1.5;
    let reqSide1 = 0.0;
    let reqSide2 = 0.0;

    if (buildingHeight > 15) {
      const hr = HIGH_RISE_SETBACKS.find(
        (h) => buildingHeight >= h.minHeight && buildingHeight <= h.maxHeight
      ) || HIGH_RISE_SETBACKS[HIGH_RISE_SETBACKS.length - 1];
      reqFront = hr.front;
      reqRear = hr.rear;
      reqSide1 = hr.side1;
      reqSide2 = hr.side2;
    } else if (occupancy === 'single_unit' || occupancy === 'multi_unit') {
      if (plotArea <= 150) {
        reqFront = 1.0;
        reqRear = 0.0;
        reqSide1 = 0.0;
        reqSide2 = 0.0;
      } else if (plotArea <= 300) {
        reqFront = 3.0;
        reqRear = 1.5;
        reqSide1 = 0.0;
        reqSide2 = 0.0;
      } else if (plotArea <= 500) {
        reqFront = 3.0;
        reqRear = 3.0;
        reqSide1 = 0.0;
        reqSide2 = 0.0;
      } else if (plotArea <= 1200) {
        reqFront = 4.5;
        reqRear = 4.5;
        reqSide1 = 1.5;
        reqSide2 = 0.0;
      } else {
        reqFront = 6.0;
        reqRear = 6.0;
        reqSide1 = 1.5;
        reqSide2 = 1.5;
      }
    } else if (occupancy === 'commercial') {
      if (plotArea <= 100) {
        reqFront = 1.5;
        reqRear = 0;
        reqSide1 = 0;
        reqSide2 = 0;
      } else if (plotArea <= 300) {
        reqFront = 3.0;
        reqRear = 0;
        reqSide1 = 0;
        reqSide2 = 0;
      } else if (plotArea <= 1000) {
        reqFront = 4.5;
        reqRear = 3.0;
        reqSide1 = 1.5;
        reqSide2 = 1.5;
      } else {
        reqFront = 6.0;
        reqRear = 3.0;
        reqSide1 = 3.0;
        reqSide2 = 3.0;
      }
    }

    if (isCornerPlot) {
      reqSide2 = Math.max(reqSide2, reqFront);
    }

    const frontOk = frontSetbackProvided >= reqFront;
    const rearOk = rearSetbackProvided >= reqRear;
    const side1Ok = side1Provided >= reqSide1;
    const side2Ok = side2Provided >= reqSide2;
    const allSetbacksOk = frontOk && rearOk && side1Ok && side2Ok;

    // Compounding check for setback: up to 10% encroachment compoundable under Ch 16
    const minFrontComp = reqFront * 0.9;
    const minRearComp = reqRear * 0.9;
    const isWithinCompounding =
      frontSetbackProvided >= minFrontComp &&
      rearSetbackProvided >= minRearComp &&
      side1Provided >= reqSide1 * 0.9 &&
      side2Provided >= reqSide2 * 0.9;

    let setbackStatus: 'compliant' | 'conditional' | 'non_compliant' = 'compliant';
    let setbackRemediation = undefined;

    if (allSetbacksOk) {
      setbackStatus = 'compliant';
    } else if (isWithinCompounding && buildingHeight <= 15) {
      setbackStatus = 'conditional';
      setbackRemediation = `Minor setback deficiency is within 10% permissible compounding limit (Chapter 16.3). Compounding fee payable under Rule 4.`;
    } else {
      setbackStatus = 'non_compliant';
      setbackRemediation = `Setback deficiency exceeds 10% limit or building height > 15m. Encroachments into mandatory high-rise fire setbacks are strictly non-compoundable! Adjust envelope.`;
    }

    items.push({
      id: 'setback_audit',
      chapterRef: buildingHeight > 15 ? 'Chapter 3.2.4.9 (High Rise)' : 'Chapter 3.2.4.1 (Table 3.2.1)',
      ruleTitle: 'Building Setbacks & Fire Separation Distances',
      category: 'Site Envelope',
      status: setbackStatus,
      statutoryLimit: `Req: Front ${reqFront}m | Rear ${reqRear}m | Side-1 ${reqSide1}m | Side-2 ${reqSide2}m ${isCornerPlot ? '(Corner Plot Note-2 applied)' : ''}`,
      proposedValue: `Provided: Front ${frontSetbackProvided}m | Rear ${rearSetbackProvided}m | Side-1 ${side1Provided}m | Side-2 ${side2Provided}m`,
      mathExplanation: `Front: ${frontSetbackProvided}m vs ${reqFront}m; Rear: ${rearSetbackProvided}m vs ${reqRear}m; Sides: ${side1Provided}m, ${side2Provided}m vs ${reqSide1}m, ${reqSide2}m.`,
      remediation: setbackRemediation,
    });

    // 4. Building Height & Means of Access (Chapter 3.1.1 & Chapter 3.2.4)
    let maxAllowedHeight = roadWidth * 1.5;
    let heightStatus: 'compliant' | 'conditional' | 'non_compliant' = 'compliant';
    let heightRemediation = undefined;

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
    let fireRemediation = undefined;

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
    let envRemediation = undefined;

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      generateAuditPdfReport(currentState, auditResults, logicalConflicts);
    } catch (err) {
      console.error('PDF generation error:', err);
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
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Cross-Rule Automated Compliance & Verification Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Solves complex interrelated dependencies across all 18 Chapters. Simultaneously cross-audits plot bulk, telescopic FAR, purchasable multipliers, progressive fire setbacks, parking ECS, EVCI, rainwater harvesting, and compounding limits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Persistence status indicator */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
            <Save className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Saved {lastSaved || 'just now'}</span>
          </div>

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
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
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

      {/* Preset Quick Loader */}
      <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
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
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      ({conflict.chapterRef})
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {conflict.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] pt-0.5">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
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
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Proposed Project Specifications</span>
            </h3>
            <span className="text-[10px] text-slate-400">Live Evaluation</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Occupancy */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Occupancy / Land Use Classification
              </label>
              <select
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

            {/* Plot Area & Road Width */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Plot Area (sqm)
                </label>
                <input
                  type="number"
                  value={plotArea}
                  onChange={(e) => setPlotArea(Math.max(10, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Abutting Road Width (m)
                </label>
                <input
                  type="number"
                  value={roadWidth}
                  onChange={(e) => setRoadWidth(Math.max(3, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Frontage & Height */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Plot Frontage (m)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={plotFrontage}
                  onChange={(e) => setPlotFrontage(Math.max(3, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Building Height (m)
                </label>
                <input
                  type="number"
                  value={buildingHeight}
                  onChange={(e) => setBuildingHeight(Math.max(3, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Total Built-up Area */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Total Built-up Area (sqm)
              </label>
              <input
                type="number"
                value={proposedBuiltUpArea}
                onChange={(e) => setProposedBuiltUpArea(Math.max(10, Number(e.target.value)))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Setbacks Provided */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                Setbacks Provided On-Site (Meters):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-0.5">Front Setback (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={frontSetbackProvided}
                    onChange={(e) => setFrontSetbackProvided(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-0.5">Rear Setback (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rearSetbackProvided}
                    onChange={(e) => setRearSetbackProvided(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-0.5">Side-1 (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={side1Provided}
                    onChange={(e) => setSide1Provided(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-0.5">Side-2 (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={side2Provided}
                    onChange={(e) => setSide2Provided(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Parking & Sustainable Features */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Parking Spaces Provided (ECS Bays)
                </label>
                <input
                  type="number"
                  value={parkingBaysProvided}
                  onChange={(e) => setParkingBaysProvided(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Green Rating Certification
                </label>
                <select
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
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Corner Plot (Side-2 setback = Front setback)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasStilt}
                    onChange={(e) => setHasStilt(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Stilt Floor Proposed (FAR Exempt)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasRWH}
                    onChange={(e) => setHasRWH(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Rainwater Harvesting Pit Proposed</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSolarHeating}
                    onChange={(e) => setHasSolarHeating(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
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
              <p className="text-xs text-slate-400">
                Cross-evaluated across {totalCount} regulatory checkpoints of UP Byelaws 2025.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono text-emerald-400">
                  {scorePercent}%
                </div>
                <div className="text-[10px] text-slate-400">Compliance Index</div>
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
                      {isOk && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                      {isConditional && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />}
                      {isFail && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />}

                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.ruleTitle}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
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
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Statutory Mandate:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{item.statutoryLimit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Plan Proposed:</span>
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
