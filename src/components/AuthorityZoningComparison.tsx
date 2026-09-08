import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  ShieldCheck,
  Building2,
  MapPin,
  Layers,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export interface AuthorityDetailedProfile {
  id: string;
  code: number;
  name: string;
  shortName: string;
  region: string;
  masterPlanHorizon: string;
  gisPortalUrl: string;
  riverBufferNorms: string;
  riverBufferSeverity: 'strict' | 'standard' | 'moderate';
  environmentalControl: string;
  todCorridorRules: string;
  maxBaseFarResidential: string;
  maxPurchasableFar: string;
  specialIndustrialMSME: string;
  aviationHeightFunnel: string;
  ruralAbadiRegularization: string;
  appendix15Zones: { code: string; localName: string }[];
  uniqueRegulatoryNote: string;
}

export const DETAILED_AUTHORITIES: AuthorityDetailedProfile[] = [
  {
    id: 'ayodhya',
    code: 1,
    name: 'Ayodhya Development Authority (ADA)',
    shortName: 'Ayodhya',
    region: 'Ayodhya Division (Ram Janmabhoomi Heritage Zone)',
    masterPlanHorizon: 'Master Plan 2031 (Notified & Enforced)',
    gisPortalUrl: 'https://ayodhyada.in',
    riverBufferNorms: 'Saryu River 200m Prohibited Green Buffer along banks. Chaurasi Kosi & Panchkosi Parikrama marg strict pedestrian preservation with zero new commercial frontage inside 100m.',
    riverBufferSeverity: 'strict',
    environmentalControl: 'Strict low-emission corridor, heritage building height caps (max 12m-15m in sacred precinct), traditional temple-style architectural façade guidelines.',
    todCorridorRules: 'TOD corridor planned along Ayodhya-Faizabad 4-lane link road with 1.25x FAR multiplier subject to 18m road width.',
    maxBaseFarResidential: '1.50 - 2.00 (Telescopic Plotted)',
    maxPurchasableFar: 'Up to 0.50 on 12m-18m roads, 0.75 on ≥18m roads',
    specialIndustrialMSME: 'Religious tourism handicrafts, incense/dhoop MSME, wooden craft clusters. Heavy/chemical industries strictly banned.',
    aviationHeightFunnel: 'Maharishi Valmiki International Airport (Ayodhya) Obstacle Limitation Surface (OLS) funnel restriction applying strict height caps within 10 km radius.',
    ruralAbadiRegularization: 'Zone RA abadi consolidation with 20% mandatory green reservation around historical ponds (kunds).',
    appendix15Zones: [
      { code: 'HZ', localName: 'Pilgrim Heritage & Temple Precinct' },
      { code: 'R1/R2', localName: 'Residential Plotted & Group Housing' },
      { code: 'RG', localName: 'Saryu Riverfront Green Conservation' },
      { code: 'MU', localName: 'Mixed-Use Pilgrim Bazaar' },
    ],
    uniqueRegulatoryNote: 'Special Temple City buffer byelaws apply. Zero sewage discharge into Saryu river mandated under National Green Tribunal (NGT) directives.',
  },
  {
    id: 'lucknow',
    code: 2,
    name: 'Lucknow Development Authority (LDA)',
    shortName: 'Lucknow',
    region: 'State Capital Region (SCR) / Awadh',
    masterPlanHorizon: 'Master Plan 2031 (Approved & Active)',
    gisPortalUrl: 'https://gis.ldalucknow.co.in',
    riverBufferNorms: 'Gomti Riverfront 100m regulated green belt. Zero direct stormwater outfall without automated bio-filtration chambers.',
    riverBufferSeverity: 'moderate',
    environmentalControl: 'SCR regional development authority norms; mandatory air-quality bio-screens on construction plots > 1000 sqm.',
    todCorridorRules: 'Shaheed Path & Metro North-South / East-West Corridors: Enhanced purchasable FAR up to 4.0 within 500m walking catchment with mix of commercial & residential.',
    maxBaseFarResidential: '1.50 - 2.25 (Base Plotted & Group Housing)',
    maxPurchasableFar: 'Up to 1.00 on 24m roads, up to 1.50 in TOD zones',
    specialIndustrialMSME: 'IT City Sultanpur Road SEZ, Bio-tech Park, Defence Industrial Corridor anchor node at Mohanlalganj, MSME Chikan craft clusters.',
    aviationHeightFunnel: 'Chaudhary Charan Singh International Airport (Amausi) civil aviation funnel height restriction zones.',
    ruralAbadiRegularization: 'High-density SCR expansion regularizing peripheral gram panchayat abadis under Zone RA with 12m access road widening.',
    appendix15Zones: [
      { code: 'TOD', localName: 'Transit Oriented Development Corridor' },
      { code: 'CBD', localName: 'Hazratganj & Vibhuti Khand Commercial' },
      { code: 'GH', localName: 'Gomti Nagar Extension High-Rise Sector' },
      { code: 'DIC', localName: 'Defence Industrial Corridor Hub' },
    ],
    uniqueRegulatoryNote: 'State Capital Region (SCR) headquarters authority. Highest TOD density allowances in Central UP.',
  },
  {
    id: 'varanasi',
    code: 3,
    name: 'Varanasi Development Authority (VDA)',
    shortName: 'Varanasi',
    region: 'Varanasi Division (Ganga Heritage Zone)',
    masterPlanHorizon: 'Master Plan 2031 (Notified)',
    gisPortalUrl: 'https://vdavaranasi.com',
    riverBufferNorms: 'Chapter 2.11 Statutory Mandate: Within 200m of River Ganga, NO new commercial or multi-unit construction permitted! Only religious temples, ashrams (35% Ground Coverage, 1.5 FAR) with zero direct sewage discharge.',
    riverBufferSeverity: 'strict',
    environmentalControl: 'Supreme Court & NGT Ganga Cleanliness Action Area. Kashi Vishwanath cultural heritage envelope with strict architectural height controls.',
    todCorridorRules: 'Varanasi Ring Road Phase-2 and Ropeway transit station corridors allow mixed-use FAR up to 2.50.',
    maxBaseFarResidential: '1.25 - 1.75 (Lower density to preserve heritage streetscapes)',
    maxPurchasableFar: 'Up to 0.50 on 12m-18m roads, purchasable FAR prohibited within 500m of Ganga ghats',
    specialIndustrialMSME: 'Banarasi Silk MSME Weaver Clusters, GI-tagged Handicrafts, Ramnagar Industrial Estate, Agro-logistics Hub.',
    aviationHeightFunnel: 'Lal Bahadur Shastri International Airport (Babatpur) aviation funnel height limits.',
    ruralAbadiRegularization: 'Special regularizations for handloom weaver households permitting up to 5 HP textile motors in residential abadi.',
    appendix15Zones: [
      { code: 'GZ', localName: 'Ganga 200m Prohibited Buffer Zone' },
      { code: 'KZ', localName: 'Kashi Vishwanath Cultural Heritage Precinct' },
      { code: 'BL', localName: 'Bazaar Street & Silk Weaver Enclave' },
      { code: 'LOG', localName: 'Multi-Modal Logistics Freight Hub' },
    ],
    uniqueRegulatoryNote: 'Most stringent riverbank regulations in Uttar Pradesh under Chapter 2.11 of Byelaws 2025. Absolute ban on commercialization within 200m.',
  },
  {
    id: 'kanpur',
    code: 4,
    name: 'Kanpur Development Authority (KDA)',
    shortName: 'Kanpur',
    region: 'Kanpur Mega Industrial Region',
    masterPlanHorizon: 'Master Plan 2031 (Approved)',
    gisPortalUrl: 'https://kda.co.in',
    riverBufferNorms: 'Ganga Barrage 150m eco-tourism buffer; strict industrial effluent zero-liquid-discharge (ZLD) boundary along Jajmau.',
    riverBufferSeverity: 'strict',
    environmentalControl: 'CPCB critically polluted industrial cluster norms; mandatory CETP connection for all leather and chemical processing units.',
    todCorridorRules: 'Kanpur Metro Orange & Blue Line corridors allow 1.5x FAR enhancement on roads ≥ 18m.',
    maxBaseFarResidential: '1.50 - 2.00',
    maxPurchasableFar: 'Up to 0.75 on 18m roads, 1.00 on 24m roads',
    specialIndustrialMSME: 'Jajmau Leather Park, Panki Heavy Industrial Area, Defence Corridor node, Textile & Hosiery hubs.',
    aviationHeightFunnel: 'Chakeri Air Force Station & Civil Airport defense flight envelope restrictions.',
    ruralAbadiRegularization: 'Suburban industrial abadi worker housing regularizations permitting up to 20% worker dormitories on industrial plots.',
    appendix15Zones: [
      { code: 'HI', localName: 'Heavy Industrial / Leather Zone' },
      { code: 'LI', localName: 'Light & Service Industry' },
      { code: 'TOD', localName: 'Metro Transit Zone' },
      { code: 'EB', localName: 'Ganga Barrage Eco-tourism Corridor' },
    ],
    uniqueRegulatoryNote: 'High concentration of heavy industrial and CETP zoning with worker housing integrated allowances.',
  },
  {
    id: 'agra',
    code: 5,
    name: 'Agra Development Authority (ADA)',
    shortName: 'Agra',
    region: 'Taj Trapezium Zone (TTZ) Environmental Control',
    masterPlanHorizon: 'Master Plan 2031 (TTZ Compliant)',
    gisPortalUrl: 'https://adaagra.in',
    riverBufferNorms: 'Yamuna River 150m green buffer; Taj Mahal riverbank heritage no-construction zone.',
    riverBufferSeverity: 'strict',
    environmentalControl: 'Supreme Court Taj Trapezium Zone (TTZ) Directives: Absolute ban on coal/coke-fired industries. Only natural gas (PNG/CNG) or electric permitted. Strict tree-planting ratios (10 trees per 100 sqm).',
    todCorridorRules: 'Agra Metro Priority Corridor (Fatehabad Road to Taj East Gate): Tourism mixed-use allowed with low visual profile (max 15m height).',
    maxBaseFarResidential: '1.25 - 1.50 (Strict density caps to protect ambient air quality)',
    maxPurchasableFar: 'Capped at 0.50 maximum (no heavy density scaling)',
    specialIndustrialMSME: 'Footwear & Leather MSME, Marble Inlay handicrafts, Zari-Zardozi. Non-polluting industries only.',
    aviationHeightFunnel: 'Kheria Air Force Base & Civil Airport strict military funnel height limits.',
    ruralAbadiRegularization: 'Limited regularizations subject to TTZ environmental clearances.',
    appendix15Zones: [
      { code: 'TTZ-1', localName: 'Taj Trapezium Immediate Prohibited Buffer' },
      { code: 'ASI-100', localName: 'Monuments 100m Prohibited Envelope' },
      { code: 'ASI-200', localName: 'Monuments 200m Regulated Construction Zone' },
      { code: 'TB', localName: 'Tourism Bazaar & Heritage Hotels' },
    ],
    uniqueRegulatoryNote: 'Governed directly by Supreme Court of India Taj Trapezium Zone environmental orders. Zero coal usage, strict height caps.',
  },
  {
    id: 'noida_yeida',
    code: 9,
    name: 'YEIDA & Noida/Greater Noida Authorities',
    shortName: 'YEIDA / Noida',
    region: 'National Capital Region (NCR) / Jewar Airport',
    masterPlanHorizon: 'Master Plan 2041 (Phase 1 & 2)',
    gisPortalUrl: 'https://yamunaexpresswayauthority.com',
    riverBufferNorms: 'Yamuna & Hindon River flood plain buffers strictly mapped under Disaster Management Act.',
    riverBufferSeverity: 'standard',
    environmentalControl: 'Green building certified mandatory for plots > 5000 sqm (minimum GRIHA 3-star or IGBC Gold). Zero groundwater extraction during construction.',
    todCorridorRules: 'Noida-Greater Noida Metro Corridor & Jewar Airport Express Link: Purchasable FAR up to 4.0 on 30m-45m arterial roads.',
    maxBaseFarResidential: '2.50 - 3.50 (Highest in Uttar Pradesh)',
    maxPurchasableFar: 'Up to 1.50 - 2.00 purchasable FAR on expressway sector grids',
    specialIndustrialMSME: 'Noida Film City Mega Sector, Semiconductor Fabrication Park, Data Center Cluster, Electronics Manufacturing Hub.',
    aviationHeightFunnel: 'Noida International Airport (Jewar) Obstacle Limitation Surfaces (OLS) with calibrated sector-wise height ceilings from 30m to 120m.',
    ruralAbadiRegularization: 'Sectoral grid layout integration with 5% abadi developed plot allocations to original farmers.',
    appendix15Zones: [
      { code: 'IND-DATA', localName: 'Data Center & Semiconductor Park' },
      { code: 'AERO', localName: 'Jewar Airport Aviation Concession Zone' },
      { code: 'EXPR-GH', localName: 'Expressway High-Density Group Housing' },
      { code: 'FILM', localName: 'Film City Mega Sector' },
    ],
    uniqueRegulatoryNote: 'Highest permissible FAR and tallest high-rise building allowances in Uttar Pradesh, governed by world-class sector grid standards.',
  },
  {
    id: 'meerut',
    code: 7,
    name: 'Meerut Development Authority (MDA)',
    shortName: 'Meerut',
    region: 'National Capital Region (NCR) / Western UP',
    masterPlanHorizon: 'Master Plan 2031 (NCR Regional Plan 2041)',
    gisPortalUrl: 'https://mdameerut.in',
    riverBufferNorms: 'Kali River eco-stream 100m green buffer.',
    riverBufferSeverity: 'standard',
    environmentalControl: 'NCR Regional Plan environmental guidelines with mandatory 15% green belt preservation along expressways.',
    todCorridorRules: 'Delhi-Meerut RRTS (Namo Bharat) Corridor: Dedicated 1.5 km TOD influence zone around 4 major RRTS stations permitting FAR up to 3.50.',
    maxBaseFarResidential: '1.75 - 2.25',
    maxPurchasableFar: 'Up to 1.00 on 24m roads, up to 1.50 in RRTS TOD influence zones',
    specialIndustrialMSME: 'Sports Goods Manufacturing Hub, Scissors Cluster, Partapur Industrial Area, Agritech logistics.',
    aviationHeightFunnel: 'Partapur Airstrip approach funnel height restrictions.',
    ruralAbadiRegularization: 'Peripheral NCR rural village abadi regularization with 9m internal village street requirements.',
    appendix15Zones: [
      { code: 'RRTS-TOD', localName: 'Rapid Rail Transit Oriented Development Corridor' },
      { code: 'SPORTS', localName: 'Sports Goods MSME Cluster' },
      { code: 'EXPR-LOG', localName: 'Delhi-Meerut Expressway Logistics Hub' },
      { code: 'R-DENSE', localName: 'High-Density Residential Sector' },
    ],
    uniqueRegulatoryNote: 'First Indian urban region with active operational Rapid Rail (RRTS) TOD zoning policy permitting up to 3.50 FAR along transit nodes.',
  },
  {
    id: 'prayagraj',
    code: 6,
    name: 'Prayagraj Development Authority (PDA)',
    shortName: 'Prayagraj',
    region: 'Sangam Triveni Region',
    masterPlanHorizon: 'Master Plan 2031',
    gisPortalUrl: 'https://pdaprayagraj.in',
    riverBufferNorms: 'Ganga & Yamuna confluence high-flood line regulations (500m special flood plain envelope with temporary seasonal structures only during Kumbh Mela).',
    riverBufferSeverity: 'strict',
    environmentalControl: 'Sangam conservation zone; strict prohibitions on permanent masonry construction in riverbed floodway.',
    todCorridorRules: 'Civil Lines to Naini transit corridor: 1.25x FAR multiplier on 18m roads.',
    maxBaseFarResidential: '1.50 - 1.75',
    maxPurchasableFar: 'Up to 0.75 on 18m roads',
    specialIndustrialMSME: 'Naini Industrial Area rejuvenation, Defence Corridor ancillary hub, agro-food processing.',
    aviationHeightFunnel: 'Bamrauli Air Force Station / Civil Airport defense funnel restriction zones.',
    ruralAbadiRegularization: 'Riverbank peri-urban settlement regularizations with flood-resilient plinth heights (min 1.2m above high flood level).',
    appendix15Zones: [
      { code: 'KUMBH', localName: 'Maha Kumbh High-Capacity Fair Grounds' },
      { code: 'RIV-FP', localName: 'Ganga-Yamuna Active Flood Plain' },
      { code: 'HERIT', localName: 'Civil Lines Colonial Heritage Envelope' },
      { code: 'NAINI', localName: 'Naini Rejuvenation Industrial Zone' },
    ],
    uniqueRegulatoryNote: 'Contains the worlds largest seasonal gathering zone (Kumbh Mela grounds) with dual-use statutory land classifications.',
  },
  {
    id: 'mathura_vrindavan',
    code: 11,
    name: 'Mathura-Vrindavan Development Authority (MVDA)',
    shortName: 'Mathura-Vrindavan',
    region: 'Braj Teerth Heritage / TTZ',
    masterPlanHorizon: 'Master Plan 2031 (Heritage Master Plan)',
    gisPortalUrl: 'https://mvdamathura.in',
    riverBufferNorms: 'Yamuna River Heritage Ghats 200m buffer. Zero sewage discharge into Yamuna river.',
    riverBufferSeverity: 'strict',
    environmentalControl: 'Part of Taj Trapezium Zone (TTZ); strict height restriction of maximum 15m in Vrindavan pilgrim core to preserve temple shikharas.',
    todCorridorRules: 'Braj Parikrama transit corridor: Tourist parking hubs with electric shuttle transfer facilities.',
    maxBaseFarResidential: '1.25 - 1.50',
    maxPurchasableFar: 'Capped at 0.50 max (strict density control)',
    specialIndustrialMSME: 'Silver ornaments MSME, Braj handicrafts, Peda confectionery clusters. Non-polluting only.',
    aviationHeightFunnel: 'Air Force funnel clearance for proximity to Agra/Gwalior military corridors.',
    ruralAbadiRegularization: 'Govardhan & Barsana rural pilgrim path preservation regularizations.',
    appendix15Zones: [
      { code: 'PILGRIM', localName: 'Vrindavan Sacred Core (15m Height Cap)' },
      { code: 'PARIK', localName: 'Govardhan Parikrama Eco-Buffer' },
      { code: 'DHARAM', localName: 'Pilgrim Dharmashala & Ashram Enclave' },
      { code: 'TTZ-GREEN', localName: 'TTZ Afforestation Green Corridor' },
    ],
    uniqueRegulatoryNote: 'Strict 15m building height ceiling across core temple towns to protect historical skyline and temple spires.',
  },
  {
    id: 'gorakhpur',
    code: 12,
    name: 'Gorakhpur Development Authority (GDA)',
    shortName: 'Gorakhpur',
    region: 'Purvanchal Gateway Region',
    masterPlanHorizon: 'Master Plan 2031',
    gisPortalUrl: 'https://gdagorakhpur.com',
    riverBufferNorms: 'Ramgarh Tal Lake 500m eco-sensitive conservation buffer with zero direct wastewater discharge.',
    riverBufferSeverity: 'strict',
    environmentalControl: 'Wetland conservation rules under Central Wetland Authority; green tourism focus around Ramgarh Tal.',
    todCorridorRules: 'Gorakhpur Link Expressway & AIIMS corridor: 1.5x FAR multiplier on 24m roads.',
    maxBaseFarResidential: '1.50 - 2.00',
    maxPurchasableFar: 'Up to 0.75 on 18m roads, 1.00 on 24m roads',
    specialIndustrialMSME: 'GIDA Industrial Area, Terracotta GI Craft Cluster, Medical device manufacturing adjacent to AIIMS.',
    aviationHeightFunnel: 'Gorakhpur Air Force Station / Mahayogi Gorakhnath Airport funnel height limits.',
    ruralAbadiRegularization: 'Peri-urban abadi expansion integrated with GIDA industrial township.',
    appendix15Zones: [
      { code: 'TAL-ECO', localName: 'Ramgarh Tal Eco-Sensitive Zone' },
      { code: 'AIIMS-MED', localName: 'AIIMS Medical Health Enclave' },
      { code: 'GIDA', localName: 'Gorakhpur Industrial Development Area' },
      { code: 'LINK-EXPR', localName: 'Gorakhpur Link Expressway Logistics' },
    ],
    uniqueRegulatoryNote: 'Special Ramgarh Tal ecological buffer regulations combined with rapid Purvanchal expressway logistics expansion.',
  }
];

export interface DimensionResult {
  text: string;
  severity?: string;
}

export interface ComparisonDimension {
  id: string;
  title: string;
  category: string;
  icon: string;
  getA: (a: AuthorityDetailedProfile) => DimensionResult;
  getB: (b: AuthorityDetailedProfile) => DimensionResult;
  getDivergence: (a: AuthorityDetailedProfile, b: AuthorityDetailedProfile) => string;
}

export const AuthorityZoningComparison: React.FC = () => {
  const [authAId, setAuthAId] = useState<string>('ayodhya');
  const [authBId, setAuthBId] = useState<string>('varanasi');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const authA = useMemo(() => DETAILED_AUTHORITIES.find((a) => a.id === authAId) || DETAILED_AUTHORITIES[0], [authAId]);
  const authB = useMemo(() => DETAILED_AUTHORITIES.find((a) => a.id === authBId) || DETAILED_AUTHORITIES[1], [authBId]);

  const swapAuthorities = () => {
    const temp = authAId;
    setAuthAId(authBId);
    setAuthBId(temp);
  };

  const loadPresetComparison = (a: string, b: string) => {
    setAuthAId(a);
    setAuthBId(b);
  };

  const comparisonDimensions: ComparisonDimension[] = [
    {
      id: 'river_buffer',
      title: 'River & Waterbody Buffers',
      category: 'river',
      icon: '🌊',
      getA: (a: AuthorityDetailedProfile) => ({ text: a.riverBufferNorms, severity: a.riverBufferSeverity }),
      getB: (b: AuthorityDetailedProfile) => ({ text: b.riverBufferNorms, severity: b.riverBufferSeverity }),
      getDivergence: (a: AuthorityDetailedProfile, b: AuthorityDetailedProfile) => {
        if (a.id === 'varanasi') return 'Varanasi strictly enforces Chapter 2.11 (absolute 200m commercial ban on Ganga)';
        if (b.id === 'varanasi') return 'Varanasi has statutory Chapter 2.11 Ganga 200m prohibited zone';
        if (a.riverBufferSeverity === 'strict' && b.riverBufferSeverity !== 'strict') return `${a.shortName} has stricter ecological buffers`;
        if (b.riverBufferSeverity === 'strict' && a.riverBufferSeverity !== 'strict') return `${b.shortName} has stricter ecological buffers`;
        return 'Both follow standard UP Byelaws Chapter 2 & 12 river protections';
      },
    },
    {
      id: 'env_control',
      title: 'Environmental & Heritage Regimes',
      category: 'env',
      icon: '🌿',
      getA: (a: AuthorityDetailedProfile) => ({ text: a.environmentalControl }),
      getB: (b: AuthorityDetailedProfile) => ({ text: b.environmentalControl }),
      getDivergence: (a: AuthorityDetailedProfile, b: AuthorityDetailedProfile) => {
        if (a.id === 'agra' || a.id === 'mathura_vrindavan') return 'Supreme Court Taj Trapezium Zone (TTZ) orders mandate gas fuels and strict height limits';
        if (b.id === 'agra' || b.id === 'mathura_vrindavan') return 'Supreme Court Taj Trapezium Zone (TTZ) orders apply to ' + b.shortName;
        return 'Local master plan environmental rules tailored to regional geography';
      },
    },
    {
      id: 'tod_corridor',
      title: 'Transit-Oriented Development (TOD) Rules',
      category: 'tod',
      icon: '🚆',
      getA: (a: AuthorityDetailedProfile) => ({ text: a.todCorridorRules }),
      getB: (b: AuthorityDetailedProfile) => ({ text: b.todCorridorRules }),
      getDivergence: (a: AuthorityDetailedProfile, b: AuthorityDetailedProfile) => {
        if (a.id === 'noida_yeida' || a.id === 'meerut') return `${a.shortName} allows high-density TOD FAR up to 3.5 - 4.0 along rapid transit corridors`;
        if (b.id === 'noida_yeida' || b.id === 'meerut') return `${b.shortName} allows high-density TOD FAR up to 3.5 - 4.0`;
        return 'Standard 1.25x - 1.5x TOD multiplier under Chapter 3.2.4 & 9';
      },
    },
    {
      id: 'far_permissibility',
      title: 'FAR Permissibility & Purchasable Caps',
      category: 'far',
      icon: '📐',
      getA: (a: AuthorityDetailedProfile) => ({ text: `Base FAR: ${a.maxBaseFarResidential} | Purchasable: ${a.maxPurchasableFar}` }),
      getB: (b: AuthorityDetailedProfile) => ({ text: `Base FAR: ${b.maxBaseFarResidential} | Purchasable: ${b.maxPurchasableFar}` }),
      getDivergence: (a: AuthorityDetailedProfile, b: AuthorityDetailedProfile) => {
        if (a.id === 'noida_yeida') return 'YEIDA / Noida allows highest FAR in UP (up to 3.5 Base + 2.0 Purchasable)';
        if (b.id === 'noida_yeida') return 'YEIDA / Noida allows highest FAR in UP (up to 3.5 Base + 2.0 Purchasable)';
        if (a.id === 'agra' || a.id === 'mathura_vrindavan') return `${a.shortName} caps purchasable FAR at 0.50 to limit density`;
        return 'Follows standard Chapter 3 telescopic plotted formula and Chapter 9 road width tiers';
      },
    },
    {
      id: 'msme_industrial',
      title: 'Special Industrial & MSME Guidelines',
      category: 'industry',
      icon: '🏭',
      getA: (a: AuthorityDetailedProfile) => ({ text: a.specialIndustrialMSME }),
      getB: (b: AuthorityDetailedProfile) => ({ text: b.specialIndustrialMSME }),
      getDivergence: (a: AuthorityDetailedProfile, b: AuthorityDetailedProfile) => {
        return `Cluster focus: ${a.shortName} focuses on local MSME clusters vs ${b.shortName} industrial zones`;
      },
    },
    {
      id: 'aviation_funnel',
      title: 'Aviation Funnel & Height Restrictions',
      category: 'aviation',
      icon: '✈️',
      getA: (a: AuthorityDetailedProfile) => ({ text: a.aviationHeightFunnel }),
      getB: (b: AuthorityDetailedProfile) => ({ text: b.aviationHeightFunnel }),
      getDivergence: (a: AuthorityDetailedProfile, b: AuthorityDetailedProfile) => {
        return 'Governed by Airport Authority of India (AAI) Color-Coded Zoning Map (CCZM) and defense IAF safe envelopes';
      },
    },
    {
      id: 'rural_abadi',
      title: 'Rural Abadi (Zone RA) Regularization',
      category: 'abadi',
      icon: '🏡',
      getA: (a: AuthorityDetailedProfile) => ({ text: a.ruralAbadiRegularization }),
      getB: (b: AuthorityDetailedProfile) => ({ text: b.ruralAbadiRegularization }),
      getDivergence: (a: AuthorityDetailedProfile, b: AuthorityDetailedProfile) => {
        return 'Governed by Section 15 of UP Urban Planning Act 1973 for village abadi consolidation';
      },
    },
  ];

  const filteredDimensions = comparisonDimensions.filter((dim) => {
    if (categoryFilter !== 'all' && dim.category !== categoryFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const textA = JSON.stringify(dim.getA(authA)).toLowerCase();
      const textB = JSON.stringify(dim.getB(authB)).toLowerCase();
      return dim.title.toLowerCase().includes(q) || textA.includes(q) || textB.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Development Authority Zoning Comparison Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Side-by-side comparative analysis of zoning rules, riverfront prohibitions, environmental controls, and FAR caps across all 22 Development Authorities of Uttar Pradesh.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Appendix-15 Concordance</span>
          </span>
        </div>
      </div>

      {/* Preset Comparisons */}
      <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Comparative Presets:</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => loadPresetComparison('ayodhya', 'varanasi')}
            className={`px-2.5 py-1 rounded font-medium border transition-colors ${
              authAId === 'ayodhya' && authBId === 'varanasi'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            Ayodhya (ADA) vs Varanasi (VDA)
          </button>
          <button
            onClick={() => loadPresetComparison('noida_yeida', 'meerut')}
            className={`px-2.5 py-1 rounded font-medium border transition-colors ${
              authAId === 'noida_yeida' && authBId === 'meerut'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            Noida / YEIDA vs Meerut (MDA)
          </button>
          <button
            onClick={() => loadPresetComparison('agra', 'kanpur')}
            className={`px-2.5 py-1 rounded font-medium border transition-colors ${
              authAId === 'agra' && authBId === 'kanpur'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            Agra (TTZ) vs Kanpur (KDA)
          </button>
          <button
            onClick={() => loadPresetComparison('lucknow', 'gorakhpur')}
            className={`px-2.5 py-1 rounded font-medium border transition-colors ${
              authAId === 'lucknow' && authBId === 'gorakhpur'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            Lucknow (LDA) vs Gorakhpur (GDA)
          </button>
          <button
            onClick={() => loadPresetComparison('mathura_vrindavan', 'prayagraj')}
            className={`px-2.5 py-1 rounded font-medium border transition-colors ${
              authAId === 'mathura_vrindavan' && authBId === 'prayagraj'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            Mathura (MVDA) vs Prayagraj (PDA)
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Authority A Dropdown */}
        <div className="md:col-span-5 space-y-1">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Select Authority A
          </label>
          <select
            value={authAId}
            onChange={(e) => setAuthAId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            {DETAILED_AUTHORITIES.map((auth) => (
              <option key={auth.id} value={auth.id}>
                #{auth.code} {auth.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-2 flex justify-center py-1">
          <button
            onClick={swapAuthorities}
            title="Swap Authorities"
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Authority B Dropdown */}
        <div className="md:col-span-5 space-y-1">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Select Authority B
          </label>
          <select
            value={authBId}
            onChange={(e) => setAuthBId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            {DETAILED_AUTHORITIES.map((auth) => (
              <option key={auth.id} value={auth.id}>
                #{auth.code} {auth.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Authority Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
              Authority A (Code: #{authA.code})
            </span>
            <a
              href={authA.gisPortalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>Launch Geoportal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {authA.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {authA.region} • <strong className="text-emerald-700 dark:text-emerald-400">{authA.masterPlanHorizon}</strong>
          </p>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
            <strong>Statutory Focus: </strong>{authA.uniqueRegulatoryNote}
          </div>
        </div>

        {/* Card B */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-blue-500/30 dark:border-blue-500/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
              Authority B (Code: #{authB.code})
            </span>
            <a
              href={authB.gisPortalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>Launch Geoportal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {authB.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {authB.region} • <strong className="text-blue-700 dark:text-blue-400">{authB.masterPlanHorizon}</strong>
          </p>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
            <strong>Statutory Focus: </strong>{authB.uniqueRegulatoryNote}
          </div>
        </div>
      </div>

      {/* Category Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-1 overflow-x-auto text-xs pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Dimensions' },
            { id: 'river', label: 'River & Buffers' },
            { id: 'env', label: 'Environmental' },
            { id: 'tod', label: 'TOD Corridors' },
            { id: 'far', label: 'FAR & Density' },
            { id: 'industry', label: 'MSME & Industry' },
            { id: 'aviation', label: 'Aviation Funnel' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search comparison points..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredDimensions.map((dim) => {
          const valA = dim.getA(authA);
          const valB = dim.getB(authB);
          const divergence = dim.getDivergence(authA, authB);

          return (
            <div key={dim.id} className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex items-center space-x-2">
                  <span className="text-base">{dim.icon}</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {dim.title}
                  </h4>
                </div>

                <div className="inline-flex items-center text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  <Info className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                  <span>Divergence: {divergence}</span>
                </div>
              </div>

              {/* Side by side comparison boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Authority A Rule */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{authA.shortName} Norms</span>
                    </span>
                    {valA.severity && (
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          valA.severity === 'strict'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {valA.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {valA.text}
                  </p>
                </div>

                {/* Authority B Rule */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>{authB.shortName} Norms</span>
                    </span>
                    {valB.severity && (
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          valB.severity === 'strict'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {valB.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {valB.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Appendix 15 Zoning Concordance Matrix */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Appendix-15 Local Master Plan Land-Use Concordance
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Auth A Zones */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{authA.name} Special Use Zones</span>
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {authA.appendix15Zones.map((zone, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{zone.code}</span>
                  <span className="text-slate-700 dark:text-slate-300">{zone.localName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Auth B Zones */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{authB.name} Special Use Zones</span>
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {authB.appendix15Zones.map((zone, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{zone.code}</span>
                  <span className="text-slate-700 dark:text-slate-300">{zone.localName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
