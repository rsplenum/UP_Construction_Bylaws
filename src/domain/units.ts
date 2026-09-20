/**
 * The units a plot owner actually uses, and the one the byelaws are written in.
 *
 * Every figure in the gazette is metric, and so is every calculation in this engine. But
 * nobody in Uttar Pradesh describes their land in square metres. Plots are bought, sold,
 * inherited and argued over in **gaj** — the square yard — and quoted in square feet on
 * a broker's listing. "200 gaj" is a sentence a person says; "167.2 m²" is one they have
 * to work out first, and a conversion done in a hurry is where costly mistakes start.
 *
 * So the interface takes whichever unit the reader thinks in and converts once, here.
 * The engine never sees anything but square metres.
 */

export type AreaUnit = 'gaj' | 'sqft' | 'sqm';

/** Square metres in one of each unit. 1 gaj = 1 square yard = 9 sq ft exactly. */
const SQM_PER: Readonly<Record<AreaUnit, number>> = {
  gaj: 0.83612736,
  sqft: 0.09290304,
  sqm: 1,
};

export const UNIT_LABEL: Readonly<Record<AreaUnit, string>> = {
  gaj: 'gaj',
  sqft: 'sq ft',
  sqm: 'm²',
};

/** What to call the unit where there is room to be unambiguous. */
export const UNIT_LONG: Readonly<Record<AreaUnit, string>> = {
  gaj: 'gaj (square yards)',
  sqft: 'square feet',
  sqm: 'square metres',
};

export const AREA_UNITS: readonly AreaUnit[] = ['gaj', 'sqft', 'sqm'];

export function toSqm(value: number, unit: AreaUnit): number {
  return (Number(value) || 0) * SQM_PER[unit];
}

export function fromSqm(sqm: number, unit: AreaUnit): number {
  return (Number(sqm) || 0) / SQM_PER[unit];
}

/**
 * How precisely to show a figure in a given unit. A gaj is nine square feet, so a whole
 * number is precise enough to buy land by; square metres carry one decimal because the
 * byelaws' own thresholds sit at round metric figures and rounding can cross one.
 */
export function formatArea(sqm: number, unit: AreaUnit): string {
  const value = fromSqm(sqm, unit);
  // Metres keep a decimal below 1,000 because the byelaws' thresholds sit on round
  // figures there — 100, 200, 500 — and a plot of 500.4 m² shown as "500 m²" reads as
  // sitting exactly on the instant-approval ceiling when it is in fact over it. Above
  // 1,000 the nearest threshold is far enough away that the decimal is only noise.
  const dp = unit === 'sqm' && value < 1_000 ? 1 : 0;
  return `${value.toLocaleString('en-IN', { maximumFractionDigits: dp })} ${UNIT_LABEL[unit]}`;
}

/**
 * The same area in the reader's unit and in the byelaws', where both are worth showing —
 * a threshold is quoted in the gazette's metres but has to be recognisable in the
 * reader's gaj. Returns just one string when they picked metric.
 */
export function formatBoth(sqm: number, unit: AreaUnit): string {
  if (unit === 'sqm') return formatArea(sqm, 'sqm');
  return `${formatArea(sqm, unit)} (${formatArea(sqm, 'sqm')})`;
}

export function isAreaUnit(value: unknown): value is AreaUnit {
  return value === 'gaj' || value === 'sqft' || value === 'sqm';
}
