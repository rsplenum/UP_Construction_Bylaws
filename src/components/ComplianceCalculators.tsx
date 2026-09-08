import React, { useState, useMemo } from 'react';
import { Calculator, AlertTriangle, CheckCircle2, TrendingUp, Zap, HelpCircle } from 'lucide-react';
import { PURCHASABLE_FAR_FACTORS } from '../data/byelawsData';

export const ComplianceCalculators: React.FC = () => {
  const [activeCalc, setActiveCalc] = useState<'far' | 'pfar_fee' | 'parking' | 'compounding'>('far');

  // --- 1. FAR State ---
  const [occupancyType, setOccupancyType] = useState<'residential_plotted' | 'group_housing' | 'commercial' | 'tod'>('residential_plotted');
  const [plotArea, setPlotArea] = useState<number>(280);
  const [roadWidth, setRoadWidth] = useState<number>(12);
  const [areaCategory, setAreaCategory] = useState<'built_up' | 'non_built_up'>('built_up');
  const [greenRating, setGreenRating] = useState<'none' | 'silver' | 'gold' | 'platinum'>('none');

  // Telescopic Residential Plotted FAR calculation as per Chapter 3.2.2 (p. 46-47)
  const calculatedPlottedFar = useMemo(() => {
    const area = Math.max(0, plotArea);
    if (area === 0) return { baseFloorArea: 0, baseFar: 0, steps: [], maxFar: 2.0, maxFloorArea: 0 };

    let remaining = area;
    let totalBuilt = 0;
    const steps: { range: string; slabArea: number; far: number; built: number }[] = [];

    // First 100 sqm @ 2.0
    const slab1 = Math.min(remaining, 100);
    const built1 = slab1 * 2.0;
    totalBuilt += built1;
    remaining -= slab1;
    steps.push({ range: "Up to 100 sqm", slabArea: slab1, far: 2.0, built: built1 });

    // 100 to 300 sqm (next 200) @ 1.75
    if (remaining > 0) {
      const slab2 = Math.min(remaining, 200);
      const built2 = slab2 * 1.75;
      totalBuilt += built2;
      remaining -= slab2;
      steps.push({ range: "100 - 300 sqm", slabArea: slab2, far: 1.75, built: built2 });
    }

    // 300 to 500 sqm (next 200) @ 1.50
    if (remaining > 0) {
      const slab3 = Math.min(remaining, 200);
      const built3 = slab3 * 1.50;
      totalBuilt += built3;
      remaining -= slab3;
      steps.push({ range: "300 - 500 sqm", slabArea: slab3, far: 1.50, built: built3 });
    }

    // 500 to 1200 sqm (next 700) @ 1.25
    if (remaining > 0) {
      const slab4 = Math.min(remaining, 700);
      const built4 = slab4 * 1.25;
      totalBuilt += built4;
      remaining -= slab4;
      steps.push({ range: "500 - 1200 sqm", slabArea: slab4, far: 1.25, built: built4 });
    }

    // > 1200 sqm @ 1.00
    if (remaining > 0) {
      const slab5 = remaining;
      const built5 = slab5 * 1.00;
      totalBuilt += built5;
      steps.push({ range: "Above 1200 sqm", slabArea: slab5, far: 1.00, built: built5 });
    }

    const effectiveBaseFar = totalBuilt / area;
    const maxFar = 2.0; // Maximum permissible FAR for plotted residential is 2.0 under Chapter 9.2.3 Note-3
    const maxFloorArea = area * maxFar;

    return {
      baseFloorArea: totalBuilt,
      baseFar: effectiveBaseFar,
      steps,
      maxFar,
      maxFloorArea,
    };
  }, [plotArea]);

  // Group Housing & Commercial FAR based on road width
  const groupHousingFar = useMemo(() => {
    const isBuiltUp = areaCategory === 'built_up';
    let baseFar = isBuiltUp ? 1.5 : 2.5;
    let pfar = 0;
    let ppfar = 0;
    let maxFar: number | string = baseFar;

    if (roadWidth <= 12) {
      if (isBuiltUp) {
        pfar = 0.3;
        ppfar = 0.3;
        maxFar = 2.1;
      } else {
        baseFar = 2.5;
        pfar = 0.5;
        ppfar = 0.5;
        maxFar = 3.5;
      }
    } else if (roadWidth <= 24) {
      if (isBuiltUp) {
        pfar = 0.75;
        ppfar = 0.75;
        maxFar = 3.0;
      } else {
        pfar = 1.25;
        ppfar = 1.25;
        maxFar = 5.0;
      }
    } else if (roadWidth <= 45) {
      if (isBuiltUp) {
        pfar = 1.5;
        ppfar = 2.25;
        maxFar = 5.25;
      } else {
        pfar = 2.5;
        ppfar = 3.75;
        maxFar = 8.75;
      }
    } else {
      // > 45m Unrestricted
      pfar = isBuiltUp ? 1.5 : 2.5;
      ppfar = 0;
      maxFar = "Unrestricted (UR)";
    }

    let greenBonusPercent = 0;
    if (greenRating === 'silver') greenBonusPercent = 3;
    if (greenRating === 'gold') greenBonusPercent = 5;
    if (greenRating === 'platinum') greenBonusPercent = 7;

    return {
      baseFar,
      pfar,
      ppfar,
      maxFar,
      greenBonusPercent,
    };
  }, [roadWidth, areaCategory, greenRating]);

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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
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
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Plot & Occupancy Parameters
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Occupancy Category
              </label>
              <select
                value={occupancyType}
                onChange={(e) => setOccupancyType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="residential_plotted">Residential - Plotted (Single / Multi-unit)</option>
                <option value="group_housing">Residential - Group Housing</option>
                <option value="commercial">Commercial Buildings / Malls</option>
                <option value="tod">Transit-Oriented Development (TOD Zone)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plot Area (sq.m.)
              </label>
              <input
                type="number"
                min="20"
                value={plotArea}
                onChange={(e) => setPlotArea(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500">
                Example: 280 sqm as illustrated on Page 47 of Byelaws.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Abutting Road Width (meters)
              </label>
              <select
                value={roadWidth}
                onChange={(e) => setRoadWidth(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value={9}>9 meters (Single Unit residential, minor)</option>
                <option value={12}>12 meters (Standard residential/commercial)</option>
                <option value={18}>18 meters (Major sector road / Group Housing)</option>
                <option value={24}>24 meters (Arterial corridor)</option>
                <option value={50}>More than 45 meters (Expressway / Unrestricted FAR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location Area Scheme
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAreaCategory('built_up')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    areaCategory === 'built_up'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Built-up Area
                </button>
                <button
                  type="button"
                  onClick={() => setAreaCategory('non_built_up')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    areaCategory === 'non_built_up'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Non-Built-up Area
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Green Building Certification (Chapter 9.3)
              </label>
              <select
                value={greenRating}
                onChange={(e) => setGreenRating(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="none">None (Standard)</option>
                <option value="silver">GRIHA 3-Star / IGBC Silver / LEED Silver (+3% Free FAR)</option>
                <option value="gold">GRIHA 4-Star / IGBC Gold / LEED Gold (+5% Free FAR)</option>
                <option value="platinum">GRIHA 5-Star / IGBC Platinum / LEED Platinum (+7% Free FAR)</option>
              </select>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Calculated Permissible FAR & Built-up Capacity
            </h3>

            {occupancyType === 'residential_plotted' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                    <span className="text-xs text-emerald-800 font-medium">Effective Base FAR</span>
                    <div className="text-xl font-bold text-emerald-950 mt-0.5">
                      {calculatedPlottedFar.baseFar.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <span className="text-xs text-slate-600 font-medium">Base Floor Area</span>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">
                      {calculatedPlottedFar.baseFloorArea.toFixed(1)} <span className="text-xs font-normal text-slate-500">sqm</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center col-span-2 sm:col-span-1">
                    <span className="text-xs text-blue-800 font-medium">Max FAR (with PFAR)</span>
                    <div className="text-xl font-bold text-blue-950 mt-0.5">
                      {calculatedPlottedFar.maxFar.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Telescopic Slab Calculation Breakdown (as per Chapter 3.2.2):
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    {calculatedPlottedFar.steps.map((st, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-slate-200/60 last:border-0">
                        <span>
                          {st.range} ({st.slabArea.toFixed(1)} sqm × {st.far}):
                        </span>
                        <span className="font-mono font-semibold text-slate-900">
                          {st.built.toFixed(1)} sqm
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-bold text-emerald-900 border-t border-slate-300">
                      <span>Total Allowable Base Floor Area:</span>
                      <span className="font-mono">{calculatedPlottedFar.baseFloorArea.toFixed(1)} sqm</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <strong>Max Permissible Coverage:</strong> After leaving prescribed setbacks (Front {plotArea <= 150 ? '1.0m' : plotArea <= 500 ? '3.0m' : '4.5m'}, Rear {plotArea <= 150 ? '0m' : plotArea <= 300 ? '1.5m' : '3.0m'}).
                  </p>
                  <p>
                    <strong>Purchasable FAR:</strong> Up to 2.0 total FAR permissible regardless of road width (Chapter 9.2.3 Note-3).
                  </p>
                </div>
              </div>
            ) : occupancyType === 'group_housing' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-xs text-slate-500 font-medium">Base FAR</span>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">{groupHousingFar.baseFar}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-xs text-emerald-700 font-medium">Purchasable FAR</span>
                    <div className="text-xl font-bold text-emerald-900 mt-0.5">+{groupHousingFar.pfar}</div>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <span className="text-xs text-indigo-700 font-medium">Premium PFAR</span>
                    <div className="text-xl font-bold text-indigo-900 mt-0.5">+{groupHousingFar.ppfar}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-xs text-blue-700 font-medium">Max FAR (MFAR)</span>
                    <div className="text-xl font-bold text-blue-900 mt-0.5">{groupHousingFar.maxFar}</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Covered Floor Area:</span>
                    <span className="font-bold text-slate-900 font-mono">{(plotArea * groupHousingFar.baseFar).toFixed(1)} sqm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Potential Max Floor Area (at MFAR):</span>
                    <span className="font-bold text-emerald-800 font-mono">
                      {typeof groupHousingFar.maxFar === 'number'
                        ? (plotArea * groupHousingFar.maxFar).toFixed(1) + ' sqm'
                        : 'Unrestricted (Subject to Setbacks & Height)'}
                    </span>
                  </div>
                  {groupHousingFar.greenBonusPercent > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t">
                      <span>Green Incentive ({groupHousingFar.greenBonusPercent}% free):</span>
                      <span>+{((plotArea * groupHousingFar.baseFar * groupHousingFar.greenBonusPercent) / 100).toFixed(1)} sqm</span>
                    </div>
                  )}
                </div>
              </div>
            ) : occupancyType === 'tod' ? (
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-xs space-y-3">
                <span className="font-bold text-emerald-950 text-sm block">
                  Transit-Oriented Development (TOD Zone) FAR Multipliers
                </span>
                <p className="text-emerald-900">
                  Under Chapter 8.2.2.2, TOD zones receive enhanced FAR based on right of way:
                </p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded border border-emerald-300">
                    <div className="text-xs text-slate-500">12m Road</div>
                    <div className="text-base font-bold text-emerald-800">150% of Base FAR</div>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-emerald-300">
                    <div className="text-xs text-slate-500">12 - 24m Road</div>
                    <div className="text-base font-bold text-emerald-800">250% of Base FAR</div>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-emerald-300">
                    <div className="text-xs text-slate-500">24 - 45m Road</div>
                    <div className="text-base font-bold text-emerald-800">350% of Base FAR</div>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-emerald-300">
                    <div className="text-xs text-slate-500">&gt; 45m Road</div>
                    <div className="text-base font-bold text-emerald-800">Unrestricted</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-900 block">Commercial Establishments & Malls:</span>
                <p className="text-slate-600">
                  Base FAR is 1.5 (Built-up) or 1.75 to 3.0 (Non-built-up). Purchasable FAR expands up to 4.0 (12-24m road), 7.0 (24-45m road), and unrestricted on roads &gt;45m.
                </p>
                <p className="text-slate-600">
                  Skylighted Atriums up to 20% kiosk area are completely exempted from FAR calculations under Chapter 5.2.5.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALC 2: PURCHASABLE FAR FEE (CHAPTER 9) */}
      {activeCalc === 'pfar_fee' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Purchasable FAR Parameters (Formula: C = Le × Rc × P)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Land Use Category (P Factor)
              </label>
              <select
                value={factorCat}
                onChange={(e) => setFactorCat(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                {PURCHASABLE_FAR_FACTORS.map((f, idx) => (
                  <option key={idx} value={f.category}>
                    {f.category} (P = {f.pfar} / {f.ppfar})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plot Area (sqm)
              </label>
              <input
                type="number"
                value={feePlotArea}
                onChange={(e) => setFeePlotArea(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base FAR
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={feeBaseFar}
                  onChange={(e) => setFeeBaseFar(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Circle Rate (Rs/sqm)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={circleRate}
                  onChange={(e) => setCircleRate(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purchasable FAR (PFAR)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={feePfarVal}
                  onChange={(e) => setFeePfarVal(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Premium PFAR (PPFAR)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={feePpfarVal}
                  onChange={(e) => setFeePpfarVal(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Fee Calculation Summary (Chapter 9.2.5 Example Match)
            </h3>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                Total Purchasable FAR Fee Payable
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mt-1 font-mono">
                ₹ {pfarFeeResult.totalCharge.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-emerald-700 mt-1 block">
                Matches exact methodology from Page 112 of the official Gazette!
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">1. Purchasable FAR (PFAR):</span>
                <div className="flex justify-between text-slate-600">
                  <span>Additional Floor Area (FP = Plot × FAR):</span>
                  <span className="font-mono font-semibold">{pfarFeeResult.fpPfar.toLocaleString()} sqm</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Proportional Land (Le = FP ÷ Base FAR):</span>
                  <span className="font-mono font-semibold">{pfarFeeResult.lePfar.toFixed(1)} sqm</span>
                </div>
                <div className="flex justify-between text-slate-900 font-semibold border-t pt-1">
                  <span>Charge (Le × Rc × {pfarFeeResult.factorPfar}):</span>
                  <span className="font-mono text-emerald-800">₹ {pfarFeeResult.chargePfar.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {pfarFeeResult.chargePpfar > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">2. Premium Purchasable FAR (PPFAR):</span>
                  <div className="flex justify-between text-slate-600">
                    <span>Additional Floor Area:</span>
                    <span className="font-mono font-semibold">{pfarFeeResult.fpPpfar.toLocaleString()} sqm</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Proportional Land:</span>
                    <span className="font-mono font-semibold">{pfarFeeResult.lePpfar.toFixed(1)} sqm</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-semibold border-t pt-1">
                    <span>Charge (Le × Rc × {pfarFeeResult.factorPpfar}):</span>
                    <span className="font-mono text-emerald-800">₹ {pfarFeeResult.chargePpfar.toLocaleString('en-IN')}</span>
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
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Occupancy & Parking Dimensions
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Facility Type
              </label>
              <select
                value={parkingOccupancy}
                onChange={(e) => setParkingOccupancy(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
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
                  <label className="block text-xs text-slate-600">Units ≤ 50 sqm (2 sqm/DU)</label>
                  <input
                    type="number"
                    value={unitsSmall}
                    onChange={(e) => setUnitsSmall(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Units 50 - 100 sqm (1.00 ECS/DU)</label>
                  <input
                    type="number"
                    value={unitsMedium}
                    onChange={(e) => setUnitsMedium(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Units 100 - 150 sqm (1.25 ECS/DU)</label>
                  <input
                    type="number"
                    value={unitsLarge}
                    onChange={(e) => setUnitsLarge(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Units &gt; 150 sqm (1.50 ECS/DU)</label>
                  <input
                    type="number"
                    value={unitsXLarge}
                    onChange={(e) => setUnitsXLarge(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs"
                  />
                </div>
              </div>
            )}

            {(parkingOccupancy === 'commercial_floor' || parkingOccupancy === 'mall') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Floor Area (sqm)
                </label>
                <input
                  type="number"
                  value={commercialFloorArea}
                  onChange={(e) => setCommercialFloorArea(Number(e.target.value))}
                  className="w-full bg-slate-50 border rounded p-2 text-xs"
                />
              </div>
            )}

            {parkingOccupancy === 'hospital' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600">Total Floor Area (sqm)</label>
                  <input
                    type="number"
                    value={hospitalFloorArea}
                    onChange={(e) => setHospitalFloorArea(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Number of Beds</label>
                  <input
                    type="number"
                    value={hospitalBeds}
                    onChange={(e) => setHospitalBeds(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs"
                  />
                </div>
              </div>
            )}

            {parkingOccupancy === 'school' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600">Total Built-up Area (sqm)</label>
                  <input
                    type="number"
                    value={schoolBuiltUp}
                    onChange={(e) => setSchoolBuiltUp(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Student Capacity</label>
                  <input
                    type="number"
                    value={schoolStudents}
                    onChange={(e) => setSchoolStudents(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-2 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Parking & EVCI Provision Requirement
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-xs text-blue-700 font-medium">Total ECS Required</span>
                <div className="text-2xl font-bold text-blue-950 mt-1">{parkingResult.finalEcs}</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-xs text-amber-700 font-medium">EV Share (20%)</span>
                <div className="text-2xl font-bold text-amber-950 mt-1">{parkingResult.evCapacity} bays</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg col-span-2 sm:col-span-1">
                <span className="text-xs text-emerald-700 font-medium">Power Load (+1.25 SF)</span>
                <div className="text-2xl font-bold text-emerald-950 mt-1">~{parkingResult.estimatedLoadKw} kW</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 block">Required EV Chargers Breakdown (Chapter 17.1.2):</span>
              <div className="flex justify-between">
                <span>Slow AC Chargers (1 per 3 EVs):</span>
                <span className="font-bold text-slate-800">{parkingResult.slowChargers} units</span>
              </div>
              <div className="flex justify-between">
                <span>Fast DC Chargers (1 per 10 EVs):</span>
                <span className="font-bold text-slate-800">{parkingResult.fastChargers} units</span>
              </div>
            </div>

            {parkingResult.extraNotes.length > 0 && (
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900 space-y-1">
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
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Compounding Assessment (Chapter 16)
            </h3>

            {/* Ineligibility checks */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-xs text-rose-900">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Building Use
              </label>
              <select
                value={compUse}
                onChange={(e) => setCompUse(e.target.value as any)}
                className="w-full bg-slate-50 border rounded p-2 text-xs"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial (Higher penalty multipliers)</option>
                <option value="office">Office / Institutional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Applicable Circle Rate (Rs/sqm)
              </label>
              <input
                type="number"
                value={compLandPrice}
                onChange={(e) => setCompLandPrice(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded p-2 text-xs"
              />
            </div>

            <div className="space-y-2 pt-2 border-t text-xs">
              <span className="font-bold text-slate-800 block">Deviations to be Compounded:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600">Front Setback (sqm)</label>
                  <input
                    type="number"
                    value={frontEncroachSqm}
                    onChange={(e) => setFrontEncroachSqm(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600">Side Setback (sqm)</label>
                  <input
                    type="number"
                    value={sideEncroachSqm}
                    onChange={(e) => setSideEncroachSqm(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-1.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600">Rear Setback (sqm)</label>
                  <input
                    type="number"
                    value={rearEncroachSqm}
                    onChange={(e) => setRearEncroachSqm(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600">Excess FAR (sqm)</label>
                  <input
                    type="number"
                    value={excessFarSqm}
                    onChange={(e) => setExcessFarSqm(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded p-1.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600">Height Deviation (meters)</label>
                <input
                  type="number"
                  step="0.1"
                  value={heightDeviationMeters}
                  onChange={(e) => setHeightDeviationMeters(Number(e.target.value))}
                  className="w-full bg-slate-50 border rounded p-1.5"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Compounding Fee Breakdown (Rule 4 Schedule)
            </h3>

            {!compoundingResult.isEligible ? (
              <div className="p-5 bg-rose-50 border border-rose-300 rounded-xl space-y-2 text-rose-900">
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
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                    Total Estimated Compounding Fee
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mt-1 font-mono">
                    ₹ {compoundingResult.totalFee.toLocaleString('en-IN')}
                  </div>
                  <span className="text-xs text-emerald-700 block mt-1">
                    Payable in lump-sum or instalments with interest rate (MCLR + 1%).
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border rounded-lg overflow-hidden text-xs">
                  {compoundingResult.breakdown.map((b, i) => (
                    <div key={i} className="p-3 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{b.item}</div>
                        <div className="text-[11px] text-slate-500">{b.basis}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-900">
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
