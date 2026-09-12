/**
 * Chapter 13 — Environmental Sustainability.
 *
 * Seven pages, nine tables, and the first chapter since 3 whose rules the engine was
 * already applying — badly. Two findings have quoted "Chapter 13.1" and "Chapter 13.2"
 * since before the gazette arrived, and both were reconstructions. One of them requires
 * the wrong system on the wrong trigger (B-035); the other misses the boundary the
 * gazette actually draws (B-036). A third obligation — the one that stops a development
 * permission being issued at all — was not modelled (B-037).
 *
 * The chapter states its rules in two registers, and they have to be read together:
 *
 *   - **Prose thresholds**, keyed on plot area or use: rainwater harvesting at 300 m²,
 *     solar photovoltaics at 500 m², solar water heating on six named building types,
 *     dustbins, tree counts, a 10,000 litre/day recycling trigger.
 *   - **Seven tables** of "Environmental Conditions required for buildings", each keyed
 *     on **built-up area** in four categories from 5,000 m² up. These are not a summary
 *     of the prose: they add obligations the prose never mentions, and they are the only
 *     place the Environment Clearance appears.
 *
 * Where the two registers overlap they do not always agree, and where the categories
 * overlap each other the gazette leaves the boundary to the reader (V-043). Chapter 3
 * also states tree plantation a second time, on a different base (V-044).
 */

import type { OccupancyGroup, OccupancyId } from './occupancy';

// ---------------------------------------------------------------------------------
// 13.1 Water conservation
// ---------------------------------------------------------------------------------

/**
 * Clause 13.1.2, Requirements of Building Plan: "In case of no collective recharge
 * network, roof top rainwater harvesting system in plots of all uses of **300 square
 * meters and more area** (including group housing) except waterlogged areas."
 *
 * Inclusive. The engine applied `plotArea > 300` and so excused a plot standing at
 * exactly 300 m² (B-036).
 */
export const RWH_PLOT_AREA_SQM = 300;

/**
 * Clause 13.1.2(f), the layout-plan limb: "for plots of areas from 100-300 square meters,
 * it shall not be mandatory to establish rainwater harvesting system in individual
 * buildings **if** the rainwater from group of buildings flows into the network of the
 * collective recharge of the scheme. However, in relation to buildings constructed on
 * plots of area more than 300 square meters, then it shall be mandatory for the building
 * owner to install rainwater harvesting system himself."
 *
 * So the 100–300 m² exemption is conditional on a network existing, and above 300 m² the
 * network does not excuse the owner at all.
 */
export const RWH_COLLECTIVE_EXEMPTION_BAND_SQM = { from: 100, to: 300 } as const;

/** Clause 13.1.2, Category-A: "recharge bores (minimum one per 5000 sqm of built-up area)". */
export const RECHARGE_BORE_PER_BUILT_UP_SQM = 5000;

/**
 * Clause 13.1.2(b): "In the layout plans of schemes having an area of more than 10 acres
 * (>4 hectares), reservoir(s) shall be constructed … a minimum 01 percent of total scheme
 * area … the maximum depth of the reservoir should be kept at 02 meters."
 *
 * The two figures in that parenthesis are not the same figure: 10 acres is 4.047 ha, so a
 * scheme of 4.02 ha is over the metric limb and under the imperial one. The hectare
 * figure is the stricter and is the one held here (V-045).
 */
export const LAYOUT_RESERVOIR_TRIGGER_HA = 4;
export const LAYOUT_RESERVOIR_MIN_SHARE = 0.01;
export const LAYOUT_RESERVOIR_MAX_DEPTH_M = 2;
/** Clause 13.1.2(c): "Concrete construction in parks should not be more than 5 percent". */
export const PARK_CONCRETE_MAX_SHARE = 0.05;

// ---------------------------------------------------------------------------------
// 13.2 Energy conservation
// ---------------------------------------------------------------------------------

/**
 * Clause 13.2: ECBC applies to "all public buildings or building complexes with a
 * connected load of 100 kW or greater or having a contract demand of 120 KV or greater
 * and intended to be used for commercial purpose".
 *
 * "120 KV" is a voltage, not a demand; ECBC's own trigger is 120 kVA, and kVA is the only
 * reading under which the sentence means anything. Carried as printed and flagged, not
 * silently corrected (V-045). Neither figure is visible to this app: nothing in the
 * project model describes an electrical load.
 */
export const ECBC_CONNECTED_LOAD_KW = 100;
export const ECBC_CONTRACT_DEMAND_KVA = 120;

/**
 * Clause 13.2.3.1: "All plots having size **500 sqm and above** shall install solar
 * photovoltaic power generation system. This should also be encouraged for plots smaller
 * than 500 sqm."
 *
 * Inclusive, and it is **photovoltaics** — generation, not hot water. The engine read
 * this threshold and required solar *water heating* against it (B-035).
 */
export const SOLAR_PV_PLOT_AREA_SQM = 500;

/**
 * Clause 13.2.3: "at least 25-50 percent of roof area **may** be utilized for installation
 * of solar water heater and SPV system in new buildings." Permissive, and it carries no
 * plot-size qualifier — the reference shelf stated it as a mandatory 25% for buildings
 * over 5,000 m², which is two inventions in one sentence.
 */
export const SOLAR_ROOF_SHARE_SUGGESTED = { from: 0.25, to: 0.5 } as const;

/**
 * Clause 13.2.3.2: "No new building in the following categories **in which there is a
 * system of installation for supplying hot water** shall be built unless the system of
 * the installation is also having an auxiliary solar assisted water heating system."
 *
 * Six categories, no plot-area trigger and no built-up-area trigger. Four of them map
 * onto an occupancy this engine knows; the other two — barracks, and hostels of more than
 * 100 students — have no occupancy, and are named in SOLAR_WATER_HEATING_UNMAPPED so the
 * gap is visible rather than absent.
 */
export const SOLAR_WATER_HEATING_CATEGORIES: Readonly<Partial<Record<OccupancyId, string>>> = {
  com_hotel: 'Clause 13.2.3.2(a) — "hotels, lodges, guest houses, service apartments"',
  inst_health: 'Clause 13.2.3.2(b) — "institutional buildings (hospitals and nursing home)"',
  inst_education: 'Clause 13.2.3.2(c) — "schools, colleges, universities, technical institutions, training centres"',
  inst_assembly: 'Clause 13.2.3.2(d) — "assembly buildings (auditorium, community halls, wedding/banquet halls, etc)"',
};

export const SOLAR_WATER_HEATING_UNMAPPED: readonly string[] = [
  'Clause 13.2.3.2(e) — barracks of armed forces, paramilitary forces and police forces.',
  'Clause 13.2.3.2(f) — hostels for schools, colleges and training centres with more than 100 students.',
];

/**
 * Clause 13.2.4, Category-B: "As per the provisions of the Ministry of New and Renewable
 * energy solar water heater of minimum capacity 10 litres/4 persons (2.5 litres per
 * capita) shall be installed."
 *
 * This is the only capacity figure anywhere in the chapter. The engine printed "at least
 * 100 litres/day per 100 m² of built-up area", which is in no clause of the gazette.
 */
export const SOLAR_WATER_HEATER_LITRES_PER_CAPITA = 2.5;

// ---------------------------------------------------------------------------------
// 13.4 Solid waste, 13.5 wastewater
// ---------------------------------------------------------------------------------

/**
 * Clause 13.4: "All buildings shall provide facilities for solid waste management with
 * segregation of dry and wet waste at source. For waste management in residential
 * buildings (including group housing) and all non-residential buildings with an area of
 * more than 500 square meters, two types of dustbins (biodegradable and
 * non-biodegradable) shall be provided on the ground floor near the entrance of the plot".
 *
 * The 500 m² qualifier attaches to "all non-residential buildings" — it sits inside that
 * noun phrase and after its own "all". Residential is named without a size at all, which
 * is also the stricter reading, so a house of any size carries the two bins.
 */
export const SOLID_WASTE_NON_RESIDENTIAL_SQM = 500;

/**
 * Clause 13.5: "A wastewater recycling facility shall be installed wherever the minimum
 * estimated water discharge from the building(s) on a plot exceeds 10,000 liters per day."
 *
 * The quantity is an estimate the applicant submits with the services plan; the byelaws
 * give no per-capita or per-area figure to derive it from, and the project model holds
 * neither an occupant load nor a water demand. Surfaced, not computed (V-042).
 */
export const WASTEWATER_RECYCLING_LPD = 10_000;

// ---------------------------------------------------------------------------------
// The seven "Environmental Conditions" tables
// ---------------------------------------------------------------------------------

export type EnvironmentalCategory = 'A' | 'B' | 'C' | 'D';

export interface CategoryBand {
  readonly category: EnvironmentalCategory;
  /** Lower bound of built-up area, m². Inclusive unless `fromExclusive`. */
  readonly fromSqm: number;
  /** Category-D alone is printed with a ">", so 150,000 m² exactly is Category-C. */
  readonly fromExclusive?: boolean;
  /** Inclusive upper bound as printed; Infinity for D. */
  readonly toSqm: number;
  readonly printed: string;
}

/**
 * The bands as the gazette prints them, including the overlaps. 20,000 m² is inside both
 * Category-A and Category-B; 50,000 m² is inside both B and C. `classifyEnvironmental`
 * resolves a project on a boundary into the higher band, which is the stricter one
 * (V-043).
 */
export const ENVIRONMENTAL_CATEGORY_BANDS: readonly CategoryBand[] = [
  { category: 'A', fromSqm: 5000, toSqm: 20000, printed: 'Category-A (5000-20000 sqm)' },
  { category: 'B', fromSqm: 20000, toSqm: 50000, printed: 'Category-B (20000 -50000 sqm)' },
  { category: 'C', fromSqm: 50000, toSqm: 150000, printed: 'Category-C (50000-150000 sqm)' },
  {
    category: 'D', fromSqm: 150000, fromExclusive: true, toSqm: Infinity,
    printed: 'Category-D (>150000 sqm or Site Area >50 Ha)',
  },
];

/**
 * Category-D's second limb: "or Site Area >50 Ha".
 *
 * It is kept apart from the built-up-area bands deliberately. Category-D appears in one
 * table only — the Environment Impact Assessment one — and its row is about "Townships and
 * Area Development projects". Every other table is keyed on built-up area alone, so a 60 ha
 * site carrying 3,000 m² of building needs the clearance and does not thereby acquire
 * Category-C's recharge bores.
 */
export const CATEGORY_D_SITE_AREA_HA = 50;

/** Clause 13.8's Category-D site-area limb, which turns on the land and not the building. */
export function isTownshipBySiteArea(plotAreaSqm: number): boolean {
  return Math.max(0, plotAreaSqm) / 10_000 > CATEGORY_D_SITE_AREA_HA;
}

const CATEGORY_ORDER: readonly EnvironmentalCategory[] = ['A', 'B', 'C', 'D'];

export type ConditionTopic =
  | 'water' | 'energy' | 'drainage' | 'waste' | 'air' | 'green' | 'clearance' | 'management';

export interface EnvironmentalCondition {
  readonly topic: ConditionTopic;
  readonly clause: string;
  /** The lowest category whose row carries this requirement. It applies from there up. */
  readonly from: EnvironmentalCategory;
  readonly requirement: string;
}

/**
 * Every requirement in the seven tables, flattened, each recorded against the category its
 * row starts at.
 *
 * Reading them off the page needs the merges. In each table the requirement cell is
 * vertically merged across the Category-A, B and C rows — the B and C cells are drawn
 * empty — so one sentence governs all three, exactly as Chapter 16's column B did (V-004).
 * A second row repeating "Category-C", sometimes headed "Additional Conditions", carries
 * what C adds.
 *
 * One requirement had to be recovered from the geometry rather than the text. The DG-set
 * exhaust bullet is printed on page 132, after the 13.6 table has ended on page 131, and
 * reads in the flattened text as an orphan paragraph. Its cell spans x 229.6–523.2 with an
 * empty label cell at 72.2–229.6 — the exact column boundaries of the table above — so it
 * is that table's requirement cell continuing across the page break, and it belongs to the
 * A–C merge like everything else in it (V-045).
 */
export const ENVIRONMENTAL_CONDITIONS: readonly EnvironmentalCondition[] = [
  // 13.1 Water conservation
  {
    topic: 'water', clause: 'Clause 13.1.2', from: 'A',
    requirement: 'A rainwater harvesting plan with recharge bores, minimum one per 5,000 m² of built-up area. Harvested rainwater stored in a separate tank and pipeline for household reuse, kept apart from the potable municipal supply; the excess linked to the tube well bore through a filter.',
  },
  {
    topic: 'water', clause: 'Clause 13.1.2', from: 'A',
    requirement: 'Unpaved area at least 20% of the recreational open spaces.',
  },
  {
    topic: 'water', clause: 'Clause 13.1.2 (additional conditions)', from: 'C',
    requirement: 'No ground water withdrawal without the competent authority\'s approval; potable water in construction minimised; low-flow fixtures and sensors; grey and black water separated by a dual plumbing system.',
  },
  // 13.2 Energy conservation
  {
    topic: 'energy', clause: 'Clause 13.2.4', from: 'A',
    requirement: 'LED or solar lights in all common areas.',
  },
  {
    topic: 'energy', clause: 'Clause 13.2.4', from: 'B',
    requirement: 'At least 1% of the connected applied load generated from a renewable source — photovoltaic cells, windmills or a hybrid.',
  },
  {
    topic: 'energy', clause: 'Clause 13.2.4', from: 'B',
    requirement: 'A solar water heater of minimum capacity 10 litres per 4 persons (2.5 litres per capita), per the Ministry of New and Renewable Energy.',
  },
  {
    topic: 'energy', clause: 'Clause 13.2.4', from: 'B',
    requirement: 'Fly ash used as a building material, per the Fly Ash Notification of September 1999 as amended.',
  },
  {
    topic: 'energy', clause: 'Clause 13.2.4', from: 'C',
    requirement: 'Passive solar design — orientation, landscaping, envelope, fenestration, daylighting and thermal mass integrated with the mechanical and electrical systems — and mandatory compliance with ECBC 2007 of the Bureau of Energy Efficiency.',
  },
  // 13.3 Natural drainage
  {
    topic: 'drainage', clause: 'Clause 13.3', from: 'A',
    requirement: 'The inlet and outlet of the natural drain system maintained with a channel of adequate size for unrestricted flow.',
  },
  // 13.4 Solid waste
  {
    topic: 'waste', clause: 'Clause 13.4', from: 'A',
    requirement: 'Separate wet and dry bins at ground level for segregation at source.',
  },
  {
    topic: 'waste', clause: 'Clause 13.4 (additional conditions)', from: 'C',
    requirement: 'All non-biodegradable waste handed to authorised recyclers under a written tie-up; an organic waste composter or vermiculture pit of at least 0.3 kg per tenement per day, taking STP sludge to manure.',
  },
  // 13.6 Air quality and noise
  {
    topic: 'air', clause: 'Clause 13.6', from: 'A',
    requirement: 'Dust, smoke and debris measures during construction — screens and barricading on site, plastic or tarpaulin covers on every truck bringing sand and material in.',
  },
  {
    topic: 'air', clause: 'Clause 13.6', from: 'A',
    requirement: 'A DG set exhaust pipe at least 10 m from the building; where it is closer, the pipe taken 3 m above the building.',
  },
  // 13.7 Green cover
  {
    topic: 'green', clause: 'Clause 13.7', from: 'A',
    requirement: 'At least one tree for every 80 m² of land, planted and maintained, existing trees counted, native and shade-giving species preferred.',
  },
  {
    topic: 'green', clause: 'Clause 13.7', from: 'A',
    requirement: 'Compensatory plantation at 1:3 — three trees for every one cut — with continued maintenance.',
  },
  // 13.8 Environment Impact Assessment
  {
    topic: 'clearance', clause: 'Clause 13.8', from: 'B',
    requirement: 'No development permission until Environment Clearance is obtained from SEIAA under the EIA Notification 2006 as amended. A phased project needs the clearance before the first phase is approved.',
  },
  // 13.9 Environment Management Plan
  {
    topic: 'management', clause: 'Clause 13.9', from: 'C',
    requirement: 'The environmental infrastructure — STP, landscaping, rainwater harvesting, power backup, monitoring, solid waste management, solar and energy conservation — kept operational through an Environment Monitoring Committee with defined functions and responsibility.',
  },
];

/** Clause 13.7's tree rate for a Category-A-and-above building: one per 80 m² of land. */
export const CATEGORY_TREE_PER_SQM = 80;

/**
 * Which category a project falls in, or null below 5,000 m² of built-up area where the
 * tables say nothing at all.
 *
 * Two readings are settled here, both by the gazette's own words rather than by
 * preference:
 *
 *   - **Boundaries.** The printed bands overlap at 20,000 and 50,000 m². A project on a
 *     boundary is placed in the higher band, which carries more obligations — standing
 *     rule 4.
 *   - **Category-D.** D appears in exactly one of the seven tables, the EIA one. Read
 *     literally, a 200,000 m² project owes no recharge bore and no wet/dry bin while a
 *     6,000 m² project owes both. Clause 13.9 settles it in its own preamble: "For all
 *     buildings **above 50,000 sqm** built up area", against a table whose only row is
 *     printed "50000-150000 sqm". The C row means "above 50,000", so D inherits
 *     everything C carries (V-043).
 */
export function classifyEnvironmental(builtUpAreaSqm: number): EnvironmentalCategory | null {
  const builtUp = Math.max(0, builtUpAreaSqm);
  let found: EnvironmentalCategory | null = null;
  for (const band of ENVIRONMENTAL_CATEGORY_BANDS) {
    const overLower = band.fromExclusive ? builtUp > band.fromSqm : builtUp >= band.fromSqm;
    // Highest band wins on a boundary: the loop runs A→D and keeps overwriting.
    if (overLower && builtUp <= band.toSqm) found = band.category;
  }
  return found;
}

/** The conditions that bind a project in this category — its own row and every row below. */
export function conditionsFor(
  category: EnvironmentalCategory | null,
): readonly EnvironmentalCondition[] {
  if (!category) return [];
  const rank = CATEGORY_ORDER.indexOf(category);
  return ENVIRONMENTAL_CONDITIONS.filter((c) => CATEGORY_ORDER.indexOf(c.from) <= rank);
}

export function categoryLabel(category: EnvironmentalCategory | null): string {
  if (!category) return 'Below Category-A (under 5,000 m² built-up)';
  return ENVIRONMENTAL_CATEGORY_BANDS.find((b) => b.category === category)?.printed ?? category;
}

// ---------------------------------------------------------------------------------
// 13.7 Trees
// ---------------------------------------------------------------------------------

export type TreeBasis =
  | 'residential_ladder'
  | 'group_housing'
  | 'industrial'
  | 'commercial'
  | 'institutional'
  | 'category_condition';

export interface TreeRequirement {
  readonly trees: number;
  readonly basis: TreeBasis;
  readonly rate: string;
  readonly clause: string;
  readonly working: string;
  readonly caveats: readonly string[];
}

/**
 * Clause 13.7's landscape plan, and the one rule in this chapter that produces a number
 * for every project the app can describe.
 *
 *   (a) residential — 1 tree under 200 m²; 2 from 200 to 300; 4 from 301 to 500; above
 *       500, one per 100 m² "or part thereof"; 50 per hectare in a group housing scheme
 *   (b) industrial — one per 80 m² of plot
 *   (c) commercial — one per 100 m²
 *   (d) institutional, community facilities, playgrounds, open areas and parks — greenery
 *       on at least 20% of the total area, trees at 125 per hectare
 *
 * Two things the ladder does and the arithmetic has to survive. Bands (ii) and (iii) run
 * "200 to 300" and "301 to 500", so a plot of 300.5 m² is in neither; the higher band
 * applies, which is the stricter. And the Category-A condition — one tree per 80 m² of
 * land — is a *different* rate on the same plot, so a building over 5,000 m² of built-up
 * area takes whichever of the two is larger (V-044).
 */
export function treesRequired(input: {
  readonly plotAreaSqm: number;
  readonly occupancyId: OccupancyId;
  readonly occupancyGroup: OccupancyGroup;
  readonly builtUpAreaSqm: number;
}): TreeRequirement {
  const area = Math.max(0, input.plotAreaSqm);
  const caveats: string[] = [];

  let trees = 0;
  let basis: TreeBasis = 'residential_ladder';
  let rate = '';
  let clause = 'Clause 13.7';
  let working = '';

  if (input.occupancyId === 'res_group_housing') {
    basis = 'group_housing';
    rate = '50 trees per hectare of scheme area';
    clause = 'Clause 13.7(a)(v)';
    trees = Math.ceil((area / 10_000) * 50);
    working = `${area} m² ÷ 10,000 × 50 = ${trees} trees`;
  } else if (input.occupancyGroup === 'Residential') {
    basis = 'residential_ladder';
    clause = 'Clause 13.7(a)';
    if (area < 200) {
      trees = 1;
      rate = '1 tree on a plot under 200 m²';
      working = `${area} m² is under 200 m² → 1 tree`;
    } else if (area <= 300) {
      trees = 2;
      rate = '2 trees on a plot of 200 to 300 m²';
      working = `${area} m² is in the 200–300 m² band → 2 trees`;
    } else if (area <= 500) {
      trees = 4;
      rate = '4 trees on a plot of 301 to 500 m²';
      working = `${area} m² is in the 301–500 m² band → 4 trees`;
      if (area < 301) {
        caveats.push(
          'Clause 13.7(a) bands run "200 to 300 square meters" and "301 to 500 square meters", '
          + `so a plot of ${area} m² falls in neither. The higher band is applied, which is the `
          + 'stricter reading of a gap the gazette did not intend to leave (V-044).',
        );
      }
    } else {
      trees = Math.ceil(area / 100);
      rate = '1 tree per 100 m² or part thereof, above 500 m²';
      working = `⌈${area} m² ÷ 100⌉ = ${trees} trees`;
    }
  } else if (input.occupancyGroup === 'Industrial') {
    basis = 'industrial';
    rate = '1 tree per 80 m² of plot';
    clause = 'Clause 13.7(b)';
    trees = Math.ceil(area / 80);
    working = `⌈${area} m² ÷ 80⌉ = ${trees} trees`;
  } else if (input.occupancyGroup === 'Institutional') {
    basis = 'institutional';
    rate = '125 trees per hectare, with greenery on at least 20% of the total area';
    clause = 'Clause 13.7(d)';
    trees = Math.ceil((area / 10_000) * 125);
    working = `${area} m² ÷ 10,000 × 125 = ${trees} trees`;
    caveats.push(
      'Clause 13.7(d) reads "greenery on a minimum of 20% of the total area where trees shall '
      + 'be planted at the rate of 125 trees per hectare". The rate can be read against the '
      + 'total area or against the 20% of it that is greenery — a five-fold difference. The '
      + 'total area is taken, which is the stricter reading, and it is also the rate Chapter 3 '
      + 'prints for the same facilities.',
    );
  } else {
    // Commercial, and Workplace by analogy.
    basis = 'commercial';
    rate = '1 tree per 100 m² of plot';
    clause = 'Clause 13.7(c)';
    trees = Math.ceil(area / 100);
    working = `⌈${area} m² ÷ 100⌉ = ${trees} trees`;
    if (input.occupancyGroup === 'Workplace') {
      caveats.push(
        'Clause 13.7 names residential, industrial, commercial and institutional plots. An '
        + 'office building is none of those four in the byelaws\' own taxonomy, so the '
        + 'commercial rate is applied by analogy — an inference, not a reading.',
      );
    }
  }

  // The Category-A condition is a second rate on the same land, and it can be the larger.
  const category = classifyEnvironmental(input.builtUpAreaSqm);
  if (category) {
    const byCondition = Math.ceil(area / CATEGORY_TREE_PER_SQM);
    if (byCondition > trees) {
      caveats.push(
        `Clause 13.7's ${rate} gives ${trees}. The Category-A environmental condition — one `
        + `tree for every ${CATEGORY_TREE_PER_SQM} m² of land — gives ${byCondition} on the same `
        + 'plot, and binds any building of 5,000 m² built-up area or more. The larger governs.',
      );
      trees = byCondition;
      basis = 'category_condition';
      rate = `1 tree per ${CATEGORY_TREE_PER_SQM} m² of land`;
      clause = 'Clause 13.7 (environmental conditions, Category-A)';
      working = `⌈${area} m² ÷ ${CATEGORY_TREE_PER_SQM}⌉ = ${trees} trees`;
    }
  }

  caveats.push(
    'Clause 13.7(ii) reduces the requirement by the number of grown existing trees conserved '
    + 'and unaffected by the development, and 13.7(iii) requires a refundable tree plantation '
    + 'deposit at rates the Authority sets, released after five years only if the trees are '
    + 'grown and maintained.',
  );

  return { trees, basis, rate, clause, working, caveats };
}

// ---------------------------------------------------------------------------------
// The assessment
// ---------------------------------------------------------------------------------

export interface SustainabilityInput {
  readonly plotAreaSqm: number;
  readonly builtUpAreaSqm: number;
  readonly occupancyId: OccupancyId;
  readonly occupancyGroup: OccupancyGroup;
  readonly occupancyLabel: string;
  readonly hasRainwaterHarvesting: boolean;
  readonly hasSolarPv: boolean;
  readonly hasSolarWaterHeating: boolean;
  /**
   * Clause 13.1.2(f)'s collective recharge network. Undefined where the app cannot see
   * one — it is a fact about the layout the plot sits in, not about the plot.
   */
  readonly hasCollectiveRechargeNetwork?: boolean;
  /** Clause 13.1.2 exempts waterlogged areas from recharge, not from roof collection. */
  readonly isWaterloggedArea?: boolean;
  /** Clause 13.2.3.2 binds only a building that has a hot water installation. */
  readonly hasHotWaterSystem?: boolean;
}

export interface Obligation {
  readonly required: boolean;
  /**
   * Whether the project provides it — absent where the project model has no field for it.
   * Undefined is not "no": it means the app cannot check, and a finding that renders it
   * must say so rather than reporting a breach.
   */
  readonly provided?: boolean;
  readonly because: string;
  readonly clause: string;
  readonly caveats: readonly string[];
}

export interface SustainabilityAssessment {
  readonly category: EnvironmentalCategory | null;
  readonly categoryLabel: string;
  readonly conditions: readonly EnvironmentalCondition[];
  /** Clause 13.1.2 Category-A: one recharge bore per 5,000 m² of built-up area. */
  readonly rechargeBores: number;
  readonly rainwater: Obligation;
  readonly solarPv: Obligation;
  readonly solarWaterHeating: Obligation;
  readonly solidWasteBins: Obligation;
  readonly trees: TreeRequirement;
  readonly environmentClearance: Obligation;
  /** Triggers Chapter 13 states that nothing in the project model can evaluate. */
  readonly unresolved: readonly string[];
}

const round1 = (n: number): number => Number(n.toFixed(1));

export function assessSustainability(input: SustainabilityInput): SustainabilityAssessment {
  const plotArea = Math.max(0, input.plotAreaSqm);
  const builtUp = Math.max(0, input.builtUpAreaSqm);
  const category = classifyEnvironmental(builtUp);
  const townshipSite = isTownshipBySiteArea(plotArea);

  // ---- 13.1.2 rainwater harvesting -------------------------------------------------
  const rwhCaveats: string[] = [];
  const rwhRequired = plotArea >= RWH_PLOT_AREA_SQM;
  let rwhBecause = `Clause 13.1.2 requires roof-top rainwater harvesting on plots of all uses of `
    + `${RWH_PLOT_AREA_SQM} m² and more, group housing included. This plot is ${plotArea} m².`;

  if (rwhRequired) {
    if (input.isWaterloggedArea) {
      rwhCaveats.push(
        'The clause excepts waterlogged areas, and adds that a ground water recharging system '
        + '"should not be adopted in areas with water logging problem, but arrangements can be '
        + 'made to collect rainwater received from the roofs of buildings". So on a waterlogged '
        + 'site the obligation is roof collection without recharge, not nothing.',
      );
    } else if (input.isWaterloggedArea === undefined) {
      rwhCaveats.push(
        'The clause excepts waterlogged areas, where recharge is barred and roof collection '
        + 'takes its place. The project model does not record whether this site is waterlogged.',
      );
    }
    if (plotArea > RWH_PLOT_AREA_SQM) {
      rwhCaveats.push(
        'Above 300 m² a collective recharge network does not discharge the owner: Clause '
        + '13.1.2(f) makes it "mandatory for the building owner to install rainwater harvesting '
        + 'system himself".',
      );
    }
  } else if (
    plotArea >= RWH_COLLECTIVE_EXEMPTION_BAND_SQM.from
    && input.hasCollectiveRechargeNetwork !== true
  ) {
    rwhBecause += ' Clause 13.1.2(f) lifts the requirement in the 100–300 m² band only where the '
      + 'rainwater from a group of buildings flows into the scheme\'s collective recharge network. '
      + 'Whether one exists is a fact about the layout, and the project model does not hold it.';
  }

  // ---- 13.2.3.1 solar photovoltaics -------------------------------------------------
  const pvRequired = plotArea >= SOLAR_PV_PLOT_AREA_SQM;

  // ---- 13.2.3.2 solar water heating -------------------------------------------------
  const swhCategory = SOLAR_WATER_HEATING_CATEGORIES[input.occupancyId];
  const swhCaveats: string[] = [];
  const swhRequired = Boolean(swhCategory) && input.hasHotWaterSystem !== false;
  if (swhCategory) {
    if (input.hasHotWaterSystem === undefined) {
      swhCaveats.push(
        'Clause 13.2.3.2 binds a building of these categories "in which there is a system of '
        + 'installation for supplying hot water". The project model does not record whether one '
        + 'is proposed; a building of this use is assumed to have one, which is the stricter '
        + 'reading.',
      );
    }
  } else if (input.occupancyId === 'mixed_use') {
    swhCaveats.push(
      'A mixed-use building can contain a hotel, a school or a banquet hall, each of which '
      + 'Clause 13.2.3.2 names. The project model records the mix as one occupancy, so this '
      + 'cannot be decided from the description.',
    );
  }

  // ---- 13.4 dustbins -----------------------------------------------------------------
  // Clause 13.4's 500 m² qualifier attaches to non-residential buildings. Mixed use puts
  // dwellings above the commercial floors (Clause 8.1.3), so it is within the residential
  // limb, which carries no size threshold at all — the stricter reading of a building the
  // taxonomy files under Commercial.
  const residential = input.occupancyGroup === 'Residential' || input.occupancyId === 'mixed_use';
  const binsRequired = residential || builtUp > SOLID_WASTE_NON_RESIDENTIAL_SQM;

  // ---- 13.8 environment clearance ----------------------------------------------------
  const ecRequired = category === 'B' || category === 'C' || category === 'D' || townshipSite;
  const ecLimb = townshipSite && (category === null || category === 'A')
    ? `a site area of ${round1(plotArea / 10_000)} ha, over Category-D's `
      + `${CATEGORY_D_SITE_AREA_HA} ha limb`
    : `${builtUp} m² of built-up area — ${categoryLabel(category)}`;

  const unresolved: string[] = [
    `Clause 13.2 applies ECBC to a public or commercial building with a connected load of `
    + `${ECBC_CONNECTED_LOAD_KW} kW or more, or a contract demand of ${ECBC_CONTRACT_DEMAND_KVA} `
    + 'kVA or more (printed "120 KV"). Nothing in the project model describes an electrical load.',
    `Clause 13.5 requires a wastewater recycling facility wherever estimated discharge exceeds `
    + `${WASTEWATER_RECYCLING_LPD.toLocaleString('en-IN')} litres per day. The byelaws give no `
    + 'figure to derive that from and the project model holds no occupant load, so it is the '
    + 'applicant\'s calculation, submitted with the services plan.',
  ];
  if (plotArea / 10_000 > LAYOUT_RESERVOIR_TRIGGER_HA) {
    unresolved.push(
      `Clause 13.1.2(b) applies to layout plans of schemes over ${LAYOUT_RESERVOIR_TRIGGER_HA} ha: `
      + `reservoirs on at least ${LAYOUT_RESERVOIR_MIN_SHARE * 100}% of the scheme area, no deeper `
      + `than ${LAYOUT_RESERVOIR_MAX_DEPTH_M} m, and concrete on no more than `
      + `${PARK_CONCRETE_MAX_SHARE * 100}% of park area. This app assesses a plot, not a layout, so `
      + 'it reports the trigger rather than the compliance.',
    );
  }

  return {
    category,
    categoryLabel: categoryLabel(category),
    conditions: conditionsFor(category),
    rechargeBores: category ? Math.ceil(builtUp / RECHARGE_BORE_PER_BUILT_UP_SQM) : 0,
    rainwater: {
      required: rwhRequired,
      provided: input.hasRainwaterHarvesting,
      because: rwhBecause,
      clause: 'Clause 13.1.2 (Requirements of Building Plan)',
      caveats: rwhCaveats,
    },
    solarPv: {
      required: pvRequired,
      provided: input.hasSolarPv,
      because: pvRequired
        ? `Clause 13.2.3.1: "All plots having size ${SOLAR_PV_PLOT_AREA_SQM} sqm and above shall `
          + `install solar photovoltaic power generation system." This plot is ${plotArea} m².`
        : `Clause 13.2.3.1 binds plots of ${SOLAR_PV_PLOT_AREA_SQM} m² and above; this plot is `
          + `${plotArea} m². The same clause encourages photovoltaics below that size.`,
      clause: 'Clause 13.2.3.1',
      caveats: [],
    },
    solarWaterHeating: {
      required: swhRequired,
      provided: input.hasSolarWaterHeating,
      because: swhCategory
        ? `${input.occupancyLabel} is within ${swhCategory}. Clause 13.2.3.2 sets no plot-size or `
          + 'height threshold at all — the category is the whole trigger.'
        : `Clause 13.2.3.2 names six categories of building, and ${input.occupancyLabel} is not `
          + 'among them. Plot size does not bring a building within it.',
      clause: 'Clause 13.2.3.2',
      caveats: swhCaveats,
    },
    solidWasteBins: {
      required: binsRequired,
      because: residential
        ? 'Clause 13.4 requires the two dustbins in residential buildings, group housing included, '
          + 'without any size qualifier.'
          + (input.occupancyId === 'mixed_use'
            ? ' A mixed-use building carries dwellings above its commercial floors, so it is '
              + 'within that limb rather than the 500 m² one.'
            : '')
        : `Clause 13.4 requires them in non-residential buildings of more than `
          + `${SOLID_WASTE_NON_RESIDENTIAL_SQM} m²; this building is ${builtUp} m².`,
      clause: 'Clause 13.4',
      caveats: [
        'Segregation of dry and wet waste at source is required of all buildings by the clause\'s '
        + 'first sentence, whatever their size or use.',
      ],
    },
    trees: treesRequired({
      plotAreaSqm: plotArea,
      occupancyId: input.occupancyId,
      occupancyGroup: input.occupancyGroup,
      builtUpAreaSqm: builtUp,
    }),
    environmentClearance: {
      required: ecRequired,
      because: ecRequired
        ? `This project has ${ecLimb}. Clause 13.8: "No development permission shall be given to `
          + 'the Building and Construction projects, until getting Environment Clearance from '
          + 'SEIAA."'
        : `Clause 13.8 prints "-" against Category-A and the tables begin at 5,000 m². At `
          + `${builtUp} m² of built-up area no clearance is triggered by this chapter.`,
      clause: 'Clause 13.8',
      caveats: ecRequired
        ? [
          'A phased project needs the clearance before the first phase is approved, not before '
            + 'the phase that crosses the threshold.',
          category === 'D' || townshipSite
            ? 'The Category-D row addresses townships and area development projects; the '
              + 'Category-B row addresses building and construction projects. Both withhold '
              + 'development permission until SEIAA has cleared the project.'
            : 'The threshold is built-up area, which this app takes from the proposed floor area '
              + 'across all floors (V-036).',
        ]
        : [],
    },
    unresolved,
  };
}
