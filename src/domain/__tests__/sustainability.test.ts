import { describe, expect, it } from 'vitest';
import {
  CATEGORY_D_SITE_AREA_HA, ENVIRONMENTAL_CATEGORY_BANDS, ENVIRONMENTAL_CONDITIONS,
  RWH_PLOT_AREA_SQM, SOLAR_PV_PLOT_AREA_SQM, SOLAR_WATER_HEATING_CATEGORIES,
  assessSustainability, classifyEnvironmental, conditionsFor, isTownshipBySiteArea,
  treesRequired,
} from '../sustainability';
import { OCCUPANCIES, OccupancyId, OCCUPANCY_IDS } from '../occupancy';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT, ProjectState } from '../project';

const project = (over: Partial<ProjectState> = {}): ProjectState => ({ ...DEFAULT_PROJECT, ...over });

const assess = (over: {
  plotAreaSqm?: number; builtUpAreaSqm?: number; occupancyId?: OccupancyId;
  hasRainwaterHarvesting?: boolean; hasSolarPv?: boolean; hasSolarWaterHeating?: boolean;
  hasCollectiveRechargeNetwork?: boolean; isWaterloggedArea?: boolean; hasHotWaterSystem?: boolean;
} = {}) => {
  const id = over.occupancyId ?? 'res_single';
  const o = OCCUPANCIES[id];
  return assessSustainability({
    plotAreaSqm: over.plotAreaSqm ?? 320,
    builtUpAreaSqm: over.builtUpAreaSqm ?? 450,
    occupancyId: id,
    occupancyGroup: o.group,
    occupancyLabel: o.label,
    hasRainwaterHarvesting: over.hasRainwaterHarvesting ?? false,
    hasSolarPv: over.hasSolarPv ?? false,
    hasSolarWaterHeating: over.hasSolarWaterHeating ?? false,
    hasCollectiveRechargeNetwork: over.hasCollectiveRechargeNetwork,
    isWaterloggedArea: over.isWaterloggedArea,
    hasHotWaterSystem: over.hasHotWaterSystem,
  });
};

describe('Clause 13.1.2 — rainwater harvesting', () => {
  it('binds at 300 m² exactly, which the engine used to excuse', () => {
    // "plots of all uses of 300 square meters and more area". The engine applied
    // `plotArea > 300` and let a plot standing on the threshold through (B-036).
    expect(assess({ plotAreaSqm: 299.99 }).rainwater.required).toBe(false);
    expect(assess({ plotAreaSqm: RWH_PLOT_AREA_SQM }).rainwater.required).toBe(true);
    expect(assess({ plotAreaSqm: 300.01 }).rainwater.required).toBe(true);
  });

  it('says a collective network does not discharge an owner above 300 m²', () => {
    const a = assess({ plotAreaSqm: 800, hasCollectiveRechargeNetwork: true });
    expect(a.rainwater.required).toBe(true);
    expect(a.rainwater.caveats.join(' ')).toMatch(/mandatory for the building owner/);
  });

  it('names the collective-network condition in the 100–300 m² band', () => {
    expect(assess({ plotAreaSqm: 250 }).rainwater.because).toMatch(/collective recharge network/);
  });

  it('does not treat a waterlogged site as exempt from everything', () => {
    // The clause bars recharge there and substitutes roof collection; it does not lift
    // the obligation.
    const a = assess({ plotAreaSqm: 600, isWaterloggedArea: true });
    expect(a.rainwater.required).toBe(true);
    expect(a.rainwater.caveats.join(' ')).toMatch(/arrangements can be made to collect rainwater/);
  });

  it('flags the unknown rather than assuming dry ground', () => {
    expect(assess({ plotAreaSqm: 600 }).rainwater.caveats.join(' '))
      .toMatch(/does not record whether this site is waterlogged/);
  });
});

describe('Clause 13.2.3 — two solar obligations, two triggers', () => {
  it('requires photovoltaics at 500 m² and above, inclusively', () => {
    expect(assess({ plotAreaSqm: 499.99 }).solarPv.required).toBe(false);
    expect(assess({ plotAreaSqm: SOLAR_PV_PLOT_AREA_SQM }).solarPv.required).toBe(true);
  });

  it('does not require solar water heating on a large house', () => {
    // B-035: the engine read Clause 13.2.3.1's plot-size trigger — which is for
    // photovoltaics — and required solar *water heating* against it. A dwelling is in
    // none of Clause 13.2.3.2's six categories at any plot size.
    const big = assess({ plotAreaSqm: 2000, occupancyId: 'res_single' });
    expect(big.solarPv.required).toBe(true);
    expect(big.solarWaterHeating.required).toBe(false);
  });

  it('requires solar water heating on a small hotel, which has no plot-size trigger', () => {
    const small = assess({ plotAreaSqm: 200, occupancyId: 'com_hotel' });
    expect(small.solarWaterHeating.required).toBe(true);
    expect(small.solarPv.required).toBe(false);
  });

  it('names exactly the four occupancies Clause 13.2.3.2 reaches', () => {
    const caught = OCCUPANCY_IDS.filter((id) => assess({ occupancyId: id }).solarWaterHeating.required);
    expect(caught).toEqual(['com_hotel', 'inst_health', 'inst_education', 'inst_assembly']);
    expect(Object.keys(SOLAR_WATER_HEATING_CATEGORIES).sort()).toEqual([...caught].sort());
  });

  it('lifts the requirement where the building has no hot water system', () => {
    expect(assess({ occupancyId: 'com_hotel', hasHotWaterSystem: false }).solarWaterHeating.required)
      .toBe(false);
    expect(assess({ occupancyId: 'com_hotel' }).solarWaterHeating.caveats.join(' '))
      .toMatch(/stricter reading/);
  });

  it('says a mixed-use building could contain a category it cannot see', () => {
    expect(assess({ occupancyId: 'mixed_use' }).solarWaterHeating.caveats.join(' '))
      .toMatch(/hotel, a school or a banquet hall/);
  });
});

describe('Clause 13.4 — solid waste', () => {
  it('requires the two bins in a house of any size, and in non-residential only above 500 m²', () => {
    expect(assess({ occupancyId: 'res_single', builtUpAreaSqm: 90 }).solidWasteBins.required).toBe(true);
    expect(assess({ occupancyId: 'com_shop', builtUpAreaSqm: 500 }).solidWasteBins.required).toBe(false);
    expect(assess({ occupancyId: 'com_shop', builtUpAreaSqm: 501 }).solidWasteBins.required).toBe(true);
  });

  it('treats mixed use as carrying dwellings', () => {
    const a = assess({ occupancyId: 'mixed_use', builtUpAreaSqm: 300 });
    expect(a.solidWasteBins.required).toBe(true);
    expect(a.solidWasteBins.because).toMatch(/dwellings above its commercial floors/);
  });

  it('states the universal segregation duty whatever the size', () => {
    expect(assess({ occupancyId: 'com_shop', builtUpAreaSqm: 80 }).solidWasteBins.caveats.join(' '))
      .toMatch(/all buildings/);
  });
});

describe('Clause 13.7 — trees', () => {
  const trees = (plotAreaSqm: number, id: OccupancyId = 'res_single', builtUpAreaSqm = 400) =>
    treesRequired({
      plotAreaSqm, occupancyId: id, occupancyGroup: OCCUPANCIES[id].group, builtUpAreaSqm,
    });

  it('walks the residential ladder as printed', () => {
    expect(trees(150).trees).toBe(1);
    expect(trees(200).trees).toBe(2);
    expect(trees(300).trees).toBe(2);
    expect(trees(301).trees).toBe(4);
    expect(trees(500).trees).toBe(4);
    expect(trees(501).trees).toBe(6);   // "or part thereof" — rounded up
    expect(trees(1000).trees).toBe(10);
  });

  it('closes the gap between "200 to 300" and "301 to 500" upward, and says so', () => {
    const t = trees(300.5);
    expect(t.trees).toBe(4);
    expect(t.caveats.join(' ')).toMatch(/falls in neither/);
  });

  it('rates industrial, commercial and institutional plots separately', () => {
    expect(trees(1000, 'ind_general').trees).toBe(13);      // 1 per 80 m²
    expect(trees(1000, 'com_complex').trees).toBe(10);      // 1 per 100 m²
    expect(trees(1000, 'inst_education').trees).toBe(13);   // 125 per hectare
    expect(trees(10_000, 'res_group_housing').trees).toBe(50); // 50 per hectare
  });

  it('marks the office rate as an analogy, because Clause 13.7 names no such category', () => {
    expect(trees(1000, 'office').caveats.join(' ')).toMatch(/by analogy/);
  });

  it('takes the Category-A condition where it is the larger rate', () => {
    // 1 ha of group housing: 50 trees under 13.7(a)(v), 125 under the environmental
    // condition of one tree per 80 m² — which binds from 5,000 m² of built-up area.
    const under = trees(10_000, 'res_group_housing', 4000);
    const over = trees(10_000, 'res_group_housing', 12_000);
    expect(under.trees).toBe(50);
    expect(over.trees).toBe(125);
    expect(over.basis).toBe('category_condition');
    expect(over.caveats.join(' ')).toMatch(/The larger governs/);
  });

  it('produces a count and a working for every occupancy', () => {
    for (const id of OCCUPANCY_IDS) {
      const t = trees(800, id);
      expect(t.trees, id).toBeGreaterThan(0);
      expect(t.working, id).toMatch(/\d/);
      expect(t.clause, id).toMatch(/^Clause 13\.7/);
    }
  });
});

describe('the environmental condition categories', () => {
  it('places a project on an overlapping boundary in the higher band', () => {
    // 20,000 m² is printed inside both Category-A and Category-B; 50,000 inside both B
    // and C. The higher band carries more obligations (V-043).
    expect(classifyEnvironmental(4999)).toBeNull();
    expect(classifyEnvironmental(5000)).toBe('A');
    expect(classifyEnvironmental(20_000)).toBe('B');
    expect(classifyEnvironmental(50_000)).toBe('C');
  });

  it('keeps Category-D strictly above 150,000 m², as printed', () => {
    expect(classifyEnvironmental(150_000)).toBe('C');
    expect(classifyEnvironmental(150_001)).toBe('D');
  });

  it('lets Category-D inherit everything Category-C carries', () => {
    const c = conditionsFor('C');
    const d = conditionsFor('D');
    expect(d.length).toBe(c.length);
    expect(conditionsFor('A').length).toBeLessThan(conditionsFor('B').length);
    expect(conditionsFor('B').length).toBeLessThan(c.length);
    expect(conditionsFor(null)).toHaveLength(0);
    for (const cond of conditionsFor('A')) expect(d).toContain(cond);
  });

  it('keys every condition to a clause of this chapter', () => {
    expect(ENVIRONMENTAL_CONDITIONS.length).toBeGreaterThan(10);
    for (const c of ENVIRONMENTAL_CONDITIONS) expect(c.clause).toMatch(/^Clause 13\./);
    expect(new Set(ENVIRONMENTAL_CONDITIONS.map((c) => c.topic)).size).toBe(8);
  });

  it('prints the bands as the gazette does', () => {
    expect(ENVIRONMENTAL_CATEGORY_BANDS.map((b) => b.category)).toEqual(['A', 'B', 'C', 'D']);
    expect(ENVIRONMENTAL_CATEGORY_BANDS[0].printed).toBe('Category-A (5000-20000 sqm)');
  });

  it('counts one recharge bore per 5,000 m² of built-up area, rounded up', () => {
    expect(assess({ builtUpAreaSqm: 6000 }).rechargeBores).toBe(2);
    expect(assess({ builtUpAreaSqm: 4999 }).rechargeBores).toBe(0);  // no category, no table
  });
});

describe('Clause 13.8 — Environment Clearance', () => {
  it('withholds development permission from 20,000 m² of built-up area', () => {
    expect(assess({ builtUpAreaSqm: 19_999 }).environmentClearance.required).toBe(false);
    expect(assess({ builtUpAreaSqm: 20_000 }).environmentClearance.required).toBe(true);
  });

  it('catches a large site whatever it builds, on the Category-D land limb', () => {
    expect(isTownshipBySiteArea(CATEGORY_D_SITE_AREA_HA * 10_000)).toBe(false);
    const big = assess({ plotAreaSqm: 600_000, builtUpAreaSqm: 3000 });
    expect(big.environmentClearance.required).toBe(true);
    expect(big.environmentClearance.because).toMatch(/50 ha limb/);
    // …and does not thereby acquire the built-up-area conditions of Category-C.
    expect(big.category).toBeNull();
    expect(big.conditions).toHaveLength(0);
  });

  it('names the phasing rule, which is about the first phase and not the crossing one', () => {
    expect(assess({ builtUpAreaSqm: 30_000 }).environmentClearance.caveats.join(' '))
      .toMatch(/before the first phase is approved/);
  });
});

describe('what Chapter 13 turns on that the project model cannot see', () => {
  it('reports the ECBC load and the wastewater discharge rather than guessing them', () => {
    const u = assess({ builtUpAreaSqm: 30_000 }).unresolved.join(' ');
    expect(u).toMatch(/connected load/);
    expect(u).toMatch(/10,000 litres per day/);
  });

  it('reports the layout reservoir trigger on a scheme over 4 hectares', () => {
    expect(assess({ plotAreaSqm: 50_000 }).unresolved.join(' ')).toMatch(/reservoirs/);
    expect(assess({ plotAreaSqm: 30_000 }).unresolved.join(' ')).not.toMatch(/reservoirs/);
  });
});

describe('the findings the engine produces', () => {
  it('blocks on a missing rainwater system at exactly 300 m²', () => {
    const f = assessProject(project({ plotArea: 300, hasRWH: false })).findings
      .find((x) => x.id === 'rwh');
    expect(f?.status).toBe('blocked');
    expect(f?.fix?.patch).toEqual({ hasRWH: true });
  });

  it('offers photovoltaics, not water heating, as the fix on a large plot', () => {
    const findings = assessProject(project({ plotArea: 900, occupancy: 'res_single' })).findings;
    const pv = findings.find((f) => f.id === 'solar-pv');
    expect(pv?.status).toBe('attention');
    expect(pv?.fix?.patch).toEqual({ hasSolarPv: true });
    expect(findings.find((f) => f.id === 'solar-water')).toBeUndefined();
  });

  it('asks a small hotel for solar water heating', () => {
    const f = assessProject(project({ occupancy: 'com_hotel', plotArea: 300, roadWidth: 12 }))
      .findings.find((x) => x.id === 'solar-water');
    expect(f?.status).toBe('attention');
    expect(f?.fix?.patch).toEqual({ hasSolarHeating: true });
  });

  it('never states the solar capacity the gazette does not contain', () => {
    // The finding used to read "at least 100 litres/day per 100 m² of built-up area",
    // which is in no clause of the byelaws. The only capacity Chapter 13 gives is the
    // Category-B condition of 2.5 litres per capita.
    for (const plotArea of [320, 600, 2000]) {
      const text = assessProject(project({ plotArea, occupancy: 'com_hotel', roadWidth: 12 }))
        .findings.map((f) => `${f.headline} ${f.detail} ${f.required ?? ''}`).join(' ');
      expect(text).not.toMatch(/100 litres/);
    }
  });

  it('raises the Environment Clearance as a procedure that cannot be bought off', () => {
    const f = assessProject(project({
      occupancy: 'com_mall', plotArea: 12_000, proposedBuiltUpArea: 60_000, roadWidth: 24,
    })).findings.find((x) => x.id === 'environment-clearance');
    expect(f?.topic).toBe('procedure');
    expect(f?.nonNegotiable).toBe(true);
    expect(f?.clause).toBe('Clause 13.8');
  });

  it('states the tree count on every project', () => {
    const f = assessProject(project()).findings.find((x) => x.id === 'trees');
    expect(f?.required).toBe('4 trees');
    expect(f?.working).toMatch(/301–500/);
  });

  it('says out loud what Chapter 13 turns on and the description cannot answer', () => {
    const f = assessProject(project()).findings.find((x) => x.id === 'services-open-questions');
    expect(f?.status).toBe('info');
    expect(f?.detail).toMatch(/connected load/);
    expect(f?.detail).toMatch(/10,000 litres per day/);
  });

  it('carries no environmental-conditions finding below 5,000 m² of built-up area', () => {
    const findings = assessProject(project()).findings;
    expect(findings.find((f) => f.id === 'environmental-conditions')).toBeUndefined();
    expect(findings.find((f) => f.id === 'solid-waste')).toBeDefined();
  });
});
