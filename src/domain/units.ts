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

export type AreaUnit = 'gaj' | 'biswa' | 'sqft' | 'sqm';

/** 1 gaj = 1 square yard = 9 sq ft exactly. Everything else is defined from these two. */
const SQM_PER_GAJ = 0.83612736;
const SQM_PER_SQFT = 0.09290304;

/**
 * A biswa is 151.25 gaj exactly, and unlike the bigha it means the same thing across
 * Uttar Pradesh — which is why it is the traditional unit this offers and the bigha is not.
 */
export const GAJ_PER_BISWA = 151.25;

/** Square metres in one of each unit. */
const SQM_PER: Readonly<Record<AreaUnit, number>> = {
  gaj: SQM_PER_GAJ,
  biswa: GAJ_PER_BISWA * SQM_PER_GAJ,
  sqft: SQM_PER_SQFT,
  sqm: 1,
};

export const UNIT_LABEL: Readonly<Record<AreaUnit, string>> = {
  gaj: 'gaj',
  biswa: 'biswa',
  sqft: 'sq ft',
  sqm: 'm²',
};

/** What to call the unit where there is room to be unambiguous. */
export const UNIT_LONG: Readonly<Record<AreaUnit, string>> = {
  gaj: 'gaj (square yards)',
  biswa: 'biswa',
  sqft: 'square feet',
  sqm: 'square metres',
};

export const AREA_UNITS: readonly AreaUnit[] = ['gaj', 'biswa', 'sqft', 'sqm'];

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
  return value === 'gaj' || value === 'biswa' || value === 'sqft' || value === 'sqm';
}

/**
 * The bigha, which this deliberately does not offer as a unit.
 *
 * Every other unit here is a fixed quantity. The bigha is not: within Uttar Pradesh alone
 * it runs from 5 biswa to 20, a spread of four to one, and which one a person means
 * depends on the district they are standing in and sometimes on whether the seller said
 * pucca or kachha. Putting "bigha" in the unit picker would have to pick one of those
 * silently, and a plot entered at a quarter or four times its true size produces a
 * confident, fully cited answer about a building that cannot be built.
 *
 * So a bigha figure is converted only once the reader has said which bigha they were
 * quoted, and the answer is a number of biswa — which does mean one thing statewide.
 *
 * These are not gazette figures. The byelaws are metric throughout and never mention the
 * bigha; this is trade usage, recorded so a reader is not left to guess.
 */
export interface BighaReckoning {
  readonly id: string;
  readonly biswaPerBigha: number;
  readonly label: string;
  /** Where this reckoning is the usual one, in the reader's own terms. */
  readonly where: string;
}

export const UP_BIGHA_RECKONINGS: readonly BighaReckoning[] = [
  {
    id: 'pucca20', biswaPerBigha: 20, label: '20 biswa',
    where: 'Eastern UP, Purvanchal and Lucknow — the pucca bigha, 27,225 sq ft',
  },
  {
    id: 'kachha20by3', biswaPerBigha: 20 / 3, label: '6⅔ biswa',
    where: 'some western districts — the kachha bigha, a third of the pucca, 9,075 sq ft',
  },
  {
    id: 'western5', biswaPerBigha: 5, label: '5 biswa',
    where: 'much of western UP — 6,806.25 sq ft',
  },
];

/** Square metres in a bigha under one reckoning. */
export function bighaToSqm(bigha: number, reckoning: BighaReckoning): number {
  return toSqm((Number(bigha) || 0) * reckoning.biswaPerBigha, 'biswa');
}
