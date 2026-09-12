import { jsPDF } from 'jspdf';
import { Assessment, Finding } from '../domain/findings';
import { ProjectState } from '../domain/project';
import { occupancyLabel } from '../domain/project';

/** Indian-format rupees, for the statutory charge sheet. */
const inr = (n: number): string => `Rs ${Math.round(n).toLocaleString('en-IN')}`;

/** Findings map onto the report's four statuses. */
const STATUS_LABEL: Record<Finding['status'], string> = {
  ok: 'CLEAR', attention: 'TO SETTLE', blocked: 'BLOCKING', info: 'NOTE',
};

export function generateAuditPdfReport(state: ProjectState, assessment: Assessment): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 14;

  const auditResults = assessment.findings;
  const conflicts = assessment.findings.filter((f) => f.status === 'blocked');
  const compliantCount = assessment.ok;
  const conditionalCount = assessment.attention;
  const nonCompliantCount = assessment.blocked;
  const totalCount = auditResults.length || 1;
  const scorePercent = Math.round(((compliantCount + conditionalCount * 0.5) / totalCount) * 100);

  // A reference derived from the inputs, so re-running the same project reproduces the
  // same reference. The previous Math.random() id looked like a certificate number while
  // being unverifiable and different on every export.
  const fingerprint = [
    state.occupancy, state.plotArea, state.plotFrontage, state.roadWidth, state.buildingHeight,
    state.proposedBuiltUpArea, state.frontSetbackProvided, state.rearSetbackProvided,
    state.side1Provided, state.side2Provided, state.parkingBaysProvided, state.greenRating,
  ].join('|');
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) hash = (hash * 31 + fingerprint.charCodeAt(i)) >>> 0;
  const certId = `UP-BL25-${hash.toString(36).toUpperCase().padStart(7, '0').slice(0, 7)}`;
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
  doc.text('UP BUILDING BYELAWS 2025 — PRE-SCRUTINY REPORT', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Unofficial decision-support output — not a certificate and not issued by any Authority', 14, 18);
  doc.text(`Reference: ${certId}   |   Generated: ${dateStr}   |   Basis: UP Byelaws 2025 (TMPR8)`, 14, 23);

  y = 36;

  // Title Box
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PROJECT COMPLIANCE PRE-SCRUTINY', 14, y);
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
  doc.text(occupancyLabel(state.occupancy).toUpperCase(), col1X + 22, py);

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
  doc.text(`${state.hasRWH ? 'RWH' : 'No RWH'} | ${state.hasSolarPv ? 'Solar PV' : 'No PV'} | ${state.hasSolarHeating ? 'Solar HW' : 'No solar HW'}`, col3X + 22, py);

  y += 48;

  // Compliance Scorecard Bar
  // Bands as whole colours rather than a per-channel ternary blend, which mixed the
  // amber and rose palettes into arbitrary values at some scores.
  const band: { fill: [number, number, number]; stroke: [number, number, number]; text: [number, number, number] } =
    scorePercent >= 80
      ? { fill: [236, 253, 245], stroke: [167, 243, 208], text: [6, 95, 70] }
      : scorePercent >= 60
        ? { fill: [255, 251, 235], stroke: [253, 230, 138], text: [146, 64, 14] }
        : { fill: [254, 242, 242], stroke: [254, 202, 202], text: [153, 27, 27] };

  doc.setFillColor(...band.fill);
  doc.setDrawColor(...band.stroke);
  doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...band.text);
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

  /** Draw wrapped text, paginating when the block would overflow the page. */
  const writeWrapped = (
    text: string,
    x: number,
    maxWidth: number,
    lineHeight = 3.6,
  ): void => {
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      if (y > pageHeight - 18) {
        doc.addPage();
        y = 16;
      }
      doc.text(line, x, y);
      y += lineHeight;
    }
  };

  const sectionRule = (): void => {
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, pageWidth - 14, y);
    y += 4;
  };

  /**
   * Statutory charges, and the route.
   *
   * The report listed every finding and never totalled the money in them, so a reader had
   * to add the fee heads up themselves across three pages — which is the one number a
   * lender or an equity partner opens the document for. Each head is printed with the
   * clause that imposes it, because a charge without a clause cannot be checked against
   * the Authority's own demand.
   *
   * Derived from the findings rather than recomputed, so the sheet cannot disagree with the
   * body of the report.
   */
  const charges = auditResults.filter((f) => f.money && f.money.amount > 0);
  const route = auditResults.find((f) => f.id === 'route');
  const clock = auditResults.find((f) => f.id === 'permit-clock');

  if (charges.length > 0 || route) {
    if (y > pageHeight - 60) { doc.addPage(); y = 16; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('STATUTORY CHARGES AND APPROVAL ROUTE', 14, y);
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, pageWidth - 14, y);
    y += 5;

    const amountX = pageWidth - 16;

    if (charges.length > 0) {
      doc.setFontSize(7.6);
      for (const item of charges) {
        if (y > pageHeight - 28) { doc.addPage(); y = 16; }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(item.money!.label, 18, y);

        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(item.clause ?? '—', 78, y);

        doc.setFontSize(7.6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        const amount = inr(item.money!.amount);
        doc.text(amount, amountX - doc.getTextWidth(amount), y);
        y += 4.6;
      }

      // The total, on the engine's own figure rather than a re-addition of the lines above.
      doc.setDrawColor(203, 213, 225);
      doc.line(18, y - 2, pageWidth - 16, y - 2);
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.6);
      doc.setTextColor(15, 23, 42);
      doc.text('Total statutory charges', 18, y);
      const total = inr(assessment.totalFees);
      doc.text(total, amountX - doc.getTextWidth(total), y);
      y += 4.6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      writeWrapped(
        'Charges the byelaws compute on the inputs given. They exclude the ordinary sanction and '
        + 'development fees, the Authority\'s own scrutiny charges, and any head that turns on a '
        + 'figure not supplied here — the shelter fee, for instance, is stated per dwelling unit '
        + 'and cannot be totalled without a unit count.',
        18,
        pageWidth - 34,
        3.2,
      );
      y += 1.5;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      doc.setTextColor(51, 65, 85);
      doc.text('No purchasable FAR, impact or compounding charge arises on these inputs.', 18, y);
      y += 5;
    }

    if (route) {
      if (y > pageHeight - 30) { doc.addPage(); y = 16; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(15, 23, 42);
      doc.text('Route:', 18, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      writeWrapped(route.headline, 32, pageWidth - 48, 3.4);

      if (clock) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Clock:', 18, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        writeWrapped(clock.headline, 32, pageWidth - 48, 3.4);
      }
      y += 2;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, pageWidth - 14, y);
    y += 5;
  }

  // Findings, in full. The previous version sliced every field to 30–44 characters,
  // so the statutory limit, the proposed value and the entire remediation — the part
  // that tells the applicant what to do — never reached the page.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  if (y > pageHeight - 30) { doc.addPage(); y = 16; }
  doc.text('AUDIT FINDINGS', 14, y);
  y += 5;
  sectionRule();

  const contentWidth = pageWidth - 32;

  auditResults.forEach((item, index) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 16;
    }

    const isPass = item.status === 'ok';
    const isWarn = item.status === 'attention' || item.status === 'info';

    // Status chip
    const chipColor: [number, number, number] = isPass ? [5, 150, 105] : isWarn ? [217, 119, 6] : [220, 38, 38];
    doc.setFillColor(...chipColor);
    doc.circle(16.5, y - 1.2, 1.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${index + 1}. ${item.headline}`, 20, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...chipColor);
    const statusLabel = STATUS_LABEL[item.status];
    doc.text(statusLabel, pageWidth - 14 - doc.getTextWidth(statusLabel), y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    writeWrapped(`${item.topic} · ${item.clause ?? '—'}`, 20, contentWidth - 6, 3.2);
    y += 0.8;

    doc.setFontSize(7.4);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text('Required:', 20, y);
    doc.setFont('helvetica', 'normal');
    writeWrapped(item.required ?? '—', 36, contentWidth - 22, 3.4);

    doc.setFont('helvetica', 'bold');
    doc.text('Proposed:', 20, y);
    doc.setFont('helvetica', 'normal');
    writeWrapped(item.proposed ?? '—', 36, contentWidth - 22, 3.4);

    doc.setFont('helvetica', 'bold');
    doc.text('Working:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    writeWrapped(item.working ?? item.detail, 36, contentWidth - 22, 3.4);

    if (item.fix) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...chipColor);
      doc.text('Action:', 20, y);
      doc.setFont('helvetica', 'normal');
      writeWrapped(item.fix.label, 36, contentWidth - 22, 3.4);
    }

    y += 2.5;
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y, pageWidth - 14, y);
    y += 4;
  });

  // Every detected conflict, not the first two.
  if (conflicts.length > 0) {
    if (y > pageHeight - 30) { doc.addPage(); y = 16; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('REGULATORY CONFLICTS', 14, y);
    y += 5;
    sectionRule();

    conflicts.forEach((conflict, index) => {
      if (y > pageHeight - 35) { doc.addPage(); y = 16; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(185, 28, 28);
      writeWrapped(`${index + 1}. ${conflict.headline}`, 16, contentWidth, 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      writeWrapped(conflict.clause ?? '—', 20, contentWidth - 6, 3.2);

      doc.setFontSize(7.4);
      doc.setTextColor(51, 65, 85);
      writeWrapped(conflict.detail, 20, contentWidth - 6, 3.4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      if (conflict.fix) writeWrapped(`Remedy: ${conflict.fix.label}`, 20, contentWidth - 6, 3.4);

      y += 3;
    });
  }

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
  const disclaimer = doc.splitTextToSize(
    'This is an automated pre-scrutiny report produced by an unofficial decision-support tool. It carries no statutory force and is not a certificate. ' +
      'Figures are computed from the published UP Building Construction and Development Byelaws 2025; verify every value against the gazette and the concerned ' +
      'Development Authority before submitting on the UP Nivesh Mitra single-window OBPAS portal. Reference ' + certId + ' is derived from the input values and ' +
      'reproduces for identical inputs; it is not an Authority-issued number.',
    pageWidth - 28,
  ) as string[];
  disclaimer.forEach((line, index) => doc.text(line, 14, y + index * 3.2));

  // Download Trigger
  const filename = `UP_Byelaws_2025_Audit_Report_${state.plotArea}sqm_${Date.now().toString().slice(-6)}.pdf`;
  doc.save(filename);
}


