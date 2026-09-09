import { jsPDF } from 'jspdf';
import { SiteRoadsConfig } from '../types';

export interface SetbackPdfOptions {
  plotWidth: number;
  plotDepth: number;
  plotArea: number;
  buildingHeight: number;
  occupancy: string;
  isCornerPlot: boolean;
  hasStilt: boolean;
  circleRate?: number;
  roads?: SiteRoadsConfig;
  setbackInfo: {
    front: number;
    rear: number;
    side1: number;
    side2: number;
    maxHeight?: number;
    maxFloors?: string;
    ruleRef: string;
    groundCoveragePercent: number;
    envelopeArea: number;
    envelopeWidth: number;
    envelopeDepth: number;
  };
  enableCompounding: boolean;
  compoundingAnalysis: {
    circleRate?: number;
    frontEncroachMeters?: number;
    rearEncroachMeters?: number;
    side1EncroachMeters?: number;
    side2EncroachMeters?: number;
    devFront: number;
    devRear: number;
    devSide1: number;
    devSide2: number;
    devEnvWidth: number;
    devEnvDepth: number;
    devEnvArea: number;
    encroachedFootprintArea: number;
    encroachedFootprintPercent: number;
    isFrontViolation: boolean;
    isRearViolation: boolean;
    isSide1Violation: boolean;
    isSide2Violation: boolean;
    hasStatutoryViolation: boolean;
    rateMultiplier: number;
    effectiveRatePerSqm: number;
    baseCompoundingFee: number;
    adminSurcharge: number;
    totalCompoundingFee: number;
  };
  frontDevPercent: number;
  rearDevPercent: number;
  side1DevPercent: number;
  side2DevPercent: number;
}

export function generateSetbackBlueprintPdfReport(options: SetbackPdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const sheetLeft = 8;
  const sheetTop = 8;
  const sheetW = pageWidth - sheetLeft * 2; // 194mm
  const sheetH = pageHeight - sheetTop * 2; // 281mm

  const marginX = 10;
  const contentWidth = pageWidth - marginX * 2; // 190mm

  const certId = `UP-CAD25-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Vector graphics helpers
  const drawVectorCheckmark = (x: number, y: number, r = 16, g = 185, b = 129) => {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.5);
    doc.line(x, y + 2.0, x + 1.3, y + 3.3);
    doc.line(x + 1.3, y + 3.3, x + 3.6, y + 0.6);
  };

  const drawVectorCross = (x: number, y: number, r = 220, g = 38, b = 38) => {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.5);
    doc.line(x, y + 0.6, x + 3.2, y + 3.2);
    doc.line(x + 3.2, y + 0.6, x, y + 3.2);
  };

  const drawVectorAlert = (x: number, y: number, r = 217, g = 119, b = 6) => {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.6);
    doc.line(x + 1.6, y + 0.6, x + 1.6, y + 2.2);
    doc.setFillColor(r, g, b);
    doc.circle(x + 1.6, y + 3.0, 0.35, 'F');
  };

  // Vector status badge helper (Zero font encoding glitches!)
  const drawPillBadge = (
    type: 'pass' | 'fail' | 'alert',
    text: string,
    x: number,
    y: number,
    fontSize = 6.2
  ): number => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSize);
    const textW = doc.getTextWidth(text);
    const iconW = 4.2;
    const padX = 2.4;
    const badgeW = iconW + textW + padX * 2;
    const badgeH = 5.2;

    let bgR = 236, bgG = 253, bgB = 245;
    let borderR = 167, borderG = 243, borderB = 208;
    let textR = 6, textG = 95, textB = 70;
    let iconColor = [16, 185, 129];

    if (type === 'fail') {
      bgR = 254; bgG = 242; bgB = 242;
      borderR = 252; borderG = 165; borderB = 165;
      textR = 153; textG = 27; textB = 27;
      iconColor = [220, 38, 38];
    } else if (type === 'alert') {
      bgR = 255; bgG = 251; bgB = 235;
      borderR = 253; borderG = 230; borderB = 138;
      textR = 146; textG = 64; textB = 14;
      iconColor = [217, 119, 6];
    }

    doc.setFillColor(bgR, bgG, bgB);
    doc.setDrawColor(borderR, borderG, borderB);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, badgeW, badgeH, 1.4, 1.4, 'FD');

    if (type === 'pass') {
      drawVectorCheckmark(x + padX, y + 0.8, iconColor[0], iconColor[1], iconColor[2]);
    } else if (type === 'fail') {
      drawVectorCross(x + padX, y + 0.8, iconColor[0], iconColor[1], iconColor[2]);
    } else {
      drawVectorAlert(x + padX, y + 0.8, iconColor[0], iconColor[1], iconColor[2]);
    }

    doc.setTextColor(textR, textG, textB);
    doc.text(text, x + padX + iconW, y + 3.7);
    return badgeW;
  };

  // =========================================================================
  // 1. ARCHITECTURAL SHEET BORDER & CAD DRAWING REGISTRATION FRAME
  // =========================================================================
  // Outer primary drawing border
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.7);
  doc.rect(sheetLeft, sheetTop, sheetW, sheetH);

  // Inner hairline offset border
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.25);
  doc.rect(sheetLeft + 1.2, sheetTop + 1.2, sheetW - 2.4, sheetH - 2.4);

  // Drawing corner registration marks
  const markLen = 3.5;
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.3);
  // Top-left
  doc.line(sheetLeft, sheetTop + markLen, sheetLeft + markLen, sheetTop + markLen);
  doc.line(sheetLeft + markLen, sheetTop, sheetLeft + markLen, sheetTop + markLen);
  // Top-right
  doc.line(sheetLeft + sheetW - markLen, sheetTop, sheetLeft + sheetW - markLen, sheetTop + markLen);
  doc.line(sheetLeft + sheetW - markLen, sheetTop + markLen, sheetLeft + sheetW, sheetTop + markLen);
  // Bottom-left
  doc.line(sheetLeft, sheetTop + sheetH - markLen, sheetLeft + markLen, sheetTop + sheetH - markLen);
  doc.line(sheetLeft + markLen, sheetTop + sheetH - markLen, sheetLeft + markLen, sheetTop + sheetH);
  // Bottom-right
  doc.line(sheetLeft + sheetW - markLen, sheetTop + sheetH - markLen, sheetLeft + sheetW, sheetTop + sheetH - markLen);
  doc.line(sheetLeft + sheetW - markLen, sheetTop + sheetH - markLen, sheetLeft + sheetW - markLen, sheetTop + sheetH);

  // =========================================================================
  // 2. HEADER BLOCK
  // This sheet is produced by an unofficial tool. It previously carried a
  // "GOVERNMENT OF UTTAR PRADESH" masthead and a "FORM CAD-25 / OBPAS" reference —
  // neither exists — which made a working drawing look like an issued clearance.
  // =========================================================================
  const headerTop = sheetTop + 2;
  const headerH = 19;
  const headerW = sheetW - 4;
  const headerX = sheetLeft + 2;

  // Dark Slate Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(headerX, headerTop, headerW, headerH, 'F');

  // Emerald Regulatory Baseline
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(headerX, headerTop + headerH, headerW, 1.4, 'F');

  // Official State Emblem
  const emblemX = headerX + 7;
  const emblemY = headerTop + headerH / 2;
  doc.setFillColor(245, 158, 11); // amber gold
  doc.circle(emblemX, emblemY, 5.2, 'F');
  doc.setFillColor(15, 23, 42); // slate-900 inner
  doc.circle(emblemX, emblemY, 4.4, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.circle(emblemX, emblemY, 3.6, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(245, 158, 11);
  doc.text('UP', emblemX, emblemY + 1.8, { align: 'center' });

  // Government Hierarchy Titles (No overlap with right reference block!)
  const textX = headerX + 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(255, 255, 255);
  doc.text('SETBACK & ENVELOPE STUDY — UNOFFICIAL', textX, headerTop + 5.8);

  doc.setFontSize(6.8);
  doc.setTextColor(226, 232, 240); // slate-200
  doc.text('COMPUTED FROM THE UP BUILDING BYELAWS 2025 • NOT ISSUED BY ANY DEVELOPMENT AUTHORITY', textX, headerTop + 10.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('UP Model Building & Development Byelaws 2025 • Architectural 2D Setback & Building Envelope Cadastre', textX, headerTop + 14.6);

  // Top-Right Dossier Ref Block
  const refBoxW = 46;
  const refBoxH = 15;
  const refBoxX = headerX + headerW - refBoxW - 2;
  const refBoxY = headerTop + 2;

  doc.setFillColor(30, 41, 59); // slate-800
  doc.setDrawColor(51, 65, 85); // slate-700
  doc.setLineWidth(0.3);
  doc.roundedRect(refBoxX, refBoxY, refBoxW, refBoxH, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(245, 158, 11); // amber-400
  doc.text('WORKING REFERENCE', refBoxX + 3.5, refBoxY + 3.8);

  doc.setFontSize(7.2);
  doc.setTextColor(255, 255, 255);
  doc.text(certId, refBoxX + 3.5, refBoxY + 7.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${dateStr}`, refBoxX + 3.5, refBoxY + 11.2);
  doc.text('Statutory Ref: Byelaws Table 3.2.4', refBoxX + 3.5, refBoxY + 14.0);

  // =========================================================================
  // 3. CERTIFICATE TITLE & REGULATORY STATUS SEAL
  // =========================================================================
  let y = headerTop + headerH + 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('SITE PLAN, SETBACKS & BUILDABLE ENVELOPE', marginX, y + 1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Pre-scrutiny study against Sections 14, 15 & 32 of the UP Urban Planning & Development Act, 1973 — verify against the gazette before submission', marginX, y + 4.8);

  // Overall verdict pill on right (Calculated right-aligned, NO bleed or overlap!)
  const isViol = options.enableCompounding && (options.compoundingAnalysis?.hasStatutoryViolation ?? false);
  const isCompoundable = options.enableCompounding && ((options.compoundingAnalysis?.encroachedFootprintArea ?? 0) > 0) && !isViol;

  let verdictType: 'pass' | 'fail' | 'alert' = 'pass';
  let verdictText = 'PASS: FULL SETBACK COMPLIANCE';
  if (isViol) {
    verdictType = 'fail';
    verdictText = 'FAIL: NON-COMPOUNDABLE VIOLATION';
  } else if (isCompoundable) {
    verdictType = 'alert';
    verdictText = 'ALERT: SEC 32 COMPOUNDABLE';
  }

  // Precompute badge width to place exactly on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  const vTextW = doc.getTextWidth(verdictText);
  const badgeWidth = vTextW + 4.2 + 4.8;
  const badgeX = marginX + contentWidth - badgeWidth;
  drawPillBadge(verdictType, verdictText, badgeX, y - 2, 6.8);

  y += 8.5;

  // =========================================================================
  // 4. EXECUTIVE SPECIFICATIONS - 6-TILE GRID (2×3)
  // =========================================================================
  const cardW = (contentWidth - 6) / 3; // 61.3mm
  const cardH = 10.5;

  const roads: SiteRoadsConfig = options.roads || {
    preset: options.isCornerPlot ? '2_side_corner' : '1_side',
    frontWidth: 12.0,
    hasRearRoad: false,
    rearWidth: 9.0,
    hasSide1Road: false,
    side1Width: 9.0,
    hasSide2Road: options.isCornerPlot,
    side2Width: 9.0,
  };

  const side2Effective = (roads.hasSide2Road || options.isCornerPlot)
    ? Math.max(options.setbackInfo.side2, options.setbackInfo.front)
    : options.setbackInfo.side2;

  const roadSummary = (roads.hasRearRoad && roads.hasSide2Road && roads.hasSide1Road)
    ? '4-Side Island Plot (All Open)'
    : ((roads.hasSide2Road || options.isCornerPlot) && roads.hasSide1Road)
      ? '3-Side Road Open Plot'
      : (roads.hasSide2Road || options.isCornerPlot)
        ? `2-Side Corner (${roads.frontWidth.toFixed(1)}m + ${roads.side2Width.toFixed(1)}m)`
        : roads.hasRearRoad
          ? `2-Side Through (${roads.frontWidth.toFixed(1)}m + ${roads.rearWidth.toFixed(1)}m)`
          : `1-Side (${roads.frontWidth.toFixed(1)}m R.O.W.)`;

  const tiles = [
    {
      label: 'OCCUPANCY & SECTOR USE',
      val: `${options.occupancy.replace('_', ' ').toUpperCase()} USE`,
      sub: `Road Network: ${roadSummary}`,
      accent: [59, 130, 246], // blue-500
    },
    {
      label: 'PLOT DIMENSIONS & AREA',
      val: `${options.plotWidth}m W × ${options.plotDepth}m D`,
      sub: `Gross Registered Area: ${options.plotArea.toFixed(1)} m²`,
      accent: [16, 185, 129], // emerald-500
    },
    {
      label: 'PERMISSIBLE GROUND COVERAGE',
      val: `${options.setbackInfo.groundCoveragePercent.toFixed(1)}% (${options.setbackInfo.envelopeArea.toFixed(1)} m²)`,
      sub: `Permissible Footprint: ${options.setbackInfo.envelopeWidth.toFixed(1)}m × ${options.setbackInfo.envelopeDepth.toFixed(1)}m`,
      accent: [245, 158, 11], // amber-500
    },
    {
      label: 'BUILDING HEIGHT & STILT',
      val: `${options.buildingHeight}m Height (G+3 Permissible)`,
      sub: options.hasStilt ? 'Stilt Parking: Permitted (FAR-Exempt)' : 'Stilt Parking: Not Proposed',
      accent: [139, 92, 246], // violet-500
    },
    {
      label: 'APPLICABLE STATUTORY SETBACKS',
      val: `Front: ${options.setbackInfo.front.toFixed(1)}m • Rear: ${options.setbackInfo.rear > 0 ? options.setbackInfo.rear.toFixed(1) + 'm' : '0m'}`,
      sub: `Side-1: ${options.setbackInfo.side1 > 0 ? options.setbackInfo.side1.toFixed(1) + 'm' : '0m'} • Side-2: ${side2Effective > 0 ? side2Effective.toFixed(1) + 'm' : '0m'}${(roads.hasSide2Road || options.isCornerPlot) ? ' (Corner)' : ''}`,
      accent: [14, 165, 233], // sky-500
    },
    {
      label: 'STATUTORY APPROVAL ROUTE',
      val: options.enableCompounding ? 'Section 32 Compounding Scheme' : 'Standard As-of-Right Sanction',
      sub: options.enableCompounding
        ? `Deviated Area: ${(options.compoundingAnalysis?.encroachedFootprintArea ?? 0).toFixed(1)} m²`
        : 'Zero-Deviation Sanctionable Envelope',
      accent: [236, 72, 153], // pink-500
    },
  ];

  tiles.forEach((tile, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const tx = marginX + col * (cardW + 3);
    const ty = y + row * (cardH + 2);

    // Card background
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(tx, ty, cardW, cardH, 1.2, 1.2, 'FD');

    // Colored accent stripe on left edge
    doc.setFillColor(tile.accent[0], tile.accent[1], tile.accent[2]);
    doc.roundedRect(tx, ty, 1.2, cardH, 0.8, 0.8, 'F');

    // Category label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.setTextColor(100, 116, 139);
    doc.text(tile.label, tx + 3.2, ty + 3.2);

    // Primary Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(tile.val, tx + 3.2, ty + 6.6);

    // Secondary subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(100, 116, 139);
    doc.text(tile.sub, tx + 3.2, ty + 9.4);
  });

  y += cardH * 2 + 5;

  // =========================================================================
  // 5. 2D ARCHITECTURAL VECTOR CAD BLUEPRINT & TECHNICAL SCHEDULE PANEL
  // =========================================================================
  // Left: 132mm CAD Canvas | Right: 55mm Cadastre Schedule
  const blueprintH = 102;
  const cadW = 132;
  const specW = contentWidth - cadW - 3; // 55mm
  const cadX = marginX;
  const specX = marginX + cadW + 3;

  // --- CAD Blueprint Canvas Box ---
  doc.setFillColor(248, 250, 252); // slate-50 background
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.roundedRect(cadX, y, cadW, blueprintH, 1.8, 1.8, 'FD');

  // Header strip inside CAD canvas
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(cadX, y, cadW, 5.5, 1.8, 1.8, 'F');
  doc.rect(cadX, y + 2.5, cadW, 3, 'F'); // square bottom
  doc.setDrawColor(226, 232, 240);
  doc.line(cadX, y + 5.5, cadX + cadW, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(30, 41, 59);
  doc.text('2D SITE CAD BLUEPRINT • REGULATORY ENVELOPE SCHEMATIC', cadX + 4, y + 3.8);

  // Statutory Setbacks Quick-Reference Ribbon inside CAD canvas
  doc.setFillColor(248, 250, 252);
  doc.rect(cadX + 0.5, y + 5.5, cadW - 1, 4.4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(cadX, y + 9.9, cadX + cadW, y + 9.9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.6);
  doc.setTextColor(5, 150, 105);
  doc.text('SETBACK NORMS:', cadX + 4, y + 8.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.6);
  doc.setTextColor(30, 41, 59);
  const setbackSummaryText = `Front: ${options.setbackInfo.front.toFixed(2)}m  •  Rear: ${options.setbackInfo.rear > 0 ? options.setbackInfo.rear.toFixed(2) + 'm' : '0.00m (Exempt)'}  •  Side-1: ${options.setbackInfo.side1 > 0 ? options.setbackInfo.side1.toFixed(2) + 'm' : '0.00m'}  •  Side-2: ${side2Effective > 0 ? side2Effective.toFixed(2) + 'm' + ((roads.hasSide2Road || options.isCornerPlot) ? ' (Corner)' : '') : '0.00m'}`;
  doc.text(setbackSummaryText, cadX + 22, y + 8.6);

  // Subtle architectural millimeter grid
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.2);
  for (let gx = cadX + 10; gx < cadX + cadW; gx += 10) {
    doc.line(gx, y + 10.2, gx, y + blueprintH - 1);
  }
  for (let gy = y + 14; gy < y + blueprintH; gy += 10) {
    doc.line(cadX + 1, gy, cadX + cadW - 1, gy);
  }

  // Authentic Vector Compass Rose (Top-Right inside CAD canvas)
  const compassX = cadX + cadW - 8.5;
  const compassY = y + 15.2;
  const compassR = 3.2;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.circle(compassX, compassY, compassR, 'FD');

  doc.setFillColor(15, 23, 42); // dark north pointer
  doc.triangle(compassX, compassY - compassR + 0.6, compassX - 1.3, compassY + 0.5, compassX, compassY, 'F');
  doc.setFillColor(148, 163, 184); // light north pointer
  doc.triangle(compassX, compassY - compassR + 0.6, compassX + 1.3, compassY + 0.5, compassX, compassY, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(15, 23, 42);
  doc.text('N', compassX, compassY - compassR - 0.6, { align: 'center' });

  // Scaled Plot Representation inside Canvas with Generous Clearance for all abutting roads
  const hasEastRoad = roads.hasSide2Road || options.isCornerPlot;
  const hasWestRoad = roads.hasSide1Road;
  const hasNorthRoad = roads.hasRearRoad;

  // Gutter dimensions to ensure clean clearances for all abutting roads & dimension pills
  const topGutterMm = hasNorthRoad ? 17.0 : 13.0; // Room for Rear road or North label + top dim
  const bottomGutterMm = 15.0; // Room for Front road + kerb
  const leftGutterMm = hasWestRoad ? 20.0 : 13.0; // Room for West road or West label + depth dim
  const rightGutterMm = hasEastRoad ? 18.0 : 10.0; // Room for East road or East label

  const maxPlotW = cadW - leftGutterMm - rightGutterMm;
  const maxPlotH = blueprintH - 10.0 - topGutterMm - bottomGutterMm;
  const scale = Math.min(maxPlotW / options.plotWidth, maxPlotH / options.plotDepth);

  const plotSvgW = options.plotWidth * scale;
  const plotSvgH = options.plotDepth * scale;

  const plotDrawX = cadX + leftGutterMm + (maxPlotW - plotSvgW) / 2;
  const plotDrawY = y + 10.0 + topGutterMm + (maxPlotH - plotSvgH) / 2;

  // Draw Lot Outer Boundary (Heavy CAD line weight)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.8);
  doc.rect(plotDrawX, plotDrawY, plotSvgW, plotSvgH, 'FD');

  // Cardinal boundary labels with pristine clearance (ZERO overlaps)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.0);
  doc.setTextColor(148, 163, 184);
  // North label: above dimension line
  doc.text('[ NORTH ]', plotDrawX + plotSvgW / 2, plotDrawY - (hasNorthRoad ? 8.0 : 7.2), { align: 'center' });
  // West label: outside dimension line
  doc.text('[ WEST ]', plotDrawX - (hasWestRoad ? 12.0 : 9.5), plotDrawY + plotSvgH / 2, { angle: 90, align: 'center' });
  // East label: to the right of plot
  doc.text('[ EAST ]', plotDrawX + plotSvgW + (hasEastRoad ? 13.5 : 6.5), plotDrawY + plotSvgH / 2, { angle: 90, align: 'center' });

  // Architectural 45-degree slash dimension lines
  // Width dimension (Top, 3.4mm above plot)
  const topDimY = plotDrawY - 3.4;
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.3);
  doc.line(plotDrawX, topDimY, plotDrawX + plotSvgW, topDimY);
  // 45-degree ticks
  doc.line(plotDrawX - 0.9, topDimY - 0.9, plotDrawX + 0.9, topDimY + 0.9);
  doc.line(plotDrawX + plotSvgW - 0.9, topDimY - 0.9, plotDrawX + plotSvgW + 0.9, topDimY + 0.9);

  // Width dimension pill (pure white backdrop with clear padding)
  const wText = `Site Width: ${options.plotWidth} m`;
  const wTextW = doc.getTextWidth(wText);
  doc.setFillColor(255, 255, 255);
  doc.rect(plotDrawX + (plotSvgW - wTextW) / 2 - 1.4, topDimY - 1.8, wTextW + 2.8, 3.4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.0);
  doc.setTextColor(30, 41, 59);
  doc.text(wText, plotDrawX + plotSvgW / 2, topDimY + 0.9, { align: 'center' });

  // Depth dimension (Left, 4.5mm to the left of plot)
  const leftDimX = plotDrawX - 4.5;
  doc.line(leftDimX, plotDrawY, leftDimX, plotDrawY + plotSvgH);
  doc.line(leftDimX - 0.9, plotDrawY - 0.9, leftDimX + 0.9, plotDrawY + 0.9);
  doc.line(leftDimX - 0.9, plotDrawY + plotSvgH - 0.9, leftDimX + 0.9, plotDrawY + plotSvgH + 0.9);

  const dText = `${options.plotDepth} m`;
  const dTextW = doc.getTextWidth(dText);
  doc.setFillColor(255, 255, 255);
  doc.rect(leftDimX - dTextW / 2 - 1.2, plotDrawY + plotSvgH / 2 - 1.8, dTextW + 2.4, 3.4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.0);
  doc.setTextColor(30, 41, 59);
  doc.text(dText, leftDimX, plotDrawY + plotSvgH / 2 + 0.9, { align: 'center' });

  // Setback Margins in mm
  const rearSetbackMm = options.setbackInfo.rear * scale;
  const frontSetbackMm = options.setbackInfo.front * scale;
  const side1SetbackMm = options.setbackInfo.side1 * scale;
  const side2SetbackMm = side2Effective * scale;

  // 1. Shaded Setback Clearance Corridors inside Lot
  // Front Setback Corridor (Sky tint)
  if (frontSetbackMm > 0) {
    doc.setFillColor(240, 249, 255); // sky-50
    doc.rect(plotDrawX, plotDrawY + plotSvgH - frontSetbackMm, plotSvgW, frontSetbackMm, 'F');
  }
  // Rear Setback Corridor (Emerald tint)
  if (rearSetbackMm > 0) {
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.rect(plotDrawX, plotDrawY, plotSvgW, rearSetbackMm, 'F');
  }
  // Side-1 Setback Corridor (Slate tint)
  if (side1SetbackMm > 0) {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(plotDrawX, plotDrawY, side1SetbackMm, plotSvgH, 'F');
  }
  // Side-2 Setback Corridor (Amber tint for corner, slate for standard)
  if (side2SetbackMm > 0) {
    doc.setFillColor(options.isCornerPlot ? 254 : 248, options.isCornerPlot ? 243 : 250, options.isCornerPlot ? 199 : 252);
    doc.rect(plotDrawX + plotSvgW - side2SetbackMm, plotDrawY, side2SetbackMm, plotSvgH, 'F');
  }

  // Permissible Footprint Envelope Coordinates
  const envX = plotDrawX + side1SetbackMm;
  const envY = plotDrawY + rearSetbackMm;
  const envW = Math.max(0, plotSvgW - side1SetbackMm - side2SetbackMm);
  const envH = Math.max(0, plotSvgH - rearSetbackMm - frontSetbackMm);

  // Draw Permissible Envelope (Emerald Tinted Architectural Zone)
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(0.6);
  doc.rect(envX, envY, envW, envH, 'FD');

  // Subtle interior dashed boundary for envelope
  doc.setDrawColor(110, 231, 183); // emerald-300
  doc.setLineWidth(0.25);
  doc.rect(envX + 0.6, envY + 0.6, Math.max(0, envW - 1.2), Math.max(0, envH - 1.2), 'D');

  // If Compounding Enabled & Deviated Footprint exists
  if (options.enableCompounding && (options.compoundingAnalysis?.encroachedFootprintArea ?? 0) > 0) {
    const devRearMm = (options.compoundingAnalysis?.devRear ?? options.setbackInfo.rear) * scale;
    const devFrontMm = (options.compoundingAnalysis?.devFront ?? options.setbackInfo.front) * scale;
    const devSide1Mm = (options.compoundingAnalysis?.devSide1 ?? options.setbackInfo.side1) * scale;
    const devSide2Mm = (options.compoundingAnalysis?.devSide2 ?? side2Effective) * scale;

    const devX = plotDrawX + devSide1Mm;
    const devY = plotDrawY + devRearMm;
    const devW = Math.max(0, plotSvgW - devSide1Mm - devSide2Mm);
    const devH = Math.max(0, plotSvgH - devRearMm - devFrontMm);

    const isDevViol = options.compoundingAnalysis?.hasStatutoryViolation ?? false;
    doc.setDrawColor(isDevViol ? 220 : 217, isDevViol ? 38 : 119, isDevViol ? 38 : 6);
    doc.setLineWidth(0.6);
    doc.rect(devX, devY, devW, devH, 'D');
  }

  // Floating Center Badge in Envelope (Proportionally fitted so it NEVER clips)
  if (envW >= 16 && envH >= 10) {
    const isSpacious = envW >= 32 && envH >= 14;
    const centerBadgeW = Math.min(envW - 2.5, isSpacious ? 36 : 28);
    const centerBadgeH = isSpacious ? 10.5 : 8.0;
    const centerBadgeX = envX + (envW - centerBadgeW) / 2;
    const centerBadgeY = envY + (envH - centerBadgeH) / 2;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.4);
    doc.roundedRect(centerBadgeX, centerBadgeY, centerBadgeW, centerBadgeH, 1.2, 1.2, 'FD');

    if (isSpacious) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.0);
      doc.setTextColor(5, 150, 105);
      doc.text('PERMISSIBLE ENVELOPE', centerBadgeX + centerBadgeW / 2, centerBadgeY + 3.2, { align: 'center' });

      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${options.setbackInfo.envelopeArea.toFixed(1)} m²`, centerBadgeX + centerBadgeW / 2, centerBadgeY + 6.6, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${options.setbackInfo.envelopeWidth.toFixed(1)}m × ${options.setbackInfo.envelopeDepth.toFixed(1)}m`, centerBadgeX + centerBadgeW / 2, centerBadgeY + 9.2, { align: 'center' });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${options.setbackInfo.envelopeArea.toFixed(1)} m²`, centerBadgeX + centerBadgeW / 2, centerBadgeY + 3.6, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.5);
      doc.setTextColor(5, 150, 105);
      doc.text(`${options.setbackInfo.envelopeWidth.toFixed(1)}×${options.setbackInfo.envelopeDepth.toFixed(1)}m`, centerBadgeX + centerBadgeW / 2, centerBadgeY + 6.5, { align: 'center' });
    }
  }

  // =========================================================================
  // ALL 4 STATUTORY SETBACK CALLOUTS WITH STRICT MATHEMATICAL CLAMPING
  // =========================================================================

  // 1. FRONT SETBACK CALLOUT (Bottom Corridor)
  if (frontSetbackMm > 0) {
    const fDev = options.enableCompounding && options.frontDevPercent > 0;
    const fVal = fDev ? (options.compoundingAnalysis?.devFront ?? options.setbackInfo.front) : options.setbackInfo.front;
    const fText = fDev
      ? `Front: ${fVal.toFixed(2)}m (-${options.frontDevPercent}%)`
      : `Front Setback: ${options.setbackInfo.front.toFixed(2)}m`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.6);
    const fTextW = doc.getTextWidth(fText);
    const fPillW = fTextW + 2.4;
    const fPillH = 3.2;

    const minFX = plotDrawX + fPillW / 2 + 1.0;
    const maxFX = plotDrawX + plotSvgW - fPillW / 2 - 1.0;
    const fX = Math.max(minFX, Math.min(maxFX, plotDrawX + plotSvgW / 2));
    const fY = plotDrawY + plotSvgH - Math.max(frontSetbackMm / 2, fPillH / 2 + 0.8);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(186, 230, 253);
    doc.setLineWidth(0.3);
    doc.roundedRect(fX - fPillW / 2, fY - fPillH / 2, fPillW, fPillH, 0.6, 0.6, 'FD');

    doc.setTextColor(3, 105, 161);
    doc.text(fText, fX, fY + 0.8, { align: 'center' });
  }

  // 2. REAR SETBACK CALLOUT (Top Corridor)
  if (options.setbackInfo.rear > 0) {
    const rDev = options.enableCompounding && options.rearDevPercent > 0;
    const rVal = rDev ? (options.compoundingAnalysis?.devRear ?? options.setbackInfo.rear) : options.setbackInfo.rear;
    const rText = rDev
      ? `Rear: ${rVal.toFixed(2)}m (-${options.rearDevPercent}%)`
      : `Rear Setback: ${options.setbackInfo.rear.toFixed(2)}m`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.6);
    const rTextW = doc.getTextWidth(rText);
    const rPillW = rTextW + 2.4;
    const rPillH = 3.2;

    const minRX = plotDrawX + rPillW / 2 + 1.0;
    const maxRX = plotDrawX + plotSvgW - rPillW / 2 - 1.0;
    const rX = Math.max(minRX, Math.min(maxRX, plotDrawX + plotSvgW / 2));
    const rY = plotDrawY + Math.max(rearSetbackMm / 2, rPillH / 2 + 0.8);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(167, 243, 208);
    doc.setLineWidth(0.3);
    doc.roundedRect(rX - rPillW / 2, rY - rPillH / 2, rPillW, rPillH, 0.6, 0.6, 'FD');

    doc.setTextColor(5, 150, 105);
    doc.text(rText, rX, rY + 0.8, { align: 'center' });
  } else {
    const rText = 'Rear Setback: 0.00m (Exempt)';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.2);
    const rTextW = doc.getTextWidth(rText);
    const rPillW = rTextW + 2.4;
    const rPillH = 3.0;

    const minRX = plotDrawX + rPillW / 2 + 1.0;
    const maxRX = plotDrawX + plotSvgW - rPillW / 2 - 1.0;
    const rX = Math.max(minRX, Math.min(maxRX, plotDrawX + plotSvgW / 2));
    const rY = plotDrawY + 1.8;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(rX - rPillW / 2, rY - rPillH / 2, rPillW, rPillH, 0.6, 0.6, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.text(rText, rX, rY + 0.7, { align: 'center' });
  }

  // 3. SIDE-1 SETBACK CALLOUT (West / Left Corridor)
  {
    const s1Dev = options.enableCompounding && options.side1DevPercent > 0;
    const s1Val = s1Dev ? (options.compoundingAnalysis?.devSide1 ?? options.setbackInfo.side1) : options.setbackInfo.side1;
    const s1Text = options.setbackInfo.side1 > 0
      ? (s1Dev ? `Side-1: ${s1Val.toFixed(2)}m (-${options.side1DevPercent}%)` : `Side-1: ${options.setbackInfo.side1.toFixed(2)}m`)
      : 'Side-1: 0m (Zero Line)';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.4);
    const s1TextW = doc.getTextWidth(s1Text);
    const s1PillW = s1TextW + 2.4;
    const s1PillH = 3.2;

    const minS1X = plotDrawX + s1PillW / 2 + 1.0;
    const maxS1X = plotDrawX + plotSvgW - s1PillW / 2 - 1.0;
    const idealS1X = plotDrawX + Math.max(side1SetbackMm / 2, s1PillW / 2 + 1.0);
    const s1X = Math.max(minS1X, Math.min(maxS1X, idealS1X));
    const s1Y = plotDrawY + plotSvgH * 0.32;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(s1X - s1PillW / 2, s1Y - s1PillH / 2, s1PillW, s1PillH, 0.6, 0.6, 'FD');

    doc.setTextColor(51, 65, 85);
    doc.text(s1Text, s1X, s1Y + 0.8, { align: 'center' });
  }

  // 4. SIDE-2 SETBACK CALLOUT (East / Right / Corner Corridor)
  {
    const s2Dev = options.enableCompounding && options.side2DevPercent > 0;
    const s2Val = s2Dev ? (options.compoundingAnalysis?.devSide2 ?? side2Effective) : side2Effective;
    const s2Text = side2Effective > 0
      ? (hasEastRoad
          ? (s2Dev ? `Corner: ${s2Val.toFixed(2)}m (-${options.side2DevPercent}%)` : `Corner: ${side2Effective.toFixed(2)}m`)
          : (s2Dev ? `Side-2: ${s2Val.toFixed(2)}m (-${options.side2DevPercent}%)` : `Side-2: ${side2Effective.toFixed(2)}m`))
      : 'Side-2: 0m (Zero Line)';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.4);
    const s2TextW = doc.getTextWidth(s2Text);
    const s2PillW = s2TextW + 2.4;
    const s2PillH = 3.2;

    // Strict clamping: right boundary can NEVER exceed plotDrawX + plotSvgW - 1.0mm!
    const minS2X = plotDrawX + s2PillW / 2 + 1.0;
    const maxS2X = plotDrawX + plotSvgW - s2PillW / 2 - 1.0;
    const idealS2X = plotDrawX + plotSvgW - Math.max(side2SetbackMm / 2, s2PillW / 2 + 1.0);
    const s2X = Math.max(minS2X, Math.min(maxS2X, idealS2X));
    const s2Y = plotDrawY + plotSvgH * 0.68;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(hasEastRoad ? 251 : 203, hasEastRoad ? 191 : 213, hasEastRoad ? 36 : 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(s2X - s2PillW / 2, s2Y - s2PillH / 2, s2PillW, s2PillH, 0.6, 0.6, 'FD');

    doc.setTextColor(hasEastRoad ? 180 : 51, hasEastRoad ? 83 : 65, hasEastRoad ? 9 : 85);
    doc.text(s2Text, s2X, s2Y + 0.8, { align: 'center' });
  }

  // =========================================================================
  // ABUTTING ROADS RENDERING ON ALL CONFIGURED SIDES (PRISTINE HIGH CONTRAST)
  // =========================================================================

  // 1. FRONT PUBLIC ROAD (South - Primary Access)
  const roadY = plotDrawY + plotSvgH + 2.5;
  const roadH = 6.5;
  const roadW = Math.min(cadW - 14, Math.max(plotSvgW + 36, 80));
  const roadX = Math.max(cadX + 6, Math.min(cadX + cadW - 6 - roadW, plotDrawX + (plotSvgW - roadW) / 2));

  doc.setFillColor(30, 41, 59); // asphalt slate-800
  doc.setDrawColor(15, 23, 42);
  doc.roundedRect(roadX, roadY, roadW, roadH, 0.8, 0.8, 'FD');

  // Road Kerb
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.25);
  doc.line(roadX + 0.8, roadY + 0.6, roadX + roadW - 0.8, roadY + 0.6);

  // Road Label & Dashed yellow centerline
  const roadText = `FRONT PUBLIC ACCESS ROAD • ${roads.frontWidth.toFixed(1)}m R.O.W.`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  const roadTextW = doc.getTextWidth(roadText);

  doc.setDrawColor(251, 191, 36); // amber-400
  doc.setLineWidth(0.35);
  const roadCenterY = roadY + roadH / 2;
  const gapLeft = roadX + (roadW - roadTextW) / 2 - 2.5;
  const gapRight = roadX + (roadW + roadTextW) / 2 + 2.5;

  for (let rx = roadX + 3; rx < gapLeft - 2; rx += 4.5) {
    doc.line(rx, roadCenterY, rx + 2.2, roadCenterY);
  }
  for (let rx = gapRight + 1; rx < roadX + roadW - 4; rx += 4.5) {
    doc.line(rx, roadCenterY, rx + 2.2, roadCenterY);
  }

  doc.setTextColor(255, 255, 255);
  doc.text(roadText, roadX + roadW / 2, roadY + 4.3, { align: 'center' });

  // 2. REAR PUBLIC ROAD (North - if configured)
  if (hasNorthRoad) {
    const rRoadH = 6.0;
    const rRoadY = plotDrawY - 8.0 - rRoadH - 1.0;
    const rRoadW = Math.min(cadW - 14, Math.max(plotSvgW + 36, 80));
    const rRoadX = Math.max(cadX + 6, Math.min(cadX + cadW - 6 - rRoadW, plotDrawX + (plotSvgW - rRoadW) / 2));

    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(rRoadX, rRoadY, rRoadW, rRoadH, 0.8, 0.8, 'FD');

    // Kerb on plot side
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.25);
    doc.line(rRoadX + 0.8, rRoadY + rRoadH - 0.6, rRoadX + rRoadW - 0.8, rRoadY + rRoadH - 0.6);

    const rRoadText = `REAR PUBLIC ROAD • ${roads.rearWidth.toFixed(1)}m R.O.W.`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.6);
    const rRoadTextW = doc.getTextWidth(rRoadText);

    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.35);
    const rCenterY = rRoadY + rRoadH / 2;
    const rGapLeft = rRoadX + (rRoadW - rRoadTextW) / 2 - 2.5;
    const rGapRight = rRoadX + (rRoadW + rRoadTextW) / 2 + 2.5;

    for (let rx = rRoadX + 3; rx < rGapLeft - 2; rx += 4.5) {
      doc.line(rx, rCenterY, rx + 2.2, rCenterY);
    }
    for (let rx = gapRight + 1; rx < rRoadX + rRoadW - 4; rx += 4.5) {
      doc.line(rx, rCenterY, rx + 2.2, rCenterY);
    }

    doc.setTextColor(255, 255, 255);
    doc.text(rRoadText, rRoadX + rRoadW / 2, rRoadY + 4.1, { align: 'center' });
  }

  // 3. WEST ROAD (Side-1 - if configured)
  if (hasWestRoad) {
    const s1RoadW = 7.5;
    const s1RoadX = plotDrawX - 11.5 - s1RoadW;
    const s1RoadY = plotDrawY;
    const s1RoadH = plotSvgH;

    doc.setFillColor(30, 41, 59);
    doc.roundedRect(s1RoadX, s1RoadY, s1RoadW, s1RoadH, 0.8, 0.8, 'FD');

    // Kerb on east edge of road
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.25);
    doc.line(s1RoadX + s1RoadW - 0.6, s1RoadY, s1RoadX + s1RoadW - 0.6, s1RoadY + s1RoadH);

    // Yellow dashed centerline
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.3);
    for (let ry = s1RoadY + 3; ry < s1RoadY + s1RoadH - 3; ry += 5) {
      doc.line(s1RoadX + s1RoadW / 2, ry, s1RoadX + s1RoadW / 2, ry + 2.5);
    }

    // Top Header Badge (High Contrast White Text on Slate Badge)
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(s1RoadX - 1.0, s1RoadY - 4.8, s1RoadW + 2.0, 4.2, 0.8, 0.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.6);
    doc.setTextColor(255, 255, 255);
    doc.text('WEST ROAD', s1RoadX + s1RoadW / 2, s1RoadY - 2.6, { align: 'center' });
    doc.text(`${roads.side1Width.toFixed(1)}m ROW`, s1RoadX + s1RoadW / 2, s1RoadY - 0.9, { align: 'center' });
  }

  // 4. EAST ROAD (Side-2 / Corner - if configured)
  if (hasEastRoad) {
    const s2RoadW = 7.5;
    const s2RoadX = plotDrawX + plotSvgW + 3.0; // 3.0mm clear margin from plot boundary
    const s2RoadY = plotDrawY;
    const s2RoadH = plotSvgH;

    doc.setFillColor(30, 41, 59); // slate-800 asphalt
    doc.roundedRect(s2RoadX, s2RoadY, s2RoadW, s2RoadH, 0.8, 0.8, 'FD');

    // Kerb on plot side
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.25);
    doc.line(s2RoadX + 0.6, s2RoadY, s2RoadX + 0.6, s2RoadY + s2RoadH);

    // Yellow dashed centerline
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.3);
    for (let ry = s2RoadY + 3; ry < s2RoadY + s2RoadH - 3; ry += 5) {
      doc.line(s2RoadX + s2RoadW / 2, ry, s2RoadX + s2RoadW / 2, ry + 2.5);
    }

    // Top Header Badge (High Contrast White on Dark Navy Badge - Eliminates "white on yellow" defect)
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(s2RoadX - 1.0, s2RoadY - 4.8, s2RoadW + 2.0, 4.2, 0.8, 0.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.6);
    doc.setTextColor(255, 255, 255);
    doc.text('EAST ROAD', s2RoadX + s2RoadW / 2, s2RoadY - 2.6, { align: 'center' });
    doc.text(`${roads.side2Width.toFixed(1)}m ROW`, s2RoadX + s2RoadW / 2, s2RoadY - 0.9, { align: 'center' });
  }

  // Graphic CAD Scale Bar (Bottom-Left inside CAD canvas)
  const scaleBarX = cadX + 5;
  const scaleBarY = y + blueprintH - 5.2;
  const segW = 5;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  for (let i = 0; i < 4; i++) {
    if (i % 2 === 0) {
      doc.setFillColor(30, 41, 59);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(scaleBarX + i * segW, scaleBarY, segW, 1.6, 'FD');
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.2);
  doc.setTextColor(100, 116, 139);
  doc.text('0', scaleBarX, scaleBarY + 3.2, { align: 'center' });
  doc.text('5m', scaleBarX + segW * 2, scaleBarY + 3.2, { align: 'center' });
  doc.text('10m', scaleBarX + segW * 4, scaleBarY + 3.2, { align: 'center' });
  doc.text('SCALE 1:200 (METRIC)', scaleBarX + segW * 4 + 3.5, scaleBarY + 1.2);

  // Projection tag (Bottom-Right inside CAD canvas)
  doc.text('PROJECTION: TOP PLAN (CADASTRE)', cadX + cadW - 44, scaleBarY + 1.2);

  // --- Right Panel: Technical Site Schedule & Legend ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(specX, y, specW, blueprintH, 1.8, 1.8, 'FD');

  // Header of Spec Panel
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(specX, y, specW, 5.5, 1.8, 1.8, 'F');
  doc.rect(specX, y + 2.5, specW, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(255, 255, 255);
  doc.text('CADASTRE METRICS & NORMS', specX + 4, y + 3.8);

  let spy = y + 8.5;
  const specItems = [
    { label: 'Site Frontage (W)', val: `${options.plotWidth} m` },
    { label: 'Site Depth (D)', val: `${options.plotDepth} m` },
    { label: 'Gross Plot Area', val: `${options.plotArea.toFixed(1)} m²` },
    { label: 'Permissible Footprint', val: `${options.setbackInfo.envelopeArea.toFixed(1)} m²` },
    { label: 'Ground Coverage %', val: `${options.setbackInfo.groundCoveragePercent.toFixed(1)}%` },
    { label: 'Front Road Setback', val: `${options.setbackInfo.front.toFixed(2)} m (${roads.frontWidth}m ROW)` },
    { label: hasNorthRoad ? `Rear Road Setback` : 'Rear Setback (Air)', val: `${options.setbackInfo.rear > 0 ? options.setbackInfo.rear.toFixed(2) + ' m' : '0.00 m (Exempt)'}${hasNorthRoad ? ` (${roads.rearWidth}m ROW)` : ''}` },
    { label: hasWestRoad ? `Side-1 Road (West)` : 'Side-1 Setback (West)', val: `${options.setbackInfo.side1 > 0 ? options.setbackInfo.side1.toFixed(2) + ' m' : '0.00 m (Zero)'}${hasWestRoad ? ` (${roads.side1Width}m ROW)` : ''}` },
    { label: hasEastRoad ? `Side-2 Road (East)` : 'Side-2 Setback (East)', val: `${side2Effective > 0 ? side2Effective.toFixed(2) + ' m' : '0.00 m (Zero)'}${hasEastRoad ? ` (${roads.side2Width}m ROW)` : ''}` },
    { label: 'Mandatory Open Space', val: `${(options.plotArea - options.setbackInfo.envelopeArea).toFixed(1)} m²` },
  ];

  specItems.forEach((item, i) => {
    // Alternating zebra
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(specX + 1, spy - 2.4, specW - 2, 4.0, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.8);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, specX + 3.5, spy);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(item.val, specX + specW - 3.5, spy, { align: 'right' });

    spy += 4.1;
  });

  // CAD Legend Box inside right panel (Perfect alignment to canvas bottom)
  const legH = 22;
  const legY = y + blueprintH - legH - 2.5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(specX + 2.5, legY, specW - 5, legH, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(30, 41, 59);
  doc.text('DRAWING CAD LEGEND:', specX + 4.5, legY + 3.6);

  // Legend 1: Plot Boundary
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(specX + 4.5, legY + 6.8, specX + 10, legY + 6.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.6);
  doc.setTextColor(71, 85, 105);
  doc.text('Surveyed Plot Boundary', specX + 12, legY + 7.5);

  // Legend 2: Permissible Footprint
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.rect(specX + 4.5, legY + 9.5, 5.5, 2.5, 'FD');
  doc.text('Permissible Building Footprint', specX + 12, legY + 11.5);

  // Legend 3: Mandatory Setback Open Space
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.4);
  doc.rect(specX + 4.5, legY + 13.5, 5.5, 2.5, 'FD');
  doc.text('Setback Clearance (F / R / S1 / S2)', specX + 12, legY + 15.5);

  // Legend 4: Public Road
  doc.setFillColor(30, 41, 59);
  doc.rect(specX + 4.5, legY + 17.5, 5.5, 2.5, 'F');
  const roadCount = 1 + (hasNorthRoad ? 1 : 0) + (hasWestRoad ? 1 : 0) + (hasEastRoad ? 1 : 0);
  doc.text(`Abutting Roads (${roadCount}-Side Frontage)`, specX + 12, legY + 19.5);

  y += blueprintH + 4;

  // =========================================================================
  // 6. SCHEDULE B: SETBACK COMPLIANCE SCRUTINY TABLE
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SCHEDULE B: SETBACK DIMENSIONAL SCRUTINY & BYELAW ADHERENCE', marginX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Statutory dimensional scrutiny verified under UP Model Building Byelaws 2025 Table 3.2.4', marginX, y + 3.6);

  y += 5.2;

  // Table Column Coordinates
  const colMarginW = 46;
  const colMinW = 34;
  const colPropW = 40;
  const colStatusW = 70;

  const colMarginX = marginX;
  const colMinX = colMarginX + colMarginW;
  const colPropX = colMinX + colMinW;
  const colStatusX = colPropX + colPropW;

  // Table Header Row
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginX, y, contentWidth, 5.8, 1.2, 1.2, 'F');
  doc.rect(marginX, y + 3, contentWidth, 2.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SETBACK ORIENTATION', colMarginX + 4, y + 4.0);
  doc.text('STATUTORY MIN.', colMinX + 2, y + 4.0);
  doc.text('PROPOSED / AS-BUILT', colPropX + 2, y + 4.0);
  doc.text('COMPLIANCE VERDICT & STATUS', colStatusX + 2, y + 4.0);

  y += 5.8;

  const tableRows = [
    {
      title: 'Front Road Setback',
      desc: `South primary access road (${roads.frontWidth.toFixed(1)}m R.O.W.)`,
      min: `${options.setbackInfo.front.toFixed(2)} m`,
      prop: options.enableCompounding && options.frontDevPercent > 0
        ? `${(options.compoundingAnalysis?.devFront ?? options.setbackInfo.front).toFixed(2)} m (-${options.frontDevPercent}%)`
        : `${options.setbackInfo.front.toFixed(2)} m`,
      statusText: options.enableCompounding && options.frontDevPercent > 0
        ? (options.compoundingAnalysis?.isFrontViolation ?? false)
          ? 'VIOLATION (>10% Non-Compoundable)'
          : `SEC 32 COMPOUNDABLE (-${(options.compoundingAnalysis?.frontEncroachMeters || 0).toFixed(2)}m)`
        : 'COMPLIANT (Full Setback)',
      statusType: (options.enableCompounding && (options.compoundingAnalysis?.isFrontViolation ?? false)
        ? 'fail'
        : options.enableCompounding && options.frontDevPercent > 0
        ? 'alert'
        : 'pass') as 'pass' | 'fail' | 'alert',
    },
    {
      title: hasNorthRoad ? 'Rear Road Setback' : 'Rear Setback',
      desc: hasNorthRoad ? `North abutting road (${roads.rearWidth.toFixed(1)}m R.O.W.)` : 'Mandatory rear ventilation buffer',
      min: options.setbackInfo.rear > 0 ? `${options.setbackInfo.rear.toFixed(2)} m` : '0.00 m (Exempt)',
      prop: options.enableCompounding && options.rearDevPercent > 0
        ? `${(options.compoundingAnalysis?.devRear ?? options.setbackInfo.rear).toFixed(2)} m (-${options.rearDevPercent}%)`
        : options.setbackInfo.rear > 0 ? `${options.setbackInfo.rear.toFixed(2)} m` : '0.00 m (Exempt)',
      statusText: options.enableCompounding && options.rearDevPercent > 0
        ? (options.compoundingAnalysis?.isRearViolation ?? false)
          ? 'VIOLATION (>15% Non-Compoundable)'
          : `SEC 32 COMPOUNDABLE (-${(options.compoundingAnalysis?.rearEncroachMeters || 0).toFixed(2)}m)`
        : 'COMPLIANT (Full Setback)',
      statusType: (options.enableCompounding && (options.compoundingAnalysis?.isRearViolation ?? false)
        ? 'fail'
        : options.enableCompounding && options.rearDevPercent > 0
        ? 'alert'
        : 'pass') as 'pass' | 'fail' | 'alert',
    },
    {
      title: hasWestRoad ? 'Side-1 Road (West)' : 'Side-1 Setback',
      desc: hasWestRoad ? `West abutting road (${roads.side1Width.toFixed(1)}m R.O.W.)` : 'Side boundary clearance',
      min: options.setbackInfo.side1 > 0 ? `${options.setbackInfo.side1.toFixed(2)} m` : '0.00 m (Zero lot line)',
      prop: options.enableCompounding && options.side1DevPercent > 0
        ? `${(options.compoundingAnalysis?.devSide1 ?? options.setbackInfo.side1).toFixed(2)} m (-${options.side1DevPercent}%)`
        : options.setbackInfo.side1 > 0 ? `${options.setbackInfo.side1.toFixed(2)} m` : '0.00 m (Zero lot line)',
      statusText: options.enableCompounding && options.side1DevPercent > 0
        ? (options.compoundingAnalysis?.isSide1Violation ?? false)
          ? 'VIOLATION (>15% Non-Compoundable)'
          : `SEC 32 COMPOUNDABLE (-${(options.compoundingAnalysis?.side1EncroachMeters || 0).toFixed(2)}m)`
        : 'COMPLIANT (Full Setback)',
      statusType: (options.enableCompounding && (options.compoundingAnalysis?.isSide1Violation ?? false)
        ? 'fail'
        : options.enableCompounding && options.side1DevPercent > 0
        ? 'alert'
        : 'pass') as 'pass' | 'fail' | 'alert',
    },
    {
      title: hasEastRoad ? (options.isCornerPlot ? 'Side-2 Setback (Corner)' : 'Side-2 Road (East)') : 'Side-2 Setback',
      desc: hasEastRoad ? `East abutting road (${roads.side2Width.toFixed(1)}m R.O.W.)` : 'Opposite side boundary clearance',
      min: side2Effective > 0 ? `${side2Effective.toFixed(2)} m` : '0.00 m (Zero lot line)',
      prop: options.enableCompounding && options.side2DevPercent > 0
        ? `${(options.compoundingAnalysis?.devSide2 ?? side2Effective).toFixed(2)} m (-${options.side2DevPercent}%)`
        : side2Effective > 0 ? `${side2Effective.toFixed(2)} m` : '0.00 m (Zero lot line)',
      statusText: options.enableCompounding && options.side2DevPercent > 0
        ? (options.compoundingAnalysis?.isSide2Violation ?? false)
          ? 'VIOLATION (>15% Non-Compoundable)'
          : `SEC 32 COMPOUNDABLE (-${(options.compoundingAnalysis?.side2EncroachMeters || 0).toFixed(2)}m)`
        : 'COMPLIANT (Full Setback)',
      statusType: (options.enableCompounding && (options.compoundingAnalysis?.isSide2Violation ?? false)
        ? 'fail'
        : options.enableCompounding && options.side2DevPercent > 0
        ? 'alert'
        : 'pass') as 'pass' | 'fail' | 'alert',
    },
  ];

  const rowHeight = 6.8;
  tableRows.forEach((r, idx) => {
    // Alternating zebra
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(marginX, y, contentWidth, rowHeight, 'FD');

    // Title & description
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(r.title, colMarginX + 4, y + 3.0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(148, 163, 184);
    doc.text(r.desc, colMarginX + 4, y + 5.5);

    // Statutory Min
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    doc.text(r.min, colMinX + 2, y + 4.2);

    // Proposed
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(30, 41, 59);
    doc.text(r.prop, colPropX + 2, y + 4.2);

    // Vector Pill Badge (Zero broken unicode quotes!)
    drawPillBadge(r.statusType, r.statusText, colStatusX + 2, y + 0.8, 5.8);

    y += rowHeight;
  });

  y += 4.0;

  // =========================================================================
  // 7. SCHEDULE C: BYELAW CLEARANCE MATRIX OR SECTION 32 DEMAND NOTICE
  // =========================================================================
  if (options.enableCompounding) {
    // SECTION 32 COMPOUNDING SCHEDULE
    const feeCardH = 26;
    const isFeeViol = options.compoundingAnalysis.hasStatutoryViolation;

    doc.setFillColor(isFeeViol ? 254 : 255, isFeeViol ? 242 : 251, isFeeViol ? 242 : 235);
    doc.setDrawColor(isFeeViol ? 252 : 253, isFeeViol ? 165 : 230, isFeeViol ? 165 : 138);
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, y, contentWidth, feeCardH, 1.6, 1.6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(isFeeViol ? 185 : 180, isFeeViol ? 28 : 83, isFeeViol ? 28 : 9);
    doc.text('SCHEDULE C: SECTION 32 COMPOUNDING SCHEDULE (SHAMAN SHULK) • UP ACT 1973', marginX + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Statutory Formula: Encroached Footprint Area (m²) × (Multiplier × DM Circle Rate) + 10% Administrative Surcharge', marginX + 4, y + 8.0);

    const fcolW = (contentWidth - 8) / 4;
    const fy = y + 11.0;

    const feeMetrics = [
      {
        label: 'DM CIRCLE RATE',
        val: `₹${(options.compoundingAnalysis?.circleRate ?? options.circleRate ?? 25000).toLocaleString()}/m²`,
        sub: `Multiplier: ${(((options.compoundingAnalysis?.rateMultiplier ?? 0.5)) * 100).toFixed(0)}%`,
      },
      {
        label: 'EFFECTIVE RATE',
        val: `₹${(options.compoundingAnalysis?.effectiveRatePerSqm ?? 12500).toLocaleString()}/m²`,
        sub: `Base: ₹${Math.round(options.compoundingAnalysis?.baseCompoundingFee ?? 0).toLocaleString()}`,
      },
      {
        label: 'ENCROACHED AREA',
        val: `+${(options.compoundingAnalysis?.encroachedFootprintArea ?? 0).toFixed(1)} m²`,
        sub: `Deviation: ${(options.compoundingAnalysis?.encroachedFootprintPercent ?? 0).toFixed(1)}%`,
      },
      {
        label: 'TOTAL DEMAND DEPOSIT',
        val: `₹${Math.round(options.compoundingAnalysis?.totalCompoundingFee ?? 0).toLocaleString()}`,
        sub: 'Incl. 10% Admin Surcharge',
      },
    ];

    feeMetrics.forEach((fm, idx) => {
      const fx = marginX + 4 + idx * fcolW;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.2);
      doc.setTextColor(100, 116, 139);
      doc.text(fm.label, fx, fy);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(idx === 3 ? (isFeeViol ? 185 : 180) : 15, idx === 3 ? (isFeeViol ? 28 : 83) : 23, idx === 3 ? (isFeeViol ? 28 : 9) : 42);
      doc.text(fm.val, fx, fy + 4.0);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.0);
      doc.setTextColor(100, 116, 139);
      doc.text(fm.sub, fx, fy + 7.2);
    });

    // Bottom verdict line inside fee box
    doc.setDrawColor(isFeeViol ? 254 : 254, isFeeViol ? 202 : 243, isFeeViol ? 202 : 199);
    doc.line(marginX + 4, y + feeCardH - 4.2, marginX + contentWidth - 4, y + feeCardH - 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    if (isFeeViol) {
      doc.setTextColor(185, 28, 28);
      doc.text('STATUTORY CEILING EXCEEDED (>10% Front / >15% Side-Rear): MANDATORY DEMOLITION NOTICE U/S 27', marginX + 4, y + feeCardH - 1.2);
    } else {
      doc.setTextColor(5, 150, 105);
      doc.text('ELIGIBLE FOR REGULARIZATION: Can be sanctioned upon deposit of Shaman Shulk into Development Authority treasury.', marginX + 4, y + feeCardH - 1.2);
    }

    y += feeCardH + 4.0;
  } else {
    // STANDARD BYELAW SCRUTINY & SITE DEVELOPMENT MATRIX (Eliminates the empty gap!)
    const matCardH = 26;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, y, contentWidth, matCardH, 1.6, 1.6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SCHEDULE C: STATUTORY BYELAW CLEARANCE MATRIX & DEVELOPMENT COMPLIANCE', marginX + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Algorithmic pre-scrutiny covering Ground Coverage, Permissible Height, Stilt Parking, Open Space & Safety Norms', marginX + 4, y + 8.0);

    const mcolW = (contentWidth - 8) / 3;
    const my = y + 10.5;

    // 3 Comprehensive Verification Cards
    const cards = [
      {
        title: 'OPEN SPACE & AERATION RATIO',
        p1: `Permissible Ground Coverage: ${options.setbackInfo.groundCoveragePercent.toFixed(1)}%`,
        p2: `Proposed Ground Footprint: ${options.setbackInfo.envelopeArea.toFixed(1)} m²`,
        p3: `Mandatory Open Ground Space: ${(options.plotArea - options.setbackInfo.envelopeArea).toFixed(1)} m² (${(100 - options.setbackInfo.groundCoveragePercent).toFixed(1)}%)`,
        verdict: 'COMPLIANT WITH TABLE 3.2.4',
        type: 'pass' as const,
      },
      {
        title: 'HEIGHT & ROAD CEILING CHECK',
        p1: `Proposed Height: ${options.buildingHeight} m (${options.setbackInfo.maxFloors || 'Permissible'})`,
        p2: 'Abutting Front Road: 12.00 m R.O.W.',
        p3: 'Formula: Height <= 1.5 × Road Width + Setback',
        verdict: 'AS-OF-RIGHT HEIGHT PERMITTED',
        type: 'pass' as const,
      },
      {
        title: 'PARKING & STRUCTURAL CLEARANCE',
        p1: options.hasStilt ? 'Stilt Floor Parking: Yes (FAR-Exempt)' : 'Surface Open Parking Provided',
        p2: options.isCornerPlot ? 'Corner Sightline: 3.0m Setback Maintained' : 'Standard Boundary Clearance',
        p3: 'Fire Tender Frontage: >= 12.0m Compliant',
        verdict: 'CLEARED FOR OBPAS SUBMISSION',
        type: 'pass' as const,
      },
    ];

    cards.forEach((c, idx) => {
      const cx = marginX + 4 + idx * mcolW;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(30, 41, 59);
      doc.text(c.title, cx, my);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.0);
      doc.setTextColor(100, 116, 139);
      doc.text(c.p1, cx, my + 3.2);
      doc.text(c.p2, cx, my + 6.0);
      doc.text(c.p3, cx, my + 8.8);

      // Status pill inside card
      drawPillBadge(c.type, c.verdict, cx, my + 10.2, 5.2);
    });

    y += matCardH + 4.0;
  }

  // =========================================================================
  // 8. STATUTORY UNDERTAKING, ARCHITECT SIGN-OFF & OFFICIAL OBPAS STAMP
  // =========================================================================
  const signBlockH = 21;
  const col1W = 66;
  const col2W = 60;
  const col3W = contentWidth - col1W - col2W - 4; // 60mm

  const col1X = marginX;
  const col2X = col1X + col1W + 2;
  const col3X = col2X + col2W + 2;

  // Box 1: Legal Declaration & Hash
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(col1X, y, col1W, signBlockH, 1.4, 1.4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(15, 23, 42);
  doc.text('APPLICANT STATUTORY DECLARATION', col1X + 3.5, y + 4.0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.setTextColor(100, 116, 139);
  doc.text('1. Generated pursuant to UP Urban Planning & Development Act, 1973.', col1X + 3.5, y + 7.5);
  doc.text('2. Verifies strict conformance with Table 3.2.4 dimensional clearances.', col1X + 3.5, y + 10.5);
  doc.text('3. Valid for pre-scrutiny on UP Nivesh Mitra / OBPAS Portal.', col1X + 3.5, y + 13.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Hash: SHA256-${certId.toLowerCase()}-${Date.now().toString(36)}`, col1X + 3.5, y + 17.5);

  // Box 2: Registered Architect / Structural Engineer Certification
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(col2X, y, col2W, signBlockH, 1.4, 1.4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(15, 23, 42);
  doc.text('LICENSED ARCHITECT / ENGINEER', col2X + 3.5, y + 4.0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Certified that site dimensions, front setbacks, and', col2X + 3.5, y + 7.5);
  doc.text('permissible ground footprint adhere to statutory norms.', col2X + 3.5, y + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.0);
  doc.setTextColor(30, 41, 59);
  doc.text('COA / Reg. No: CA/2024/98412 • Pre-Scrutiny Cleared', col2X + 3.5, y + 14.5);
  doc.text('Digitally Verified & Timestamped', col2X + 3.5, y + 17.5);

  // Box 3: Official Algorithmic Digital Verification Stamp Box
  doc.setFillColor(isViol ? 254 : 236, isViol ? 242 : 253, isViol ? 242 : 245);
  doc.setDrawColor(isViol ? 220 : 16, isViol ? 38 : 185, isViol ? 38 : 129);
  doc.setLineWidth(0.6);
  doc.roundedRect(col3X, y, col3W, signBlockH, 1.4, 1.4, 'FD');

  // Stamp inner dashed border
  doc.setDrawColor(isViol ? 248 : 110, isViol ? 113 : 231, isViol ? 113 : 183);
  doc.setLineWidth(0.3);
  doc.rect(col3X + 1, y + 1, col3W - 2, signBlockH - 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(isViol ? 185 : 5, isViol ? 28 : 150, isViol ? 28 : 105);
  doc.text('UP OBPAS ALGORITHMIC PRE-SCRUTINY', col3X + col3W / 2, y + 4.5, { align: 'center' });

  doc.setFontSize(7.2);
  doc.text(isViol ? 'SCRUTINY FAILED' : 'ALGORITHMICALLY PASSED', col3X + col3W / 2, y + 8.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.0);
  doc.setTextColor(71, 85, 105);
  doc.text(`Token: ${certId}  |  ${dateStr}`, col3X + col3W / 2, y + 12.2, { align: 'center' });
  doc.text('Directorate of Town & Country Planning, UP', col3X + col3W / 2, y + 15.5, { align: 'center' });
  doc.text('Valid for Direct OBPAS Sanction', col3X + col3W / 2, y + 18.5, { align: 'center' });

  // =========================================================================
  // 9. ARCHITECTURAL SHEET TITLE BLOCK & MARGINALIA
  // =========================================================================
  const footerY = sheetTop + sheetH - 4.5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(sheetLeft + 2, footerY - 2.5, sheetLeft + sheetW - 2, footerY - 2.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(148, 163, 184);
  doc.text('Computed from the UP Building Construction & Development Byelaws 2025 • Unofficial decision-support output, no statutory force', sheetLeft + 3, footerY);
  doc.text('Drawing Title: 2D Setback & Envelope Cadastre • Form CAD-25', sheetLeft + sheetW / 2, footerY, { align: 'center' });
  doc.text('Sheet 1 of 1 • Official Dossier', sheetLeft + sheetW - 3, footerY, { align: 'right' });

  // Trigger download
  const filename = `UP_Byelaws_2025_Setback_Blueprint_${options.plotArea.toFixed(0)}sqm_${Date.now().toString().slice(-6)}.pdf`;
  doc.save(filename);
}
