import {
  ByelawChapter,
  DefinitionItem,
  DeemedNocDept,
  PlottedSetbackRule,
  HighRiseSetbackRule,
  FarExemptionItem,
  DevelopmentAuthorityUseZone,
  CompoundingRate,
  NonResidentialSetbackRule,
  BazaarStreetSetbackRule,
  TelescopicSlab,
  TelescopicFarResult,
  GroupHousingRoadFarRule,
  CommercialRoadFarRule,
  StandardZoneCode,
  PermissibilityStatus,
  ActivityPermissibilityRule,
} from '../types';

export const DOCUMENT_METADATA = {
  title: "Uttar Pradesh Building Construction and Development Byelaws 2025",
  subtitle: "Byelaws for Urban Development Authorities",
  department: "Housing & Urban Planning Department, Government of Uttar Pradesh",
  date: "4/9/25",
  version: "TMPR8",
  totalPages: 224,
  governingAct: "Uttar Pradesh Urban Planning and Development Act, 1973 (Section 15, 15A, 53)",
};

export const BYELAW_CHAPTERS: ByelawChapter[] = [
  {
    id: 1,
    chapterNumber: "Chapter 1",
    title: "Short Title and Definitions",
    pageRange: "pp. 7-18",
    summary: "Scope, jurisdiction across UP Development Authorities & Awas Vikas Parishad, statutory definitions of 102 terms, difficulty removal committee, and effect on prior Government Orders.",
    sections: [
      {
        id: "1.1",
        clauseNumber: "1.1",
        title: "Short Title and Extent",
        content: "(i) These bye-laws will be called [Name of Authority] Development Authority Building Construction and Development Byelaws 2025. (ii) Applicable to the entire designated development area under UP Urban Planning and Development Act, 1973 or UP Awas Evam Vikas Parishad Act, 1965.",
      },
      {
        id: "1.2",
        clauseNumber: "1.2",
        title: "Definitions",
        content: "Contains 102 statutory definitions governing building construction, planning, land development, and administrative approvals.",
      },
      {
        id: "1.3",
        clauseNumber: "1.3",
        title: "Applicability of Byelaws",
        content: "Applicable to all building activities, reads in conjunction with Master Plan/Zonal Development Plan. For provisions not contained herein, National Building Code (NBC 2016) and IS/BIS Codes apply.",
      },
      {
        id: "1.4",
        clauseNumber: "1.4",
        title: "Difficulty Removal",
        content: "High-level committee chaired by Principal Secretary, Housing & Urban Planning Dept, including Housing Commissioner, Director Awas Bandhu, two nominated VCs, and Chief Town & Country Planner (Member Convenor). In case of discrepancy between Hindi and English versions, English shall prevail.",
      },
      {
        id: "1.6",
        clauseNumber: "1.6",
        title: "Sectoral Policies",
        content: "Special sectoral policies take precedence where higher FAR, heights, or mixed use are prescribed (e.g., UP Warehousing & Logistics Policy 2022, IT & ITeS Policy 2022, Data Centre Policy 2021, Tourism Policy 2022, MSME Policy 2022, Solar Policy 2022).",
      }
    ]
  },
  {
    id: 2,
    chapterNumber: "Chapter 2",
    title: "Permission for Land Development and Building Construction",
    pageRange: "pp. 19-36",
    summary: "Development permits, building permits, self-certification regime, deemed approvals, time-bound NOCs from 15 departments, validity periods, and plinth-level verification.",
    sections: [
      {
        id: "2.1.2",
        clauseNumber: "2.1.2",
        title: "Building Permission & Self-Certification Thresholds",
        content: "Key regulatory categorization for building sanctions:\n- Plots up to 100 sqm (Residential) and up to 30 sqm (Commercial): EXEMPT from building permission and completion certificate! Requires online registration with token fee of Re. 1/- with self-certification & affidavit. Cannot split larger plots.\n- Plots in approved/developed layouts: Up to 500 sqm (Residential, except multi-unit) and up to 200 sqm (Commercial): Instant online approval upon submitting plans certified by a Licensed Technical Person (LTP) and fee payment.\n- Other categories: Online unified application form.\n- Deemed Sanction: If authority fails to decide within 15 days of notice for plots in approved layouts, deemed approved after written notice.",
      },
      {
        id: "2.2.3",
        clauseNumber: "2.2.3",
        title: "Inter-Departmental No Objection Certificates (NOCs) & Deemed NOC System",
        content: "NOCs must be issued within prescribed timelines. If a department does not respond or request details within 10 days, deemed NOC is triggered automatically on the 30th day (or earlier schedule). System auto-notifies HOD via SMS and portal.",
      },
      {
        id: "2.7.4",
        clauseNumber: "2.7.4",
        title: "Validity and Revalidation of Permits",
        content: "- Development Permit: Valid for 5 years. Extension up to 3 years on renewal fee payment.\n- Building Permit: Valid for 5 years. Revalidation allowed for up to 3 years.",
      },
      {
        id: "2.8.1",
        clauseNumber: "2.8.1",
        title: "Plinth Level Verification & Geo-tagging",
        content: "Upon completing construction up to plinth level, owner/builder must upload GPS coordinates, timestamped digital photos, and Appendix-12 affidavit. Engineer-in-charge inspects within 48 office hours.",
      },
      {
        id: "2.11",
        clauseNumber: "2.11",
        title: "Permission Along Riverbanks (River Ganga)",
        content: "Within 200m of the banks of River Ganga in pilgrim cities, only repair/renovation permitted. New construction of ashram, monastery, and temple allowed subject to 35% Ground Coverage, 1.5 FAR, zero direct sewage discharge, and Jal Nigam acceptance.",
      }
    ]
  },
  {
    id: 3,
    chapterNumber: "Chapter 3",
    title: "Standards for Land Development and Building Construction",
    pageRange: "pp. 37-75",
    summary: "Road widths, parks & open spaces, telescopic FAR, comprehensive setbacks, heights, room dimensions, basements, and parking standards.",
    sections: [
      {
        id: "3.1.1",
        clauseNumber: "3.1.1.3",
        title: "Means of Access / Minimum Road Widths for Layouts",
        content: "Residential layout: Built-up min 6m; Non-built-up: 9m (<=10 acres), 12m (>10 to 25 acres), 18m (>25 acres). Non-residential layout: Built-up 12m; Non-built-up: 12m (<=10 acres), 18m (10-25 acres), 24m (>25 acres).",
      },
      {
        id: "3.1.2",
        clauseNumber: "3.1.2.2",
        title: "Parks and Open Spaces in Layouts (>3000 sqm)",
        content: "Mandatory open space calculated on telescopic basis: 10% (residential with ZDP), 15% (residential without ZDP), 5% (non-residential with ZDP), 10% (non-residential without ZDP). 30% must be preserved as dense Miyawaki plantation for ground water recharge; up to 70% can be used for underground parking.",
      },
      {
        id: "3.2.2",
        clauseNumber: "3.2.2",
        title: "Ground Coverage & FAR (Telescopic Calculation)",
        content: "Floor Area Ratio is calculated telescopically across area slabs. For residential plotted: Up to 150 sqm: Base FAR 2.0; 150-300 sqm: 1.8; 300-500 sqm: 1.75; 500-1200 sqm: 1.5; >1200 sqm: 1.25. Max FAR achievable with purchase is 2.0.",
      },
      {
        id: "3.2.2.8",
        clauseNumber: "3.2.2.8",
        title: "Exemptions from FAR Calculation",
        content: "Exempt: Lift machine room, lift lobby up to 10 sqm, meter room, cantilever projection up to 0.75m in setbacks, parking basements, DG/electric rooms, stilt parking, podium parking, balconies up to 2.0m (res/group housing), fire escape stairs, lofts, mumty, rainwater tanks, service floors (max 3 floors, every 4th floor). Counted in FAR: Mezzanine floor, balconies >2m, commercial basement, office basement, stilt used for non-parking.",
      },
      {
        id: "3.2.4",
        clauseNumber: "3.2.4",
        title: "Building Setbacks & Height Regulations",
        content: "Detailed setback tables for plotted residential, group housing, commercial, institutional, and industrial buildings up to 15m, and progressive setbacks for high-rise buildings exceeding 15m.",
      },
      {
        id: "3.3.1",
        clauseNumber: "3.3.1",
        title: "Building Parts & Room Dimension Standards",
        content: "Habitable room: min 9.5 sqm (single room) or 12.5 sqm (EWS/LIG), min width 2.4m, min height 2.75m. Kitchen with dining: 7.5 sqm (width 2.1m); kitchen without dining: 5.0 sqm (width 1.8m). Bath: min 1.5 sqm (width 1m); WC: 1.1 sqm; Combined bath+WC: 2.8 sqm. Parapet: 1.0 to 1.5m. Ramp: 1:10 (general), 1:12 (public/hospital).",
      },
      {
        id: "3.3.3",
        clauseNumber: "3.3.3",
        title: "Basement Rules",
        content: "Max up to 3 levels. Clear height: 2.4m to 4.5m. Ceiling height: 0.9m to 1.2m above road level (unless mechanically ventilated). Must leave minimum 2.0m from all plot boundaries.",
      },
      {
        id: "3.3.4",
        clauseNumber: "3.3.4",
        title: "Parking & Equivalent Car Space (ECS)",
        content: "1 ECS dimensions: Plotted 13.75 sqm, Open 23 sqm, Covered 28 sqm, Basement 32 sqm, Mechanized double 16 sqm, triple 8 sqm, 2-wheeler 2.0 sqm.",
      }
    ]
  },
  {
    id: 4,
    chapterNumber: "Chapter 4",
    title: "Residential Buildings (Plotted, Group Housing & Affordable)",
    pageRange: "pp. 76-83",
    summary: "Single/multi-unit plotted standards, Group housing layouts, mandatory 10% EWS + 10% LIG quotas, shelter fee formula, and affordable housing incentives.",
    sections: [
      {
        id: "4.1",
        clauseNumber: "4.1",
        title: "Plotted Development (Single & Multi-Units)",
        content: "Single-unit: 3 storeys or less, max 15m. Multi-unit: 4 storeys or less with mandatory stilt, max 17.5m. Min plot size: 40 sqm for single unit in non-built-up; 150 sqm for multi-unit (each independent unit min 60 sqm carpet).",
      },
      {
        id: "4.2",
        clauseNumber: "4.2",
        title: "Group Housing Regulations",
        content: "Min plot size: 1000 sqm (built-up), 1500 sqm (non-built-up). Road width: 9m (built-up), 12m (non-built-up). No building height restriction (subject to airport/monuments). Max 5% of availed FAR allowed for commercial use on ground floor.",
      },
      {
        id: "4.3",
        clauseNumber: "4.3",
        title: "EWS and LIG Housing Provisions",
        content: "Mandatory 10% EWS + 10% LIG reservation for all housing projects with >1 unit. EWS income limit < Rs. 3 Lakhs/yr (plot 35-40 sqm, carpet 30-35 sqm). LIG income limit Rs. 3-6 Lakhs/yr (plot 40-50 sqm, carpet 35-45 sqm). For plots <4 Ha, shelter fee may be deposited in lieu of construction.",
      },
      {
        id: "4.3.11",
        clauseNumber: "4.3.11",
        title: "Shelter Fee Formula",
        content: "Shelter Fee = 10% × [(Total Dwelling Units) × (Min EWS Carpet + Min LIG Carpet) × Circle Rate]",
      },
      {
        id: "4.4",
        clauseNumber: "4.4",
        title: "Affordable Housing Standards",
        content: "Requires at least 50% plots <90 sqm or 50% units <60 sqm. Exempt from separate EWS/LIG mandatory quotas or shelter fees. Base FAR 2.0 to 3.0 depending on road width.",
      }
    ]
  },
  {
    id: 5,
    chapterNumber: "Chapter 5",
    title: "Commercial Buildings",
    pageRange: "pp. 84-93",
    summary: "Bazaar street mixed-use linear corridors, shopping malls, multiplexes, hotels, heritage hotels, petrol pumps, and LPG godowns.",
    sections: [
      {
        id: "5.1",
        clauseNumber: "5.1",
        title: "Bazaar Street",
        content: "Linear mixed-use along notified streets. Road width min 12m. Commercial on Ground and 1st floor; residential on floors above. Ground coverage max after setbacks. Front setbacks: 3m (12m road), 4.5m (18m road), 6m (24-30m road), 7.5m (36-45m road), 9m (76m road).",
      },
      {
        id: "5.2",
        clauseNumber: "5.2",
        title: "Shops, Commercial Complexes & Shopping Malls",
        content: "Min plot size: Retail shops >10-100 sqm (6m/9m road), Convenient shopping 100-300 sqm (12m road), Commercial complex 300-3000 sqm (12m road), Shopping mall >3000 sqm (18m road). Skylighted atriums permitted (free of FAR, max 20% kiosk area).",
      },
      {
        id: "5.3",
        clauseNumber: "5.3",
        title: "Hotels & Heritage Hotels",
        content: "Min 6 rooms. Up to 20 rooms: no min plot area, 9m road. >20 rooms: min 500 sqm plot, 12m road. Heritage hotels (pre-1950): road width relaxed to 5m in spiritual hotspots, 7.5m elsewhere. Bonus FAR of 0.25 to 0.50 for green restoration.",
      },
      {
        id: "5.4",
        clauseNumber: "5.4",
        title: "Cinemas, Miniplexes & Multiplexes",
        content: "Single screen: min 500 sqm, 12m road. Miniplex (2 screens, <=125 seats): min 700 sqm, 12m road. Multiplex: min 3000 sqm, 18m road. In commercial areas, flexible commercial/cinema floor mix.",
      },
      {
        id: "5.5",
        clauseNumber: "5.5",
        title: "Petrol Pumps & EV/CNG Stations",
        content: "2W/3W station: 16m x 14m (224 sqm). All vehicles: 30m x 17m (510 sqm). With service station: 36m x 30m (1080 sqm). Road width: 12m (built-up), 24m (non-built-up). Max height 6m. Buffer strip: 12m long x 3m wide.",
      },
      {
        id: "5.6",
        clauseNumber: "5.6",
        title: "LPG Gas Godowns",
        content: "Min plot size: 26m x 20m (520 sqm). Access road min 18m. Height max 6m. Front setback 6m, other sides 3m. Max FAR 0.30.",
      }
    ]
  },
  {
    id: 6,
    chapterNumber: "Chapter 6",
    title: "Institutional Buildings & Community Facilities",
    pageRange: "pp. 94-100",
    summary: "Healthcare, educational institutions, marriage halls, auditoriums, and convention centres.",
    sections: [
      {
        id: "6.1",
        clauseNumber: "6.1",
        title: "Hospitals & Healthcare Facilities",
        content: "Clinics/OPD: min 100 sqm, 9m road. Small hospitals (<=50 beds): min 300 sqm, 12m road. Hospitals (>50 beds): min 3000 sqm, 18m road. Medical colleges: 24m road. Parking: 1.5 ECS / 125 sqm + dedicated ambulance parking.",
      },
      {
        id: "6.2",
        clauseNumber: "6.2",
        title: "Educational Institutions",
        content: "Nursery: 500 sqm (9m road). Primary: 1000 sqm (9m/12m road). Secondary/Inter: 2000 sqm (12m road). Degree college: 5000 sqm (18m road). University: 20,000 sqm / 2 Ha (24m road). Bus parking: 1 bus bay (50 sqm) per 120 students.",
      },
      {
        id: "6.3",
        clauseNumber: "6.3",
        title: "Marriage Halls & Banquet Facilities",
        content: "Min plot: 750 sqm (built-up), 1000 sqm (non-built-up). Road width: 18m (750-3000 sqm), 24m (>3000 sqm). Parking: 2.0 ECS / 100 sqm.",
      },
      {
        id: "6.4",
        clauseNumber: "6.4",
        title: "Auditoriums & Convention Centres",
        content: "Road width 18m (plot min 1500 sqm), 24m (plot min 2000 sqm). Parking: 1 ECS per 10 seats + 2 ECS / 100 sqm for commercial activities.",
      }
    ]
  },
  {
    id: 7,
    chapterNumber: "Chapter 7",
    title: "Industrial and Agricultural Use Buildings",
    pageRange: "pp. 101-104",
    summary: "Industrial plants, Flatted factories, Data centres, MSME units, Farmhouses, and Dairy farms.",
    sections: [
      {
        id: "7.1",
        clauseNumber: "7.1",
        title: "Industries, Flatted Factories & Data Centres",
        content: "No plot size restriction. Road width: 7m (agriculture zone), 9m (industrial), 12m for flatted factories & data centres. Up to 20% FAR allowed for in-situ worker hostels and dormitories.",
      },
      {
        id: "7.2",
        clauseNumber: "7.2",
        title: "Farmhouses",
        content: "Min plot area: 4000 sqm. Access road min 7.0m. Ground coverage for non-farm activities max 20%. Max FAR: 0.20. Distance of non-farm building from boundary: min 9m on all sides. 50% of plot for tree plantation (min 100 trees/Ha).",
      },
      {
        id: "7.3",
        clauseNumber: "7.3",
        title: "Dairy Farms / Gaushalas",
        content: "Min plot area: 1000 sqm. Access road min 7.0m. Max ground coverage 20%, Max FAR 0.20. Setbacks: 6m (1000-4000 sqm), 9m (4000-7000 sqm), 10m (>7000 sqm).",
      }
    ]
  },
  {
    id: 8,
    chapterNumber: "Chapter 8",
    title: "Mixed-Use and Transit-Oriented Development (TOD)",
    pageRange: "pp. 104-108",
    summary: "Mixed use zones, roadside mixed use on >=24m roads, TOD corridors, FAR multipliers, and mixing restrictions.",
    sections: [
      {
        id: "8.1",
        clauseNumber: "8.1",
        title: "Mixed Use Development",
        content: "Permitted in earmarked mixed use zones, approved layouts, bazaar streets, along >=24m roads, and TOD zones. On 24m roads: principal use >=33%, other uses <=67% (no single secondary use can exceed principal use).",
      },
      {
        id: "8.2",
        clauseNumber: "8.2",
        title: "Transit Oriented Development (TOD) Zones",
        content: "FAR in TOD zone as percentage of Base FAR:\n- 12m ROW: 150% of Base FAR\n- 12-24m ROW: 250% of Base FAR\n- 24-45m ROW: 350% of Base FAR\n- >45m ROW: Unrestricted FAR!\nParking requirement: 1 ECS per 100 sqm of floor area.",
      },
      {
        id: "8.3.1",
        clauseNumber: "8.3.1",
        title: "Prohibited Mixed-Use Activities",
        content: "Strictly banned from mixing: Heavy/polluting industries, sugar mills, slaughter houses, bio-medical waste, prisons, explosive depots, and shooting ranges. Schools and creches must not be mixed with healthcare or hazardous operations.",
      }
    ]
  },
  {
    id: 9,
    chapterNumber: "Chapter 9",
    title: "Additional Floor Area Ratio (Compensatory, Purchasable & Green)",
    pageRange: "pp. 108-112",
    summary: "Compensatory FAR for surrendered land, Purchasable & Premium Purchasable FAR computation formulas, Land Use Factor coefficients, and Green Building FAR incentives.",
    sections: [
      {
        id: "9.1",
        clauseNumber: "9.1",
        title: "Compensatory FAR",
        content: "Granted in lieu of land surrendered free of cost for road widening, public infrastructure, or greenbelts. Non-transferable except where remaining plot cannot accommodate it.",
      },
      {
        id: "9.2.3",
        clauseNumber: "9.2.3",
        title: "Purchasable (PFAR) & Premium Purchasable (PPFAR) Rates",
        content: "Permissible on roads >=12m (or >=9m for group housing in built-up areas):\n- Road <=12m: PFAR up to 20% of B1, PPFAR up to 20% of B1 (Max 140% of Base)\n- Road 12-24m: PFAR up to 50% of B2, PPFAR up to 50% of B2 (Max 200% of Base)\n- Road 24-45m: PFAR up to 100% of B3, PPFAR up to 150% of B3 (Max 350% of Base)\n- Road >45m: PFAR up to 100% of B4, PPFAR Unrestricted (Max Unrestricted, in steps of 0.25)",
      },
      {
        id: "9.2.5",
        clauseNumber: "9.2.5",
        title: "Fee Formula for Purchasable FAR",
        content: "Formula: C = Le × Rc × P\n- C = Total Charge payable\n- Le = Proportional land requirement = FP ÷ Base FAR\n- FP = Additional Floor Area purchased (sqm)\n- Rc = Current circle rate (or Authority residential rate, whichever is higher)\n- P = Land Use Factor Coefficient:\n  * Commercial: 0.50 (PFAR) / 1.00 (PPFAR)\n  * Mixed Use & Office: 0.45 (PFAR) / 0.90 (PPFAR)\n  * Hotels: 0.40 (PFAR) / 0.80 (PPFAR)\n  * Residential Plotted: 0.40 (PFAR only)\n  * Group Housing: 0.40 (PFAR) / 0.80 (PPFAR)\n  * Community Facilities: 0.20 (PFAR) / 0.40 (PPFAR)",
      },
      {
        id: "9.3",
        clauseNumber: "9.3",
        title: "Green Building Additional FAR (Free of Cost)",
        content: "- GRIHA 3-Star / IGBC Silver / LEED Silver: +3% additional FAR on availed FAR\n- GRIHA 4-Star / IGBC Gold / LEED Gold: +5% additional FAR\n- GRIHA 5-Star / IGBC Platinum / LEED Platinum: +7% additional FAR\nPenalty: 2x land circle rate if developer fails to achieve rating.",
      }
    ]
  },
  {
    id: 10,
    chapterNumber: "Chapter 10",
    title: "Fire Prevention and Life Safety",
    pageRange: "pp. 113-116",
    summary: "UP Fire & Emergency Services Act 2022 compliances, mandatory Fire Safety Certificate criteria (>15m height or special >500 sqm), 21 safety elements, and rules for existing vs new buildings.",
    sections: [
      {
        id: "10.1.3",
        clauseNumber: "10.1.3",
        title: "Mandatory Fire Safety Certificate Scope",
        content: "Mandatory for:\n(a) Multi-storied buildings exceeding 15 meters in height.\n(b) Special buildings (educational, institutional, assembly, mercantile, industrial, hazardous as per NBC).\n(c) Mixed occupancies with any of the above having >500 sqm covered area.",
      },
      {
        id: "10.2.1",
        clauseNumber: "10.2.1",
        title: "21 Minimum Fire Prevention and Life Safety Standards",
        content: "1. Access to building; 2. Exits; 3. Smoke management; 4. Extinguishers; 5. Hose reels; 6. Fire detection & alarm; 7. PA system; 8. Sprinklers; 9. Internal & yard hydrants; 10. Pumping; 11. Captive water tank; 12. Exit signs; 13. Fire lifts; 14. Standby power; 15. Refuge areas; 16. Special risk protection; 17. MOEFA; 18. Electrical audit; 19. Installation certificate; 20. Fire safety officer; 21. Lift safety certificate.",
      }
    ]
  },
  {
    id: 11,
    chapterNumber: "Chapter 11",
    title: "Structural Safety and Quality Control",
    pageRange: "pp. 116-123",
    summary: "Mandatory Indian Standards (IS 456, IS 800, IS 1893, IS 13920), 4-Part Structural Design Basis Report (SDBR), peer review for >50m height, 10-year structural audits, and qualification matrices.",
    sections: [
      {
        id: "11.1",
        clauseNumber: "11.1",
        title: "Applicable Indian Standards (IS Codes)",
        content: "Mandatory compliance with NBC 2016 Part 6, IS:456 (Concrete), IS:800 (Steel), IS:1893 (Earthquake), IS:13920 (Ductile Detailing), IS:4326 (Earthquake resistant masonry), IS:13935 (Seismic evaluation), and IS:14458 (Landslides/retaining walls).",
      },
      {
        id: "11.2",
        clauseNumber: "11.2",
        title: "Structural Design Basis Report (SDBR - Appendix 14)",
        content: "Includes Part 1 (General Data), Part 2 (Load bearing masonry), Part 3 (RCC frames), and Part 4 (Structural steel). Must be submitted before construction commencement.",
      },
      {
        id: "11.3",
        clauseNumber: "11.3",
        title: "Mandatory Proof Checking / Peer Review",
        content: "Mandatory peer review by empanelled structural engineers for: all buildings >50m height, critical lifeline/emergency structures (hospitals, telecom, power stations), and large assembly buildings.",
      },
      {
        id: "11.5",
        clauseNumber: "11.5",
        title: "Periodic Evaluation & Structural Audits",
        content: "High-rise and special buildings must undergo structural audit in the 10th year from occupancy grant, and every 5 years thereafter. Buildings >50m must be inspected by expert structural engineer.",
      }
    ]
  },
  {
    id: 12,
    chapterNumber: "Chapter 12",
    title: "Provisions for Differently Abled, Elderly and Children",
    pageRange: "pp. 123-127",
    summary: "Barrier-free access, wheelchair dimensions (1050x750mm), 1800mm walkways, 1:12 ramps, accessible toilets (1500x1750mm), tactile guiding floor, and accessible lifts.",
    sections: [
      {
        id: "12.3.1",
        clauseNumber: "12.3.1",
        title: "Access Walkway & Guiding Floor",
        content: "Walkway min width 1800mm without steps, max slope 5%. Guiding/warning floor material (tactile pavers) mandatory at entrances, lobbies, crossings, and ramps.",
      },
      {
        id: "12.3.2",
        clauseNumber: "12.3.2",
        title: "Accessible Parking",
        content: "At least 2 car spaces reserved within 30m of entrance. Bay size: 3.6m x 5.0m (includes 1200mm side transfer bay). Marked conspicuously with wheelchair symbol.",
      },
      {
        id: "12.4.1",
        clauseNumber: "12.4.1",
        title: "Ramp and Entrance Specifications",
        content: "Ramp min width 1800mm, max gradient 1:12, max length 9m per flight, 800mm handrails with 300mm extensions. Entrance door clear opening min 900mm, threshold max 12mm.",
      },
      {
        id: "12.4.5",
        clauseNumber: "12.4.5",
        title: "Accessible Toilet",
        content: "Min dimensions 1500mm x 1750mm. Door min 900mm swinging outward. Horizontal/vertical handrails with 50mm wall clearance. Commode seat 500mm from door.",
      }
    ]
  },
  {
    id: 13,
    chapterNumber: "Chapter 13",
    title: "Environmental Sustainability",
    pageRange: "pp. 127-133",
    summary: "Rainwater harvesting (plots >=300 sqm), Solar water heating (plots >=500 sqm), Solar PV (>=25% roof area for plots >=5000 sqm), wastewater recycling (>10,000 L/day), and tree plantation.",
    sections: [
      {
        id: "13.1.2",
        clauseNumber: "13.1.2",
        title: "Rainwater Harvesting",
        content: "Mandatory on all plots >=300 sqm and all group housing. In layouts >10 acres (>4 Ha), rainwater reservoirs must occupy min 1% of scheme area (max depth 2m). Recharge bores: min 1 per 5000 sqm built-up area for buildings >5000 sqm.",
      },
      {
        id: "13.2.3",
        clauseNumber: "13.2.3",
        title: "Solar Photovoltaic & Water Heating",
        content: "- Solar PV: Mandatory on plots >=500 sqm. For buildings >=5000 sqm, rooftop solar PV must cover at least 25% of plinth roof area.\n- Solar Water Heating: Mandatory on residential plots >=500 sqm, hotels, hospitals, hostels with >100 students, and banquet halls.",
      },
      {
        id: "13.5",
        clauseNumber: "13.5",
        title: "Wastewater Recycling & Dual Plumbing",
        content: "Mandatory when estimated discharge exceeds 10,000 liters/day. Must have separate purple-coloured down-take pipes for treated grey water to be reused for flushing, gardening, and car washing.",
      },
      {
        id: "13.7",
        clauseNumber: "13.7",
        title: "Green Cover & Tree Plantation Norms",
        content: "Residential: <200 sqm -> 1 tree; 200-300 sqm -> 2 trees; 301-500 sqm -> 4 trees; >500 sqm -> 1 tree per 100 sqm; Group housing -> 50 trees/Ha. Industrial: 1 tree per 80 sqm. Commercial: 1 tree per 100 sqm. Institutional/parks: 125 trees/Ha (min 20% greenery).",
      }
    ]
  },
  {
    id: 14,
    chapterNumber: "Chapter 14",
    title: "Qualifications and Competence of Licensed Technical Persons (LTP)",
    pageRange: "pp. 134-138",
    summary: "Architects, Engineers, Structural Engineers, Supervisors, Town Planners, Landscape Architects, Urban Designers, and Utility Service Engineers.",
    sections: [
      {
        id: "14.2",
        clauseNumber: "14.2",
        title: "Competency Matrix of Licensed Persons",
        content: "- Architect: B.Arch registered with Council of Architecture. Layouts up to 1 Ha (metros) / 2 Ha (others), all building plans.\n- Engineer: B.Tech/BE Civil/Architectural. Structural details of buildings up to 500 sqm and up to 5 storeys or 16.0m.\n- Structural Engineer: Graduate Civil Engineer with min 3 years experience (2 years for M.Tech, 1 year for Ph.D). Competent for all building designs.\n- Supervisor: Diploma + 5 yrs experience. Residential plots up to 100 sqm and 2 storeys / 7.5m.",
      },
      {
        id: "14.4",
        clauseNumber: "14.4",
        title: "Experience Requirements in Earthquake Zones",
        content: "Detailed experience table for Chartered Structural Engineers, Site Civil Engineers, and Inspecting Engineers across Seismic Zones 2, 3, 4, 5. Buildings >8 storeys or >24m require Graduate SE with 10 years or Post-Graduate with 8 years + design countersigned by IIT Roorkee or specified institute.",
      }
    ]
  },
  {
    id: 15,
    chapterNumber: "Chapter 15",
    title: "Zoning Regulations and Land Use Matrix",
    pageRange: "pp. 138-156",
    summary: "16 Standard Use Zones, Permissibility Matrix across 9 major activity groups, Conditional permissions, Impact fee formula and coefficient matrix.",
    sections: [
      {
        id: "15.1.1",
        clauseNumber: "15.1.1",
        title: "16 Standard Master Plan Land Use Zones",
        content: "1. Built-up (BU); 2. Residential (R); 3. Mixed Use 1&2 (MU); 4. Commercial 1 (Retail/CBD/Bazaar - C-1); 5. Commercial 2 (Wholesale/Storage - C-2); 6. Small Industries (SI); 7. Large Industries (LI); 8. Office Buildings (OB); 9. Public & Semi-public (PSP); 10. Traffic & Transport (TT); 11. Forest (F); 12. Recreational (RC); 13. Green Belt (GB); 14. Rural Abadi (RA); 15. Agriculture (A); 16. Highway Facilities (HF).",
      },
      {
        id: "15.3",
        clauseNumber: "15.3",
        title: "Activity Permissibility Matrix",
        content: "Classifies activities as Permitted (Green), Conditional with road width / FAR limits (Green with number), or Prohibited (Red) across all 16 zones.",
      },
      {
        id: "15.4",
        clauseNumber: "15.4",
        title: "Impact Fee Formula & Hierarchy",
        content: "Formula: Impact Fee = Plot Area × Circle Rate × Coefficient × 0.25.\nCoefficients range from 0.10 to 1.50 depending on the jump in land use hierarchy.",
      }
    ]
  },
  {
    id: 16,
    chapterNumber: "Chapter 16",
    title: "Compounding of Building Construction and Development",
    pageRange: "pp. 157-163",
    summary: "Supersedes Compounding Byelaws 2009. 13 absolute non-compoundable restrictions, permissible compounding limits in setbacks and FAR, and Schedule of Compounding Fees (Rule 4).",
    sections: [
      {
        id: "16.3.2",
        clauseNumber: "16.3.2",
        title: "13 Absolute Non-Compoundable Offences",
        content: "Strictly forbidden to compound: (i) Public utilities/roads/parks; (ii) Master Plan land use violations; (iii) Illegal colonies; (iv) Govt/public land without permission; (v) Disputed land; (vi) Mandatory earthquake measures; (vii) Missing fire NOC; (viii) Height violations in heritage/aviation zones; (ix) Feasible parking not provided; (x) Common areas in group housing; (xi) Ponds/reservoirs/waterbodies; (xii) Disabled accessibility violations; (xiii) Violation of predominant use in mixed use.",
      },
      {
        id: "16.3.3",
        clauseNumber: "16.3.3",
        title: "Compoundable Limits",
        content: "- Front Setback: Up to 25% of front setback area, max 1.0m.\n- Rear Setback: For residential up to 500 sqm -> 100% compoundable (if light/ventilation ensured); >500 sqm -> max 10% in addition to permissible 40%.\n- Side Setback: Up to 25% of side setback width.\n- Ground Coverage & FAR: Max 10% of total permissible FAR.\n- Building Height: Up to 10% from permissible limit without increasing storeys.",
      },
      {
        id: "16.3.8",
        clauseNumber: "16.3.8",
        title: "Schedule of Compounding Fees (Rule 4)",
        content: "Covers 13 violation types with exact per-sqm rates or percentage of land price (e.g. Front setback: 100% land price for residential, 200% for commercial; Height: Rs. 6132/m; Room dimensions: Rs. 123-246/sqm).",
      }
    ]
  },
  {
    id: 17,
    chapterNumber: "Chapter 17",
    title: "Provision of Electric Charging Infrastructure (EVCI)",
    pageRange: "pp. 164-174",
    summary: "20% parking capacity EV assumption, safety factor 1.25 on power load, MoP 2018 charger standards (CCS, CHAdeMO, Type-2, Bharat DC/AC-001), 3km x 3km urban grid, and highway corridor spacing.",
    sections: [
      {
        id: "17.1",
        clauseNumber: "17.1",
        title: "EV Charging Baseline & Power Factor",
        content: "EV infrastructure designed for 20% of total vehicle holding capacity. Additional power load sanctioned by DISCOM with safety factor of 1.25 over 30-year horizon.",
      },
      {
        id: "17.1.2",
        clauseNumber: "17.1.2",
        title: "Public Charging Stations (PCS) Ratios",
        content: "4-Wheelers: 1 Slow Charger per 3 EVs, 1 Fast Charger per 10 EVs. 2-Wheelers & 3-Wheelers: 1 Slow Charger per 2 EVs. Buses: 1 Fast Charger per 10 EVs.",
      },
      {
        id: "17.8",
        clauseNumber: "17.8",
        title: "Charger Specifications (Annexure E-2)",
        content: "- Fast: CCS (min 50 kW, 200-1000V, 1 CG), CHAdeMO (min 50 kW, 200-1000V, 1 CG)\n- Slow/Moderate: Type-2 AC (min 22 kW, 380-480V, 1 CG), Bharat DC-001 (15 kW, 72-200V, 1 CG), Bharat AC-001 (10 kW, 230V, 3 CG of 3.3 kW each).",
      }
    ]
  },
  {
    id: 18,
    chapterNumber: "Chapter 18",
    title: "In-Building Solutions for Common Telecom Infrastructure (CTI)",
    pageRange: "pp. 175-181",
    summary: "Digital infrastructure readiness, mandatory telecom ducts, sharing of CTI on non-discriminatory basis, and telecom room space norms as per NBC 2016.",
    sections: [
      {
        id: "18.3",
        clauseNumber: "18.3",
        title: "Incorporation in State Building Byelaws",
        content: "All new buildings must be 'Digital Infrastructure Deployment Ready'. Occupancy-cum-completion certificate granted only after confirming CTI installation and certification.",
      },
      {
        id: "18.5.1",
        clauseNumber: "18.5.1.2",
        title: "Telecom Room Space Norms (NBC 2016)",
        content: "- Built-up up to 465 sqm: 3.0m x 2.4m\n- Built-up 465 to 930 sqm: 3.0m x 3.4m\n- Built-up >930 sqm: Additional telecom room required.\n- Smaller buildings (<465 sqm): Wall cabinets or shallow room (0.6 x 2.6m) / walk-in (1.3 x 1.3m).",
      }
    ]
  }
];

export const KEY_DEFINITIONS: DefinitionItem[] = [
  {
    id: 1,
    term: "Access / Means of Access",
    definition: "A clear approach to a plot or building from a road/street, being a right of way, including drain, median strip, shoulder, berm, bridge, culvert between boundary walls.",
    category: "General"
  },
  {
    id: 2,
    term: "Act",
    definition: "Unless specified otherwise, means the Uttar Pradesh Urban Planning and Development Act, 1973.",
    category: "General"
  },
  {
    id: 14,
    term: "Basement or Cellar",
    definition: "The lower storey of a building, below or partly below ground level, with one or more levels. Maximum height of ceiling above ground level shall not be more than 1.20 meters.",
    category: "Building Features"
  },
  {
    id: 16,
    term: "Building",
    definition: "Structure constructed with any materials whatsoever for human habitation or otherwise, including foundations, plinth, walls, roofs, chimneys, fixed platforms, verandahs, balconies, tanks, outdoor displays, etc.",
    category: "Building Features"
  },
  {
    id: 17,
    term: "Building Height",
    definition: "Vertical distance measured from average front road level to highest point of flat roof, or to outer wall intersection with sloping roof. Architectural decoration features excluded. Measured up to terrace for fire safety.",
    category: "Building Features"
  },
  {
    id: 18,
    term: "Building Envelope",
    definition: "The horizontal spatial limits up to which a building may be permitted to be constructed on a plot; the residual area after leaving prescribed setbacks.",
    category: "Building Features"
  },
  {
    id: 21,
    term: "Built-up Area (Building)",
    definition: "The total covered area on all floors of an immovable property or building.",
    category: "FAR & Area"
  },
  {
    id: 23,
    term: "Carpet Area",
    definition: "Net usable floor area of an apartment, excluding external walls, service shafts, exclusive balcony/verandah and open terrace, but including internal partition walls.",
    category: "FAR & Area"
  },
  {
    id: 25,
    term: "Covered Area",
    definition: "Covered floor area above plinth level. Excludes gardens, swimming pools, boundary walls, entry gates, porches/porticos, watchman booths, and service pump houses.",
    category: "FAR & Area"
  },
  {
    id: 38,
    term: "Floor Area Ratio (FAR)",
    definition: "The quotient obtained by dividing combined covered area (plinth area) of all floors (except exempted areas) by total plot area. FAR = Total covered area on all floors / Plot Area.",
    category: "FAR & Area"
  },
  {
    id: 38.1,
    term: "Compensatory FAR",
    definition: "Additional FAR allowed to compensate for land transferred free of cost by the landowner to the Authority for road expansion or public facilities.",
    category: "FAR & Area"
  },
  {
    id: 38.2,
    term: "Purchasable FAR (PFAR)",
    definition: "Additional FAR permissible over the base FAR as specified in the Master Plan / Byelaws, purchased on payment of prescribed fee under Chapter 9.",
    category: "FAR & Area"
  },
  {
    id: 38.3,
    term: "Premium Purchasable FAR (PPFAR)",
    definition: "Additional FAR permissible over and above purchasable FAR under Chapter 9 upon payment of prescribed premium fee.",
    category: "FAR & Area"
  },
  {
    id: 45,
    term: "Habitable Room",
    definition: "A room occupied or designed for occupancy by one or more persons for study, living, sleeping, eating, or kitchen if used as living room. Excludes bathrooms, WC, cellars, and attics.",
    category: "Building Features"
  },
  {
    id: 54,
    term: "Mezzanine Floor",
    definition: "An intermediate floor between two floors of any storey forming an integral part of the floor below. Minimum area 9.5 sqm; max 33% of plinth area; counted in FAR.",
    category: "Building Features"
  },
  {
    id: 71,
    term: "Podium Parking",
    definition: "Floor/floors from floor above ground level to bottom of beam for parking under building envelope line, with ramps or mechanized lifts.",
    category: "Infrastructure"
  },
  {
    id: 87,
    term: "Setback Line",
    definition: "A line usually parallel to plot boundaries or road centerline, beyond which nothing can be constructed towards boundaries except with Authority permission.",
    category: "Building Features"
  },
  {
    id: 93,
    term: "Stilt Floor",
    definition: "A structure built on a plinth on pillars intended for the purpose of parking. Not counted in FAR, but counted towards overall building height.",
    category: "Building Features"
  },
  {
    id: 16.1,
    term: "Single-Unit (Residential)",
    definition: "Residential building having one independent residential unit on each floor or combination of floors with 3 or less storeys and height not exceeding 15 meters.",
    category: "Occupancy"
  },
  {
    id: 16.2,
    term: "Multi-Unit (Residential)",
    definition: "Residential building having one or more independent units on each floor with 4 or less storeys and height not exceeding 17.5 meters (including mandatory stilts).",
    category: "Occupancy"
  },
  {
    id: 16.3,
    term: "Group Housing",
    definition: "Group of residential or multi-storey buildings having one or more independent units on each floor with sharing/co-ownership of land, services, and open spaces.",
    category: "Occupancy"
  },
  {
    id: 16.4,
    term: "Flatted Factory",
    definition: "Multi-storey non-polluting industrial building designed to accommodate several businesses, each occupying a separate unit for manufacturing, assembly, or storage.",
    category: "Occupancy"
  }
];

export const DEEMED_NOC_DEPTS: DeemedNocDept[] = [
  { id: 1, department: "Acquisition, Nazul, Improvement Trust, Property, Urban Ceiling, Tehsil", applicability: "Acquisition & Tehsil (All buildings); Nazul/Ceiling/Trust (notified lists)", timeDays: "10 Days" },
  { id: 5, department: "Airport / Defence Authority", applicability: "Colour-coded Red Zone and buildings exceeding Permissible Top Elevation", timeDays: "10 Days" },
  { id: 6, department: "Army / Ministry of Defence", applicability: "Within 10m (Part A stations) or within 100m (Part B stations)", timeDays: "10 Days" },
  { id: 7, department: "Fire Department", applicability: "Buildings >15m height; special buildings >500 sqm; mixed >500 sqm", timeDays: "Conditional (15 Days)", notes: "Mandatory clearance before permit release" },
  { id: 8, department: "Irrigation / Ground Water Department", applicability: "Non-notified areas under UP Ground Water Act 2019, or within 50m", timeDays: "15 Days" },
  { id: 9, department: "Metro Rail Corporation", applicability: "Within 11m (underground) or 5m (elevated); 50m for under-implementation corridors", timeDays: "15 Days" },
  { id: 10, department: "Forest Department", applicability: "All projects requiring tree felling", timeDays: "15 Days" },
  { id: 11, department: "Railways", applicability: "Buildings within 30m of railway track boundary", timeDays: "15 Days" },
  { id: 12, department: "Power / Electricity DISCOM", applicability: "Only in respect of electrical load", timeDays: "5 Days" },
  { id: 13, department: "NHAI", applicability: "Buildings/layouts proposing direct access from NHAI highways", timeDays: "10 Days" },
  { id: 14, department: "PWD", applicability: "Where applicable for road access", timeDays: "10 Days" },
  { id: 15, department: "ASI / NMA (Archaeological Survey of India)", applicability: "Within 300m from precinct of listed protected monuments", timeDays: "10 Days" },
];

export const PLOTTED_RESIDENTIAL_SETBACKS: PlottedSetbackRule[] = [
  { plotRange: "Up to 150 sqm", minPlotArea: 0, maxPlotArea: 150, front: 1.0, rear: 0.0, side1: 0.0, side2: 0.0, type: "Row Housing", notes: "No rear or side setback required. Max coverage after front setback." },
  { plotRange: ">150 to 300 sqm", minPlotArea: 150.01, maxPlotArea: 300, front: 3.0, rear: 1.5, side1: 0.0, side2: 0.0, type: "Row Housing", notes: "Zero side setback. Max 3 floors with stilts up to 15m." },
  { plotRange: ">300 to 500 sqm", minPlotArea: 300.01, maxPlotArea: 500, front: 3.0, rear: 3.0, side1: 0.0, side2: 0.0, type: "Row Housing", notes: "4 storeys with stilts up to 17.5m permitted." },
  { plotRange: ">500 to 1200 sqm", minPlotArea: 500.01, maxPlotArea: 1200, front: 4.5, rear: 4.5, side1: 1.5, side2: 0.0, type: "Semi-Detached", notes: "Construction permitted on 40% rear setback up to 7m height (unless stilt)." },
  { plotRange: ">1200 sqm", minPlotArea: 1200.01, maxPlotArea: 99999, front: 6.0, rear: 6.0, side1: 1.5, side2: 1.5, type: "Detached", notes: "Detached on all 4 sides." },
];

export const HIGH_RISE_SETBACKS: HighRiseSetbackRule[] = [
  { heightRange: ">15 to 17.5m", minHeight: 15.01, maxHeight: 17.5, front: 5.0, rear: 5.0, side1: 5.0, side2: 5.0 },
  { heightRange: ">17.5 to 21m", minHeight: 17.51, maxHeight: 21.0, front: 6.0, rear: 6.0, side1: 6.0, side2: 6.0 },
  { heightRange: ">21 to 27m", minHeight: 21.01, maxHeight: 27.0, front: 7.0, rear: 7.0, side1: 7.0, side2: 7.0 },
  { heightRange: ">27 to 33m", minHeight: 27.01, maxHeight: 33.0, front: 8.0, rear: 8.0, side1: 8.0, side2: 8.0 },
  { heightRange: ">33 to 39m", minHeight: 33.01, maxHeight: 39.0, front: 9.0, rear: 9.0, side1: 9.0, side2: 9.0 },
  { heightRange: ">39 to 45m", minHeight: 39.01, maxHeight: 45.0, front: 10.0, rear: 10.0, side1: 10.0, side2: 10.0 },
  { heightRange: ">45 to 51m", minHeight: 45.01, maxHeight: 51.0, front: 11.0, rear: 11.0, side1: 11.0, side2: 11.0 },
  { heightRange: ">51m", minHeight: 51.01, maxHeight: 999.0, front: 15.0, rear: 12.0, side1: 12.0, side2: 12.0 },
];

export const FAR_EXEMPTIONS_TABLE: FarExemptionItem[] = [
  { id: 1, structure: "Mezzanine floor", singleMultiRes: true, groupHousing: true, commercialMixed: true, office: true, institutional: true, industrial: true, notes: "Counted in FAR (Y)" },
  { id: 2, structure: "Pergola (if closed from 3+ sides)", singleMultiRes: true, groupHousing: true, commercialMixed: true, office: true, institutional: true, industrial: true, notes: "Counted in FAR (Y)" },
  { id: 3, structure: "Lift Machine Room", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 4, structure: "Lift Shafts", singleMultiRes: true, groupHousing: true, commercialMixed: true, office: true, institutional: true, industrial: true, notes: "Counted only once on Ground Floor" },
  { id: 5, structure: "Lift Lobby up to 10 sqm", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 6, structure: "Meter Room (as per electricity norms)", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 7, structure: "Cantilever projection in setbacks (0.75m)", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 8, structure: "Porch / Portico (max 4m x 8m)", singleMultiRes: true, groupHousing: true, commercialMixed: true, office: true, institutional: true, industrial: true, notes: "Counted in FAR (Y)" },
  { id: 9, structure: "Basement: Parking and garages", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 10, structure: "Basement: DG set, meter, ETP, pumps", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 11, structure: "Basement: Household incidental storage", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 12, structure: "Basement: Storage NOT incidental to use", singleMultiRes: true, groupHousing: true, commercialMixed: true, office: true, institutional: true, industrial: true, notes: "Counted in FAR (Y)" },
  { id: 13, structure: "Basement: Commercial / Office use", singleMultiRes: true, groupHousing: true, commercialMixed: true, office: true, institutional: true, industrial: true, notes: "Counted in FAR (Y)" },
  { id: 14, structure: "Stilt floor used for parking", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 15, structure: "Stilt floor used for ANY OTHER purpose", singleMultiRes: true, groupHousing: true, commercialMixed: true, office: true, institutional: true, industrial: true, notes: "Counted in FAR (Y)" },
  { id: 16, structure: "Podium Parking (with max 10% driver/store)", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 17, structure: "Balconies up to 2.0 metres width", singleMultiRes: false, groupHousing: false, commercialMixed: true, office: true, institutional: true, industrial: true, notes: "Free from FAR in residential / group housing!" },
  { id: 18, structure: "Balconies beyond 2.0 metres", singleMultiRes: true, groupHousing: true, commercialMixed: true, office: true, institutional: true, industrial: true, notes: "Excess counted in FAR" },
  { id: 19, structure: "Fire escape / External staircase", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 20, structure: "Refuge Area (as per fire norms)", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 21, structure: "Service Duct", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Free from FAR (N)" },
  { id: 22, structure: "Services allowance (max 5% of FAR)", singleMultiRes: false, groupHousing: false, commercialMixed: false, office: false, institutional: false, industrial: false, notes: "Max 5% or 50 sqm (<=4000) / 100 sqm (>4000)" },
];

export const PURCHASABLE_FAR_FACTORS = [
  { category: "Commercial", pfar: 0.50, ppfar: 1.00 },
  { category: "Mixed Use", pfar: 0.45, ppfar: 0.90 },
  { category: "Office Buildings / Institutional", pfar: 0.45, ppfar: 0.90 },
  { category: "Hotels", pfar: 0.40, ppfar: 0.80 },
  { category: "Residential (Plotted)", pfar: 0.40, ppfar: 0 },
  { category: "Residential (Group Housing)", pfar: 0.40, ppfar: 0.80 },
  { category: "Community Facilities & Infrastructure", pfar: 0.20, ppfar: 0.40 },
];

export const COMPOUNDING_SCHEDULE_ITEMS: CompoundingRate[] = [
  {
    id: "1",
    category: "Without permission under permissible Ground Coverage & FAR",
    description: "Construction within permissible envelopes carried out without prior sanction",
    residential: "Plots <=150 sqm: Rs. 25/sqm; 150-300: Rs. 38/sqm; 300-500: Rs. 50/sqm; >500/GH: Rs. 62/sqm",
    commercial: "2.0 x Residential rate",
    office: "1.5 x Residential rate",
    industrial: "0.4 x Residential rate",
    facilities: "0.5 x Residential rate",
  },
  {
    id: "2a",
    category: "Beyond permissible Ground Coverage: In Front Setback",
    description: "Illegal construction in front setback (max 25% area / 1m width)",
    residential: "100% of price of land",
    commercial: "200% of price of land",
    office: "150% of price of land",
    industrial: "40% of price of land",
    facilities: "50% of price of land",
  },
  {
    id: "2b",
    category: "Beyond permissible Ground Coverage: In Side Setback",
    description: "Illegal construction in side setback (max 25% of width)",
    residential: "75% of price of land",
    commercial: "150% of price of land",
    office: "100% of price of land",
    industrial: "40% of price of land",
    facilities: "50% of price of land",
  },
  {
    id: "2c",
    category: "Beyond permissible Ground Coverage: In Rear Setback",
    description: "Illegal construction in rear setback",
    residential: "50% of price of land",
    commercial: "100% of price of land",
    office: "75% of price of land",
    industrial: "20% of price of land",
    facilities: "25% of price of land",
  },
  {
    id: "3",
    category: "Within permissible ground coverage beyond permissible FAR",
    description: "Extra floor area built beyond permissible limit (max 10% FAR)",
    residential: "Rs. 491/sqm + 50% required land price for floor area",
    commercial: "Rs. 982/sqm + 100% required land price for floor area",
    office: "Rs. 736/sqm + 75% required land price for floor area",
    industrial: "Rs. 196/sqm + 40% required land price for floor area",
    facilities: "Rs. 246/sqm + 50% required land price for floor area",
  },
  {
    id: "4",
    category: "Construction of basement beyond permissible limit",
    description: "Encroachment or excess basement area",
    residential: "50% of price of land",
    commercial: "100% of price of land",
    office: "75% of price of land",
    industrial: "20% of price of land",
    facilities: "25% of price of land",
  },
  {
    id: "5",
    category: "Internal height of room less than prescribed minimum",
    description: "Room height deficiency",
    residential: "Rs. 246/sqm on room area",
    commercial: "Rs. 491/sqm on room area",
    office: "Rs. 368/sqm on room area",
    industrial: "Rs. 123/sqm on room area",
    facilities: "Rs. 185/sqm on room area",
  },
  {
    id: "10",
    category: "Construction beyond permissible building height",
    description: "Height deviation up to 10% without altering floor count",
    residential: "Rs. 6,132/- per running meter of height per floor",
    commercial: "2x (Rs. 12,264/m)",
    office: "1.5x (Rs. 9,198/m)",
    industrial: "0.4x (Rs. 2,453/m)",
    facilities: "0.5x (Rs. 3,066/m)",
  }
];

export const AUTHORITIES_MAPPING: DevelopmentAuthorityUseZone[] = [
  {
    code: 1,
    name: "Ayodhya Development Authority",
    zones: [
      { standardZone: "Built up", localZoneName: "Built-up" },
      { standardZone: "Residential", localZoneName: "Residential" },
      { standardZone: "Mixed Use 1&2", localZoneName: "Mixed Use" },
      { standardZone: "Commercial 1", localZoneName: "Commercial" },
      { standardZone: "Small Industries", localZoneName: "Industries" },
      { standardZone: "Public & Semi-public", localZoneName: "Public & Semi-public Facilities / Historical / Religious Places" },
      { standardZone: "Transport 1&2", localZoneName: "Transport Facility / Bus Stand" },
      { standardZone: "Recreational", localZoneName: "Park and Open Spaces / Fair Ground and Garden" },
    ]
  },
  {
    code: 2,
    name: "Bareilly Development Authority",
    zones: [
      { standardZone: "Built up", localZoneName: "Built-up" },
      { standardZone: "Residential", localZoneName: "Residential" },
      { standardZone: "Commercial 1", localZoneName: "C1- City Centre/Sub-City Centre, C3-Bazaar Marg" },
      { standardZone: "Commercial 2", localZoneName: "C2- Wholesale / Storage" },
      { standardZone: "Small Industries", localZoneName: "Small Industries" },
      { standardZone: "Large Industries", localZoneName: "Large Industries" },
      { standardZone: "Public & Semi-public", localZoneName: "Community Facilities / Utilities / Educational / Hospital" },
    ]
  },
  {
    code: 4,
    name: "Gorakhpur Development Authority",
    zones: [
      { standardZone: "Built up", localZoneName: "Built-up" },
      { standardZone: "Residential", localZoneName: "Residential" },
      { standardZone: "Commercial 1", localZoneName: "C1- Bazaar Marg/ Commercial Centre, C2- City Centre" },
      { standardZone: "Commercial 2", localZoneName: "C3- Wholesale / Storage / Godown / Warehousing" },
      { standardZone: "Small Industries", localZoneName: "Small Industries" },
      { standardZone: "Large Industries", localZoneName: "Medium / Large Industries" },
    ]
  },
  {
    code: 8,
    name: "Meerut Development Authority",
    zones: [
      { standardZone: "Built up", localZoneName: "Built-up" },
      { standardZone: "Residential", localZoneName: "Residential" },
      { standardZone: "Mixed Use 1&2", localZoneName: "Mixed Use" },
      { standardZone: "Commercial 1", localZoneName: "Commercial, Bazaar Street, Saghan Bazar" },
      { standardZone: "Commercial 2", localZoneName: "Wholesale Mkt/Mandi, Warehouse" },
      { standardZone: "Transport", localZoneName: "Bus terminal, Air Strip/Airport, Transport Nagar, Cargo, RRTS Depot" },
    ]
  },
  {
    code: 11,
    name: "Mathura-Vrindavan Development Authority",
    zones: [
      { standardZone: "Built up", localZoneName: "Built-up" },
      { standardZone: "Residential", localZoneName: "Residential" },
      { standardZone: "Commercial 1", localZoneName: "City Centre, Sub-City Centre, Bazaar Street" },
      { standardZone: "Commercial 2", localZoneName: "Wholesale" },
      { standardZone: "Small Industries", localZoneName: "Small Industries, IT Industries" },
      { standardZone: "Public & Semi-public", localZoneName: "Public Semi-Public, Amusement Park, Knowledge Park, Medical & Health Care, Tourist Facilitation" },
    ]
  },
  {
    code: 18,
    name: "Agra Development Authority",
    zones: [
      { standardZone: "Built up", localZoneName: "Built-up" },
      { standardZone: "Residential", localZoneName: "Residential" },
      { standardZone: "Commercial 1", localZoneName: "Bazaar Street, City Centre/CBD, Sub-city centre, Tourism" },
      { standardZone: "Commercial 2", localZoneName: "Wholesale Business" },
      { standardZone: "Small Industries", localZoneName: "Non polluting industries" },
      { standardZone: "Recreational", localZoneName: "Sector Park, Regional Park, District Park, National Park, Riverfront Development" },
    ]
  },
  {
    code: 20,
    name: "Kanpur Development Authority",
    zones: [
      { standardZone: "Built up", localZoneName: "Built-up" },
      { standardZone: "Residential", localZoneName: "Residential" },
      { standardZone: "Commercial 1", localZoneName: "City Centre/CBD, Sub-city centre, Bazaar Street" },
      { standardZone: "Commercial 2", localZoneName: "Warehousing / Agricultural Produce Mandi" },
      { standardZone: "Small Industries", localZoneName: "Small & Service Industries, Cottage Industries" },
      { standardZone: "Large Industries", localZoneName: "Medium / Large Industries" },
      { standardZone: "Transport", localZoneName: "Airstrip/Airport, Water Transport, ISBT, Railway yard, Multi-modal logistic park" },
      { standardZone: "Recreational", localZoneName: "Stadium, Playground, Regional Park, Ecological Park, Riverfront Development" },
    ]
  },
  {
    code: 22,
    name: "Prayagraj Development Authority",
    zones: [
      { standardZone: "Built up", localZoneName: "Built-up" },
      { standardZone: "Residential", localZoneName: "Residential" },
      { standardZone: "Commercial 1", localZoneName: "District Centre, City Centre, General Business, Bazaar Street" },
      { standardZone: "Commercial 2", localZoneName: "Wholesale / Storage" },
      { standardZone: "Small Industries", localZoneName: "Small Industries / Cottage" },
      { standardZone: "Recreational", localZoneName: "Parks, Kumbh Mela, Regional Riverfront Development, Cultural & Religious Sites" },
    ]
  }
];

export const EVCI_CHARGER_SPECS = [
  { type: "Fast Charger", name: "CCS (Combined Charging System)", power: "Min 50 kW", voltage: "200 - 1000 V", connectorGuns: "1 / 1 CG", vehicleType: "4Ws (Cars), Commercial" },
  { type: "Fast Charger", name: "CHAdeMO", power: "Min 50 kW", voltage: "200 - 1000 V", connectorGuns: "1 / 1 CG", vehicleType: "4Ws (Cars)" },
  { type: "Slow / Moderate", name: "Type-2 AC", power: "Min 22 kW", voltage: "380 - 480 V", connectorGuns: "1 / 1 CG", vehicleType: "4Ws (Cars), Vans" },
  { type: "Slow / Moderate", name: "Bharat DC-001", power: "15 kW", voltage: "72 - 200 V", connectorGuns: "1 / 1 CG", vehicleType: "Light 4Ws, Fleet" },
  { type: "Slow / Moderate", name: "Bharat AC-001", power: "10 kW", voltage: "230 V", connectorGuns: "3 / 3 CG of 3.3 kW each", vehicleType: "2Ws, 3Ws, Cars" },
];

/* =====================================================================================
 * 1. COMMERCIAL, HEALTHCARE, EDUCATIONAL & INDUSTRIAL SETBACKS (CHAPTER 3)
 * ===================================================================================== */

/**
 * Section 3.2.4.3: Commercial Plots Setbacks (Building height up to 15m)
 */
export const COMMERCIAL_PLOT_SETBACKS: NonResidentialSetbackRule[] = [
  {
    id: "comm-up-to-100",
    category: "commercial",
    plotRange: "Up to 100 sqm",
    minPlotArea: 0,
    maxPlotArea: 100,
    front: 1.5,
    rear: 0.0,
    side1: 0.0,
    side2: 0.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 6.0,
    clauseRef: "Section 3.2.4.3",
    notes: "Front setback 1.5m. Rear and sides zero if light and ventilation are ensured (Note 1)."
  },
  {
    id: "comm-100-to-300",
    category: "commercial",
    plotRange: ">100 to 300 sqm",
    minPlotArea: 100.01,
    maxPlotArea: 300,
    front: 3.0,
    rear: 0.0,
    side1: 0.0,
    side2: 0.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 12.0,
    clauseRef: "Section 3.2.4.3",
    notes: "Front setback 3.0m. Rear and side setbacks zero if light and ventilation are ensured (Note 1)."
  },
  {
    id: "comm-300-to-1000",
    category: "commercial",
    plotRange: ">300 to 1000 sqm",
    minPlotArea: 300.01,
    maxPlotArea: 1000,
    front: 4.5,
    rear: 3.0,
    side1: 1.5,
    side2: 1.5,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 12.0,
    clauseRef: "Section 3.2.4.3",
    notes: "Front 4.5m, Rear 3.0m, Sides 1.5m each. Note 1 relaxation applies up to 500 sqm covered area."
  },
  {
    id: "comm-1000-to-3000",
    category: "commercial",
    plotRange: ">1000 to 3000 sqm",
    minPlotArea: 1000.01,
    maxPlotArea: 3000,
    front: 6.0,
    rear: 3.0,
    side1: 3.0,
    side2: 3.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 12.0,
    clauseRef: "Section 3.2.4.3",
    notes: "Front 6.0m, Rear 3.0m, Sides 3.0m each."
  },
  {
    id: "comm-above-3000",
    category: "commercial",
    plotRange: ">3000 sqm",
    minPlotArea: 3000.01,
    maxPlotArea: 999999,
    front: 12.0,
    rear: 6.0,
    side1: 6.0,
    side2: 6.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 18.0,
    clauseRef: "Section 3.2.4.3",
    notes: "Shopping mall / commercial complex scale. Front 12.0m, Rear 6.0m, Sides 6.0m each."
  }
];

/**
 * Section 3.2.4.5: Healthcare Buildings (Building height up to 15m)
 */
export const HEALTHCARE_BUILDING_SETBACKS: NonResidentialSetbackRule[] = [
  {
    id: "health-100-to-300",
    category: "healthcare",
    plotRange: "100 to 300 sqm",
    minPlotArea: 100,
    maxPlotArea: 300,
    front: 3.0,
    rear: 1.5,
    side1: 0.0,
    side2: 0.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 9.0,
    clauseRef: "Section 3.2.4.5",
    notes: "Diagnostic clinic / OPD clinic / Dispensary. Front 3.0m, Rear 1.5m, Sides 0m."
  },
  {
    id: "health-300-to-1000",
    category: "healthcare",
    plotRange: ">300 to 1000 sqm",
    minPlotArea: 300.01,
    maxPlotArea: 1000,
    front: 4.5,
    rear: 3.0,
    side1: 3.0,
    side2: 0.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 12.0,
    clauseRef: "Section 3.2.4.5",
    notes: "Nursing home up to 50 beds. Front 4.5m, Rear 3.0m, Side-1 3.0m, Side-2 0m."
  },
  {
    id: "health-1000-to-2000",
    category: "healthcare",
    plotRange: ">1000 to 2000 sqm",
    minPlotArea: 1000.01,
    maxPlotArea: 2000,
    front: 6.0,
    rear: 3.0,
    side1: 3.0,
    side2: 3.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 18.0,
    clauseRef: "Section 3.2.4.5",
    notes: "Hospitals. Front 6.0m, Rear 3.0m, Sides 3.0m each."
  },
  {
    id: "health-2000-to-4000",
    category: "healthcare",
    plotRange: ">2000 to 4000 sqm",
    minPlotArea: 2000.01,
    maxPlotArea: 4000,
    front: 7.5,
    rear: 4.5,
    side1: 4.5,
    side2: 4.5,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 18.0,
    clauseRef: "Section 3.2.4.5",
    notes: "Hospitals. Front 7.5m, Rear 4.5m, Sides 4.5m each."
  },
  {
    id: "health-above-4000",
    category: "healthcare",
    plotRange: ">4000 sqm",
    minPlotArea: 4000.01,
    maxPlotArea: 999999,
    front: 9.0,
    rear: 6.0,
    side1: 6.0,
    side2: 6.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 24.0,
    clauseRef: "Section 3.2.4.5",
    notes: "Large hospital / Medical college. Front 9.0m, Rear 6.0m, Sides 6.0m each."
  }
];

/**
 * Section 3.2.4.6: Educational Buildings (Building height up to 15m)
 */
export const EDUCATIONAL_BUILDING_SETBACKS: NonResidentialSetbackRule[] = [
  {
    id: "edu-up-to-1000",
    category: "educational",
    plotRange: "Up to 1000 sqm",
    minPlotArea: 0,
    maxPlotArea: 1000,
    front: 6.0,
    rear: 3.0,
    side1: 3.0,
    side2: 0.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 9.0,
    clauseRef: "Section 3.2.4.6",
    notes: "Nursery / Primary school. Front 6.0m, Rear 3.0m, Side-1 3.0m, Side-2 0m."
  },
  {
    id: "edu-1000-to-2000",
    category: "educational",
    plotRange: ">1000 to 2000 sqm",
    minPlotArea: 1000.01,
    maxPlotArea: 2000,
    front: 6.0,
    rear: 3.0,
    side1: 3.0,
    side2: 3.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 12.0,
    clauseRef: "Section 3.2.4.6",
    notes: "Secondary / High school. Front 6.0m, Rear 3.0m, Sides 3.0m each."
  },
  {
    id: "edu-2000-to-4000",
    category: "educational",
    plotRange: ">2000 to 4000 sqm",
    minPlotArea: 2000.01,
    maxPlotArea: 4000,
    front: 9.0,
    rear: 3.0,
    side1: 3.0,
    side2: 3.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 12.0,
    clauseRef: "Section 3.2.4.6",
    notes: "High school / Inter college. Front 9.0m, Rear 3.0m, Sides 3.0m each."
  },
  {
    id: "edu-4000-to-30000",
    category: "educational",
    plotRange: ">4000 to 30000 sqm",
    minPlotArea: 4000.01,
    maxPlotArea: 30000,
    front: 9.0,
    rear: 4.5,
    side1: 3.0,
    side2: 3.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 18.0,
    clauseRef: "Section 3.2.4.6",
    notes: "Degree college / Technical institute. Front 9.0m, Rear 4.5m, Sides 3.0m each."
  },
  {
    id: "edu-above-30000",
    category: "educational",
    plotRange: ">30000 sqm",
    minPlotArea: 30000.01,
    maxPlotArea: 999999,
    front: 15.0,
    rear: 6.0,
    side1: 6.0,
    side2: 6.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 24.0,
    clauseRef: "Section 3.2.4.6",
    notes: "Universities. Front 15.0m, Rear 6.0m, Sides 6.0m each."
  }
];

/**
 * Section 3.2.4.8: Industrial Buildings (Building height up to 15m)
 */
export const INDUSTRIAL_BUILDING_SETBACKS: NonResidentialSetbackRule[] = [
  {
    id: "ind-up-to-150",
    category: "industrial",
    plotRange: "Up to 150 sqm",
    minPlotArea: 0,
    maxPlotArea: 150,
    front: 3.0,
    rear: 0.0,
    side1: 0.0,
    side2: 0.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 7.0,
    clauseRef: "Section 3.2.4.8",
    notes: "Front 3.0m, Rear 0m, Sides 0m."
  },
  {
    id: "ind-150-to-300",
    category: "industrial",
    plotRange: ">150 to 300 sqm",
    minPlotArea: 150.01,
    maxPlotArea: 300,
    front: 3.0,
    rear: 3.0,
    side1: 0.0,
    side2: 0.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 9.0,
    clauseRef: "Section 3.2.4.8",
    notes: "Front 3.0m, Rear 3.0m, Sides 0m."
  },
  {
    id: "ind-300-to-500",
    category: "industrial",
    plotRange: ">300 to 500 sqm",
    minPlotArea: 300.01,
    maxPlotArea: 500,
    front: 4.5,
    rear: 3.0,
    side1: 3.0,
    side2: 0.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 9.0,
    clauseRef: "Section 3.2.4.8",
    notes: "Front 4.5m, Rear 3.0m, Side-1 3.0m, Side-2 0m."
  },
  {
    id: "ind-500-to-2000",
    category: "industrial",
    plotRange: ">500 to 2000 sqm",
    minPlotArea: 500.01,
    maxPlotArea: 2000,
    front: 6.0,
    rear: 3.0,
    side1: 3.0,
    side2: 3.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 9.0,
    clauseRef: "Section 3.2.4.8",
    notes: "Front 6.0m, Rear 3.0m, Sides 3.0m each."
  },
  {
    id: "ind-2000-to-6000",
    category: "industrial",
    plotRange: ">2000 to 6000 sqm",
    minPlotArea: 2000.01,
    maxPlotArea: 6000,
    front: 7.5,
    rear: 6.0,
    side1: 4.5,
    side2: 4.5,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 9.0,
    clauseRef: "Section 3.2.4.8",
    notes: "Front 7.5m, Rear 6.0m, Sides 4.5m each."
  },
  {
    id: "ind-above-6000",
    category: "industrial",
    plotRange: ">6000 sqm",
    minPlotArea: 6000.01,
    maxPlotArea: 999999,
    front: 9.0,
    rear: 6.0,
    side1: 6.0,
    side2: 6.0,
    maxGroundCoveragePct: 100,
    maxHeightMeters: 15.0,
    minRoadWidthMeters: 9.0,
    clauseRef: "Section 3.2.4.8",
    notes: "Front 9.0m, Rear 6.0m, Sides 6.0m each."
  }
];

/**
 * Section 5.1.5: Bazaar Street Front Setback Ladder Based on Abutting Road Width
 */
export const BAZAAR_STREET_SETBACK_LADDER: BazaarStreetSetbackRule[] = [
  { roadWidthMeters: 12.0, frontSetbackMeters: 3.0, clauseRef: "Section 5.1.5", notes: "Min 12m road requirement." },
  { roadWidthMeters: 18.0, frontSetbackMeters: 4.5, clauseRef: "Section 5.1.5", notes: "Front setback 4.5m." },
  { roadWidthMeters: 24.0, frontSetbackMeters: 6.0, clauseRef: "Section 5.1.5", notes: "Front setback 6.0m." },
  { roadWidthMeters: 30.0, frontSetbackMeters: 6.0, clauseRef: "Section 5.1.5", notes: "Front setback 6.0m." },
  { roadWidthMeters: 36.0, frontSetbackMeters: 7.5, clauseRef: "Section 5.1.5", notes: "Front setback 7.5m." },
  { roadWidthMeters: 45.0, frontSetbackMeters: 7.5, clauseRef: "Section 5.1.5", notes: "Front setback 7.5m." },
  { roadWidthMeters: 76.0, frontSetbackMeters: 9.0, clauseRef: "Section 5.1.5", notes: "Front setback 9.0m." }
];

/* =====================================================================================
 * 2. TELESCOPIC FAR ENGINE (SECTION 3.2.2 & 3.2.2.1)
 * ===================================================================================== */

export interface TelescopicSlabDefinition {
  slabIndex: number;
  slabRange: string;
  minArea: number;
  maxArea: number;
  slabCapacity: number;
  baseFAR: number;
}

export const RESIDENTIAL_PLOTTED_FAR_SLABS: TelescopicSlabDefinition[] = [
  { slabIndex: 1, slabRange: "Up to 150 sqm", minArea: 0, maxArea: 150, slabCapacity: 150, baseFAR: 2.00 },
  { slabIndex: 2, slabRange: ">150 to 300 sqm", minArea: 150, maxArea: 300, slabCapacity: 150, baseFAR: 1.80 },
  { slabIndex: 3, slabRange: ">300 to 500 sqm", minArea: 300, maxArea: 500, slabCapacity: 200, baseFAR: 1.75 },
  { slabIndex: 4, slabRange: ">500 to 1200 sqm", minArea: 500, maxArea: 1200, slabCapacity: 700, baseFAR: 1.50 },
  { slabIndex: 5, slabRange: ">1200 sqm", minArea: 1200, maxArea: Infinity, slabCapacity: Infinity, baseFAR: 1.25 },
];

/**
 * Pure TypeScript implementation of Section 3.2.2 & 3.2.2.1 telescopic FAR calculation
 * for plotted residential land.
 */
export function calculateTelescopicResidentialFAR(plotArea: number): TelescopicFarResult {
  const sanitizedPlotArea = Math.max(0, Number(plotArea) || 0);

  if (sanitizedPlotArea === 0) {
    return {
      plotArea: 0,
      slabs: [],
      totalBaseBuiltUpArea: 0,
      effectiveBaseFAR: 0,
      maxPermissibleFAR: 2.00,
      maxPermissibleBuiltUpArea: 0,
      purchasableFARCap: 0,
      purchasableAreaAvailable: 0,
    };
  }

  const slabs: TelescopicSlab[] = [];
  let remainingArea = sanitizedPlotArea;
  let totalBaseBuiltUpArea = 0;

  for (const slabDef of RESIDENTIAL_PLOTTED_FAR_SLABS) {
    if (remainingArea <= 0) break;

    const areaInThisSlab = Math.min(remainingArea, slabDef.slabCapacity);
    const builtUpInThisSlab = Number((areaInThisSlab * slabDef.baseFAR).toFixed(3));

    slabs.push({
      slabIndex: slabDef.slabIndex,
      slabRange: slabDef.slabRange,
      slabPlotArea: Number(areaInThisSlab.toFixed(2)),
      slabBaseFAR: slabDef.baseFAR,
      slabBuiltUpArea: builtUpInThisSlab,
    });

    totalBaseBuiltUpArea += builtUpInThisSlab;
    remainingArea -= areaInThisSlab;
  }

  const roundedTotalBuiltUp = Number(totalBaseBuiltUpArea.toFixed(2));
  const effectiveBaseFAR = Number((roundedTotalBuiltUp / sanitizedPlotArea).toFixed(3));
  const maxPermissibleFAR = 2.00;
  const maxPermissibleBuiltUpArea = Number((sanitizedPlotArea * maxPermissibleFAR).toFixed(2));
  const purchasableAreaAvailable = Math.max(0, Number((maxPermissibleBuiltUpArea - roundedTotalBuiltUp).toFixed(2)));
  const purchasableFARCap = Math.max(0, Number((maxPermissibleFAR - effectiveBaseFAR).toFixed(3)));

  return {
    plotArea: Number(sanitizedPlotArea.toFixed(2)),
    slabs,
    totalBaseBuiltUpArea: roundedTotalBuiltUp,
    effectiveBaseFAR,
    maxPermissibleFAR,
    maxPermissibleBuiltUpArea,
    purchasableFARCap,
    purchasableAreaAvailable,
  };
}

/* =====================================================================================
 * 3. ROAD-WIDTH-TO-FAR LOOKUP MATRICES (SECTION 3.2.2.2, 4.2.8, & 5.2.5)
 * ===================================================================================== */

/**
 * Section 3.2.2.2 & 4.2.8: Group Housing Road Width to FAR Matrix
 */
export const GROUP_HOUSING_ROAD_FAR_MATRIX: GroupHousingRoadFarRule[] = [
  {
    roadWidthRange: "9m to 12m (min 9m Built-up)",
    minRoadWidth: 9.0,
    maxRoadWidth: 12.0,
    builtUpBaseFar: 1.50,
    builtUpPurchasableFar: 0.30,
    builtUpMaxFar: 2.10,
    nonBuiltUpBaseFar: 2.50,
    nonBuiltUpPurchasableFar: 0.50,
    nonBuiltUpMaxFar: 3.50,
    minPlotAreaBuiltUp: 1000,
    minPlotAreaNonBuiltUp: 1500,
    clauseRef: "Section 3.2.2.2 & Section 4.2.8"
  },
  {
    roadWidthRange: ">12m to 18m",
    minRoadWidth: 12.01,
    maxRoadWidth: 18.0,
    builtUpBaseFar: 1.50,
    builtUpPurchasableFar: 0.75,
    builtUpMaxFar: 3.00,
    nonBuiltUpBaseFar: 2.50,
    nonBuiltUpPurchasableFar: 1.25,
    nonBuiltUpMaxFar: 5.00,
    minPlotAreaBuiltUp: 1000,
    minPlotAreaNonBuiltUp: 1500,
    clauseRef: "Section 3.2.2.2 & Section 4.2.8"
  },
  {
    roadWidthRange: ">18m to 24m",
    minRoadWidth: 18.01,
    maxRoadWidth: 24.0,
    builtUpBaseFar: 1.50,
    builtUpPurchasableFar: 0.75,
    builtUpMaxFar: 3.00,
    nonBuiltUpBaseFar: 2.50,
    nonBuiltUpPurchasableFar: 1.25,
    nonBuiltUpMaxFar: 5.00,
    minPlotAreaBuiltUp: 1000,
    minPlotAreaNonBuiltUp: 1500,
    clauseRef: "Section 3.2.2.2 & Section 4.2.8"
  },
  {
    roadWidthRange: ">24m to 45m",
    minRoadWidth: 24.01,
    maxRoadWidth: 45.0,
    builtUpBaseFar: 1.50,
    builtUpPurchasableFar: 1.50,
    builtUpMaxFar: 5.25,
    nonBuiltUpBaseFar: 2.50,
    nonBuiltUpPurchasableFar: 2.50,
    nonBuiltUpMaxFar: 8.75,
    minPlotAreaBuiltUp: 1000,
    minPlotAreaNonBuiltUp: 1500,
    clauseRef: "Section 3.2.2.2 & Section 4.2.8"
  },
  {
    roadWidthRange: "> 45m",
    minRoadWidth: 45.01,
    maxRoadWidth: 999.0,
    builtUpBaseFar: 1.50,
    builtUpPurchasableFar: 1.50,
    builtUpMaxFar: 999.0,
    nonBuiltUpBaseFar: 2.50,
    nonBuiltUpPurchasableFar: 2.50,
    nonBuiltUpMaxFar: 999.0,
    minPlotAreaBuiltUp: 1000,
    minPlotAreaNonBuiltUp: 1500,
    clauseRef: "Section 3.2.2.2 & Section 4.2.8"
  }
];

/**
 * Section 3.2.2.3 & 5.2.5: Commercial Complex & Shopping Malls FAR by Road Width
 */
export const COMMERCIAL_COMPLEX_ROAD_FAR_MATRIX: CommercialRoadFarRule[] = [
  {
    category: "Commercial Units (Up to 100 sqm)",
    roadWidthRange: "Up to 12m",
    minRoadWidth: 6.0,
    maxRoadWidth: 12.0,
    minPlotArea: 10,
    baseFar: 1.50,
    purchasableFar: 0.30,
    maxFar: 2.10,
    maxGroundCoveragePct: 100,
    clauseRef: "Section 5.2.5",
    notes: "Base FAR 1.50 (Built-up) / 1.75 (Non-built-up)."
  },
  {
    category: "Commercial Units & Complexes",
    roadWidthRange: ">12m to 24m",
    minRoadWidth: 12.01,
    maxRoadWidth: 24.0,
    minPlotArea: 100,
    baseFar: 1.50,
    purchasableFar: 0.75,
    maxFar: 3.00,
    maxGroundCoveragePct: 100,
    clauseRef: "Section 5.2.5",
    notes: "Base FAR 1.50 (Built-up) / 1.75 (Non-built-up)."
  },
  {
    category: "Shopping Malls (>3000 sqm)",
    roadWidthRange: ">18m to 24m",
    minRoadWidth: 18.0,
    maxRoadWidth: 24.0,
    minPlotArea: 3000,
    baseFar: 2.00,
    purchasableFar: 1.00,
    maxFar: 4.00,
    maxGroundCoveragePct: 100,
    clauseRef: "Section 5.2.5",
    notes: "Shopping malls permitted on roads >=18m. Base FAR 2.0 (Built-up) / 3.0 (Non-built-up)."
  },
  {
    category: "Commercial Complex & Shopping Malls",
    roadWidthRange: ">24m to 45m",
    minRoadWidth: 24.01,
    maxRoadWidth: 45.0,
    minPlotArea: 300,
    baseFar: 1.50,
    purchasableFar: 1.50,
    maxFar: 5.25,
    maxGroundCoveragePct: 100,
    clauseRef: "Section 5.2.5",
    notes: "High density commercial corridor. Malls: Max FAR 7.0 (Built-up) / 10.5 (Non-built-up)."
  },
  {
    category: "Major Commercial City Corridors",
    roadWidthRange: "> 45m",
    minRoadWidth: 45.01,
    maxRoadWidth: 999.0,
    minPlotArea: 300,
    baseFar: 1.50,
    purchasableFar: 1.50,
    maxFar: 999.0,
    maxGroundCoveragePct: 100,
    clauseRef: "Section 5.2.5",
    notes: "Unrestricted FAR available in 0.25 Base FAR increments."
  }
];

/* =====================================================================================
 * 4. CHAPTER 15 ACTIVITY PERMISSIBILITY MATRIX (SECTION 15.3.2)
 * ===================================================================================== */

export const CHAPTER_15_ACTIVITY_PERMISSIBILITY: ActivityPermissibilityRule[] = [
  {
    activityId: "act-single-unit",
    activityName: "Single Unit Residential",
    category: "Residential",
    clauseRef: "Section 15.3.2 & Section 4.1",
    statutoryNotes: "Max 3 storeys, 15m height. Self-certification applicable up to 100 sqm plots.",
    zonePermissibility: {
      BU: { status: "Permitted", conditions: "Min road 4m in built-up." },
      R: { status: "Permitted", conditions: "Min road 9m in non-built-up (7.5m if plots on one side)." },
      MU: { status: "Permitted", conditions: "Permitted on all floors or upper floors." },
      "C-1": { status: "Conditional", conditions: "Permitted on upper floors above commercial ground floor." },
      "C-2": { status: "Prohibited", conditions: "Security guard accommodation only." },
      SI: { status: "Conditional", conditions: "Staff / watchman accommodation only (up to 5% FAR)." },
      LI: { status: "Prohibited", conditions: "Residential use prohibited inside heavy industrial estates." },
      PSP: { status: "Conditional", conditions: "Staff quarters incidental to institutional campus." },
      RC: { status: "Prohibited", conditions: "No permanent residential construction." },
      A: { status: "Conditional", conditions: "Farmhouse allowed as per Section 7.2 on min 4000 sqm holding." }
    }
  },
  {
    activityId: "act-multi-unit",
    activityName: "Multi Unit Residential",
    category: "Residential",
    clauseRef: "Section 15.3.2 & Section 4.1",
    statutoryNotes: "Max 4 storeys with stilt, 17.5m height. Minimum plot area 150 sqm, road width min 9m.",
    zonePermissibility: {
      BU: { status: "Permitted", conditions: "Min road width 9m; min plot 150 sqm." },
      R: { status: "Permitted", conditions: "Min plot 150 sqm; stilt parking mandatory." },
      MU: { status: "Permitted", conditions: "Stilt parking or basement parking mandatory." },
      "C-1": { status: "Conditional", conditions: "Permitted above ground-floor commercial on min 12m road." },
      "C-2": { status: "Prohibited" },
      SI: { status: "Prohibited" },
      LI: { status: "Prohibited" },
      PSP: { status: "Conditional", conditions: "Staff residential blocks inside institutional campuses." },
      RC: { status: "Prohibited" },
      A: { status: "Prohibited" }
    }
  },
  {
    activityId: "act-group-housing",
    activityName: "Group Housing",
    category: "Residential",
    clauseRef: "Section 15.3.2 & Section 4.2",
    statutoryNotes: "Min plot 1000 sqm (built-up), 1500 sqm (non-built-up). Mandatory 10% EWS + 10% LIG reservation.",
    zonePermissibility: {
      BU: { status: "Conditional", conditions: "Min plot 1000 sqm, min road width 9m." },
      R: { status: "Permitted", conditions: "Min plot 1500 sqm, min road width 12m in non-built-up." },
      MU: { status: "Permitted", conditions: "Permitted with commercial use up to 5% FAR on ground floor." },
      "C-1": { status: "Conditional", conditions: "Permitted on roads >=18m; commercial on lower floors." },
      "C-2": { status: "Prohibited" },
      SI: { status: "Prohibited", conditions: "Worker dormitories allowed up to 20% FAR." },
      LI: { status: "Prohibited" },
      PSP: { status: "Conditional", conditions: "Staff and student housing inside institutional campuses." },
      RC: { status: "Prohibited" },
      A: { status: "Prohibited" }
    }
  },
  {
    activityId: "act-retail-shops",
    activityName: "Retail Shops & Convenience Shopping (<100 sqm)",
    category: "Commercial",
    clauseRef: "Section 15.3.2 & Section 5.1 / 5.2",
    statutoryNotes: "Ground floor retail shops, daily convenience items, grocery stores, restaurants.",
    zonePermissibility: {
      BU: { status: "Permitted", conditions: "Min road 6m in built-up." },
      R: { status: "Conditional", conditions: "Permitted on 9m road (non-built-up) or corner plots." },
      MU: { status: "Permitted", conditions: "Permitted on Ground and First floor." },
      "C-1": { status: "Permitted", conditions: "Primary commercial activity." },
      "C-2": { status: "Permitted", conditions: "Permitted subject to loading/unloading spaces." },
      SI: { status: "Conditional", conditions: "Canteen and convenience store only." },
      LI: { status: "Conditional", conditions: "Canteen and factory retail outlet only." },
      PSP: { status: "Conditional", conditions: "Incidental cafeteria, bookstore, ATM." },
      RC: { status: "Conditional", conditions: "Kiosk / cafeteria up to 5% coverage." },
      A: { status: "Conditional", conditions: "Agri-inputs, fertilizers, seeds on min 9m road." }
    }
  },
  {
    activityId: "act-commercial-complex",
    activityName: "Commercial Complex (>300 sqm)",
    category: "Commercial",
    clauseRef: "Section 15.3.2 & Section 5.2",
    statutoryNotes: "Min plot area 300 sqm, road width min 12m. Basement/podium parking mandatory.",
    zonePermissibility: {
      BU: { status: "Conditional", conditions: "Min road 12m, min plot 300 sqm." },
      R: { status: "Conditional", conditions: "Allowed on 24m roads with Impact Fee (Section 15.4)." },
      MU: { status: "Permitted", conditions: "Min road 12m, ECS parking compliance." },
      "C-1": { status: "Permitted", conditions: "Primary commercial activity." },
      "C-2": { status: "Conditional", conditions: "Permitted with wholesale/storage integration." },
      SI: { status: "Conditional", conditions: "Commercial display centre / IT software offices." },
      LI: { status: "Prohibited" },
      PSP: { status: "Prohibited" },
      RC: { status: "Prohibited" },
      A: { status: "Prohibited" }
    }
  },
  {
    activityId: "act-shopping-mall",
    activityName: "Shopping Mall & Multiplex (>3000 sqm)",
    category: "Commercial",
    clauseRef: "Section 15.3.2 & Section 5.2 / 5.4",
    statutoryNotes: "Min plot area 3000 sqm, min road width 18m. Peripheral 6m fire driveway mandatory.",
    zonePermissibility: {
      BU: { status: "Conditional", conditions: "Min road 18m, min plot 3000 sqm." },
      R: { status: "Prohibited" },
      MU: { status: "Conditional", conditions: "Min road 24m, min plot 3000 sqm." },
      "C-1": { status: "Permitted", conditions: "Min road 18m." },
      "C-2": { status: "Conditional", conditions: "Permitted in designated commercial sub-centres." },
      SI: { status: "Prohibited" },
      LI: { status: "Prohibited" },
      PSP: { status: "Prohibited" },
      RC: { status: "Prohibited" },
      A: { status: "Prohibited" }
    }
  },
  {
    activityId: "act-hotel",
    activityName: "Hotel & Guest House",
    category: "Commercial",
    clauseRef: "Section 15.3.2 & Section 5.3",
    statutoryNotes: "Min 6 guest rooms. Heritage hotels get road width relaxation (5m in spiritual hotspots).",
    zonePermissibility: {
      BU: { status: "Conditional", conditions: "Min road 6m (<=20 rooms) or 12m (>20 rooms)." },
      R: { status: "Conditional", conditions: "Min 9m road for <=20 rooms; 12m road for >20 rooms." },
      MU: { status: "Permitted", conditions: "Min road 12m, ECS parking compliance." },
      "C-1": { status: "Permitted", conditions: "Primary use in City Centre and tourism zones." },
      "C-2": { status: "Conditional", conditions: "Motel / highway rest area on major highways." },
      SI: { status: "Conditional", conditions: "Business hotel inside IT / industrial park." },
      LI: { status: "Prohibited" },
      PSP: { status: "Conditional", conditions: "Institutional guest house / transit hostel." },
      RC: { status: "Conditional", conditions: "Eco-resort up to 20% coverage on min 4000 sqm plot." },
      A: { status: "Conditional", conditions: "Agri-tourism resort / farmhouse stay as per tourism policy." }
    }
  },
  {
    activityId: "act-small-industry",
    activityName: "Small Industry & Flatted Factory",
    category: "Industrial",
    clauseRef: "Section 15.3.2 & Section 7.1",
    statutoryNotes: "Non-polluting micro/small units, IT/electronics assembly, garments, handicrafts.",
    zonePermissibility: {
      BU: { status: "Conditional", conditions: "Service workshop / micro-unit without heavy power." },
      R: { status: "Conditional", conditions: "Cottage industry without hired labour/effluent." },
      MU: { status: "Conditional", conditions: "IT / software / design studios / non-polluting flatted factories." },
      "C-1": { status: "Conditional", conditions: "Service and repair establishments incidental to retail." },
      "C-2": { status: "Permitted", conditions: "Packaging, assembly, and service industries." },
      SI: { status: "Permitted", conditions: "Primary designated zone. Base FAR 1.50 to 3.00." },
      LI: { status: "Permitted", conditions: "Ancillary manufacturing." },
      PSP: { status: "Conditional", conditions: "Vocational training workshops." },
      RC: { status: "Prohibited" },
      A: { status: "Conditional", conditions: "Allowed on 7m road in Agriculture; non-polluting only." }
    }
  },
  {
    activityId: "act-large-industry",
    activityName: "Large Industry & Manufacturing Plant",
    category: "Industrial",
    clauseRef: "Section 15.3.2 & Section 7.1",
    statutoryNotes: "Heavy fabrication, chemical, engineering plants. UPPCB clearance mandatory.",
    zonePermissibility: {
      BU: { status: "Prohibited" },
      R: { status: "Prohibited" },
      MU: { status: "Prohibited" },
      "C-1": { status: "Prohibited" },
      "C-2": { status: "Prohibited" },
      SI: { status: "Prohibited", conditions: "Only non-polluting small industries allowed." },
      LI: { status: "Permitted", conditions: "Primary heavy industrial zone with green buffer." },
      PSP: { status: "Prohibited" },
      RC: { status: "Prohibited" },
      A: { status: "Conditional", conditions: "Single factory unit on min 7m road (Section 3.1.1.3)." }
    }
  },
  {
    activityId: "act-hospital",
    activityName: "Hospital & Healthcare Centre",
    category: "Institutional",
    clauseRef: "Section 15.3.2 & Section 6.1",
    statutoryNotes: "Ambulance bay, bio-medical waste compliance, fire tender circulation mandatory.",
    zonePermissibility: {
      BU: { status: "Conditional", conditions: "Clinics on 9m road, nursing homes on 12m, hospitals on 18m." },
      R: { status: "Conditional", conditions: "Nursing homes on min 12m road, plot >300 sqm." },
      MU: { status: "Permitted", conditions: "Hospitals on min 18m road." },
      "C-1": { status: "Permitted", conditions: "Permitted on min 18m road." },
      "C-2": { status: "Conditional", conditions: "Permitted on min 18m road." },
      SI: { status: "Conditional", conditions: "Dispensary / occupational health unit." },
      LI: { status: "Conditional", conditions: "First-aid centre inside industrial estate." },
      PSP: { status: "Permitted", conditions: "Primary public and semi-public institutional use." },
      RC: { status: "Conditional", conditions: "Wellness / nature cure retreat." },
      A: { status: "Conditional", conditions: "Hospital on min 18m road with NOC." }
    }
  },
  {
    activityId: "act-school",
    activityName: "Educational Institution (School / College)",
    category: "Institutional",
    clauseRef: "Section 15.3.2 & Section 6.2",
    statutoryNotes: "Playground reservation mandatory. Safe internal student drop-off loop.",
    zonePermissibility: {
      BU: { status: "Conditional", conditions: "Nursery/primary on 9m road; secondary on 12m road." },
      R: { status: "Permitted", conditions: "Primary on 9m/12m road; secondary on 12m road." },
      MU: { status: "Permitted", conditions: "Min road 12m (middle) or 18m (high school/college)." },
      "C-1": { status: "Conditional", conditions: "Permitted on designated educational plots." },
      "C-2": { status: "Prohibited" },
      SI: { status: "Conditional", conditions: "Industrial training institute (ITI) / technical school." },
      LI: { status: "Prohibited" },
      PSP: { status: "Permitted", conditions: "Primary public and semi-public institutional use." },
      RC: { status: "Prohibited" },
      A: { status: "Conditional", conditions: "Degree college / school on min 18m/12m road." }
    }
  }
];

/* =====================================================================================
 * 5. STATUTORY QUERY HELPER UTILITIES
 * ===================================================================================== */

/**
 * Query non-residential setbacks for commercial, healthcare, educational, or industrial plots.
 */
export function getNonResidentialSetback(
  category: 'commercial' | 'healthcare' | 'educational' | 'industrial',
  plotArea: number
): NonResidentialSetbackRule | undefined {
  let table: NonResidentialSetbackRule[];
  switch (category) {
    case 'commercial':
      table = COMMERCIAL_PLOT_SETBACKS;
      break;
    case 'healthcare':
      table = HEALTHCARE_BUILDING_SETBACKS;
      break;
    case 'educational':
      table = EDUCATIONAL_BUILDING_SETBACKS;
      break;
    case 'industrial':
      table = INDUSTRIAL_BUILDING_SETBACKS;
      break;
  }
  return table.find((rule) => plotArea >= rule.minPlotArea && plotArea <= rule.maxPlotArea)
    || table[table.length - 1];
}

/**
 * Query Section 5.1.5 Bazaar Street front setback based on abutting road width.
 */
export function getBazaarStreetFrontSetback(roadWidth: number): BazaarStreetSetbackRule {
  for (let i = BAZAAR_STREET_SETBACK_LADDER.length - 1; i >= 0; i--) {
    if (roadWidth >= BAZAAR_STREET_SETBACK_LADDER[i].roadWidthMeters) {
      return BAZAAR_STREET_SETBACK_LADDER[i];
    }
  }
  return BAZAAR_STREET_SETBACK_LADDER[0];
}

/**
 * Query Section 3.2.2.2 & 4.2.8 Group Housing FAR by road width and built-up status.
 */
export function getGroupHousingFarRule(roadWidth: number): GroupHousingRoadFarRule {
  for (const rule of GROUP_HOUSING_ROAD_FAR_MATRIX) {
    if (roadWidth >= rule.minRoadWidth && roadWidth <= rule.maxRoadWidth) {
      return rule;
    }
  }
  return GROUP_HOUSING_ROAD_FAR_MATRIX[GROUP_HOUSING_ROAD_FAR_MATRIX.length - 1];
}

/**
 * Query Section 5.2.5 Commercial complex & shopping malls FAR by road width.
 */
export function getCommercialComplexFarRule(roadWidth: number): CommercialRoadFarRule {
  for (const rule of COMMERCIAL_COMPLEX_ROAD_FAR_MATRIX) {
    if (roadWidth >= rule.minRoadWidth && roadWidth <= rule.maxRoadWidth) {
      return rule;
    }
  }
  return COMMERCIAL_COMPLEX_ROAD_FAR_MATRIX[COMMERCIAL_COMPLEX_ROAD_FAR_MATRIX.length - 1];
}

/**
 * Query Section 15.3.2 activity permissibility for a given activity and standardized zone.
 */
export function getActivityPermissibility(
  activityId: string,
  zoneCode: StandardZoneCode
): { status: PermissibilityStatus; conditions?: string; activityName?: string } | undefined {
  const rule = CHAPTER_15_ACTIVITY_PERMISSIBILITY.find((a) => a.activityId === activityId);
  if (!rule) return undefined;
  const zoneResult = rule.zonePermissibility[zoneCode];
  return {
    activityName: rule.activityName,
    status: zoneResult.status,
    conditions: zoneResult.conditions,
  };
}