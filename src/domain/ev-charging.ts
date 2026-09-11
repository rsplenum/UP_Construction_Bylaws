/**
 * Chapter 17 — Provision of Electric Charging Infrastructure.
 *
 * Eleven pages, of which about eight reproduce the Ministry of Power's Guidelines of
 * 14 December 2018 verbatim as Annexure E-2: national rollout phasing, electricity tariffs,
 * nodal agencies, database protocols. None of that binds a building permit and none of it
 * is modelled here.
 *
 * Three things in the chapter do bind one, and all three are computable:
 *
 *   1. the EV share of parking capacity — 20%
 *   2. how many chargers, of which kind, serve that share — Clause 17.1.2.1
 *   3. the additional sanctioned power load the premises must carry, at a safety factor
 *      of 1.25 — Clause 17.1
 *
 * The engine previously had only the first, and applied it as though every EV needed its
 * own charging point. See B-042.
 */

/**
 * Clause 17.1: "charging infrastructures shall be provided only for EVs, which is currently
 * assumed to be 20% of all 'vehicle holding capacity'/'parking capacity' at the premise",
 * and Clause 17.1.2.1 Note (i): "Charging bays shall be planned currently at 20% capacity
 * of all vehicles including 2Ws and PVs(cars)".
 *
 * Clause 17.5.1 narrates a different pair of figures — 15% nationally, "say 20% for now" in
 * "the Metropolitan and 'Tier I' cities". That passage is a projection written about the
 * year 2020, not a requirement, and the two operative clauses both say 20% flatly. See
 * V-049.
 */
export const EV_SHARE_OF_PARKING = 0.20;

/**
 * Clause 17.1: "an additional power load, equivalent to the power required for all charging
 * points (in a PCS) to be operated simultaneously, with a safety factor of 1.25".
 */
export const POWER_LOAD_SAFETY_FACTOR = 1.25;

/** Clause 17.8.1(e) — the charger models a Public Charging Station must carry. */
export const CHARGER_SPECS: readonly {
  readonly speed: 'Fast' | 'Slow / Moderate';
  readonly model: string;
  readonly minKw: number;
  readonly ratedVoltage: string;
  readonly connectorGuns: number;
}[] = [
  { speed: 'Fast', model: 'CCS', minKw: 50, ratedVoltage: '200–1000 V', connectorGuns: 1 },
  { speed: 'Fast', model: 'CHAdeMO', minKw: 50, ratedVoltage: '200–1000 V', connectorGuns: 1 },
  { speed: 'Slow / Moderate', model: 'Type-2 AC', minKw: 22, ratedVoltage: '380–480 V', connectorGuns: 1 },
  { speed: 'Slow / Moderate', model: 'Bharat DC-001', minKw: 15, ratedVoltage: '72–200 V', connectorGuns: 1 },
  { speed: 'Slow / Moderate', model: 'Bharat AC-001', minKw: 10, ratedVoltage: '230 V', connectorGuns: 3 },
];

/** The smallest slow and fast chargers the schedule admits, for the load calculation. */
export const MIN_SLOW_CHARGER_KW = 10;
export const MIN_FAST_CHARGER_KW = 50;

export type VehicleClass = '4W' | '3W' | '2W' | 'bus';

/**
 * Clause 17.1.2.1, "Norms of Provisions for charging points". One charger serves several
 * EVs — which is the distinction B-042 turned on.
 */
export const PCS_CHARGER_RATIOS: Readonly<Record<VehicleClass, {
  readonly label: string;
  readonly evsPerSlowCharger: number | null;
  readonly evsPerFastCharger: number | null;
}>> = {
  '4W': { label: 'Four wheelers / cars', evsPerSlowCharger: 3, evsPerFastCharger: 10 },
  '3W': { label: 'Three wheelers', evsPerSlowCharger: 2, evsPerFastCharger: null },
  '2W': { label: 'Two wheelers', evsPerSlowCharger: 2, evsPerFastCharger: null },
  'bus': { label: 'Passenger vehicles (buses)', evsPerSlowCharger: null, evsPerFastCharger: 10 },
};

/** Clause 17.1.1.1 — a plotted house, which is a Private CI and not a PCS. */
export const PLOTTED_HOUSE_PROVISION = {
  minimumSlowChargers: 1,
  ownership: 'Private (owner)',
  metering: 'Domestic meter',
  charger: "Slow charger as per the owner's own requirements, AC single charging gun",
  note: 'Installed by a homeowner it is a Private Charging Infrastructure for self-use on a '
    + 'non-commercial basis, so the minimum Public Charging Station requirements do not apply '
    + '(Clause 17.6 Note 1, Clause 17.8 para 4).',
} as const;

/** Clause 17.1.2.2 and 17.8.2 — space and spacing, from the URDPFI guidelines. */
export const EV_SPACE_NORMS: readonly { readonly facility: string; readonly spacing: string; readonly area: string }[] = [
  { facility: 'Public Charging Station', spacing: 'At least one in every 3 km × 3 km grid within an urban area, and one every 25 km on both sides of a highway', area: 'Additional area as per the total parking capacity at the premises' },
  { facility: 'Fast Charging facility / FCB CS (long distance and heavy duty)', spacing: 'Every 100 km, on both sides of the highway', area: 'Minimum 15 m × 7 m' },
  { facility: 'Battery Swapping Station', spacing: 'Optional, per the MoP Guidelines; may be coupled with a PCS or FCB CS', area: 'Minimum 5.5 m × 2.75 m' },
];

export interface EvChargingAssessment {
  /** Car bays the parking rule requires. */
  readonly parkingBays: number;
  /** Bays that must be laid out as charging bays — 20% of capacity. */
  readonly chargingBays: number;
  /** Slow chargers, at one per three EVs for cars. */
  readonly slowChargers: number;
  /** Fast chargers, at one per ten EVs for cars. */
  readonly fastChargers: number;
  /** kW that must be sanctioned on top of the building load, safety factor applied. */
  readonly additionalLoadKw: number;
  readonly isPrivateSelfUse: boolean;
  readonly working: string;
  readonly caveats: readonly string[];
  readonly clauseRef: string;
}

const ceil = (n: number) => Math.ceil(Math.max(0, n) - 1e-9);

export function assessEvCharging(input: {
  /** Car spaces required by the parking standard. */
  parkingBays: number;
  /** A single plotted house is a Private CI under Clause 17.1.1, not a PCS. */
  isPlottedHouse: boolean;
}): EvChargingAssessment {
  const bays = Math.max(0, Math.floor(Number(input.parkingBays) || 0));
  const caveats: string[] = [];

  if (input.isPlottedHouse) {
    const kw = PLOTTED_HOUSE_PROVISION.minimumSlowChargers * MIN_SLOW_CHARGER_KW * POWER_LOAD_SAFETY_FACTOR;
    return {
      parkingBays: bays,
      chargingBays: PLOTTED_HOUSE_PROVISION.minimumSlowChargers,
      slowChargers: PLOTTED_HOUSE_PROVISION.minimumSlowChargers,
      fastChargers: 0,
      additionalLoadKw: Math.round(kw * 10) / 10,
      isPrivateSelfUse: true,
      working: `Clause 17.1.1.1: minimum one slow charger, owner's choice of model, on the domestic meter.`,
      caveats: [PLOTTED_HOUSE_PROVISION.note],
      clauseRef: 'Clause 17.1.1 (plotted house — Private Charging Infrastructure)',
    };
  }

  // Clause 17.1 sets the EV share; 17.1.2.1 sets how many chargers serve it. These are two
  // different quantities, and conflating them was B-042.
  const evs = bays * EV_SHARE_OF_PARKING;
  const ratios = PCS_CHARGER_RATIOS['4W'];
  const slow = ratios.evsPerSlowCharger ? ceil(evs / ratios.evsPerSlowCharger) : 0;
  const fast = ratios.evsPerFastCharger ? ceil(evs / ratios.evsPerFastCharger) : 0;
  const load = (slow * MIN_SLOW_CHARGER_KW + fast * MIN_FAST_CHARGER_KW) * POWER_LOAD_SAFETY_FACTOR;

  caveats.push(
    'The load figure uses the smallest chargers Clause 17.8 admits — 10 kW slow, 50 kW fast. '
    + 'A Type-2 AC at 22 kW or a CCS above 50 kW raises it proportionately, so this is a floor '
    + 'on the sanctioned load, not the figure for any particular specification.',
  );
  caveats.push(
    'Clause 17.1.2.1 Note (i) plans charging bays at 20% of the capacity of ALL vehicles '
    + '"including 2Ws and PVs(cars)", and states separate ratios for two- and three-wheelers. '
    + 'The parking standard the engine applies is expressed in car-equivalent spaces only, so '
    + 'the two- and three-wheeler limbs cannot be computed (V-050).',
  );

  return {
    parkingBays: bays,
    chargingBays: ceil(evs),
    slowChargers: slow,
    fastChargers: fast,
    additionalLoadKw: Math.round(load * 10) / 10,
    isPrivateSelfUse: false,
    working: `${bays} bays × ${EV_SHARE_OF_PARKING * 100}% = ${ceil(evs)} EVs → `
      + `${slow} slow (1 per ${ratios.evsPerSlowCharger}) + ${fast} fast (1 per ${ratios.evsPerFastCharger}); `
      + `(${slow}×${MIN_SLOW_CHARGER_KW} + ${fast}×${MIN_FAST_CHARGER_KW}) kW × ${POWER_LOAD_SAFETY_FACTOR} `
      + `= ${Math.round(load * 10) / 10} kW`,
    caveats,
    clauseRef: 'Clause 17.1 (EV share and power load), 17.1.2.1 (charger ratios)',
  };
}
