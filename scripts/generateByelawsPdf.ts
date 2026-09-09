import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

export function buildOfficialByelawsPdf(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = 1;

  // Helper for adding new page with running header/footer
  const startNewPage = () => {
    doc.addPage();
    currentPage++;
    drawHeaderFooter();
  };

  const drawHeaderFooter = () => {
    // Header line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('GOVERNMENT OF UTTAR PRADESH • HOUSING & URBAN PLANNING DEPARTMENT', margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('UP Building Byelaws 2025 (TMPR8)', pageWidth - margin, 11, { align: 'right' });

    // Footer line
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Official Statutory Document • UP Urban Planning and Development Act, 1973', margin, pageHeight - 10);
    doc.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  // Top accent bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setFillColor(16, 185, 129); // emerald-500 accent stripe
  doc.rect(0, 55, pageWidth, 3, 'F');

  // Title in header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GOVERNMENT OF UTTAR PRADESH', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('HOUSING & URBAN PLANNING DEPARTMENT', pageWidth / 2, 29, { align: 'center' });
  doc.text('Published: 4/9/25 • Version TMPR8', pageWidth / 2, 36, { align: 'center' });

  // Central Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, 70, contentWidth, 140, 4, 4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 70, contentWidth, 140, 4, 4, 'S');

  // Badge
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(pageWidth / 2 - 45, 82, 90, 8, 4, 4, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(pageWidth / 2 - 45, 82, 90, 8, 4, 4, 'S');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('STATUTORY REGULATORY CODE', pageWidth / 2, 87.5, { align: 'center' });

  // Main Document Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Uttar Pradesh Building Construction', pageWidth / 2, 104, { align: 'center' });
  doc.text('and Development Byelaws 2025', pageWidth / 2, 113, { align: 'center' });

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Byelaws for Urban Development Authorities', pageWidth / 2, 124, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin + 20, 133, pageWidth - margin - 20, 133);

  // Key Features Bullet List
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const bullets = [
    '• Comprehensive spatial regulations for all 22 Urban Development Authorities & AVP',
    '• Self-Certification System: Instant approvals for residential plots up to 500 sqm',
    '• Chapter 3.2.4: Plotted & High-Rise Setbacks, Height & Ground Coverage',
    '• Chapter 9: Compensatory FAR, Purchasable FAR & Premium Purchasable FAR',
    '• Chapter 15: Unified 16 Land Use Zones & Comprehensive Matrix of Permissibility',
    '• Chapter 16: Section 32 Statutory Compounding Framework & Penal Fee Schedules',
    '• Chapter 17: Electric Vehicle Charging Infrastructure (EVCI) Mandatory Standards',
    '• Chapter 18: In-Building Solutions for Common Telecom Infrastructure (CTI/FTTx)',
  ];

  let bulletY = 142;
  bullets.forEach(bullet => {
    doc.text(bullet, margin + 8, bulletY);
    bulletY += 7;
  });

  // Bottom Notice Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, 220, contentWidth, 55, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, 220, contentWidth, 55, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Statutory Authority & Enactment Note', margin + 8, 230);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  const noticeText = doc.splitTextToSize(
    'Enacted pursuant to Section 15, 15A, and 53 of the Uttar Pradesh Urban Planning and Development Act, 1973. ' +
    'These byelaws supersede Building Byelaws 2008 and Compounding Byelaws 2009. Applicable uniformly across Lucknow, ' +
    'Noida, Greater Noida, YEIDA, Kanpur, Varanasi, Agra, Prayagraj, Meerut, Ghaziabad, Ayodhya, Bareilly, Gorakhpur, ' +
    'Jhansi, Moradabad, Aligarh, Saharanpur, and all notified Development Authorities in Uttar Pradesh.',
    contentWidth - 16
  );
  doc.text(noticeText, margin + 8, 237);

  // ==========================================
  // PAGE 2: TABLE OF CONTENTS
  // ==========================================
  startNewPage();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Table of Contents', margin, 24);

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.line(margin, 27, margin + 40, 27);

  const tocItems = [
    { num: '1', title: 'Short Title and Definitions (102 Statutory Terms)', pages: '7 - 18' },
    { num: '2', title: 'Permission for Land Development and Building Construction', pages: '19 - 36' },
    { num: '3', title: 'Standards for Land Development and Building Construction', pages: '37 - 75' },
    { num: '4', title: 'Residential Buildings (Plotted, Group Housing, EWS/LIG & Affordable)', pages: '76 - 83' },
    { num: '5', title: 'Commercial Buildings (Bazaar Street, Complexes, Malls, Hotels, Cinemas)', pages: '84 - 93' },
    { num: '6', title: 'Institutional Buildings & Community Facilities (Hospitals, Colleges)', pages: '94 - 100' },
    { num: '7', title: 'Industrial and Agricultural Use Buildings (MSME, Data Centers, Farmhouses)', pages: '101 - 103' },
    { num: '8', title: 'Mixed-Use and Transit-Oriented Development (TOD)', pages: '104 - 107' },
    { num: '9', title: 'Additional Floor Area Ratio (Compensatory, Purchasable & Green FAR)', pages: '108 - 112' },
    { num: '10', title: 'Fire Prevention and Life Safety (UP Fire & Emergency Services Act 2022)', pages: '113 - 115' },
    { num: '11', title: 'Structural Safety and Quality Control (SDBR & Seismic Standards)', pages: '116 - 122' },
    { num: '12', title: 'Provisions for Differently Abled, Elderly and Children (Barrier-Free)', pages: '123 - 126' },
    { num: '13', title: 'Environmental Sustainability (RWH, Solar PV/Water, Waste & Greywater)', pages: '127 - 133' },
    { num: '14', title: 'Qualifications and Competence of Licensed Technical Persons (LTP)', pages: '134 - 137' },
    { num: '15', title: 'Zoning Regulations & Matrix for Permissibility of Activities', pages: '138 - 156' },
    { num: '16', title: 'Compounding of Building Construction and Development (Section 32)', pages: '157 - 163' },
    { num: '17', title: 'Provision of Electric Charging Infrastructure (EVCI)', pages: '164 - 174' },
    { num: '18', title: 'In-Building Solutions for Common Telecom Infrastructure (CTI)', pages: '175 - 180' },
    { num: 'App', title: 'Appendix 1 - 15 (Standardized Forms, Certificates & Master Plan Use Zones)', pages: '181 - 224' },
  ];

  let tocY = 36;
  doc.setFontSize(8.5);

  tocItems.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, tocY - 4.5, contentWidth, 9, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.num}.`, margin + 3, tocY + 1.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(item.title, margin + 14, tocY + 1.5);

    doc.setFont('courier', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(`pp. ${item.pages}`, pageWidth - margin - 3, tocY + 1.5, { align: 'right' });

    tocY += 10.5;
  });

  // Summary box on TOC page
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin, 245, contentWidth, 36, 3, 3, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, 245, contentWidth, 36, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  doc.text('Key Highlights of 2025 Byelaws:', margin + 6, 252);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 118, 110);
  doc.text('• Full digital integration with single-window online sanctioning and automated deemed approval workflows.', margin + 6, 258);
  doc.text('• Strict 10-15 day response limits for 15 Government Departments with automatic deemed NOC generation.', margin + 6, 264);
  doc.text('• Transparent calculation matrices for Base FAR, Purchasable FAR, Compensatory FAR, and Section 32 compounding fees.', margin + 6, 270);
  doc.text('• Uniform application across all categories of development from plotted residential to 150m+ high-rise structures.', margin + 6, 276);

  // ==========================================
  // PAGE 3: CHAPTER 1 & 2 (DEFINITIONS & PERMISSIONS)
  // ==========================================
  startNewPage();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Chapter 1: Short Title & Key Definitions', margin, 24);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.line(margin, 26, margin + 70, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('The 2025 Byelaws define 102 statutory terms under Section 1.2. Key terms are highlighted below:', margin, 32);

  const defs = [
    { term: '1. Access / Road Width', def: 'Clear approach to a plot from a public road/street forming part of Right of Way (ROW).' },
    { term: '14. Basement / Cellar', def: 'Lower storey of a building partly or wholly below ground. Max height above ground level shall not exceed 1.20 meters.' },
    { term: '17. Building Height', def: 'Vertical distance from average road level up to terrace level. Architectural non-functional features excluded.' },
    { term: '18. Building Envelope', def: 'Horizontal spatial limits up to which construction is permitted after leaving mandatory setbacks.' },
    { term: '38. Floor Area Ratio (FAR)', def: 'Total covered area on all floors divided by total plot area. Excludes areas specifically exempted under Section 3.2.2.8.' },
    { term: '38(a). Compensatory FAR', def: 'Additional FAR granted free of cost to compensate for land surrendered for road widening or public utilities.' },
    { term: '38(b). Purchasable FAR', def: 'Additional FAR permissible over Base FAR on payment of prescribed statutory charges under Chapter 9.' },
    { term: '68. Corner Plot', def: 'A plot situated at the junction of two or more intersecting/meeting roads (Note-2 applies: side setback = front setback).' },
    { term: '69. Island Plot', def: 'Plot surrounded by public roads on all four sides. Frontage assigned to the widest approach road.' },
    { term: '93. Stilt Floor', def: 'Structure on plinth on pillars intended for parking. Excluded from FAR, included in building height.' },
  ];

  let defY = 38;
  defs.forEach(d => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(d.term, margin, defY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(d.def, contentWidth - 45);
    doc.text(lines, margin + 45, defY);
    defY += lines.length * 4.5 + 2.5;
  });

  // Chapter 2 Heading
  defY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Chapter 2: Permission for Land Development & Building Construction', margin, defY);
  doc.setDrawColor(16, 185, 129);
  doc.line(margin, defY + 2, margin + 120, defY + 2);
  defY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const ch2Points = [
    '• Section 2.1.2(ii) Exemption: Residential plots <= 100 sqm and Commercial plots <= 30 sqm require NO building permission. Online self-declaration with token Re. 1/- fee; no completion certificate required.',
    '• Section 2.1.2(iii) Instant Online Approval: In approved/developed layouts, residential plots <= 500 sqm (except multi-unit) and commercial plots <= 200 sqm receive instant online approval upon certification by a Licensed Technical Person (LTP).',
    '• Section 2.2.3(iii) Deemed NOC: 15 Statutory Departments (Airports, Army, Fire, Metro, Railways, Forest, NHAI, ASI) must respond within 5 to 15 days. If no explicit order is issued, NOC is deemed granted on the 30th day.',
    '• Section 2.7.4 Validity of Permits: Development Permit valid for 5 years (+3 yr extension). Building Permit valid for 5 years (+3 yr revalidation).',
    '• Section 2.8.1 Plinth-Level Inspection: Within 48 hours of reaching plinth level, owner/builder must upload GPS coordinates, digital photographs, and Appendix-12 affidavit.',
  ];

  ch2Points.forEach(p => {
    const pLines = doc.splitTextToSize(p, contentWidth);
    doc.text(pLines, margin, defY);
    defY += pLines.length * 4.2 + 2;
  });

  // ==========================================
  // PAGE 4: CHAPTER 3 - DEVELOPMENT STANDARDS & SETBACKS
  // ==========================================
  startNewPage();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Chapter 3: Standards for Land Development, FAR & Setbacks', margin, 24);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.line(margin, 26, margin + 110, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('3.2.4.1 Plotted Residential Setbacks (Buildings <= 15m Height / Stilts + 3-4 Storeys)', margin, 32);

  // Table for Plotted Setbacks
  const plotTableY = 36;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, plotTableY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Plot Area (sqm)', margin + 4, plotTableY + 4.8);
  doc.text('Front (m)', margin + 55, plotTableY + 4.8);
  doc.text('Rear (m)', margin + 85, plotTableY + 4.8);
  doc.text('Side-1 (m)', margin + 115, plotTableY + 4.8);
  doc.text('Side-2 (m)', margin + 145, plotTableY + 4.8);

  const plotRows = [
    { area: 'Up to 150 sqm (Row Housing)', front: '1.0 m', rear: '0.0 m', s1: '0.0 m', s2: '0.0 m' },
    { area: '>150 to 300 sqm (Row Housing)', front: '3.0 m', rear: '1.5 m', s1: '0.0 m', s2: '0.0 m' },
    { area: '>300 to 500 sqm (Row Housing)', front: '3.0 m', rear: '3.0 m', s1: '0.0 m', s2: '0.0 m' },
    { area: '>500 to 1200 sqm (Semi-Detached)', front: '4.5 m', rear: '4.5 m', s1: '1.5 m', s2: '0.0 m' },
    { area: '>1200 sqm (Detached)', front: '6.0 m', rear: '6.0 m', s1: '1.5 m', s2: '1.5 m' },
  ];

  let curY = plotTableY + 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  plotRows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, curY, contentWidth, 6, 'F');
    }
    doc.text(r.area, margin + 4, curY + 4.2);
    doc.text(r.front, margin + 55, curY + 4.2);
    doc.text(r.rear, margin + 85, curY + 4.2);
    doc.text(r.s1, margin + 115, curY + 4.2);
    doc.text(r.s2, margin + 145, curY + 4.2);
    curY += 6;
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('Statutory Note-2 (Corner Plots & Multi-Road Frontage):', margin, curY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const note2Text = doc.splitTextToSize(
    'The setback towards every abutting road in corner plots or multi-road plots shall not be less than the prescribed front setback. In approved layouts without specific prescriptions, minimum side setback in corner plots up to 500 sqm shall be 1.5m.',
    contentWidth
  );
  doc.text(note2Text, margin, curY + 8);

  curY += 18;

  // High Rise Setbacks Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('3.2.4.9 High-Rise Setbacks for Buildings with Height Exceeding 15 Meters', margin, curY);

  curY += 4;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, curY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Building Height (m)', margin + 4, curY + 4.8);
  doc.text('Front Setback', margin + 65, curY + 4.8);
  doc.text('Rear Setback', margin + 105, curY + 4.8);
  doc.text('Side-1 & Side-2 Setbacks', margin + 145, curY + 4.8);

  const hrRows = [
    { ht: '>15 to 17.5 m', f: '5.0 m', r: '5.0 m', s: '5.0 m' },
    { ht: '>17.5 to 21 m', f: '6.0 m', r: '6.0 m', s: '6.0 m' },
    { ht: '>21 to 27 m', f: '7.0 m', r: '7.0 m', s: '7.0 m' },
    { ht: '>27 to 33 m', f: '8.0 m', r: '8.0 m', s: '8.0 m' },
    { ht: '>33 to 39 m', f: '9.0 m', r: '9.0 m', s: '9.0 m' },
    { ht: '>39 to 45 m', f: '10.0 m', r: '10.0 m', s: '10.0 m' },
    { ht: '>45 to 51 m', f: '11.0 m', r: '11.0 m', s: '11.0 m' },
    { ht: '>51 m (High-Rise Pinnacle)', f: '15.0 m', r: '12.0 m', s: '12.0 m' },
  ];

  curY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  hrRows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, curY, contentWidth, 5.5, 'F');
    }
    doc.text(r.ht, margin + 4, curY + 3.8);
    doc.text(r.f, margin + 65, curY + 3.8);
    doc.text(r.r, margin + 105, curY + 3.8);
    doc.text(r.s, margin + 145, curY + 3.8);
    curY += 5.5;
  });

  // FAR Exemptions Box
  curY += 5;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, contentWidth, 38, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, curY, contentWidth, 38, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Section 3.2.2.8 Statutory Exemptions from FAR Calculations:', margin + 6, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const farExemptions = [
    '• Lift Machine Rooms, Lift Shafts (counted once on GF), and Lift Lobbies up to 10 square meters.',
    '• Electrical meter rooms, DG set rooms, transformer substations, HVAC chillers, and service ducts.',
    '• Basements within setback lines used for parking, air conditioning plant, STP, and domestic storage.',
    '• Stilt floor used exclusively for parking (mandatory for multi-units; optional for single units).',
    '• Cantilever projections / sunshades up to 0.75m width; Balconies up to 2.0m width in residential/group housing.',
    '• Fire escapes / external staircases, refuge areas (per fire norms), and rooftop rainwater harvesting structures.',
  ];

  let exY = curY + 11;
  farExemptions.forEach(fe => {
    doc.text(fe, margin + 6, exY);
    exY += 4.5;
  });

  // ==========================================
  // PAGE 5: CHAPTER 4 & 5 - RESIDENTIAL & COMMERCIAL
  // ==========================================
  startNewPage();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Chapter 4 & 5: Residential & Commercial Regulations', margin, 24);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.line(margin, 26, margin + 105, 26);

  // Group Housing FAR Matrix
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('4.2.8 Group Housing FAR Matrix by Road Width', margin, 32);

  const ghTableY = 36;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, ghTableY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Zone & Road Width', margin + 4, ghTableY + 4.8);
  doc.text('Base FAR (BFAR)', margin + 65, ghTableY + 4.8);
  doc.text('Purchasable (PFAR)', margin + 100, ghTableY + 4.8);
  doc.text('Premium (PPFAR)', margin + 135, ghTableY + 4.8);
  doc.text('Max FAR (MFAR)', margin + 168, ghTableY + 4.8);

  const ghRows = [
    { cat: 'Built-up (9 - 12m Road)', b: '1.50', p: '0.30', pp: '0.30', m: '2.10' },
    { cat: 'Built-up (>12 - 24m Road)', b: '1.50', p: '0.75', pp: '0.75', m: '3.00' },
    { cat: 'Built-up (>24 - 45m Road)', b: '1.50', p: '1.50', pp: '2.25', m: '5.25' },
    { cat: 'Built-up (>45m Road)', b: '1.50', p: '1.50', pp: 'Unrestricted', m: 'Unrestricted' },
    { cat: 'Non-Built-up (>12 - 24m Road)', b: '2.50', p: '1.25', pp: '1.25', m: '5.00' },
    { cat: 'Non-Built-up (>24 - 45m Road)', b: '2.50', p: '2.50', pp: '3.75', m: '8.75' },
    { cat: 'Non-Built-up (>45m Road)', b: '2.50', p: '2.50', pp: 'Unrestricted', m: 'Unrestricted' },
  ];

  curY = ghTableY + 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  ghRows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, curY, contentWidth, 5.5, 'F');
    }
    doc.text(r.cat, margin + 4, curY + 3.8);
    doc.text(r.b, margin + 65, curY + 3.8);
    doc.text(r.p, margin + 100, curY + 3.8);
    doc.text(r.pp, margin + 135, curY + 3.8);
    doc.text(r.m, margin + 168, curY + 3.8);
    curY += 5.5;
  });

  // Chapter 5 Commercial
  curY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('5.1 & 5.2 Commercial Regulations: Bazaar Streets, Complexes & Malls', margin, curY);

  curY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const commPoints = [
    '• Bazaar Street (5.1): Right-of-way minimum 12m. Commercial permitted on Ground & 1st floors; upper floors residential. Full plot depth usable for commercial. Setbacks: 12m road -> 3m front; 18m road -> 4.5m front; 24-30m road -> 6.0m front; 36-45m road -> 7.5m front.',
    '• Commercial Complex & Shopping Malls (5.2): Min road width: Retail shops 6m (built-up) / 9m (non-built-up); Convenient shopping 12m; Commercial complex 12m; Shopping mall 18m.',
    '• Skylighted Atrium (5.2.5.iii): Permissible in shopping malls, not counted in FAR. Max 20% area permissible for temporary kiosks.',
    '• Hotels (5.3): Min 6 rooms. Up to 20 rooms: min road width 9m; >20 rooms: min road width 12m and min plot size 500 sqm.',
    '• Cinemas & Multiplexes (5.4): Min plot size: Single screen 500 sqm (12m road); Miniplex 700 sqm (12m road); Multiplex 3000 sqm (18m road). Min 2 screens mandatory.',
  ];

  commPoints.forEach(cp => {
    const cpLines = doc.splitTextToSize(cp, contentWidth);
    doc.text(cpLines, margin, curY);
    curY += cpLines.length * 4.2 + 2;
  });

  // EWS & LIG Requirements
  curY += 4;
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(margin, curY, contentWidth, 38, 3, 3, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, curY, contentWidth, 38, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('Chapter 4.3 Mandatory EWS & LIG Reservations & Shelter Fee Formula:', margin + 6, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  doc.text('• 10% each of total units mandatory for EWS and LIG respectively in all housing schemes having >1 unit.', margin + 6, curY + 12);
  doc.text('• EWS Plot size: 35-40 sqm | Carpet Area: 30-35 sqm | Annual income limit: <= Rs. 3 Lakhs | Ceiling: Rs. 4.50 Lakhs', margin + 6, curY + 17);
  doc.text('• LIG Plot size: 40-50 sqm | Carpet Area: 35-45 sqm | Annual income limit: Rs. 3-6 Lakhs | Ceiling: Rs. 9.00 Lakhs', margin + 6, curY + 22);
  doc.text('• Shelter Fee (Plots < 4 Ha): 10% × [(Total DUs) × (Min EWS Carpet + Min LIG Carpet) × Circle Rate]', margin + 6, curY + 27);
  doc.text('• Incentive FAR: Equivalent to carpet area of constructed EWS/LIG units allowed free of FAR.', margin + 6, curY + 32);

  // ==========================================
  // PAGE 6: CHAPTER 9, 15 & 16 - FAR, ZONING & COMPOUNDING
  // ==========================================
  startNewPage();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Chapter 9, 15 & 16: FAR Computation, Zoning & Compounding', margin, 24);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.line(margin, 26, margin + 120, 26);

  // Purchasable FAR Fee Formula
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Chapter 9.2.5 Computation of Fee for Purchasable & Premium Purchasable FAR', margin, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Fee Formula: C = Le × Rc × P', margin, 38);
  doc.text('Where: C = Total Charge (Rs.), Le = Proportional Land Requirement = Additional Floor Area (FP) ÷ Base FAR', margin, 43);
  doc.text('Rc = Current Land Rate (District Magistrate Circle Rate or Authority Rate, whichever is higher)', margin, 48);
  doc.text('P = Factor Coefficient: Commercial (PFAR 0.50 / PPFAR 1.0); Mixed Use (0.45 / 0.90); Office (0.45 / 0.90); Residential (0.40 / 0.80)', margin, 53);

  // Chapter 16 Compounding
  let compY = 62;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Chapter 16: Section 32 Statutory Compounding of Deviations', margin, compY);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.line(margin, compY + 2, margin + 110, compY + 2);

  compY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Section 16.3.3 Permissible Compounding Limits (Non-Violative Deviations):', margin, compY);

  const compLimits = [
    '• Front Setback: Up to 25% of front setback area, subject to a STRICT ceiling of 1.0 meter (Buildings <= 15m). For buildings >15m: max 10% of setback area up to 1.0m width, subject to Fire NOC.',
    '• Rear Setback: Plots <= 500 sqm: 100% compoundable provided light and ventilation norms are preserved. Plots >500 sqm: max 10% addition beyond permissible 40% rear coverage.',
    '• Side Setback: Construction up to a maximum of 25% of width of side setback is compoundable.',
    '• Ground Coverage & FAR: Maximum 10% of total permissible FAR in addition to permissible ground coverage.',
    '• Building Height: Maximum 10% height increase without adding extra storeys.',
  ];

  compY += 5;
  compLimits.forEach(cl => {
    const clLines = doc.splitTextToSize(cl, contentWidth);
    doc.text(clLines, margin, compY);
    compY += clLines.length * 4.2 + 2;
  });

  // Compounding Rates Table
  compY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Schedule 16.3.8 Compounding Rates for Ground-Floor Setback Deviations:', margin, compY);

  compY += 4;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, compY, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Deviation Type', margin + 4, compY + 4.5);
  doc.text('Residential', margin + 55, compY + 4.5);
  doc.text('Commercial', margin + 95, compY + 4.5);
  doc.text('Office', margin + 135, compY + 4.5);
  doc.text('Industrial', margin + 170, compY + 4.5);

  const compTableRows = [
    { dev: 'Front Setback Deviation', res: '100% Land Rate', com: '200% Land Rate', off: '150% Land Rate', ind: '40% Land Rate' },
    { dev: 'Side Setback Deviation', res: '75% Land Rate', com: '150% Land Rate', off: '100% Land Rate', ind: '40% Land Rate' },
    { dev: 'Rear Setback Deviation', res: '50% Land Rate', com: '100% Land Rate', off: '75% Land Rate', ind: '20% Land Rate' },
    { dev: 'Buildings >15m (All Sides)', res: '100% Land Rate', com: '200% Land Rate', off: '150% Land Rate', ind: '40% Land Rate' },
  ];

  compY += 6.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  compTableRows.forEach((cr, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, compY, contentWidth, 5.5, 'F');
    }
    doc.text(cr.dev, margin + 4, compY + 3.8);
    doc.text(cr.res, margin + 55, compY + 3.8);
    doc.text(cr.com, margin + 95, compY + 3.8);
    doc.text(cr.off, margin + 135, compY + 3.8);
    doc.text(cr.ind, margin + 170, compY + 3.8);
    compY += 5.5;
  });

  // Non-Compoundable Offences Box
  compY += 6;
  doc.setFillColor(254, 242, 242); // red-50
  doc.roundedRect(margin, compY, contentWidth, 36, 3, 3, 'F');
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(margin, compY, contentWidth, 36, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  doc.text('Section 16.3.2 Non-Compoundable Offences (Mandatory Demolition):', margin + 6, compY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(153, 27, 27);
  doc.text('• Constructions on land reserved for public roads, parks, green verges, or public utilities.', margin + 6, compY + 12);
  doc.text('• Violations of Master Plan / Zonal Development Plan land use; constructions in illegal colonies.', margin + 6, compY + 17);
  doc.text('• Buildings lacking mandatory earthquake-resistant design certification under Chapter 11.8.', margin + 6, compY + 22);
  doc.text('• Buildings lacking mandatory Fire Department NOC under Chapter 10.1.3; constructions on water bodies / rivers.', margin + 6, compY + 27);
  doc.text('• Encroachments on common areas, parking spaces, or height violations in protected heritage / aviation zones.', margin + 6, compY + 32);

  // ==========================================
  // PAGE 7: CHAPTERS 10-14 & 17-18 + APPENDICES
  // ==========================================
  startNewPage();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Special Technical Mandates & Statutory Appendices', margin, 24);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.line(margin, 26, margin + 105, 26);

  let techY = 32;

  const techSections = [
    {
      title: 'Chapter 10: Fire Prevention & Life Safety',
      points: [
        '• Mandates Fire Safety Certificate for buildings >15m height, special occupancies, and mixed uses >500 sqm.',
        '• Requires 6.0m clear unobstructed motorable accessway around buildings for fire tender movement.',
        '• Automatic sprinklers, internal/yard hydrants, static water storage, and refuge areas per NBC 2016 Part 4.',
      ],
    },
    {
      title: 'Chapter 11: Structural Safety & SDBR (Appendix-14)',
      points: [
        '• Mandatory Structural Design Basis Report (SDBR) for RCC, Steel, and Load Bearing structures.',
        '• Compliance with IS:456, IS:800, IS:1893 (Seismic Criteria), IS:13920 (Ductile Detailing), and IS:4326.',
        '• Peer review by empanelled structural engineer mandatory for all buildings above 50m height.',
      ],
    },
    {
      title: 'Chapter 12: Barrier-Free Accessibility for Differently Abled',
      points: [
        '• Mandatory accessible entrance ramp with maximum slope 1:12, handrails on both sides, minimum width 1.8m.',
        '• Dedicated accessible toilet (min 1.5m × 1.75m) on every floor; tactile pavers along walkways.',
        '• Accessible parking: minimum 3.6m × 5.0m bay within 30m of building entrance or lift lobby.',
      ],
    },
    {
      title: 'Chapter 13: Environmental Sustainability & Green Measures',
      points: [
        '• Rainwater Harvesting mandatory for all plots >= 300 sqm and group housing schemes.',
        '• Solar Water Heating mandatory for hotels, hospitals, hostels, and residential plots >= 500 sqm.',
        '• Rooftop Solar PV mandatory on min 25% of plinth area for buildings >= 5000 sqm.',
        '• Dual plumbing and greywater recycling mandatory where water discharge exceeds 10,000 liters/day.',
      ],
    },
    {
      title: 'Chapter 17: Electric Vehicle Charging Infrastructure (EVCI)',
      points: [
        '• 20% of total parking capacity must be EV-ready with safety factor of 1.25 on connected power load.',
        '• Public Charging Stations (PCS): min 1 FC per 10 EVs, 1 SC per 3 EVs; CCS & CHAdeMO standards.',
        '• Grid density target: 1 Public Charging Station within a 3km × 3km urban grid.',
      ],
    },
    {
      title: 'Chapter 18: Common Telecom Infrastructure (CTI/FTTx)',
      points: [
        '• Buildings must be digital connectivity ready with dedicated telecom ducts, risers, and MDF rooms.',
        '• Non-discriminatory open access for Telecom Service Providers (TSPs / IP-1s); no commercial rents.',
      ],
    },
  ];

  techSections.forEach(ts => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(ts.title, margin, techY);
    techY += 4.2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    ts.points.forEach(pt => {
      const ptLines = doc.splitTextToSize(pt, contentWidth);
      doc.text(ptLines, margin + 3, techY);
      techY += ptLines.length * 3.8 + 1.2;
    });
    techY += 2.5;
  });

  // Appendices Summary
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, techY, contentWidth, 34, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, techY, contentWidth, 34, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Statutory Appendices (Schedule 1 - 15):', margin + 6, techY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text('• Appendix-1: 21 Government Orders amended • Appendix-2 & 5: Development & Building Permit Application Forms', margin + 6, techY + 12);
  doc.text('• Appendix-3 & 6: Notice of Commencement • Appendix-4 & 7: Forms A, B, C & D Completion Certificates', margin + 6, techY + 17);
  doc.text('• Appendix-8 & 9: Building Information Schedule & Structural Safety Certificate', margin + 6, techY + 22);
  doc.text('• Appendix-10 & 11: Foundation Design & Completion Certificates • Appendix-12 & 13: Plinth Affidavit & Inspection Notice', margin + 6, techY + 27);
  doc.text('• Appendix-14: SDBR Structural Design Basis Report • Appendix-15: Master Plan Use Zones across all 22 UP Authorities', margin + 6, techY + 32);

  // Write file to public/
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const pdfOutput = doc.output('arraybuffer');
  const primaryPath = path.join(publicDir, 'UP_Building_Byelaws_2025.pdf');
  const aliasPath = path.join(publicDir, 'UP_Building_Construction_and_Development_Byelaws_2025.pdf');

  fs.writeFileSync(primaryPath, Buffer.from(pdfOutput));
  fs.writeFileSync(aliasPath, Buffer.from(pdfOutput));

  console.log(`Generated official byelaws PDF: ${primaryPath} (${pdfOutput.byteLength} bytes)`);
}

// Run if directly executed
buildOfficialByelawsPdf();
