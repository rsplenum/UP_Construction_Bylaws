import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Zap,
  HelpCircle,
  XCircle,
  Info,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  LineChart as LineChartIcon,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  PURCHASABLE_FAR_FACTORS,
  calculateTelescopicResidentialFAR,
  getGroupHousingFarRule,
  getCommercialComplexFarRule,
} from '../data/byelawsData';
import { useToast } from '../context/ToastContext';

export interface ValidationIssue {
  id: string;
  field: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  byelawClause: string;
}

export const ComplianceCalculators: React.FC = () => {
  const toast = useToast();
  const [activeCalc, setActiveCalc] = useState<'far' | 'pfar_fee' | 'parking' | 'compounding'>('far');
  const [sensitivityMode, setSensitivityMode] = useState<'road_width' | 'land_use' | 'plot_telescopic'>('road_width');

  // --- 1. FAR State ---
  const [occupancyType, setOccupancyType] = useState<'residential_plotted' | 'group_housing' | 'commercial' | 'tod'>('residential_plotted');
  const [plotArea, setPlotArea] = useState<number>(280);
  const [roadWidth, setRoadWidth] = useState<number>(12);
  const [areaCategory, setAreaCategory] = useState<'built_up' | 'non_built_up'>('built_up');
  const [greenRating, setGreenRating] = useState<'none' | 'silver' | 'gold' | 'platinum'>('none');

  // Telescopic Residential Plotted FAR calculation as per Chapter 3.2.2 & 3.2.2.1
  const calculatedPlottedFar = useMemo(() => {
    return calculateTelescopicResidentialFAR(plotArea);
  }, [plotArea]);

  // Group Housing FAR based on statutory 2025 matrix (Section 3.2.2.2 & 4.2.8)
  const groupHousingRule = useMemo(() => {
    return getGroupHousingFarRule(roadWidth);
  }, [roadWidth]);

  const groupHousingFar = useMemo(() => {
    const isBuiltUp = areaCategory === 'built_up';
    const baseFar = isBuiltUp ? groupHousingRule.builtUpBaseFar : groupHousingRule.nonBuiltUpBaseFar;
    const pfar = isBuiltUp ? groupHousingRule.builtUpPurchasableFar : groupHousingRule.nonBuiltUpPurchasableFar;
    const maxFar = isBuiltUp ? groupHousingRule.builtUpMaxFar : groupHousingRule.nonBuiltUpMaxFar;
    const ppfar = isBuiltUp ? Number((pfar * 1.0).toFixed(2)) : Number((pfar * 1.0).toFixed(2));

    let greenBonusPercent = 0;
    if (greenRating === 'silver') greenBonusPercent = 3;
    if (greenRating === 'gold') greenBonusPercent = 5;
    if (greenRating === 'platinum') greenBonusPercent = 7;

    return {
      baseFar,
      pfar,
      ppfar,
      maxFar: maxFar >= 999 ? 'Unrestricted (UR)' : maxFar,
      greenBonusPercent,
      rule: groupHousingRule,
    };
  }, [groupHousingRule, areaCategory, greenRating]);

  // Commercial Complex FAR based on Section 5.2.5
  const commercialRule = useMemo(() => {
    return getCommercialComplexFarRule(roadWidth);
  }, [roadWidth]);

  // --- Real-Time Validation Engine for FAR & Building Parameters ---
  const farValidationIssues = useMemo<ValidationIssue[]>(() => {
    const issues: ValidationIssue[] = [];
    const area = Number(plotArea) || 0;
    const road = Number(roadWidth) || 0;
    const isBuiltUp = areaCategory === 'built_up';

    if (area <= 0) {
      issues.push({
        id: 'far-zero-area',
        field: 'plotArea',
        severity: 'error',
        title: 'Invalid Plot Area',
        message: 'Plot area must be greater than 0 sqm to calculate building coverage and FAR.',
        byelawClause: 'General Byelaws Mandate',
      });
      return issues;
    }

    if (occupancyType === 'residential_plotted') {
      if (area < 30) {
        issues.push({
          id: 'plot-too-small',
          field: 'plotArea',
          severity: 'error',
          title: 'Plot Below Minimum Threshold',
          message: 'Plot area below 30 sqm is not permissible for standard plotted sanction under 2025 byelaws. Minimum 30 sqm required.',
          byelawClause: 'Section 2.1.2 & Section 3.2.1',
        });
      } else if (area <= 100) {
        issues.push({
          id: 'plot-self-cert',
          field: 'plotArea',
          severity: 'info',
          title: 'Eligible for Fast-Track Self-Certification',
          message: 'Plots up to 100 sqm require no standard building permission fee (token Re. 1 online fee) with registered architect/engineer affidavit.',
          byelawClause: 'Section 2.1.2 (Self-Certification Scheme)',
        });
      }

      if (area > 1200) {
        issues.push({
          id: 'plot-large-setbacks',
          field: 'plotArea',
          severity: 'warning',
          title: 'Mandatory 6.0m Peripheral Setbacks',
          message: 'Residential plots exceeding 1,200 sqm require all-round 6.0m setbacks (front, rear, and sides) and layout scheme approval.',
          byelawClause: 'Section 3.2.4.1 (Plotted Setbacks)',
        });
      }

      if (isBuiltUp && road < 6) {
        issues.push({
          id: 'road-too-narrow-bu',
          field: 'roadWidth',
          severity: 'error',
          title: 'Abutting Road Substandard (<6.0m)',
          message: 'In built-up areas, minimum access road width for residential plots is 6.0m (Section 3.1.1.1). Building sanction is barred on narrower lanes.',
          byelawClause: 'Section 3.1.1.1',
        });
      } else if (!isBuiltUp && road < 9) {
        issues.push({
          id: 'road-too-narrow-nbu',
          field: 'roadWidth',
          severity: 'error',
          title: 'Abutting Road Substandard (<9.0m)',
          message: 'In non-built-up plotted developments, access road must be at least 9.0m (7.5m allowed only if single-sided plots).',
          byelawClause: 'Section 3.1.1.2',
        });
      }
    } else if (occupancyType === 'group_housing') {
      const minPlot = isBuiltUp ? 1000 : 1500;
      if (area < minPlot) {
        issues.push({
          id: 'gh-min-plot-violation',
          field: 'plotArea',
          severity: 'error',
          title: 'Group Housing Minimum Area Violation',
          message: `Group Housing requires minimum plot area of ${minPlot.toLocaleString()} sqm in ${isBuiltUp ? 'Built-up' : 'Non-built-up'} areas. Current plot: ${area} sqm.`,
          byelawClause: 'Section 3.2.2.2 & Section 4.2.8',
        });
      }

      const minRoad = isBuiltUp ? 9 : 12;
      if (road < minRoad) {
        issues.push({
          id: 'gh-min-road-violation',
          field: 'roadWidth',
          severity: 'error',
          title: 'Prohibited on Substandard Road',
          message: `Group Housing strictly prohibited on roads narrower than ${minRoad}m in ${isBuiltUp ? 'built-up' : 'non-built-up'} areas. Current road: ${road}m.`,
          byelawClause: 'Section 3.2.2.2 (Table 3.2)',
        });
      }

      issues.push({
        id: 'gh-ews-lig-quota',
        field: 'occupancy',
        severity: 'info',
        title: 'Mandatory Social Housing Quota',
        message: 'Under Chapter 4.2.1, 10% EWS and 10% LIG dwelling units are mandatory in all group housing schemes.',
        byelawClause: 'Section 4.2.1',
      });
    } else if (occupancyType === 'commercial') {
      if (road < 9) {
        issues.push({
          id: 'comm-road-min',
          field: 'roadWidth',
          severity: 'error',
          title: 'Commercial Road Width Violation',
          message: 'Commercial buildings require a minimum 9.0m abutting road width (12.0m for plots exceeding 300 sqm).',
          byelawClause: 'Section 5.2.5',
        });
      }

      if (area >= 3000 && road < 18) {
        issues.push({
          id: 'mall-road-min',
          field: 'roadWidth',
          severity: 'error',
          title: 'Shopping Mall / Multiplex Road Requirement',
          message: 'Plots >= 3,000 sqm designated for Shopping Malls strictly require minimum 18.0m abutting road width.',
          byelawClause: 'Section 5.2.5 (Mall Norms)',
        });
      }
    } else if (occupancyType === 'tod') {
      if (road < 12) {
        issues.push({
          id: 'tod-road-min',
          field: 'roadWidth',
          severity: 'error',
          title: 'TOD Minimum Right-of-Way Violation',
          message: 'Transit-Oriented Development FAR bonuses apply exclusively along corridors with minimum 12.0m right of way.',
          byelawClause: 'Chapter 8.2.2',
        });
      }
    }

    // If no critical errors, mark compliance as validated
    const hasCriticalError = issues.some((i) => i.severity === 'error');
    if (!hasCriticalError && area > 0) {
      issues.unshift({
        id: 'statutory-pass',
        field: 'general',
        severity: 'success',
        title: 'Statutory 2025 Baseline Compliant',
        message: 'All parameters satisfy statutory Uttar Pradesh 2025 Byelaw baseline criteria. Building plans are permissible for submission.',
        byelawClause: 'Statutory Compliance Verified',
      });
    }

    return issues;
  }, [plotArea, roadWidth, occupancyType, areaCategory]);

  const hasPlotAreaError = farValidationIssues.some((i) => i.field === 'plotArea' && i.severity === 'error');
  const hasRoadWidthError = farValidationIssues.some((i) => i.field === 'roadWidth' && i.severity === 'error');

  // Active toast notifications for validation errors
  const prevErrorsRef = useRef<string[]>([]);
  useEffect(() => {
    const currentErrorIds = farValidationIssues.filter((i) => i.severity === 'error').map((i) => i.id);
    const newErrors = currentErrorIds.filter((id) => !prevErrorsRef.current.includes(id));
    if (newErrors.length > 0) {
      const issue = farValidationIssues.find((i) => i.id === newErrors[0]);
      if (issue) {
        toast.error(issue.title, `${issue.message} (${issue.byelawClause})`);
      }
    }
    prevErrorsRef.current = currentErrorIds;
  }, [farValidationIssues, toast]);

  // Sensitivity Analysis Datasets (Road Width vs FAR, Land Use Comparison, Plot Area Curve)
  const roadWidthSensitivityData = useMemo(() => {
    const widths = [6, 9, 12, 18, 24, 30, 45, 60];
    const isBuiltUp = areaCategory === 'built_up';

    return widths.map((w) => {
      const ghRule = getGroupHousingFarRule(w);
      const commRule = getCommercialComplexFarRule(w);
      const ghMax = isBuiltUp ? ghRule.builtUpMaxFar : ghRule.nonBuiltUpMaxFar;
      const ghVal = ghMax >= 999 ? 6.0 : ghMax;
      const commVal = commRule.maxFar >= 999 ? 5.5 : commRule.maxFar;
      const plottedVal = Math.min(2.0, calculatedPlottedFar.effectiveBaseFAR + calculatedPlottedFar.purchasableFARCap);
      const todVal = w < 12 ? 1.5 : w < 24 ? 2.5 : w < 45 ? 3.5 : 5.0;

      return {
        roadWidthM: w,
        roadLabel: w >= 60 ? '>45m' : `${w}m`,
        plottedFAR: Number(plottedVal.toFixed(2)),
        groupHousingFAR: Number(ghVal.toFixed(2)),
        commercialFAR: Number(commVal.toFixed(2)),
        todFAR: Number(todVal.toFixed(2)),
      };
    });
  }, [areaCategory, calculatedPlottedFar]);

  const landUseSensitivityData = useMemo(() => {
    const isBuiltUp = areaCategory === 'built_up';
    const ghMax = isBuiltUp ? groupHousingRule.builtUpMaxFar : groupHousingRule.nonBuiltUpMaxFar;
    const commTotal = commercialRule.maxFar >= 999 ? 5.5 : commercialRule.maxFar;
    const plottedBase = calculatedPlottedFar.effectiveBaseFAR;
    const plottedPfar = calculatedPlottedFar.purchasableFARCap;
    const plottedTotal = Math.min(2.0, plottedBase + plottedPfar);

    return [
      {
        landUse: 'Plotted Residential',
        baseFAR: Number(plottedBase.toFixed(2)),
        purchasableFAR: Number(plottedPfar.toFixed(2)),
        totalFAR: Number(plottedTotal.toFixed(2)),
        statutoryCap: '2.00 Max',
        active: occupancyType === 'residential_plotted',
      },
      {
        landUse: 'Group Housing (Built-up)',
        baseFAR: Number(groupHousingRule.builtUpBaseFar.toFixed(2)),
        purchasableFAR: Number(groupHousingRule.builtUpPurchasableFar.toFixed(2)),
        totalFAR: Number((groupHousingRule.builtUpMaxFar >= 999 ? 6.0 : groupHousingRule.builtUpMaxFar).toFixed(2)),
        statutoryCap: groupHousingRule.builtUpMaxFar >= 999 ? 'Unrestricted' : `${groupHousingRule.builtUpMaxFar} Max`,
        active: occupancyType === 'group_housing' && isBuiltUp,
      },
      {
        landUse: 'Group Housing (New/NBU)',
        baseFAR: Number(groupHousingRule.nonBuiltUpBaseFar.toFixed(2)),
        purchasableFAR: Number(groupHousingRule.nonBuiltUpPurchasableFar.toFixed(2)),
        totalFAR: Number((groupHousingRule.nonBuiltUpMaxFar >= 999 ? 6.0 : groupHousingRule.nonBuiltUpMaxFar).toFixed(2)),
        statutoryCap: groupHousingRule.nonBuiltUpMaxFar >= 999 ? 'Unrestricted' : `${groupHousingRule.nonBuiltUpMaxFar} Max`,
        active: occupancyType === 'group_housing' && !isBuiltUp,
      },
      {
        landUse: 'Commercial Complex',
        baseFAR: Number(commercialRule.baseFar.toFixed(2)),
        purchasableFAR: Number(commercialRule.purchasableFar.toFixed(2)),
        totalFAR: Number(commTotal.toFixed(2)),
        statutoryCap: commercialRule.maxFar >= 999 ? 'Unrestricted' : `${commercialRule.maxFar} Max`,
        active: occupancyType === 'commercial',
      },
      {
        landUse: 'TOD Zone Corridor',
        baseFAR: Number((roadWidth < 12 ? 1.5 : roadWidth < 24 ? 2.5 : 3.5).toFixed(2)),
        purchasableFAR: Number((roadWidth < 12 ? 0.5 : roadWidth < 24 ? 1.0 : 1.5).toFixed(2)),
        totalFAR: Number((roadWidth < 12 ? 2.0 : roadWidth < 24 ? 3.5 : roadWidth < 45 ? 5.0 : 6.0).toFixed(2)),
        statutoryCap: roadWidth >= 45 ? 'Unrestricted' : 'Enhanced Multiplier',
        active: occupancyType === 'tod',
      },
    ];
  }, [groupHousingRule, commercialRule, calculatedPlottedFar, occupancyType, areaCategory, roadWidth]);

  const plotAreaTelescopicData = useMemo(() => {
    const areas = [50, 100, 150, 200, 300, 450, 600, 800, 1000];
    return areas.map((a) => {
      const calc = calculateTelescopicResidentialFAR(a);
      return {
        plotAreaSqm: a,
        label: `${a} m²`,
        effectiveBaseFAR: Number(calc.effectiveBaseFAR.toFixed(2)),
        purchasableFAR: Number(calc.purchasableFARCap.toFixed(2)),
        totalFAR: 2.00,
        isCurrent: Math.abs(a - plotArea) < 50,
      };
    });
  }, [plotArea]);

  // --- 2. Purchasable FAR Fee State ---
  const [feePlotArea, setFeePlotArea] = useState<number>(2000);
  const [feeBaseFar, setFeeBaseFar] = useState<number>(2.5);
  const [feePfarVal, setFeePfarVal] = useState<number>(2.5);
  const [feePpfarVal, setFeePpfarVal] = useState<number>(3.0);
  const [circleRate, setCircleRate] = useState<number>(35000);
  const [factorCat, setFactorCat] = useState<string>("Residential (Group Housing)");

  const pfarFeeResult = useMemo(() => {
    const selectedFactor = PURCHASABLE_FAR_FACTORS.find((f) => f.category === factorCat) || PURCHASABLE_FAR_FACTORS[5];
    const baseFar = Math.max(0.1, feeBaseFar);

    // Purchasable FAR calculation: C = Le * Rc * P
    // FP_pfar = feePlotArea * feePfarVal
    const fpPfar = feePlotArea * feePfarVal;
    const lePfar = fpPfar / baseFar;
    const chargePfar = lePfar * circleRate * selectedFactor.pfar;

    // Premium Purchasable FAR calculation
    const fpPpfar = feePlotArea * feePpfarVal;
    const lePpfar = fpPpfar / baseFar;
    const chargePpfar = lePpfar * circleRate * selectedFactor.ppfar;

    const totalCharge = chargePfar + chargePpfar;

    return {
      fpPfar,
      lePfar,
      chargePfar,
      fpPpfar,
      lePpfar,
      chargePpfar,
      totalCharge,
      factorPfar: selectedFactor.pfar,
      factorPpfar: selectedFactor.ppfar,
    };
  }, [feePlotArea, feeBaseFar, feePfarVal, feePpfarVal, circleRate, factorCat]);

  // --- 3. Parking & EVCI State ---
  const [parkingOccupancy, setParkingOccupancy] = useState<'residential_units' | 'commercial_floor' | 'mall' | 'hospital' | 'school'>('residential_units');
  const [unitsSmall, setUnitsSmall] = useState<number>(20); // <=50 sqm
  const [unitsMedium, setUnitsMedium] = useState<number>(40); // 50-100 sqm
  const [unitsLarge, setUnitsLarge] = useState<number>(30); // 100-150 sqm
  const [unitsXLarge, setUnitsXLarge] = useState<number>(10); // >150 sqm
  const [commercialFloorArea, setCommercialFloorArea] = useState<number>(1500);
  const [hospitalBeds, setHospitalBeds] = useState<number>(120);
  const [hospitalFloorArea, setHospitalFloorArea] = useState<number>(4000);
  const [schoolStudents, setSchoolStudents] = useState<number>(600);
  const [schoolBuiltUp, setSchoolBuiltUp] = useState<number>(2500);

  const parkingResult = useMemo(() => {
    let totalEcs = 0;
    let visitorEcs = 0;
    let extraNotes: string[] = [];

    if (parkingOccupancy === 'residential_units') {
      // Group housing: <=50 sqm (2.0 sqm/DU), 50-100 (1.00 ECS), 100-150 (1.25 ECS), >150 (1.50 ECS)
      const ecsFromSmall = (unitsSmall * 2.0) / 23.0; // converting sqm to open ECS equivalent
      const ecsFromMed = unitsMedium * 1.0;
      const ecsFromLarge = unitsLarge * 1.25;
      const ecsFromXLarge = unitsXLarge * 1.5;
      totalEcs = ecsFromSmall + ecsFromMed + ecsFromLarge + ecsFromXLarge;
      visitorEcs = totalEcs * 0.10; // 10% mandatory visitor parking (Chapter 3.3.4.3)
      extraNotes.push("Includes 10% mandatory visitor parking in Group Housing.");
    } else if (parkingOccupancy === 'commercial_floor') {
      // 2 ECS per 100 sqm of floor area
      totalEcs = (commercialFloorArea / 100) * 2;
      extraNotes.push("Commercial complexes require 2.0 ECS per 100 sqm of floor area.");
    } else if (parkingOccupancy === 'mall') {
      // 3 ECS per 100 sqm
      totalEcs = (commercialFloorArea / 100) * 3;
      extraNotes.push("Shopping malls require 3.0 ECS per 100 sqm of floor area.");
    } else if (parkingOccupancy === 'hospital') {
      // 1.5 ECS per 125 sqm + ambulance
      totalEcs = (hospitalFloorArea / 125) * 1.5;
      const ambulances = 1 + Math.max(0, Math.floor((hospitalBeds - 50) / 50));
      extraNotes.push(`${ambulances} dedicated Ambulance bay(s) (10m x 5m each, or 2 ECS open parking) required.`);
    } else if (parkingOccupancy === 'school') {
      totalEcs = (schoolBuiltUp / 125) * 1.0;
      const busBays = Math.ceil(schoolStudents / 120);
      extraNotes.push(`${busBays} dedicated Bus parking bay(s) (10m x 5m each) required for ${schoolStudents} students.`);
    }

    const finalEcs = Math.ceil(totalEcs + visitorEcs);
    // EV requirements (Chapter 17): 20% of parking capacity
    const evCapacity = Math.ceil(finalEcs * 0.20);
    // 4Ws charger ratios: 1 slow charger for every 3 EVs, 1 fast charger for every 10 EVs
    const slowChargers = Math.ceil(evCapacity / 3);
    const fastChargers = Math.ceil(evCapacity / 10);
    // Power safety factor 1.25
    const estimatedLoadKw = Math.ceil((slowChargers * 7.4 + fastChargers * 50) * 1.25);

    return {
      finalEcs,
      visitorEcs: Math.ceil(visitorEcs),
      evCapacity,
      slowChargers,
      fastChargers,
      estimatedLoadKw,
      extraNotes,
    };
  }, [
    parkingOccupancy,
    unitsSmall,
    unitsMedium,
    unitsLarge,
    unitsXLarge,
    commercialFloorArea,
    hospitalBeds,
    hospitalFloorArea,
    schoolStudents,
    schoolBuiltUp,
  ]);

  // --- 4. Compounding Fee State ---
  const [compUse, setCompUse] = useState<'residential' | 'commercial' | 'office'>('residential');
  const [compPlotArea, setCompPlotArea] = useState<number>(300);
  const [compLandPrice, setCompLandPrice] = useState<number>(25000);
  const [frontEncroachSqm, setFrontEncroachSqm] = useState<number>(5);
  const [sideEncroachSqm, setSideEncroachSqm] = useState<number>(0);
  const [rearEncroachSqm, setRearEncroachSqm] = useState<number>(0);
  const [excessFarSqm, setExcessFarSqm] = useState<number>(15);
  const [heightDeviationMeters, setHeightDeviationMeters] = useState<number>(0);
  const [isIllegalColony, setIsIllegalColony] = useState<boolean>(false);
  const [isPublicLand, setIsPublicLand] = useState<boolean>(false);
  const [hasFireNocIssue, setHasFireNocIssue] = useState<boolean>(false);

  const compoundingResult = useMemo(() => {
    // Check non-compoundable clauses (Chapter 16.3.2)
    const nonCompoundableReasons: string[] = [];
    if (isIllegalColony) nonCompoundableReasons.push("Construction done on plots in illegal colonies (Clause 16.3.2 iii)");
    if (isPublicLand) nonCompoundableReasons.push("Construction done on government/public land or road/park reserves (Clause 16.3.2 i, iv)");
    if (hasFireNocIssue) nonCompoundableReasons.push("Missing mandatory Fire No Objection Certificate (Clause 16.3.2 vii)");

    if (nonCompoundableReasons.length > 0) {
      return {
        isEligible: false,
        reasons: nonCompoundableReasons,
        totalFee: 0,
        breakdown: [],
      };
    }

    const breakdown: { item: string; amount: number; basis: string }[] = [];

    // Schedule 2a: Front setback
    // Residential: 100% of price of land; Commercial: 200%; Office: 150%
    if (frontEncroachSqm > 0) {
      const multiplier = compUse === 'commercial' ? 2.0 : compUse === 'office' ? 1.5 : 1.0;
      const amt = frontEncroachSqm * compLandPrice * multiplier;
      breakdown.push({
        item: `Front Setback Encroachment (${frontEncroachSqm} sqm)`,
        amount: amt,
        basis: `${multiplier * 100}% of Land Price (Rs. ${compLandPrice}/sqm)`,
      });
    }

    // Schedule 2b: Side setback
    // Residential: 75%; Commercial: 150%; Office: 100%
    if (sideEncroachSqm > 0) {
      const multiplier = compUse === 'commercial' ? 1.5 : compUse === 'office' ? 1.0 : 0.75;
      const amt = sideEncroachSqm * compLandPrice * multiplier;
      breakdown.push({
        item: `Side Setback Encroachment (${sideEncroachSqm} sqm)`,
        amount: amt,
        basis: `${multiplier * 100}% of Land Price`,
      });
    }

    // Schedule 2c: Rear setback
    // Residential: 50%; Commercial: 100%; Office: 75%
    if (rearEncroachSqm > 0) {
      const multiplier = compUse === 'commercial' ? 1.0 : compUse === 'office' ? 0.75 : 0.5;
      const amt = rearEncroachSqm * compLandPrice * multiplier;
      breakdown.push({
        item: `Rear Setback Encroachment (${rearEncroachSqm} sqm)`,
        amount: amt,
        basis: `${multiplier * 100}% of Land Price`,
      });
    }

    // Schedule 3: Excess FAR (within permissible ground coverage)
    // Residential: Rs. 491/sqm + 50% required land price
    // Commercial: Rs. 982/sqm + 100% required land price
    // Office: Rs. 736/sqm + 75% required land price
    if (excessFarSqm > 0) {
      let flatRate = 491;
      let landFraction = 0.50;
      if (compUse === 'commercial') {
        flatRate = 982;
        landFraction = 1.00;
      } else if (compUse === 'office') {
        flatRate = 736;
        landFraction = 0.75;
      }
      const amt = excessFarSqm * flatRate + (excessFarSqm * compLandPrice * landFraction);
      breakdown.push({
        item: `Excess FAR Construction (${excessFarSqm} sqm)`,
        amount: amt,
        basis: `Rs. ${flatRate}/sqm + ${landFraction * 100}% Land Price`,
      });
    }

    // Schedule 10: Height deviation (Rs. 6132/running meter for residential; 2x commercial; 1.5x office)
    if (heightDeviationMeters > 0) {
      let rate = 6132;
      if (compUse === 'commercial') rate = 6132 * 2;
      if (compUse === 'office') rate = 6132 * 1.5;
      const amt = heightDeviationMeters * rate;
      breakdown.push({
        item: `Height Deviation (${heightDeviationMeters} m)`,
        amount: amt,
        basis: `Rs. ${rate}/running meter`,
      });
    }

    const totalFee = breakdown.reduce((sum, b) => sum + b.amount, 0);

    return {
      isEligible: true,
      reasons: [],
      totalFee,
      breakdown,
    };
  }, [
    compUse,
    compLandPrice,
    frontEncroachSqm,
    sideEncroachSqm,
    rearEncroachSqm,
    excessFarSqm,
    heightDeviationMeters,
    isIllegalColony,
    isPublicLand,
    hasFireNocIssue,
  ]);

  return (
    <div className="space-y-6">
      {/* Calculator Mode Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-2 dark:bg-[#161617] dark:border-white/[0.10]">
        {[
          { id: 'far', label: '1. FAR & Ground Coverage', icon: Calculator },
          { id: 'pfar_fee', label: '2. Purchasable FAR Fee (Ch. 9)', icon: TrendingUp },
          { id: 'parking', label: '3. Parking & EVCI Requirements', icon: Zap },
          { id: 'compounding', label: '4. Compounding Fee & Eligibility (Ch. 16)', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCalc === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCalc(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.12]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CALC 1: FAR & GROUND COVERAGE */}
      {activeCalc === 'far' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 dark:text-white">
              Plot & Occupancy Parameters
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Occupancy Category
              </label>
              <select
                value={occupancyType}
                onChange={(e) => setOccupancyType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 dark:bg-white/[0.04] dark:border-white/[0.14] dark:text-slate-100"
              >
                <option value="residential_plotted">Residential - Plotted (Single / Multi-unit)</option>
                <option value="group_housing">Residential - Group Housing</option>
                <option value="commercial">Commercial Buildings / Malls</option>
                <option value="tod">Transit-Oriented Development (TOD Zone)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Plot Area (sq.m.)
                </label>
                {hasPlotAreaError && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1 dark:bg-rose-950/40 dark:border-rose-500/30">
                    <XCircle className="w-3 h-3" />
                    <span>Non-compliant</span>
                  </span>
                )}
              </div>
              <input
                type="number"
                min="10"
                value={plotArea}
                onChange={(e) => setPlotArea(Number(e.target.value))}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none transition-colors dark:bg-white/[0.04] dark:text-slate-100 ${
                  hasPlotAreaError
                    ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                    : 'border-slate-300 focus:border-emerald-500 dark:border-white/[0.14]'
                }`}
              />
              <span className="text-[11px] text-slate-500 block mt-1 dark:text-slate-400">
                Example: 280 sqm (Clause 3.2.2 telescopic standard).
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Abutting Road Width (meters)
                </label>
                {hasRoadWidthError && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1 dark:bg-rose-950/40 dark:border-rose-500/30">
                    <XCircle className="w-3 h-3" />
                    <span>Width Barred</span>
                  </span>
                )}
              </div>
              <select
                value={roadWidth}
                onChange={(e) => setRoadWidth(Number(e.target.value))}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none transition-colors dark:bg-white/[0.04] dark:text-slate-100 ${
                  hasRoadWidthError
                    ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                    : 'border-slate-300 focus:border-emerald-500 dark:border-white/[0.14]'
                }`}
              >
                <option value={4}>4 meters (Substandard lane / Built-up lane)</option>
                <option value={6}>6 meters (Minimum plotted residential in Built-up)</option>
                <option value={9}>9 meters (Minimum plotted in Non-built-up / Clinic)</option>
                <option value={12}>12 meters (Group Housing min / Commercial corridor)</option>
                <option value={18}>18 meters (Major sector road / Shopping Mall min)</option>
                <option value={24}>24 meters (Arterial corridor / Mixed-use highway)</option>
                <option value={30}>30 meters (Major city corridor)</option>
                <option value={45}>45 meters (Expressway link / High-density zone)</option>
                <option value={60}>&gt; 45 meters (Expressway corridor / Unrestricted FAR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Location Area Scheme
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAreaCategory('built_up')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    areaCategory === 'built_up'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-white/[0.14] dark:text-slate-400 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  Built-up Area
                </button>
                <button
                  type="button"
                  onClick={() => setAreaCategory('non_built_up')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    areaCategory === 'non_built_up'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-white/[0.14] dark:text-slate-400 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  Non-Built-up Area
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Green Building Certification (Chapter 9.3)
              </label>
              <select
                value={greenRating}
                onChange={(e) => setGreenRating(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 dark:bg-white/[0.04] dark:border-white/[0.14] dark:text-slate-100"
              >
                <option value="none">None (Standard)</option>
                <option value="silver">GRIHA 3-Star / IGBC Silver / LEED Silver (+3% Free FAR)</option>
                <option value="gold">GRIHA 4-Star / IGBC Gold / LEED Gold (+5% Free FAR)</option>
                <option value="platinum">GRIHA 5-Star / IGBC Platinum / LEED Platinum (+7% Free FAR)</option>
              </select>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7 space-y-4">
            {/* Real-time Validation Banner Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 dark:bg-[#161617] dark:border-white/[0.10]">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    2025 Statutory Validation & Rule Engine
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    farValidationIssues.some((i) => i.severity === 'error')
                      ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:text-rose-300 dark:border-rose-500/30'
                      : farValidationIssues.some((i) => i.severity === 'warning')
                      ? 'bg-amber-100 text-amber-900 border border-amber-200 dark:text-amber-200 dark:border-amber-500/30'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200 dark:text-emerald-200 dark:border-emerald-500/30'
                  }`}
                >
                  {farValidationIssues.some((i) => i.severity === 'error')
                    ? 'Compliance Issues Found'
                    : 'Statutory Criteria Satisfied'}
                </span>
              </div>

              <div className="space-y-2">
                {farValidationIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                      issue.severity === 'error'
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900 dark:border-rose-500/30 dark:text-rose-200'
                        : issue.severity === 'warning'
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900 dark:border-amber-500/30 dark:text-amber-200'
                        : issue.severity === 'info'
                        ? 'bg-sky-50/80 border-sky-200 text-sky-900'
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:border-emerald-500/30 dark:text-emerald-200'
                    }`}
                  >
                    {issue.severity === 'error' && (
                      <XCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                    )}
                    {issue.severity === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    )}
                    {issue.severity === 'info' && (
                      <Info className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                    )}
                    {issue.severity === 'success' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 font-bold">
                        <span>{issue.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/70 border border-current/20">
                          {issue.byelawClause}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed opacity-95">
                        {issue.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculated Permissible FAR & Built-up Capacity */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 dark:bg-[#161617] dark:border-white/[0.10]">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2 dark:text-white">
                Calculated Permissible FAR & Built-up Capacity
              </h3>

              {occupancyType === 'residential_plotted' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center dark:bg-emerald-950/40 dark:border-emerald-500/30">
                      <span className="text-xs text-emerald-800 font-medium dark:text-emerald-300">Effective Base FAR</span>
                      <div className="text-xl font-bold text-emerald-950 mt-0.5">
                        {calculatedPlottedFar.effectiveBaseFAR.toFixed(3)}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center dark:bg-white/[0.04] dark:border-white/[0.10]">
                      <span className="text-xs text-slate-600 font-medium dark:text-slate-400">Base Floor Area</span>
                      <div className="text-xl font-bold text-slate-900 mt-0.5 dark:text-white">
                        {calculatedPlottedFar.totalBaseBuiltUpArea.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">sqm</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center col-span-2 sm:col-span-1 dark:bg-blue-950/40 dark:border-blue-500/30">
                      <span className="text-xs text-blue-800 font-medium dark:text-blue-300">Max FAR (with PFAR)</span>
                      <div className="text-xl font-bold text-blue-950 mt-0.5">
                        {calculatedPlottedFar.maxPermissibleFAR.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 dark:bg-white/[0.04] dark:border-white/[0.10]">
                    <span className="text-xs font-bold text-slate-800 block dark:text-slate-100">
                      Telescopic Slab Calculation Breakdown (Section 3.2.2 & 3.2.2.1):
                    </span>
                    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {calculatedPlottedFar.slabs.map((st) => (
                        <div key={st.slabIndex} className="flex justify-between py-1 border-b border-slate-200/60 last:border-0">
                          <span>
                            {st.slabRange} ({st.slabPlotArea.toFixed(1)} sqm × {st.slabBaseFAR.toFixed(2)}):
                          </span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">
                            {st.slabBuiltUpArea.toFixed(1)} sqm
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 font-bold text-emerald-900 border-t border-slate-300 dark:text-emerald-200 dark:border-white/[0.14]">
                        <span>Total Allowable Base Floor Area:</span>
                        <span className="font-mono">{calculatedPlottedFar.totalBaseBuiltUpArea.toFixed(1)} sqm</span>
                      </div>
                      <div className="flex justify-between pt-1 text-blue-900 font-medium dark:text-blue-200">
                        <span>Purchasable FAR Balance Available:</span>
                        <span className="font-mono">+{calculatedPlottedFar.purchasableAreaAvailable.toFixed(1)} sqm (FAR +{calculatedPlottedFar.purchasableFARCap.toFixed(3)})</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50/70 p-3 rounded-lg border border-slate-200 dark:text-slate-400 dark:border-white/[0.10]">
                    <p>
                      <strong>Prescribed Setbacks (Section 3.2.4.1):</strong> Front {plotArea <= 150 ? '1.0m' : plotArea <= 300 ? '3.0m' : plotArea <= 500 ? '4.5m' : '6.0m'}, Rear {plotArea <= 150 ? '0m' : plotArea <= 300 ? '1.5m' : '3.0m'}.
                    </p>
                    <p>
                      <strong>Purchasable FAR Ceiling:</strong> Up to 2.0 total FAR permissible regardless of road width (Chapter 9.2.3 Note-3).
                    </p>
                  </div>
                </div>
              ) : occupancyType === 'group_housing' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg dark:bg-white/[0.04] dark:border-white/[0.10]">
                      <span className="text-xs text-slate-500 font-medium dark:text-slate-400">Base FAR</span>
                      <div className="text-xl font-bold text-slate-900 mt-0.5 dark:text-white">{groupHousingFar.baseFar}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950/40 dark:border-emerald-500/30">
                      <span className="text-xs text-emerald-700 font-medium dark:text-emerald-300">Purchasable FAR</span>
                      <div className="text-xl font-bold text-emerald-900 mt-0.5 dark:text-emerald-200">+{groupHousingFar.pfar}</div>
                    </div>
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg dark:bg-indigo-950/40">
                      <span className="text-xs text-indigo-700 font-medium">Premium PFAR</span>
                      <div className="text-xl font-bold text-indigo-900 mt-0.5">+{groupHousingFar.ppfar}</div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/40 dark:border-blue-500/30">
                      <span className="text-xs text-blue-700 font-medium dark:text-blue-300">Max FAR (MFAR)</span>
                      <div className="text-xl font-bold text-blue-900 mt-0.5 dark:text-blue-200">{groupHousingFar.maxFar}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 dark:bg-white/[0.04] dark:border-white/[0.10]">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Statutory Matrix Bracket:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{groupHousingFar.rule.roadWidthRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Base Covered Floor Area:</span>
                      <span className="font-bold text-slate-900 font-mono dark:text-white">{(plotArea * groupHousingFar.baseFar).toFixed(1)} sqm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Potential Max Floor Area (at MFAR):</span>
                      <span className="font-bold text-emerald-800 font-mono dark:text-emerald-300">
                        {typeof groupHousingFar.maxFar === 'number'
                          ? (plotArea * groupHousingFar.maxFar).toFixed(1) + ' sqm'
                          : 'Unrestricted (Subject to Setbacks & Height)'}
                      </span>
                    </div>
                    {groupHousingFar.greenBonusPercent > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t dark:text-emerald-300">
                        <span>Green Incentive ({groupHousingFar.greenBonusPercent}% free):</span>
                        <span>+{((plotArea * groupHousingFar.baseFar * groupHousingFar.greenBonusPercent) / 100).toFixed(1)} sqm</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : occupancyType === 'commercial' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg dark:bg-white/[0.04] dark:border-white/[0.10]">
                      <span className="text-xs text-slate-500 font-medium dark:text-slate-400">Commercial Base FAR</span>
                      <div className="text-xl font-bold text-slate-900 mt-0.5 dark:text-white">{commercialRule.baseFar}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950/40 dark:border-emerald-500/30">
                      <span className="text-xs text-emerald-700 font-medium dark:text-emerald-300">Purchasable FAR</span>
                      <div className="text-xl font-bold text-emerald-900 mt-0.5 dark:text-emerald-200">+{commercialRule.purchasableFar}</div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg col-span-2 sm:col-span-1 dark:bg-blue-950/40 dark:border-blue-500/30">
                      <span className="text-xs text-blue-700 font-medium dark:text-blue-300">Max FAR Allowed</span>
                      <div className="text-xl font-bold text-blue-900 mt-0.5 dark:text-blue-200">
                        {commercialRule.maxFar >= 999 ? 'Unrestricted (UR)' : commercialRule.maxFar}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 dark:bg-white/[0.04] dark:border-white/[0.10]">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Road Width Category:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{commercialRule.roadWidthRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Applicable Building Class:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{commercialRule.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Base Covered Floor Area:</span>
                      <span className="font-bold text-slate-900 font-mono dark:text-white">{(plotArea * commercialRule.baseFar).toFixed(1)} sqm</span>
                    </div>
                    <p className="text-slate-500 pt-2 border-t text-[11px] dark:text-slate-400">
                      {commercialRule.notes}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-xs space-y-3 dark:bg-emerald-950/40 dark:border-emerald-500/30">
                  <span className="font-bold text-emerald-950 text-sm block">
                    Transit-Oriented Development (TOD Zone) FAR Multipliers
                  </span>
                  <p className="text-emerald-900 dark:text-emerald-200">
                    Under Chapter 8.2.2.2, TOD zones receive enhanced FAR based on right of way:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white p-2.5 rounded border border-emerald-300 dark:bg-[#161617]">
                      <div className="text-xs text-slate-500 dark:text-slate-400">12m Road</div>
                      <div className="text-base font-bold text-emerald-800 dark:text-emerald-300">150% of Base FAR</div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-emerald-300 dark:bg-[#161617]">
                      <div className="text-xs text-slate-500 dark:text-slate-400">12 - 24m Road</div>
                      <div className="text-base font-bold text-emerald-800 dark:text-emerald-300">250% of Base FAR</div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-emerald-300 dark:bg-[#161617]">
                      <div className="text-xs text-slate-500 dark:text-slate-400">24 - 45m Road</div>
                      <div className="text-base font-bold text-emerald-800 dark:text-emerald-300">350% of Base FAR</div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-emerald-300 dark:bg-[#161617]">
                      <div className="text-xs text-slate-500 dark:text-slate-400">&gt; 45m Road</div>
                      <div className="text-base font-bold text-emerald-800 dark:text-emerald-300">Unrestricted</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visual Sensitivity Analysis Chart (Recharts) */}
          <div className="lg:col-span-12 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold dark:bg-indigo-950/40">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Statutory FAR Sensitivity Analysis & Parameter Impact Modeling
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visual simulation showing how changing road width, land-use classification, or plot size directly scales total permissible FAR under UP Byelaws 2025.
                </p>
              </div>

              {/* Sensitivity Mode Toggles */}
              <div className="flex items-center p-1 bg-slate-100 rounded-lg space-x-1 text-xs self-start sm:self-center dark:bg-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setSensitivityMode('road_width')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    sensitivityMode === 'road_width'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs dark:bg-[#161617]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  Road Width Sensitivity
                </button>
                <button
                  type="button"
                  onClick={() => setSensitivityMode('land_use')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    sensitivityMode === 'land_use'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs dark:bg-[#161617]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  Land-Use Comparison
                </button>
                <button
                  type="button"
                  onClick={() => setSensitivityMode('plot_telescopic')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    sensitivityMode === 'plot_telescopic'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs dark:bg-[#161617]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  Plot Telescopic Curve
                </button>
              </div>
            </div>

            {/* Current Parameter Status Pill */}
            <div className="flex flex-wrap items-center gap-2 text-xs bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
              <span className="font-bold text-indigo-900 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" />
                <span>Current Plot Configuration:</span>
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800 font-medium dark:bg-[#161617]">
                Road: <strong>{roadWidth}m</strong>
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800 font-medium dark:bg-[#161617]">
                Plot: <strong>{plotArea} m²</strong>
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800 font-medium dark:bg-[#161617]">
                Area: <strong>{areaCategory === 'built_up' ? 'Built-up Area' : 'Non-Built-up Area'}</strong>
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800 font-medium dark:bg-[#161617]">
                Occupancy: <strong>{occupancyType.replace('_', ' ').toUpperCase()}</strong>
              </span>
            </div>

            {/* RECHARTS CHART CONTAINER */}
            <div className="h-72 w-full pt-2">
              {sensitivityMode === 'road_width' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={roadWidthSensitivityData}
                    margin={{ top: 10, right: 25, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="roadLabel"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{ value: 'Abutting Road Width (meters)', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#475569' }}
                    />
                    <YAxis
                      domain={[0, 6.5]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{ value: 'Total Permissible FAR', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#475569' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1 dark:bg-black">
                              <p className="font-bold text-slate-200 border-b border-slate-700 pb-1">
                                Road Width: {label}
                              </p>
                              {payload.map((entry, index) => (
                                <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                                  <span style={{ color: entry.color }} className="font-medium">
                                    {entry.name}:
                                  </span>
                                  <span className="font-mono font-bold">{entry.value}</span>
                                </div>
                              ))}
                              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 dark:text-slate-500">
                                Evaluated in {areaCategory === 'built_up' ? 'Built-up' : 'Non-Built-up'} zone.
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    <ReferenceLine
                      x={roadWidth >= 60 ? '>45m' : `${roadWidth}m`}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{
                        value: `Current: ${roadWidth}m`,
                        fill: '#dc2626',
                        fontSize: 11,
                        position: 'top',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="groupHousingFAR"
                      name="Group Housing Max FAR"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="commercialFAR"
                      name="Commercial Max FAR"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="todFAR"
                      name="TOD Zone Enhanced FAR"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                    <Line
                      type="monotone"
                      dataKey="plottedFAR"
                      name="Plotted Res. Max Cap (2.0)"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {sensitivityMode === 'land_use' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={landUseSensitivityData}
                    margin={{ top: 10, right: 25, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="landUse"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      interval={0}
                      angle={-10}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 6.5]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{ value: 'FAR Multiplier', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#475569' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const dataItem = payload[0]?.payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1 dark:bg-black">
                              <p className="font-bold text-slate-200 border-b border-slate-700 pb-1">
                                {label} {dataItem?.active && '(Selected Project)'}
                              </p>
                              <div className="flex justify-between gap-4 text-slate-300">
                                <span>Base FAR:</span>
                                <span className="font-mono font-bold text-white">{dataItem?.baseFAR}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-emerald-400">
                                <span>Purchasable FAR:</span>
                                <span className="font-mono font-bold">+{dataItem?.purchasableFAR}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-indigo-300 font-bold border-t border-slate-800 pt-1">
                                <span>Total Permissible:</span>
                                <span className="font-mono">{dataItem?.totalFAR}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                Statutory Cap: {dataItem?.statutoryCap} on {roadWidth}m Road
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    <Bar
                      dataKey="baseFAR"
                      name="Base Statutory FAR"
                      stackId="far"
                      fill="#64748b"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="purchasableFAR"
                      name="Purchasable FAR (PFAR)"
                      stackId="far"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    >
                      {landUseSensitivityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.active ? '#059669' : '#10b981'}
                          stroke={entry.active ? '#064e3b' : 'none'}
                          strokeWidth={entry.active ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {sensitivityMode === 'plot_telescopic' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={plotAreaTelescopicData}
                    margin={{ top: 10, right: 25, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{ value: 'Plot Area (sqm) - Section 3.2.2 Telescopic Progression', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#475569' }}
                    />
                    <YAxis
                      domain={[0, 2.5]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{ value: 'FAR Multiplier', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#475569' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0]?.payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1 dark:bg-black">
                              <p className="font-bold text-amber-400 border-b border-slate-700 pb-1">
                                Plot Area: {label}
                              </p>
                              <div className="flex justify-between gap-4 text-slate-300">
                                <span>Effective Base FAR:</span>
                                <span className="font-mono font-bold text-white">{item?.effectiveBaseFAR}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-emerald-400">
                                <span>Purchasable Cap:</span>
                                <span className="font-mono font-bold">+{item?.purchasableFAR}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-cyan-300 font-bold border-t border-slate-800 pt-1">
                                <span>Statutory Max FAR:</span>
                                <span className="font-mono">2.00</span>
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                As per Section 3.2.2 & 3.2.2.1 Slabs
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="effectiveBaseFAR"
                      name="Effective Base FAR (Diminishing Slabs)"
                      stroke="#d97706"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="purchasableFAR"
                      name="Purchasable FAR Needed to reach 2.0"
                      stroke="#059669"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalFAR"
                      name="Statutory Upper Limit (2.00)"
                      stroke="#64748b"
                      strokeWidth={1}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-[11px] text-slate-500 italic pt-1 text-center dark:text-slate-400">
              * Data dynamically synchronized with Section 3.2.2 (Residential), Section 3.2.2.2 & 4.2.8 (Group Housing), Section 5.2.5 (Commercial), and Chapter 8 (TOD).
            </p>
          </div>
        </div>
      )}

      {/* CALC 2: PURCHASABLE FAR FEE (CHAPTER 9) */}
      {activeCalc === 'pfar_fee' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 dark:text-white">
              Purchasable FAR Parameters (Formula: C = Le × Rc × P)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Land Use Category (P Factor)
              </label>
              <select
                value={factorCat}
                onChange={(e) => setFactorCat(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 dark:bg-white/[0.04] dark:border-white/[0.14] dark:text-slate-100"
              >
                {PURCHASABLE_FAR_FACTORS.map((f, idx) => (
                  <option key={idx} value={f.category}>
                    {f.category} (P = {f.pfar} / {f.ppfar})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Plot Area (sqm)
              </label>
              <input
                type="number"
                value={feePlotArea}
                onChange={(e) => setFeePlotArea(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 dark:bg-white/[0.04] dark:border-white/[0.14] dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                  Base FAR
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={feeBaseFar}
                  onChange={(e) => setFeeBaseFar(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 dark:bg-white/[0.04] dark:border-white/[0.14] dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                  Circle Rate (Rs/sqm)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={circleRate}
                  onChange={(e) => setCircleRate(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 dark:bg-white/[0.04] dark:border-white/[0.14] dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                  Purchasable FAR (PFAR)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={feePfarVal}
                  onChange={(e) => setFeePfarVal(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 dark:bg-white/[0.04] dark:border-white/[0.14] dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                  Premium PFAR (PPFAR)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={feePpfarVal}
                  onChange={(e) => setFeePpfarVal(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 dark:bg-white/[0.04] dark:border-white/[0.14] dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 dark:text-white">
              Fee Calculation Summary (Chapter 9.2.5 Example Match)
            </h3>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl dark:bg-emerald-950/40 dark:border-emerald-500/30">
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider dark:text-emerald-300">
                Total Purchasable FAR Fee Payable
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mt-1 font-mono">
                ₹ {pfarFeeResult.totalCharge.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-emerald-700 mt-1 block dark:text-emerald-300">
                Matches exact methodology from Page 112 of the official Gazette!
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 dark:bg-white/[0.04] dark:border-white/[0.10]">
                <span className="font-bold text-slate-900 block dark:text-white">1. Purchasable FAR (PFAR):</span>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Additional Floor Area (FP = Plot × FAR):</span>
                  <span className="font-mono font-semibold">{pfarFeeResult.fpPfar.toLocaleString()} sqm</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Proportional Land (Le = FP ÷ Base FAR):</span>
                  <span className="font-mono font-semibold">{pfarFeeResult.lePfar.toFixed(1)} sqm</span>
                </div>
                <div className="flex justify-between text-slate-900 font-semibold border-t pt-1 dark:text-white">
                  <span>Charge (Le × Rc × {pfarFeeResult.factorPfar}):</span>
                  <span className="font-mono text-emerald-800 dark:text-emerald-300">₹ {pfarFeeResult.chargePfar.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {pfarFeeResult.chargePpfar > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 dark:bg-white/[0.04] dark:border-white/[0.10]">
                  <span className="font-bold text-slate-900 block dark:text-white">2. Premium Purchasable FAR (PPFAR):</span>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Additional Floor Area:</span>
                    <span className="font-mono font-semibold">{pfarFeeResult.fpPpfar.toLocaleString()} sqm</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Proportional Land:</span>
                    <span className="font-mono font-semibold">{pfarFeeResult.lePpfar.toFixed(1)} sqm</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-semibold border-t pt-1 dark:text-white">
                    <span>Charge (Le × Rc × {pfarFeeResult.factorPpfar}):</span>
                    <span className="font-mono text-emerald-800 dark:text-emerald-300">₹ {pfarFeeResult.chargePpfar.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CALC 3: PARKING & EVCI */}
      {activeCalc === 'parking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 dark:text-white">
              Occupancy & Parking Dimensions
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Facility Type
              </label>
              <select
                value={parkingOccupancy}
                onChange={(e) => setParkingOccupancy(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 dark:bg-white/[0.04] dark:border-white/[0.14] dark:text-slate-100"
              >
                <option value="residential_units">Residential Group Housing (By Dwelling Unit sizes)</option>
                <option value="commercial_floor">Commercial Complex (2 ECS / 100 sqm)</option>
                <option value="mall">Shopping Mall (3 ECS / 100 sqm)</option>
                <option value="hospital">Hospital / Healthcare (1.5 ECS / 125 sqm + Ambulance)</option>
                <option value="school">Educational / School (1 ECS / 125 sqm + Bus bays)</option>
              </select>
            </div>

            {parkingOccupancy === 'residential_units' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400">Units ≤ 50 sqm (2 sqm/DU)</label>
                  <input
                    type="number"
                    value={unitsSmall}
                    onChange={(e) => setUnitsSmall(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs dark:bg-white/[0.04]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400">Units 50 - 100 sqm (1.00 ECS/DU)</label>
                  <input
                    type="number"
                    value={unitsMedium}
                    onChange={(e) => setUnitsMedium(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs dark:bg-white/[0.04]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400">Units 100 - 150 sqm (1.25 ECS/DU)</label>
                  <input
                    type="number"
                    value={unitsLarge}
                    onChange={(e) => setUnitsLarge(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs dark:bg-white/[0.04]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400">Units &gt; 150 sqm (1.50 ECS/DU)</label>
                  <input
                    type="number"
                    value={unitsXLarge}
                    onChange={(e) => setUnitsXLarge(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs dark:bg-white/[0.04]"
                  />
                </div>
              </div>
            )}

            {(parkingOccupancy === 'commercial_floor' || parkingOccupancy === 'mall') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                  Floor Area (sqm)
                </label>
                <input
                  type="number"
                  value={commercialFloorArea}
                  onChange={(e) => setCommercialFloorArea(Number(e.target.value))}
                  className="w-full bg-slate-50 border rounded p-2 text-xs dark:bg-white/[0.04]"
                />
              </div>
            )}

            {parkingOccupancy === 'hospital' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400">Total Floor Area (sqm)</label>
                  <input
                    type="number"
                    value={hospitalFloorArea}
                    onChange={(e) => setHospitalFloorArea(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs dark:bg-white/[0.04]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400">Number of Beds</label>
                  <input
                    type="number"
                    value={hospitalBeds}
                    onChange={(e) => setHospitalBeds(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs dark:bg-white/[0.04]"
                  />
                </div>
              </div>
            )}

            {parkingOccupancy === 'school' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400">Total Built-up Area (sqm)</label>
                  <input
                    type="number"
                    value={schoolBuiltUp}
                    onChange={(e) => setSchoolBuiltUp(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs dark:bg-white/[0.04]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400">Student Capacity</label>
                  <input
                    type="number"
                    value={schoolStudents}
                    onChange={(e) => setSchoolStudents(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs dark:bg-white/[0.04]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 dark:text-white">
              Parking & EVCI Provision Requirement
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/40 dark:border-blue-500/30">
                <span className="text-xs text-blue-700 font-medium dark:text-blue-300">Total ECS Required</span>
                <div className="text-2xl font-bold text-blue-950 mt-1">{parkingResult.finalEcs}</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/40 dark:border-amber-500/30">
                <span className="text-xs text-amber-700 font-medium dark:text-amber-300">EV Share (20%)</span>
                <div className="text-2xl font-bold text-amber-950 mt-1">{parkingResult.evCapacity} bays</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg col-span-2 sm:col-span-1 dark:bg-emerald-950/40 dark:border-emerald-500/30">
                <span className="text-xs text-emerald-700 font-medium dark:text-emerald-300">Power Load (+1.25 SF)</span>
                <div className="text-2xl font-bold text-emerald-950 mt-1">~{parkingResult.estimatedLoadKw} kW</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 dark:bg-white/[0.04] dark:border-white/[0.10]">
              <span className="font-bold text-slate-900 block dark:text-white">Required EV Chargers Breakdown (Chapter 17.1.2):</span>
              <div className="flex justify-between">
                <span>Slow AC Chargers (1 per 3 EVs):</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{parkingResult.slowChargers} units</span>
              </div>
              <div className="flex justify-between">
                <span>Fast DC Chargers (1 per 10 EVs):</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{parkingResult.fastChargers} units</span>
              </div>
            </div>

            {parkingResult.extraNotes.length > 0 && (
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900 space-y-1 dark:text-blue-200">
                {parkingResult.extraNotes.map((note, i) => (
                  <p key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span>{note}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALC 4: COMPOUNDING FEE & ELIGIBILITY */}
      {activeCalc === 'compounding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 dark:text-white">
              Compounding Assessment (Chapter 16)
            </h3>

            {/* Ineligibility checks */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-xs text-rose-900 dark:bg-rose-950/40 dark:border-rose-500/30 dark:text-rose-200">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Statutory Disqualifications (Clause 16.3.2):</span>
              </span>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isIllegalColony}
                  onChange={(e) => setIsIllegalColony(e.target.checked)}
                  className="rounded text-rose-600"
                />
                <span>Plot is inside an unauthorized/illegal colony</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isPublicLand}
                  onChange={(e) => setIsPublicLand(e.target.checked)}
                  className="rounded text-rose-600"
                />
                <span>Built on government land or road/park reserve</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={hasFireNocIssue}
                  onChange={(e) => setHasFireNocIssue(e.target.checked)}
                  className="rounded text-rose-600"
                />
                <span>Violation of mandatory Fire/Earthquake safety</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Building Use
              </label>
              <select
                value={compUse}
                onChange={(e) => setCompUse(e.target.value as any)}
                className="w-full bg-slate-50 border rounded p-2 text-xs dark:bg-white/[0.04]"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial (Higher penalty multipliers)</option>
                <option value="office">Office / Institutional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Applicable Circle Rate (Rs/sqm)
              </label>
              <input
                type="number"
                value={compLandPrice}
                onChange={(e) => setCompLandPrice(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded p-2 text-xs dark:bg-white/[0.04]"
              />
            </div>

            <div className="space-y-2 pt-2 border-t text-xs">
              <span className="font-bold text-slate-800 block dark:text-slate-100">Deviations to be Compounded:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400">Front Setback (sqm)</label>
                  <input
                    type="number"
                    value={frontEncroachSqm}
                    onChange={(e) => setFrontEncroachSqm(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-1.5 dark:bg-white/[0.04]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400">Side Setback (sqm)</label>
                  <input
                    type="number"
                    value={sideEncroachSqm}
                    onChange={(e) => setSideEncroachSqm(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-1.5 dark:bg-white/[0.04]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400">Rear Setback (sqm)</label>
                  <input
                    type="number"
                    value={rearEncroachSqm}
                    onChange={(e) => setRearEncroachSqm(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-1.5 dark:bg-white/[0.04]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400">Excess FAR (sqm)</label>
                  <input
                    type="number"
                    value={excessFarSqm}
                    onChange={(e) => setExcessFarSqm(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-1.5 dark:bg-white/[0.04]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400">Height Deviation (meters)</label>
                <input
                  type="number"
                  step="0.1"
                  value={heightDeviationMeters}
                  onChange={(e) => setHeightDeviationMeters(Number(e.target.value))}
                  className="w-full bg-slate-50 border rounded p-1.5 dark:bg-white/[0.04]"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 dark:text-white">
              Compounding Fee Breakdown (Rule 4 Schedule)
            </h3>

            {!compoundingResult.isEligible ? (
              <div className="p-5 bg-rose-50 border border-rose-300 rounded-xl space-y-2 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>NON-COMPOUNDABLE OFFENCE DETECTED</span>
                </div>
                <p className="text-xs">
                  Under Chapter 16.2 and 16.3.2 of UP Byelaws 2025, the following violations cannot be compounded and are liable for demolition under Section 27 of UP Urban Planning and Development Act:
                </p>
                <ul className="list-disc pl-5 text-xs space-y-1 font-semibold">
                  {compoundingResult.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl dark:bg-emerald-950/40 dark:border-emerald-500/30">
                  <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider dark:text-emerald-300">
                    Total Estimated Compounding Fee
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mt-1 font-mono">
                    ₹ {compoundingResult.totalFee.toLocaleString('en-IN')}
                  </div>
                  <span className="text-xs text-emerald-700 block mt-1 dark:text-emerald-300">
                    Payable in lump-sum or instalments with interest rate (MCLR + 1%).
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border rounded-lg overflow-hidden text-xs">
                  {compoundingResult.breakdown.map((b, i) => (
                    <div key={i} className="p-3 bg-slate-50 flex items-center justify-between dark:bg-white/[0.04]">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{b.item}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{b.basis}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        ₹ {b.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
