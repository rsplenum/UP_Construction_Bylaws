import { jsPDF } from 'jspdf';
import { AuditEngineState } from './auditStorage';
import { RegulatoryConflict } from './constraintEngine';

export interface AuditItem {
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

export function generateAuditPdfReport(
  state: AuditEngineState,
  auditResults: AuditItem[],
  conflicts: RegulatoryConflict[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 14;

  const compliantCount = auditResults.filter((i) => i.status === 'compliant' || i.status === 'exempt').length;
  const conditionalCount = auditResults.filter((i) => i.status === 'conditional').length;
  const nonCompliantCount = auditResults.filter((i) => i.status === 'non_compliant').length;
  const totalCount = auditResults.length;
  const scorePercent = Math.round(((compliantCount + conditionalCount * 0.5) / totalCount) * 100);

  const certId = `UP-BL25-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Emerald Accent Line
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('STATE OF UTTAR PRADESH • HOUSING & URBAN PLANNING DEPARTMENT', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('UP Building Construction and Development Byelaws 2025 • Statutory Compliance Audit', 14, 18);
  doc.text(`Cert. ID: ${certId}   |   Date: ${dateStr}   |   Standard: TMPR8 Gazette`, 14, 23);

  y = 36;

  // Title Box
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PROJECT REGULATORY AUDIT & SCRUTINY CERTIFICATE', 14, y);
  y += 6;

  // Project Specs Grid (2 columns)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 42, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const col1X = 18;
  const col2X = 80;
  const col3X = 142;
  let py = y + 7;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Occupancy:', col1X, py);
  doc.setFont('helvetica', 'normal');
  doc.text(state.occupancy.replace('_', ' ').toUpperCase(), col1X + 22, py);

  doc.setFont('helvetica', 'bold');
  doc.text('Plot Area:', col2X, py);
  doc.setFont('helvetica', 'normal');
  doc.text(`${state.plotArea} sqm`, col2X + 22, py);

  doc.setFont('helvetica', 'bold');
  doc.text('Frontage:', col3X, py);
  doc.setFont('helvetica', 'normal');
  doc.text(`${state.plotFrontage} m`, col3X + 18, py);

  py += 7;
  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Road Width:', col1X, py);
  doc.setFont('helvetica', 'normal');
  doc.text(`${state.roadWidth} m`, col1X + 22, py);

  doc.setFont('helvetica', 'bold');
  doc.text('Bldg Height:', col2X, py);
  doc.setFont('helvetica', 'normal');
  doc.text(`${state.buildingHeight} m`, col2X + 22, py);

  doc.setFont('helvetica', 'bold');
  doc.text('Built-up Area:', col3X, py);
  doc.setFont('helvetica', 'normal');
  doc.text(`${state.proposedBuiltUpArea} sqm`, col3X + 22, py);

  py += 7;
  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('Corner Plot:', col1X, py);
  doc.setFont('helvetica', 'normal');
  doc.text(state.isCornerPlot ? 'YES' : 'NO', col1X + 22, py);

  doc.setFont('helvetica', 'bold');
  doc.text('Stilt Parking:', col2X, py);
  doc.setFont('helvetica', 'normal');
  doc.text(state.hasStilt ? 'YES (Free FAR)' : 'NO', col2X + 22, py);

  doc.setFont('helvetica', 'bold');
  doc.text('Parking Bays:', col3X, py);
  doc.setFont('helvetica', 'normal');
  doc.text(`${state.parkingBaysProvided} ECS`, col3X + 22, py);

  py += 7;
  // Row 4
  doc.setFont('helvetica', 'bold');
  doc.text('Setbacks (F/R/S1/S2):', col1X, py);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${state.frontSetbackProvided}m / ${state.rearSetbackProvided}m / ${state.side1Provided}m / ${state.side2Provided}m`,
    col1X + 38,
    py
  );

  doc.setFont('helvetica', 'bold');
  doc.text('RWH / Solar:', col3X, py);
  doc.setFont('helvetica', 'normal');
  doc.text(`${state.hasRWH ? 'RWH' : 'No RWH'} | ${state.hasSolarHeating ? 'Solar' : 'No Solar'}`, col3X + 22, py);

  y += 48;

  // Compliance Scorecard Bar
  doc.setFillColor(scorePercent >= 80 ? 236 : scorePercent >= 60 ? 254 : 254, scorePercent >= 80 ? 253 : 243, scorePercent >= 80 ? 245 : 242); // emerald-50 or amber/red
  doc.setDrawColor(scorePercent >= 80 ? 167 : 245, scorePercent >= 80 ? 243 : 158, scorePercent >= 80 ? 208 : 11);
  doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(scorePercent >= 80 ? 6 : 180, scorePercent >= 80 ? 95 : 83, scorePercent >= 80 ? 70 : 9);
  doc.text(`OVERALL COMPLIANCE SCORE: ${scorePercent}%`, 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Total Checkpoints: ${totalCount}   |   Compliant/Exempt: ${compliantCount}   |   Conditional: ${conditionalCount}   |   Non-Compliant: ${nonCompliantCount}`,
    18,
    y + 12
  );

  y += 22;

  // Active Logical Conflicts Banner (if any)
  if (conflicts.length > 0) {
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(248, 113, 113); // red-400
    doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28);
    doc.text(`LOGICAL CONSTRAINTS ENGINE DETECTED ${conflicts.length} REGULATORY CONFLICT(S):`, 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(153, 27, 27);
    const conflictSummary = conflicts.map((c) => `• [${c.chapterRef}] ${c.title}`).slice(0, 2).join('   ');
    doc.text(conflictSummary, 18, y + 11);
    doc.text('Review detailed conflict resolutions before formal submission to Development Authority OBPAS.', 18, y + 15);

    y += 24;
  }

  // Audit Checkpoints Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  doc.text('CHAPTER / RULE', 16, y + 5.5);
  doc.text('STATUTORY LIMIT', 75, y + 5.5);
  doc.text('PROPOSED VALUE', 135, y + 5.5);
  doc.text('STATUS', 178, y + 5.5);

  y += 9;

  // Loop through Audit Items
  auditResults.forEach((item) => {
    // Check if near page bottom
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 16;
      // Re-draw table header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('CHAPTER / RULE', 16, y + 5.5);
      doc.text('STATUTORY LIMIT', 75, y + 5.5);
      doc.text('PROPOSED VALUE', 135, y + 5.5);
      doc.text('STATUS', 178, y + 5.5);
      y += 10;
    }

    // Row background
    const isPass = item.status === 'compliant' || item.status === 'exempt';
    const isWarn = item.status === 'conditional';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.ruleTitle.slice(0, 36), 16, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(item.chapterRef, 16, y + 3.5);

    // Limit (wrapped if needed)
    doc.setTextColor(51, 65, 85);
    doc.text(item.statutoryLimit.slice(0, 44), 75, y);

    // Proposed
    doc.text(item.proposedValue.slice(0, 30), 135, y);

    // Status Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    if (isPass) {
      doc.setTextColor(5, 150, 105);
      doc.text(item.status.toUpperCase(), 178, y);
    } else if (isWarn) {
      doc.setTextColor(217, 119, 6);
      doc.text('CONDITIONAL', 178, y);
    } else {
      doc.setTextColor(220, 38, 38);
      doc.text('NON-COMPLIANT', 178, y);
    }

    // Divider line
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 5.5, pageWidth - 14, y + 5.5);

    y += 8;
  });

  // Footer / Sign-off Block
  if (y > pageHeight - 35) {
    doc.addPage();
    y = 16;
  }

  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Statutory Certification Disclaimer: Generated under the provisions of Uttar Pradesh Urban Planning & Development Act, 1973 (Section 15, 15A, 53) and UP Building Byelaws 2025.',
    14,
    y
  );
  doc.text(
    'This algorithmic pre-scrutiny report is valid for technical review prior to formal submission on the UP Nivesh Mitra Single Window OBPAS portal.',
    14,
    y + 4
  );

  // Download Trigger
  const filename = `UP_Byelaws_2025_Audit_Report_${state.plotArea}sqm_${Date.now().toString().slice(-6)}.pdf`;
  doc.save(filename);
}
