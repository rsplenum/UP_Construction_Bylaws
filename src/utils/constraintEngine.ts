import { AuditEngineState } from './auditStorage';
import { HIGH_RISE_SETBACKS, PLOTTED_RESIDENTIAL_SETBACKS } from '../data/byelawsData';

export type ConflictSeverity = 'fatal' | 'conflict' | 'prerequisite' | 'divergence';

export interface RegulatoryConflict {
  id: string;
  code: string;
  severity: ConflictSeverity;
  title: string;
  chapterRef: string;
  byelawClause: string;
  description: string;
  detectedValues: {
    fieldA: string;
    valueA: string | number;
    fieldB?: string;
    valueB?: string | number;
  };
  statutoryRuleSummary: string;
  remedyActionTitle: string;
  autoFix?: (currentState: AuditEngineState) => Partial<AuditEngineState>;
}

export function evaluateLogicalConstraints(state: AuditEngineState): RegulatoryConflict[] {
  const conflicts: RegulatoryConflict[] = [];

  const {
    occupancy,
    plotArea,
    plotFrontage,
    roadWidth,
    buildingHeight,
    proposedBuiltUpArea,
    isCornerPlot,
    frontSetbackProvided,
    rearSetbackProvided,
    side1Provided,
    side2Provided,
    parkingBaysProvided,
    hasRWH,
    hasSolarHeating,
    greenRating,
  } = state;

  // 1. High-Rise vs Road Width Constraint (Chapter 8.1 & 3.2.4)
  const isHighRise = buildingHeight > 15;
  const minRoadForHighRise = occupancy === 'group_housing' || occupancy === 'commercial' ? 18 : 12;

  if (isHighRise && roadWidth < minRoadForHighRise) {
    conflicts.push({
      id: 'high_rise_road_width',
      code: 'ERR-CH08-ROAD-WIDTH',
      severity: 'fatal',
      title: 'High-Rise Construction Prohibited on Sub-Standard Road',
      chapterRef: 'Chapter 8.1 & Chapter 3.2.4',
      byelawClause: 'Clause 8.1.2: Fire Egress and Access Road Width',
      description: `Building height is ${buildingHeight}m (> 15m high-rise threshold), but abutting road width is ${roadWidth}m. Chapter 8 mandates a minimum ${minRoadForHighRise}m wide abutting road for hydraulic fire tender mobility.`,
      detectedValues: {
        fieldA: 'Building Height',
        valueA: `${buildingHeight}m`,
        fieldB: 'Abutting Road Width',
        valueB: `${roadWidth}m (Mandatory: ≥ ${minRoadForHighRise}m)`,
      },
      statutoryRuleSummary: `Structures above 15m require minimum ${minRoadForHighRise}m clear road width to permit turntable ladder (TTL) positioning and multi-directional fire engine access.`,
      remedyActionTitle: `Upgrade Road Width to ${minRoadForHighRise}m (or cap Height at 15m)`,
      autoFix: () => ({ roadWidth: minRoadForHighRise }),
    });
  }

  // 2. Multi-Unit Plotted Road Width Constraint (Chapter 3.2.4 Note)
  if (occupancy === 'multi_unit' && roadWidth < 9) {
    conflicts.push({
      id: 'multi_unit_road_width',
      code: 'ERR-CH03-MULTIUNIT-ROAD',
      severity: 'conflict',
      title: 'Multi-Unit Housing Requires Minimum 9.0m Abutting Road',
      chapterRef: 'Chapter 3.2.4',
      byelawClause: 'Table 3.2.1 Note (ii): Multi-Family Road Width',
      description: `Multi-unit residential (Stilt + 4 floors or independent apartments) is proposed on a ${roadWidth}m road. The byelaws mandate minimum 9.0m right-of-way to avoid neighborhood congestion.`,
      detectedValues: {
        fieldA: 'Occupancy Type',
        valueA: 'Multi-Unit Residential',
        fieldB: 'Road Width',
        valueB: `${roadWidth}m (Mandatory: ≥ 9m)`,
      },
      statutoryRuleSummary: 'Subdivision into multi-family units is permissible only where road width is 9.0m or wider with dedicated visitor ECS.',
      remedyActionTitle: 'Upgrade Road Width to 9.0m',
      autoFix: () => ({ roadWidth: 9.0 }),
    });
  }

  // 3. Single-Unit Plotted Residential Height Cap (Chapter 3.2.1)
  if (occupancy === 'single_unit' && buildingHeight > 15) {
    conflicts.push({
      id: 'single_unit_height_cap',
      code: 'ERR-CH03-HEIGHT-CAP',
      severity: 'conflict',
      title: 'Single-Unit Plotted Structure Exceeds 15m Plotted Ceiling',
      chapterRef: 'Chapter 3.2.1',
      byelawClause: 'Clause 3.2.1.4: Maximum Plotted Height Ceiling',
      description: `Proposed height of ${buildingHeight}m exceeds the 15.0m maximum permissible height for single-unit plotted developments (Stilt + 4 stories maximum).`,
      detectedValues: {
        fieldA: 'Occupancy',
        valueA: 'Single-Unit Plotted',
        fieldB: 'Building Height',
        valueB: `${buildingHeight}m (Max Plotted: 15.0m)`,
      },
      statutoryRuleSummary: 'Residential plotted properties cannot exceed 15m. Heights > 15m are classified as Group Housing requiring progressive fire clearances.',
      remedyActionTitle: 'Reclassify as Group Housing (or reduce height to 15.0m)',
      autoFix: () => ({ occupancy: 'group_housing' }),
    });
  }

  // 4. Base FAR Calculation & Purchasable FAR Road Threshold (Chapter 9.2.1)
  let baseFar = 1.5;
  if (occupancy === 'single_unit') {
    if (plotArea <= 100) baseFar = 2.0;
    else if (plotArea <= 300) baseFar = (100 * 2.0 + (plotArea - 100) * 1.75) / plotArea;
    else if (plotArea <= 500) baseFar = (100 * 2.0 + 200 * 1.75 + (plotArea - 300) * 1.5) / plotArea;
    else baseFar = (100 * 2.0 + 200 * 1.75 + 200 * 1.5 + (plotArea - 500) * 1.25) / plotArea;
  } else if (occupancy === 'multi_unit') {
    baseFar = 1.75;
  } else if (occupancy === 'group_housing') {
    baseFar = 1.5;
  } else if (occupancy === 'commercial') {
    baseFar = roadWidth >= 18 ? 2.0 : 1.5;
  }

  const basePermissibleArea = plotArea * baseFar;
  const isPurchasableFarNeeded = proposedBuiltUpArea > basePermissibleArea;

  if (isPurchasableFarNeeded && roadWidth < 12) {
    conflicts.push({
      id: 'purchasable_far_road_width',
      code: 'ERR-CH09-PURCHASABLE-ROAD',
      severity: 'conflict',
      title: 'Purchasable FAR Strictly Barred on Roads < 12.0m',
      chapterRef: 'Chapter 9.2.1',
      byelawClause: 'Clause 9.2.1.1: Road Width Threshold for Purchasable FAR',
      description: `Proposed built-up area (${proposedBuiltUpArea} sqm) exceeds Base FAR capacity (${basePermissibleArea.toFixed(1)} sqm), requiring purchasable FAR. However, Chapter 9.2.1 prohibits purchasing extra FAR on roads narrower than 12m.`,
      detectedValues: {
        fieldA: 'Proposed Area vs Base Limit',
        valueA: `${proposedBuiltUpArea} sqm > ${basePermissibleArea.toFixed(1)} sqm`,
        fieldB: 'Abutting Road Width',
        valueB: `${roadWidth}m (Mandatory: ≥ 12.0m for Purchasable FAR)`,
      },
      statutoryRuleSummary: 'Purchasable FAR is only sanctioned along designated master plan roads of 12m, 18m, or 24m right-of-way with appropriate infrastructure loading fee.',
      remedyActionTitle: 'Upgrade Road Width to 12.0m (or clamp area to Base FAR)',
      autoFix: () => ({ roadWidth: 12.0 }),
    });
  }

  // 5. Maximum Capacity Envelope Exceeded (Base + Max Purchasable + Green Incentive)
  let maxPurchasableRatio = 0;
  if (roadWidth >= 24) maxPurchasableRatio = 1.0;
  else if (roadWidth >= 18) maxPurchasableRatio = 0.75;
  else if (roadWidth >= 12) maxPurchasableRatio = 0.5;

  let greenBonusRatio = 0;
  if (greenRating === 'platinum') greenBonusRatio = 0.07;
  else if (greenRating === 'gold') greenBonusRatio = 0.05;
  else if (greenRating === 'silver') greenBonusRatio = 0.03;

  const totalMaxPermissibleArea = plotArea * (baseFar + maxPurchasableRatio + greenBonusRatio);

  if (proposedBuiltUpArea > totalMaxPermissibleArea * 1.02) {
    conflicts.push({
      id: 'max_capacity_exceeded',
      code: 'ERR-CH09-TOTAL-CAPACITY',
      severity: 'fatal',
      title: 'Proposed Area Exceeds Absolute Maximum Permissible Bulk',
      chapterRef: 'Chapter 3 & Chapter 9',
      byelawClause: 'Clause 9.2.3: Ceiling on Aggregate Floor Area Ratio',
      description: `Proposed built-up area of ${proposedBuiltUpArea} sqm exceeds the maximum statutory limit of ${totalMaxPermissibleArea.toFixed(1)} sqm (Base FAR ${baseFar.toFixed(2)} + Purchasable ${maxPurchasableRatio} + Green Bonus ${(greenBonusRatio * 100).toFixed(0)}%). This cannot be sanctioned even under compounding.`,
      detectedValues: {
        fieldA: 'Proposed Built-Up Area',
        valueA: `${proposedBuiltUpArea} sqm`,
        fieldB: 'Absolute Permissible Ceiling',
        valueB: `${totalMaxPermissibleArea.toFixed(1)} sqm`,
      },
      statutoryRuleSummary: 'Total FAR cannot exceed the statutory envelope. Any construction beyond this ceiling violates Section 15 of UP Urban Planning & Development Act 1973.',
      remedyActionTitle: `Clamp Built-Up Area to ${Math.floor(totalMaxPermissibleArea)} sqm`,
      autoFix: () => ({ proposedBuiltUpArea: Math.floor(totalMaxPermissibleArea) }),
    });
  }

  // 6. Corner Plot Secondary Frontage Setback Rule (Table 3.2.1 Note 2)
  if (isCornerPlot && side2Provided < frontSetbackProvided) {
    conflicts.push({
      id: 'corner_plot_side_setback',
      code: 'WARN-CH03-CORNER-SETBACK',
      severity: 'conflict',
      title: 'Corner Plot Secondary Road Setback Deficit',
      chapterRef: 'Chapter 3.2.1',
      byelawClause: 'Table 3.2.1 Note 2: Dual Frontage on Corner Plots',
      description: `On a corner plot, Side Setback 2 faces the secondary road. Under Table 3.2.1 Note 2, Side Setback 2 must be maintained equal to the required front setback (provided: ${side2Provided}m, front: ${frontSetbackProvided}m).`,
      detectedValues: {
        fieldA: 'Corner Plot Status',
        valueA: 'Enabled (Dual Frontage)',
        fieldB: 'Side Setback 2 Provided',
        valueB: `${side2Provided}m vs Front Setback ${frontSetbackProvided}m`,
      },
      statutoryRuleSummary: 'To prevent sight-line obstruction at road junctions, corner plots must observe full front setbacks on both abutting roads.',
      remedyActionTitle: `Align Side Setback 2 to Front Setback (${frontSetbackProvided}m)`,
      autoFix: () => ({ side2Provided: frontSetbackProvided }),
    });
  }

  // 7. High-Rise Fire Progressive Setback Non-Compoundability (Chapter 16.3.2 & 8)
  if (isHighRise) {
    // Find required high-rise setback from table
    const hrRule = HIGH_RISE_SETBACKS.find((r) => buildingHeight >= r.minHeight && buildingHeight < r.maxHeight)
      || HIGH_RISE_SETBACKS[HIGH_RISE_SETBACKS.length - 1];
    const reqSetback = hrRule ? Math.max(hrRule.front, hrRule.rear, hrRule.side1, hrRule.side2) : 6.0;

    const minProvided = Math.min(frontSetbackProvided, rearSetbackProvided, side1Provided, side2Provided);
    if (minProvided < reqSetback) {
      conflicts.push({
        id: 'high_rise_fire_setback_deficit',
        code: 'ERR-CH16-FIRE-SETBACK-FATAL',
        severity: 'fatal',
        title: 'Non-Compoundable Fire Tender Setback Violation',
        chapterRef: 'Chapter 8 & Chapter 16.3.2',
        byelawClause: 'Clause 16.3.2 (ii): Non-Compoundable Building Deviations',
        description: `Building height is ${buildingHeight}m, which mandates a continuous all-around open space of ${reqSetback}m for fire tender movement. Current minimum provided setback is ${minProvided}m. Chapter 16.3.2 strictly prohibits compounding of fire safety setbacks!`,
        detectedValues: {
          fieldA: 'Mandatory Fire Setback',
          valueA: `≥ ${reqSetback}m on all sides`,
          fieldB: 'Minimum Provided Setback',
          valueB: `${minProvided}m (Deficit: ${(reqSetback - minProvided).toFixed(1)}m)`,
        },
        statutoryRuleSummary: 'Encroachment into statutory fire tender turning radii and progressive setbacks cannot be compounded under any compounding schedule.',
        remedyActionTitle: `Set All 4 Setbacks to ${reqSetback}m`,
        autoFix: () => ({
          frontSetbackProvided: reqSetback,
          rearSetbackProvided: reqSetback,
          side1Provided: reqSetback,
          side2Provided: reqSetback,
        }),
      });
    }
  }

  // 8. Mandatory Rainwater Harvesting (Chapter 12.1)
  if (plotArea > 300 && !hasRWH) {
    conflicts.push({
      id: 'missing_rwh_prerequisite',
      code: 'REQ-CH12-RWH-MANDATORY',
      severity: 'prerequisite',
      title: 'Mandatory Rainwater Harvesting (RWH) Missing',
      chapterRef: 'Chapter 12.1',
      byelawClause: 'Clause 12.1.1: Environmental Mandate for Plots > 300 sqm',
      description: `Plot area is ${plotArea} sqm (> 300 sqm threshold). Chapter 12 mandates an engineered groundwater recharging pit with silt trap and desilting chamber before any plan sanction.`,
      detectedValues: {
        fieldA: 'Plot Area',
        valueA: `${plotArea} sqm (> 300 sqm)`,
        fieldB: 'RWH Provision',
        valueB: 'Disabled / Missing',
      },
      statutoryRuleSummary: 'Groundwater recharge capacity must equal 10 liters/sqm of rooftop catchment area as per CGWA & UP Ground Water Act 2020.',
      remedyActionTitle: 'Enable Mandatory Rainwater Harvesting (RWH)',
      autoFix: () => ({ hasRWH: true }),
    });
  }

  // 9. Mandatory Solar Water Heating (Chapter 12.4)
  if ((plotArea > 500 || occupancy === 'commercial' || occupancy === 'group_housing') && !hasSolarHeating) {
    conflicts.push({
      id: 'missing_solar_prerequisite',
      code: 'REQ-CH12-SOLAR-MANDATORY',
      severity: 'prerequisite',
      title: 'Solar Water Heating System Mandatory for Large/Commercial Plots',
      chapterRef: 'Chapter 12.4',
      byelawClause: 'Clause 12.4.2: Solar Heating Mandate for Plots > 500 sqm',
      description: `For plots exceeding 500 sqm or multi-family/commercial occupancies, Chapter 12.4 requires rooftop solar thermal collectors sized for minimum 100 liters/day per 100 sqm built-up area.`,
      detectedValues: {
        fieldA: 'Plot Area / Occupancy',
        valueA: `${plotArea} sqm (${occupancy})`,
        fieldB: 'Solar Heating Provision',
        valueB: 'Disabled / Missing',
      },
      statutoryRuleSummary: 'Mandatory installation of rooftop solar hot water generation to reduce peak grid electrical draw.',
      remedyActionTitle: 'Enable Solar Water Heating System',
      autoFix: () => ({ hasSolarHeating: true }),
    });
  }

  // 10. Physical Setback Geometric Feasibility Check
  // Approximate plot depth = plotArea / plotFrontage
  const approxDepth = plotFrontage > 0 ? plotArea / plotFrontage : 0;
  const buildableWidth = plotFrontage - (side1Provided + side2Provided);
  const buildableDepth = approxDepth - (frontSetbackProvided + rearSetbackProvided);

  if (buildableWidth <= 2 || buildableDepth <= 2) {
    conflicts.push({
      id: 'geometric_setback_squeeze',
      code: 'ERR-GEOM-ZERO-ENVELOPE',
      severity: 'fatal',
      title: 'Setbacks Exhaust Physical Plot Dimensions',
      chapterRef: 'Chapter 3 (Structural Feasibility)',
      byelawClause: 'Physical Envelope Feasibility',
      description: `With a plot frontage of ${plotFrontage}m and estimated depth of ${approxDepth.toFixed(1)}m, the provided setbacks leave a residual buildable envelope of only ${Math.max(0, buildableWidth).toFixed(1)}m wide × ${Math.max(0, buildableDepth).toFixed(1)}m deep. This is structurally unviable.`,
      detectedValues: {
        fieldA: 'Plot Frontage × Est. Depth',
        valueA: `${plotFrontage}m × ${approxDepth.toFixed(1)}m`,
        fieldB: 'Residual Buildable Footprint',
        valueB: `${Math.max(0, buildableWidth).toFixed(1)}m × ${Math.max(0, buildableDepth).toFixed(1)}m`,
      },
      statutoryRuleSummary: 'Proposed setbacks must leave an optically sound buildable envelope meeting minimum room dimensions (min 2.4m width).',
      remedyActionTitle: 'Adjust Setbacks or Increase Plot Frontage',
      autoFix: () => ({
        plotFrontage: Math.max(plotFrontage, 16),
        frontSetbackProvided: 3.0,
        rearSetbackProvided: 2.0,
        side1Provided: 1.2,
        side2Provided: 1.2,
      }),
    });
  }

  return conflicts;
}
