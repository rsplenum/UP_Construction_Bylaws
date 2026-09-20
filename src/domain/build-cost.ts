/**
 * What the building would cost to put up — which is not a byelaws question at all.
 *
 * "331 m² across 3 floors" is an abstraction. "331 m², around ₹64 lakh to build" is a
 * decision, and it is the number that tells a reader whether the entitlement they have
 * just been shown is of any use to them. A plot owner who learns they may build 331 m²
 * and cannot afford 331 m² has learned the more important thing.
 *
 * Everything in this file is ORDINARY MARKET INFORMATION AND NOT LAW. The byelaws price
 * sanctions, compounding and purchasable FAR; they say nothing whatever about what a
 * contractor charges. So no figure here may ever be rendered in the same register as a
 * gazette figure, and every one of them carries its source and the year it was current.
 * `SOURCE_NOTE` exists so a caller cannot show the money without showing the provenance.
 *
 * These are survey ranges collected in September 2026 from Indian construction-cost
 * trackers (NoBroker, Infralens, IndiaLandConverter). They move with steel, cement and
 * labour, they vary by more than the spread below between one contractor and the next,
 * and they are offered to set expectations, not to budget from.
 */

export type BuildQuality = 'basic' | 'standard' | 'premium';

export interface CostRate {
  readonly id: string;
  readonly label: string;
  /** Rupees per square foot of built-up area, at standard quality. */
  readonly standardPerSqft: number;
  readonly note: string;
}

/**
 * Multipliers off the standard rate. The published ranges run roughly ₹1,400–2,100 per
 * square foot for standard work, with premium finishes carrying it far higher; these
 * bracket that spread rather than pretending to a precision the sources do not have.
 */
export const QUALITY_FACTOR: Readonly<Record<BuildQuality, number>> = {
  basic: 0.78,
  standard: 1,
  premium: 1.45,
};

export const QUALITY_LABEL: Readonly<Record<BuildQuality, string>> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium finishes',
};

export const COST_RATES: readonly CostRate[] = [
  {
    id: 'up', label: 'Uttar Pradesh, typical', standardPerSqft: 1_800,
    note: 'The statewide baseline for turnkey residential work.',
  },
  {
    id: 'lucknow', label: 'Lucknow', standardPerSqft: 1_800,
    note: 'Reported between ₹1,550 and ₹2,048 per sq ft; the midpoint is used.',
  },
  {
    id: 'noida', label: 'Noida / Greater Noida', standardPerSqft: 2_300,
    note: 'Western UP runs higher on labour for its proximity to Delhi.',
  },
];

export const SOURCE_NOTE =
  'Market rates collected September 2026 from Indian construction-cost trackers. These '
  + 'are not byelaws figures — the gazette prices sanctions and compounding, and says '
  + 'nothing about what a contractor charges. Treat them as a sense of scale, not a budget.';

const SQFT_PER_SQM = 10.763910416709722;

export interface BuildCost {
  readonly rate: CostRate;
  readonly quality: BuildQuality;
  /** Rupees per square foot actually applied, after the quality factor. */
  readonly perSqft: number;
  readonly totalRupees: number;
  /** Always carried with the money, so it cannot be shown bare. */
  readonly sourceNote: string;
}

export function estimateBuildCost(input: {
  floorAreaSqm: number;
  rate: CostRate;
  quality: BuildQuality;
}): BuildCost {
  const perSqft = input.rate.standardPerSqft * QUALITY_FACTOR[input.quality];
  const sqft = Math.max(0, Number(input.floorAreaSqm) || 0) * SQFT_PER_SQM;
  return {
    rate: input.rate,
    quality: input.quality,
    perSqft: Math.round(perSqft),
    totalRupees: Math.round(perSqft * sqft),
    sourceNote: SOURCE_NOTE,
  };
}

export function getRate(id: string): CostRate {
  return COST_RATES.find((r) => r.id === id) ?? COST_RATES[0];
}
