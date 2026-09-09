import React, { useState } from 'react';
import {
  Sun,
  Wind,
  Flame,
  Truck,
  Droplets,
  Activity,
  ShieldAlert,
  Scale,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Compass,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

interface RationaleTopic {
  id: string;
  title: string;
  category: 'geometry' | 'transport' | 'environment' | 'safety' | 'legal';
  categoryLabel: string;
  badge: string;
  icon: React.ElementType;
  abstract: string;
  engineeringRationale: {
    governingConcept: string;
    physicalMechanism: string;
    statutoryThreshold: string;
    consequencesOfDeficiency: string;
  };
  literatureCitations: Array<{
    title: string;
    authority: string;
    clauseOrStandard: string;
    keyTakeaway: string;
  }>;
  caseStudyOrContext: string;
}

const RATIONALE_TOPICS: RationaleTopic[] = [
  {
    id: 'solar_geometry_setbacks',
    title: 'Solar Exposure Planes & Daylight Factor Equilibrium',
    category: 'geometry',
    categoryLabel: 'Spatial Physics',
    badge: 'Section 3.2.4 Norms',
    icon: Sun,
    abstract: 'Why setback depths scale progressively with building height rather than remaining flat fixed distances.',
    engineeringRationale: {
      governingConcept: 'Sky Exposure Plane & Solar Zenith Geometry',
      physicalMechanism: 'At Uttar Pradesh latitudes (23.8°N to 30.4°N), the solar azimuth and altitude angles during the winter solstice drop to ~38° at solar noon. A building erected without proportional setbacks casts an extended shadow envelope (length = Height × cot 38° ≈ 1.28 × Height) onto opposite and adjacent parcels. To maintain a minimum 1.5% Daylight Factor at ground-floor habitable living spaces under cloudy sky conditions, the ratio of street/setback clearance to building height (D/H) must remain between 1:1 and 1:1.5.',
      statutoryThreshold: 'Buildings up to 15m retain baseline 3m–5m setbacks. Above 15m, Chapter 3.2.4.9 mandates adding 1.0m of peripheral setback for every additional 3.0m in height, directly mirroring the solar clearance tangent.',
      consequencesOfDeficiency: 'Omitting setbacks creates perpetual "urban canyon gloom", damp microclimates fostering fungal growth, and an artificial surge in daytime electrical lighting demand (estimated +18% base residential load).'
    },
    literatureCitations: [
      {
        title: 'National Building Code of India (NBC 2016)',
        authority: 'Bureau of Indian Standards (BIS)',
        clauseOrStandard: 'Part 8: Building Services, Section 1 (Lighting & Natural Ventilation)',
        keyTakeaway: 'Habitable rooms must receive direct sky illumination unobstructed within a 45° vertical cone of daylight penetration.'
      },
      {
        title: 'Energy Conservation Building Code (ECBC 2017)',
        authority: 'Bureau of Energy Efficiency (BEE)',
        clauseOrStandard: 'Section 4.3 (Daylighting & Envelope)',
        keyTakeaway: 'A minimum 40% of regularly occupied spaces must achieve at least 300 lux of natural illuminance during daylight hours.'
      }
    ],
    caseStudyOrContext: 'In dense historic cores of Old Lucknow and Varanasi chowks with 3m alleys and 4-storey row tenements, ground-level daylight drops below 0.3%, forcing continuous incandescent illumination and accelerating respiratory ailments.'
  },
  {
    id: 'aerodynamic_ventilation',
    title: 'Aerodynamic Stack Effects & Cross-Ventilation Pressure Gradients',
    category: 'environment',
    categoryLabel: 'Microclimate & Energy',
    badge: 'Indoor Environmental Quality',
    icon: Wind,
    abstract: 'Why rear and side open courts are legally protected from being enclosed or roofed over.',
    engineeringRationale: {
      governingConcept: 'Bernoulli Differential Pressure & Passive Thermal Buoyancy',
      physicalMechanism: 'Natural cross-ventilation requires a positive pressure zone (+ΔP) on the windward exterior facade and a corresponding suction / negative pressure zone (-ΔP) on the leeward facade. Continuous boundary walls without rear/side setback corridors strangle airflow into stagnant eddies. Open rear courts act as thermal chimneys: warmer indoor air rises and escapes through high ventilators while cooler air is drawn through shaded courtyard ground clearances.',
      statutoryThreshold: 'Mandatory minimum 1.5m rear/side setbacks for plots >150 m², and strict statutory bans on enclosing light-wells or internal ventilation shafts smaller than 3.0m × 3.0m.',
      consequencesOfDeficiency: 'Trapped internal heat loads, chronic indoor relative humidity spikes exceeding 75% in monsoon months, and high concentrations of carbon dioxide (CO₂) and volatile organic compounds (VOCs).'
    },
    literatureCitations: [
      {
        title: 'Architectural Aerodynamics & Natural Ventilation Design',
        authority: 'ASHRAE Handbook of Fundamentals',
        clauseOrStandard: 'Chapter 16: Airflow Around Buildings',
        keyTakeaway: 'Courtyard aspect ratios (Width / Height) must exceed 0.4 to prevent isolated stagnation vortexes and maintain passive air exchange rates of 6+ air changes per hour.'
      }
    ],
    caseStudyOrContext: 'Traditional Uttar Pradesh havelis and court-houses utilized shaded inner courtyards (angan) to maintain interior temperatures 4°C to 6°C cooler than the street ambient without mechanical HVAC.'
  },
  {
    id: 'emergency_fire_kinematics',
    title: 'Heavy Aerial Fire Tender Kinematics & Hydraulic Jack Envelopes',
    category: 'safety',
    categoryLabel: 'Life Safety & Emergency',
    badge: 'Chapter 10 Fire Mandates',
    icon: Flame,
    abstract: 'Why high-rise structures require a continuous 6.0m wide driveway capable of supporting 30-tonne axle loads.',
    engineeringRationale: {
      governingConcept: 'Dynamic Turning Radii & Hydraulic Outrigger Ground Stabilization',
      physicalMechanism: 'Hydraulic Platform Fire Tenders (e.g. 42m to 54m Bronto Skylifts used by UP Fire Services) possess a vehicle length of 11.8m, an overall weight of ~32 tonnes, and an outer turning radius of 9.5m. When deployed to combat a blaze on upper floors, the tender extends lateral hydraulic outrigger jacks spanning 5.4m to 6.2m wide. If setbacks are narrower than 6.0m or obstructed by ramps or cantilevered balconies, the jacks cannot touch down without tilting, rendering aerial ladder rescue impossible above 10.5m (the 3rd floor).',
      statutoryThreshold: 'Chapter 10 & NBC Part 4: High-rise buildings (>15m) must maintain an unobstructed 6.0m peripheral driveway, paved to bear 45 kN/m² axle pressure, with minimum 9.0m turning radius at all corners.',
      consequencesOfDeficiency: 'Aerial ladders cannot stabilize. Trapped occupants above the 3rd floor cannot be evacuated externally, forcing full reliance on internal escape staircases during smoke migration.'
    },
    literatureCitations: [
      {
        title: 'NBC 2016 Part 4: Fire and Life Safety',
        authority: 'Bureau of Indian Standards',
        clauseOrStandard: 'Clause 4.5: Provision of Exterior Open Spaces for Fire Fighting',
        keyTakeaway: 'The perimeter road must be free of overhead arches, electrical wires, or tree canopies lower than 5.0m clear height.'
      },
      {
        title: 'NFPA 1901: Standard for Automotive Fire Apparatus',
        authority: 'National Fire Protection Association',
        clauseOrStandard: 'Chapter 20: Aerial Devices & Stabilization',
        keyTakeaway: 'Maximum allowable ground inclination for aerial outrigger deployment is 5 degrees; soft or unreinforced paver surfaces risk structural rollover.'
      }
    ],
    caseStudyOrContext: 'During multiple urban high-rise fires in NCR (Noida and Greater Noida), parked vehicles and decorative garden planters in the 6m setback delayed fire brigade outrigger stabilization by 25+ minutes.'
  },
  {
    id: 'transport_equilibrium_far',
    title: 'Transportation Equilibrium & Road Carrying Capacity Saturation',
    category: 'transport',
    categoryLabel: 'Urban Mobility',
    badge: 'Road Width vs FAR Slabs',
    icon: Truck,
    abstract: 'Why maximum permissible FAR is strictly throttled by abutting road width rather than architectural ambition.',
    engineeringRationale: {
      governingConcept: 'Trip Generation Densities & Roadway Level of Service (LOS)',
      physicalMechanism: 'Every square meter of constructed built-up area generates commuter, logistics, and visitor trips. A commercial office development generates approximately 1.8 to 2.4 Passenger Car Units (PCU) per 100 m² during peak morning ingress. A 9m undivided residential street possesses a design capacity of ~800–1000 PCU/hour (Level of Service C). Permitting an FAR of 3.0 on a 9m road for a 5,000 m² plot introduces 15,000 m² of floor space, generating ~300 PCU/hr from a single parcel alone. When combined with ambient neighborhood traffic, this instantly tips the road into Level of Service F (breakdown flow, gridlock, and bumper-to-bumper queue spillback).',
      statutoryThreshold: 'The byelaws strictly enforce: 9m road = max FAR 1.5–1.75; 12m–18m road = max FAR 2.0; 24m+ road = max base FAR 2.5 + purchasable tier up to 3.5. Transit-Oriented Development (TOD) corridors allow higher FAR only within 500m of rapid transit lines.',
      consequencesOfDeficiency: 'Permanent gridlock on residential collector streets, blocked emergency ambulance corridors, spillover parking on sidewalks, and complete breakdown of municipal solid-waste collection vehicles.'
    },
    literatureCitations: [
      {
        title: 'IRC:106-1990 Guidelines for Capacity of Urban Roads in Plain Areas',
        authority: 'Indian Roads Congress',
        clauseOrStandard: 'Table 1: Design Service Volumes of Urban Roads',
        keyTakeaway: 'Single-lane and intermediate roads (<9m) cannot absorb high-density traffic without complete loss of roadway operational stability.'
      },
      {
        title: 'Highway Capacity Manual (HCM 2020)',
        authority: 'Transportation Research Board (TRB)',
        clauseOrStandard: 'Volume 3: Urban Streets',
        keyTakeaway: 'Traffic volume exceeding 85% of saturation flow rate leads to exponential queuing delays and air pollution concentrations.'
      }
    ],
    caseStudyOrContext: 'Uncontrolled commercialization along 9m roads in older sectors of Kanpur and Agra led to average vehicle speeds falling below 6 km/h, forcing emergency vehicles to detour up to 4 km.'
  },
  {
    id: 'hydrology_ground_coverage',
    title: 'Alluvial Aquifer Recharge & Stormwater Hydrograph Attenuation',
    category: 'environment',
    categoryLabel: 'Hydrology & Groundwater',
    badge: 'Ground Coverage Caps & RWH',
    icon: Droplets,
    abstract: 'Why ground coverage is capped between 35% and 60% and rainwater harvesting is made legally mandatory.',
    engineeringRationale: {
      governingConcept: 'Rational Method Runoff Runoff Coefficient (Q = C × I × A) & Infiltration Hydraulics',
      physicalMechanism: 'In the alluvial Gangetic basin of Uttar Pradesh, natural undisturbed sandy-loam soil features a runoff coefficient C of ~0.15 to 0.25 (meaning 75% to 85% of rainfall infiltrates into the ground or evaporates). When a site is 100% concreted and roofed over, the runoff coefficient surges to C = 0.90–0.95. During a standard 50mm/hour monsoon downpour, a 1,000 m² plot covered 100% discharges ~45 cubic meters of water per hour directly into street gutters. Multiplying this across thousands of urban parcels overloads municipal stormwater conduits designed for 25-year storm events, causing severe urban flash floods.',
      statutoryThreshold: 'Ground coverage is capped between 35% (high-rise/commercial) and 60% (small residential). Mandates 1 Rainwater Harvesting recharge well per 100 m² of roof area, and minimum 1 tree per 100 m² of open land.',
      consequencesOfDeficiency: 'Catastrophic urban flash flooding, simultaneous rapid depletion of urban groundwater tables (dropping by 0.5m–1.2m annually across Lucknow, Ghaziabad, and Noida), and the loss of natural sub-surface moisture.'
    },
    literatureCitations: [
      {
        title: 'Central Ground Water Board (CGWB) Master Plan for Artificial Recharge to Ground Water in India',
        authority: 'Ministry of Jal Shakti, Government of India',
        clauseOrStandard: 'Section 4: Alluvial Plains of Uttar Pradesh',
        keyTakeaway: 'Permeable open soil strips along plot perimeters act as critical primary infiltration zones to arrest critical groundwater overdraft.'
      }
    ],
    caseStudyOrContext: 'In Lucknow\'s Gomti Nagar Extension, excessive ground concreting and missing recharge wells during the July 2023 monsoon overwhelmed secondary storm sewers, inundating basements across several sectors.'
  },
  {
    id: 'seismic_isolation_pounding',
    title: 'Seismic Wave Dispersion & Structural Pounding Isolation',
    category: 'safety',
    categoryLabel: 'Structural Engineering',
    badge: 'IS 1893 & NBC 2016 Part 6',
    icon: Activity,
    abstract: 'Why adjacent buildings are forbidden from sharing zero-clearance side boundaries above 15m.',
    engineeringRationale: {
      governingConcept: 'Dynamic Inter-Story Drift & Out-of-Phase Oscillations',
      physicalMechanism: 'Uttar Pradesh spans Seismic Zones III and IV (with Northern Terai and NCR regions in high-risk Zone IV). During an earthquake, ground accelerations induce lateral shear displacement in tall buildings. Two adjacent buildings of differing heights or structural framing have different natural vibration periods (T1 ≠ T2). They oscillate out of phase: while Building A swings right, Building B swings left. If the seismic separation gap (setback) is narrower than the sum of their elastic lateral drifts (Δ1 + Δ2), their floor slabs collide with immense hammer-like force ("structural pounding"), shearing perimeter columns and triggering progressive vertical collapse.',
      statutoryThreshold: 'IS 1893:2016 Clause 7.11 & Byelaws Chapter 8: Buildings taller than 15m must maintain a separation gap of not less than R × total lateral drift, enforced via mandatory side setbacks.',
      consequencesOfDeficiency: 'Catastrophic shear failure at floor joints, destruction of masonry infill walls into falling projectile hazards, and progressive structural failure during moderate 5.5–6.5 magnitude seismic events.'
    },
    literatureCitations: [
      {
        title: 'IS 1893 (Part 1): 2016 Criteria for Earthquake Resistant Design of Structures',
        authority: 'Bureau of Indian Standards',
        clauseOrStandard: 'Clause 7.11: Building Separation for Pounding Prevention',
        keyTakeaway: 'The separation between adjacent building frames shall not be less than the calculated drift of both structures multiplied by their response reduction factor.'
      }
    ],
    caseStudyOrContext: 'Extensive post-earthquake damage investigations during the 2001 Bhuj and 2015 Nepal earthquakes revealed that structural pounding between adjacent unseparated buildings accounted for over 22% of total structural collapses.'
  },
  {
    id: 'jurisprudence_compounding',
    title: 'Jurisprudential Philosophy of Compounding & Regularization Envelopes',
    category: 'legal',
    categoryLabel: 'Statutory Jurisprudence',
    badge: 'Section 32 UP Act 1973',
    icon: Scale,
    abstract: 'The legal demarcation between minor tolerable construction variances and non-compoundable public hazards.',
    engineeringRationale: {
      governingConcept: 'Substantive Public Interest vs Economic Waste Avoidance',
      physicalMechanism: 'The law recognizes that on-site construction inherently encounters minor dimensional execution tolerances (e.g. slight column shifting, shuttering variations, or architectural boundary alignments). Demolishing a structurally sound building for an inadvertent 0.2m setback variance causes disproportionate private economic waste without delivering any measurable public benefit. However, the legal doctrine established by the Supreme Court of India strictly forbids financial compounding if the deviation infringes upon public safety, rights of way, environmental buffers, or light/air rights of neighbors.',
      statutoryThreshold: 'Section 32 of UP Urban Planning & Development Act, 1973: Compounding is permissible strictly up to 10% on front setbacks, 15% on rear/side setbacks, and 10% on ground coverage—provided no encroachment occurs on public road ROW, fire driveway envelopes, or green belts. Penalties (Shaman Shulk) are pegged to DM Circle Rates.',
      consequencesOfDeficiency: 'Allowing non-compoundable violations to be regularized via fees would privatize public rights-of-way, choke emergency fire paths, and erode the integrity of master-planned urban infrastructure.'
    },
    literatureCitations: [
      {
        title: 'Friends Colony Development Committee v. State of Orissa (2004) 8 SCC 733',
        authority: 'Supreme Court of India',
        clauseOrStandard: 'Judicial Precedent on Compounding Scope',
        keyTakeaway: 'Only minor and inadvertent deviations may be compounded; intentional structural over-coverage or setback destruction cannot be regularized for a price.'
      },
      {
        title: 'Esha Ekta Apartments Co-operative Housing Society v. Municipal Corp of Mumbai (2012)',
        authority: 'Supreme Court of India',
        clauseOrStandard: 'Public Safety Doctrine',
        keyTakeaway: 'Courts and municipal bodies have no statutory power to regularize construction that flagrantly exceeds sanctioned FAR or violates fire safety norms.'
      }
    ],
    caseStudyOrContext: 'The demolition of the Supertech Twin Towers in Noida (2022) under orders of the Supreme Court of India established that violating mandatory fire setbacks (16m required between towers vs 9m provided) is fundamentally non-compoundable irrespective of invested capital.'
  }
];

export const StatutoryRationaleGuide: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(RATIONALE_TOPICS[0].id);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({
    [RATIONALE_TOPICS[0].id]: true
  });

  const filteredTopics = RATIONALE_TOPICS.filter((t) => {
    if (activeCategoryFilter === 'all') return true;
    return t.category === activeCategoryFilter;
  });

  const activeTopic = RATIONALE_TOPICS.find((t) => t.id === selectedTopicId) || RATIONALE_TOPICS[0];

  const toggleCitation = (id: string) => {
    setExpandedCitations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Header Banner */}
      <div className="apple-card p-6 sm:p-8 bg-gradient-to-b from-white to-slate-50/50 dark:from-[#161617] dark:to-[#111112]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Statutory Architecture & Applied Physics</span>
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                NBC 2016 • IRC • NFPA • Supreme Court Precedents
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Planning Rationale & Architectural Physics
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every numeric constraint in the Uttar Pradesh Byelaws is anchored in verifiable physical, environmental, and transportation engineering realities. Explore the fundamental mechanisms governing setbacks, road-width FAR ceilings, ground coverage limits, and compounding jurisprudence.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start lg:self-auto">
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-right">
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                7 Major Domains
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Literature-Grounded Explanations
              </div>
            </div>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Rationale Modules' },
            { id: 'geometry', label: 'Spatial Physics & Sun' },
            { id: 'environment', label: 'Microclimate & Hydrology' },
            { id: 'safety', label: 'Fire & Seismic Safety' },
            { id: 'transport', label: 'Urban Mobility & FAR' },
            { id: 'legal', label: 'Compounding Jurisprudence' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategoryFilter === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Split: Topic Navigator + Deep-Dive Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Topic Index (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1">
            Governing Physics & Legal Modules
          </div>

          <div className="space-y-2">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;
              const isSelected = topic.id === selectedTopicId;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-[#1c1c1e] border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-white/70 dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] hover:bg-white dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                          {topic.categoryLabel}
                        </span>
                        <span className="text-[9px] font-mono text-slate-600 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded dark:text-slate-400">
                          {topic.badge}
                        </span>
                      </div>
                      <span
                        className={`mt-0.5 line-clamp-2 block text-xs font-bold leading-snug sm:text-sm ${
                          isSelected
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {topic.title}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {topic.abstract}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep-Dive Literature & Engineering Analysis (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Topic Header Card */}
          <div className="apple-card p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20">
                <activeTopic.icon className="w-3.5 h-3.5" />
                <span>{activeTopic.categoryLabel} • {activeTopic.badge}</span>
              </div>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                Statutory Scientific Foundation
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {activeTopic.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                {activeTopic.abstract}
              </p>
            </div>

            {/* Structured Engineering Mechanics Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider flex items-center gap-1.5 dark:text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                  <span>Governing Physical Concept</span>
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {activeTopic.engineeringRationale.governingConcept}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                  {activeTopic.engineeringRationale.physicalMechanism}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider flex items-center gap-1.5 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                  <span>Statutory Code Translation</span>
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Prescribed Regulatory Threshold
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                  {activeTopic.engineeringRationale.statutoryThreshold}
                </p>
              </div>
            </div>

            {/* Failure Mode Warning Callout */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1 text-amber-950 dark:text-amber-200">
              <div className="font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0" />
                <span>Urban & Structural Consequences of Non-Compliance:</span>
              </div>
              <p className="leading-relaxed pl-6">
                {activeTopic.engineeringRationale.consequencesOfDeficiency}
              </p>
            </div>
          </div>

          {/* Published Literature & Standards Section */}
          <div className="apple-card p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                <span>Authoritative Standards & Engineering Literature</span>
              </h4>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                {activeTopic.literatureCitations.length} Referenced Standards
              </span>
            </div>

            <div className="space-y-3">
              {activeTopic.literatureCitations.map((cit, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {cit.title}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full self-start sm:self-auto">
                      {cit.authority}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    {cit.clauseOrStandard}
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                    <strong className="text-slate-900 dark:text-white">Authoritative Determination: </strong>
                    {cit.keyTakeaway}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Real-World Context / Historical Case Study */}
          <div className="apple-card p-6 sm:p-7 space-y-2.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Real-World Context in Uttar Pradesh</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {activeTopic.caseStudyOrContext}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
