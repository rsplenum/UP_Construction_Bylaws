import { describe, expect, it } from 'vitest';
import { OCCUPANCIES, forArea } from '../occupancy';
import {
  THRESHOLD_TABLES,
  facilities,
  strictestThreshold,
  thresholdFor,
  type ThresholdValue,
} from '../thresholds';

describe('the threshold tables are loaded', () => {
  it('covers plot size and road width across chapters 5 and 6', () => {
    expect(THRESHOLD_TABLES.length).toBeGreaterThanOrEqual(10);
    const measures = new Set(THRESHOLD_TABLES.map((t) => t.measure));
    expect([...measures].sort()).toEqual(['minPlotAreaSqm', 'minRoadWidthM']);
  });

  /** Clause 6.1.2 and 6.1.3, the healthcare pair — the clearest case of the gap. */
  it('reads the five healthcare facilities with their own figures', () => {
    const plots = THRESHOLD_TABLES.find(
      (t) => t.gazettePage === 94 && t.measure === 'minPlotAreaSqm')!;
    expect(plots.rows.map((r) => r.value)).toEqual([
      100, 300, 3000, 2000, { defersTo: 'As per NMC / MCI norms' },
    ]);
    const roads = THRESHOLD_TABLES.find(
      (t) => t.gazettePage === 94 && t.measure === 'minRoadWidthM')!;
    expect(roads.rows.map((r) => r.value)).toEqual([9, 12, 18, 18, 24]);
  });

  /** Clause 6.2.3 — one facility whose road minimum depends on the area type. */
  it('keeps the primary-school road split by area type', () => {
    const roads = THRESHOLD_TABLES.find(
      (t) => t.gazettePage === 96 && t.measure === 'minRoadWidthM')!;
    const primary = roads.rows.find((r) => r.subject.startsWith('Primary'))!;
    expect(primary.value).toEqual({ built_up: 9, non_built_up: 12 });
  });

  /** Clauses 6.3.3 and 6.4.2 invert the keying. */
  it('keeps the two inverted tables as printed', () => {
    const byPlot = THRESHOLD_TABLES.find((t) => t.keyedOn === 'plotAreaSqm')!;
    expect(byPlot.gazettePage).toBe(98);
    expect(byPlot.measure).toBe('minRoadWidthM');   // road width, keyed on plot size
    const byRoad = THRESHOLD_TABLES.find((t) => t.keyedOn === 'roadWidthM')!;
    expect(byRoad.gazettePage).toBe(99);
    expect(byRoad.measure).toBe('minPlotAreaSqm');  // plot size, keyed on road width
  });
});

describe('reading a threshold value', () => {
  const cases: [ThresholdValue, number | null, number | null][] = [
    [300, 300, 300],
    [{ built_up: 9, non_built_up: 12 }, 12, 9],
    [{ from: 10, to: 100 }, 10, 10],
    [{ from: 3000, to: null }, 3000, 3000],
    [{ defersTo: 'As per NMC / MCI norms' }, null, null],
  ];
  it.each(cases)('%j → strictest %s, built-up %s', (value, strictest, builtUp) => {
    expect(strictestThreshold(value)).toBe(strictest);
    expect(thresholdFor(value, 'built_up')).toBe(builtUp);
  });

  it('takes the larger of the two area-type figures as the strictest', () => {
    expect(strictestThreshold({ built_up: 9, non_built_up: 12 })).toBe(12);
    expect(thresholdFor({ built_up: 9, non_built_up: 12 }, 'non_built_up')).toBe(12);
  });
});

describe('V-005 — what one figure per occupancy costs', () => {
  it('names more facilities than the engine has institutional occupancies', () => {
    const named = facilities();
    expect(named.length).toBeGreaterThanOrEqual(14);
    const institutional = Object.values(OCCUPANCIES).filter((o) => o.group === 'Institutional');
    expect(institutional).toHaveLength(3);
  });

  /**
   * The engine's hospital occupancy holds 500 m² and 12 m. Clause 6.1.2 and 6.1.3 name
   * five healthcare facilities and not one of them carries that pair.
   */
  it('holds a hospital figure that matches no facility the gazette names', () => {
    const health = OCCUPANCIES.inst_health;
    const plot = forArea(health.minPlotAreaSqm, 'built_up');
    const road = forArea(health.minRoadWidthM, 'built_up');
    expect([plot, road]).toEqual([500, 12]);

    const healthcare = facilities().filter((f) => f.gazettePage === 94);
    expect(healthcare).toHaveLength(5);
    const pairs = healthcare.map((f) => [
      f.minPlotAreaSqm ? strictestThreshold(f.minPlotAreaSqm) : null,
      f.minRoadWidthM ? strictestThreshold(f.minRoadWidthM) : null,
    ]);
    expect(pairs).not.toContainEqual([plot, road]);
    // It is not even between the same two rows: 500 m² sits between the 300 and 2,000 m²
    // facilities, while 12 m is the figure for the 300 m² one.
    expect(pairs).toContainEqual([300, 12]);
    expect(pairs).toContainEqual([3000, 18]);
  });

  it('holds a school figure that matches only one of five education facilities', () => {
    const education = OCCUPANCIES.inst_education;
    expect(forArea(education.minPlotAreaSqm, 'built_up')).toBe(1000);
    const named = facilities().filter((f) => f.gazettePage === 96);
    expect(named).toHaveLength(5);
    const plots = named.map((f) => f.minPlotAreaSqm && strictestThreshold(f.minPlotAreaSqm));
    expect(plots).toEqual([500, 1000, 2000, 5000, 20000]);
  });
});

describe('Clause 6.3.2 — the marriage-hall plot minimum, now split by area type', () => {
  it('is 750 m² built-up and 1000 m² in a new layout', () => {
    const assembly = OCCUPANCIES.inst_assembly;
    expect(forArea(assembly.minPlotAreaSqm, 'built_up')).toBe(750);
    expect(forArea(assembly.minPlotAreaSqm, 'non_built_up')).toBe(1000);
  });

  it('still holds the lower of the two road minimums, which depend on plot size', () => {
    // Clause 6.3.3: 18 m up to a 3000 m² plot, 24 m above it. The occupancy cannot
    // express that, so it holds 18 — see V-019.
    expect(forArea(OCCUPANCIES.inst_assembly.minRoadWidthM, 'built_up')).toBe(18);
    const table = THRESHOLD_TABLES.find((t) => t.gazettePage === 98)!;
    expect(table.rows.map((r) => r.value)).toEqual([18, 24]);
  });
});
